import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { usePWA } from '../hooks/usePWA';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { IOSInstallModal } from '../components/IOSInstallModal';
import { FileSystemModal } from '../components/FileSystemModal';
import { formatBytes } from '../utils/metadata';
import { EQUALIZER_PRESETS } from '../utils/audioEngine';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    storageStats,
    recalculateStorage,
    clearCache,
    wipeAllData,
    songs,
    playlists,
    showToast,
    downloadSongAudio,
  } = useMusic();

  const { isOnline, isInstalled, isInstallable, isIOS, install } = usePWA();
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeStep, setWipeStep] = useState(1);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);
  const [deviceTab, setDeviceTab] = useState<'laptop' | 'android' | 'ios' | 'songs'>('laptop');

  // Backup Export JSON
  const handleExportBackup = () => {
    const backupData = {
      app: 'NARmusic',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      playlists,
      songsMetadata: songs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration,
        sourceType: s.sourceType,
        spotifyId: s.spotifyId,
        spotifyUrl: s.spotifyUrl,
        spotifyType: s.spotifyType,
        lyrics: s.lyrics,
        dateAdded: s.dateAdded,
        playCount: s.playCount,
        isFavorite: s.isFavorite,
      })),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `narmusic-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Cadangan Diekspor', 'File .json berhasil diunduh', 'success');
  };

  // Backup Import JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.app !== 'NARmusic') {
          showToast('File Tidak Valid', 'Bukan file cadangan resmi NARmusic', 'error');
          return;
        }

        if (json.settings) updateSettings(json.settings);
        showToast('Cadangan Dipulihkan', 'Pengaturan dan data berhasil diimpor', 'success');
      } catch {
        showToast('Gagal Membaca File', 'Format JSON rusak atau tidak valid', 'error');
      }
    };
    reader.readAsText(file);
  };

  const offlineSongsCount = songs.filter((s) => s.sourceType !== 'spotify').length;

  return (
    <div className="space-y-8 animate-in fade-in pb-20 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#0F2F2C]">
          Pengaturan
        </h2>
        <p className="text-xs text-teal-600 mt-0.5">
          Kelola penyimpanan, tampilan tema, audio, dan cadangan data
        </p>
      </div>

      {/* 1. PENYIMPANAN (STORAGE MANAGER) */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white border border-teal-500/20 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Penyimpanan Perangkat</h3>
              <p className="text-xs text-gray-500">IndexedDB + localStorage browser</p>
            </div>
          </div>

          <button
            onClick={() => recalculateStorage()}
            className="px-3 py-1.5 rounded-xl border border-teal-500/30 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Hitung Ulang
          </button>
        </div>

        {/* Progress Bar & Readout */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span>
              {storageStats.usedFormatted} digunakan dari {storageStats.quotaFormatted}
            </span>
            <span
              className={
                storageStats.percentUsed > 90
                  ? 'text-rose-600 font-bold'
                  : storageStats.percentUsed > 75
                  ? 'text-amber-600 font-bold'
                  : 'text-teal-600 '
              }
            >
              {storageStats.percentUsed}%
            </span>
          </div>

          <div className="w-full bg-teal-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                storageStats.percentUsed > 90
                  ? 'bg-rose-500'
                  : storageStats.percentUsed > 75
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-[#14B8A6] to-[#06B6D4]'
              }`}
              style={{ width: `${Math.max(2, storageStats.percentUsed)}%` }}
            />
          </div>

          {storageStats.percentUsed > 80 && (
            <p className="text-xs text-amber-600 font-medium">
              ⚠️ Peringatan: Kapasitas penyimpanan browser hampir penuh. Hapus beberapa lagu jika diperlukan.
            </p>
          )}
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-500/15">
            <span className="text-gray-500 block text-[11px]">File Audio</span>
            <span className="font-bold text-sm text-teal-800">
              {formatBytes(storageStats.audioBytes)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-500/15">
            <span className="text-gray-500 block text-[11px]">Thumbnail Cover</span>
            <span className="font-bold text-sm text-teal-800">
              {formatBytes(storageStats.thumbnailBytes)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-500/15">
            <span className="text-gray-500 block text-[11px]">Total Lagu</span>
            <span className="font-bold text-sm text-teal-800">
              {storageStats.songCount} Lagu
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-500/15">
            <span className="text-gray-500 block text-[11px]">Status Persistensi</span>
            <span className="font-bold text-sm text-teal-800">
              {storageStats.isPersisted ? '✅ Dilindungi' : '⚠️ Standar'}
            </span>
          </div>
        </div>

        {/* Storage Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-teal-500/15">
          <button
            onClick={() => clearCache()}
            className="px-3.5 py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition"
          >
            Bersihkan Cache Aplikasi
          </button>

          {!showWipeConfirm ? (
            <button
              onClick={() => {
                setShowWipeConfirm(true);
                setWipeStep(1);
              }}
              className="px-3.5 py-2 rounded-xl border border-rose-400/40 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition ml-auto"
            >
              Hapus Semua Data (Reset)
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-xs flex flex-col sm:flex-row items-center gap-3 w-full animate-in fade-in">
              <span className="text-rose-800 font-semibold flex-1">
                {wipeStep === 1
                  ? 'Konfirmasi 1/2: Semua lagu, thumbnail, dan playlist akan dihapus permanen. Lanjutkan?'
                  : 'Konfirmasi 2/2: Tindakan ini TIDAK DAPAT dibatalkan! Yakin reset penuh?'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowWipeConfirm(false)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 font-semibold"
                >
                  Batal
                </button>
                {wipeStep === 1 ? (
                  <button
                    onClick={() => setWipeStep(2)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-semibold"
                  >
                    Ya, Lanjut
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      wipeAllData();
                      setShowWipeConfirm(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
                  >
                    HAPUS SEMUA DATA
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. TAMPILAN (APPEARANCE) */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white border border-teal-500/20 shadow-sm space-y-4">
        <h3 className="font-bold text-base">Tampilan & Tema</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Theme Mode: Light Only */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Tema Antarmuka
            </label>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-50/80 border border-teal-200">
              <span className="text-xl">☀️</span>
              <div>
                <h4 className="font-bold text-teal-900 text-xs">Mode Terang (Light Theme)</h4>
                <p className="text-[11px] text-teal-700">Putih kehijauan (#F0FDFA) & aksen tosca cerah</p>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-teal-600 text-white font-bold text-[10px]">
                Aktif
              </span>
            </div>
          </div>

          {/* Accent Palette */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              Aksen Warna Tosca
            </label>
            <div className="flex gap-2.5">
              {[
                { id: 'teal', color: '#14B8A6', label: 'Tosca Asli' },
                { id: 'cyan', color: '#06B6D4', label: 'Cyan Tosca' },
                { id: 'mint', color: '#2DD4BF', label: 'Mint Bright' },
              ].map((a) => (
                <button
                  key={a.id}
                  onClick={() => updateSettings({ accentColor: a.id as typeof settings.accentColor })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
                    settings.accentColor === a.id
                      ? 'border-teal-500 ring-2 ring-teal-500/20 font-bold bg-teal-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: a.color }} />
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. AUDIO SETTINGS */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white border border-teal-500/20 shadow-sm space-y-4">
        <h3 className="font-bold text-base">Audio & Pemutaran</h3>

        <div className="space-y-4 text-xs">
          {/* Crossfade */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-50/60 border border-teal-500/15">
            <div>
              <h4 className="font-bold text-sm">Crossfade Transisi Lagu</h4>
              <p className="text-gray-500">Transisi memudar halus antar lagu</p>
            </div>
            <div className="flex items-center gap-3">
              {settings.crossfadeEnabled && (
                <span className="font-mono text-teal-600 font-bold">
                  {settings.crossfadeDuration}s
                </span>
              )}
              <input
                type="checkbox"
                checked={settings.crossfadeEnabled}
                onChange={(e) => updateSettings({ crossfadeEnabled: e.target.checked })}
                className="w-5 h-5 accent-teal-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Equalizer Default Preset */}
          <div>
            <label className="block font-semibold mb-1.5 text-gray-700">
              Preset Equalizer Bawaan
            </label>
            <select
              value={settings.defaultEqPreset}
              onChange={(e) => updateSettings({ defaultEqPreset: e.target.value })}
              className="w-full max-w-xs px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 font-medium"
            >
              {EQUALIZER_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Visualizer Style */}
          <div>
            <label className="block font-semibold mb-1.5 text-gray-700">
              Gaya Visualizer Web Audio API
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ visualizerStyle: 'bars' })}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  settings.visualizerStyle === 'bars'
                    ? 'bg-teal-600 text-white shadow'
                    : 'bg-teal-50  text-gray-700 '
                }`}
              >
                Batang Frekuensi (Bars)
              </button>
              <button
                onClick={() => updateSettings({ visualizerStyle: 'wave' })}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  settings.visualizerStyle === 'wave'
                    ? 'bg-teal-600 text-white shadow'
                    : 'bg-teal-50  text-gray-700 '
                }`}
              >
                Gelombang Halus (Waveform)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PUSAT DOWNLOAD & INSTALASI APLIKASI (LAPTOP, PC, HP ANDROID & IPHONE) */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white border border-teal-500/25 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-teal-500/15">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="NARmusic Icon"
              className="w-12 h-12 rounded-2xl object-cover shadow-md border border-teal-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#0F2F2C]">
                  Download & Pasang Aplikasi
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px]">
                  PWA Standalone
                </span>
              </div>
              <p className="text-xs text-teal-600 font-medium">
                Gunakan di Laptop, Komputer, HP Android, iPhone & iPad tanpa kuota
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isInstalled ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Terpasang di Perangkat
              </span>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white text-xs font-bold shadow-md shadow-teal-500/25 hover:opacity-95 active:scale-95 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Pasang Sekarang (1-Klik)
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setIsIOSModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white text-xs font-bold shadow-md shadow-teal-500/25 hover:opacity-95 active:scale-95 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Pasang di iPhone/iPad
              </button>
            ) : (
              <button
                onClick={() => {
                  showToast(
                    'Instalasi Browser',
                    'Klik ikon download/pasang di bilah alamat (URL bar) atau menu titik tiga browser Anda.',
                    'info'
                  );
                }}
                className="px-4 py-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-300 text-xs font-bold hover:bg-teal-100 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Petunjuk Pasang
              </button>
            )}
          </div>
        </div>

        {/* Tab Pemilih Perangkat */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'laptop', label: '💻 Laptop & PC (Windows/Mac)', desc: 'Chrome & Edge' },
            { id: 'android', label: '📱 HP Android', desc: 'Chrome & Samsung' },
            { id: 'ios', label: '🍏 iPhone & iPad', desc: 'Safari iOS' },
            { id: 'songs', label: '🎵 Unduh File Lagu', desc: `${songs.filter((s) => s.sourceType !== 'spotify').length} Lagu Lokal` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDeviceTab(tab.id as typeof deviceTab)}
              className={`px-3.5 py-2 rounded-xl border text-left whitespace-nowrap transition ${
                deviceTab === tab.id
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20 font-bold text-teal-900 shadow-sm'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-600 font-medium'
              }`}
            >
              <div>{tab.label}</div>
              <div className="text-[10px] opacity-75 font-normal">{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* TAB 1: LAPTOP & PC */}
        {deviceTab === 'laptop' && (
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-sm text-teal-900">
                  Cara Pasang NARmusic di Laptop / Komputer
                </h4>
                <p className="text-gray-600 mt-0.5">
                  Mendukung Windows 10/11, macOS, Linux, dan Chromebook.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-teal-200/80 text-teal-900 font-bold text-[11px]">
                Aplikasi Desktop
              </span>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-gray-700 leading-relaxed font-medium">
              <li>
                Buka website ini menggunakan <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, atau <strong>Brave</strong> di laptop Anda.
              </li>
              <li>
                Perhatikan <strong>ikon komputer / tanda panah unduh</strong> kecil di ujung kanan bilah alamat (URL bar) browser.
              </li>
              <li>
                Klik ikon tersebut lalu pilih <strong>"Instal NARmusic"</strong>.
              </li>
              <li>
                Selesai! NARmusic akan otomatis memiliki pintasan di Desktop & Start Menu, serta terbuka di jendela mandiri tanpa address bar.
              </li>
            </ol>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-teal-800">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 shadow-2xs">
                ⚡ Pemutaran Musik di Latar Belakang
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 shadow-2xs">
                ⌨️ Shortcut Keyboard Spasi, N, P, Panah
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 shadow-2xs">
                🎛️ Equalizer 5-Band & Visualizer Aktif
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: HP ANDROID */}
        {deviceTab === 'android' && (
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-sm text-teal-900">
                  Cara Pasang NARmusic di HP / Tablet Android
                </h4>
                <p className="text-gray-600 mt-0.5">
                  Bekerja cepat, ringan (~2MB), dan hemat memori internal HP.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                Android APK PWA
              </span>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-gray-700 leading-relaxed font-medium">
              <li>
                Buka NARmusic di browser <strong>Chrome</strong> atau <strong>Samsung Internet</strong> pada HP Anda.
              </li>
              <li>
                Ketuk tombol <strong>"Pasang Sekarang"</strong> di bagian atas atau ketuk menu titik tiga (<strong>⋮</strong>) di pojok kanan atas browser.
              </li>
              <li>
                Pilih menu <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
              </li>
              <li>
                Ikon resmi NARmusic akan terpasang di daftar aplikasi HP Anda dan bisa dibuka langsung tanpa browser.
              </li>
            </ol>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-teal-800">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 shadow-2xs">
                📶 100% Siap Diputar Offline Tanpa Kuota
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 shadow-2xs">
                🔒 Kontrol Pemutar di Lock Screen & Notifikasi
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: IPHONE & IPAD */}
        {deviceTab === 'ios' && (
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-sm text-teal-900">
                  Cara Pasang NARmusic di iPhone & iPad (iOS Safari)
                </h4>
                <p className="text-gray-600 mt-0.5">
                  Tampilan layar penuh elegan layaknya aplikasi dari App Store.
                </p>
              </div>
              <button
                onClick={() => setIsIOSModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition shadow-sm"
              >
                Lihat Panduan Visual
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-gray-700 leading-relaxed font-medium">
              <li>
                Buka website ini menggunakan browser <strong>Safari</strong> di iPhone/iPad Anda.
              </li>
              <li>
                Ketuk ikon <strong>Bagikan (Share ⎘)</strong> pada bilah bawah layar Safari.
              </li>
              <li>
                Gulir ke bawah dan ketuk opsi <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
              </li>
              <li>
                Ketuk <strong>Tambah</strong> di pojok kanan atas. Ikon NARmusic siap digunakan di beranda iPhone Anda!
              </li>
            </ol>
          </div>
        )}

        {/* TAB 4: DOWNLOAD FILE AUDIO LOKAL */}
        {deviceTab === 'songs' && (
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-teal-900">
                  Download File Audio ke Perangkat Anda
                </h4>
                <p className="text-gray-600 mt-0.5">
                  Simpan file lagu asli MP3/M4A/FLAC dari IndexedDB langsung ke folder Download laptop atau HP Anda.
                </p>
              </div>
            </div>

            {songs.filter((s) => s.sourceType !== 'spotify').length === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-teal-200 text-center text-gray-500">
                Belum ada lagu lokal yang diunggah. Unggah file audio melalui tombol Upload di bagian atas terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {songs
                  .filter((s) => s.sourceType !== 'spotify')
                  .map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-teal-100 shadow-2xs hover:border-teal-300 transition"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <h5 className="font-bold truncate text-[#0F2F2C]">{song.title}</h5>
                        <p className="text-[11px] text-gray-500 truncate">{song.artist} • {formatBytes(song.sizeBytes || 0)}</p>
                      </div>
                      <button
                        onClick={() => downloadSongAudio(song)}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Unduh File
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. AKSES FOLDER FILE SYSTEM */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white border border-teal-500/20 shadow-sm space-y-3">
        <h3 className="font-bold text-base">Akses Folder Perangkat</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Pindai folder musik di komputer atau HP Anda menggunakan File System Access API.
          File tetap berada di perangkat lokal Anda dan tidak dikirim ke internet.
        </p>

        <button
          onClick={() => setIsFolderModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/25 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Pindai / Hubungkan Folder Musik
        </button>
      </section>

      {/* 6. CADANGAN DATA (BACKUP) */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white border border-teal-500/20 shadow-sm space-y-3">
        <h3 className="font-bold text-base">Cadangan & Pemulihan Data</h3>
        <p className="text-xs text-gray-500">
          Ekspor daftar playlist, riwayat putar, favorit, dan metadata ke file JSON.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Ekspor Backup (.json)
          </button>

          <label className="px-4 py-2 rounded-xl border border-teal-500/30 text-teal-700 hover:bg-teal-50 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Impor Backup (.json)
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </section>

      {/* 7. TENTANG NARmusic */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white border border-teal-500/20 shadow-sm space-y-3 text-xs">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="NARmusic Official Logo"
            className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-teal-200"
          />
          <div>
            <h4 className="font-extrabold text-base text-[#0F2F2C]">NARmusic Progressive Web App</h4>
            <p className="text-teal-700 font-medium">Versi 1.1.0 • Lisensi MIT • 100% Offline Ready</p>
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed font-medium">
          NARmusic adalah aplikasi pemutar musik modern berbasis Progressive Web App (PWA)
          dengan penyimpanan IndexedDB lokal di perangkat pengguna, Web Audio API Equalizer 5-Band,
          Audio Visualizer, File System Access API, pengambilan lirik otomatis, dan integrasi resmi Spotify oEmbed.
        </p>

        <p className="text-[11px] text-gray-500 pt-2 border-t border-teal-500/10">
          Dibuat dengan React, Tailwind CSS, Lucide Icons, jsmediatags, LRCLIB API, dan Web Audio API. 
          Semua hak cipta audio dan konten Spotify dimiliki oleh pemilik masing-masing.
        </p>
      </section>

      <FileSystemModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} />
      <IOSInstallModal isOpen={isIOSModalOpen} onClose={() => setIsIOSModalOpen(false)} />
    </div>
  );
};
