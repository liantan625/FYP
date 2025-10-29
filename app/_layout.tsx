import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import 'react-native-reanimated';

import { AuthProvider } from '../context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="OTP" options={{ headerShown: false }} />
          <Stack.Screen name="successfulSignUp" options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile" options={{ headerShown: false }} />
          <Stack.Screen name="Security" options={{ headerShown: false }} />
          <Stack.Screen name="Settings" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="addAsset" options={{ headerShown: false }} />
          <Stack.Screen name="SimpananBank" options={{ headerShown: false }} />
          <Stack.Screen name="Pelaburan" options={{ headerShown: false }} />
          <Stack.Screen name="Hartanah" options={{ headerShown: false }} />
          <Stack.Screen name="LainLain" options={{ headerShown: false }} />
          <Stack.Screen name="Pendapatan" options={{ headerShown: false }} />
          <Stack.Screen name="savingsgoals" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <MaterialIcons name="notifications" size={18} color="white" />
        </TouchableOpacity>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  notificationButton: {
    position: 'absolute',
    top: 30, // Position at the top
    right: 10, // Position at the right
    width: 30, // Smaller width
    height: 30, // Smaller height
    borderRadius: 20, // Smaller borderRadius
    backgroundColor: '#A9A9A9', // Grey background
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 5, // Add padding
    margin: 5, // Add margin
  },
});
