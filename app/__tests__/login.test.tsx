import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Alert, Animated } from 'react-native';

// --- Mocks ---

// Mock router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
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
        t: (key: string) => {
            const translations: { [key: string]: string } = {
                'login.tagline': 'Manage your finances easily',
                'login.phoneNumberPlaceholder': '+60 Phone Number',
                'login.sendCode': 'Send Code',
                'login.sendingCode': 'Sending...',
                'login.otpPlaceholder': 'Enter OTP',
                'login.verifyCode': 'Verify',
                'login.verifying': 'Verifying...',
                'login.noAccount': "Don't have an account?",
                'login.signupLink': 'Sign up',
                'login.enterPhoneNumber': 'Please enter your phone number',
                'login.codeSent': 'Verification code sent!',
                'login.codeSendFailed': 'Failed to send code',
                'login.enterVerificationCode': 'Please enter the verification code',
                'login.invalidCode': 'Invalid verification code',
                'common.error': 'Error',
                'common.success': 'Success',
                'profile.language': 'Language',
            };
            return translations[key] || key;
        },
        i18n: {
            language: 'en',
            changeLanguage: jest.fn(),
        },
    }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}));

// Mock settings context
jest.mock('@/context/settings-context', () => ({
    useSettings: () => ({
        fontScaleKey: 'medium',
        setFontScale: jest.fn(),
    }),
}));

// Mock recaptcha context
jest.mock('@/context/recaptcha-context', () => ({
    useRecaptcha: () => ({
        client: null,
        isReady: true,
        initializeRecaptcha: jest.fn(),
    }),
}));

// Mock Firebase Auth
const mockSignInWithPhoneNumber = jest.fn();
const mockConfirm = jest.fn();
const mockSignInWithCredential = jest.fn();

jest.mock('@react-native-firebase/auth', () => {
    const authFn = jest.fn(() => ({
        currentUser: null,
        signInWithPhoneNumber: mockSignInWithPhoneNumber,
        signInWithCredential: mockSignInWithCredential,
    }));
    authFn.GoogleAuthProvider = {
        credential: jest.fn(),
    };
    return {
        __esModule: true,
        default: authFn,
    };
});

// Mock Firebase Firestore
jest.mock('@react-native-firebase/firestore', () => () => ({
    collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
                exists: () => false,
                data: () => null,
            }),
        }),
    }),
}));

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
        configure: jest.fn(),
        hasPlayServices: jest.fn().mockResolvedValue(true),
        signIn: jest.fn(),
    },
}));

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
    MaterialIcons: 'MaterialIcons',
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Import component after mocks
import LoginScreen from '../login';

describe('LoginScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        // Cleanup component first, then clear all timers without running them
        cleanup();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('Rendering', () => {
        it('should render login screen with app name', () => {
            const { getByText } = render(<LoginScreen />);
            expect(getByText('DuitU')).toBeTruthy();
        });

        it('should render tagline', () => {
            const { getByText } = render(<LoginScreen />);
            expect(getByText('Manage your finances easily')).toBeTruthy();
        });

        it('should render phone input with +60 prefix', () => {
            const { getByDisplayValue } = render(<LoginScreen />);
            expect(getByDisplayValue('+60')).toBeTruthy();
        });

        it('should render send code button', () => {
            const { getByText } = render(<LoginScreen />);
            expect(getByText('Send Code')).toBeTruthy();
        });

        it('should render signup link', () => {
            const { getByText, queryByText } = render(<LoginScreen />);
            // Text might be split across elements, so check for Sign up which is in its own element
            expect(getByText('Sign up')).toBeTruthy();
        });

        it('should render Google sign-in button', () => {
            const { getByText } = render(<LoginScreen />);
            expect(getByText('Sign in with Google')).toBeTruthy();
        });
    });

    describe('Phone Number Input', () => {
        it('should update phone number on text change', () => {
            const { getByDisplayValue } = render(<LoginScreen />);

            const input = getByDisplayValue('+60');
            fireEvent.changeText(input, '+60123456789');

            expect(getByDisplayValue('+60123456789')).toBeTruthy();
        });

        it('should automatically add +60 prefix when user types without it', () => {
            const { getByDisplayValue } = render(<LoginScreen />);

            const input = getByDisplayValue('+60');
            fireEvent.changeText(input, '123456789');

            expect(getByDisplayValue('+60123456789')).toBeTruthy();
        });

        it('should convert leading 0 to +60 format', () => {
            const { getByDisplayValue } = render(<LoginScreen />);

            const input = getByDisplayValue('+60');
            fireEvent.changeText(input, '0123456789');

            expect(getByDisplayValue('+60123456789')).toBeTruthy();
        });

        it('should limit phone number length to 13 characters', () => {
            const { getByDisplayValue, queryByDisplayValue } = render(<LoginScreen />);

            const input = getByDisplayValue('+60');
            fireEvent.changeText(input, '+6012345678901234'); // Too long - should be truncated

            // Should be truncated to 13 chars (+60 + 10 digits max)
            // The value '+6012345678901234' should not exist as it's too long
            expect(queryByDisplayValue('+6012345678901234')).toBeNull();
        });
    });

    describe('Phone Number Validation', () => {
        it('should show error when phone number is only the prefix (+60)', async () => {
            const { getByText, getByDisplayValue } = render(<LoginScreen />);

            // Keep only the +60 prefix (which auto-fills when empty)
            const input = getByDisplayValue('+60');
            // The component auto-fills +60 when cleared, so we test with just the prefix
            fireEvent.changeText(input, '+60');

            const sendButton = getByText('Send Code');
            fireEvent.press(sendButton);

            await waitFor(() => {
                // +60 alone is not a valid E.164 number, so it shows format error
                expect(Alert.alert).toHaveBeenCalledWith(
                    'Error',
                    'Invalid phone number format. Please enter a valid Malaysian phone number (e.g., +60123456789)'
                );
            });
        });

        it('should show error for invalid Malaysian phone number format', async () => {
            const { getByText, getByDisplayValue } = render(<LoginScreen />);

            const input = getByDisplayValue('+60');
            fireEvent.changeText(input, '+6012'); // Too short

            const sendButton = getByText('Send Code');
            fireEvent.press(sendButton);

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith(
                    'Error',
                    'Invalid phone number format. Please enter a valid Malaysian phone number (e.g., +60123456789)'
                );
            });
        });
    });

    describe('OTP Flow', () => {
        it('should call signInWithPhoneNumber when send code is pressed with valid number', async () => {
            mockSignInWithPhoneNumber.mockResolvedValue({
                confirm: mockConfirm,
            });

            const { getByText, getByDisplayValue } = render(<LoginScreen />);

            const input = getByDisplayValue('+60');
            fireEvent.changeText(input, '+60123456789');

            const sendButton = getByText('Send Code');
            fireEvent.press(sendButton);

            await waitFor(() => {
                expect(mockSignInWithPhoneNumber).toHaveBeenCalledWith('+60123456789');
            });
        });

        it('should show OTP input after code is sent successfully', async () => {
            mockSignInWithPhoneNumber.mockResolvedValue({
                confirm: mockConfirm,
            });

            const { getByText, getByDisplayValue, getByPlaceholderText } = render(<LoginScreen />);

            const input = getByDisplayValue('+60');
            fireEvent.changeText(input, '+60123456789');

            const sendButton = getByText('Send Code');
            fireEvent.press(sendButton);

            await waitFor(() => {
                expect(getByPlaceholderText('Enter OTP')).toBeTruthy();
            });
        });

        it('should show success alert when OTP is sent', async () => {
            mockSignInWithPhoneNumber.mockResolvedValue({
                confirm: mockConfirm,
            });

            const { getByText, getByDisplayValue } = render(<LoginScreen />);

            const input = getByDisplayValue('+60');
            fireEvent.changeText(input, '+60123456789');

            const sendButton = getByText('Send Code');
            fireEvent.press(sendButton);

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith('Success', 'Verification code sent!');
            });
        });

        it('should show error alert when OTP sending fails', async () => {
            mockSignInWithPhoneNumber.mockRejectedValue(new Error('Network error'));

            const { getByText, getByDisplayValue } = render(<LoginScreen />);

            const input = getByDisplayValue('+60');
            fireEvent.changeText(input, '+60123456789');

            const sendButton = getByText('Send Code');
            fireEvent.press(sendButton);

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to send code');
            });
        });
    });

    describe('Navigation', () => {
        it('should navigate to signup when signup link is pressed', () => {
            const { getByText } = render(<LoginScreen />);

            const signupLink = getByText('Sign up');
            fireEvent.press(signupLink);

            expect(mockPush).toHaveBeenCalledWith('/signup');
        });
    });

    describe('Language Selection', () => {
        it('should open language modal when language button is pressed', async () => {
            const { getByText, queryByText } = render(<LoginScreen />);

            // Find and press the language button (the animated text cycles through)
            const languageButton = getByText('Change Language');
            fireEvent.press(languageButton);

            await waitFor(() => {
                expect(queryByText('English')).toBeTruthy();
                expect(queryByText('Bahasa Melayu')).toBeTruthy();
                expect(queryByText('中文')).toBeTruthy();
                expect(queryByText('தமிழ்')).toBeTruthy();
            });
        });
    });
});
