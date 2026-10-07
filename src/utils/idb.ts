/**
 * NARmusic - IndexedDB Storage Manager
 * 
 * Alasan teknis menggunakan IndexedDB:
 * localStorage dibatasi oleh browser hanya ~5MB (teks saja), sehingga TIDAK dapat
 * menampung file audio biner (lagu mp3 ~5-15MB/lagu). IndexedDB mendukung penyimpanan
 * ratusan megabyte/gigabyte file Blob biner secara aman di browser pengguna.
 */

const DB_NAME = 'NARmusic_DB';
const DB_VERSION = 1;

export const STORES = {
  AUDIO: 'audioFiles',
  THUMBNAILS: 'thumbnails',
  HANDLES: 'fileSystemHandles',
};

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada browser ini'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.AUDIO)) {
        db.createObjectStore(STORES.AUDIO);
      }
      if (!db.objectStoreNames.contains(STORES.THUMBNAILS)) {
        db.createObjectStore(STORES.THUMBNAILS);
      }
      if (!db.objectStoreNames.contains(STORES.HANDLES)) {
        db.createObjectStore(STORES.HANDLES);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Simpan file audio biner ke IndexedDB
 */
export async function saveAudioFile(id: string, blob: Blob): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AUDIO, 'readwrite');
      const store = tx.objectStore(STORES.AUDIO);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve();
      req.onerror = () => {
        if (req.error?.name === 'QuotaExceededError') {
          reject(new Error('Kapasitas penyimpanan browser penuh (QuotaExceededError)'));
        } else {
          reject(req.error);
        }
      };
    });
  } catch (err) {
    console.error('Gagal menyimpan audio ke IDB:', err);
    throw err;
  }
}

/**
 * Ambil file audio biner dari IndexedDB
 */
export async function getAudioFile(id: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AUDIO, 'readonly');
      const store = tx.objectStore(STORES.AUDIO);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Gagal mengambil audio dari IDB:', err);
    return null;
  }
}

/**
 * Hapus file audio dari IndexedDB
 */
export async function deleteAudioFile(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AUDIO, 'readwrite');
      const store = tx.objectStore(STORES.AUDIO);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menghapus audio:', err);
  }
}

/**
 * Simpan thumbnail Blob ke IndexedDB
 */
export async function saveThumbnail(id: string, blob: Blob): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.THUMBNAILS, 'readwrite');
      const store = tx.objectStore(STORES.THUMBNAILS);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menyimpan thumbnail:', err);
  }
}

/**
 * Ambil thumbnail Blob dari IndexedDB
 */
export async function getThumbnail(id: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.THUMBNAILS, 'readonly');
      const store = tx.objectStore(STORES.THUMBNAILS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal mengambil thumbnail:', err);
    return null;
  }
}

/**
 * Hapus thumbnail dari IndexedDB
 */
export async function deleteThumbnail(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.THUMBNAILS, 'readwrite');
      const store = tx.objectStore(STORES.THUMBNAILS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menghapus thumbnail:', err);
  }
}

/**
 * Simpan handle direktori File System Access API
 */
export async function saveDirectoryHandle(key: string, handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.HANDLES, 'readwrite');
      const store = tx.objectStore(STORES.HANDLES);
      const req = store.put(handle, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menyimpan direktori handle:', err);
  }
}

/**
 * Ambil handle direktori File System Access API
 */
export async function getDirectoryHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.HANDLES, 'readonly');
      const store = tx.objectStore(STORES.HANDLES);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal mengambil direktori handle:', err);
    return null;
  }
}

/**
 * Hitung total ukuran biner yang tersimpan di store tertentu (Audio / Thumbnails)
 */
export async function getStoreBytes(storeName: string): Promise<number> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      let total = 0;
      const req = store.openCursor();

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          const val = cursor.value;
          if (val instanceof Blob) {
            total += val.size;
          }
          cursor.continue();
        } else {
          resolve(total);
        }
      };

      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/**
 * Hapus seluruh data di IndexedDB (Reset Penuh)
 */
export async function clearAllIndexedDB(): Promise<void> {
  const db = await getDB();
  const stores = [STORES.AUDIO, STORES.THUMBNAILS, STORES.HANDLES];
  for (const s of stores) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(s, 'readwrite');
      const store = tx.objectStore(s);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }
}

/**
 * Meminta browser agar tidak otomatis menghapus data penyimpanan (Storage Persistence)
 */
export async function requestStoragePersistence(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Cek status persistensi penyimpanan
 */
export async function checkStoragePersistence(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}
