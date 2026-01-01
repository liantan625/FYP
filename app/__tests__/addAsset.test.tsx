
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddAssetScreen from '../addAsset';
import { Platform } from 'react-native';

// --- Mocks ---

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: jest.fn(),
    }),
}));

// Mock useScaledFontSize
jest.mock('@/hooks/use-scaled-font', () => ({
    useScaledFontSize: () => ({ medium: 16, fontScale: 1 }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: any) => <>{children}</>,
}));

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => ({
    show: jest.fn(),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: 'MaterialIcons',
}));

// Mock react-native-picker-select
jest.mock('react-native-picker-select', () => 'RNPickerSelect');

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => () => ({
    currentUser: { uid: 'test-user-id' },
}));

// Mock Firebase Firestore
const mockAdd = jest.fn().mockResolvedValue(true);
const mockCollection = jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
            add: mockAdd,
        }),
    }),
});
jest.mock('@react-native-firebase/firestore', () => () => ({
    collection: mockCollection,
    FieldValue: {
        serverTimestamp: jest.fn(),
    },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
}));

describe('AddAssetScreen', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('iOS environment', () => {
        beforeAll(() => {
            Platform.OS = 'ios';
        });

        it('renders TouchOpacity + Modal for picker on iOS', async () => {
            const { getByText, queryByTestId, toJSON } = render(<AddAssetScreen />);

            // Initial label
            expect(getByText('Pilih Aset/Pendapatan')).toBeTruthy();

            // Trigger picker modal open (assuming the TouchableOpacity wraps the text)
            // Note: In standard RNTL we tap elements.
            // We look for the TouchableOpacity with the text inside.
            const pickerInfo = getByText('Pilih Aset/Pendapatan');
            fireEvent.press(pickerInfo);

            // Verify Modal content appears (e.g., "Selesai" button)
            // Note: React Native Modal render is sometimes tricky in tests if not mocked, 
            // but usually standard jest-expo handles basic visibility prop or renders it similar to View.
            // If Modal is not mocked, it might render its children directly or in a portal.
            // Let's check for "Selesai".
            expect(getByText('Selesai')).toBeTruthy();

            // Simulate pressing "Selesai"
            fireEvent.press(getByText('Selesai'));

            // If hidden, "Selesai" might still exist in tree depending on Modal impl, 
            // but let's assume standard behavior.
        });
    });

    describe('Android environment', () => {
        beforeAll(() => {
            Platform.OS = 'android';
        });

        it('renders RNPickerSelect on Android', () => {
            // Since RNPickerSelect is external, we might see it in the snapshot or via checking render.
            // The code conditionally renders RNPickerSelect on Android.
            const { toJSON } = render(<AddAssetScreen />);
            // We can't easily query internal components of RNPickerSelect without testIDs, 
            // but we can ensure the "Selesai" (modal) text is NOT present.

            const tree = toJSON();
            const jsonString = JSON.stringify(tree);

            expect(jsonString).not.toContain('Selesai');
            // Also there is no "Pilih Aset/Pendapatan" TEXT rendered as a TouchableOpacity text, 
            // but RNPickerSelect renders a View/Input.
        });
    });
});
