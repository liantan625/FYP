import React from 'react';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native';

// --- Mocks ---

// Mock router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        back: jest.fn(),
    }),
}));

// Mock useScaledFontSize
jest.mock('@/hooks/use-scaled-font', () => ({
    useScaledFontSize: () => ({
        tiny: 10,
        small: 12,
        body: 14,
        medium: 16,
        large: 18,
        xlarge: 22,
        title: 24,
        heading: 28,
        fontScale: 1,
    }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: any) => <>{children}</>,
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, params?: any) => {
            const translations: { [key: string]: string } = {
                'home.welcome': `Welcome, ${params?.name || 'User'}!`,
                'home.savingsGoal': 'Savings Goal',
                'home.progress': `${params?.percentage || 0}% complete`,
                'home.monthSummary': 'This Month Summary',
                'home.totalAssets': 'Total Assets',
                'home.expenses': 'Expenses',
                'report.title': 'Financial Report',
                'financialTools.title': 'Financial Tools',
                'financialTools.calculator': 'Calculator',
                'financialTools.expert': 'Expert',
                'financialTools.reminders': 'Reminders',
                'financialTools.tips': 'Tips',
                'financialTools.overBudget': 'Over Budget',
                'financialTools.controlled': 'Spending Controlled',
                'notifications.title': 'Notifications',
            };
            return translations[key] || key;
        },
        i18n: { language: 'en' },
    }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: 'MaterialIcons',
}));

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => {
    const authFn = jest.fn(() => ({
        currentUser: { uid: 'test-user-id' },
    }));
    return {
        __esModule: true,
        default: authFn,
    };
});

// Mock Firestore data
const mockUserData = {
    name: 'John',
    monthlyBudget: 3000,
};

const mockAssets = [
    { id: 'asset-1', category: 'savings', amount: 5000, date: { toDate: () => new Date() } },
    { id: 'asset-2', category: 'investment', amount: 3000, date: { toDate: () => new Date() } },
];

const mockIncomeAssets = [
    { id: 'income-1', category: 'income', amount: 4000, date: { toDate: () => new Date() } },
];

const mockSpendings = [
    { id: 'spending-1', category: 'food', amount: 500, date: { toDate: () => new Date() } },
    { id: 'spending-2', category: 'transport', amount: 200, date: { toDate: () => new Date() } },
];

const mockSavingsGoals = [
    {
        id: 'goal-1',
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 5000,
        status: 'active',
    },
];

const createSnapshot = (data: any[]) => ({
    empty: data.length === 0,
    forEach: (callback: (doc: any) => void) => {
        data.forEach((item) =>
            callback({
                id: item.id,
                data: () => item,
            })
        );
    },
});

jest.mock('@react-native-firebase/firestore', () => {
    return () => ({
        collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockImplementation((userId: string) => ({
                onSnapshot: jest.fn().mockImplementation((callback) => {
                    // User document snapshot
                    callback({
                        data: () => mockUserData,
                    });
                    return jest.fn(); // unsubscribe
                }),
                collection: jest.fn().mockImplementation((collectionName: string) => ({
                    onSnapshot: jest.fn().mockImplementation((callback) => {
                        if (collectionName === 'assets') {
                            callback(createSnapshot(mockAssets));
                        } else if (collectionName === 'spendings') {
                            callback(createSnapshot(mockSpendings));
                        } else if (collectionName === 'savings_goals') {
                            callback(createSnapshot(mockSavingsGoals));
                        }
                        return jest.fn(); // unsubscribe
                    }),
                    where: jest.fn().mockImplementation((field, operator, value) => ({
                        onSnapshot: jest.fn().mockImplementation((callback) => {
                            if (field === 'category' && value === 'income') {
                                callback(createSnapshot(mockIncomeAssets));
                            } else if (field === 'status' && value === 'active') {
                                callback(createSnapshot(mockSavingsGoals));
                            }
                            return jest.fn(); // unsubscribe
                        }),
                    })),
                })),
            })),
        }),
    });
});

// Import component after mocks
import HomeScreen from '../home';

describe('HomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        cleanup();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('Rendering', () => {
        it('should render the home screen with welcome message', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                expect(getByText(/Welcome, John!/)).toBeTruthy();
            });
        });

        it('should render savings goal card', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                expect(getByText('Savings Goal')).toBeTruthy();
            });
        });

        it('should render month summary section', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                expect(getByText('This Month Summary')).toBeTruthy();
            });
        });

        it('should render total assets card', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                expect(getByText('Total Assets')).toBeTruthy();
            });
        });

        it('should render expenses card', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                expect(getByText('Expenses')).toBeTruthy();
            });
        });

        it('should render financial tools section', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                expect(getByText('Financial Tools')).toBeTruthy();
            });
        });

        it('should render all tool buttons', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                expect(getByText('Calculator')).toBeTruthy();
                expect(getByText('Expert')).toBeTruthy();
                expect(getByText('Reminders')).toBeTruthy();
                expect(getByText('Tips')).toBeTruthy();
            });
        });
    });

    describe('Financial Data Display', () => {
        it('should display savings goal amount', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                // Current amount from mock: 5000
                expect(getByText('5000.00')).toBeTruthy();
            });
        });

        it('should display savings goal progress', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                // Progress: 5000/10000 = 50%
                expect(getByText('50% complete')).toBeTruthy();
            });
        });

        it('should display total assets', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                // Total assets: 5000 + 3000 = 8000
                expect(getByText(/RM 8000\.00/)).toBeTruthy();
            });
        });

        it('should display total expenses', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                // Total expenses: 500 + 200 = 700
                expect(getByText(/RM 700\.00/)).toBeTruthy();
            });
        });
    });

    describe('Budget Status', () => {
        it('should show controlled status when under budget', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                // Budget is 3000, expenses are 700, so we're under budget
                expect(getByText('Spending Controlled')).toBeTruthy();
            });
        });
    });

    describe('Navigation', () => {
        it('should navigate to savings goals when savings card is pressed', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                const savingsCard = getByText('Savings Goal');
                fireEvent.press(savingsCard);
            });

            expect(mockPush).toHaveBeenCalledWith('/savingsgoals');
        });

        it('should navigate to calculator when calculator button is pressed', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                const calculatorButton = getByText('Calculator');
                fireEvent.press(calculatorButton);
            });

            expect(mockPush).toHaveBeenCalledWith('/calculator');
        });

        it('should navigate to expert when expert button is pressed', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                const expertButton = getByText('Expert');
                fireEvent.press(expertButton);
            });

            expect(mockPush).toHaveBeenCalledWith('/expert');
        });

        it('should navigate to reminders when reminders button is pressed', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                const remindersButton = getByText('Reminders');
                fireEvent.press(remindersButton);
            });

            expect(mockPush).toHaveBeenCalledWith('/reminders');
        });

        it('should navigate to tips when tips button is pressed', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                const tipsButton = getByText('Tips');
                fireEvent.press(tipsButton);
            });

            expect(mockPush).toHaveBeenCalledWith('/tips');
        });

        it('should navigate to report when report card is pressed', async () => {
            const { getByText } = render(<HomeScreen />);

            await waitFor(() => {
                const reportCard = getByText('Financial Report');
                fireEvent.press(reportCard);
            });

            expect(mockPush).toHaveBeenCalledWith('/report');
        });

        it('should navigate to notifications when notification button is pressed', async () => {
            const { getByLabelText } = render(<HomeScreen />);

            await waitFor(() => {
                const notificationButton = getByLabelText('Notifications');
                fireEvent.press(notificationButton);
            });

            expect(mockPush).toHaveBeenCalledWith('/notifications');
        });
    });

    describe('Accessibility', () => {
        it('should have accessible labels on stat cards', async () => {
            const { getByLabelText } = render(<HomeScreen />);

            await waitFor(() => {
                expect(getByLabelText(/Total Assets, RM/)).toBeTruthy();
                expect(getByLabelText(/Expenses, RM/)).toBeTruthy();
            });
        });

        it('should have accessible label on savings goal card', async () => {
            const { getByLabelText } = render(<HomeScreen />);

            await waitFor(() => {
                expect(getByLabelText(/Savings Goal. 50% complete/)).toBeTruthy();
            });
        });
    });
});
