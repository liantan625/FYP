import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request notification permissions from the user
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Notification permission not granted');
            return false;
        }

        // For Android, set up notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('reminders', {
                name: 'Payment Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#48BB78',
                sound: 'default',
            });
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}

/**
 * Schedule a monthly recurring notification for a reminder
 * @param reminderId - Unique identifier for the reminder
 * @param title - Title of the reminder
 * @param amount - Amount to be paid
 * @param dayOfMonth - Day of the month (1-31) when notification should trigger
 * @param notificationTime - Time in HH:MM format (24-hour), defaults to "09:00"
 * @returns Promise<string | null> - Notification identifier or null if failed
 */
export async function scheduleReminderNotification(
    reminderId: string,
    title: string,
    amount: number,
    dayOfMonth: number,
    notificationTime: string = '09:00'
): Promise<string | null> {
    try {
        // Cancel any existing notification for this reminder
        await cancelReminderNotification(reminderId);

        // Parse the notification time
        const [hours, minutes] = notificationTime.split(':').map(Number);
        const hour = isNaN(hours) ? 9 : hours;
        const minute = isNaN(minutes) ? 0 : minutes;

        // Calculate the next occurrence of the reminder
        const now = new Date();
        const nextTrigger = new Date();
        nextTrigger.setDate(dayOfMonth);
        nextTrigger.setHours(hour, minute, 0, 0);

        // If the day/time has passed this month, schedule for next month
        if (nextTrigger <= now) {
            nextTrigger.setMonth(nextTrigger.getMonth() + 1);
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
            identifier: `reminder-${reminderId}`,
            content: {
                title: '💰 Payment Reminder',
                body: `${title}: RM ${amount.toFixed(2)} is due today`,
                data: {
                    reminderId,
                    type: 'reminder',
                    amount,
                },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                categoryIdentifier: 'reminder',
            },
            trigger: {
                channelId: 'reminders',
                repeats: true,
                day: dayOfMonth,
                hour: hour,
                minute: minute,
            },
        });

        console.log(`Scheduled notification for reminder ${reminderId} at ${hour}:${minute}: ${notificationId}`);
        return notificationId;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
}

/**
 * Cancel a scheduled notification for a reminder
 * @param reminderId - Unique identifier for the reminder
 */
export async function cancelReminderNotification(reminderId: string): Promise<void> {
    try {
        const identifier = `reminder-${reminderId}`;
        await Notifications.cancelScheduledNotificationAsync(identifier);
        console.log(`Cancelled notification for reminder ${reminderId}`);
    } catch (error) {
        console.error('Error cancelling notification:', error);
    }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('Cancelled all scheduled notifications');
    } catch (error) {
        console.error('Error cancelling all notifications:', error);
    }
}

/**
 * Get all scheduled notifications
 * @returns Promise<Notifications.NotificationRequest[]>
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        return notifications;
    } catch (error) {
        console.error('Error getting scheduled notifications:', error);
        return [];
    }
}

/**
 * Check if notification permissions are granted
 * @returns Promise<boolean>
 */
export async function hasNotificationPermissions(): Promise<boolean> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error checking notification permissions:', error);
        return false;
    }
}

/**
 * Send an immediate notification (for testing purposes)
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data to include
 */
export async function sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, any>
): Promise<string | null> {
    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
                sound: 'default',
            },
            trigger: null, // null means send immediately
        });
        return notificationId;
    } catch (error) {
        console.error('Error sending immediate notification:', error);
        return null;
    }
}
