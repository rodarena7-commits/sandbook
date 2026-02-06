import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  FacebookAuthProvider,
  signInWithPopup
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
  BookOpen, Search, Trophy, Plus, CheckCircle, Layout, User, Award, Loader2, PenTool, Globe, Camera, MessageSquare, Send, X, ChevronDown, ChevronUp, Settings, Edit3, ListChecks, Lock, Flag, Sparkles, Star, Upload, Book as BookIcon, AlertCircle, Calendar, FileText, Info, Maximize2, Minimize2, UserPlus, UserCheck, Users, Trash2, Facebook, Languages, Share2, UserX, MessageCircle, StickyNote
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
const facebookProvider = new FacebookAuthProvider();
const appId = 'sandbook-v1';

// --- TRADUCCIONES ---
const i18n = {
  es: {
    library: "Biblioteca", plan: "Planear", social: "Red", profile: "Yo",
    search_p: "Busca libros, autores o ISBN...", pages: "Páginas", days: "Días",
    start: "Comenzar", cancel: "Cancelar", delete_q: "¿Eliminar libro?",
    delete_desc: "Esta acción no se puede deshacer.", delete_btn: "Eliminar",
    invite: "INVITAR", read: "Leído", pending: "Pendiente", favorites: "Favoritos ⭐",
    in_plan: "En plan", all: "Todos", level: "Rango", followers: "Seguidores", search_now: "Buscar en Sandbook",
    manual_p: "Páginas totales", scan_msg: "Escaneando código...",
    title_f: "Título", author_f: "Autor", isbn_f: "ISBN", global_f: "Global",
    dismiss_user: "Usuario ocultado", reviews: "Reseñas", my_review: "Mi Reseña",
    daily_notes: "Notas del día", rate_book: "Calificar libro", save: "Guardar"
  },
  en: {
    library: "Library", plan: "Plan", social: "Social", profile: "Me",
    search_p: "Search books, authors or ISBN...", pages: "Pages", days: "Days",
    start: "Start", cancel: "Cancel", delete_q: "Delete book?",
    delete_desc: "This action cannot be undone.", delete_btn: "Delete",
    invite: "INVITE", read: "Read", pending: "Pending", favorites: "Favorites ⭐",
    in_plan: "In plan", all: "All", level: "Rank", followers: "Followers", search_now: "Search Sandbook",
    manual_p: "Total pages", scan_msg: "Scanning code...",
    title_f: "Title", author_f: "Author", isbn_f: "ISBN", global_f: "Global",
    dismiss_user: "User hidden", reviews: "Reviews", my_review: "My Review",
    daily_notes: "Daily notes", rate_book: "Rate book", save: "Save"
  }
};

const BADGE_DEFS = {
  1: { name: "Velocista", desc: "Al libro más rápido en leer" },
  2: { name: "Titán", desc: "Al libro más largo leído" },
  3: { name: "Inicio", desc: "Al leer tu primer libro" },
  4: { name: "Rayo", desc: "Leer un libro en un día" },
  5: { name: "Semana", desc: "Leer un libro en una semana" },
  6: { name: "Mes", desc: "Leer un libro en un mes" },
  7: { name: "Diez", desc: "Por leer 10 libros" },
  8: { name: "Perfecto", desc: "Cumplir meta sin saltear días" },
  9: { name: "Veinte", desc: "20 libros en un año" },
  10: { name: "Treinta", desc: "30 libros en un año" },
  11: { name: "Cincuenta", desc: "50 libros en total" },
  12: { name: "Cien", desc: "100 libros en total" },
  13: { name: "Oro Anual", desc: "50 libros en un año" },
  14: { name: "Scan 10", desc: "10 libros escaneados" },
  15: { name: "Scan 20", desc: "20 libros escaneados" },
  16: { name: "Scan 30", desc: "30 libros escaneados" },
  17: { name: "Scan 40", desc: "40 libros escaneados" },
  18: { name: "Scan 50", desc: "50 libros escaneados" },
  19: { name: "Scan 100", desc: "100 libros escaneados" },
  20: { name: "Maestro", desc: "Cumplir 19 insignias" }
};

// --- COMPONENTES AUXILIARES ---

const VerificationCheck = ({ count = 0 }) => {
  if (count >= 100000) return <CheckCircle size={14} className="text-yellow-500 fill-yellow-50" />;
  if (count >= 10000) return <CheckCircle size={14} className="text-slate-400 fill-slate-50" />;
  if (count >= 1000) return <CheckCircle size={14} className="text-blue-500 fill-blue-50" />;
  if (count >= 100) return <CheckCircle size={14} className="text-green-500 fill-green-50" />;
  if (count >= 10) return <CheckCircle size={14} className="text-amber-800 fill-amber-50" />;
  return null;
};

const getLevelTitle = (count = 0, lang = 'es') => {
  if (count >= 100000) return "Legendario";
  if (count >= 10000) return "Experto Superior";
  if (count >= 1000) return "Experto";
  if (count >= 100) return "Amateur";
  if (count >= 10) return "Nivel 1 Novato";
  return "Principiante";
};

const StarRating = ({ rating, onRate, interactive = true }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star 
        key={s} 
        size={interactive ? 24 : 14} 
        onClick={() => interactive && onRate(s)}
        className={`${interactive ? 'cursor-pointer transition-all' : ''} ${s <= rating ? 'fill-yellow-400 text-yellow-400 scale-110' : 'text-slate-200'}`}
      />
    ))}
  </div>
);

const SliderLeido = ({ onToggle, isRead, lang }) => (
  <div onClick={onToggle} className={`relative w-24 h-9 rounded-full cursor-pointer transition-all p-1 ${isRead ? 'bg-green-500' : 'bg-slate-200'}`}>
    <div className={`absolute top-1 bottom-1 w-7 bg-white rounded-full shadow transition-all transform ${isRead ? 'translate-x-14' : 'translate-x-0'}`} />
    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black uppercase text-white pointer-events-none">
      {isRead ? i18n[lang].read : i18n[lang].pending}
    </span>
  </div>
);

// --- APP PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('es');
  const t = i18n[lang];

  const [activeTab, setActiveTab] = useState('library'); 
  const [myBooks, setMyBooks] = useState([]);
  const [publicData, setPublicData] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: '', profilePic: '', badges: [], scanCount: 0, followersCount: 0, following: [], dismissedUsers: [] });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); 
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  
  const [showScanner, setShowScanner] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [planningBook, setPlanningBook] = useState(null);
  const [manualPages, setManualPages] = useState("");
  const [planDays, setPlanDays] = useState(7);
  
  const [expandedBooks, setExpandedBooks] = useState(new Set());
  const [bookComments, setBookComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Estados para detalles de libro
  const [selectedBookForReview, setSelectedBookForReview] = useState(null);
  const [tempReviewText, setTempReviewText] = useState("");

  const victoryAudio = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"));

  const fetchWithRetry = async (url, retries = 3, delay = 2000) => {
    const res = await fetch(url);
    if (res.status === 429 && retries > 0) {
      await new Promise(r => setTimeout(r, delay));
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
    const unsubBooks = onSnapshot(collection(db, 'users', user.uid, 'myBooks'), (s) => setMyBooks(s.docs.map(d => d.data())));
    const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (d) => {
      if (d.exists()) setUserProfile(prev => ({ ...prev, ...d.data() }));
      else setDoc(doc(db, 'profiles', user.uid), { userId: user.uid, name: 'Lector', badges: [], scanCount: 0, readCount: 0, profilePic: '', followersCount: 0, following: [], dismissedUsers: [] });
    });
    const unsubPublic = onSnapshot(collection(db, 'profiles'), (s) => setPublicData(s.docs.map(d => d.data())));
    const unsubComments = onSnapshot(collection(db, 'comments'), (s) => {
      const map = {};
      s.docs.forEach(doc => {
        const d = doc.data();
        if (!map[d.bookId]) map[d.bookId] = [];
        map[d.bookId].push({ id: doc.id, ...d });
      });
      setBookComments(map);
    });
    return () => { unsubBooks(); unsubProfile(); unsubPublic(); unsubComments(); };
  }, [user]);

  // --- ACCIONES ---

  const handleFacebookLogin = async () => {
    try { await signInWithPopup(auth, facebookProvider); } catch (e) { console.error(e); }
  };

  const inviteWhatsApp = () => {
    const message = `¡Hola! Únete a Sandbook para organizar tus lecturas y ganar logros: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const inviteFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const performSearch = async (forcedQ = null) => {
    const q = (forcedQ || searchQuery).trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      let queryParam = q;
      if (searchType === 'isbn') queryParam = `isbn:${q.replace(/\D/g, '')}`;
      else if (searchType === 'intitle') queryParam = `intitle:${q}`;
      else if (searchType === 'inauthor') queryParam = `inauthor:${q}`;

      let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(queryParam)}&maxResults=15`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;

      const res = await fetchWithRetry(url);
      const data = await res.json();
      if (data.items) setSearchResults(data.items);
      else setSearchError(lang === 'es' ? "No hay resultados" : "No results");
    } catch (err) { setSearchError("API Error"); } finally { setIsSearching(false); }
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

  const handleAddBook = async (book, status, isFav = false) => {
    const info = {
      bookId: book.id,
      title: book.volumeInfo.title,
      authors: book.volumeInfo.authors || ['Anónimo'],
      thumbnail: book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150',
      status, isFavorite: isFav, checkpoints: [], rating: 0, review: "", addedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid, 'myBooks', book.id), info);
    if (status === 'read') await updateDoc(doc(db, 'profiles', user.uid), { readCount: increment(1) });
    setActiveTab('library');
  };

  const saveReadingPlan = async () => {
    if (!user || !planningBook) return;
    const pages = parseInt(manualPages);
    const days = parseInt(planDays);
    if (isNaN(pages) || isNaN(days) || pages <= 0 || days <= 0) return;
    const pPerDay = Math.ceil(pages / days);
    const checkpoints = [];
    for (let i = 1; i <= days; i++) {
      checkpoints.push({ title: `Día ${i}: aprox. ${pPerDay} págs`, completed: false, note: "" });
    }
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', planningBook.id), { 
      checkpoints, status: 'reading', totalPages: pages, rating: 0, review: "" 
    });
    setPlanningBook(null);
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
      await updateDoc(doc(db, 'profiles', user.uid), { readCount: increment(1) });
    }
  };

  const updateCheckpointNote = async (bookId, idx, note) => {
    const book = myBooks.find(b => b.bookId === bookId);
    const nCP = [...book.checkpoints];
    nCP[idx].note = note;
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { checkpoints: nCP });
  };

  const updateBookReview = async (bookId, rating, review) => {
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { rating, review });
    setSelectedBookForReview(null);
  };

  const dismissUser = async (targetId) => {
    await updateDoc(doc(db, 'profiles', user.uid), { dismissedUsers: arrayUnion(targetId) });
  };

  const toggleFollow = async (targetId) => {
    if (!user || user.uid === targetId) return;
    const isFollowing = userProfile.following?.includes(targetId);
    await updateDoc(doc(db, 'profiles', user.uid), { following: isFollowing ? arrayRemove(targetId) : arrayUnion(targetId) });
    await updateDoc(doc(db, 'profiles', targetId), { followersCount: increment(isFollowing ? -1 : 1) });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserProfile(p => ({ ...p, profilePic: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const filteredBooks = myBooks.filter(b => {
    if (filterType === 'favorite') return b.isFavorite;
    if (filterType === 'read') return b.status === 'read';
    if (filterType === 'want') return b.status === 'want';
    if (filterType === 'in_plan') return b.status === 'reading';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100"><BookOpen size={20} strokeWidth={3} /></div>
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tight">Sandbook</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-indigo-50"><Languages size={18} /></button>
          <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200 pr-3">
            {userProfile.profilePic ? <img src={userProfile.profilePic} className="w-8 h-8 rounded-full object-cover border-2 border-white" /> : <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{userProfile.name?.charAt(0)}</div>}
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-700 hidden sm:block truncate max-w-[80px]">{userProfile.name}</span>
              <VerificationCheck count={userProfile.followersCount} />
            </div>
          </button>
        </div>
      </header>

      {/* MODAL RESEÑA PERSONAL (Al hacer clic en portada) */}
      {selectedBookForReview && (
        <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="relative h-32 bg-indigo-600">
                 <img src={selectedBookForReview.thumbnail} className="absolute -bottom-10 left-8 w-24 h-36 object-cover rounded-xl shadow-2xl border-4 border-white" />
                 <button onClick={() => setSelectedBookForReview(null)} className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full"><X size={20}/></button>
              </div>
              <div className="p-8 pt-12">
                 <h3 className="font-black text-lg leading-tight mt-2">{selectedBookForReview.title}</h3>
                 <p className="text-xs text-slate-400 font-bold mb-6">{selectedBookForReview.authors[0]}</p>
                 
                 <div className="space-y-6">
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">{t.rate_book}</label>
                       <StarRating rating={selectedBookForReview.rating || 0} onRate={(val) => setSelectedBookForReview({...selectedBookForReview, rating: val})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">{t.my_review}</label>
                       <textarea 
                          className="w-full bg-slate-50 border rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                          value={selectedBookForReview.review}
                          onChange={(e) => setSelectedBookForReview({...selectedBookForReview, review: e.target.value})}
                          placeholder="..."
                       />
                    </div>
                    <button onClick={() => updateBookReview(selectedBookForReview.bookId, selectedBookForReview.rating, selectedBookForReview.review)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg">{t.save}</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CONFIRMACIÓN ELIMINAR */}
      {bookToDelete && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl scale-in-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
            <h3 className="font-black text-xl mb-2">{t.delete_q}</h3>
            <p className="text-slate-400 text-sm mb-8">{t.delete_desc}</p>
            <div className="flex gap-3">
              <button onClick={() => setBookToDelete(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-500">{t.cancel}</button>
              <button onClick={async () => { await deleteDoc(doc(db, 'users', user.uid, 'myBooks', bookToDelete)); setBookToDelete(null); }} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black uppercase text-xs">{t.delete_btn}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANIFICADOR */}
      {planningBook && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-xl mb-6 text-indigo-600 flex items-center gap-2"><Calendar /> {t.plan}</h3>
            <div className="space-y-4">
               <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t.manual_p}</label>
               <input type="number" value={manualPages} onChange={(e) => setManualPages(e.target.value)} className="w-full bg-slate-50 border rounded-2xl p-4 font-bold outline-none" /></div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t.days}</label>
               <input type="number" value={planDays} onChange={(e) => setPlanDays(e.target.value)} className="w-full bg-slate-50 border rounded-2xl p-4 font-bold outline-none" /></div>
               <button onClick={saveReadingPlan} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg mt-4">{t.start}</button>
               <button onClick={() => setPlanningBook(null)} className="w-full text-slate-400 font-bold text-xs mt-3">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* VISTA BIBLIOTECA */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2.5rem] text-white shadow-xl relative">
               <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1"><p className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.level}</p><VerificationCheck count={userProfile.followersCount} /></div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">{getLevelTitle(userProfile.readCount, lang)}</h2>
                    <p className="text-[10px] font-bold opacity-80 mt-2 tracking-widest">{userProfile.readCount} {t.read.toUpperCase()}</p>
                  </div>
                  <Sparkles className="opacity-30" size={32} />
               </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['all', 'read', 'want', 'in_plan', 'favorite'].map(type => (
                <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all whitespace-nowrap ${filterType === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400'}`}>
                  {t[type]}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredBooks.map((book, i) => {
                const isExp = expandedBooks.has(book.bookId);
                const doneCount = book.checkpoints?.filter(c => c.completed).length || 0;
                const totalCount = book.checkpoints?.length || 1;
                const perc = Math.round((doneCount / totalCount) * 100);
                return (
                  <div key={i} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
                    <div className="flex gap-4">
                      <img 
                        src={book.thumbnail} 
                        onClick={() => setSelectedBookForReview(book)}
                        className="w-16 h-24 object-cover rounded-xl shadow-sm cursor-pointer hover:opacity-80 active:scale-95 transition-all" 
                      />
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{book.title}</h4>
                            <div className="mt-1"><StarRating rating={book.rating || 0} interactive={false} /></div>
                          </div>
                          <button onClick={() => setBookToDelete(book.bookId)} className="p-1 text-slate-200 hover:text-red-400"><X size={16}/></button>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                           <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-700" style={{width: `${perc}%`}} /></div>
                           <span className="text-[10px] font-black text-indigo-600">{perc}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={async () => await updateDoc(doc(db, 'users', user.uid, 'myBooks', book.bookId), { isFavorite: !book.isFavorite })}><Star size={18} className={book.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} /></button>
                        <button onClick={() => { const n = new Set(expandedBooks); if(n.has(book.bookId)) n.delete(book.bookId); else n.add(book.bookId); setExpandedBooks(n); }} className="p-2 text-slate-300">
                          {isExp ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
                        </button>
                      </div>
                    </div>
                    {isExp && book.checkpoints?.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-slate-50 mt-4 animate-in slide-in-from-top-2">
                        {book.checkpoints.map((cp, idx) => (
                          <div key={idx} className="space-y-2">
                            <button onClick={() => toggleCheckpoint(book.bookId, idx)} className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${cp.completed ? 'bg-green-50 border-green-100 text-green-700 opacity-60' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                               <span className="text-[11px] font-bold">{cp.title}</span>
                               {cp.completed && <CheckCircle size={14}/>}
                            </button>
                            <div className="flex items-start gap-2 px-2">
                               <StickyNote size={12} className="text-slate-300 mt-1" />
                               <input 
                                  type="text" 
                                  className="flex-1 bg-transparent border-none text-[10px] outline-none text-slate-400 placeholder:opacity-30" 
                                  placeholder={t.daily_notes + "..."}
                                  value={cp.note || ""}
                                  onChange={(e) => updateCheckpointNote(book.bookId, idx, e.target.value)}
                               />
                            </div>
                          </div>
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
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {['all','intitle','inauthor','isbn'].map(m => (
                  <button key={m} onClick={() => setSearchType(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${searchType === m ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>{m === 'all' ? t.all : m}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder={t.search_p} className="flex-1 bg-slate-50 border rounded-[1.5rem] px-6 py-4 outline-none font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && performSearch()} />
                <button onClick={() => performSearch()} className="bg-indigo-600 text-white p-4 rounded-[1.25rem] shadow-lg"><Search size={24} /></button>
              </div>
              <button onClick={() => performSearch()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">{t.search_now}</button>
            </div>

            <div className="space-y-4">
              {searchResults.map((book) => {
                const alreadyHave = myBooks.find(b => b.bookId === book.id);
                return (
                  <div key={book.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in zoom-in-95">
                    <div className="flex gap-5 mb-4">
                      <img src={book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150'} className="w-24 h-36 object-cover rounded-2xl shadow-md" />
                      <div className="flex-1 flex flex-col">
                        <h3 className="font-bold text-sm leading-tight line-clamp-2">{book.volumeInfo.title}</h3>
                        <p className="text-xs text-indigo-500 font-bold mt-1 mb-2">{book.volumeInfo.authors?.join(', ')}</p>
                        
                        <div className="mt-auto space-y-3">
                          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl">
                             <span className="text-[9px] font-black uppercase text-slate-400 ml-2">{t.read}?</span>
                             <SliderLeido lang={lang} isRead={alreadyHave?.status === 'read'} onToggle={() => handleAddBook(book, alreadyHave?.status === 'read' ? 'want' : 'read')} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setPlanningBook(book); setManualPages(book.volumeInfo.pageCount || ""); }} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-[1rem] text-[9px] font-black uppercase">{t.plan}</button>
                            <button onClick={() => handleAddBook(book, 'want', true)} className="p-2 bg-yellow-50 text-yellow-600 rounded-xl"><Star size={18}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RED SOCIAL */}
        {activeTab === 'social' && (
           <div className="space-y-4 animate-in fade-in">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-lg mb-4 text-center">{t.social}</h3>
                <div className="flex gap-3">
                  <button onClick={inviteWhatsApp} className="flex-1 py-4 bg-green-500 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all">
                    <MessageCircle size={20} /> <span className="text-xs font-black uppercase">{t.invite}</span>
                  </button>
                  <button onClick={inviteFacebook} className="flex-1 py-4 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all">
                    <Facebook size={20} /> <span className="text-xs font-black uppercase">{t.invite}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 {publicData.filter(p => p.userId !== user?.uid && !userProfile.dismissedUsers?.includes(p.userId)).map(p => (
                    <div key={p.userId} className="bg-white p-4 rounded-3xl border shadow-sm flex items-center justify-between animate-in zoom-in-95 group">
                       <div className="flex items-center gap-3">
                          <div className="relative">
                             {p.profilePic ? <img src={p.profilePic} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" /> : <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center font-black text-indigo-600 text-lg">{p.name?.charAt(0)}</div>}
                             <div className="absolute -bottom-1 -right-1"><VerificationCheck count={p.followersCount} /></div>
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800 text-sm">{p.name}</h4>
                             <p className="text-[9px] font-black text-indigo-500 uppercase">{getLevelTitle(p.readCount, lang)}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase">{p.followersCount || 0} Fans</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <button onClick={() => dismissUser(p.userId)} className="p-3 text-slate-200 hover:text-red-400 transition-colors"><UserX size={18}/></button>
                          <button onClick={() => toggleFollow(p.userId)} className={`p-3 rounded-2xl transition-all ${userProfile.following?.includes(p.userId) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                             {userProfile.following?.includes(p.userId) ? <UserCheck size={20}/> : <UserPlus size={20}/>}
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* PERFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center relative overflow-hidden">
              <button onClick={() => setIsEditingProfile(true)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 shadow-sm"><Edit3 size={18} /></button>
              <div className="relative w-32 h-32 mx-auto mb-4">
                {userProfile.profilePic ? <img src={userProfile.profilePic} className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" /> : <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-xl">{userProfile.name?.charAt(0)}</div>}
                <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-lg"><VerificationCheck count={userProfile.followersCount} size={28} /></div>
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{userProfile.name}</h2>
              <p className="text-[10px] font-black text-indigo-600 uppercase mb-6 tracking-widest">{getLevelTitle(userProfile.readCount, lang)}</p>
              
              {!auth.currentUser?.providerData.some(p => p.providerId === 'facebook.com') && (
                <button onClick={handleFacebookLogin} className="mb-6 w-full py-3 bg-[#1877F2] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"><Facebook size={16} /> Login Facebook</button>
              )}

              <div className="flex justify-center gap-8 text-[10px] font-black text-slate-400 uppercase bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner">
                 <div className="text-center"><span className="text-indigo-600 text-lg block">{userProfile.readCount}</span>{t.read}</div>
                 <div className="w-px h-8 bg-slate-200"></div>
                 <div className="text-center"><span className="text-purple-600 text-lg block">{userProfile.followersCount}</span>Fans</div>
                 <div className="w-px h-8 bg-slate-200"></div>
                 <div className="text-center"><span className="text-amber-600 text-lg block">{userProfile.badges?.length || 0}</span>Logros</div>
              </div>
            </div>

            {isEditingProfile && (
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-500 shadow-xl space-y-4 animate-in slide-in-from-top-4">
                <input type="text" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 outline-none font-bold" />
                <label className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed rounded-2xl py-4 cursor-pointer text-slate-400">
                  <Upload size={18} /> <span className="text-xs font-bold">Cambiar Foto</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button onClick={async () => { await updateDoc(doc(db, 'profiles', user.uid), { name: userProfile.name, profilePic: userProfile.profilePic }); setIsEditingProfile(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs">Guardar</button>
              </div>
            )}

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><Award size={18} className="text-amber-500" /> {t.badges_title}</h3>
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 20 }).map((_, i) => {
                  const id = (i + 1).toString();
                  const unlocked = userProfile.badges?.includes(id);
                  return (
                    <div key={id} className="flex flex-col items-center gap-1 group relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 transform ${unlocked ? 'bg-indigo-50 shadow-md scale-100' : 'bg-slate-50 opacity-20 scale-90'}`}>
                        {unlocked ? <img src={`/${id}.png`} className="w-full h-full object-contain p-1 animate-in zoom-in" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/5971/5971593.png"} } /> : <Lock size={20} className="text-slate-300" />}
                      </div>
                      <span className={`text-[7px] font-black text-center uppercase ${unlocked ? 'text-indigo-600' : 'text-slate-300'}`}>{unlocked ? BADGE_DEFS[id].name : "???"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-8 py-4 flex justify-between items-center z-40 shadow-2xl">
        {[{id:'library',icon:Layout,l:t.library},{id:'search',icon:Search,l:t.plan},{id:'social',icon:Globe,l:t.social},{id:'profile',icon:User,l:t.profile}].map(t_nav => (
          <button key={t_nav.id} onClick={() => setActiveTab(t_nav.id)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === t_nav.id ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <t_nav.icon size={22} strokeWidth={activeTab === t_nav.id ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{t_nav.l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

