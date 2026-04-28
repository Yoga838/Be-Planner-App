🎮 Project Document: Pixel Task Quest
"Work Hard, Level Up, and Don't Break the Streak!"

1. Ringkasan Projek
Pixel Task Quest adalah sebuah aplikasi planner pribadi yang menggabungkan fungsi produktivitas dengan elemen RPG (Role Playing Game) klasik. Aplikasi ini didesain khusus untuk developer yang sering bekerja di jam malam (20:00 - 01:00) dengan fitur utama notifikasi yang "bawel" dan sistem streak untuk menjaga konsistensi koding.

Fitur Utama:
Floating HUD (Desktop): Widget melayang di PC (Electron) yang transparan dan always-on-top.

Hourly Nagging: Notifikasi setiap jam dari karakter pixel untuk memastikan user tetap pada jalur.

The Trinity Sync: Sinkronisasi real-time antara Web (Next.js), Desktop (Electron), dan Mobile (Flutter).

RPG Gamification: Sistem Level, XP, dan Loot Item berdasarkan streak harian.

Pixel Art Aesthetic: UI retro 8-bit yang lucu namun informatif.

2. Tech Stack (Arsitektur)
Backend: Node.js & Express.js (Otak pusat & API).

Database: MongoDB / PostgreSQL (Penyimpanan Quest & Stats).

Desktop App: Electron.js + React/Next.js (Widget HUD).

Mobile App: Flutter (Remote control & Push Notif).

Communication: * Socket.io (Real-time update ke PC).

Firebase Cloud Messaging (Push Notif ke HP).

node-cron (Penjadwal notifikasi bawel).

3. Langkah Kerja (Roadmap)
Fase 1: Pondasi (Backend)
Setup server Express dan koneksi Database.

Buat API CRUD untuk manajemen Quest.

Implementasi node-cron untuk pengecekan jam aktif (20:00 - 01:00).

Setup Firebase Admin SDK untuk pengiriman notifikasi.

Fase 2: Visualisasi (Desktop Widget)
Setup project Electron dengan React.

Konfigurasi Window: transparent: true, frame: false, alwaysOnTop: true.

Slicing UI Pixel Art (Karakter, Quest Cards, HP/MP Bar).

Integrasi Socket.io-client untuk menerima update instan dari backend.

Fase 3: Kendali (Mobile App)
Setup project Flutter dan Firebase Messaging.

Buat UI daftar Quest dengan tema warna retro.

Hubungkan fungsi "Complete Quest" ke API Backend.

Fase 4: Gamifikasi (Logic & Polish)
Buat algoritma hitung Streak (reset jika absen di hari yang ditentukan).

Tambahkan fitur Loot Box (item kosmetik pixel) setiap kelipatan streak tertentu.

Pemberian efek suara 8-bit pada notifikasi penting.

4. Desain Guideline
Font: Press Start 2P atau Silkscreen.

Warna Utama: #1a1a1a (Dark), #39FF14 (Neon Green), #00FFFF (Cyan).

Asset: 32x32 Pixel Sprites.

Note dari Pencari Ide: > "Jangan lupa, kuncinya ada di konsistensi. Mulai dari backend yang simpel, baru hias visualnya belakangan. Selamat ngoding, Hero!"