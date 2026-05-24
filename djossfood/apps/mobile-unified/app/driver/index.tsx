import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { isAuthenticated, isApproved } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isApproved) {
    return <Redirect href="/(auth)/pending" />;
  }

  return <Redirect href="/driver/main" />;
}