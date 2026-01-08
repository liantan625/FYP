import React, { useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

// Notification type icons mapping to MaterialIcons
const getNotificationIcon = (type: string): { name: string; color: string; bgColor: string } => {
  switch (type) {
    case 'asset':
      return { name: 'account-balance-wallet', color: '#48BB78', bgColor: '#E8F5E9' };
    case 'spending':
      return { name: 'shopping-cart', color: '#EF4444', bgColor: '#FEE2E2' };
    case 'reminder':
      return { name: 'notifications', color: '#F59E0B', bgColor: '#FEF3C7' };
    case 'goal':
      return { name: 'flag', color: '#8B5CF6', bgColor: '#EDE9FE' };
    default:
      return { name: 'info', color: '#3B82F6', bgColor: '#DBEAFE' };
  }
};

// Memoized notification item for performance
const NotificationItem = memo(({ item, fontSize }: { item: any; fontSize: any }) => {
  const icon = getNotificationIcon(item.type);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => Alert.alert(item.title, item.message)}
      activeOpacity={0.7}
    >
      {!item.read && <View style={styles.unreadIndicator} />}

      <View style={[styles.iconContainer, { backgroundColor: icon.bgColor }]}>
        <MaterialIcons name={icon.name as any} size={22} color={icon.color} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { fontSize: fontSize.medium }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.time, { fontSize: fontSize.tiny }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>

        <Text style={[styles.message, { fontSize: fontSize.small }]} numberOfLines={2}>
          {item.message}
        </Text>

        {item.amount && (
          <View style={styles.amountRow}>
            <Text style={[
              styles.amount,
              { fontSize: fontSize.medium, color: item.type === 'asset' ? '#48BB78' : '#EF4444' }
            ]}>
              {item.type === 'asset' ? '+' : '-'} RM {Math.abs(item.amount).toFixed(2)}
            </Text>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={[styles.categoryText, { fontSize: fontSize.tiny }]}>
                  {item.category}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function NotificationsScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState<any[]>([]);

  const fetchNotifications = () => {
    const user = auth().currentUser;
    if (!user) return () => { };

    return firestore()
      .collection('users')
      .doc(user.uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => {
        const notifications: any[] = [];
        querySnapshot.forEach(documentSnapshot => {
          notifications.push({
            ...documentSnapshot.data(),
            id: documentSnapshot.id,
          });
        });

        const grouped = groupNotificationsByDate(notifications);
        setSections(grouped);
        setLoading(false);
      }, error => {
        console.error("Error fetching notifications: ", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    const unsubscribe = fetchNotifications();
    return () => unsubscribe();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Re-fetch will happen automatically via listener
    setTimeout(() => setRefreshing(false), 1000);
  };

  const groupNotificationsByDate = (notifications: any[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: any[] } = {
      'today': [],
      'yesterday': [],
      'earlier': [],
    };

    notifications.forEach(notification => {
      if (!notification.createdAt) return;

      const date = notification.createdAt.toDate();
      if (isSameDate(date, today)) {
        groups['today'].push(notification);
      } else if (isSameDate(date, yesterday)) {
        groups['yesterday'].push(notification);
      } else {
        groups['earlier'].push(notification);
      }
    });

    const keyToTranslation: { [key: string]: string } = {
      'today': t('notifications.today'),
      'yesterday': t('notifications.yesterday'),
      'earlier': t('notifications.earlier'),
    };

    return Object.keys(groups)
      .filter(key => groups[key].length > 0)
      .map(key => ({
        title: keyToTranslation[key],
        data: groups[key]
      }));
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const totalUnread = sections.reduce((acc, section) =>
    acc + section.data.filter((item: any) => !item.read).length, 0
  );

  const renderItem = ({ item }: { item: any }) => (
    <NotificationItem item={item} fontSize={fontSize} />
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { fontSize: fontSize.small }]}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#48BB78" />
          <Text style={styles.loadingText}>{t('notifications.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('notifications.title')}</Text>
          {totalUnread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconContainer}>
          <MaterialIcons name="notifications-active" size={28} color="#fff" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={[styles.summaryTitle, { fontSize: fontSize.medium }]}>
            {t('notifications.summaryTitle')}
          </Text>
          <Text style={[styles.summarySubtitle, { fontSize: fontSize.small }]}>
            {t('notifications.summaryStats', {
              count: sections.reduce((acc, s) => acc + s.data.length, 0),
              unread: totalUnread
            })}
          </Text>
        </View>
      </View>

      {/* Notifications List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#48BB78" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons name="notifications-off" size={48} color="#CBD5E1" />
            </View>
            <Text style={[styles.emptyTitle, { fontSize: fontSize.medium }]}>
              {t('notifications.empty')}
            </Text>
            <Text style={[styles.emptySubtitle, { fontSize: fontSize.small }]}>
              {t('notifications.emptySubtitle')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 16,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1F2937',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48BB78',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#48BB78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    marginLeft: 14,
    flex: 1,
  },
  summaryTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  summarySubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  unreadCard: {
    borderLeftWidth: 0,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#48BB78',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  time: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  message: {
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  amount: {
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
  },
  categoryText: {
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});