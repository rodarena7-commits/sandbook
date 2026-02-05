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
  orderBy
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
  Clock,
  Zap,
  Maximize2,
  Minimize2
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

// --- DEFINICIÓN DE LÓGICA DE INSIGNIAS ---
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

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); 
  const [myBooks, setMyBooks] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: '', profilePic: '', badges: [], scanCount: 0 });
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

    // Perfil y sus insignias
    const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (d) => {
      if (d.exists()) {
        setUserProfile(prev => ({ ...prev, ...d.data() }));
      } else {
        const defaultName = `Lector_${user.uid.slice(0,4)}`;
        setDoc(doc(db, 'profiles', user.uid), { 
          userId: user.uid, name: defaultName, badges: [], scanCount: 0, readCount: 0, profilePic: '' 
        });
      }
    });

    // Comentarios globales
    const unsubComments = onSnapshot(collection(db, 'comments'), (s) => {
      const map = {};
      s.docs.forEach(doc => {
        const data = doc.data();
        if (!map[data.bookId]) map[data.bookId] = [];
        map[data.bookId].push({ id: doc.id, ...data });
      });
      setBookComments(map);
    });

    return () => { unsubBooks(); unsubProfile(); unsubComments(); };
  }, [user]);

  // --- LÓGICA DE INSIGNIAS ---
  const checkAndAwardBadges = async (finishedBook = null) => {
    if (!user) return;
    const currentBadges = new Set(userProfile.badges || []);
    const readBooks = myBooks.filter(b => b.status === 'read');
    const totalRead = readBooks.length;
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearRead = readBooks.filter(b => new Date(b.endDate).getFullYear() === currentYear).length;

    // 1. Velocista (comparar duraciones)
    if (finishedBook) {
      const duration = (new Date(finishedBook.endDate) - new Date(finishedBook.startDate)) / (1000 * 60 * 60); // horas
      if (duration <= 24) currentBadges.add("4"); // Rayo
      if (duration <= 168) currentBadges.add("5"); // Semana
      if (duration <= 720) currentBadges.add("6"); // Mes
      
      // Chequear si fue perfecto (sin skips)
      if (finishedBook.isPerfect) currentBadges.add("8");
    }

    // Progresión de totales
    if (totalRead >= 1) currentBadges.add("3");
    if (totalRead >= 10) currentBadges.add("7");
    if (totalRead >= 50) currentBadges.add("11");
    if (totalRead >= 100) currentBadges.add("12");

    // Progresión por año
    if (yearRead >= 20) currentBadges.add("9");
    if (yearRead >= 30) currentBadges.add("10");
    if (yearRead >= 50) currentBadges.add("13");

    // Progresión Escáner
    const scans = userProfile.scanCount || 0;
    if (scans >= 10) currentBadges.add("14");
    if (scans >= 20) currentBadges.add("15");
    if (scans >= 30) currentBadges.add("16");
    if (scans >= 40) currentBadges.add("17");
    if (scans >= 50) currentBadges.add("18");
    if (scans >= 100) currentBadges.add("19");

    // Libro más largo
    if (readBooks.some(b => b.totalPages > 500)) currentBadges.add("2");

    // Insignia 20 (Perfección)
    if (currentBadges.size >= 19 && !currentBadges.has("20")) {
      currentBadges.add("20");
    }

    if (currentBadges.size > (userProfile.badges?.length || 0)) {
      victoryAudio.current.play().catch(() => {});
      await updateDoc(doc(db, 'profiles', user.uid), { 
        badges: Array.from(currentBadges),
        readCount: totalRead
      });
    }
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
    } catch (err) {
      setSearchError("Google está saturado. Prueba en un momento.");
    } finally { setIsSearching(false); }
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
            // Incrementar contador de escaneos
            updateDoc(doc(db, 'profiles', user.uid), { scanCount: (userProfile.scanCount || 0) + 1 });
            performSearch(res); 
          });
        },
        () => {}
      ).catch(() => setShowScanner(false));
    }, 500);
  };

  const saveAutomaticPlan = async () => {
    if (!user || !planningBook) return;
    const pages = parseInt(manualPages);
    const days = parseInt(planDays);
    if (isNaN(pages) || isNaN(days) || pages <= 0 || days <= 0) return;

    const pagesPerDay = Math.ceil(pages / days);
    const checkpoints = [];
    for (let i = 1; i <= days; i++) {
      checkpoints.push({
        title: `Día ${i}: leer aprox. ${pagesPerDay} págs`,
        completed: false,
        day: i
      });
    }

    const info = {
      bookId: planningBook.id,
      title: planningBook.volumeInfo.title,
      authors: planningBook.volumeInfo.authors || ['Anónimo'],
      thumbnail: planningBook.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150',
      status: 'reading',
      totalPages: pages,
      isPerfect: true, // Empieza perfecto hasta que saltee un día (lógica simplificada)
      startDate: new Date().toISOString(),
      checkpoints,
      addedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', user.uid, 'myBooks', planningBook.id), info);
    setPlanningBook(null);
    setActiveTab('library');
  };

  const toggleCheckpoint = async (bookId, idx) => {
    const book = myBooks.find(b => b.bookId === bookId);
    const nCP = [...book.checkpoints];
    nCP[idx].completed = !nCP[idx].completed;
    const allDone = nCP.every(c => c.completed);
    
    const updateData = { 
      checkpoints: nCP, 
      status: allDone ? 'read' : 'reading' 
    };

    if (allDone) {
      updateData.endDate = new Date().toISOString();
      await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), updateData);
      checkAndAwardBadges({ ...book, ...updateData });
    } else {
      await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), updateData);
    }
  };

  const toggleExpand = (bookId) => {
    const next = new Set(expandedBooks);
    if (next.has(bookId)) next.delete(bookId);
    else next.add(bookId);
    setExpandedBooks(next);
  };

  const postComment = async (bookId) => {
    if (!newComment.trim() || !user) return;
    await addDoc(collection(db, 'comments'), {
      bookId, userId: user.uid, userName: userProfile.name, userPic: userProfile.profilePic, text: newComment, timestamp: serverTimestamp()
    });
    setNewComment("");
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
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><BookOpen size={20} strokeWidth={3} /></div>
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tight">Sandbook</h1>
        </div>
        <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200">
          {userProfile.profilePic ? <img src={userProfile.profilePic} className="w-8 h-8 rounded-full object-cover border-2 border-white" /> : <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{userProfile.name?.charAt(0)}</div>}
          <span className="text-xs font-bold px-2 text-slate-700 hidden sm:block truncate max-w-[100px]">{userProfile.name}</span>
        </button>
      </header>

      {/* MODAL PLANIFICADOR */}
      {planningBook && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-indigo-600"><Calendar /> Planificar Lectura</h3>
            <div className="space-y-4">
               <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Páginas totales</label>
               <input type="number" value={manualPages} onChange={(e) => setManualPages(e.target.value)} className="w-full bg-slate-50 border rounded-2xl p-4 mt-1 font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: 300" /></div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">¿En cuántos días?</label>
               <input type="number" value={planDays} onChange={(e) => setPlanDays(e.target.value)} className="w-full bg-slate-50 border rounded-2xl p-4 mt-1 font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: 7" /></div>
               <button onClick={saveAutomaticPlan} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg mt-4">Comenzar Aventura</button>
               <button onClick={() => setPlanningBook(null)} className="w-full text-slate-400 font-bold text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESCÁNER */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white">
          <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden border-2 border-indigo-500" id="reader"></div>
          <p className="mt-8 font-bold animate-pulse uppercase tracking-widest text-xs">Escaneando ISBN...</p>
          <button onClick={() => setShowScanner(false)} className="absolute top-10 right-10 p-3 bg-white/10 rounded-full"><X size={24} /></button>
        </div>
      )}

      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* BIBLIOTECA */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2.5rem] text-white shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Logros Obtenidos</p>
                  <h2 className="text-2xl font-black">{userProfile.badges?.length || 0} / 20 Insignias</h2>
                </div>
                <Trophy size={32} className="opacity-20" />
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(((userProfile.badges?.length || 0)/20)*100, 100)}%` }} /></div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'read', 'want', 'favorite'].map(type => (
                <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all ${filterType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-400'}`}>
                  {type === 'all' ? 'Todo' : type === 'read' ? 'Leídos' : type === 'want' ? 'Planear' : 'Favoritos ⭐'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredBooks.map((book, i) => {
                const isExp = expandedBooks.has(book.bookId);
                const perc = book.checkpoints?.length > 0 ? (book.checkpoints.filter(c => c.completed).length / book.checkpoints.length) * 100 : (book.status === 'read' ? 100 : 0);
                return (
                  <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 flex gap-4">
                      <img src={book.thumbnail} className="w-16 h-24 object-cover rounded-xl shadow-sm" />
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{book.title}</h4>
                        <p className="text-[10px] text-slate-400 mb-2">{book.authors[0]}</p>
                        <div className="flex items-center gap-2">
                           <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{width: `${perc}%`}} /></div>
                           <span className="text-[10px] font-black text-indigo-600">{Math.round(perc)}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={async () => await updateDoc(doc(db, 'users', user.uid, 'myBooks', book.bookId), { isFavorite: !book.isFavorite })}><Star size={18} className={book.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} /></button>
                        <button onClick={() => toggleExpand(book.bookId)} className="p-2 bg-slate-50 rounded-xl text-slate-400">{isExp ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>
                      </div>
                    </div>
                    {isExp && book.checkpoints?.length > 0 && (
                      <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2">
                        {book.checkpoints.map((cp, idx) => (
                          <button key={idx} onClick={() => toggleCheckpoint(book.bookId, idx)} className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${cp.completed ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                            <div className="flex items-center gap-3"><div className={`w-4 h-4 rounded-full border-2 ${cp.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300'}`}/> <span className={`text-xs font-bold ${cp.completed ? 'line-through opacity-50' : ''}`}>{cp.title}</span></div>
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

        {/* BUSCADOR */}
        {activeTab === 'search' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-2 overflow-x-auto">
                {[{id:'all',label:'Todo'},{id:'intitle',label:'Título'},{id:'inauthor',label:'Autor'},{id:'isbn',label:'ISBN'}].map(m => (
                  <button key={m.id} onClick={() => setSearchType(m.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${searchType === m.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{m.label}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Busca libros o autores..." className="flex-1 bg-slate-50 border rounded-[1.5rem] px-6 py-4 outline-none font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && performSearch()} />
                <button onClick={startScanner} className="bg-indigo-100 text-indigo-600 p-4 rounded-[1.25rem]"><Camera size={24} /></button>
              </div>
              <button onClick={() => performSearch()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                {isSearching ? <Loader2 className="animate-spin" size={16}/> : "Buscar en Sandbook"}
              </button>
            </div>

            <div className="space-y-4">
              {searchResults.map((book) => {
                const coms = bookComments[book.id] || [];
                return (
                  <div key={book.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in zoom-in-95">
                    <div className="flex gap-5">
                      <img src={book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150'} className="w-24 h-36 object-cover rounded-2xl shadow-md" />
                      <div className="flex-1 flex flex-col">
                        <h3 className="font-bold text-sm leading-tight mb-1">{book.volumeInfo.title}</h3>
                        <p className="text-xs text-indigo-500 font-bold mb-2">{book.volumeInfo.authors?.join(', ')}</p>
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase mb-4">
                           <span className="bg-slate-100 px-2 py-1 rounded-md">{book.volumeInfo.pageCount || '???'} PÁGS</span>
                           <span className="bg-slate-100 px-2 py-1 rounded-md">{book.volumeInfo.categories?.[0] || 'GENERAL'}</span>
                        </div>
                        <div className="flex gap-2 mt-auto">
                          <button onClick={() => setPlanningBook(book)} className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-[9px] font-black uppercase shadow-sm">Planificar</button>
                          <button onClick={() => handleAddBook(book, 'want', true)} className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl"><Star size={16}/></button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-50">
                       <p className="text-[10px] text-slate-500 line-clamp-3 italic mb-4">{book.volumeInfo.description}</p>
                       <div className="space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MessageSquare size={12}/> Opiniones ({coms.length})</p>
                          {coms.slice(0,2).map(c => (
                            <div key={c.id} className="bg-slate-50 p-3 rounded-2xl">
                               <div className="flex items-center gap-2 mb-1">
                                  <div className="w-4 h-4 bg-indigo-200 rounded-full flex items-center justify-center text-[7px] font-black">{c.userName?.charAt(0)}</div>
                                  <span className="text-[8px] font-bold text-slate-700">{c.userName}</span>
                               </div>
                               <p className="text-[10px] text-slate-600 leading-tight">{c.text}</p>
                            </div>
                          ))}
                          <div className="relative mt-2">
                             <input type="text" placeholder="Escribe tu reseña..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] pr-10 outline-none" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && postComment(book.id)} />
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

        {/* PERFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center relative group">
              <button onClick={() => setIsEditingProfile(true)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 transition-all"><Edit3 size={18} /></button>
              <div className="relative w-28 h-28 mx-auto mb-4">{userProfile.profilePic ? <img src={userProfile.profilePic} className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" /> : <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-4xl border-4 border-white shadow-xl">{userProfile.name?.charAt(0)}</div>}</div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{userProfile.name}</h2>
              <div className="flex justify-center gap-6 mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <div><span className="text-indigo-600 text-lg block">{readBooksCount}</span>Leídos</div>
                 <div className="w-px h-8 bg-slate-100"></div>
                 <div><span className="text-purple-600 text-lg block">{userProfile.scanCount || 0}</span>Scans</div>
              </div>
            </div>

            {isEditingProfile && (
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-500 shadow-xl space-y-4 animate-in slide-in-from-top-4">
                <input type="text" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-slate-50 border rounded-2xl px-4 py-3 outline-none" placeholder="Nombre..." />
                <label className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-4 cursor-pointer text-slate-400 hover:text-indigo-600 transition-all">
                  <Upload size={18} /> <span className="text-xs font-bold">Cambiar Foto Perfil</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button onClick={async () => { await updateDoc(doc(db, 'profiles', user.uid), { name: userProfile.name, profilePic: userProfile.profilePic }); setIsEditingProfile(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg">Guardar Cambios</button>
              </div>
            )}

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><Award size={18} className="text-amber-500" /> Mis Logros Sandbook</h3>
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 20 }).map((_, i) => {
                  const id = (i + 1).toString();
                  const unlocked = userProfile.badges?.includes(id);
                  return (
                    <div key={id} className="flex flex-col items-center gap-1 group relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 transform ${unlocked ? 'bg-indigo-50 shadow-md scale-100' : 'bg-slate-100 opacity-20 scale-90'}`}>
                        {unlocked ? (
                          <img src={`/${id}.png`} className="w-full h-full object-contain p-1" onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/5971/5971593.png"} alt={BADGE_DEFS[id].name} />
                        ) : (
                          <Lock size={20} className="text-slate-300" />
                        )}
                      </div>
                      <span className={`text-[7px] font-black text-center uppercase leading-tight ${unlocked ? 'text-indigo-600' : 'text-slate-300'}`}>
                        {unlocked ? BADGE_DEFS[id].name : "???"}
                      </span>
                      {/* Tooltip con secreto */}
                      {unlocked && (
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            {BADGE_DEFS[id].desc}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* RED */}
        {activeTab === 'social' && (
           <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Lectores de la Comunidad</h3>
              <div className="grid grid-cols-1 gap-3">
                 {publicData.filter(p => p.userId !== user?.uid).map(p => (
                    <div key={p.userId} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          {p.profilePic ? <img src={p.profilePic} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" /> : <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center font-black text-indigo-600 text-lg">{p.name?.charAt(0)}</div>}
                          <div>
                             <h4 className="font-bold text-slate-800 text-sm">{p.name}</h4>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{p.readCount || 0} Libros leídos • {p.badges?.length || 0} Logros</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </main>

      {/* NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-8 py-4 flex justify-between items-center z-40 shadow-2xl">
        {[
          {id: 'library', icon: Layout}, {id: 'search', icon: Search}, {id: 'social', icon: Globe}, {id: 'profile', icon: User}
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === t.id ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <t.icon size={22} strokeWidth={activeTab === t.id ? 2.5 : 2} />
          </button>
        ))}
      </nav>
    </div>
  );
}

