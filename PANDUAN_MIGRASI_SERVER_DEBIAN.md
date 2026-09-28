# 🚀 PANDUAN LENGKAP MIGRASI MAGANGKU KE SERVER KANTOR (DEBIAN 13 + DOCKER + SUPABASE + CLOUDFLARE)

Dokumen ini merangkum seluruh jawaban atas pertanyaan penting, arsitektur sistem, serta panduan langkah-demi-langkah (Step-by-Step) yang telah diuji bebas eror agar tim IT kantor dapat mengeksekusi setup server secara mandiri hingga tuntas.

---

## 📑 DAFTAR ISI
1. [Rangkuman Pertanyaan & Jawaban Penting](#1-rangkuman-pertanyaan--jawaban-penting)
2. [Arsitektur Sistem (Alur Kerja Server)](#2-arsitektur-sistem-alur-kerja-server)
3. [Fase 1: Persiapan Server Debian 13 Kantor](#fase-1-persiapan-server-debian-13-kantor)
4. [Fase 2: Registrasi GitHub Actions Self-Hosted Runner](#fase-2-registrasi-github-actions-self-hosted-runner)
5. [Fase 3: Menghubungkan Domain via Cloudflare Tunnel](#fase-3-menghubungkan-domain-via-cloudflare-tunnel)
6. [Fase 4: Deployment Supabase Self-Hosted di Kantor (Database & Auth)](#fase-4-deployment-supabase-self-hosted-di-kantor-database--auth)
7. [Fase 5: Migrasi Skema & Data Absensi ke Supabase Kantor](#fase-5-migrasi-skema--data-absensi-ke-supabase-kantor)
8. [Panduan Pemeliharaan & Backup Otomatis Database](#panduan-pemeliharaan--backup-otomatis-database)

---

## 1. RANGKUMAN PERTANYAAN & JAWABAN PENTING

### Q1: Mengapa Proxmox diganti langsung Debian 13 murni?
* **Jawaban**: Proxmox adalah *Type-1 Hypervisor* yang berat dan rumit untuk containerisasi aplikasi web (sering timbul masalah izin *cgroups/nesting* saat menjalankan Docker di dalam container LXC). 
* Dengan **Debian 13 Native**, sistem operasi hanya memakan RAM $\pm$ 200–300 MB saat *idle*. Docker berjalan langsung (*native*) di atas kernel Linux, sehingga performa CPU dan I/O disk menjadi maksimal.

### Q2: Apakah Server Kantor (Aktif 24/7, RAM 8 GB) Kuat Menjalankan Semua Ini?
* **Jawaban**: **Sangat kuat dan ideal!**
  * Debian 13 OS: $\pm$ 300 MB
  * Supabase Full Stack (PostgreSQL, GoTrue Auth, Kong, Realtime, Studio, Storage): $\pm$ 1.8 GB – 2.2 GB
  * Web Frontend MagangKu (Nginx Container): $\pm$ 50 MB
  * GitHub Runner & Cloudflare Tunnel: $\pm$ 100 MB
  * **Total Terpakai**: Hanya sekitar **$\pm$ 2.5 GB**. Masih tersisa **5.5 GB RAM bebas** di server kantor!

### Q3: Kenapa Database Supabase Lebih Baik Ikut Dipindah ke Server Kantor?
* **Jawaban**:
  1. **Privasi & Keamanan Penuh**: 100% data absensi internal kantor, koordinat GPS, foto, dan profil peserta magang tersimpan di fisik server kantor sendiri (tidak bergantung pihak ketiga).
  2. **Tanpa Batas Kuota**: Tidak ada batasan 500 MB (seperti Free Tier cloud). Bebas menyimpan riwayat absensi dan logbook bertahun-tahun sesuai kapasitas harddisk server.
  3. **Biaya 0 Rupiah**: Tidak ada risiko tagihan bulanan langganan cloud.

### Q4: Apakah Fitur Jam Pulang Otomatis Memotong Jam Mahasiswa yang Sedang Lembur?
* **Jawaban**: **TIDAK**. 
  * Proteksi tutup otomatis jam pulang (`(Otomatis)`) **HANYA BERJALAN JIKA HARI SUDAH BERGANTI** (setelah jam 00:00 tengah malam esok harinya).
  * Selama hari masih berjalan, mahasiswa yang lembur sampai jam 18:00, 20:00, atau 22:00 WIB tetap bisa klik Absen Pulang normal di HP-nya dan seluruh jam kerja lembur tercatat riil.

---

## 2. ARSITEKTUR SISTEM (ALUR KERJA SERVER)

```
[ Developer Laptop ]
        │  (git push origin main)
        ▼
[ GitHub Repository ]
        │  (GitHub Webhook / Workflow Event)
        ▼
[ Debian 13: GitHub Self-Hosted Runner ]
        │  1. Pull source code terbaru
        │  2. Build Docker Image (Vite React + Nginx Alpine)
        │  3. Recreate Container MagangKu (Port 8080)
        ▼
[ Docker Containers di Debian 13 ]
   ├── Port 8080 : Web Frontend MagangKu (Nginx)
   ├── Port 8000 : Supabase API Gateway / Auth (Kong)
   └── Port 3000 : Supabase Studio (Database Dashboard)
        ▲
        │  (Koneksi Enkripsi Aman)
[ Cloudflare Tunnel (cloudflared daemon) ]
        ▲
        │  (HTTPS Port 443)
[ Pengguna / HP Mahasiswa di Internet ]
   ├── magang.netmon-bms.my.id  ──► Frontend Web MagangKu
   └── api.netmon-bms.my.id     ──► Supabase Backend & Database (Jika self-host)
```

---

## FASE 1: PERSIAPAN SERVER DEBIAN 13 KANTOR

Jalankan perintah ini di terminal server Debian 13 kantor:

### 1. Update OS & Paket Dasar
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw htop ca-certificates gnupg lsb-release
```

### 2. Install Docker Engine & Docker Compose Terbaru
```bash
# Tambahkan GPG key resmi Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Tambahkan repository Docker Debian 13
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Izinkan user saat ini menjalankan docker tanpa sudo
sudo usermod -aG docker $USER
```
> ⚠️ **PENTING**: Setelah perintah di atas, lakukan logout lalu login kembali ke terminal Debian agar grup docker aktif:
> ```bash
> exit
> ```
> *(Masuk kembali via SSH / Terminal)*

Verifikasi Docker:
```bash
docker --version
docker compose version
```

---

## FASE 2: REGISTRASI GITHUB ACTIONS SELF-HOSTED RUNNER

Jalankan sekali saja di server Debian 13 kantor agar server tersebut terhubung ke repository GitHub:

1. Di GitHub Repository (`https://github.com/alfariz71/magangku`):
   * Buka **Settings** $\rightarrow$ **Actions** $\rightarrow$ **Runners** $\rightarrow$ Tombol hijau **"New self-hosted runner"**.
   * Pilih **OS: Linux** & **Architecture: x64**.
2. Di terminal Debian 13 kantor, jalankan perintah yang tertera di layar GitHub:
   ```bash
   mkdir -p ~/actions-runner && cd ~/actions-runner
   # (Jalankan perintah curl & tar yang diberikan GitHub)
   # (Jalankan ./config.sh --url https://github.com/alfariz71/magangku --token <TOKEN>)
   ```
   *(Tekan ENTER untuk nama runner dan label default)*.
3. **Instal runner sebagai background systemd service** agar otomatis menyala saat server restart:
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   sudo ./svc.sh status
   ```
4. Di halaman GitHub, status runner akan langsung berubah menjadi hijau: **Idle (Connected)**!

---

## FASE 3: MENGHUBUNGKAN DOMAIN VIA CLOUDFLARE TUNNEL

Karena server kantor menggunakan internet umum (tanpa perlu sewa IP publik statis atau buka port router):

### 1. Pasang cloudflared di Debian 13
1. Buka dashboard [Cloudflare Zero Trust](https://one.dash.cloudflare.com/).
2. Masuk ke **Networks** $\rightarrow$ **Tunnels** $\rightarrow$ Klik tunnel yang sudah dibuat (atau klik **Create a Tunnel**).
3. Pilih environment **Debian** & arsitektur **64-bit**.
4. Cloudflare akan menampilkan 1 baris perintah terminal. Copy perintah tersebut dan jalankan di terminal Debian 13:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared.deb && sudo cloudflared service install <TOKEN_CLOUDFLARE>
   ```

### 2. Arahkan Subdomain (Public Hostname)
Di halaman Cloudflare Tunnel, masuk ke tab **Public Hostname** dan tambahkan route:
* **Subdomain**: `magang` (atau `absen`)
* **Domain**: `netmon-bms.my.id`
* **Type**: `HTTP`
* **URL**: `localhost:8080`
* Klik **Save hostname**.

---

## FASE 4: DEPLOYMENT SUPABASE SELF-HOSTED DI KANTOR (DATABASE & AUTH)

*(Langkah ini dijalankan saat tim sudah siap memindahkan database dari Supabase Cloud ke server kantor)*:

```bash
# Buat direktori kerja server
sudo mkdir -p /srv/supabase
sudo chown -R $USER:$USER /srv/supabase
cd /srv/supabase

# Clone template docker resmi Supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Copy konfigurasi environment
cp .env.example .env
```
Edit file `.env`:
```bash
nano .env
```
Atur password yang aman pada:
* `POSTGRES_PASSWORD`: *(Password DB kuat)*
* `JWT_SECRET`: *(String rahasia minimal 32 karakter)*
* `DASHBOARD_USERNAME`: `admin`
* `DASHBOARD_PASSWORD`: *(Password login ke Studio)*
* `SITE_URL`: `https://magang.netmon-bms.my.id`

Jalankan container:
```bash
docker compose up -d
```
* **Port 8000**: Kong API Gateway (Auth & REST)
* **Port 3000**: Supabase Studio

---

## FASE 5: MIGRASI SKEMA & DATA ABSENSI KE SUPABASE KANTOR

1. Buka Supabase Studio di browser: `http://IP_SERVER_KANTOR:3000`.
2. Masuk ke menu **SQL Editor**.
3. Buka file [`supabase_schema.sql`](./supabase_schema.sql) dari repositori project ini, copy seluruh kodenya, dan paste ke SQL Editor $\rightarrow$ Klik **Run**.
4. Seluruh tabel langsung terbentuk secara instan!
5. Di Cloudflare Tunnel, tambahkan hostname kedua untuk API backend:
   * **Subdomain**: `api`
   * **Domain**: `netmon-bms.my.id`
   * **Type**: `HTTP`
   * **URL**: `localhost:8000`
6. Di GitHub Secrets repo Anda, ubah `VITE_SUPABASE_URL` menjadi `https://api.netmon-bms.my.id` dan masukkan anon key baru.

---

## PANDUAN PEMELIHARAAN & BACKUP OTOMATIS DATABASE

Agar data absensi di server kantor aman dari kerusakan disk:

### 1. Script Backup Harian Otomatis
```bash
sudo mkdir -p /srv/backups/supabase
nano /srv/backup_db.sh
```
Isi script:
```bash
#!/bin/bash
BACKUP_DIR="/srv/backups/supabase"
DATE=$(date +"%Y-%m-%d_%H%M%S")
FILENAME="$BACKUP_DIR/magangku_db_$DATE.sql.gz"

docker exec -t supabase-db pg_dump -U postgres postgres | gzip > "$FILENAME"
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
```
Beri izin eksekusi:
```bash
chmod +x /srv/backup_db.sh
```

### 2. Jadwalkan Cron Job (Jam 02:00 Pagi)
```bash
crontab -e
```
Tambahkan:
```cron
0 2 * * * /srv/backup_db.sh > /dev/null 2>&1
```
