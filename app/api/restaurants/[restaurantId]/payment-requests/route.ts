import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      restaurantId: string;
    };
  }
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

    let allowedTableIds: string[] | null = null;

    // Managers and owners can see all payment requests.
    // Regular staff can only see requests for their
    // currently assigned tables (PRIMARY or ASSISTING).
    if (access.role === 'STAFF') {
      const staffMembershipId =
        await getStaffMembershipId(
          params.restaurantId,
          access.user.id
        );

      const assignments =
        await db.tableAssignment.findMany({
          where: {
            restaurantId:
              params.restaurantId,
            endedAt: null,
            OR: [
              {
                role: 'PRIMARY',
                staffId:
                  staffMembershipId,
              },
              {
                role: 'ASSISTING',
                staffId:
                  staffMembershipId,
              },
            ],
          },
          select: {
            tableId: true,
          },
        });

      allowedTableIds = [
        ...new Set(
          assignments.map(
            (assignment) =>
              assignment.tableId
          )
        ),
      ];
    }

    const requests =
      await db.sessionPayment.findMany({
        where: {
          paymentMethod:
            'PAY_AT_RESTAURANT',
          status:
            'REQUIRES_PAYMENT',
          customerSession: {
            restaurantId:
              params.restaurantId,
            paidAt: null,
            ...(allowedTableIds !== null
              ? {
                  tableId: {
                    in: allowedTableIds,
                  },
                }
              : {}),
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          customerSessionId: true,
          paymentMethod: true,

          // This is the method selected by the customer.
          // The waiter only reads it and confirms receipt.
          collectionMethod: true,

          status: true,
          amountCents: true,
          currency: true,
          createdAt: true,

          customerSession: {
            select: {
              id: true,
              tableId: true,

              orders: {
                where: {
                  status: {
                    notIn: [
                      'REJECTED',
                      'CANCELLED',
                    ],
                  },
                },
                orderBy: {
                  createdAt: 'asc',
                },
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  totalCents: true,
                  currency: true,
                  staffId: true,
                },
              },
            },
          },
        },
      });

    const tableIds = [
      ...new Set(
        requests.map(
          (request) =>
            request.customerSession
              .tableId
        )
      ),
    ];

    const tables =
      tableIds.length > 0
        ? await db.table.findMany({
            where: {
              id: {
                in: tableIds,
              },
              restaurantId:
                params.restaurantId,
            },
            select: {
              id: true,
              label: true,
              isActive: true,
            },
          })
        : [];

    const tableById =
      new Map(
        tables.map((table) => [
          table.id,
          table,
        ])
      );

    return NextResponse.json(
      requests.map((request) => ({
        id: request.id,
        customerSessionId:
          request.customerSessionId,

        paymentMethod:
          request.paymentMethod,

        // The customer-selected payment method.
        collectionMethod:
          request.collectionMethod,

        status:
          request.status,

        amountCents:
          request.amountCents,

        currency:
          request.currency,

        createdAt:
          request.createdAt,

        table:
          tableById.get(
            request.customerSession
              .tableId
          ) ?? null,

        orders:
          request.customerSession.orders,
      }))
    );
  } catch (err) {
    console.error(
      'Payment requests GET error:',
      err
    );

    return NextResponse.json(
      {
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}

async function getStaffMembershipId(
  restaurantId: string,
  userId: string
) {
  const membership =
    await db.restaurantStaff.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId,
        },
      },
      select: {
        id: true,
      },
    });

  return membership?.id ?? '';
}