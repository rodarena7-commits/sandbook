import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { 
  BookOpen, 
  Search, 
  Trophy, 
  Plus, 
  CheckCircle, 
  Layout, 
  User,
  Award,
  Loader2,
  PenTool,
  UserPlus,
  UserCheck,
  Globe,
  Camera,
  MessageSquare,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  Edit3,
  ListChecks,
  Lock,
  Flag,
  Sparkles,
  Star,
  Upload,
  Book as BookIcon,
  AlertCircle
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE (Tus credenciales reales) ---
const firebaseConfig = {
  apiKey: "AIzaSyDM9GK7_gnd0GaVbxwK9xnwl0qk75MnFXw",
  authDomain: "playmobil-2d74d.firebaseapp.com",
  projectId: "playmobil-2d74d",
  storageBucket: "playmobil-2d74d.firebasestorage.app",
  messagingSenderId: "85202851148",
  appId: "1:85202851148:web:bf8eba63238c06c7b4ebe9",
  measurementId: "G-MX2B76PCD6"
};

// --- VARIABLE DE ENTORNO PARA SEGURIDAD ---
// En Render debes crear una variable llamada VITE_GOOGLE_BOOKS_API_KEY
const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || "";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'sandbook-v1';

const BADGE_LEVELS = [
  { id: 1, min: 1, name: "Primeras Letras" }, { id: 2, min: 3, name: "Curiosidad Despierta" },
  { id: 3, min: 5, name: "Pequeño Lector" }, { id: 4, min: 8, name: "Senda de Tinta" },
  { id: 5, min: 12, name: "Ratón de Biblioteca" }, { id: 6, min: 18, name: "Viajero Novato" },
  { id: 7, min: 25, name: "Explorador de Mundos" }, { id: 8, min: 35, name: "Coleccionista de Historias" },
  { id: 9, min: 45, name: "Buscador de Sabiduría" }, { id: 10, min: 55, name: "Devorador de Páginas" },
  { id: 11, min: 65, name: "Mente Inquieta" }, { id: 12, min: 75, name: "Erudito en Potencia" },
  { id: 13, min: 90, name: "Maestro de la Tinta" }, { id: 14, min: 105, name: "Guardián del Saber" },
  { id: 15, min: 120, name: "Arquitecto de Sueños" }, { id: 16, min: 140, name: "Filósofo Moderno" },
  { id: 17, min: 165, name: "Titán Literario" }, { id: 18, min: 190, name: "Deidad de los Libros" },
  { id: 19, min: 220, name: "Leyenda Eterna" }, { id: 20, min: 250, name: "Omnisciente" }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); 
  const [myBooks, setMyBooks] = useState([]);
  const [publicData, setPublicData] = useState([]);
  const [follows, setFollows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); 
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [userName, setUserName] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [bookComments, setBookComments] = useState({}); 
  const [newComment, setNewComment] = useState("");
  const [expandedComments, setExpandedComments] = useState(null);
  const [editingPlanBook, setEditingPlanBook] = useState(null);
  const [tempCheckpoints, setTempCheckpoints] = useState([]);
  const [filterType, setFilterType] = useState('all');

  const victoryAudio = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"));

  // Función de reintento para evitar el error 429
  const fetchWithRetry = async (url, retries = 3, delay = 2000) => {
    const res = await fetch(url);
    if (res.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, retries - 1, delay * 2);
    }
    return res;
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode";
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) setUser(u);
      else await signInAnonymously(auth);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubMyBooks = onSnapshot(collection(db, 'users', user.uid, 'myBooks'), (s) => setMyBooks(s.docs.map(d => d.data())));
    const unsubProfiles = onSnapshot(collection(db, 'profiles'), (s) => setPublicData(s.docs.map(d => d.data())));
    const unsubComments = onSnapshot(collection(db, 'comments'), (s) => {
      const map = {};
      s.docs.forEach(doc => {
        const d = doc.data();
        if (!map[d.bookId]) map[d.bookId] = [];
        map[d.bookId].push({ id: doc.id, ...d });
      });
      setBookComments(map);
    });
    const unsubFollows = onSnapshot(collection(db, 'users', user.uid, 'following'), (s) => setFollows(s.docs.map(d => d.id)));

    getDoc(doc(db, 'profiles', user.uid)).then(d => {
      if (d.exists()) {
        setUserName(d.data().name || '');
        setProfilePic(d.data().profilePic || '');
      } else {
        const name = `Lector_${user.uid.slice(0,4)}`;
        setUserName(name);
        setDoc(doc(db, 'profiles', user.uid), { userId: user.uid, name, readCount: 0, profilePic: '' });
      }
    });
    return () => { unsubMyBooks(); unsubProfiles(); unsubComments(); unsubFollows(); };
  }, [user]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const performSearch = async (forcedQuery = null) => {
    const q = (forcedQuery || searchQuery).trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      let queryParam = q;
      if (searchType === 'isbn' || /^\d+$/.test(q.replace(/-/g, ''))) {
        queryParam = `isbn:${q.replace(/\D/g, '')}`;
      } else if (searchType === 'intitle') {
        queryParam = `intitle:${q}`;
      } else if (searchType === 'inauthor') {
        queryParam = `inauthor:${q}`;
      }

      let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(queryParam)}&maxResults=15`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;

      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      if (data.items) setSearchResults(data.items);
      else setSearchError("No se encontraron resultados.");
    } catch (err) {
      setSearchError("Google está saturado. Reintenta en unos segundos.");
    } finally {
      setIsSearching(false);
    }
  };

  const startScanner = () => {
    setShowScanner(true);
    setTimeout(() => {
      const html5QrCode = new window.Html5Qrcode("reader");
      html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, 
        (res) => { 
          html5QrCode.stop().then(() => {
            setShowScanner(false); 
            setSearchQuery(res);
            setSearchType('isbn');
            performSearch(res); 
          });
        },
        () => {}
      ).catch(() => setShowScanner(false));
    }, 500);
  };

  const handleAddBook = async (bookData, status, isFav = false) => {
    if (!user) return;
    const info = {
      bookId: bookData.id,
      title: bookData.volumeInfo.title,
      authors: bookData.volumeInfo.authors || ['Anónimo'],
      thumbnail: bookData.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150x220?text=Sandbook',
      status, isFavorite: isFav, checkpoints: [], addedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid, 'myBooks', bookData.id), info);
    if (status === 'reading') { setEditingPlanBook(info); setTempCheckpoints([]); }
    setActiveTab('library');
  };

  const toggleCheckpoint = async (bookId, idx) => {
    const book = myBooks.find(b => b.bookId === bookId);
    const nCP = [...book.checkpoints];
    nCP[idx].completed = !nCP[idx].completed;
    const allDone = nCP.every(c => c.completed);
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { checkpoints: nCP, status: allDone ? 'read' : 'reading' });
    if (allDone) {
      victoryAudio.current.play().catch(() => {});
      const newCount = myBooks.filter(b => b.status === 'read').length + 1;
      await updateDoc(doc(db, 'profiles', user.uid), { readCount: newCount });
    }
  };

  const readBooksCount = myBooks.filter(b => b.status === 'read').length;
  const filteredBooks = myBooks.filter(b => {
    if (filterType === 'favorite') return b.isFavorite;
    if (filterType === 'read') return b.status === 'read';
    if (filterType === 'want') return b.status === 'want';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 overflow-x-hidden">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
            <BookOpen size={20} strokeWidth={3} />
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tighter">Sandbook</h1>
        </div>
        <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200">
          {profilePic ? <img src={profilePic} className="w-8 h-8 rounded-full object-cover border-2 border-white" /> : <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{userName?.charAt(0)}</div>}
          <span className="text-xs font-bold text-slate-700 hidden sm:block max-w-[80px] truncate px-2">{userName}</span>
        </button>
      </header>

      {/* MODAL PLANNER */}
      {editingPlanBook && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl flex items-center gap-2 text-indigo-600"><ListChecks /> Planificar</h3>
              <button onClick={() => setEditingPlanBook(null)} className="p-2 bg-slate-100 rounded-full"><X size={18}/></button>
            </div>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
              {tempCheckpoints.map((cp, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={cp.title} onChange={(e) => { const n = [...tempCheckpoints]; n[i].title = e.target.value; setTempCheckpoints(n); }} className="flex-1 bg-slate-50 border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => setTempCheckpoints(tempCheckpoints.filter((_, idx) => idx !== i))} className="text-red-400 p-2"><X size={18} /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setTempCheckpoints([...tempCheckpoints, { title: `Capítulo ${tempCheckpoints.length + 1}`, completed: false }])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs mb-4">+ Agregar Checkpoint</button>
            <button onClick={async () => { await updateDoc(doc(db, 'users', user.uid, 'myBooks', editingPlanBook.bookId), { checkpoints: tempCheckpoints }); setEditingPlanBook(null); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Guardar Plan</button>
          </div>
        </div>
      )}

      {/* MODAL ESCÁNER */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden border-2 border-indigo-500 mb-8" id="reader"></div>
          <h2 className="text-xl font-bold">Escaneando ISBN</h2>
          <p className="text-slate-400 text-sm">Encuadra el código de barras</p>
          <button onClick={() => setShowScanner(false)} className="mt-8 p-4 bg-white/10 rounded-full"><X size={24} /></button>
        </div>
      )}

      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* BIBLIOTECA */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2.5rem] text-white shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                   {readBooksCount > 0 ? <img src={`/${BADGE_LEVELS.reverse().find(b => readBooksCount >= b.min)?.id}.png`} className="w-12 h-12 object-contain" onError={(e) => e.target.style.display='none'} /> : <Trophy size={24}/>}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Rango Sandbook</p>
                  <h2 className="text-2xl font-black">{BADGE_LEVELS.find(b => readBooksCount >= b.min)?.name || "Iniciado"}</h2>
                </div>
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-2"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min((readBooksCount/12)*100, 100)}%` }} /></div>
              <div className="flex justify-between text-[10px] font-bold opacity-80"><span>Logros: {readBooksCount} libros</span><span>Próxima meta: 12</span></div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['all', 'read', 'want', 'favorite'].map(type => (
                <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap border transition-all ${filterType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {type === 'all' ? 'Todo' : type === 'read' ? 'Leídos' : type === 'want' ? 'Para leer' : 'Favoritos ⭐'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredBooks.map((book, i) => {
                const perc = book.checkpoints?.length > 0 ? (book.checkpoints.filter(c => c.completed).length / book.checkpoints.length) * 100 : (book.status === 'read' ? 100 : 0);
                return (
                  <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in">
                    <div className="flex gap-4 mb-4">
                      <img src={book.thumbnail} className="w-14 h-20 object-cover rounded-xl shadow-sm" />
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{book.title}</h4>
                        <div className="mt-3 flex items-center gap-2"><div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all" style={{width: `${perc}%`}} /></div><span className="text-[10px] font-black text-indigo-600">{Math.round(perc)}%</span></div>
                      </div>
                      <button onClick={async () => await updateDoc(doc(db, 'users', user.uid, 'myBooks', book.bookId), { isFavorite: !book.isFavorite })}><Star size={20} className={book.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} /></button>
                    </div>
                    {book.checkpoints?.map((cp, idx) => (
                      <button key={idx} onClick={() => toggleCheckpoint(book.bookId, idx)} className={`w-full flex items-center justify-between p-3 mb-1 rounded-2xl transition-all border ${cp.completed ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                        <div className="flex items-center gap-3"><div className={`w-4 h-4 rounded-full border-2 ${cp.completed ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}/> <span className={`text-xs font-bold ${cp.completed ? 'line-through' : ''}`}>{cp.title}</span></div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* BUSCADOR */}
        {activeTab === 'search' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[{ id: 'all', label: 'Todo' }, { id: 'intitle', label: 'Título' }, { id: 'inauthor', label: 'Autor' }, { id: 'isbn', label: 'ISBN' }].map(m => (
                  <button key={m.id} onClick={() => setSearchType(m.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${searchType === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{m.label}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="text" placeholder="Buscar en Sandbook..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && performSearch()} />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <button onClick={startScanner} className="bg-indigo-100 text-indigo-600 p-4 rounded-[1.25rem] active:scale-95 transition-all"><Camera size={24}/></button>
              </div>
              <button onClick={() => performSearch()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                {isSearching ? <Loader2 className="animate-spin" size={16}/> : "Buscar Ahora"}
              </button>
            </div>

            {searchError && <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold border border-amber-100"><AlertCircle size={16}/> {searchError}</div>}

            <div className="space-y-4">
              {searchResults.map((book) => (
                <div key={book.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4 animate-in zoom-in-95">
                  <img src={book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150'} className="w-24 h-36 object-cover rounded-2xl shadow-md" />
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div><h3 className="font-bold text-sm leading-tight line-clamp-2">{book.volumeInfo.title}</h3><p className="text-xs text-indigo-500 font-bold mt-1">{book.volumeInfo.authors?.join(', ')}</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAddBook(book, 'reading')} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-[1rem] text-[9px] font-black uppercase">Planear</button>
                      <button onClick={() => handleAddBook(book, 'want', true)} className="p-2 bg-yellow-50 text-yellow-600 rounded-xl"><Star size={18}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center relative group">
              <button onClick={() => setIsEditingProfile(true)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600"><Edit3 size={18} /></button>
              <div className="relative w-28 h-28 mx-auto mb-4">{profilePic ? <img src={profilePic} className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" /> : <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-4xl border-4 border-white shadow-xl">{userName?.charAt(0)}</div>}</div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{userName}</h2>
            </div>

            {isEditingProfile && (
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-500 shadow-xl space-y-4">
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-slate-50 border rounded-2xl px-4 py-3 outline-none" placeholder="Tu nombre..." />
                <label className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-4 cursor-pointer text-slate-400 hover:text-indigo-600 transition-all">
                  <Upload size={18} /> <span className="text-xs font-bold">Cambiar Foto</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button onClick={async () => { if(!user) return; await updateDoc(doc(db, 'profiles', user.uid), { name: userName, profilePic: profilePic }); setIsEditingProfile(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs">Guardar Cambios</button>
              </div>
            )}

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> Logros Sandbook</h3>
              <div className="grid grid-cols-4 gap-4">
                {BADGE_LEVELS.map((b) => {
                  const unlocked = readBooksCount >= b.min;
                  return (
                    <div key={b.id} className="flex flex-col items-center gap-2 group relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${unlocked ? 'bg-indigo-50 shadow-md scale-100' : 'bg-slate-100 scale-90 opacity-40'}`}>
                        {unlocked ? <img src={`/${b.id}.png`} className="w-full h-full object-contain p-1 animate-in zoom-in" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/5971/5971593.png"; }} /> : <Lock size={20} className="text-slate-300" />}
                      </div>
                      <span className={`text-[8px] font-black text-center uppercase leading-tight ${unlocked ? 'text-indigo-600' : 'text-slate-400'}`}>{unlocked ? b.name : "???"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-8 py-4 flex justify-between items-center z-40 shadow-2xl">
        {[
          {id: 'library', icon: Layout, label: 'Inicio'}, {id: 'search', icon: Search, label: 'Planear'}, {id: 'profile', icon: User, label: 'Yo'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === t.id ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <t.icon size={22} strokeWidth={activeTab === t.id ? 2.5 : 2} />
          </button>
        ))}
      </nav>
    </div>
  );
}

