import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    Vibration,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

type Step = 'phone' | 'otp' | 'newPin' | 'confirmPin';

export default function ResetPINScreen() {
    const router = useRouter();
    const fontSize = useScaledFontSize();
    const { t } = useTranslation();

    const [step, setStep] = useState<Step>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [confirmation, setConfirmation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState('');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadUserPhone();
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            intervalRef.current = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [countdown]);

    const loadUserPhone = async () => {
        const user = auth().currentUser;
        if (!user) return;

        try {
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const phone = user.phoneNumber || userData?.phoneNumber || '';
                setPhoneNumber(phone);
                if (phone.length > 6) {
                    const masked = phone.slice(0, 6) + '***' + phone.slice(-3);
                    setMaskedPhone(masked);
                } else {
                    setMaskedPhone(phone);
                }
            }
        } catch (err) {
            console.error('Error loading phone:', err);
        }
    };

    const handleSendOTP = async () => {
        if (!phoneNumber) {
            Alert.alert(t('common.error'), t('security.noPhoneNumber'));
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const confirmationResult = await auth().signInWithPhoneNumber(phoneNumber);
            setConfirmation(confirmationResult);
            setStep('otp');
            setCountdown(30);
        } catch (err: any) {
            console.error('OTP Send Error:', err);
            Alert.alert(t('common.error'), t('login.codeSendFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const getActivePin = () => {
        switch (step) {
            case 'otp': return otp;
            case 'newPin': return newPin;
            case 'confirmPin': return confirmPin;
            default: return '';
        }
    };

    const setActivePin = (value: string) => {
        switch (step) {
            case 'otp': setOtp(value); break;
            case 'newPin': setNewPin(value); break;
            case 'confirmPin': setConfirmPin(value); break;
        }
    };

    const handleNumberPress = (num: string) => {
        const activePin = getActivePin();
        if (activePin.length < 6) {
            const newValue = activePin + num;
            setActivePin(newValue);
            setError('');

            if (newValue.length === 6) {
                handlePinComplete(newValue);
            }
        }
    };

    const handleDelete = () => {
        const activePin = getActivePin();
        setActivePin(activePin.slice(0, -1));
    };

    const handlePinComplete = async (pin: string) => {
        if (step === 'otp') {
            await verifyOTP(pin);
        } else if (step === 'newPin') {
            setStep('confirmPin');
        } else if (step === 'confirmPin') {
            if (pin === newPin) {
                await saveNewPin();
            } else {
                Vibration.vibrate(200);
                setError(t('security.pinMismatch'));
                setConfirmPin('');
            }
        }
    };

    const verifyOTP = async (code: string) => {
        if (!confirmation) return;

        setIsLoading(true);
        try {
            await confirmation.confirm(code);
            setStep('newPin');
        } catch (err) {
            console.error('OTP Verification Error:', err);
            Vibration.vibrate(200);
            setError(t('login.invalidCode'));
            setOtp('');
        } finally {
            setIsLoading(false);
        }
    };

    const saveNewPin = async () => {
        setIsLoading(true);
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No user');

            const hashedPin = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                newPin
            );

            await firestore().collection('users').doc(user.uid).update({
                passcode: hashedPin,
            });

            Alert.alert(
                t('common.success'),
                t('security.pinReset'),
                [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)/home') }]
            );
        } catch (err) {
            console.error('Error saving PIN:', err);
            Alert.alert(t('common.error'), t('security.pinResetFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        switch (step) {
            case 'phone': return t('security.resetPinTitle');
            case 'otp': return t('security.enterOtp');
            case 'newPin': return t('security.enterNewPin');
            case 'confirmPin': return t('security.confirmNewPin');
        }
    };

    const getSubtitle = () => {
        switch (step) {
            case 'phone': return t('security.resetPinSubtitle');
            case 'otp': return t('security.otpSentTo', { phone: maskedPhone });
            case 'newPin': return t('security.chooseNewPin');
            case 'confirmPin': return t('security.reenterNewPin');
        }
    };

    const renderPinDots = () => {
        const activePin = getActivePin();
        return (
            <View style={styles.dotsContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index < activePin.length && styles.dotFilled,
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
            ['', '0', 'delete'],
        ];

        return (
            <View style={styles.numpad}>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.numpadRow}>
                        {row.map((item, colIndex) => {
                            if (item === '') {
                                return <View key={colIndex} style={styles.numpadButton} />;
                            }
                            if (item === 'delete') {
                                return (
                                    <TouchableOpacity
                                        key={colIndex}
                                        style={styles.numpadButton}
                                        onPress={handleDelete}
                                        onLongPress={() => setActivePin('')}
                                    >
                                        <MaterialIcons name="backspace" size={24} color="#64748B" />
                                    </TouchableOpacity>
                                );
                            }
                            return (
                                <TouchableOpacity
                                    key={colIndex}
                                    style={styles.numpadButton}
                                    onPress={() => handleNumberPress(item)}
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.numpadText, { fontSize: fontSize.xlarge }]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    if (isLoading && step === 'phone') {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={[styles.loadingText, { fontSize: fontSize.medium }]}>
                    {t('login.sendingCode')}
                </Text>
            </SafeAreaView>
        );
    }

    // Phone confirmation screen
    if (step === 'phone') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={28} color="black" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.phoneIcon}>
                        <MaterialIcons name="phonelink-lock" size={48} color="#F97316" />
                    </View>

                    <Text style={[styles.title, { fontSize: fontSize.xlarge }]}>
                        {getTitle()}
                    </Text>
                    <Text style={[styles.subtitle, { fontSize: fontSize.medium }]}>
                        {getSubtitle()}
                    </Text>

                    <View style={styles.phoneCard}>
                        <Text style={[styles.phoneLabel, { fontSize: fontSize.small }]}>
                            {t('security.registeredPhone')}
                        </Text>
                        <Text style={[styles.phoneNumber, { fontSize: fontSize.xlarge }]}>
                            {maskedPhone || t('common.loading')}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.sendButton, (!phoneNumber || isLoading) && styles.sendButtonDisabled]}
                        onPress={handleSendOTP}
                        disabled={isLoading || !phoneNumber}
                    >
                        <Text style={[styles.sendButtonText, { fontSize: fontSize.large }]}>
                            {t('security.sendOtp')}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.warningCard}>
                        <MaterialIcons name="warning" size={20} color="#F59E0B" />
                        <Text style={[styles.warningText, { fontSize: fontSize.small }]}>
                            {t('security.otpWarning')}
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const progressSteps: Step[] = ['otp', 'newPin', 'confirmPin'];
    const currentStepIndex = progressSteps.indexOf(step);

    // OTP and PIN entry screens
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (step === 'otp') {
                            setStep('phone');
                            setOtp('');
                        } else if (step === 'confirmPin') {
                            setStep('newPin');
                            setConfirmPin('');
                        }
                    }}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={28} color="black" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {progressSteps.map((s, index) => (
                        <View key={s} style={styles.progressItem}>
                            <View
                                style={[
                                    styles.progressCircle,
                                    (step === s || currentStepIndex > index) && styles.progressCircleActive,
                                ]}
                            >
                                <Text style={styles.progressText}>{index + 1}</Text>
                            </View>
                            {index < 2 && (
                                <View
                                    style={[
                                        styles.progressLine,
                                        currentStepIndex > index && styles.progressLineActive,
                                    ]}
                                />
                            )}
                        </View>
                    ))}
                </View>

                <Text style={[styles.title, { fontSize: fontSize.xlarge }]}>
                    {getTitle()}
                </Text>
                <Text style={[styles.subtitle, { fontSize: fontSize.medium }]}>
                    {getSubtitle()}
                </Text>

                {error ? (
                    <Text style={[styles.errorText, { fontSize: fontSize.small }]}>
                        {error}
                    </Text>
                ) : null}

                {isLoading ? (
                    <ActivityIndicator size="large" color="#F97316" style={styles.inlineLoader} />
                ) : (
                    <>
                        {renderPinDots()}
                        {renderNumpad()}
                    </>
                )}

                {step === 'otp' && (
                    <TouchableOpacity
                        style={[styles.resendButton, countdown > 0 && styles.resendButtonDisabled]}
                        onPress={handleSendOTP}
                        disabled={countdown > 0 || isLoading}
                    >
                        <Text style={[styles.resendButtonText, { fontSize: fontSize.medium }, countdown > 0 && styles.resendButtonTextDisabled]}>
                            {countdown > 0 ? `${t('security.resendOtp')} (${countdown}s)` : t('security.resendOtp')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: '#6B7280',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    backButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    phoneIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#FFEDD5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        color: '#6B7280',
        marginBottom: 32,
        textAlign: 'center',
    },
    phoneCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    phoneLabel: {
        color: '#6B7280',
        marginBottom: 8,
    },
    phoneNumber: {
        fontWeight: 'bold',
        color: '#1F2937',
    },
    sendButton: {
        backgroundColor: '#F97316',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    warningCard: {
        marginTop: 32,
        padding: 16,
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    warningText: {
        color: '#92400E',
        marginLeft: 8,
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        marginBottom: 32,
    },
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressCircleActive: {
        backgroundColor: '#F97316',
    },
    progressText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    progressLine: {
        width: 32,
        height: 4,
        backgroundColor: '#D1D5DB',
    },
    progressLineActive: {
        backgroundColor: '#F97316',
    },
    errorText: {
        color: '#EF4444',
        marginBottom: 16,
    },
    inlineLoader: {
        marginBottom: 32,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
        gap: 16,
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
        backgroundColor: '#F97316',
        borderColor: '#F97316',
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
        width: 80,
        height: 80,
        borderRadius: 40,
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
    resendButton: {
        marginTop: 32,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: '#1F2937',
    },
    resendButtonDisabled: {
        backgroundColor: '#E5E7EB',
    },
    resendButtonText: {
        color: '#fff',
    },
    resendButtonTextDisabled: {
        color: '#6B7280',
    },
});
