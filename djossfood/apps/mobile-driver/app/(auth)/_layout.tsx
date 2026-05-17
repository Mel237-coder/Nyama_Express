import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="register" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="pending" />
    </Stack>
  );
}