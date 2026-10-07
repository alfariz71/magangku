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

/**
 * Mengurai string attachmentUrl menjadi array URL.
 * Mendukung format URL tunggal legacy maupun JSON array string ["url1", "url2"].
 */
export function parseAttachmentUrls(url?: string | null): string[] {
  if (!url) return [];
  const trimmed = url.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      }
    } catch {
      // fallback jika gagal parse JSON
    }
  }
  return [trimmed];
}

/**
 * Mengemas array URL menjadi string attachmentUrl yang disimpan ke database.
 * Jika kosong -> undefined
 * Jika 1 URL -> string biasa (backward-compatible)
 * Jika > 1 URL -> JSON array string ["url1", "url2"]
 */
export function formatAttachmentUrls(urls: string[]): string | undefined {
  const filtered = urls.filter(u => typeof u === 'string' && u.trim().length > 0);
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];
  return JSON.stringify(filtered);
}
