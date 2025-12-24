import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { AuthProvider } from '../context/auth-context';
import { SettingsProvider } from '../context/settings-context';
import { RecaptchaProvider } from '../context/recaptcha-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import '@/i18n/config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

function AppLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const fontSize = useScaledFontSize();

  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        text1Style={{ fontSize: fontSize.medium, fontWeight: 'bold' }}
        text2Style={{ fontSize: fontSize.body }}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        text1Style={{ fontSize: fontSize.medium, fontWeight: 'bold' }}
        text2Style={{ fontSize: fontSize.body }}
      />
    ),
  };

  useEffect(() => {
    async function configureNotifications() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }

      // Schedule "Spend Wisely" notification
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Spend Wisely! 💡",
          body: "Remember to track your expenses and save for your goals.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
      });
    }

    configureNotifications();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
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
        <Stack.Screen name="addSpending" options={{ headerShown: false }} />
        <Stack.Screen name="addCategory" options={{ headerShown: false }} />
        <Stack.Screen name="addAssetCategory" options={{ headerShown: false }} />
        <Stack.Screen name="[category]" options={{ headerShown: false }} />
        <Stack.Screen name="SimpananBank" options={{ headerShown: false }} />
        <Stack.Screen name="Pelaburan" options={{ headerShown: false }} />
        <Stack.Screen name="Hartanah" options={{ headerShown: false }} />
        <Stack.Screen name="LainLain" options={{ headerShown: false }} />
        <Stack.Screen name="Runcit" options={{ headerShown: false }} />
        <Stack.Screen name="Sewa" options={{ headerShown: false }} />
        <Stack.Screen name="Perayaan" options={{ headerShown: false }} />
        <Stack.Screen name="Hiburan" options={{ headerShown: false }} />
        <Stack.Screen name="LainLainSpending" options={{ headerShown: false }} />
        <Stack.Screen name="editSpending/[spendingId]" options={{ headerShown: false }} />
        <Stack.Screen name="editAsset/[assetId]" options={{ headerShown: false }} />
        <Stack.Screen name="Pendapatan" options={{ headerShown: false }} />
        <Stack.Screen name="savingsgoals" options={{ headerShown: false }} />
        <Stack.Screen name="report" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="calculator" options={{ headerShown: false }} />
        <Stack.Screen name="expert" options={{ headerShown: false }} />
        <Stack.Screen name="reminders" options={{ headerShown: false }} />
        <Stack.Screen name="tips" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
      {pathname === '/home' && (
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <MaterialIcons name="notifications" size={18} color="white" />
        </TouchableOpacity>
      )}
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <RecaptchaProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </RecaptchaProvider>
    </SettingsProvider>
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
