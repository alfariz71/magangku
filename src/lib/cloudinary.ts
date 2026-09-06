/**
 * Cloudinary Upload Helper
 * Mengunggah file (gambar / dokumen) langsung dari browser menggunakan Unsigned Upload Preset.
 */

export async function uploadToCloudinary(
  file: File | Blob,
  folder: string = 'magangku'
): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Konfigurasi Cloudinary belum disetel. Pastikan VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET sudah ada di .env.local'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (folder) {
    formData.append('folder', folder);
  }

  // Menggunakan resource_type: auto agar Cloudinary otomatis mendeteksi apakah itu gambar atau dokumen (PDF)
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Upload ke Cloudinary gagal (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  // secure_url menggunakan protokol HTTPS
  return data.secure_url as string;
}

/**
 * Mengecek apakah URL media adalah file video (Cloudinary video atau ekstensi video umum)
 */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.includes('/video/upload/') || /\.(mp4|mov|webm|ogg|m4v)(\?.*)?$/i.test(url);
}
