import OrderStatus from '@/components/OrderStatus';

export default function OrderStatusPage({ params }: { params: { slug: string; orderId: string } }) {
  return <OrderStatus orderId={params.orderId} />;
}
