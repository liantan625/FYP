import React, { useState, useEffect } from 'react';
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

type Step = 'current' | 'new' | 'confirm';

export default function ChangePINScreen() {
    const router = useRouter();
    const fontSize = useScaledFontSize();
    const { t } = useTranslation();

    const [step, setStep] = useState<Step>('current');
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [storedPinHash, setStoredPinHash] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStoredPin();
    }, []);

    const loadStoredPin = async () => {
        const user = auth().currentUser;
        if (!user) return;

        try {
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const storedPin = userData?.passcode;
                if (storedPin) {
                    if (storedPin.length === 64) {
                        setStoredPinHash(storedPin);
                    } else {
                        const hashed = await Crypto.digestStringAsync(
                            Crypto.CryptoDigestAlgorithm.SHA256,
                            storedPin
                        );
                        setStoredPinHash(hashed);
                    }
                }
            }
        } catch (err) {
            console.error('Error loading PIN:', err);
        }
    };

    const getActivePin = () => {
        switch (step) {
            case 'current': return currentPin;
            case 'new': return newPin;
            case 'confirm': return confirmPin;
        }
    };

    const setActivePin = (value: string) => {
        switch (step) {
            case 'current': setCurrentPin(value); break;
            case 'new': setNewPin(value); break;
            case 'confirm': setConfirmPin(value); break;
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
        if (step === 'current') {
            if (!storedPinHash) {
                setError(t('security.pinNotFound'));
                setCurrentPin('');
                return;
            }

            const enteredHash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                pin
            );

            if (enteredHash === storedPinHash) {
                setStep('new');
            } else {
                Vibration.vibrate(200);
                setError(t('security.incorrectPin'));
                setCurrentPin('');
            }
        } else if (step === 'new') {
            setStep('confirm');
        } else if (step === 'confirm') {
            if (pin === newPin) {
                await saveNewPin();
            } else {
                Vibration.vibrate(200);
                setError(t('security.pinMismatch'));
                setConfirmPin('');
            }
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
                t('security.pinChanged'),
                [{ text: t('common.ok'), onPress: () => router.back() }]
            );
        } catch (err) {
            console.error('Error saving PIN:', err);
            Alert.alert(t('common.error'), t('security.pinChangeFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        switch (step) {
            case 'current': return t('security.enterCurrentPin');
            case 'new': return t('security.enterNewPin');
            case 'confirm': return t('security.confirmNewPin');
        }
    };

    const getSubtitle = () => {
        switch (step) {
            case 'current': return t('security.verifyIdentity');
            case 'new': return t('security.chooseNewPin');
            case 'confirm': return t('security.reenterNewPin');
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

    const steps: Step[] = ['current', 'new', 'confirm'];
    const currentStepIndex = steps.indexOf(step);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#48BB78" />
                <Text style={[styles.loadingText, { fontSize: fontSize.medium }]}>
                    {t('security.savingPin')}
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={28} color="black" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {steps.map((s, index) => (
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

                {/* Title */}
                <Text style={[styles.title, { fontSize: fontSize.xlarge }]}>
                    {getTitle()}
                </Text>
                <Text style={[styles.subtitle, { fontSize: fontSize.medium }]}>
                    {getSubtitle()}
                </Text>

                {/* Error Message */}
                {error ? (
                    <Text style={[styles.errorText, { fontSize: fontSize.small }]}>
                        {error}
                    </Text>
                ) : null}

                {/* PIN Dots */}
                {renderPinDots()}

                {/* Numpad */}
                {renderNumpad()}
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
        backgroundColor: '#48BB78',
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
        backgroundColor: '#48BB78',
    },
    title: {
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        color: '#6B7280',
        marginBottom: 32,
    },
    errorText: {
        color: '#EF4444',
        marginBottom: 16,
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
});
