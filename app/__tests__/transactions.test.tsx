import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// --- Mocks ---

// Mock router with push function
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: jest.fn(),
        push: mockPush,
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
        t: (key: string) => key,
        i18n: { language: 'en' },
    }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: 'MaterialIcons',
}));

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
    PieChart: 'PieChart',
    BarChart: 'BarChart',
}));

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => () => ({
    currentUser: { uid: 'test-user-id' },
}));

// Mock Firebase Firestore with sample transaction data using docs array
const mockAssets = [
    {
        id: 'asset-1',
        assetName: 'Maybank',
        category: 'investment',
        amount: 1000,
        createdAt: { toDate: () => new Date('2026-01-17') },
    },
];

const mockSpendings = [
    {
        id: 'spending-1',
        spendingName: 'CNY',
        category: 'celebration',
        amount: 100,
        createdAt: { toDate: () => new Date('2026-01-17') },
    },
];

const createMockSnapshot = (data: any[]) => ({
    docs: data.map((item) => ({
        id: item.id,
        data: () => item,
    })),
});

jest.mock('@react-native-firebase/firestore', () => () => ({
    collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
            collection: jest.fn().mockImplementation((collectionName: string) => ({
                onSnapshot: jest.fn().mockImplementation((callback) => {
                    if (collectionName === 'assets') {
                        callback(createMockSnapshot(mockAssets));
                    } else if (collectionName === 'spendings') {
                        callback(createMockSnapshot(mockSpendings));
                    }
                    return jest.fn(); // unsubscribe
                }),
            })),
        }),
    }),
}));

// Import component after mocks
import TransactionsScreen from '../(tabs)/transactions';

describe('TransactionsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Transaction Card Navigation', () => {
        it('navigates to editAsset screen when income transaction card is pressed', async () => {
            const { getByText } = render(<TransactionsScreen />);

            // Wait for loading to complete and transactions to render
            await waitFor(() => {
                expect(getByText('Maybank')).toBeTruthy();
            });

            // Press the income transaction card
            const incomeCard = getByText('Maybank');
            fireEvent.press(incomeCard);

            // Verify navigation to editAsset with correct ID
            expect(mockPush).toHaveBeenCalledWith('/editAsset/asset-1');
        });

        it('navigates to editSpending screen when expense transaction card is pressed', async () => {
            const { getByText } = render(<TransactionsScreen />);

            // Wait for loading to complete and transactions to render
            await waitFor(() => {
                expect(getByText('CNY')).toBeTruthy();
            });

            // Press the expense transaction card
            const expenseCard = getByText('CNY');
            fireEvent.press(expenseCard);

            // Verify navigation to editSpending with correct ID
            expect(mockPush).toHaveBeenCalledWith('/editSpending/spending-1');
        });

        it('does not navigate when no transaction is pressed', async () => {
            render(<TransactionsScreen />);

            // Wait for loading to complete
            await waitFor(() => {
                expect(mockPush).not.toHaveBeenCalled();
            });
        });
    });

    describe('Transaction Card Accessibility', () => {
        it('income transaction card has correct accessibility label', async () => {
            const { getByLabelText } = render(<TransactionsScreen />);

            // Wait for transactions to render
            await waitFor(() => {
                const incomeCard = getByLabelText(/Maybank, transactions\.investment, \+ RM 1000\.00/);
                expect(incomeCard).toBeTruthy();
            });
        });

        it('expense transaction card has correct accessibility label', async () => {
            const { getByLabelText } = render(<TransactionsScreen />);

            // Wait for transactions to render
            await waitFor(() => {
                const expenseCard = getByLabelText(/CNY, transactions\.celebration, - RM 100\.00/);
                expect(expenseCard).toBeTruthy();
            });
        });
    });
});
