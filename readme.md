# 🎮 Pixel Task Quest

**Work Hard, Level Up, and Don't Break the Streak!**

---

## 📌 1. Project Overview

**Pixel Task Quest** adalah aplikasi planner pribadi yang menggabungkan produktivitas dengan elemen RPG klasik. Aplikasi ini dirancang khusus untuk developer yang aktif bekerja di malam hari (20:00 - 01:00), dengan sistem notifikasi agresif ("nagging") dan mekanisme streak untuk menjaga konsistensi.

---

## 🚀 2. Key Features

### 🖥️ Floating HUD (Desktop)

* Widget transparan (Electron)
* Always-on-top
* Menampilkan status task & progress secara real-time

### ⏰ Hourly Nagging System

* Notifikasi setiap jam
* Karakter pixel akan “mengingatkan” user agar tetap fokus

### 🔄 Trinity Sync

* Sinkronisasi real-time antara:

  * Web (Next.js)
  * Desktop (Electron)
  * Mobile (Flutter)

### 🎯 RPG Gamification

* Level & Experience (XP)
* Daily streak system
* Loot / reward berbasis konsistensi

### 🎨 Pixel Art Aesthetic

* UI bergaya retro 8-bit
* Visual ringan tapi informatif

---

## 🏗️ 3. Tech Stack

| Layer        | Technology                    |
| ------------ | ----------------------------- |
| Backend      | Node.js, Express.js           |
| Database     | MongoDB / PostgreSQL          |
| Desktop      | Electron.js + React / Next.js |
| Mobile       | Flutter                       |
| Realtime     | Socket.io                     |
| Notification | Firebase Cloud Messaging      |
| Scheduler    | node-cron                     |

---

## 🛠️ 4. Development Roadmap

### 🔹 Phase 1: Backend Foundation

* Setup Express server
* Integrasi database
* API CRUD untuk Quest
* Implementasi `node-cron` (20:00 - 01:00 window)
* Setup Firebase Admin SDK

---

### 🔹 Phase 2: Desktop Widget (HUD)

* Setup Electron + React
* Window configuration:

  ```js
  {
    transparent: true,
    frame: false,
    alwaysOnTop: true
  }
  ```
* Integrasi Socket.io client
* Implementasi UI pixel (HUD, HP bar, Quest list)

---

### 🔹 Phase 3: Mobile App

* Setup Flutter project
* Integrasi Firebase Messaging
* UI Quest list (retro theme)
* Action: Complete Quest → API backend

---

### 🔹 Phase 4: Gamification System

* Streak calculation logic
* Reset mekanisme jika absen
* Loot system (reward tiap milestone)
* Tambahan sound effect 8-bit

---

## 🎨 5. Design Guidelines

### Font

* Press Start 2P
* Silkscreen

### Color Palette

| Element          | Color                  |
| ---------------- | ---------------------- |
| Background       | `#1a1a1a`              |
| Primary Accent   | `#39FF14` (Neon Green) |
| Secondary Accent | `#00FFFF` (Cyan)       |

### Asset

* Sprite ukuran **32x32 px**
* Gaya pixel art retro

---

## ⚡ Philosophy

> “Consistency is the real grind. Build the core first, polish later.”

Mulai dari backend yang solid, baru lanjut ke visual dan gamifikasi.

---

## 🧩 Future Improvements

* Achievement system
* Multiplayer accountability (party system)
* AI-based productivity suggestion
* Theme customization (dark/light pixel mode)

---

## 🧙 Final Note

Selamat datang di perjalananmu, **Hero**.
Jaga streak-mu, kumpulkan XP, dan jangan sampai kalah sama rasa malas.

**Stay focused. Stay grinding. Level up.**
