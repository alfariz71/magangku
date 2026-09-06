import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isTranslateError = this.state.error?.message?.includes('insertBefore') ||
                               this.state.error?.message?.includes('removeChild');

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Terjadi Kendala Tampilan</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isTranslateError
                ? 'Terdeteksi intervensi dari Google Translate / ekstensi browser yang memodifikasi teks aplikasi. Harap nonaktifkan penerjemah otomatis atau klik tombol di bawah.'
                : 'Sistem mendeteksi kendala pada antarmuka. Silakan klik muat ulang untuk melanjutkan.'}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 bg-[#2F80ED] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-600 transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
