import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useScaledFontSize } from '@/hooks/use-scaled-font';

export default function AboutScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const fontSize = useScaledFontSize();

    const handleLinkPress = (url: string) => {
        // In a real app, this would open a URL
        // Linking.openURL(url);
        console.log(`Opening ${url}`);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('about.title')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroSection}>
                    <View style={styles.logoContainer}>
                        <MaterialIcons name="account-balance-wallet" size={48} color="#48BB78" />
                    </View>
                    <Text style={[styles.appName, { fontSize: fontSize.xlarge }]}>DuitU</Text>
                    <Text style={[styles.version, { fontSize: fontSize.medium }]}>{t('about.version')}</Text>
                </View>

                <View style={styles.descriptionSection}>
                    <Text style={[styles.description, { fontSize: fontSize.medium }]}>
                        {t('about.description')}
                    </Text>
                </View>

                <View style={styles.menuSection}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleLinkPress('https://duitu.com')}
                    >
                        <View style={styles.menuItemLeft}>
                            <MaterialIcons name="language" size={24} color="#64748B" />
                            <Text style={[styles.menuItemText, { fontSize: fontSize.medium }]}>{t('about.website')}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleLinkPress('mailto:support@duitu.com')}
                    >
                        <View style={styles.menuItemLeft}>
                            <MaterialIcons name="mail-outline" size={24} color="#64748B" />
                            <Text style={[styles.menuItemText, { fontSize: fontSize.medium }]}>{t('about.contact')}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleLinkPress('https://duitu.com/privacy')}
                    >
                        <View style={styles.menuItemLeft}>
                            <MaterialIcons name="lock-outline" size={24} color="#64748B" />
                            <Text style={[styles.menuItemText, { fontSize: fontSize.medium }]}>{t('about.privacy')}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, styles.menuItemLast]}
                        onPress={() => handleLinkPress('https://duitu.com/terms')}
                    >
                        <View style={styles.menuItemLeft}>
                            <MaterialIcons name="description" size={24} color="#64748B" />
                            <Text style={[styles.menuItemText, { fontSize: fontSize.medium }]}>{t('about.terms')}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.copyright, { fontSize: fontSize.small }]}>
                        {t('about.copyright')}
                    </Text>
                    <Text style={[styles.developer, { fontSize: fontSize.small }]}>
                        {t('about.developer')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        padding: 24,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#48BB78',
    },
    appName: {
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    version: {
        color: '#64748B',
        fontWeight: '500',
    },
    descriptionSection: {
        marginBottom: 32,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    description: {
        color: '#475569',
        textAlign: 'center',
        lineHeight: 24,
    },
    menuSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        color: '#1F2937',
        fontWeight: '600',
        marginLeft: 12,
    },
    footer: {
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 16,
    },
    copyright: {
        color: '#94A3B8',
        marginBottom: 4,
    },
    developer: {
        color: '#94A3B8',
        fontWeight: '500',
    },
});
