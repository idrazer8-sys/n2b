import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { z } from 'zod';

import { db } from '@/src/lib/db';

import {
  verifyPassword,
  createStaffSession,
} from '@/src/lib/auth';

import { errorResponse } from '@/src/lib/api-response';

import {
  rateLimit,
  clientIp,
} from '@/src/lib/rate-limit';

const schema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(200),

  password: z
    .string()
    .min(1)
    .max(200),

  portal: z
    .enum([
      'AUTO',
      'MANAGER',
      'WAITER',
      'KITCHEN',
    ])
    .default('AUTO'),

  restaurantId: z
    .string()
    .min(1)
    .max(100)
    .optional(),
});

export async function POST(
  req: NextRequest
) {
  try {
    const ip =
      clientIp(req.headers);

    const ipLimit =
      await rateLimit(
        `login-ip:${ip}`,
        20,
        15 * 60 * 1000
      );

    if (!ipLimit.ok) {
      return NextResponse.json(
        {
          error:
            'Too many login attempts. Please try again later.',
        },
        {
          status: 429,
        }
      );
    }

    const body =
      schema.parse(
        await req.json()
      );

    const email =
      body.email
        .trim()
        .toLowerCase();

    const emailLimit =
      await rateLimit(
        `login-email:${email}`,
        8,
        15 * 60 * 1000
      );

    if (!emailLimit.ok) {
      return NextResponse.json(
        {
          error:
            'Too many login attempts. Please try again later.',
        },
        {
          status: 429,
        }
      );
    }

    /*
     * Find the user first.
     */
    const user =
      await db.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error:
            'Invalid email or password.',
        },
        {
          status: 401,
        }
      );
    }

    const validPassword =
      await verifyPassword(
        body.password,
        user.passwordHash
      );

    if (!validPassword) {
      return NextResponse.json(
        {
          error:
            'Invalid email or password.',
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Load all restaurant memberships for
     * this user.
     */
    const memberships =
      await db.restaurantStaff.findMany({
        where: {
          userId:
            user.id,
        },

        select: {
          id: true,
          userId: true,
          restaurantId: true,
          role: true,
          staffPortal: true,
          isActive: true,
          deletedAt: true,

          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
            },
          },
        },

        orderBy: {
          createdAt: 'asc',
        },
      });

    /*
     * ============================================================
     * AUTO LOGIN
     *
     * / -> automatically decides the portal.
     *
     * Manager/Owner -> Manager
     * Staff Waiter  -> Waiter
     * Staff Kitchen -> Kitchen
     * ============================================================
     */
    if (
      body.portal ===
      'AUTO'
    ) {
      const manager =
        memberships.find(
          (membership) =>
            membership.isActive &&
            membership.restaurant.isActive &&
            (
              membership.role ===
                'OWNER' ||
              membership.role ===
                'MANAGER'
            )
        );

      if (manager) {
        await createStaffSession(
          user.id,
          'MANAGER'
        );

        return NextResponse.json({
          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          portal:
            'MANAGER',

          restaurantId:
            manager.restaurantId,

          staffId:
            manager.id,

          role:
            manager.role,
        });
      }

      const staff =
        memberships.find(
          (membership) =>
            membership.isActive &&
            membership.restaurant.isActive &&
            membership.role ===
              'STAFF'
        );

      if (!staff) {
        return NextResponse.json(
          {
            error:
              'This account has no active restaurant access.',
          },
          {
            status: 403,
          }
        );
      }

      await createStaffSession(
        user.id,
        staff.staffPortal
      );

      return NextResponse.json({
        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        portal:
          staff.staffPortal,

        restaurantId:
          staff.restaurantId,

        staffId:
          staff.id,

        role:
          staff.role,
      });
    }

    /*
     * ============================================================
     * MANAGER LOGIN
     * ============================================================
     */
    if (
      body.portal ===
      'MANAGER'
    ) {
      const manager =
        memberships.find(
          (membership) =>
            membership.isActive &&
            membership.restaurant.isActive &&
            (
              membership.role ===
                'OWNER' ||
              membership.role ===
                'MANAGER'
            )
        );

      if (!manager) {
        return NextResponse.json(
          {
            error:
              'This account is not a Manager account.',
          },
          {
            status: 403,
          }
        );
      }

      await createStaffSession(
        user.id,
        'MANAGER'
      );

      return NextResponse.json({
        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        portal:
          'MANAGER',

        restaurantId:
          manager.restaurantId,

        staffId:
          manager.id,

        role:
          manager.role,
      });
    }

    /*
     * From this point we are logging into
     * Kitchen or Waiter.
     */
    const requestedPortal =
      body.portal ===
      'KITCHEN'
        ? 'KITCHEN'
        : 'WAITER';

    if (!body.restaurantId) {
      return NextResponse.json(
        {
          error:
            'Restaurant ID is required for this login.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * IMPORTANT:
     *
     * Find the exact membership belonging to
     * this restaurant.
     */
    const membership =
      memberships.find(
        (item) =>
          item.restaurantId ===
            body.restaurantId &&
          item.isActive &&
          item.restaurant.isActive
      );

    if (!membership) {
      return NextResponse.json(
        {
          error:
            'This account does not have an active membership for this restaurant.',
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Archived accounts can never enter
     * Kitchen or Waiter.
     */
    if (
      !membership.isActive
    ) {
      return NextResponse.json(
        {
          error:
            'This staff account has been archived by the Manager.',
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Normal staff accounts MUST use the
     * portal selected by the Manager.
     */
    if (
      membership.role ===
      'STAFF'
    ) {
      if (
        membership.staffPortal !==
        requestedPortal
      ) {
        return NextResponse.json(
          {
            error:
              requestedPortal ===
              'WAITER'
                ? 'This account is a Kitchen account, not a Waiter account.'
                : 'This account is a Waiter account, not a Kitchen account.',
          },
          {
            status: 403,
          }
        );
      }
    }

    /*
     * Manager and Owner accounts can enter
     * BOTH Kitchen and Waiter.
     *
     * Staff accounts can enter only their
     * configured portal.
     */
    const allowed =
      membership.role ===
        'OWNER' ||
      membership.role ===
        'MANAGER' ||
      (
        membership.role ===
          'STAFF' &&
        membership.staffPortal ===
          requestedPortal
      );

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            'This account is not authorized for this portal.',
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Create a fresh session with the portal
     * the user is actually entering.
     *
     * Example:
     *
     * Manager -> KITCHEN
     *
     * session.portal = KITCHEN
     *
     * Manager -> WAITER
     *
     * session.portal = WAITER
     */
    await createStaffSession(
      user.id,
      requestedPortal
    );

    return NextResponse.json({
      id:
        user.id,

      name:
        user.name,

      email:
        user.email,

      portal:
        requestedPortal,

      restaurantId:
        membership.restaurantId,

      staffId:
        membership.id,

      role:
        membership.role,

      staffPortal:
        membership.staffPortal,
    });
  } catch (err) {
    console.error(
      'POST /api/auth/login error:',
      err
    );

    return errorResponse(err);
  }
}