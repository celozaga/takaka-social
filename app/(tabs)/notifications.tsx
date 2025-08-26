import NotificationsScreen from '@/components/notifications/NotificationsScreen';
import RouteGuard from '@/components/auth/RouteGuard';

export default function NotificationsPage() {
  return (
    <RouteGuard requireAuth={true} redirectTo="/home">
      <NotificationsScreen />
    </RouteGuard>
  );
}