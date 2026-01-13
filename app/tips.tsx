import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useScaledFontSize } from '@/hooks/use-scaled-font';
import { useTranslation } from 'react-i18next';

interface Article {
  id: string;
  title: string;
  emoji: string;
  category: string;
  readTime: string;
  summary: string;
  content: string;
}

const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Cara Mula Menyimpan untuk Persaraan',
    emoji: '🏦',
    category: 'Persaraan',
    readTime: '5 min',
    summary: 'Panduan lengkap untuk memulakan simpanan persaraan anda dari sekarang.',
    content: `Menyimpan untuk persaraan adalah langkah penting yang perlu dimulakan seawal mungkin. Berikut adalah panduan lengkap:

1. Tetapkan Matlamat Persaraan
Tentukan berapa banyak wang yang anda perlukan untuk hidup selesa selepas bersara. Sebagai panduan, anda memerlukan sekurang-kurangnya 2/3 daripada pendapatan terakhir anda.

2. Mulakan dengan KWSP
Pastikan caruman KWSP anda konsisten. Majikan menyumbang 13% dan pekerja 11% daripada gaji bulanan.

3. Tambah dengan PRS
Private Retirement Scheme (PRS) adalah pilihan tambahan yang baik. Anda boleh mendapat pelepasan cukai sehingga RM3,000 setahun.

4. Diversifikasi Pelaburan
Jangan letakkan semua wang dalam satu tempat. Pertimbangkan ASB, unit trust, atau saham.

5. Semak dan Kaji Semula
Semak portfolio persaraan anda setiap tahun dan buat penyesuaian jika perlu.`,
  },
  {
    id: '2',
    title: 'Mengurus Hutang dengan Bijak',
    emoji: '💳',
    category: 'Pengurusan Hutang',
    readTime: '4 min',
    summary: 'Strategi berkesan untuk menguruskan dan menjelaskan hutang anda.',
    content: `Hutang boleh menjadi beban jika tidak diuruskan dengan betul. Berikut adalah strategi untuk mengurus hutang:

1. Senaraikan Semua Hutang
Tulis semua hutang anda termasuk baki, kadar faedah, dan bayaran minimum.

2. Kaedah Snowball
Bayar hutang terkecil dahulu untuk mendapat motivasi, kemudian gunakan wang tersebut untuk hutang seterusnya.

3. Kaedah Avalanche
Bayar hutang dengan kadar faedah tertinggi dahulu untuk menjimatkan wang dalam jangka panjang.

4. Elakkan Hutang Baru
Jangan tambah hutang baru semasa cuba menjelaskan hutang sedia ada.

5. Runding dengan Bank
Jika menghadapi kesukaran, hubungi bank untuk membincangkan pilihan penstrukturan semula.

6. Buat Dana Kecemasan
Simpan RM1,000 sebagai dana kecemasan kecil supaya tidak perlu berhutang untuk perbelanjaan mengejut.`,
  },
  {
    id: '3',
    title: '50/30/20: Formula Bajet Mudah',
    emoji: '📊',
    category: 'Bajet',
    readTime: '3 min',
    summary: 'Pelajari formula bajet popular yang mudah untuk diamalkan.',
    content: `Formula 50/30/20 adalah kaedah bajet yang mudah dan berkesan:

50% - Keperluan
• Sewa/Ansuran rumah
• Utiliti (elektrik, air, internet)
• Makanan asas
• Pengangkutan
• Insurans kesihatan

30% - Kehendak
• Hiburan dan rekreasi
• Makan di luar
• Hobi
• Langganan (Netflix, Spotify)
• Pakaian bukan keperluan

20% - Simpanan & Hutang
• Simpanan kecemasan
• Simpanan persaraan
• Pelaburan
• Bayaran hutang tambahan

Contoh: Gaji RM4,000
• Keperluan: RM2,000
• Kehendak: RM1,200
• Simpanan: RM800

Mulakan dengan formula ini dan sesuaikan mengikut keperluan anda.`,
  },
  {
    id: '4',
    title: 'Dana Kecemasan: Berapa Banyak?',
    emoji: '🛡️',
    category: 'Simpanan',
    readTime: '4 min',
    summary: 'Ketahui berapa banyak dana kecemasan yang anda perlukan.',
    content: `Dana kecemasan adalah simpanan untuk situasi tidak dijangka seperti kehilangan kerja atau kecemasan perubatan.

Berapa Banyak Diperlukan?
• Minimum: 3 bulan perbelanjaan
• Ideal: 6 bulan perbelanjaan
• Lebih selamat: 12 bulan perbelanjaan

Contoh Pengiraan:
Jika perbelanjaan bulanan anda RM3,000:
• Minimum: RM9,000
• Ideal: RM18,000
• Lebih selamat: RM36,000

Di Mana Simpan?
1. Akaun simpanan berasingan
2. Akaun simpanan kadar tinggi
3. Tabung Haji atau ASB (mudah dikeluarkan)

Tips Membina Dana Kecemasan:
• Mulakan dengan RM1,000 sebagai sasaran pertama
• Simpan secara automatik setiap bulan
• Anggap ia sebagai "bil" yang wajib dibayar
• Jangan sentuh kecuali untuk kecemasan sebenar`,
  },
  {
    id: '5',
    title: 'Pelaburan untuk Pemula',
    emoji: '📈',
    category: 'Pelaburan',
    readTime: '6 min',
    summary: 'Panduan asas pelaburan untuk mereka yang baru bermula.',
    content: `Pelaburan adalah cara untuk mengembangkan wang anda. Berikut panduan untuk pemula:

Jenis Pelaburan Popular di Malaysia:

1. ASB (Amanah Saham Bumiputera)
• Untuk Bumiputera sahaja
• Dividen konsisten 4-6% setahun
• Modal dijamin kerajaan
• Minimum RM1

2. Unit Trust
• Diuruskan oleh pengurus dana profesional
• Pelbagai pilihan risiko
• Sesuai untuk pemula

3. Saham
• Pulangan tinggi tetapi risiko tinggi
• Perlu pengetahuan dan kajian
• Minimum pembelian 100 unit

4. REIT (Real Estate Investment Trust)
• Pelaburan hartanah tanpa beli rumah
• Dividen tetap
• Didagangkan di Bursa Malaysia

5. Emas
• Lindung nilai inflasi
• Boleh beli secara fizikal atau digital

Prinsip Asas:
• Mulakan awal
• Diversifikasi portfolio
• Fahami risiko
• Jangan ikut emosi
• Fikir jangka panjang`,
  },
  {
    id: '6',
    title: 'Cara Jimat Belanja Harian',
    emoji: '💰',
    category: 'Penjimatan',
    readTime: '4 min',
    summary: 'Tips praktikal untuk menjimatkan perbelanjaan setiap hari.',
    content: `Penjimatan kecil setiap hari boleh menjadi jumlah besar. Berikut adalah tips:

Makanan & Minuman:
• Bawa bekal ke tempat kerja
• Kurangkan kopi mahal
• Masak di rumah lebih kerap
• Buat senarai sebelum membeli-belah

Pengangkutan:
• Gunakan pengangkutan awam
• Carpool dengan rakan sekerja
• Servis kereta mengikut jadual
• Bandingkan harga petrol

Utiliti:
• Matikan lampu yang tidak digunakan
• Pasang penapis air dan berhenti beli air botol
• Gunakan kipas sebelum aircond
• Tukar ke LED

Langganan:
• Audit langganan bulanan
• Kongsi akaun streaming
• Batalkan yang jarang digunakan

Belanja:
• Tunggu 24 jam sebelum beli barang mahal
• Cari kod diskaun dan promosi
• Beli semasa jualan
• Pertimbangkan barang terpakai

Sasaran: Jimat RM10/hari = RM300/bulan = RM3,600/tahun!`,
  },
];

const CATEGORIES = ['all', 'retirement', 'budget', 'savings', 'investment', 'debt', 'saving'];

export default function TipsScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredArticles = selectedCategory === 'Semua'
    ? ARTICLES
    : ARTICLES.filter(article => article.category === selectedCategory);

  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSize.large }]}>{t('tips.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* Featured Tip */}
        <View style={styles.featuredCard}>
          <Text style={styles.featuredEmoji}>📚</Text>
          <Text style={[styles.featuredTitle, { fontSize: fontSize.medium }]}>
            {t('tips.featured')}
          </Text>
          <Text style={[styles.featuredText, { fontSize: fontSize.small }]}>
            {t('tips.featuredSubtitle')}
          </Text>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { fontSize: fontSize.small },
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {t(`tips.categories.${category}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Articles List */}
        <Text style={[styles.sectionTitle, { fontSize: fontSize.medium }]}>
          {t('tips.articles')} ({filteredArticles.length})
        </Text>

        {filteredArticles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            onPress={() => openArticle(article)}
          >
            <View style={styles.articleLeft}>
              <Text style={styles.articleEmoji}>{article.emoji}</Text>
            </View>
            <View style={styles.articleContent}>
              <View style={styles.articleMeta}>
                <Text style={[styles.articleCategory, { fontSize: fontSize.small }]}>
                  {article.category}
                </Text>
                <Text style={[styles.articleReadTime, { fontSize: fontSize.small }]}>
                  ⏱️ {article.readTime}
                </Text>
              </View>
              <Text style={[styles.articleTitle, { fontSize: fontSize.medium }]}>
                {article.title}
              </Text>
              <Text
                style={[styles.articleSummary, { fontSize: fontSize.small }]}
                numberOfLines={2}
              >
                {article.summary}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Article Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.backButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={[styles.modalCategory, { fontSize: fontSize.small }]}>
              {selectedArticle?.category}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalEmoji}>{selectedArticle?.emoji}</Text>
            <Text style={[styles.modalTitle, { fontSize: fontSize.xlarge }]}>
              {selectedArticle?.title}
            </Text>
            <View style={styles.modalMeta}>
              <Text style={[styles.modalReadTime, { fontSize: fontSize.small }]}>
                ⏱️ {selectedArticle?.readTime} bacaan
              </Text>
            </View>
            <Text style={[styles.modalBody, { fontSize: fontSize.medium }]}>
              {selectedArticle?.content}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  featuredCard: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  featuredEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  featuredTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featuredText: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  categoryText: {
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  articleLeft: {
    marginRight: 14,
  },
  articleEmoji: {
    fontSize: 36,
  },
  articleContent: {
    flex: 1,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  articleCategory: {
    color: '#F59E0B',
    fontWeight: '600',
    marginRight: 10,
  },
  articleReadTime: {
    color: '#94A3B8',
  },
  articleTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  articleSummary: {
    color: '#666',
    lineHeight: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCategory: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  modalEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMeta: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalReadTime: {
    color: '#94A3B8',
  },
  modalBody: {
    color: '#444',
    lineHeight: 28,
  },
});
