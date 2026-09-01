import React, { useState } from 'react';
import { MapPin, CheckCircle, XCircle, AlertCircle, Compass, ChevronUp, ChevronDown, Sliders } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const GpsSimulatorWidget: React.FC = () => {
  const { gpsMode, setGpsMode, checkRealGps, qrConfig, isLocationInRange } = useData();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Floating Pill Toggle Button */}
      <div className="flex flex-col items-end">
        {isExpanded && (
          <div className="mb-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-2 duration-150 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#2F80ED]" />
                <h4 className="text-xs font-bold text-[#183B66]">Simulator Lokasi Magang</h4>
              </div>
              <span className="text-[10px] font-medium text-slate-400">Mode Pengujian</span>
            </div>

            <p className="mt-2 text-[11px] text-slate-500 leading-normal">
              Pilih status GPS untuk menguji validasi kehadiran (Radius kantor: {qrConfig.radiusMeters}m).
            </p>

            <div className="mt-3 space-y-1.5">
              <button
                onClick={() => setGpsMode('in_range')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  gpsMode === 'in_range'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-400'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#27AE60]" />
                  <span>🟢 Dalam Jangkauan (&lt; {qrConfig.radiusMeters}m)</span>
                </div>
                {gpsMode === 'in_range' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Aktif</span>}
              </button>

              <button
                onClick={() => setGpsMode('out_of_range')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  gpsMode === 'out_of_range'
                    ? 'bg-rose-50 text-rose-700 font-semibold ring-1 ring-rose-400'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-[#EB5757]" />
                  <span>🔴 Di Luar Jangkauan (&gt; {qrConfig.radiusMeters}m)</span>
                </div>
                {gpsMode === 'out_of_range' && <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">Aktif</span>}
              </button>

              <button
                onClick={() => setGpsMode('gps_off')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  gpsMode === 'gps_off'
                    ? 'bg-amber-50 text-amber-700 font-semibold ring-1 ring-amber-400'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>⚪ GPS Tidak Aktif</span>
                </div>
                {gpsMode === 'gps_off' && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Aktif</span>}
              </button>

              <button
                onClick={() => {
                  setGpsMode('real_gps');
                  checkRealGps();
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  gpsMode === 'real_gps'
                    ? 'bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-400'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-[#2F80ED]" />
                  <span>🛰️ Gunakan GPS Asli Browser</span>
                </div>
              </button>
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 p-2 text-[10px] text-slate-500 border border-slate-100">
              📍 <span className="font-semibold text-slate-700">{qrConfig.officeName}</span>
              <br />
              Radius: {qrConfig.radiusMeters}m | Lat: {qrConfig.latitude}, Lon: {qrConfig.longitude}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-md transition-all ${
            isLocationInRange
              ? 'bg-[#27AE60] text-white hover:bg-emerald-600 shadow-emerald-600/30'
              : gpsMode === 'gps_off'
              ? 'bg-slate-700 text-white hover:bg-slate-800 shadow-slate-800/30'
              : 'bg-[#EB5757] text-white hover:bg-rose-600 shadow-rose-600/30'
          }`}
          title="Uji Coba Validasi GPS Lokasi"
        >
          <MapPin className="h-3.5 w-3.5 animate-pulse" />
          <span>
            {isLocationInRange
              ? 'Simulasi: Dalam Jangkauan'
              : gpsMode === 'gps_off'
              ? 'Simulasi: GPS Mati'
              : 'Simulasi: Luar Jangkauan'}
          </span>
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
};
