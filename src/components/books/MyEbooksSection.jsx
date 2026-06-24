import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Folder, FolderPlus, FileText, Plus, Trash2, Pencil, Move, 
  ArrowLeft, Upload, Image, X, ChevronRight, Search, 
  Loader2, Maximize2, Minimize2, Sun, Moon, Eye, Share2
} from 'lucide-react';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { 
  getFolders, saveFolder, deleteFolder, 
  getAllEbooks, getEbooksByFolder, saveEbook, deleteEbook 
} from '../../utils/ebooksDb';

// Generar IDs aleatorios si crypto.randomUUID no está disponible
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + '_' + Date.now();
}

// Generar miniatura base64 para imágenes importadas
function generateImageThumbnail(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// Convertir Blob a Base64 para Capacitor Filesystem
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.readAsDataURL(blob);
  });
}

// Obtener extensión del archivo
function getFileExtension(type, originalName) {
  if (originalName && originalName.includes('.')) {
    return originalName.split('.').pop().toLowerCase();
  }
  if (type === 'pdf') return 'pdf';
  if (type === 'docx') return 'docx';
  if (type === 'image') return 'jpg';
  return 'bin';
}


export default function MyEbooksSection() {
  const [folders, setFolders] = useState([]);
  const [ebooks, setEbooks] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Modales
  const [folderModal, setFolderModal] = useState(null); // { type: 'create' }
  const [renameModal, setRenameModal] = useState(null); // { type: 'folder'|'ebook', id: string, name: string }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'folder'|'ebook', id: string, name: string }
  const [moveModal, setMoveModal] = useState(null); // { type: 'folder'|'ebook', id: string, name: string }
  const [coverModal, setCoverModal] = useState(null); // { ebookId: string, title: string, coverUrl?: string }
  const [activeReader, setActiveReader] = useState(null); // ebook object
  const [sharingId, setSharingId] = useState(null); // id of the ebook currently being shared

  const fileInputRef = useRef(null);

  // Cargar librerías externas de forma dinámica
  useEffect(() => {
    // PDF.js
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }
    // Mammoth.js (Word -> HTML)
    if (!window.mammoth) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      document.head.appendChild(script);
    }

    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const fs = await getFolders();
      const eb = await getAllEbooks();
      setFolders(fs);
      setEbooks(eb);
    } catch (err) {
      console.error('Error al cargar datos locales:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener la carpeta actual
  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return folders.find(f => f.id === currentFolderId);
  }, [folders, currentFolderId]);

  // Generar migas de pan (breadcrumbs)
  const breadcrumbs = useMemo(() => {
    const list = [];
    let cur = currentFolder;
    while (cur) {
      list.unshift(cur);
      cur = folders.find(f => f.id === cur.parentId);
    }
    return list;
  }, [folders, currentFolder]);

  // Filtrar elementos a mostrar en la carpeta actual
  const displayedItems = useMemo(() => {
    // Si hay búsqueda global
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const filteredEbooks = ebooks.filter(e => e.title.toLowerCase().includes(q));
      const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(q));
      return { folders: filteredFolders, ebooks: filteredEbooks };
    }

    // Filtrar por carpeta actual
    const currentFolders = folders.filter(f => f.parentId === currentFolderId);
    const currentEbooks = ebooks.filter(e => e.folderId === currentFolderId);
    return { folders: currentFolders, ebooks: currentEbooks };
  }, [folders, ebooks, currentFolderId, searchQuery]);

  // ── ACCIONES DE CARPETAS ────────────────────────────────────
  const handleSaveFolder = async (name) => {
    if (!name.trim()) return;
    try {
      if (folderModal.type === 'create') {
        const newFolder = {
          id: generateId(),
          name: name.trim(),
          parentId: currentFolderId,
          createdAt: Date.now()
        };
        await saveFolder(newFolder);
      }
      setFolderModal(null);
      await refreshData();
    } catch (err) {
      alert('Error al guardar la carpeta: ' + err.message);
    }
  };

  const handleRenameSave = async (newName) => {
    if (!newName.trim()) return;
    try {
      if (renameModal.type === 'folder') {
        const existing = folders.find(f => f.id === renameModal.id);
        if (existing) {
          await saveFolder({
            ...existing,
            name: newName.trim()
          });
        }
      } else {
        const existing = ebooks.find(e => e.id === renameModal.id);
        if (existing) {
          await saveEbook({
            ...existing,
            title: newName.trim()
          });
        }
      }
      setRenameModal(null);
      await refreshData();
    } catch (err) {
      alert('Error al renombrar: ' + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'folder') {
        await deleteFolder(deleteConfirm.id);
      } else {
        await deleteEbook(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      await refreshData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleMoveItem = async (targetFolderId) => {
    if (!moveModal) return;
    try {
      if (moveModal.type === 'folder') {
        const item = folders.find(f => f.id === moveModal.id);
        if (item) {
          await saveFolder({
            ...item,
            parentId: targetFolderId
          });
        }
      } else {
        const item = ebooks.find(e => e.id === moveModal.id);
        if (item) {
          await saveEbook({
            ...item,
            folderId: targetFolderId
          });
        }
      }
      setMoveModal(null);
      await refreshData();
    } catch (err) {
      alert('Error al mover elemento: ' + err.message);
    }
  };

  const handleShareEbook = async (ebook) => {
    if (!ebook || !ebook.fileBlob) {
      alert('No se pudo encontrar el archivo para compartir.');
      return;
    }
    setSharingId(ebook.id);
    try {
      const ext = getFileExtension(ebook.type, ebook.fileBlob.name);
      const fileName = `${ebook.title}.${ext}`;

      if (Capacitor.isNativePlatform()) {
        // 1. Convertir Blob a Base64
        const base64Data = await blobToBase64(ebook.fileBlob);
        
        // 2. Guardar en el directorio caché temporal del dispositivo
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });

        // 3. Compartir nativamente
        await Share.share({
          title: ebook.title,
          text: `Compartiendo ${ebook.title}`,
          url: writeResult.uri,
          dialogTitle: 'Compartir Archivo'
        });
      } else {
        // Fallback Web: Utilizar Web Share API si está disponible, de lo contrario descarga directa
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [ebook.fileBlob] })) {
          const fileObj = new File([ebook.fileBlob], fileName, { type: ebook.fileBlob.type });
          await navigator.share({
            files: [fileObj],
            title: ebook.title,
            text: `Compartiendo ${ebook.title}`
          });
        } else {
          // Descarga directa
          const url = URL.createObjectURL(ebook.fileBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    } catch (err) {
      console.error('Error al compartir:', err);
      if (err.message && !err.message.includes('Share canceled') && !err.message.includes('canceled')) {
        alert('Error al compartir: ' + err.message);
      }
    } finally {
      setSharingId(null);
    }
  };

  // ── IMPORTACIÓN DE ARCHIVOS ───────────────────────────────
  const extractPdfCover = async (file) => {
    return new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        if (!window.pdfjsLib) {
          resolve(null);
          return;
        }
        window.pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
          pdf.getPage(1).then(function(page) {
            const scale = 1.0;
            const viewport = page.getViewport({ scale: scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            page.render(renderContext).promise.then(function() {
              resolve(canvas.toDataURL('image/jpeg', 0.7));
            }).catch(() => resolve(null));
          }).catch(() => resolve(null));
        }).catch(() => resolve(null));
      };
      fileReader.onerror = () => resolve(null);
      fileReader.readAsArrayBuffer(file);
    });
  };
  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError('');

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let type = '';
      if (ext === 'pdf') type = 'pdf';
      else if (ext === 'doc' || ext === 'docx') type = 'docx';
      else if (['jpg', 'jpeg', 'png'].includes(ext)) type = 'image';
      else {
        throw new Error('Formato no soportado. Debe ser PDF, Word o Imagen (JPG, PNG).');
      }

      let coverUrl = null;
      if (type === 'pdf') {
        coverUrl = await extractPdfCover(file);
      } else if (type === 'image') {
        coverUrl = await generateImageThumbnail(file);
      }

      const newEbook = {
        id: generateId(),
        title: file.name.replace(/\.[^/.]+$/, ""), // quitar extensión del título
        type: type,
        fileBlob: file,
        folderId: currentFolderId,
        coverUrl: coverUrl,
        addedAt: Date.now()
      };

      await saveEbook(newEbook);
      await refreshData();
    } catch (err) {
      setImportError(err.message || 'Error al importar archivo');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  // ── PORTADAS MANUALES ─────────────────────────────────────
  const handleUpdateCoverUrl = async (url) => {
    if (!coverModal) return;
    try {
      const ebook = ebooks.find(e => e.id === coverModal.ebookId);
      if (ebook) {
        await saveEbook({
          ...ebook,
          coverUrl: url || null
        });
      }
      setCoverModal(null);
      await refreshData();
    } catch (err) {
      alert('Error al guardar portada: ' + err.message);
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      await handleUpdateCoverUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col min-h-[60vh] bg-slate-50 relative pb-10">
      
      {/* Barra de Búsqueda y Botones de Acción */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 items-center justify-between">
        
        {/* Buscador */}
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar libros o carpetas..."
            className="w-full pl-9 pr-8 py-2 bg-white rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setFolderModal({ type: 'create' })}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-2xl text-xs font-semibold border border-amber-200 transition-all active:scale-95"
          >
            <FolderPlus size={14} />
            Nueva Carpeta
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-2xl text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {importing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Importar Archivo
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            className="hidden"
            accept=".pdf,.doc,.docx,image/*,.jpg,.jpeg,.png"
          />
        </div>
      </div>

      {importError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-medium flex items-center justify-between">
          <span>{importError}</span>
          <button onClick={() => setImportError('')} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Migas de Pan (Breadcrumbs) */}
      {!searchQuery && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 mb-4 bg-white px-3 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className={`hover:text-amber-500 font-semibold ${!currentFolderId ? 'text-amber-600' : 'text-slate-500'}`}
          >
            Mis Ebooks (Raíz)
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={12} className="text-slate-300" />
              <button 
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`hover:text-amber-500 font-semibold ${idx === breadcrumbs.length - 1 ? 'text-amber-600' : 'text-slate-500'}`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-amber-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Listado Vacío */}
          {displayedItems.folders.length === 0 && displayedItems.ebooks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-3">📁</span>
              <h3 className="font-bold text-slate-700 text-sm mb-1">Esta carpeta está vacía</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Importá archivos PDF, Word o fotos (.jpg, .png) o creá subcarpetas para comenzar a organizarte.
              </p>
            </div>
          )}

          {/* Carpetas */}
          {displayedItems.folders.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wider">Carpetas ({displayedItems.folders.length})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {displayedItems.folders.map(folder => (
                  <div 
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-amber-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder className="text-amber-500 flex-shrink-0 fill-amber-500/20" size={18} />
                      <span className="text-xs font-semibold text-slate-700 truncate">{folder.name}</span>
                    </div>

                    {/* Botones de acción rápida */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRenameModal({ type: 'folder', id: folder.id, name: folder.name }); }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                        title="Renombrar"
                      >
                        <Pencil size={11} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMoveModal({ type: 'folder', id: folder.id, name: folder.name }); }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-500"
                        title="Mover"
                      >
                        <Move size={11} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'folder', id: folder.id, name: folder.name }); }}
                        className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ebooks */}
          {displayedItems.ebooks.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wider">Documentos ({displayedItems.ebooks.length})</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {displayedItems.ebooks.map(ebook => (
                  <div key={ebook.id} className="flex flex-col group relative">
                    
                    {/* Tarjeta de eBook */}
                    <div 
                      onClick={() => setActiveReader(ebook)}
                      className="aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-amber-400 border border-transparent transition-all cursor-pointer relative"
                    >
                      {ebook.coverUrl ? (
                        <img src={ebook.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col justify-between p-3.5 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/50 rounded-2xl relative">
                          <div className="text-right">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-200/50 px-1.5 py-0.5 rounded-full">
                              {ebook.type}
                            </span>
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            {ebook.type === 'image' ? (
                              <Image size={32} className="text-amber-400" />
                            ) : (
                              <FileText size={32} className="text-amber-400" />
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-slate-800 line-clamp-3 text-center leading-tight">
                            {ebook.title}
                          </p>
                        </div>
                      )}

                      {/* Botón de lectura rápida hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <span className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-800 rounded-full text-xs font-bold shadow-sm">
                          <Eye size={12} /> Leer
                        </span>
                      </div>
                    </div>

                    {/* Título y Autor/Extensión debajo */}
                    <div className="mt-2 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate line-clamp-1" title={ebook.title}>
                        {ebook.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                        <span className="uppercase font-semibold text-amber-500">{ebook.type}</span>
                        
                        {/* Menú de acciones */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShareEbook(ebook); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-600 transition-all"
                            disabled={sharingId === ebook.id}
                            title="Compartir"
                          >
                            {sharingId === ebook.id ? (
                              <Loader2 size={11} className="animate-spin text-amber-500" />
                            ) : (
                              <Share2 size={11} />
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRenameModal({ type: 'ebook', id: ebook.id, name: ebook.title }); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                            title="Renombrar"
                          >
                            <Pencil size={11} />
                          </button>
                          {ebook.type !== 'image' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setCoverModal({ ebookId: ebook.id, title: ebook.title, coverUrl: ebook.coverUrl }); }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                              title="Cambiar Portada"
                            >
                              <Image size={11} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setMoveModal({ type: 'ebook', id: ebook.id, name: ebook.title }); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-500"
                            title="Mover de Carpeta"
                          >
                            <Move size={11} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'ebook', id: ebook.id, name: ebook.title }); }}
                            className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                            title="Eliminar"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MODAL: CREAR CARPETA ─────────────────────── */}
      {folderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <FolderPlus size={16} className="text-amber-500" />
              Nueva Carpeta
            </h3>
            <FolderForm 
              initialName="" 
              onSave={handleSaveFolder} 
              onClose={() => setFolderModal(null)} 
            />
          </div>
        </div>
      )}

      {/* ── MODAL: RENOMBRAR ELEMENTO ────────────────────────── */}
      {renameModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Pencil size={16} className="text-amber-500" />
              {renameModal.type === 'folder' ? 'Renombrar Carpeta' : 'Renombrar Archivo'}
            </h3>
            <FolderForm 
              initialName={renameModal.name || ''} 
              onSave={handleRenameSave} 
              onClose={() => setRenameModal(null)} 
            />
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAR ELIMINACIÓN ────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Confirmar Eliminación</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              ¿Estás seguro de que querés eliminar {deleteConfirm.type === 'folder' ? 'la carpeta' : 'el archivo'}{' '}
              <strong className="text-slate-700">"{deleteConfirm.name}"</strong>?
              {deleteConfirm.type === 'folder' && ' Los elementos contenidos se moverán a la carpeta superior.'}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-semibold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-semibold transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MOVER ELEMENTO ───────────────────────────────── */}
      {moveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-1">Organizar / Mover</h3>
            <p className="text-[10px] text-slate-400 mb-4 line-clamp-1">Moviendo: {moveModal.name}</p>
            
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              <button 
                onClick={() => handleMoveItem(null)}
                className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
              >
                📁 Raíz (Mis Ebooks)
              </button>
              
              {folders
                .filter(f => f.id !== moveModal.id) // No mover carpeta a sí misma
                .map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => handleMoveItem(f.id)}
                    className="flex items-center gap-2 px-3.5 py-3 rounded-2xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 text-left truncate"
                  >
                    <Folder size={12} className="text-amber-500 fill-amber-500/10 flex-shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
            </div>

            <button 
              onClick={() => setMoveModal(null)} 
              className="w-full mt-4 py-2.5 text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR PORTADA MANUAL ────────────────────────── */}
      {coverModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-1">Personalizar Portada</h3>
            <p className="text-[10px] text-slate-400 mb-4 truncate">{coverModal.title}</p>
            
            <CoverForm 
              initialUrl={coverModal.coverUrl || ''} 
              onSave={handleUpdateCoverUrl}
              onUpload={handleCoverUpload}
              onClose={() => setCoverModal(null)} 
            />
          </div>
        </div>
      )}

      {/* ── MODAL VISOR DE LECTURA COMPLETO (PDF / WORD) ────────── */}
      {activeReader && (
        <EbookReaderModal 
          ebook={activeReader} 
          onClose={() => setActiveReader(null)} 
        />
      )}

    </div>
  );
}

// ── COMPONENTE INTERNO: FORMULARIO DE CARPETA ─────────────────
function FolderForm({ initialName, onSave, onClose }) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(name);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nombre de la carpeta..."
        maxLength={30}
        className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <div className="flex gap-2">
        <button 
          type="button" 
          onClick={onClose}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-semibold"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={!name.trim()}
          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-2xl text-xs font-bold transition-all"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

// ── COMPONENTE INTERNO: CONFIGURAR PORTADA ──────────────────
function CoverForm({ initialUrl, onSave, onUpload, onClose }) {
  const [url, setUrl] = useState(initialUrl.startsWith('data:') ? '' : initialUrl);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(url.trim());
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Opción Subir Archivo local */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subir desde dispositivo</label>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 transition-all active:scale-98"
        >
          <Upload size={14} className="text-slate-400" />
          Seleccionar imagen
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <div className="flex items-center my-1">
        <hr className="flex-1 border-slate-100" />
        <span className="text-[10px] text-slate-400 font-bold uppercase mx-3">O</span>
        <hr className="flex-1 border-slate-100" />
      </div>

      {/* Opción URL */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">URL de la Portada</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://ejemplo.com/portada.jpg"
            className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-semibold"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition-all"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

// ── COMPONENTE INTERNO: MODAL LECTOR PREMIUM (PDF / WORD) ──
function EbookReaderModal({ ebook, onClose }) {
  const [loading, setLoading] = useState(true);
  const [contentHtml, setContentHtml] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Ajustes de lectura (para Word HTML)
  const [fontSize, setFontSize] = useState(16); // px
  const [theme, setTheme] = useState('sepia'); // light, sepia, dark
  useEffect(() => {
    let objectUrl = '';

    if (ebook.type === 'pdf' || ebook.type === 'image') {
      try {
        objectUrl = URL.createObjectURL(ebook.fileBlob);
        setPdfUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        setErrorMsg(ebook.type === 'image' ? 'No se pudo cargar la imagen' : 'No se pudo inicializar el visor de PDF');
        setLoading(false);
      }
    } else {
      // Word (.docx) -> convertir a HTML usando mammoth.js
      const reader = new FileReader();
      reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        if (!window.mammoth) {
          setErrorMsg('Librería de lectura de Word no cargada. Reintentá en unos segundos.');
          setLoading(false);
          return;
        }

        window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
          .then((result) => {
            setContentHtml(result.value);
            setLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setErrorMsg('Error al convertir documento Word a HTML.');
            setLoading(false);
          });
      };
      reader.onerror = () => {
        setErrorMsg('Error al leer el archivo desde el dispositivo');
        setLoading(false);
      };
      reader.readAsArrayBuffer(ebook.fileBlob);
    }

    // Limpiar blob URL al desmontar
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ebook]);

  // Estilos del tema del lector
  const readerThemeClass = useMemo(() => {
    if (ebook.type === 'image') return 'bg-slate-950 text-slate-200';
    if (theme === 'dark') return 'bg-slate-900 text-slate-300';
    if (theme === 'sepia') return 'bg-[#f4ecd8] text-[#5b4636]';
    return 'bg-white text-slate-800';
  }, [theme, ebook.type]);
  return (
    <div className={`fixed inset-0 z-[70] flex flex-col ${readerThemeClass} transition-colors duration-200`}>
      
      {/* Cabecera del Lector */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/5 border-b border-black/10 backdrop-blur-sm">
        <button 
          onClick={onClose}
          className="flex items-center gap-1 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-full text-xs font-bold transition-all"
        >
          <ArrowLeft size={13} /> Volver
        </button>

        <span className="text-xs font-bold truncate max-w-[50%] text-center">
          {ebook.title}
        </span>

        {/* Ajustes de Lectura (Solo para Word/HTML) */}
        {ebook.type === 'docx' ? (
          <div className="flex items-center gap-3">
            {/* Control Tamaño Fuente */}
            <div className="flex items-center gap-1 bg-black/10 rounded-full px-2 py-0.5">
              <button 
                onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                className="w-6 h-6 flex items-center justify-center font-bold text-xs"
              >
                A-
              </button>
              <span className="text-[10px] font-bold w-4 text-center">{fontSize}</span>
              <button 
                onClick={() => setFontSize(prev => Math.min(26, prev + 2))}
                className="w-6 h-6 flex items-center justify-center font-bold text-xs"
              >
                A+
              </button>
            </div>

            {/* Selector de Temas */}
            <div className="flex items-center bg-black/10 rounded-full p-0.5">
              <button 
                onClick={() => setTheme('light')}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${theme === 'light' ? 'bg-white text-slate-800 shadow' : ''}`}
                title="Día"
              >
                <Sun size={12} />
              </button>
              <button 
                onClick={() => setTheme('sepia')}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${theme === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636] shadow' : ''}`}
                title="Sepia"
              >
                S
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${theme === 'dark' ? 'bg-slate-800 text-slate-300 shadow' : ''}`}
                title="Noche"
              >
                <Moon size={12} />
              </button>
            </div>
          </div>
        ) : ebook.type === 'image' ? (
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Visualizador de Foto</span>
        ) : (
          /* Para PDF */
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Visualizador PDF</span>
        )}
      </div>

      {/* Contenido / Visor */}
      <div className="flex-1 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 size={32} className="animate-spin text-amber-500" />
            <span className="text-xs font-semibold opacity-60">Preparando documento...</span>
          </div>
        )}

        {errorMsg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-2">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm font-bold text-red-500">{errorMsg}</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full text-xs font-semibold"
            >
              Cerrar visor
            </button>
          </div>
        )}

        {!loading && !errorMsg && (
          <>
            {ebook.type === 'pdf' ? (
              <iframe 
                src={pdfUrl} 
                className="w-full h-full border-none" 
                title={ebook.title}
              />
            ) : ebook.type === 'image' ? (
              <div className="w-full h-full flex items-center justify-center p-4 bg-slate-950">
                <img 
                  src={pdfUrl} 
                  alt={ebook.title} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg select-none"
                />
              </div>
            ) : (
              /* Lector Word / HTML */
              <div 
                className="max-w-2xl mx-auto px-6 py-8 md:py-12 leading-relaxed break-words markdown-body"
                style={{ fontSize: `${fontSize}px` }}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            )}
          </>
        )}
      </div>
      
    </div>
  );
}
