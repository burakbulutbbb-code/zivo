import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { connect } from '../services/signaling';

const COUNTRIES_ME = ['Türkiye', 'Azerbaycan', 'Almanya', 'Diğer'];
const COUNTRIES_TARGET = ['🌍 Tüm Dünya', '🇹🇷 Türkiye', '🇦🇿 Azerbaycan', '🇩🇪 Almanya'];

export default function HomeScreen({ navigation }) {
  const [country, setCountry] = useState('🌍 Tüm Dünya');     // kiminle: ülke hedefi
  const [gender, setGender] = useState('Herkes');             // kiminle: cinsiyet hedefi
  const [myGender, setMyGender] = useState(null);             // ben: cinsiyet
  const [myCountry, setMyCountry] = useState('Türkiye');      // ben: ülke
  const [online, setOnline] = useState(0);
  const [ageOk, setAgeOk] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const socket = connect();
    const onOnline = (count) => setOnline(count);
    socket.on('online', onOnline);
    return () => socket.off('online', onOnline);
  }, []);

  function startChat() {
    if (!myGender || !ageOk) return;
    navigation.navigate('VideoCall', {
      country,
      targetGender: gender,
      myGender,
      myCountry,
    });
  }

  const ready = !!myGender && ageOk;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D1B" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* LOGO */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>Z</Text>
          </View>
          <Text style={styles.logoText}>ZIVO</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{online > 0 ? `${online} ÇEVRİMİÇİ` : 'CANLI'}</Text>
          </View>
        </View>

        {/* ANA BAŞLIK */}
        <View style={styles.hero}>
          <Text style={styles.globe}>🌍</Text>
          <Text style={styles.title}>
            Dünyayla{'\n'}
            <Text style={styles.purple}>Tanışmaya Hazır mısın?</Text>
          </Text>
          <Text style={styles.subtitle}>
            Yeni insanlarla tanış, sohbet et ve{'\n'}
            dünyanın her yerinden arkadaşlar edin.
          </Text>
        </View>

        {/* KULLANICI KARTI */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>😊  Senin Bilgilerin</Text>
          <View style={styles.row}>
            {['Erkek', 'Kadın'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.genderOption, myGender === item && styles.selectedOption]}
                onPress={() => setMyGender(item)}
              >
                <Text style={[styles.optionText, myGender === item && styles.selectedText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>
            {COUNTRIES_ME.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.option, myCountry === item && styles.selectedOption]}
                onPress={() => setMyCountry(item)}
              >
                <Text style={[styles.optionText, myCountry === item && styles.selectedText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>🌎  Kiminle Tanışmak İstersin?</Text>
          <View style={styles.row}>
            {COUNTRIES_TARGET.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.option, country === item && styles.selectedOption]}
                onPress={() => setCountry(item)}
              >
                <Text style={[styles.optionText, country === item && styles.selectedText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>👥  Cinsiyet Filtresi</Text>
          <View style={styles.row}>
            {['Herkes', 'Erkek', 'Kadın'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.genderOption, gender === item && styles.selectedOption]}
                onPress={() => setGender(item)}
              >
                <Text style={[styles.optionText, gender === item && styles.selectedText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SOHBETE BAŞLA */}
          <TouchableOpacity
            style={[styles.startButton, !ready && styles.startButtonDisabled]}
            onPress={startChat}
          >
            <Text style={styles.startButtonText}>📹  GÖRÜNTÜLÜ SOHBETE BAŞLA</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ageRow} onPress={() => setAgeOk(!ageOk)}>
            <View style={[styles.checkbox, ageOk && styles.checkboxOn]}>
              {ageOk && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.ageText}>
              18 yaşından büyüğüm ve{' '}
              <Text style={styles.ageLink} onPress={() => setShowTerms(true)}>Kullanım Şartları</Text>
              'nı kabul ediyorum.
            </Text>
          </TouchableOpacity>

          {showTerms && (
            <View style={styles.termsBox}>
              <Text style={styles.termsText}>
                ZIVO 18+ kullanıcılar içindir. Çıplaklık, taciz ve uygunsuz davranışlar yasaktır.
                Uygunsuz kullanıcıları 🚩 ile raporlayabilirsin. Kişisel bilgilerini (adres, telefon)
                kimseyle paylaşma.
              </Text>
              <TouchableOpacity onPress={() => setShowTerms(false)} style={styles.termsClose}>
                <Text style={styles.termsCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          )}

          {!ready && (
            <Text style={styles.hint}>
              Başlamak için cinsiyetini seçmeli ve 18+ onayını işaretlemelisin.
            </Text>
          )}
        </View>

        {/* ÖZELLİKLER */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>Hızlı</Text>
            <Text style={styles.featureText}>Kolay bağlantı</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🌎</Text>
            <Text style={styles.featureTitle}>Global</Text>
            <Text style={styles.featureText}>Dünya çapında</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureTitle}>Güvenli</Text>
            <Text style={styles.featureText}>Güvenlik odaklı</Text>
          </View>
        </View>

        {/* ALT BİLGİ */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ZIVO © 2026</Text>
          <Text style={styles.footerSubtext}>Yeni insanlarla tanışmanın yeni yolu.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D1B' },
  content: { paddingHorizontal: 20, paddingBottom: 35 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 22 },
  logoBox: {
    width: 42, height: 42, backgroundColor: '#7857FF', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  logoIcon: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  logoText: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', letterSpacing: 3 },
  onlineBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#172A2A',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 'auto',
  },
  onlineDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#43E6A1', marginRight: 5 },
  onlineText: { color: '#43E6A1', fontSize: 10, fontWeight: 'bold' },
  hero: { alignItems: 'center', paddingTop: 15, paddingBottom: 28 },
  globe: { fontSize: 75, marginBottom: 15 },
  title: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', textAlign: 'center', lineHeight: 40 },
  purple: { color: '#9479FF' },
  subtitle: { color: '#9AA4BC', fontSize: 14, textAlign: 'center', lineHeight: 23, marginTop: 14 },
  card: {
    backgroundColor: '#12182A', borderColor: '#252D45', borderWidth: 1,
    borderRadius: 24, padding: 19,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 13, marginTop: 5 },
  row: { flexDirection: 'row', marginBottom: 15, gap: 8 },
  option: {
    flex: 1, paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A2238', borderRadius: 12, borderWidth: 1, borderColor: '#2A3450',
  },
  genderOption: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    backgroundColor: '#1A2238', borderRadius: 12, borderWidth: 1, borderColor: '#2A3450',
  },
  selectedOption: { backgroundColor: '#29204F', borderColor: '#9479FF' },
  optionText: { color: '#B5BED2', fontSize: 12, fontWeight: '600' },
  selectedText: { color: '#FFFFFF' },
  startButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#7857FF', borderRadius: 15, paddingVertical: 19,
    paddingHorizontal: 10, marginTop: 6, elevation: 5,
  },
  startButtonDisabled: { backgroundColor: '#3A3450' },
  startButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
  buttonArrow: { color: '#FFFFFF', fontSize: 22, marginLeft: 8, fontWeight: 'bold' },
  hint: { color: '#8E9AB5', fontSize: 11, textAlign: 'center', marginTop: 10 },
  ageRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#4A5470',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A2238',
  },
  checkboxOn: { backgroundColor: '#7857FF', borderColor: '#7857FF' },
  checkmark: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  ageText: { color: '#8E9AB5', fontSize: 12, flex: 1, lineHeight: 18 },
  ageLink: { color: '#9479FF', fontWeight: 'bold' },
  termsBox: {
    backgroundColor: '#1A2238', borderRadius: 12, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: '#2A3450',
  },
  termsText: { color: '#AAB4CC', fontSize: 12, lineHeight: 19 },
  termsClose: {
    marginTop: 10, alignSelf: 'flex-end', backgroundColor: '#303A53',
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 9,
  },
  termsCloseText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  features: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  feature: {
    width: '31%', backgroundColor: '#12182A', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#202A42',
  },
  featureIcon: { fontSize: 24, marginBottom: 9 },
  featureTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  featureText: { color: '#8E9AB5', fontSize: 10, marginTop: 5, textAlign: 'center' },
  footer: { alignItems: 'center', marginTop: 28 },
  footerText: { color: '#9479FF', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  footerSubtext: { color: '#77829B', fontSize: 11, marginTop: 7 },
});
