import MoreScreen from '@/components/more/MoreScreen';
import RouteGuard from '@/components/auth/RouteGuard';

export default function MorePage() {
  return (
    <RouteGuard requireAuth={true} redirectTo="/home">
      <MoreScreen />
    </RouteGuard>
  );
}