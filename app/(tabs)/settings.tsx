import SettingsScreen from '@/components/settings/SettingsScreen';
import RouteGuard from '@/components/auth/RouteGuard';

export default function SettingsPage() {
  return (
    <RouteGuard requireAuth={true} redirectTo="/home">
      <SettingsScreen />
    </RouteGuard>
  );
}