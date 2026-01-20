import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
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
  categoryKey: string; // Use key instead of translated text
  readTime: string;
  summary: string;
  content: string;
  sourceUrl?: string;
}

// Articles with category keys for proper filtering
const ARTICLES: Article[] = [
  // Retirement Articles
  {
    id: '1',
    title: 'Age 55 & 60 Withdrawal (KWSP Official Guide)',
    emoji: '🏦',
    categoryKey: 'retirement',
    readTime: '5 min',
    summary: 'Panduan rasmi KWSP mengenai pengeluaran Umur 55 & 60 Tahun.',
    content: `Pengeluaran Umur 55 Tahun:
Ahli boleh mengeluarkan semua simpanan dalam Akaun 1 & 2 apabila mencapai umur 55 tahun.

Pengeluaran Umur 60 Tahun:
Ahli boleh mengeluarkan semua simpanan dalam Akaun Emas (simpanan selepas umur 55) apabila mencapai umur 60 tahun.

Pilihan Pengeluaran:
1. Pengeluaran Penuh (Lump Sum)
2. Pengeluaran Sebahagian
3. Pengeluaran Berkala (Bulanan)
4. Dividen Tahunan Sahaja

Syarat Kelayakan:
• Warganegara Malaysia & Bukan Warganegara
• Mencapai umur 55 atau 60 tahun
• Mempunyai simpanan dalam KWSP

Cara Memohon:
• Melalui i-Akaun (Online)
• Di Kaunter KWSP
• Melalui Pos`,
    sourceUrl: 'https://www.kwsp.gov.my/en/member/life-stages/age-55-60-withdrawal',
  },
  {
    id: '2',
    title: 'Retirement Planning in Malaysia: Essential Tips',
    emoji: '🎯',
    categoryKey: 'retirement',
    readTime: '6 min',
    summary: 'Tips penting untuk merancang masa depan kewangan yang selamat di Malaysia.',
    content: `Merancang persaraan adalah kritikal memandangkan jangka hayat rakyat Malaysia yang semakin meningkat.

Tips Utama:
1. Mulakan Awal: Kuasa faedah kompaun sangat besar jika anda mula muda.
2. Tahu Nombor Anda: Kira berapa banyak yang anda perlukan. Pesara bandar mungkin memerlukan RM2,500+ sebulan untuk kehidupan asas.
3. Jangan Bergantung Hanya Pada KWSP: Ramai ahli KWSP kehabisan simpanan dalam masa 5 tahun selepas bersara.
4. Perlindungan Insurans/Takaful: Kos perubatan meningkat dengan usia. Pastikan anda dilindungi.
5. Langsaikan Hutang: Cuba masuk alam persaraan tanpa hutang rumah atau kereta.

Pelbagaikan Portfolio:
• ASB/Tabung Haji
• PRS (Skim Persaraan Swasta)
• Hartanah
• Pelaburan berisiko rendah`,
    sourceUrl: 'https://www.prudential.com.my/en/insurance-101/all-stories/-retirement-planning-malaysia/',
  },

  // Budget Articles  
  {
    id: '3',
    title: 'The 50/30/20 Budget Rule For Malaysians',
    emoji: '📊',
    categoryKey: 'budget',
    readTime: '3 min',
    summary: 'Peraturan bajet mudah: 50% Keperluan, 30% Kehendak, 20% Simpanan.',
    content: `Peraturan 50/30/20 adalah panduan mudah untuk menguruskan gaji bersih anda (selepas tolak KWSP/SOCSO/Cukai).

50% - Keperluan (Needs):
Perkara yang anda tidak boleh hidup tanpanya.
• Sewa/Pinjaman Rumah
• Pinjaman Kereta
• Barangan Runcit Asas
• Utiliti (Elektrik, Air)
• Insurans

30% - Kehendak (Wants):
Perkara yang menjadikan hidup lebih seronok tetapi bukan keperluan asas.
• Makan Luar Mewah
• Hiburan (Wayang, Konsert)
• Percutian
• Gajet & Hobi
• Langganan (Netflix, Spotify)

20% - Simpanan & Hutang (Savings & Debt):
Membayar diri anda sendiri & masa depan.
• Simpanan Kecemasan
• Pelaburan (ASB, StashAway)
• Bayaran Lebih Hutang Kad Kredit
• Simpanan Persaraan Tambahan (PRS)

Sesuaikan peratusan ini mengikut situasi kewangan anda sendiri.`,
    sourceUrl: 'https://ringgitplus.com/en/blog/the-experts-corner/the-50-30-20-budget-rule-for-malaysians.html',
  },
  {
    id: '4',
    title: 'Apa Rahsia Pengurusan Bajet yang Betul?',
    emoji: '📝',
    categoryKey: 'budget',
    readTime: '4 min',
    summary: 'Panduan AIA mengenai cara menguruskan bajet harian dan bulanan dengan berkesan.',
    content: `Pengurusan bajet yang betul bukan bermaksud menyekat semua keseronokan, tetapi berbelanja dengan bijak.

Langkah-langkah Membuat Bajet:
1. Rekodkan Pendapatan Bersih: Gaji bawa pulang + pendapatan sampingan.
2. Jejak Perbelanjaan: Tulis setiap sen yang dibelanjakan selama sebulan.
3. Tetapkan Matlamat: Apa yang anda mahu capai? (Rumah, Kahwin, Kereta).
4. Buat Pelan: Peruntukkan wang untuk setiap kategori.
5. Semak & Ubah Suai: Bajet bukan statik. Ubah jika perlu.

Tips Tambahan:
• Bayar Diri Dahulu: Asingkan simpanan sebaik sahaja gaji masuk.
• Gunakan Tunai: Untuk kategori seperti makan tengah hari atau hiburan untuk elak belanja lebih.
• Tunggu 24 Jam: Untuk pembelian impulse barang mahal.

Ingat, bajet memberi anda kebebasan untuk berbelanja tanpa rasa bersalah!`,
    sourceUrl: 'https://www.aia.com.my/bm/knowledge-hub/plan-well/apa-rahsia-pengurusan-bajet-yang-betul.html',
  },

  // Savings Articles
  {
    id: '5',
    title: 'Emergency Fund: Why Every Malaysian Needs One',
    emoji: '🛡️',
    categoryKey: 'savings',
    readTime: '4 min',
    summary: 'Mengapa Dana Kecemasan penting dan berapa banyak yang perlu disimpan.',
    content: `Dana kecemasan adalah "bantal penyelamat" kewangan anda apabila perkara tidak diingini berlaku.

Kenapa Perlu Ada?
• Kehilangan Pekerjaan: Ekonomi tidak menentu.
• Kecemasan Perubatan: Kos rawatan boleh tinggi.
• Kerosakan Kereta/Rumah: Pembaikan yang tidak dijangka.

Berapa Banyak Cukup?
• Minimum: 3 bulan perbelanjaan sara hidup.
• Ideal: 6 bulan perbelanjaan sara hidup.
• Freelancer/Peniaga: 12 bulan (kerana pendapatan tidak tetap).

Di Mana Simpan?
Tempat yang mudah cair (mudah dikeluarkan) tetapi selamat.
• Akaun Simpanan High-Yield
• Tabung Haji
• ASB (Amanah Saham Bumiputera)

Jangan simpan dalam saham atau hartanah kerana sukar dicairkan segera atau nilainya mungkin jatuh semasa anda memerlukannya.`,
    sourceUrl: 'https://www.sunlifemalaysia.com/life-moments/bright-facts/emergency-fund-why-every-malaysian-needs-one/',
  },
  {
    id: '6',
    title: 'Small Steps You Can Take To Reach Your Saving Goals',
    emoji: '👣',
    categoryKey: 'savings',
    readTime: '3 min',
    summary: 'Langkah kecil yang boleh diambil untuk mencapai matlamat simpanan besar (PIDM).',
    content: `Menyimpan wang tidak semestinya drastik. Langkah kecil yang konsisten lebih berkesan.

1. Mula Kecil:
Simpan RM5 sehari. Setahun = RM1,825. Cukup untuk dana kecemasan permulaan.

2. Automatikkan Simpanan:
Set "standing instruction" supaya wang dipindahkan ke akaun simpanan sebaik gaji masuk. Apa yang anda tak nampak, anda tak belanja.

3. Semak Langganan:
Batalkan gym membership yang tak pergi, atau pakej TV yang tak ditonton.

4. Bawa Bekal:
Masak di rumah boleh jimat RM10-RM15 sehari berbanding makan di luar.

5. Tetapkan Matlamat Visual:
Letak gambar matlamat (rumah/kereta/percutian) di tempat yang anda selalu nampak untuk motivasi.

Matlamat Simpanan Jangka Pendek:
• Percutian
• Gajet
• Dana Kecemasan`,
    sourceUrl: 'https://www.pidm.gov.my/my/general/info-corner/editorials/article/small-steps-you-can-take-to-reach-your-saving-goals',
  },

  // Investment Articles
  {
    id: '7',
    title: 'How To Start Investing | Investment For Beginners',
    emoji: '📈',
    categoryKey: 'investment',
    readTime: '6 min',
    summary: 'Panduan HSBC tentang asas pelaburan dan cara memulakannya.',
    content: `Melabur adalah cara untuk kembangkan wang anda melawan inflasi.

Langkah Sebelum Melabur:
1. Pastikan ada Dana Kecemasan (3-6 bulan).
2. Langsaikan hutang faedah tinggi (Kad Kredit).
3. Tentukan profil risiko anda (Konservatif, Sederhana, Agresif).

Konsep Asas:
• Risiko vs Pulangan: Risiko tinggi biasanya potensi pulangan lebih tinggi.
• Diversifikasi: Jangan letak semua telur dalam satu bakul.
• Jangka Masa: Melabur adalah untuk jangka panjang (5+ tahun).

Kelas Aset Utama:
• Tunai/Deposit Tetap (FD): Risiko rendah, pulangan rendah.
• Bon/Sukuk: Pinjaman kepada kerajaan/syarikat.
• Saham (Equities): Pemilikan dalam syarikat. Risiko & pulangan tinggi.
• Hartanah: Fizikal atau REITs.

Mula dengan jumlah kecil dan konsisten (Dollar Cost Averaging).`,
    sourceUrl: 'https://www.hsbc.com.my/financial-wellbeing/how-to-start-investing/',
  },
  {
    id: '8',
    title: 'Unit Trusts in Malaysia: Types, Benefits & How to Invest',
    emoji: '📊',
    categoryKey: 'investment',
    readTime: '5 min',
    summary: 'Semua tentang Amanah Saham (Unit Trust) di Malaysia.',
    content: `Unit Trust (Amanah Saham) mengumpul wang dari ramai pelabur untuk dilaburkan oleh pengurus dana profesional.

Jenis Unit Trust:
• Ekuiti: Melabur dalam saham pasaran (Risiko Tinggi).
• Bon: Melabur dalam sekuriti pendapatan tetap (Risiko Sederhana).
• Pasaran Wang (Money Market): Melabur dalam deposit jangka pendek (Risiko Rendah).
• Seimbang (Balanced): Gabungan ekuiti dan bon.

Kelebihan:
1. Diversifikasi Segera: Dengan modal kecil, anda memiliki portfolio pelbagai.
2. Pengurusan Profesional: Pakar uruskan pelaburan anda.
3. Kecairan (Liquidity): Boleh jual balik unit bila-bila masa.
4. Mampu Milik: Boleh mula dengan RM100 atau RM1,000.

Cara Melabur:
• Melalui Ejen Unit Trust (CWA, Public Mutual, dll).
• Melalui Bank.
• Platform Online (FSMOne, eUnittrust).

Fahami caj-caj terlibat: Caj jualan (Sales charge), Yuran pengurusan tahunan, dll.`,
    sourceUrl: 'https://www.sc.com/my/investments/wealthinsights/everything-about-unit-trusts/',
  },

  // Debt Management Articles
  {
    id: '9',
    title: 'Debt Management with AKPK',
    emoji: '🤝',
    categoryKey: 'debt',
    readTime: '4 min',
    summary: 'Bantuan pengurusan hutang percuma daripada AKPK untuk rakyat Malaysia.',
    content: `AKPK (Agensi Kaunseling dan Pengurusan Kredit) ditubuhkan oleh Bank Negara Malaysia untuk bantu individu urus hutang.

Perkhidmatan Utama AKPK:
1. Kaunseling Kewangan: Nasihat percuma tentang bajet dan pengurusan wang.
2. Program Pengurusan Kredit (PPK/DMP): Membantu menstruktur semula pinjaman bank jika anda sukar bayar.

Siapa Layak PPK?
• Mempunyai pinjaman dengan institusi kewangan terpilih.
• Belum diisytiharkan muflis.
• Mempunyai pendapatan boleh guna (selepas tolak perbelanjaan) untuk bayar ansuran baru.
• Hutang tidak melebihi RM5 juta.

Manfaat PPK:
• Satu bayaran bulanan terkonsolidasi.
• Tempoh bayaran dipanjangkan (ansuran rendah).
• Tiada gangguan daripada pemungut hutang (jika bayar ikut jadual).

Jika anda rasa sesak nafas dengan hutang, jangan tunggu. Hubungi AKPK segera. Perkhidmatan adalah PERCUMA.`,
    sourceUrl: 'https://www.akpk.org.my/debt-management',
  },
  {
    id: '10',
    title: '5 Credit Card Tips For Malaysian Fresh Graduates',
    emoji: '💳',
    categoryKey: 'debt',
    readTime: '4 min',
    summary: 'Tips penggunaan kad kredit bijak untuk mengelak perangkap hutang.',
    content: `Kad kredit adalah alat kewangan hebat jika digunakan betul, tetapi bencana jika salah guna.

1. Bayar Penuh Setiap Bulan:
Ini peraturan emas. Jika anda guna RM500, bayar RM500. Elak caj faedah (15-18% setahun!).

2. Jangan Anggap Sebagai "Duit Lebih":
Kad kredit bukan tambahan kepada gaji anda. Ia adalah pinjaman sementara.

3. Kumpul Skor Kredit (CCRIS):
Penggunaan yang baik membina rekod CCRIS yang cantik. Ini bantu lulus loan rumah/kereta masa depan.

4. Pilih Kad Yang Sesuai:
Cari kad "No Annual Fee" atau kad dengan Cashback untuk petrol/groceries. Elak kad premium dengan yuran tinggi untuk permulaan.

5. Jaga Had Penggunaan (Credit Limit Utilization):
Cuba guna bawah 30% daripada limit kad. Contoh: Limit RM5,000, cuba jangan guna lebih RM1,500.

Ingat: Bank untung bila anda bayar lambat atau bayar minimum. Jangan jadi pelanggan kesukaan bank!`,
    sourceUrl: 'https://www.comparehero.my/credit-card/articles/credit-card-tips-fresh-graduates',
  },

  // Daily Savings Articles
  {
    id: '11',
    title: '5 Cara Untuk Jimatkan Belanja Harian Anda & Keluarga',
    emoji: '💰',
    categoryKey: 'saving',
    readTime: '4 min',
    summary: 'Tips praktikal berjimat cermat menghadapi kos sara hidup yang meningkat.',
    content: `Kos sara hidup makin tinggi. Ini cara praktikal untuk jimat:

1. Rancang Menu Mingguan:
Elak bazir makanan dan beli barang dapur ikut list sahaja. Elak makan luar yang mahal.

2. Banding Harga:
Gunakan app (seperti Hargapedia) untuk banding harga barang runcit. Beli jenama pasaraya (Lotus's, Giant brand) yang lebih murah tapi kualiti sama.

3. Jimat Tenaga Elektrik:
• Tutup suis plug bila tak guna (bukan standby).
• Guna aircond pada suhu 24-25°C.
• Guna mesin basuh bila muatan penuh sahaja.

4. Hiburan Percuma/Murah:
Bawa keluarga ke taman rekreasi, perpustakaan, atau piknik. Tak perlu ke mall setiap hujung minggu yang selalunya berakhir dengan belanja besar.

5. DIY Apa Yang Boleh:
Belajar baiki kerosakan kecil rumah di YouTube. Basuh kereta sendiri. Potong rumput sendiri. Ia jimat dan senaman yang baik!`,
    sourceUrl: 'https://siraplimau.com/bimbang-kos-sara-hidup-makin-tinggi-ini-5-cara-untuk-jimatkan-belanja-harian-anda-keluarga/',
  },
  {
    id: '12',
    title: 'Kickstart Your Savings With The 52 Week Challenge',
    emoji: '📅',
    categoryKey: 'saving',
    readTime: '3 min',
    summary: 'Cabaran simpanan 52 minggu yang popular untuk membina tabiat menyimpan.',
    content: `Cabaran 52 Minggu adalah cara menyeronokkan untuk kumpul duit setahun.

Konsep Asas:
Simpan jumlah ikut minggu.
• Minggu 1: RM1
• Minggu 2: RM2
• Minggu 10: RM10
• ...
• Minggu 52: RM52

Jumlah terkumpul setahun: RM1,378!

Variasi untuk Lebih Mencabar:
• Gandakan: RM2, RM4, RM6... (Total RM2,756)
• Terbalik: Mula RM52 minggu pertama, RM51 minggu kedua... (Lebih mudah diperingkat akhir tahun bila banyak belanja).
• Tetap: RM20 atau RM50 seminggu secara konsisten.

Tips Kejayaan:
1. Sediakan balang lutsinar (nampak duit bertambah).
2. Atau "Create Goal" dalam Maybank MAE/CIMB Clicks.
3. Ajak kawan ofis buat sekali untuk motivasi.
4. Jangan skip! Ganti segera jika terlepas.

Duit ini boleh digunakan untuk road tax, insurans kereta, atau belanja raya tahun depan!`,
    sourceUrl: 'https://www.multiply.org.my/en/kickstart-your-savings-with-the-52-week-challenge/',
  },
];

const CATEGORIES = ['all', 'retirement', 'budget', 'savings', 'investment', 'debt', 'saving'];

export default function TipsScreen() {
  const router = useRouter();
  const fontSize = useScaledFontSize();
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Filter using categoryKey instead of translated text
  const filteredArticles = selectedCategory === 'all'
    ? ARTICLES
    : ARTICLES.filter(article => article.categoryKey === selectedCategory);

  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    setModalVisible(true);
  };

  const openSource = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
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
                  {t(`tips.categories.${article.categoryKey}`)}
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
              {selectedArticle ? t(`tips.categories.${selectedArticle.categoryKey}`) : ''}
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
                ⏱️ {selectedArticle?.readTime} {t('tips.readTime')}
              </Text>
            </View>
            <Text style={[styles.modalBody, { fontSize: fontSize.medium }]}>
              {selectedArticle?.content}
            </Text>

            {selectedArticle?.sourceUrl && (
              <TouchableOpacity
                style={styles.sourceButton}
                onPress={() => openSource(selectedArticle?.sourceUrl)}
              >
                <MaterialIcons name="link" size={20} color="#F59E0B" />
                <Text style={[styles.sourceButtonText, { fontSize: fontSize.small }]}>
                  Baca lebih lanjut
                </Text>
              </TouchableOpacity>
            )}
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
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  sourceButtonText: {
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 8,
  },
});
