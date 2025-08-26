import FeedsScreen from '@/components/feeds/FeedsScreen';
import RouteGuard from '@/components/auth/RouteGuard';

export default function FeedsPage() {
  return (
    <RouteGuard requireAuth={true} redirectTo="/home">
      <FeedsScreen />
    </RouteGuard>
  );
}