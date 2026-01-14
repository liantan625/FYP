import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

export default function HumanPlannerScreen() {
    const router = useRouter();
    const fontSize = useScaledFontSize();
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [topic, setTopic] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name || !phone || !topic) {
            Alert.alert(t('common.error'), t('signup.fillAllFields'));
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            Alert.alert(
                t('common.success'),
                t('humanPlanner.successMessage'),
                [
                    { text: t('profile.ok'), onPress: () => router.back() }
                ]
            );
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    accessible={true}
                    accessibilityLabel={t('common.back')}
                    accessibilityRole="button"
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>
                    {t('humanPlanner.title')}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.introCard}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="person-pin" size={40} color="#059669" />
                        </View>
                        <Text style={[styles.introTitle, { fontSize: fontSize.large }]}>
                            {t('humanPlanner.introTitle')}
                        </Text>
                        <Text style={[styles.introText, { fontSize: fontSize.medium }]}>
                            {t('humanPlanner.introDesc')}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={[styles.label, { fontSize: fontSize.medium }]}>
                            {t('humanPlanner.fullName')}
                        </Text>
                        <TextInput
                            style={[styles.input, { fontSize: fontSize.medium }]}
                            placeholder={t('humanPlanner.fullNamePlaceholder')}
                            placeholderTextColor="#9CA3AF"
                            value={name}
                            onChangeText={setName}
                            accessible={true}
                            accessibilityLabel={t('humanPlanner.fullName')}
                        />

                        <Text style={[styles.label, { fontSize: fontSize.medium }]}>
                            {t('humanPlanner.phoneNumber')}
                        </Text>
                        <TextInput
                            style={[styles.input, { fontSize: fontSize.medium }]}
                            placeholder={t('humanPlanner.phonePlaceholder')}
                            placeholderTextColor="#9CA3AF"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            accessible={true}
                            accessibilityLabel={t('humanPlanner.phoneNumber')}
                        />

                        <Text style={[styles.label, { fontSize: fontSize.medium }]}>
                            {t('humanPlanner.topicLabel')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.topicButton, topic === 'Retirement' && styles.topicSelected]}
                            onPress={() => setTopic('Retirement')}
                            accessible={true}
                            accessibilityLabel={t('humanPlanner.topicRetirement')}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.topicText, { fontSize: fontSize.medium }, topic === 'Retirement' && styles.topicTextSelected]}>
                                {t('humanPlanner.topicRetirement')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.topicButton, topic === 'Investment' && styles.topicSelected]}
                            onPress={() => setTopic('Investment')}
                            accessible={true}
                            accessibilityLabel={t('humanPlanner.topicInvestment')}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.topicText, { fontSize: fontSize.medium }, topic === 'Investment' && styles.topicTextSelected]}>
                                {t('humanPlanner.topicInvestment')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.topicButton, topic === 'Debt' && styles.topicSelected]}
                            onPress={() => setTopic('Debt')}
                            accessible={true}
                            accessibilityLabel={t('humanPlanner.topicDebt')}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.topicText, { fontSize: fontSize.medium }, topic === 'Debt' && styles.topicTextSelected]}>
                                {t('humanPlanner.topicDebt')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.topicButton, topic === 'Other' && styles.topicSelected]}
                            onPress={() => setTopic('Other')}
                            accessible={true}
                            accessibilityLabel={t('humanPlanner.topicOther')}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.topicText, { fontSize: fontSize.medium }, topic === 'Other' && styles.topicTextSelected]}>
                                {t('humanPlanner.topicOther')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        accessible={true}
                        accessibilityLabel={t('humanPlanner.requestSession')}
                        accessibilityRole="button"
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={[styles.submitButtonText, { fontSize: fontSize.medium }]}>
                                {t('humanPlanner.requestSession')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    introCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    introTitle: {
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    introText: {
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        gap: 12,
    },
    label: {
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
        marginTop: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#1F2937',
        minHeight: 48,
    },
    topicButton: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#fff',
        minHeight: 48,
        justifyContent: 'center',
    },
    topicSelected: {
        backgroundColor: '#ECFDF5',
        borderColor: '#059669',
    },
    topicText: {
        color: '#374151',
        textAlign: 'center',
        fontWeight: '500',
    },
    topicTextSelected: {
        color: '#059669',
        fontWeight: '700',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    submitButton: {
        backgroundColor: '#059669',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        minHeight: 52,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
