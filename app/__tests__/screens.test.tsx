/**
 * Minimal unit tests for remaining screens
 * These are "smoke tests" to ensure screens render without crashing
 */
import React from 'react';
import { render, cleanup } from '@testing-library/react-native';

// --- Common Mocks ---

jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        back: jest.fn(),
        replace: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
}));

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

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: any) => <>{children}</>,
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: { [key: string]: string } = {
                'calculator.title': 'Retirement Calculator',
                'calculator.currentAge': 'Current Age',
                'calculator.retirementAge': 'Retirement Age',
                'calculator.monthlySavings': 'Monthly Savings',
                'calculator.currentSavings': 'Current Savings',
                'calculator.calculate': 'Calculate',
                'notifications.title': 'Notifications',
                'notifications.noNotifications': 'No notifications',
            };
            return translations[key] || key;
        },
        i18n: { language: 'en', changeLanguage: jest.fn() },
    }),
}));

jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: 'MaterialIcons',
    Ionicons: 'Ionicons',
}));

jest.mock('@react-native-firebase/auth', () => {
    const authFn = jest.fn(() => ({
        currentUser: { uid: 'test-user-id' },
    }));
    return { __esModule: true, default: authFn };
});

jest.mock('@react-native-firebase/firestore', () => {
    return () => ({
        collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                    exists: () => false,
                    data: () => ({}),
                }),
                onSnapshot: jest.fn().mockImplementation((callback) => {
                    callback({ data: () => ({}) });
                    return jest.fn();
                }),
                collection: jest.fn().mockReturnValue({
                    onSnapshot: jest.fn().mockImplementation((callback) => {
                        callback({ empty: true, forEach: jest.fn(), docs: [] });
                        return jest.fn();
                    }),
                    orderBy: jest.fn().mockReturnValue({
                        onSnapshot: jest.fn().mockImplementation((callback) => {
                            callback({ empty: true, forEach: jest.fn(), docs: [] });
                            return jest.fn();
                        }),
                    }),
                }),
            }),
        }),
    });
});

// Import screens after mocks
import CalculatorScreen from '../calculator';
import NotificationsScreen from '../notifications';

describe('Smoke Tests - Screens', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        cleanup();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('CalculatorScreen', () => {
        it('should render with title', () => {
            const { getByText } = render(<CalculatorScreen />);
            expect(getByText('Retirement Calculator')).toBeTruthy();
        });

        it('should render input fields', () => {
            const { getByText } = render(<CalculatorScreen />);
            expect(getByText('Current Age')).toBeTruthy();
            expect(getByText('Retirement Age')).toBeTruthy();
        });

        it('should render calculate button', () => {
            const { getByText } = render(<CalculatorScreen />);
            expect(getByText('Calculate')).toBeTruthy();
        });
    });

    describe('NotificationsScreen', () => {
        it('should render with title', () => {
            const { getByText } = render(<NotificationsScreen />);
            expect(getByText('Notifications')).toBeTruthy();
        });

        it('should render empty state', () => {
            const { getByText } = render(<NotificationsScreen />);
            expect(getByText('No notifications')).toBeTruthy();
        });
    });
});
