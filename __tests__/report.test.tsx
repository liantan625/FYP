import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock all required modules
jest.mock('@react-navigation/native', () => ({
    useTheme: () => ({
        colors: {
            primary: '#10b981',
            background: '#ffffff',
            card: '#ffffff',
            text: '#000000',
            border: '#e0e0e0',
        },
    }),
}));

jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: jest.fn(),
        push: jest.fn(),
    }),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: { [key: string]: string } = {
                'report.title': 'Report',
                'report.retirementAssets': 'Retirement Assets',
                'report.income': 'Income',
                'report.expense': 'Expense',
                'report.thisMonth': 'This Month',
                'report.thisYear': 'This Year',
                'report.financialTrend': 'Financial Trend',
                'report.smartAnalysis': 'Smart Analysis',
                'report.savingsRate': 'Savings Rate',
                'report.greatJob': 'Great job!',
                'report.improveSavings': 'Can improve',
                'report.topSpending': 'Top Spending',
                'report.expenseBreakdown': 'Expense Breakdown',
                'report.noExpenseData': 'No expense data',
                'report.exportPdf': 'Export as PDF',
                'report.loadingTrend': 'Loading trend data...',
                'report.periodToggle.monthly': 'Monthly',
                'report.periodToggle.yearly': 'Yearly',
            };
            return translations[key] || key;
        },
    }),
}));

jest.mock('@react-native-firebase/firestore', () => {
    const mockWhere = jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ forEach: jest.fn() })),
        where: mockWhere,
        onSnapshot: jest.fn((callback) => {
            callback({ empty: true, forEach: jest.fn() });
            return jest.fn();
        }),
    }));

    const mockCollection = jest.fn(() => ({
        doc: jest.fn(() => ({
            collection: jest.fn(() => ({
                onSnapshot: jest.fn((callback) => {
                    callback({ empty: true, forEach: jest.fn() });
                    return jest.fn(); // unsubscribe
                }),
                where: mockWhere,
            })),
            get: jest.fn(() => Promise.resolve({ exists: false })),
        })),
    }));

    return () => ({
        collection: mockCollection,
    });
});

jest.mock('@react-native-firebase/auth', () => () => ({
    currentUser: { uid: 'test-user-123' },
}));

jest.mock('react-native-chart-kit', () => ({
    PieChart: () => null,
    LineChart: () => null,
    BarChart: () => null,
}));

jest.mock('../app/services/reportGenerator', () => ({
    generatePDF: jest.fn(() => Promise.resolve()),
    generateCSV: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/hooks/use-scaled-font', () => ({
    useScaledFontSize: () => ({
        small: 14,
        medium: 16,
        large: 20,
    }),
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Import component after mocks
import ReportScreen from '../app/report';

describe('ReportScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Period Toggle', () => {
        it('renders with monthly view by default', () => {
            const { getByText } = render(<ReportScreen />);

            // Should show period toggle buttons
            expect(getByText('Monthly')).toBeTruthy();
            expect(getByText('Yearly')).toBeTruthy();

            // Should show "This Month" label initially
            expect(getByText('This Month')).toBeTruthy();
        });

        it('displays both Monthly and Yearly toggle buttons', () => {
            const { getByText } = render(<ReportScreen />);

            const monthlyButton = getByText('Monthly');
            const yearlyButton = getByText('Yearly');

            expect(monthlyButton).toBeTruthy();
            expect(yearlyButton).toBeTruthy();
        });

        it('switches to yearly view when yearly button is pressed', async () => {
            const { getByText, queryAllByText } = render(<ReportScreen />);

            // Initially should show "This Month"
            expect(queryAllByText('This Month').length).toBeGreaterThan(0);

            // Press yearly button
            const yearlyButton = getByText('Yearly');
            fireEvent.press(yearlyButton);

            // After toggle, should show "This Year"
            await waitFor(() => {
                expect(queryAllByText('This Year').length).toBeGreaterThan(0);
            });
        });

        it('switches back to monthly view when monthly button is pressed', async () => {
            const { getByText, queryAllByText } = render(<ReportScreen />);

            // First toggle to yearly
            const yearlyButton = getByText('Yearly');
            fireEvent.press(yearlyButton);

            await waitFor(() => {
                expect(queryAllByText('This Year').length).toBeGreaterThan(0);
            });

            // Then toggle back to monthly
            const monthlyButton = getByText('Monthly');
            fireEvent.press(monthlyButton);

            await waitFor(() => {
                expect(queryAllByText('This Month').length).toBeGreaterThan(0);
            });
        });

        it('toggle buttons have proper accessibility labels', () => {
            const { getByLabelText } = render(<ReportScreen />);

            expect(getByLabelText('Monthly')).toBeTruthy();
            expect(getByLabelText('Yearly')).toBeTruthy();
        });
    });

    describe('Report Title', () => {
        it('renders the report title', () => {
            const { getByText } = render(<ReportScreen />);
            expect(getByText('Report')).toBeTruthy();
        });
    });

    describe('Summary Cards', () => {
        it('renders income and expense cards', () => {
            const { getByText } = render(<ReportScreen />);

            expect(getByText('Income')).toBeTruthy();
            expect(getByText('Expense')).toBeTruthy();
        });

        it('displays RM 0.00 for income and expense when no data', () => {
            const { getAllByText } = render(<ReportScreen />);

            // Should show RM 0.00 for both income and expense
            const zeroAmounts = getAllByText('RM 0.00');
            expect(zeroAmounts.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Export Buttons', () => {
        it('renders export PDF button', () => {
            const { getByText } = render(<ReportScreen />);
            expect(getByText('Export as PDF')).toBeTruthy();
        });
    });
});
