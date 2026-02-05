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
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
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
  AlertCircle,
  Calendar,
  FileText,
  Info,
  Maximize2,
  Minimize2,
  UserPlus,
  UserCheck,
  Users
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDM9GK7_gnd0GaVbxwK9xnwl0qk75MnFXw",
  authDomain: "playmobil-2d74d.firebaseapp.com",
  projectId: "playmobil-2d74d",
  storageBucket: "playmobil-2d74d.firebasestorage.app",
  messagingSenderId: "85202851148",
  appId: "1:85202851148:web:bf8eba63238c06c7b4ebe9",
  measurementId: "G-MX2B76PCD6"
};

const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || "";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'sandbook-v1';

// --- DEFINICIÓN DE INSIGNIAS (Secretas) ---
const BADGE_DEFS = {
  1: { name: "Velocista", desc: "Al libro más rápido en leer" },
  2: { name: "Titán de Páginas", desc: "Al libro más largo leído" },
  3: { name: "Primer Paso", desc: "Al leer tu primer libro" },
  4: { name: "Rayo", desc: "Leer un libro en un día" },
  5: { name: "Semana de Hierro", desc: "Leer un libro en una semana" },
  6: { name: "Mes de Tinta", desc: "Leer un libro en un mes" },
  7: { name: "Lector de Cuna", desc: "Por leer 10 libros" },
  8: { name: "Perfeccionista", desc: "Cumplir meta sin saltear días" },
  9: { name: "Veinteañero", desc: "20 libros en un año" },
  10: { name: "Treintañero", desc: "30 libros en un año" },
  11: { name: "Cincuentenario", desc: "50 libros en total" },
  12: { name: "Centenario", desc: "100 libros en total" },
  13: { name: "El Gran Año", desc: "50 libros en un año" },
  14: { name: "Escáner Novato", desc: "10 libros escaneados" },
  15: { name: "Escáner Activo", desc: "20 libros escaneados" },
  16: { name: "Escáner Experto", desc: "30 libros escaneados" },
  17: { name: "Escáner Pro", desc: "40 libros escaneados" },
  18: { name: "Maestro Escáner", desc: "50 libros escaneados" },
  19: { name: "Leyenda Escáner", desc: "100 libros escaneados" },
  20: { name: "Perfección Absoluta", desc: "Cumplir 19 insignias" }
};

// --- COMPONENTES AUXILIARES ---

const VerificationBadge = ({ followers = 0, size = 16 }) => {
  if (followers >= 100000) return <CheckCircle size={size} className="text-yellow-500 fill-yellow-50" />;
  if (followers >= 10000) return <CheckCircle size={size} className="text-slate-400 fill-slate-50" />;
  if (followers >= 1000) return <CheckCircle size={size} className="text-blue-500 fill-blue-50" />;
  if (followers >= 100) return <CheckCircle size={size} className="text-green-500 fill-green-50" />;
  if (followers >= 10) return <CheckCircle size={size} className="text-amber-800 fill-amber-50" />;
  return null;
};

const getUserLevel = (readCount = 0) => {
  if (readCount >= 100000) return "Legendario";
  if (readCount >= 10000) return "Experto Superior";
  if (readCount >= 1000) return "Experto";
  if (readCount >= 100) return "Amateur";
  if (readCount >= 10) return "Nivel 1 Novato";
  if (readCount >= 1) return "Principiante";
  return "Iniciado";
};

const SliderLeido = ({ onToggle, isRead }) => {
  return (
    <div 
      onClick={onToggle}
      className={`relative w-24 h-10 rounded-full cursor-pointer transition-all duration-300 p-1 ${isRead ? 'bg-green-500' : 'bg-slate-200'}`}
    >
      <div className={`absolute top-1 bottom-1 w-8 bg-white rounded-full shadow-md transition-all duration-300 transform ${isRead ? 'translate-x-14' : 'translate-x-0'}`} />
      <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase pointer-events-none transition-opacity ${isRead ? 'text-white opacity-100' : 'text-slate-400 opacity-50'}`}>
        {isRead ? 'Leído' : 'Pendiente'}
      </span>
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); 
  const [myBooks, setMyBooks] = useState([]);
  const [publicData, setPublicData] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: '', profilePic: '', badges: [], scanCount: 0, followersCount: 0, following: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); 
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [filterType, setFilterType] = useState('all');
  
  // UI States
  const [planningBook, setPlanningBook] = useState(null);
  const [planDays, setPlanDays] = useState(7);
  const [manualPages, setManualPages] = useState("");
  const [expandedBooks, setExpandedBooks] = useState(new Set());
  const [bookComments, setBookComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const victoryAudio = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"));

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
    
    // Libros del usuario
    const unsubBooks = onSnapshot(collection(db, 'users', user.uid, 'myBooks'), (s) => {
      setMyBooks(s.docs.map(d => d.data()));
    });

    // Perfil propio
    const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (d) => {
      if (d.exists()) {
        setUserProfile(prev => ({ ...prev, ...d.data() }));
      } else {
        const defaultName = `Lector_${user.uid.slice(0,4)}`;
        setDoc(doc(db, 'profiles', user.uid), { 
          userId: user.uid, name: defaultName, badges: [], scanCount: 0, readCount: 0, profilePic: '', followersCount: 0, following: [] 
        });
      }
    });

    // Otros usuarios para la red
    const unsubPublic = onSnapshot(collection(db, 'profiles'), (s) => {
      setPublicData(s.docs.map(d => d.data()));
    });

    // Comentarios
    const unsubComments = onSnapshot(collection(db, 'comments'), (s) => {
      const map = {};
      s.docs.forEach(doc => {
        const data = doc.data();
        if (!map[data.bookId]) map[data.bookId] = [];
        map[data.bookId].push({ id: doc.id, ...data });
      });
      setBookComments(map);
    });

    return () => { unsubBooks(); unsubProfile(); unsubPublic(); unsubComments(); };
  }, [user]);

  // --- LÓGICA SOCIAL ---
  const toggleFollow = async (targetUserId) => {
    if (!user || user.uid === targetUserId) return;
    const isFollowing = userProfile.following?.includes(targetUserId);

    // Actualizar mi perfil (lista de seguidos)
    await updateDoc(doc(db, 'profiles', user.uid), {
      following: isFollowing ? arrayRemove(targetUserId) : arrayUnion(targetUserId)
    });

    // Actualizar perfil ajeno (conteo de seguidores)
    await updateDoc(doc(db, 'profiles', targetUserId), {
      followersCount: increment(isFollowing ? -1 : 1)
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserProfile(p => ({ ...p, profilePic: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const performSearch = async (forcedQ = null) => {
    const q = (forcedQ || searchQuery).trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      let queryParam = q;
      if (searchType === 'isbn' || /^\d+$/.test(q.replace(/-/g, ''))) queryParam = `isbn:${q.replace(/\D/g, '')}`;
      else if (searchType === 'intitle') queryParam = `intitle:${q}`;
      else if (searchType === 'inauthor') queryParam = `inauthor:${q}`;

      let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(queryParam)}&maxResults=15`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;

      const res = await fetchWithRetry(url);
      const data = await res.json();
      if (data.items) setSearchResults(data.items);
      else setSearchError("No se encontraron resultados.");
    } catch (err) { setSearchError("Error de conexión con Google."); } finally { setIsSearching(false); }
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
            updateDoc(doc(db, 'profiles', user.uid), { scanCount: increment(1) });
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
      thumbnail: bookData.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150',
      status, totalPages: bookData.volumeInfo.pageCount || 0, isFavorite: isFav, checkpoints: [], addedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid, 'myBooks', bookData.id), info);
    if (status === 'reading') { setPlanningBook(info); setManualPages(info.totalPages || ""); }
    else if (status === 'read') {
       const newReadCount = myBooks.filter(b => b.status === 'read').length + 1;
       await updateDoc(doc(db, 'profiles', user.uid), { readCount: newReadCount });
    }
    setActiveTab('library');
  };

  const saveAutomaticPlan = async () => {
    if (!user || !planningBook) return;
    const pages = parseInt(manualPages);
    const days = parseInt(planDays);
    if (isNaN(pages) || isNaN(days) || pages <= 0 || days <= 0) return;

    const pagesPerDay = Math.ceil(pages / days);
    const checkpoints = [];
    for (let i = 1; i <= days; i++) {
      checkpoints.push({ title: `Día ${i}: leer aprox. ${pagesPerDay} págs`, completed: false });
    }

    await updateDoc(doc(db, 'users', user.uid, 'myBooks', planningBook.bookId), {
      totalPages: pages, checkpoints, status: 'reading', startDate: new Date().toISOString()
    });
    setPlanningBook(null);
    setActiveTab('library');
  };

  const toggleCheckpoint = async (bookId, idx) => {
    const book = myBooks.find(b => b.bookId === bookId);
    const nCP = [...book.checkpoints];
    nCP[idx].completed = !nCP[idx].completed;
    const allDone = nCP.every(c => c.completed);
    
    const updateData = { checkpoints: nCP, status: allDone ? 'read' : 'reading' };
    if (allDone) {
      updateData.endDate = new Date().toISOString();
      victoryAudio.current.play().catch(() => {});
      const newReadCount = myBooks.filter(b => b.status === 'read').length + 1;
      await updateDoc(doc(db, 'profiles', user.uid), { readCount: newReadCount });
    }
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), updateData);
  };

  const postComment = async (bookId) => {
    if (!newComment.trim() || !user) return;
    await addDoc(collection(db, 'comments'), {
      bookId, userId: user.uid, userName: userProfile.name, userPic: userProfile.profilePic, text: newComment, timestamp: serverTimestamp()
    });
    setNewComment("");
  };

  const filteredBooks = myBooks.filter(b => {
    if (filterType === 'favorite') return b.isFavorite;
    if (filterType === 'read') return b.status === 'read';
    if (filterType === 'want') return b.status === 'reading' || b.status === 'want';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><BookOpen size={20} strokeWidth={3} /></div>
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tight">Sandbook</h1>
        </div>
        <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200 pr-3">
          {userProfile.profilePic ? <img src={userProfile.profilePic} className="w-8 h-8 rounded-full object-cover border-2 border-white" /> : <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{userProfile.name?.charAt(0)}</div>}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-700 hidden sm:block truncate max-w-[80px]">{userProfile.name}</span>
            <VerificationBadge followers={userProfile.followersCount} />
          </div>
        </button>
      </header>

      {/* MODAL PLANIFICADOR */}
      {planningBook && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-indigo-600"><Calendar /> Plan de Lectura</h3>
            <div className="space-y-4">
               <div><label className="text-[10px] font-black text-slate-400 uppercase">Páginas</label>
               <input type="number" value={manualPages} onChange={(e) => setManualPages(e.target.value)} className="w-full bg-slate-50 border rounded-2xl p-4 mt-1 font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: 300" /></div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase">Días</label>
               <input type="number" value={planDays} onChange={(e) => setPlanDays(e.target.value)} className="w-full bg-slate-50 border rounded-2xl p-4 mt-1 font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: 7" /></div>
               <button onClick={saveAutomaticPlan} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg mt-4">Comenzar Aventura</button>
               <button onClick={() => setPlanningBook(null)} className="w-full text-slate-400 font-bold text-xs mt-2">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESCÁNER */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white">
          <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden border-2 border-indigo-500" id="reader"></div>
          <p className="mt-8 font-bold animate-pulse text-xs uppercase">Escaneando ISBN...</p>
          <button onClick={() => setShowScanner(false)} className="absolute top-10 right-10 p-3 bg-white/10 rounded-full"><X size={24} /></button>
        </div>
      )}

      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* VISTA BIBLIOTECA */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Nivel de Usuario</p>
                      <VerificationBadge followers={userProfile.followersCount} size={14} />
                    </div>
                    <h2 className="text-2xl font-black">{getUserLevel(userProfile.readCount)}</h2>
                  </div>
                  <Trophy size={32} className="opacity-20" />
                </div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-2"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(((userProfile.badges?.length || 0)/20)*100, 100)}%` }} /></div>
                <div className="flex justify-between text-[10px] font-black uppercase opacity-80">
                  <span>{userProfile.readCount || 0} Libros leídos</span>
                  <span>{userProfile.badges?.length || 0}/20 Logros</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['all', 'read', 'want', 'favorite'].map(type => (
                <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all ${filterType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-400'}`}>
                  {type === 'all' ? 'Todo' : type === 'read' ? 'Leídos' : type === 'want' ? 'En Curso' : 'Favoritos ⭐'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredBooks.map((book, i) => {
                const isExp = expandedBooks.has(book.bookId);
                const perc = book.checkpoints?.length > 0 ? (book.checkpoints.filter(c => c.completed).length / book.checkpoints.length) * 100 : (book.status === 'read' ? 100 : 0);
                return (
                  <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4">
                    <div className="flex gap-4 mb-4">
                      <img src={book.thumbnail} className="w-16 h-24 object-cover rounded-xl shadow-sm" />
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{book.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                           <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-700" style={{width: `${perc}%`}} /></div>
                           <span className="text-[10px] font-black text-indigo-600">{Math.round(perc)}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={async () => await updateDoc(doc(db, 'users', user.uid, 'myBooks', book.bookId), { isFavorite: !book.isFavorite })}><Star size={18} className={book.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} /></button>
                        <button onClick={() => { const n = new Set(expandedBooks); if(n.has(book.bookId)) n.delete(book.bookId); else n.add(book.bookId); setExpandedBooks(n); }} className="p-2 bg-slate-50 rounded-xl text-slate-400">{isExp ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>
                      </div>
                    </div>
                    {isExp && book.checkpoints?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-50 animate-in slide-in-from-top-2">
                        {book.checkpoints.map((cp, idx) => (
                          <button key={idx} onClick={() => toggleCheckpoint(book.bookId, idx)} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border ${cp.completed ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                            <div className="flex items-center gap-3"><div className={`w-4 h-4 rounded-full border-2 ${cp.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300'}`}/><span className="text-xs font-bold">{cp.title}</span></div>
                            {cp.completed && <CheckCircle size={14}/>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VISTA BUSCADOR */}
        {activeTab === 'search' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {['all','intitle','inauthor','isbn'].map(m => (
                  <button key={m} onClick={() => setSearchType(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${searchType === m ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{m === 'all' ? 'Todo' : m === 'intitle' ? 'Título' : m === 'inauthor' ? 'Autor' : 'ISBN'}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Busca libros o autores..." className="flex-1 bg-slate-50 border rounded-[1.5rem] px-6 py-4 outline-none font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && performSearch()} />
                <button onClick={startScanner} className="bg-indigo-100 text-indigo-600 p-4 rounded-[1.25rem]"><Camera size={24}/></button>
              </div>
              <button onClick={() => performSearch()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                {isSearching ? <Loader2 className="animate-spin" size={16}/> : <><Search size={16}/> Buscar en Sandbook</>}
              </button>
            </div>

            <div className="space-y-4">
              {searchResults.map((book) => {
                const coms = bookComments[book.id] || [];
                const alreadyHave = myBooks.find(b => b.bookId === book.id);
                return (
                  <div key={book.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in zoom-in-95">
                    <div className="flex gap-5">
                      <img src={book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150'} className="w-24 h-36 object-cover rounded-2xl shadow-md" />
                      <div className="flex-1 flex flex-col">
                        <h3 className="font-bold text-sm leading-tight mb-1">{book.volumeInfo.title}</h3>
                        <p className="text-xs text-indigo-500 font-bold mb-4">{book.volumeInfo.authors?.join(', ')}</p>
                        
                        <div className="mt-auto space-y-3">
                          {/* BOTÓN DESLIZADOR LEÍDO */}
                          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
                             <span className="text-[9px] font-black uppercase text-slate-400 ml-2">¿Leído?</span>
                             <SliderLeido isRead={alreadyHave?.status === 'read'} onToggle={() => handleAddBook(book, alreadyHave?.status === 'read' ? 'want' : 'read')} />
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => setPlanningBook(book)} className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-[9px] font-black uppercase shadow-sm active:scale-95 transition-all">Planificar</button>
                            <button onClick={() => handleAddBook(book, 'want', true)} className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl active:scale-95 transition-all"><Star size={16}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-50">
                       <p className="text-[10px] text-slate-500 line-clamp-2 italic mb-4">{book.volumeInfo.description}</p>
                       <div className="space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MessageSquare size={12}/> Reseñas ({coms.length})</p>
                          {coms.map(c => (
                            <div key={c.id} className="bg-slate-50 p-3 rounded-2xl">
                               <div className="flex items-center gap-2 mb-1">
                                  {c.userPic ? <img src={c.userPic} className="w-4 h-4 rounded-full" /> : <div className="w-4 h-4 bg-indigo-200 rounded-full text-[7px] font-black flex items-center justify-center">{c.userName?.charAt(0)}</div>}
                                  <span className="text-[8px] font-bold text-slate-700">{c.userName}</span>
                               </div>
                               <p className="text-[10px] text-slate-600 leading-tight">{c.text}</p>
                            </div>
                          ))}
                          <div className="relative mt-2">
                             <input type="text" placeholder="Escribe tu reseña..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] pr-10 outline-none focus:ring-1 focus:ring-indigo-300" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && postComment(book.id)} />
                             <button onClick={() => postComment(book.id)} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600"><Send size={14}/></button>
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA RED SOCIAL */}
        {activeTab === 'social' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Users size={24}/></div>
                   <div><h3 className="font-black text-lg">Comunidad</h3><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Encuentra nuevos amigos</p></div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-3">
                {publicData.filter(p => p.userId !== user?.uid).map(p => (
                   <div key={p.userId} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="relative">
                            {p.profilePic ? <img src={p.profilePic} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" /> : <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center font-black text-indigo-600 text-lg">{p.name?.charAt(0)}</div>}
                            <div className="absolute -bottom-1 -right-1"><VerificationBadge followers={p.followersCount} size={14} /></div>
                         </div>
                         <div>
                            <div className="flex items-center gap-1"><h4 className="font-bold text-slate-800 text-sm">{p.name}</h4></div>
                            <div className="flex items-center gap-2 mt-0.5">
                               <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">{getUserLevel(p.readCount)}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase">{p.followersCount || 0} Seguidores</span>
                            </div>
                         </div>
                      </div>
                      <button 
                        onClick={() => toggleFollow(p.userId)}
                        className={`p-3 rounded-2xl transition-all ${userProfile.following?.includes(p.userId) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50'}`}
                      >
                         {userProfile.following?.includes(p.userId) ? <UserCheck size={20}/> : <UserPlus size={20}/>}
                      </button>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* VISTA PERFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center relative overflow-hidden">
              <button onClick={() => setIsEditingProfile(true)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 transition-all shadow-sm"><Edit3 size={18} /></button>
              
              <div className="relative w-32 h-32 mx-auto mb-4">
                {userProfile.profilePic ? <img src={userProfile.profilePic} className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" /> : <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-xl">{userProfile.name?.charAt(0)}</div>}
                <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-lg border border-slate-100"><VerificationBadge followers={userProfile.followersCount} size={28} /></div>
              </div>

              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
                {userProfile.name}
              </h2>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">{getUserLevel(userProfile.readCount)}</p>
              
              <div className="flex justify-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 p-4 rounded-3xl border border-slate-100">
                 <div className="text-center"><span className="text-indigo-600 text-lg block">{userProfile.readCount || 0}</span>Libros</div>
                 <div className="w-px h-8 bg-slate-200"></div>
                 <div className="text-center"><span className="text-purple-600 text-lg block">{userProfile.followersCount || 0}</span>Fans</div>
                 <div className="w-px h-8 bg-slate-200"></div>
                 <div className="text-center"><span className="text-amber-600 text-lg block">{userProfile.badges?.length || 0}</span>Logros</div>
              </div>
            </div>

            {isEditingProfile && (
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-500 shadow-xl space-y-4 animate-in slide-in-from-top-4">
                <h3 className="font-black text-sm uppercase flex items-center gap-2"><Settings size={18} /> Ajustes de Perfil</h3>
                <div className="space-y-4">
                  <input type="text" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="Nombre..." />
                  <label className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-4 cursor-pointer text-slate-400 hover:text-indigo-600 transition-all">
                    <Upload size={18} /> <span className="text-xs font-bold">Cambiar Foto</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button onClick={async () => { await updateDoc(doc(db, 'profiles', user.uid), { name: userProfile.name, profilePic: userProfile.profilePic }); setIsEditingProfile(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all">Guardar Cambios</button>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><Award size={18} className="text-amber-500" /> Mis Logros Secretos</h3>
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 20 }).map((_, i) => {
                  const id = (i + 1).toString();
                  const unlocked = userProfile.badges?.includes(id);
                  return (
                    <div key={id} className="flex flex-col items-center gap-1 group relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 transform ${unlocked ? 'bg-indigo-50 shadow-md scale-100' : 'bg-slate-50 opacity-20 scale-90'}`}>
                        {unlocked ? (
                          <img src={`/${id}.png`} className="w-full h-full object-contain p-1" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/5971/5971593.png"; }} />
                        ) : (
                          <Lock size={20} className="text-slate-300" />
                        )}
                      </div>
                      <span className={`text-[7px] font-black text-center uppercase leading-tight ${unlocked ? 'text-indigo-600' : 'text-slate-200'}`}>
                        {unlocked ? BADGE_DEFS[id].name : "???"}
                      </span>
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
          {id: 'library', icon: Layout, label: 'Inicio'}, {id: 'search', icon: Search, label: 'Planear'}, {id: 'social', icon: Globe, label: 'Red'}, {id: 'profile', icon: User, label: 'Yo'}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === t.id ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <t.icon size={22} strokeWidth={activeTab === t.id ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

