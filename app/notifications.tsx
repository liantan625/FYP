import React from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MOCK_NOTIFICATIONS = {
  today: [
    {
      id: 1,
      type: 'reminder',
      icon: '🔔',
      title: 'Peringatan!',
      message: 'Atur simpanan automatik anda untuk mencapai matlamat simpanan anda.',
      time: '2j',
      isRead: false,
    },
    {
      id: 2,
      type: 'update',
      icon: '⭐',
      title: 'Kemaskini Baru',
      message: 'Ciri baharu kini tersedia untuk meningkatkan pengalaman anda.',
      time: '5j',
      isRead: false,
    }
  ],
  yesterday: [
    {
      id: 3,
      type: 'transaction',
      icon: '💵',
      title: 'Transaksi',
      message: 'Transaksi baru telah direkodkan',
      amount: -100.00,
      category: 'Barangan Runcit | Pantri',
      time: 'Semalam',
      isRead: true,
    },
    {
      id: 4,
      type: 'reminder',
      icon: '🔔',
      title: 'Peringatan!',
      message: 'Atur simpanan automatik anda untuk mencapai matlamat simpanan anda.',
      time: 'Semalam',
      isRead: true,
    }
  ],
  lastWeek: [
    {
      id: 5,
      type: 'insight',
      icon: '📊',
      title: 'Rekod Perbelanjaan',
      message: 'Kami mencadangkan anda lebih peka terhadap kewangan anda.',
      time: '24 April',
      isRead: true,
    },
    {
      id: 6,
      type: 'transaction',
      icon: '💵',
      title: 'Transaksi',
      message: 'Transaksi baru telah direkodkan',
      amount: -70.40,
      category: 'Makanan | Makan Malam',
      time: '24 April',
      isRead: true,
    }
  ]
};

const sections = [
  { title: 'HARI INI', data: MOCK_NOTIFICATIONS.today },
  { title: 'SEMALAM', data: MOCK_NOTIFICATIONS.yesterday },
  { title: 'MINGGU LEPAS', data: MOCK_NOTIFICATIONS.lastWeek },
];

export default function NotificationsScreen() {
  const router = useRouter();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.isRead ? styles.readItem : styles.unreadItem]}
      onPress={() => Alert.alert(item.title, item.message)}
    >
      <Text style={styles.notificationIcon}>{item.icon}</Text>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        {item.amount && <Text style={styles.notificationAmount}>RM {item.amount.toFixed(2)}</Text>}
        {item.category && <Text style={styles.notificationCategory}>{item.category}</Text>}
      </View>
      <Text style={styles.notificationTime}>{item.time}</Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
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
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
      />
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
  },
  readItem: {
    backgroundColor: '#f0f0f0',
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
    color: '#FF6B6B',
    marginTop: 5,
  },
  notificationCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
});