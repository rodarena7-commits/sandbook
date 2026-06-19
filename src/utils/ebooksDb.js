const DB_NAME = 'SandbookLocalDB';
const DB_VERSION = 1;

export function initDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('ebooks')) {
        const ebookStore = db.createObjectStore('ebooks', { keyPath: 'id' });
        ebookStore.createIndex('folderId', 'folderId', { unique: false });
      }
    };
  });
}

// ── OPERACIONES DE CARPETAS ────────────────────────────────
export async function getFolders() {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readonly');
    const store = tx.objectStore('folders');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFolder(folder) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readwrite');
    const store = tx.objectStore('folders');
    const request = store.put(folder);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFolder(id) {
  const db = await initDb();
  
  // Borrar la carpeta
  await new Promise((resolve, reject) => {
    const tx = db.transaction('folders', 'readwrite');
    const store = tx.objectStore('folders');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // Mover los ebooks contenidos en esta carpeta a la raíz (parentId: null)
  const allEbooks = await getAllEbooks();
  for (const ebook of allEbooks) {
    if (ebook.folderId === id) {
      ebook.folderId = null;
      await saveEbook(ebook);
    }
  }

  // Mover las subcarpetas contenidas a la raíz (parentId: null)
  const allFolders = await getFolders();
  for (const folder of allFolders) {
    if (folder.parentId === id) {
      folder.parentId = null;
      await saveFolder(folder);
    }
  }
}

// ── OPERACIONES DE EBOOKS ──────────────────────────────────
export async function getAllEbooks() {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ebooks', 'readonly');
    const store = tx.objectStore('ebooks');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getEbooksByFolder(folderId) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ebooks', 'readonly');
    const store = tx.objectStore('ebooks');
    const index = store.index('folderId');
    const request = index.getAll(IDBKeyRange.only(folderId));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getEbook(id) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ebooks', 'readonly');
    const store = tx.objectStore('ebooks');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEbook(ebook) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ebooks', 'readwrite');
    const store = tx.objectStore('ebooks');
    const request = store.put(ebook);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteEbook(id) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ebooks', 'readwrite');
    const store = tx.objectStore('ebooks');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
