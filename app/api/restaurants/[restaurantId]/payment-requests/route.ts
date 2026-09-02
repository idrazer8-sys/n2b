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
          isSplit: true,
          cashTenderedCents: true,

          splits: {
            orderBy: { personIndex: 'asc' },
            select: {
              id: true,
              personIndex: true,
              label: true,
              shareCents: true,
              tenderedCents: true,
            },
          },

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

        isSplit:
          request.isSplit,

        // Cash-specific: how much the customer said they'd hand over, and
        // the change the waiter owes back. Null unless collectionMethod
        // is CASH and the bill wasn't split.
        cashTenderedCents:
          request.cashTenderedCents,

        changeDueCents:
          request.collectionMethod === 'CASH' &&
          !request.isSplit &&
          request.cashTenderedCents !== null
            ? request.cashTenderedCents -
              request.amountCents
            : null,

        // Per-person breakdown when the table split the bill in cash:
        // each entry carries what that person owes, what they said
        // they'd hand over, and the change to give back to them.
        splits:
          request.splits.map((split: { id: string; personIndex: number; label: string | null; shareCents: number; tenderedCents: number | null }) => ({
            id: split.id,
            personIndex: split.personIndex,
            label: split.label,
            shareCents: split.shareCents,
            tenderedCents: split.tenderedCents,
            changeDueCents:
              request.collectionMethod === 'CASH' &&
              split.tenderedCents !== null
                ? split.tenderedCents - split.shareCents
                : null,
          })),

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