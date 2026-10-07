import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { usePWA } from '../hooks/usePWA';
import { PWAInstallButton } from '../components/PWAInstallButton';
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
  } = useMusic();

  const { isOnline } = usePWA();
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeStep, setWipeStep] = useState(1);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

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

      {/* 4. MODE OFFLINE & PWA */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white border border-teal-500/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Mode Offline & PWA</h3>
            <p className="text-xs text-teal-600">
              Status koneksi: {isOnline ? '🟢 Online' : '🟠 Offline'}
            </p>
          </div>
          <PWAInstallButton />
        </div>

        <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-500/20 text-xs space-y-1.5">
          <p className="font-semibold text-teal-900">
            📊 Ketersediaan Offline:
          </p>
          <p className="text-gray-600">
            Sebanyak <strong>{offlineSongsCount} dari {songs.length} lagu</strong> tersimpan di IndexedDB dan dapat diputar 100% tanpa internet.
          </p>
          <p className="text-[11px] text-gray-500">
            Lagu dari Spotify memerlukan koneksi internet aktif karena diputar melalui iframe resmi Spotify.
          </p>
        </div>
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#06B6D4] to-[#14B8A6] flex items-center justify-center text-white shadow font-bold">
            NAR
          </div>
          <div>
            <h4 className="font-bold text-sm">NARmusic Progressive Web App</h4>
            <p className="text-gray-400">Versi 1.0.0 • Lisensi MIT</p>
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed">
          NARmusic adalah aplikasi pemutar musik modern berbasis Progressive Web App (PWA)
          dengan penyimpanan IndexedDB lokal di perangkat pengguna, Web Audio API Equalizer 5-Band,
          Audio Visualizer, File System Access API, dan integrasi resmi Spotify oEmbed.
        </p>

        <p className="text-[11px] text-gray-500 pt-2 border-t border-teal-500/10">
          Dibuat dengan React, Tailwind CSS, Lucide Icons, jsmediatags, dan Web Audio API. 
          Semua hak cipta audio dan konten Spotify dimiliki oleh pemilik masing-masing.
        </p>
      </section>

      <FileSystemModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} />
    </div>
  );
};
