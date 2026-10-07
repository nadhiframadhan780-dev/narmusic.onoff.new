import React from 'react';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-teal-500/20 text-[#0F2F2C]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="NARmusic Icon"
              className="w-12 h-12 rounded-2xl object-cover shadow-md border border-teal-200"
            />
            <div>
              <h3 className="font-extrabold text-base leading-tight">Pasang di iPhone / iPad</h3>
              <p className="text-xs text-teal-600 font-medium">Aplikasi NARmusic Fullscreen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 my-4 text-sm">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-teal-50 border border-teal-100">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs">
              1
            </div>
            <p>
              Buka website ini di <strong>Safari</strong>, lalu ketuk tombol <strong>Bagikan (Share)</strong>{' '}
              <svg className="inline w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>{' '}
              di bilah bawah.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-teal-50 border border-teal-100">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs">
              2
            </div>
            <p>
              Gulir menu ke bawah lalu pilih opsi{' '}
              <strong>"Tambah ke Layar Utama"</strong> (<em>Add to Home Screen</em>).
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-teal-50 border border-teal-100">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs">
              3
            </div>
            <p>
              Ketuk <strong>Tambah</strong> di pojok kanan atas. NARmusic akan muncul di layar utama Anda seperti aplikasi biasa!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white font-semibold shadow-lg shadow-teal-500/20 hover:opacity-95 transition"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  );
};
