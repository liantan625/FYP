import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Vibration,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useAuth } from '@/context/auth-context';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

const MAX_ATTEMPTS = 5;

export default function PinLockScreen() {
    const router = useRouter();
    const fontSize = useScaledFontSize();
    const { t } = useTranslation();
    const { setPinVerified } = useAuth();

    const [pin, setPin] = useState<string>('');
    const [attempts, setAttempts] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasBiometric, setHasBiometric] = useState<boolean>(false);
    const [storedPinHash, setStoredPinHash] = useState<string | null>(null);

    // Responsive button sizing
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const isSmallScreen = screenHeight < 700;
    const isVerySmallScreen = screenHeight < 600;
    const buttonSize = Math.min(Math.floor((screenWidth - 80) / 3.5), isVerySmallScreen ? 56 : isSmallScreen ? 64 : 80);
    const buttonGap = isVerySmallScreen ? 8 : isSmallScreen ? 12 : 16;
    const logoSize = isVerySmallScreen ? 50 : isSmallScreen ? 60 : 80;
    const logoIconSize = isVerySmallScreen ? 24 : isSmallScreen ? 30 : 40;

    useEffect(() => {
        checkBiometricSupport();
        loadStoredPin();
    }, []);

    const checkBiometricSupport = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometric(compatible && enrolled);
    };

    const loadStoredPin = async () => {
        const user = auth().currentUser;
        if (!user) return;

        try {
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Check if PIN is hashed (64 chars for SHA256) or plain
                const storedPin = userData?.passcode;
                if (storedPin) {
                    if (storedPin.length === 64) {
                        // Already hashed
                        setStoredPinHash(storedPin);
                    } else {
                        // Plain text, hash it for comparison
                        const hashed = await Crypto.digestStringAsync(
                            Crypto.CryptoDigestAlgorithm.SHA256,
                            storedPin
                        );
                        setStoredPinHash(hashed);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading PIN:', error);
        }
    };

    const handleNumberPress = (num: string) => {
        if (pin.length < 6) {
            const newPin = pin + num;
            setPin(newPin);

            if (newPin.length === 6) {
                verifyPin(newPin);
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
    };

    const verifyPin = async (enteredPin: string) => {
        if (!storedPinHash) {
            Alert.alert(t('common.error'), 'PIN not found. Please contact support.');
            return;
        }

        setIsLoading(true);
        try {
            const enteredHash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                enteredPin
            );

            if (enteredHash === storedPinHash) {
                setPinVerified(true);
                router.replace('/(tabs)/home');
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                setPin('');
                Vibration.vibrate(200);

                if (newAttempts >= MAX_ATTEMPTS) {
                    handleForgotPin(true);
                } else {
                    Alert.alert(
                        t('common.error'),
                        t('pinLock.invalidPin') + '\n' + t('pinLock.attemptsRemaining', { count: MAX_ATTEMPTS - newAttempts })
                    );
                }
            }
        } catch (error) {
            console.error('Error verifying PIN:', error);
            Alert.alert(t('common.error'), 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometric = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: t('pinLock.useBiometric'),
                fallbackLabel: t('pinLock.title'),
                disableDeviceFallback: false,
            });

            if (result.success) {
                setPinVerified(true);
                router.replace('/(tabs)/home');
            }
        } catch (error) {
            console.error('Biometric error:', error);
        }
    };

    const handleForgotPin = (forced = false) => {
        const message = forced
            ? 'Too many failed attempts. You will be logged out.'
            : t('pinLock.forgotPinMessage');

        Alert.alert(
            t('pinLock.forgotPin'),
            message,
            [
                {
                    text: t('pinLock.cancel'),
                    style: 'cancel',
                    onPress: () => {
                        if (forced) {
                            performLogout();
                        }
                    }
                },
                {
                    text: t('pinLock.logout'),
                    style: 'destructive',
                    onPress: performLogout,
                },
            ]
        );
    };

    const performLogout = async () => {
        try {
            await auth().signOut();
            router.replace('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const renderPinDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index < pin.length && styles.dotFilled,
                        ]}
                    />
                ))}
            </View>
        );
    };

    const renderNumpad = () => {
        const rows = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            [hasBiometric ? 'biometric' : '', '0', 'delete'],
        ];

        return (
            <View style={[styles.numpad, { maxWidth: buttonSize * 3 + buttonGap * 4 }]}>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={[styles.numpadRow, { marginBottom: buttonGap }]}>
                        {row.map((item, colIndex) => {
                            if (item === '') {
                                return <View key={colIndex} style={[styles.numpadButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]} />;
                            }
                            if (item === 'biometric') {
                                return (
                                    <TouchableOpacity
                                        key={colIndex}
                                        style={[styles.numpadButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                                        onPress={handleBiometric}
                                    >
                                        <MaterialIcons
                                            name={Platform.OS === 'ios' ? 'face' : 'fingerprint'}
                                            size={isSmallScreen ? 24 : 28}
                                            color="#48BB78"
                                        />
                                    </TouchableOpacity>
                                );
                            }
                            if (item === 'delete') {
                                return (
                                    <TouchableOpacity
                                        key={colIndex}
                                        style={[styles.numpadButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                                        onPress={handleDelete}
                                        onLongPress={() => setPin('')}
                                    >
                                        <MaterialIcons name="backspace" size={isSmallScreen ? 20 : 24} color="#64748B" />
                                    </TouchableOpacity>
                                );
                            }
                            return (
                                <TouchableOpacity
                                    key={colIndex}
                                    style={[styles.numpadButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                                    onPress={() => handleNumberPress(item)}
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.numpadText, { fontSize: isSmallScreen ? fontSize.large : fontSize.xlarge }]}>{item}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.content, isSmallScreen && { paddingHorizontal: 16 }]}>
                {/* Logo */}
                <View style={[styles.logoContainer, isSmallScreen && { marginBottom: 12 }]}>
                    <View style={[styles.logo, { width: logoSize, height: logoSize, borderRadius: logoSize / 4 }]}>
                        <MaterialIcons name="lock" size={logoIconSize} color="#48BB78" />
                    </View>
                </View>

                {/* Title */}
                <Text style={[styles.title, { fontSize: fontSize.xlarge, marginBottom: isSmallScreen ? 4 : 8 }]}>{t('pinLock.title')}</Text>
                <Text style={[styles.subtitle, { fontSize: fontSize.medium, marginBottom: isSmallScreen ? 16 : 32 }]}>{t('pinLock.subtitle')}</Text>

                {/* PIN Dots */}
                {renderPinDots()}

                {/* Numpad */}
                {renderNumpad()}

                {/* Forgot PIN */}
                <TouchableOpacity style={[styles.forgotButton, isSmallScreen && { marginTop: 16, padding: 12 }]} onPress={() => handleForgotPin()}>
                    <Text style={[styles.forgotText, { fontSize: fontSize.medium }]}>{t('pinLock.forgotPin')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#48BB78',
    },
    title: {
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        color: '#64748B',
        marginBottom: 32,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 12,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: '#48BB78',
        borderColor: '#48BB78',
    },
    numpad: {
        width: '100%',
        maxWidth: 300,
    },
    numpadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    numpadButton: {
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    numpadText: {
        fontWeight: '600',
        color: '#1F2937',
    },
    forgotButton: {
        marginTop: 32,
        padding: 16,
    },
    forgotText: {
        color: '#EF4444',
        fontWeight: '600',
    },
});
