import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Save, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TandaTanganView: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(currentUser?.signature || null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#183B66';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const dataUrl = canvas.toDataURL('image/png');
    setSavedSignature(dataUrl);
    updateCurrentUser({ signature: dataUrl });
    setSuccessToast(true);

    setTimeout(() => {
      setSuccessToast(false);
    }, 3500);
  };

  const handleDownload = () => {
    if (!savedSignature) return;
    const a = document.createElement('a');
    a.href = savedSignature;
    a.download = `Tanda_Tangan_${currentUser?.name || 'Mahasiswa'}.png`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#183B66]">Tanda Tangan Digital</h2>
        <p className="mt-1 text-sm text-slate-500">
          Buat dan simpan tanda tangan digital Anda untuk keperluan administrasi surat dan laporan magang
        </p>
      </div>

      {successToast && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-[#27AE60] border border-emerald-200 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>Tanda tangan digital berhasil disimpan ke profil Anda!</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Canvas Area */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-[#183B66]">Area Goresan Tanda Tangan</h3>
              <span className="text-xs text-slate-400">Gunakan mouse atau layar sentuh</span>
            </div>

            <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-2">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="h-56 w-full cursor-crosshair rounded-xl bg-white touch-none shadow-inner"
              />
              <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 border-b border-slate-200 px-12 text-center text-[10px] text-slate-400">
                Garis Tanda Tangan
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Trash2 className="h-4 w-4 text-rose-500" />
                Hapus
              </button>

              <button
                type="button"
                disabled={!hasDrawn}
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl bg-[#2F80ED] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                Simpan Tanda Tangan
              </button>
            </div>
          </div>
        </div>

        {/* Right: Saved Preview & Status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-[16px] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#183B66] border-b border-slate-100 pb-3">
              Tanda Tangan Aktif
            </h3>

            {savedSignature ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                  <img
                    src={savedSignature}
                    alt="Tanda Tangan"
                    className="max-h-36 max-w-full object-contain"
                  />
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#27AE60]">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Status: Terverifikasi Digital</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>Pemilik: <span className="font-semibold text-slate-800">{currentUser?.name}</span></p>
                  <p>NIM: <span className="font-semibold text-slate-800">{currentUser?.nim || '2201234567'}</span></p>
                  <p>Instansi: <span className="font-semibold text-slate-800">{currentUser?.university}</span></p>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2F80ED] bg-white py-2.5 text-xs font-semibold text-[#2F80ED] hover:bg-blue-50"
                >
                  <Download className="h-4 w-4" />
                  Unduh Tanda Tangan (PNG)
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada tanda tangan yang tersimpan. Gambarkan tanda tangan Anda pada canvas di sebelah kiri.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
