import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
    requestNotificationPermissions,
    scheduleReminderNotification,
    cancelReminderNotification,
    cancelAllNotifications,
    getAllScheduledNotifications,
    hasNotificationPermissions,
    sendImmediateNotification,
} from '../utils/notifications';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    getAllScheduledNotificationsAsync: jest.fn(),
    AndroidImportance: {
        HIGH: 4,
    },
    AndroidNotificationPriority: {
        HIGH: 'high',
    },
}));

// Mock Platform
jest.mock('react-native', () => ({
    Platform: {
        OS: 'ios',
    },
}));

describe('Notification Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('requestNotificationPermissions', () => {
        it('should return true when permissions are already granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'granted',
            });

            const result = await requestNotificationPermissions();

            expect(result).toBe(true);
            expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
            expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
        });

        it('should request permissions when not already granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'undetermined',
            });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'granted',
            });

            const result = await requestNotificationPermissions();

            expect(result).toBe(true);
            expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
            expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
        });

        it('should return false when permissions are denied', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'undetermined',
            });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'denied',
            });

            const result = await requestNotificationPermissions();

            expect(result).toBe(false);
        });

        it('should set up Android notification channel when on Android', async () => {
            // Change platform to Android
            (Platform as any).OS = 'android';

            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'granted',
            });

            await requestNotificationPermissions();

            expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
                'reminders',
                expect.objectContaining({
                    name: 'Payment Reminders',
                    importance: Notifications.AndroidImportance.HIGH,
                })
            );

            // Reset platform
            (Platform as any).OS = 'ios';
        });

        it('should handle errors gracefully', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
                new Error('Permission error')
            );

            const result = await requestNotificationPermissions();

            expect(result).toBe(false);
        });
    });

    describe('scheduleReminderNotification', () => {
        it('should schedule a notification successfully', async () => {
            const mockNotificationId = 'notification-123';
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
                mockNotificationId
            );

            const result = await scheduleReminderNotification(
                'reminder-1',
                'Electricity Bill',
                150.50,
                15
            );

            expect(result).toBe(mockNotificationId);
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    identifier: 'reminder-reminder-1',
                    content: expect.objectContaining({
                        title: '💰 Payment Reminder',
                        body: 'Electricity Bill: RM 150.50 is due today',
                    }),
                    trigger: expect.objectContaining({
                        day: 15,
                        hour: 9,
                        minute: 0,
                        repeats: true,
                    }),
                })
            );
        });

        it('should cancel existing notification before scheduling new one', async () => {
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
                'notification-123'
            );

            await scheduleReminderNotification('reminder-1', 'Test', 100, 10);

            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
                'reminder-reminder-1'
            );
        });

        it('should return null when scheduling fails', async () => {
            (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
                new Error('Scheduling failed')
            );

            const result = await scheduleReminderNotification(
                'reminder-1',
                'Test',
                100,
                10
            );

            expect(result).toBeNull();
        });

        it('should include correct data in notification', async () => {
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
                'notification-123'
            );

            await scheduleReminderNotification('reminder-1', 'Test', 250.75, 20);

            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.objectContaining({
                        data: {
                            reminderId: 'reminder-1',
                            type: 'reminder',
                            amount: 250.75,
                        },
                    }),
                })
            );
        });
    });

    describe('cancelReminderNotification', () => {
        it('should cancel a notification successfully', async () => {
            (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(
                undefined
            );

            await cancelReminderNotification('reminder-1');

            expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
                'reminder-reminder-1'
            );
        });

        it('should handle cancellation errors gracefully', async () => {
            (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockRejectedValue(
                new Error('Cancellation failed')
            );

            // Should not throw
            await expect(cancelReminderNotification('reminder-1')).resolves.not.toThrow();
        });
    });

    describe('cancelAllNotifications', () => {
        it('should cancel all notifications successfully', async () => {
            (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(
                undefined
            );

            await cancelAllNotifications();

            expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(
                new Error('Cancel all failed')
            );

            // Should not throw
            await expect(cancelAllNotifications()).resolves.not.toThrow();
        });
    });

    describe('getAllScheduledNotifications', () => {
        it('should return all scheduled notifications', async () => {
            const mockNotifications = [
                { identifier: 'reminder-1', content: {}, trigger: {} },
                { identifier: 'reminder-2', content: {}, trigger: {} },
            ];

            (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(
                mockNotifications
            );

            const result = await getAllScheduledNotifications();

            expect(result).toEqual(mockNotifications);
            expect(Notifications.getAllScheduledNotificationsAsync).toHaveBeenCalled();
        });

        it('should return empty array on error', async () => {
            (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(
                new Error('Get notifications failed')
            );

            const result = await getAllScheduledNotifications();

            expect(result).toEqual([]);
        });
    });

    describe('hasNotificationPermissions', () => {
        it('should return true when permissions are granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'granted',
            });

            const result = await hasNotificationPermissions();

            expect(result).toBe(true);
        });

        it('should return false when permissions are not granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
                status: 'denied',
            });

            const result = await hasNotificationPermissions();

            expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
                new Error('Permission check failed')
            );

            const result = await hasNotificationPermissions();

            expect(result).toBe(false);
        });
    });

    describe('sendImmediateNotification', () => {
        it('should send an immediate notification successfully', async () => {
            const mockNotificationId = 'immediate-123';
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
                mockNotificationId
            );

            const result = await sendImmediateNotification(
                'Test Title',
                'Test Body',
                { key: 'value' }
            );

            expect(result).toBe(mockNotificationId);
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
                content: {
                    title: 'Test Title',
                    body: 'Test Body',
                    data: { key: 'value' },
                    sound: 'default',
                },
                trigger: null,
            });
        });

        it('should send notification without data if not provided', async () => {
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
                'immediate-123'
            );

            await sendImmediateNotification('Test', 'Body');

            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
                content: {
                    title: 'Test',
                    body: 'Body',
                    data: {},
                    sound: 'default',
                },
                trigger: null,
            });
        });

        it('should return null on error', async () => {
            (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
                new Error('Send failed')
            );

            const result = await sendImmediateNotification('Test', 'Body');

            expect(result).toBeNull();
        });
    });
});
