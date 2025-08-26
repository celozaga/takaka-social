import WatchScreen from '@/components/watch/WatchScreen';
import RouteGuard from '@/components/auth/RouteGuard';

export default function WatchPage() {
  return (
    <RouteGuard requireAuth={true} redirectTo="/home">
      <WatchScreen />
    </RouteGuard>
  );
}