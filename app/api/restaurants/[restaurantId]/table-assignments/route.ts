import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';

const schema = z.object({
  tableId: z.string().min(1),
  staffId: z.string().min(1).optional(),
  role: z.enum(['PRIMARY', 'ASSISTING']).default('PRIMARY'),
});

type Context = {
  params: {
    restaurantId: string;
  };
};

async function getMembership(
  restaurantId: string,
  userId: string
) {
  return db.restaurantStaff.findUnique({
    where: {
      userId_restaurantId: {
        userId,
        restaurantId,
      },
    },
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: Context
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'STAFF'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    let where: any = {
      restaurantId: params.restaurantId,
      endedAt: null,
    };

    const mine = _req.nextUrl.searchParams.get('mine') === '1';

    if (access.role === 'STAFF' || mine) {
      const membership = await getMembership(
        params.restaurantId,
        access.user.id
      );

      if (!membership) {
        return NextResponse.json(
          { error: 'Staff membership not found' },
          { status: 403 }
        );
      }

      where = {
        ...where,
        staffId: membership.id,
      };
    }

    const assignments = await db.tableAssignment.findMany({
      where,
      orderBy: { assignedAt: 'asc' },
      select: {
        id: true,
        tableId: true,
        staffId: true,
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
        RestaurantStaff_TableAssignment_staffIdToRestaurantStaff: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      assignments.map((assignment) => ({
        id: assignment.id,
        tableId: assignment.tableId,
        staffId: assignment.staffId,
        role: assignment.role,
        assignedAt: assignment.assignedAt,
        endedAt: assignment.endedAt,
        table: assignment.Table,
        staff:
          assignment.RestaurantStaff_TableAssignment_staffIdToRestaurantStaff,
      }))
    );
  } catch (err) {
    console.error('Table assignments GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: Context
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'STAFF'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const body = schema.parse(await req.json());
    const callerMembership = await getMembership(
      params.restaurantId,
      access.user.id
    );

    if (!callerMembership) {
      return NextResponse.json(
        { error: 'Restaurant membership not found' },
        { status: 403 }
      );
    }

    // Staff can only assign themselves, and only as PRIMARY.
    if (access.role === 'STAFF') {
      if (body.role !== 'PRIMARY') {
        return NextResponse.json(
          { error: 'Staff can only self-assign as PRIMARY' },
          { status: 403 }
        );
      }

      if (body.staffId && body.staffId !== callerMembership.id) {
        return NextResponse.json(
          { error: 'Staff can only assign themselves' },
          { status: 403 }
        );
      }
    }

    const targetStaffId = body.staffId ?? callerMembership.id;

    const result = await db.$transaction(async (tx) => {
      const table = await tx.table.findFirst({
        where: {
          id: body.tableId,
          restaurantId: params.restaurantId,
          isActive: true,
        },
        select: {
          id: true,
          label: true,
        },
      });

      if (!table) {
        throw new Error('TABLE_NOT_FOUND');
      }

      const staff = await tx.restaurantStaff.findFirst({
        where: {
          id: targetStaffId,
          restaurantId: params.restaurantId,
          role: { in: ['OWNER', 'MANAGER', 'STAFF'] },
        },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!staff) {
        throw new Error('STAFF_NOT_FOUND');
      }

      const now = new Date();

      // A regular waiter may only take a completely unassigned primary table.
      if (access.role === 'STAFF' && body.role === 'PRIMARY') {
        const existingPrimary =
          await tx.tableAssignment.findFirst({
            where: {
              restaurantId: params.restaurantId,
              tableId: body.tableId,
              role: 'PRIMARY',
              endedAt: null,
            },
            select: {
              id: true,
              staffId: true,
            },
          });

        if (
          existingPrimary &&
          existingPrimary.staffId !== targetStaffId
        ) {
          throw new Error('TABLE_ALREADY_ASSIGNED');
        }

        if (
          existingPrimary &&
          existingPrimary.staffId === targetStaffId
        ) {
          return {
            assignment: await tx.tableAssignment.findUniqueOrThrow({
              where: { id: existingPrimary.id },
              select: {
                id: true,
                tableId: true,
                staffId: true,
                role: true,
                assignedAt: true,
                endedAt: true,
              },
            }),
            table,
            staff,
            alreadyAssigned: true,
          };
        }
      }

      if (body.role === 'PRIMARY') {
        await tx.tableAssignment.updateMany({
          where: {
            restaurantId: params.restaurantId,
            tableId: body.tableId,
            role: 'PRIMARY',
            endedAt: null,
          },
          data: { endedAt: now },
        });
      }

      const assignment = await tx.tableAssignment.create({
        data: {
          restaurantId: params.restaurantId,
          tableId: body.tableId,
          staffId: targetStaffId,
          role: body.role,
          assignedAt: now,
          assignedBy: callerMembership.id,
        },
        select: {
          id: true,
          tableId: true,
          staffId: true,
          role: true,
          assignedAt: true,
          endedAt: true,
        },
      });

      return {
        assignment,
        table,
        staff,
        alreadyAssigned: false,
      };
    });

    return NextResponse.json(result, {
      status: result.alreadyAssigned ? 200 : 201,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          issues: err.errors,
        },
        { status: 400 }
      );
    }

    if (
      err instanceof Error &&
      err.message === 'TABLE_NOT_FOUND'
    ) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    if (
      err instanceof Error &&
      err.message === 'STAFF_NOT_FOUND'
    ) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    if (
      err instanceof Error &&
      err.message === 'TABLE_ALREADY_ASSIGNED'
    ) {
      return NextResponse.json(
        {
          error:
            'This table already has a primary staff member assigned. Ask the manager to reassign it.',
        },
        { status: 409 }
      );
    }

    console.error('Table assignments POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: Context
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'STAFF'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const assignmentId = req.nextUrl.searchParams.get(
      'assignmentId'
    );

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'assignmentId is required' },
        { status: 400 }
      );
    }

    const callerMembership = await getMembership(
      params.restaurantId,
      access.user.id
    );

    const assignment = await db.tableAssignment.findFirst({
      where: {
        id: assignmentId,
        restaurantId: params.restaurantId,
        endedAt: null,
      },
      select: {
        id: true,
        staffId: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Active assignment not found' },
        { status: 404 }
      );
    }

    if (
      access.role === 'STAFF' &&
      (!callerMembership ||
        assignment.staffId !== callerMembership.id)
    ) {
      return NextResponse.json(
        { error: 'You can only remove your own table assignments' },
        { status: 403 }
      );
    }

    const updated = await db.tableAssignment.update({
      where: { id: assignment.id },
      data: { endedAt: new Date() },
      select: {
        id: true,
        tableId: true,
        staffId: true,
        role: true,
        assignedAt: true,
        endedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Table assignments DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}