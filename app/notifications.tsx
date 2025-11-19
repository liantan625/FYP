import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
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

        // Group notifications by date
        const grouped = groupNotificationsByDate(notifications);
        setSections(grouped);
        setLoading(false);
      }, error => {
        console.error("Error fetching notifications: ", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const groupNotificationsByDate = (notifications: any[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: any[] } = {
      'HARI INI': [],
      'SEMALAM': [],
      'MINGGU LEPAS': [], // Simplified for now, can be expanded
    };

    notifications.forEach(notification => {
      if (!notification.createdAt) return;

      const date = notification.createdAt.toDate();
      if (isSameDate(date, today)) {
        groups['HARI INI'].push(notification);
      } else if (isSameDate(date, yesterday)) {
        groups['SEMALAM'].push(notification);
      } else {
        groups['MINGGU LEPAS'].push(notification);
      }
    });

    // Filter out empty sections and format for SectionList
    return Object.keys(groups)
      .filter(key => groups[key].length > 0)
      .map(key => ({
        title: key,
        data: groups[key]
      }));
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'asset': return '💰';
      case 'spending': return '💸';
      case 'reminder': return '🔔';
      default: return '📢';
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.read ? styles.readItem : styles.unreadItem]}
      onPress={() => Alert.alert(item.title, item.message)}
    >
      <Text style={styles.notificationIcon}>{getIcon(item.type)}</Text>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        {item.amount && (
          <Text style={[styles.notificationAmount, { color: item.type === 'asset' ? '#00D9A8' : '#FF6B6B' }]}>
            RM {Math.abs(item.amount).toFixed(2)}
          </Text>
        )}
        {item.category && <Text style={styles.notificationCategory}>{item.category}</Text>}
      </View>
      <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D9A8" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tiada notifikasi.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#00D9A8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  unreadItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  readItem: {
    backgroundColor: '#f9f9f9',
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  notificationAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  notificationCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});