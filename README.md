<div align="center">
  <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop" alt="Movie Catalog Banner" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />

  # 🎬 JAV-Code-web-App

  Sebuah aplikasi web modern untuk mengelola dan menampilkan katalog film dengan antarmuka yang bersih dan responsif.

  ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
  ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

<br />

## 📖 Tentang Proyek

Aplikasi web ini dibangun untuk menyimpan dan menampilkan data film secara terstruktur. Pengguna dapat melihat detail film yang disajikan dalam tata letak yang ramah pengguna (dukungan *Mobile* & *Desktop*), lengkap dengan poster film dan metadata terkait.

### ✨ Fitur Utama
- **Tampilan Detail Komprehensif:** Menampilkan poster film di sisi kiri (desktop) atau atas (mobile) dan informasi detail di sisi lainnya.
- **Informasi Lengkap:** Memuat Kode Film, Judul (Inggris & Jepang), Nama Pemeran, Tanggal Rilis, Rating, dan Sinopsis.
- **Progressive Web App (PWA) Ready:** Dirancang agar dapat diinstal di perangkat *mobile* seperti aplikasi *native*.
- **Database Dinamis:** Terintegrasi dengan **Supabase** (PostgreSQL) untuk manajemen data yang cepat dan aman.

## 🛠️ Tech Stack
- **Frontend:** React.js + Vite
- **Styling:** Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL)

## 🚀 Panduan Instalasi Lokal

### 1. Clone Repositori
```bash
git clone [https://github.com/USERNAME_ANDA/movie-catalog-webapp.git](https://github.com/systemzerodev/JAV-Code-web-App.git)
cd JAV-Code-web-App
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di *root* direktori proyek dan tambahkan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Jalankan Server
```bash
npm run dev
```