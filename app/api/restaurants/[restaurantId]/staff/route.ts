import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/src/lib/db';

import {
  hashPassword,
  requireRestaurantAccess,
} from '@/src/lib/auth';

import { errorResponse } from '@/src/lib/api-response';

const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120),

  email: z
    .string()
    .trim()
    .email('Invalid email')
    .max(200),

  password: z
    .string()
    .min(
      10,
      'Password must contain at least 10 characters'
    )
    .max(200),

  staffPortal: z
    .enum(['WAITER', 'KITCHEN'])
    .default('WAITER'),
});

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: { restaurantId: string };
  }
) {
  try {
    const access =
      await requireRestaurantAccess(
        params.restaurantId,
        'MANAGER'
      );

    if (!access.ok) {
      return NextResponse.json(
        {
          error: access.message,
        },
        {
          status: access.status,
        }
      );
    }

    const staff =
      await db.restaurantStaff.findMany({
        where: {
          restaurantId:
            params.restaurantId,
          role: 'STAFF',
        },

        select: {
          id: true,
          role: true,
          staffPortal: true,
          isActive: true,
          deletedAt: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          TableAssignment_TableAssignment_staffIdToRestaurantStaff:
            {
              where: {
                endedAt: null,
              },

              orderBy: {
                assignedAt: 'asc',
              },

              select: {
                id: true,
                tableId: true,
                role: true,
                assignedAt: true,
                endedAt: true,

                Table: {
                  select: {
                    id: true,
                    label: true,
                    isActive: true,
                  },
                },
              },
            },
        },

        orderBy: [
          {
            isActive: 'desc',
          },
          {
            user: {
              name: 'asc',
            },
          },
        ],
      });

    return NextResponse.json(
      staff.map((member) => ({
        id: member.id,
        role: member.role,
        staffPortal:
          member.staffPortal,
        isActive:
          member.isActive,
        deletedAt:
          member.deletedAt,
        createdAt:
          member.createdAt,

        user: member.user,

        assignments:
          member
            .TableAssignment_TableAssignment_staffIdToRestaurantStaff
            .map(
              (assignment) => ({
                id: assignment.id,
                tableId:
                  assignment.tableId,
                role:
                  assignment.role,
                assignedAt:
                  assignment.assignedAt,
                endedAt:
                  assignment.endedAt,
                table:
                  assignment.Table,
              })
            ),
      }))
    );
  } catch (err) {
    console.error(
      'GET /api/restaurants/[restaurantId]/staff error:',
      err
    );

    return errorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: { restaurantId: string };
  }
) {
  try {
    const access =
      await requireRestaurantAccess(
        params.restaurantId,
        'MANAGER'
      );

    if (!access.ok) {
      return NextResponse.json(
        {
          error: access.message,
        },
        {
          status: access.status,
        }
      );
    }

    const body =
      createSchema.parse(
        await req.json()
      );

    const email =
      body.email
        .trim()
        .toLowerCase();

    const existingUser =
      await db.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            'A user with that email already exists. Use a different email.',
        },
        {
          status: 409,
        }
      );
    }

    const restaurant =
      await db.restaurant.findUnique({
        where: {
          id: params.restaurantId,
        },
        select: {
          id: true,
          isActive: true,
        },
      });

    if (!restaurant) {
      return NextResponse.json(
        {
          error:
            'Restaurant not found.',
        },
        {
          status: 404,
        }
      );
    }

    if (!restaurant.isActive) {
      return NextResponse.json(
        {
          error:
            'This restaurant is currently inactive.',
        },
        {
          status: 403,
        }
      );
    }

    const result =
      await db.$transaction(
        async (tx) => {
          const user =
            await tx.user.create({
              data: {
                name:
                  body.name.trim(),

                email,

                passwordHash:
                  await hashPassword(
                    body.password
                  ),
              },

              select: {
                id: true,
                name: true,
                email: true,
              },
            });

          const membership =
            await tx.restaurantStaff.create({
              data: {
                userId:
                  user.id,

                restaurantId:
                  params.restaurantId,

                role: 'STAFF',

                staffPortal:
                  body.staffPortal,

                isActive: true,

                deletedAt:
                  null,
              },

              select: {
                id: true,
                role: true,
                staffPortal: true,
                isActive: true,
                deletedAt: true,
                createdAt: true,
              },
            });

          return {
            user,
            membership,
          };
        }
      );

    return NextResponse.json(
      result,
      {
        status: 201,
      }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            err.errors
              .map(
                (issue) =>
                  `${issue.path.join('.') || 'field'}: ${issue.message}`
              )
              .join(', '),

          issues:
            err.errors,
        },
        {
          status: 400,
        }
      );
    }

    console.error(
      'POST /api/restaurants/[restaurantId]/staff error:',
      err
    );

    return errorResponse(err);
  }
}

/**
 * DELETE
 *
 * First step:
 *   permanent=false
 *   Archive the account.
 *
 * Second step:
 *   permanent=true
 *   Permanently remove the account.
 *
 * Historical orders are preserved.
 */
export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: { restaurantId: string };
  }
) {
  try {
    const access =
      await requireRestaurantAccess(
        params.restaurantId,
        'MANAGER'
      );

    if (!access.ok) {
      return NextResponse.json(
        {
          error: access.message,
        },
        {
          status: access.status,
        }
      );
    }

    const url =
      new URL(req.url);

    const staffId =
      url.searchParams.get(
        'staffId'
      );

    const permanent =
      url.searchParams.get(
        'permanent'
      ) === 'true';

    if (!staffId) {
      return NextResponse.json(
        {
          error:
            'staffId is required.',
        },
        {
          status: 400,
        }
      );
    }

    const membership =
      await db.restaurantStaff.findFirst({
        where: {
          id: staffId,

          restaurantId:
            params.restaurantId,

          role: 'STAFF',
        },

        select: {
          id: true,
          userId: true,
          isActive: true,
          deletedAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    if (!membership) {
      return NextResponse.json(
        {
          error:
            'Staff account not found.',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * STEP 1
     *
     * Archive.
     */
    if (!permanent) {
      if (!membership.isActive) {
        return NextResponse.json(
          {
            error:
              'This account is already archived.',
          },
          {
            status: 409,
          }
        );
      }

      await db.$transaction(
        async (tx) => {
          /*
           * Close all active table assignments.
           * The history of the assignments remains.
           */
          await tx.tableAssignment.updateMany({
            where: {
              staffId:
                membership.id,

              endedAt: null,
            },

            data: {
              endedAt:
                new Date(),
            },
          });

          await tx.restaurantStaff.update({
            where: {
              id:
                membership.id,
            },

            data: {
              isActive:
                false,

              deletedAt:
                new Date(),
            },
          });
        }
      );

      return NextResponse.json({
        ok: true,

        action: 'ARCHIVED',

        staffId:
          membership.id,

        message:
          'Staff account archived successfully.',
      });
    }

    /*
     * STEP 2
     *
     * Permanent deletion requires the account
     * to already be archived.
     */
    if (membership.isActive) {
      return NextResponse.json(
        {
          error:
            'Archive the account first before permanently deleting it.',
        },
        {
          status: 409,
        }
      );
    }

    await db.$transaction(
      async (tx) => {
        /*
         * 1. End any remaining table assignments.
         */
        await tx.tableAssignment.updateMany({
          where: {
            staffId:
              membership.id,

            endedAt: null,
          },

          data: {
            endedAt:
              new Date(),
          },
        });

        /*
         * 2. Historical orders must stay in the database.
         *
         * We therefore remove the staff reference
         * instead of deleting the order itself.
         */
        await tx.order.updateMany({
          where: {
            staffId:
              membership.id,
          },

          data: {
            staffId:
              null,
          },
        });

        /*
         * 3. TableAssignment has two references to
         * RestaurantStaff:
         *
         * - staffId
         * - assignedBy
         *
         * Remove the assignment records only after
         * order history has been detached.
         */
        await tx.tableAssignment.deleteMany({
          where: {
            OR: [
              {
                staffId:
                  membership.id,
              },
              {
                assignedBy:
                  membership.id,
              },
            ],
          },
        });

        /*
         * 4. Remove the RestaurantStaff membership.
         */
        await tx.restaurantStaff.delete({
          where: {
            id:
              membership.id,
          },
        });

        /*
         * 5. Delete the User only if this User no
         * longer belongs to another restaurant.
         *
         * OrderEvent.actorUserId is nullable, so
         * historical event records can remain.
         */
        const remainingMemberships =
          await tx.restaurantStaff.count({
            where: {
              userId:
                membership.userId,
            },
          });

        if (
          remainingMemberships ===
          0
        ) {
          await tx.user.delete({
            where: {
              id:
                membership.userId,
            },
          });
        }
      }
    );

    return NextResponse.json({
      ok: true,

      action:
        'PERMANENTLY_DELETED',

      staffId:
        membership.id,

      message:
        'Staff account permanently deleted. Historical orders were preserved.',
    });
  } catch (err) {
    console.error(
      'DELETE /api/restaurants/[restaurantId]/staff error:',
      err
    );

    return errorResponse(err);
  }
}