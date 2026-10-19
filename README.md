# ZIVO — Görüntülü Sohbet Uygulaması (OmeTV tarzı)

Bu proje iki parçadan oluşur:
- **zivo-app/** → React Native (Expo) mobil uygulama
- **server/** → Eşleştirme ve WebRTC sinyalleşme sunucusu (Node.js + Socket.IO)

## Özellikler
- Rastgele görüntülü eşleşme ("Sonraki" butonu)
- Görüntülü konuşurken yazılı sohbet
- Cinsiyet ve ülke filtresi
- Mikrofon/kamera kapama
- Rapor etme sistemi
- Çevrimiçi kullanıcı sayacı

---

## ADIM 1 — Sunucuyu yayınla (ücretsiz)

1. [render.com](https://render.com) hesabı aç (ücretsiz).
2. Bu `server` klasörünü GitHub'a yükle (repo oluştur → dosyaları yükle).
3. Render'da **New → Web Service** → GitHub repo'nu seç.
4. Ayarlar:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** Free
5. Deploy et. Sana bir adres verir: `https://zivo-server-xxxx.onrender.com`
6. Bu adresi kopyala.

## ADIM 2 — Uygulamaya sunucu adresini gir

`src/config.js` dosyasını aç ve şu satırı kendi adresinle değiştir:

```js
export const SERVER_URL = 'https://zivo-server-xxxx.onrender.com';
```

## ADIM 3 — Uygulamayı derle (APK al)

Bilgisayarında:
1. [Node.js](https://nodejs.org) kur (LTS sürümü).
2. Bu klasörde terminal aç:
   ```
   npm install
   npm install -g eas-cli
   ```
3. Expo hesabı aç (ücretsiz): [expo.dev](https://expo.dev) → `eas login` ile giriş yap.
4. APK için test derlemesi:
   ```
   eas build --platform android --profile preview
   ```
   (İlk build ~10-20 dakika sürer, link gelir, APK'yı indirirsin.)
5. APK'yı Android telefonuna atıp kur, test et.

> Not: `react-native-webrtc` Expo Go'da çalışmaz; bu yüzden derleme (EAS) şart. Kodda değişiklik yapınca yeniden build alman gerekir.

## ADIM 4 — Google Play'e yükle (kendi yolunla yayınla)

1. [play.google.com/console](https://play.google.com/console) → 25$ tek seferlik geliştirici hesabı aç.
2. **Uygulama oluştur** → ad: ZIVO → Ücretsiz uygulama.
3. Üretim derlemesi al (AAB formatında, Play bunu ister):
   ```
   eas build --platform android --profile production
   ```
4. Play Console'da: **Üretim → Sürüm oluştur** → indirdiğin `.aab` dosyasını yükle.
5. Gereken formları doldur:
   - **Gizlilik politikası URL'si** (zorunlu — ücretsiz oluştur: app-privacy.io gibi bir servisle; kamera/mikrofon kullandığını belirt)
   - İçerik derecelendirme anketi → 18+ işaretle (rastgele görüntülü sohbet için)
   - Hedef kitle: Yetişkinler
6. Kaydet → İncelemeye gönder (1-7 gün).

### ⚠️ Önemli not (Politika)
Google, rastgele görüntülü sohbet uygulamalarını sıkı inceler. Şunlar şart:
- Uygulamada **Rapor** butonu (✅ var)
- Kullanım şartları / topluluk kuralları ekranı
- Uygunsuz içerik tespitinde ban mekanizması (raporlar sunucuda biriktiriliyor, `server/index.js` içindeki TODO kısmına veritabanı ekleyip çok raporlananı engelleyebilirsin)

## İleride ekleyebileceklerin
- TURN sunucusu (zayıf internetlerde bağlantı kalitesi için — metered.ca ücretsiz TURN verir)
- Hesap/oturum sistemi + kalıcı ban
- Premium filtreler (para kazanma)
