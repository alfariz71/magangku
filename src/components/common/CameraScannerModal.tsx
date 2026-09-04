import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Smartphone, 
  Upload, 
  AlertCircle,
  SwitchCamera,
  QrCode,
  ShieldAlert,
  Video
} from 'lucide-react';
import jsQR from 'jsqr';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessScan?: (capturedPhoto?: string, scannedToken?: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccessScan
}) => {
  const { qrConfig, scanQrToken } = useData();
  const { currentUser } = useAuth();
  
  const [isScanning, setIsScanning] = useState(true);
  const [isScanSuccess, setIsScanSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play audio chime on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio not supported', e);
    }
  };

  // Stop camera helper
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error(e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Process decoded QR data and capture snapshot
  const handleDecodedData = async (decodedText: string, customPhoto?: string) => {
    const cleanToken = decodedText.trim();
    const res = await scanQrToken(cleanToken);

    // Capture photo from canvas or customPhoto or student avatar
    let photoToSave = customPhoto;
    if (!photoToSave && canvasRef.current) {
      try {
        photoToSave = canvasRef.current.toDataURL('image/jpeg', 0.85);
      } catch (e) {
        console.error(e);
      }
    }
    if (!photoToSave) {
      photoToSave = currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=350';
    }

    setCapturedPhotoUrl(photoToSave);

    if (res.success) {
      playBeep();
      setIsScanning(false);
      setIsScanSuccess(true);
      setErrorMessage(null);
      stopCamera();

      // Transisi kilat 200ms agar user mendapat feedback visual, lalu langsung tutup modal dan proses absensi
      setTimeout(() => {
        if (onSuccessScan) onSuccessScan(photoToSave, cleanToken);
        onClose();
      }, 200);
    } else {
      setErrorMessage(`${res.message} (Isi QR: ${cleanToken.substring(0, 30)}...)`);
    }
  };

  // Continuous frame scanner loop using jsQR
  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data && isScanning) {
          handleDecodedData(code.data);
          return;
        }
      }
    }

    if (isScanning) {
      animFrameIdRef.current = requestAnimationFrame(scanLoop);
    }
  };

  // Enumerate camera devices
  const loadVideoDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }
    } catch (e) {
      console.warn('Could not enumerate video devices', e);
    }
  };

  // Robust Camera Starter with Multi-tier Fallback
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setCameraPermissionError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermissionError('Peramban web Anda tidak mendukung WebRTC / Camera API langsung.');
      return;
    }

    let stream: MediaStream | null = null;

    // Strategy 1: Specific Device ID if available
    if (deviceId) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false
        });
      } catch (err) {
        console.log('Strategy 1 deviceId failed, attempting fallback...', err);
      }
    }

    // Strategy 2: Ideal facingMode environment with soft constraint
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (err) {
        console.log('Strategy 2 ideal environment failed, attempting simple video: true...', err);
      }
    }

    // Strategy 3: Ultra permissive basic video constraint
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      } catch (err: any) {
        console.error('All camera start strategies failed:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraPermissionError('Izin akses kamera diblokir. Klik ikon gembok/kamera di sebelah kiri bilah URL browser Anda untuk memilih "Izinkan / Allow Camera", lalu muat ulang.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraPermissionError('Kamera tidak terdeteksi pada perangkat ini. Anda dapat menggunakan tombol Verifikasi QR atau Unggah Foto QR.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraPermissionError('Kamera sedang digunakan oleh aplikasi lain (misal Zoom/Google Meet). Silakan tutup aplikasi tersebut lalu coba lagi.');
        } else {
          setCameraPermissionError(`Tidak dapat membuka kamera (${err.message || err.name}). Gunakan opsi verifikasi instan di bawah.`);
        }
        return;
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        
        try {
          await videoRef.current.play();
          setCameraActive(true);
          setIsScanning(true);
          animFrameIdRef.current = requestAnimationFrame(scanLoop);
          loadVideoDevices();
        } catch (playErr) {
          console.error('Error playing video stream:', playErr);
        }
      }
    }
  };

  // Image Upload Scan
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          handleDecodedData(code.data);
        } else {
          setErrorMessage('Tidak ditemukan QR Code yang valid pada gambar. Pastikan gambar QR jelas dan memiliki kontras yang baik.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      setIsScanSuccess(false);
      setErrorMessage(null);
      setIsScanning(true);
      startCamera(selectedDeviceId);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Hidden processing canvas & file input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Scanner Modal Box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-700/60 z-10 animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-[#2F80ED]">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pemindai QR Code Presensi</h3>
              <p className="text-[11px] text-slate-400">Pindai QR Code lokasi resmi MagangKu</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startCamera(selectedDeviceId)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              title="Refresh / Muat Ulang Kamera"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Video Area */}
        <div className="relative flex flex-col items-center justify-center bg-slate-950 px-6 py-6">
          <div className="relative h-64 w-64 sm:h-72 sm:w-72 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-inner flex items-center justify-center">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />

            {/* If Camera not active or error display */}
            {!cameraActive && (
              <div className="flex flex-col items-center p-5 text-center text-slate-300">
                <ShieldAlert className="h-10 w-10 text-amber-400 mb-2" />
                <span className="text-xs font-bold text-white">Kamera Belum Aktif</span>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {cameraPermissionError || 'Sedang menghubungkan ke webcam / kamera perangkat...'}
                </p>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#2F80ED] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Minta Izin & Buka Kamera
                </button>
              </div>
            )}

            {/* Corner Brackets */}
            {cameraActive && (
              <>
                <div className={`absolute top-3 left-3 h-8 w-8 border-t-4 border-l-4 ${isScanSuccess ? 'border-emerald-400' : 'border-[#2F80ED]'} rounded-tl-lg shadow-sm transition-colors duration-150`} />
                <div className={`absolute top-3 right-3 h-8 w-8 border-t-4 border-r-4 ${isScanSuccess ? 'border-emerald-400' : 'border-[#2F80ED]'} rounded-tr-lg shadow-sm transition-colors duration-150`} />
                <div className={`absolute bottom-3 left-3 h-8 w-8 border-b-4 border-l-4 ${isScanSuccess ? 'border-emerald-400' : 'border-[#2F80ED]'} rounded-bl-lg shadow-sm transition-colors duration-150`} />
                <div className={`absolute bottom-3 right-3 h-8 w-8 border-b-4 border-r-4 ${isScanSuccess ? 'border-emerald-400' : 'border-[#2F80ED]'} rounded-br-lg shadow-sm transition-colors duration-150`} />

                {/* Real-time Laser Scanning Beam */}
                {isScanning && !isScanSuccess && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#2F80ED] to-transparent shadow-[0_0_20px_#2F80ED] animate-bounce duration-1000" />
                )}
              </>
            )}

            {/* Quick Success Flash Indicator (subtle, closes in 200ms) */}
            {isScanSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/40 backdrop-blur-xs animate-in zoom-in-75 duration-150 z-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/30 ring-4 ring-emerald-400/50">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-in zoom-in duration-150" />
                </div>
              </div>
            )}
          </div>

          {/* Camera Selection if multiple cameras found */}
          {videoDevices.length > 1 && (
            <div className="mt-3 w-full flex items-center gap-2">
              <Video className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  startCamera(e.target.value);
                }}
                className="w-full rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 border border-slate-700"
              >
                {videoDevices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Kamera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Instructions */}
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-300 font-medium">
              Arahkan kamera ke QR Code resmi di lokasi magang
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Username login: <strong className="text-blue-400">{currentUser?.username || 'andi.pratama'}</strong>
            </p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-950/80 p-3 text-xs text-[#EB5757] border border-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions: Direct Scan Token & Upload Image */}
          <div className="mt-5 w-full space-y-2.5">
            {/* Quick Instant Verification Button */}
            <button
              onClick={() => handleDecodedData('QR-TESTING-PERMANEN')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F80ED] py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-600 active:scale-[0.98]"
            >
              <QrCode className="h-4 w-4" />
              Simulasi Pindai Token Resmi MagangKu
            </button>

            {/* Upload QR Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Upload className="h-4 w-4" />
              Unggah Gambar / Screenshot QR Code
            </button>

            <div className="rounded-xl bg-slate-800/60 p-2.5 text-center text-[10px] text-slate-400">
              💡 <strong>Tips Kamera:</strong> Jika muncul popup browser, pilih <em>"Allow / Izinkan Kamera"</em>. Jika laptop Anda tidak memiliki kamera, gunakan tombol <em>"Simulasi Pindai Token"</em> atau <em>"Unggah Gambar QR"</em> di atas.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
