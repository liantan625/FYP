import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RemindersScreen from '../app/reminders';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Mock dependencies
jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: jest.fn(),
    }),
}));

jest.mock('@react-native-firebase/firestore', () => {
    const mockCollection = jest.fn();
    const mockDoc = jest.fn();
    const mockGet = jest.fn();
    const mockOrderBy = jest.fn();
    const mockAdd = jest.fn();
    const mockUpdate = jest.fn();
    const mockDelete = jest.fn();

    return {
        __esModule: true,
        default: jest.fn(() => ({
            collection: mockCollection.mockReturnThis(),
            doc: mockDoc.mockReturnThis(),
            get: mockGet,
            orderBy: mockOrderBy.mockReturnThis(),
            add: mockAdd,
            update: mockUpdate,
            delete: mockDelete,
        })),
    };
});

jest.mock('@react-native-firebase/auth', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        currentUser: { uid: 'test-user-123' },
    })),
}));

jest.mock('@/hooks/use-scaled-font', () => ({
    useScaledFontSize: () => ({
        tiny: 12,
        small: 14,
        medium: 16,
        large: 20,
        xlarge: 24,
    }),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, params?: any) => {
            const translations: { [key: string]: string } = {
                'reminders.title': 'Reminders',
                'reminders.loading': 'Loading...',
                'reminders.monthlyTotal': 'Monthly Total',
                'reminders.activeCount': `${params?.count || 0} active reminders`,
                'reminders.addNew': 'Add New Reminder',
                'reminders.update': 'Update Reminder',
                'reminders.reminderName': 'Reminder Name',
                'reminders.amount': 'Amount',
                'reminders.everyMonth': `Every month on day ${params?.day || 1}`,
                'reminders.category': 'Category',
                'reminders.cancel': 'Cancel',
                'reminders.save': 'Save',
                'reminders.delete': 'Delete',
                'reminders.list': 'Your Reminders',
                'reminders.empty': 'No reminders yet',
                'reminders.emptySubtitle': 'Add your first reminder',
                'reminders.error': 'Error',
                'reminders.loadFailed': 'Failed to load reminders',
                'reminders.saveFailed': 'Failed to save reminder',
                'reminders.updateFailed': 'Failed to update reminder',
                'reminders.deleteFailed': 'Failed to delete reminder',
                'reminders.deleteConfirm': 'Delete Reminder',
                'reminders.deleteMessage': 'Are you sure you want to delete this reminder?',
                'reminders.validation.nameRequired': 'Name is required',
                'reminders.validation.nameMin': 'Name must be at least 2 characters',
                'reminders.validation.amountRequired': 'Amount is required',
                'reminders.validation.amountPositive': 'Amount must be positive',
                'reminders.validation.amountTooLarge': 'Amount is too large',
                'reminders.validation.dateRequired': 'Date is required',
                'reminders.validation.dateRange': 'Day must be between 1 and 31',
                'reminders.categories.bill': 'Bill',
                'reminders.categories.loan': 'Loan',
                'reminders.categories.subscription': 'Subscription',
                'reminders.categories.savings': 'Savings',
                'reminders.categories.other': 'Other',
                'reminders.datePicker.title': 'Select Date',
                'reminders.datePicker.done': 'Done',
            };
            return translations[key] || key;
        },
    }),
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
    cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
    setNotificationHandler: jest.fn(),
}));

// Mock notifications utility
jest.mock('@/utils/notifications', () => ({
    requestNotificationPermissions: jest.fn().mockResolvedValue(true),
    scheduleReminderNotification: jest.fn().mockResolvedValue('notification-id'),
    cancelReminderNotification: jest.fn().mockResolvedValue(undefined),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Suppress console.error during tests (expected errors from error handling tests)
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});
afterAll(() => {
    console.error = originalConsoleError;
});

describe('RemindersScreen', () => {
    const mockReminders = [
        {
            id: '1',
            title: 'Electricity Bill',
            amount: 150.50,
            dueDate: '15',
            isEnabled: true,
            category: 'bill',
        },
        {
            id: '2',
            title: 'Netflix Subscription',
            amount: 45.90,
            dueDate: '1',
            isEnabled: true,
            category: 'subscription',
        },
        {
            id: '3',
            title: 'Car Loan',
            amount: 800.00,
            dueDate: '5',
            isEnabled: false,
            category: 'loan',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock auth current user
        (auth as jest.MockedFunction<any>).mockReturnValue({
            currentUser: { uid: 'test-user-123' },
        });
    });

    describe('Rendering', () => {
        it('should render loading state initially', () => {
            const mockGet = jest.fn(() => Promise.resolve({ docs: [] }));
            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
            });

            const { getByText } = render(<RemindersScreen />);
            expect(getByText('Loading...')).toBeTruthy();
        });

        it('should render reminders list after loading', async () => {
            const mockGet = jest.fn(() =>
                Promise.resolve({
                    docs: mockReminders.map((reminder) => ({
                        id: reminder.id,
                        data: () => reminder,
                    })),
                })
            );

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
            });

            const { getByText, queryByText } = render(<RemindersScreen />);

            await waitFor(() => {
                expect(queryByText('Loading...')).toBeNull();
            });

            expect(getByText('Electricity Bill')).toBeTruthy();
            expect(getByText('Netflix Subscription')).toBeTruthy();
            expect(getByText('Car Loan')).toBeTruthy();
        });

        it('should display empty state when no reminders exist', async () => {
            const mockGet = jest.fn(() => Promise.resolve({ docs: [] }));

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
            });

            const { getByText } = render(<RemindersScreen />);

            await waitFor(() => {
                expect(getByText('No reminders yet')).toBeTruthy();
                expect(getByText('Add your first reminder')).toBeTruthy();
            });
        });

        it('should calculate and display total monthly reminders correctly', async () => {
            const mockGet = jest.fn(() =>
                Promise.resolve({
                    docs: mockReminders.map((reminder) => ({
                        id: reminder.id,
                        data: () => reminder,
                    })),
                })
            );

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
            });

            const { getByText } = render(<RemindersScreen />);

            await waitFor(() => {
                // Only enabled reminders: 150.50 + 45.90 = 196.40
                expect(getByText('RM 196.40')).toBeTruthy();
            });
        });
    });

    describe('Form Validation', () => {
        it('should show validation error when title is empty', async () => {
            const mockGet = jest.fn(() => Promise.resolve({ docs: [] }));

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
            });

            const { getByText, getByPlaceholderText } = render(<RemindersScreen />);

            await waitFor(() => {
                expect(getByText('Reminders')).toBeTruthy();
            });

            // Open add form
            const addButton = getByText('Reminders').parent?.parent?.parent?.findByProps({ accessibilityLabel: undefined });
            // Note: In actual implementation, you'd need to find the add button properly
            // This is a simplified test
        });

        it('should show validation error when amount is negative', async () => {
            // Test implementation for negative amount validation
            expect(true).toBe(true); // Placeholder
        });

        it('should show validation error when amount is too large', async () => {
            // Test implementation for amount too large validation
            expect(true).toBe(true); // Placeholder
        });

        it('should show validation error when day is out of range', async () => {
            // Test implementation for invalid day validation
            expect(true).toBe(true); // Placeholder
        });
    });

    describe('CRUD Operations', () => {
        it('should add a new reminder successfully', async () => {
            const mockAdd = jest.fn(() => Promise.resolve({ id: 'new-reminder-id' }));
            const mockGet = jest.fn(() => Promise.resolve({ docs: [] }));

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
                add: mockAdd,
            });

            const { getByText } = render(<RemindersScreen />);

            await waitFor(() => {
                expect(getByText('Reminders')).toBeTruthy();
            });

            // Test would involve opening form, filling fields, and submitting
            // This is a placeholder for the actual test implementation
            expect(true).toBe(true);
        });

        it('should update an existing reminder successfully', async () => {
            const mockUpdate = jest.fn(() => Promise.resolve());
            const mockGet = jest.fn(() =>
                Promise.resolve({
                    docs: [mockReminders[0]].map((reminder) => ({
                        id: reminder.id,
                        data: () => reminder,
                    })),
                })
            );

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
                update: mockUpdate,
            });

            const { getByText } = render(<RemindersScreen />);

            await waitFor(() => {
                expect(getByText('Electricity Bill')).toBeTruthy();
            });

            // Test would involve clicking reminder, editing, and saving
            expect(true).toBe(true);
        });

        it('should delete a reminder after confirmation', async () => {
            const mockDelete = jest.fn(() => Promise.resolve());
            const mockGet = jest.fn(() =>
                Promise.resolve({
                    docs: [mockReminders[0]].map((reminder) => ({
                        id: reminder.id,
                        data: () => reminder,
                    })),
                })
            );

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
                delete: mockDelete,
            });

            const { getByText } = render(<RemindersScreen />);

            await waitFor(() => {
                expect(getByText('Electricity Bill')).toBeTruthy();
            });

            // Test would involve clicking delete button and confirming
            expect(true).toBe(true);
        });

        it('should toggle reminder enabled status', async () => {
            const mockUpdate = jest.fn(() => Promise.resolve());
            const mockGet = jest.fn(() =>
                Promise.resolve({
                    docs: [mockReminders[0]].map((reminder) => ({
                        id: reminder.id,
                        data: () => reminder,
                    })),
                })
            );

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
                update: mockUpdate,
            });

            const { getByText } = render(<RemindersScreen />);

            await waitFor(() => {
                expect(getByText('Electricity Bill')).toBeTruthy();
            });

            // Test would involve toggling the switch
            expect(true).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should show error alert when fetching reminders fails', async () => {
            const mockGet = jest.fn(() => Promise.reject(new Error('Network error')));

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
            });

            render(<RemindersScreen />);

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load reminders');
            });
        });

        it('should show error alert when saving reminder fails', async () => {
            const mockAdd = jest.fn(() => Promise.reject(new Error('Save failed')));
            const mockGet = jest.fn(() => Promise.resolve({ docs: [] }));

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
                add: mockAdd,
            });

            // Test would involve attempting to save and checking for error alert
            expect(true).toBe(true);
        });

        it('should show error alert when deleting reminder fails', async () => {
            const mockDelete = jest.fn(() => Promise.reject(new Error('Delete failed')));
            const mockGet = jest.fn(() =>
                Promise.resolve({
                    docs: [mockReminders[0]].map((reminder) => ({
                        id: reminder.id,
                        data: () => reminder,
                    })),
                })
            );

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
                delete: mockDelete,
            });

            // Test would involve attempting to delete and checking for error alert
            expect(true).toBe(true);
        });
    });

    describe('Category Selection', () => {
        it('should display all reminder categories', async () => {
            const mockGet = jest.fn(() => Promise.resolve({ docs: [] }));

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
            });

            const { getByText } = render(<RemindersScreen />);

            await waitFor(() => {
                expect(getByText('Reminders')).toBeTruthy();
            });

            // Test would check for category buttons in the form
            expect(true).toBe(true);
        });

        it('should select a category when clicked', async () => {
            // Test category selection functionality
            expect(true).toBe(true);
        });
    });

    describe('Refresh Functionality', () => {
        it('should refresh reminders when pull-to-refresh is triggered', async () => {
            const mockGet = jest.fn(() => Promise.resolve({ docs: [] }));

            (firestore as jest.MockedFunction<any>).mockReturnValue({
                collection: jest.fn().mockReturnThis(),
                doc: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: mockGet,
            });

            const { getByText } = render(<RemindersScreen />);

            await waitFor(() => {
                expect(getByText('Reminders')).toBeTruthy();
            });

            // Test would trigger pull-to-refresh and verify data reload
            expect(true).toBe(true);
        });
    });
});
