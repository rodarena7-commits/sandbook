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
  BookOpen, Search, Trophy, Plus, CheckCircle, Layout, User, Award, Loader2, PenTool, Globe, Camera, MessageSquare, Send, X, ChevronDown, ChevronUp, Settings, Edit3, ListChecks, Lock, Flag, Sparkles, Star, Upload, Book as BookIcon, AlertCircle, Calendar, FileText, Info, Maximize2, Minimize2, UserPlus, UserCheck, Users, Trash2, Facebook, Languages, Share2, UserX, MessageCircle, StickyNote, Barcode, Library, Heart, ArrowLeft
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
    invite: "INVITAR", read: "Leídos", pending: "Pendientes", favorites: "Favoritos ⭐",
    in_plan: "En plan", all: "Todos", in_library: "En Biblioteca",
    level: "Rango", followers: "Seguidores", search_now: "Buscar en Sandbook",
    manual_p: "Páginas totales", scan_msg: "Escaneando código...",
    title_f: "Título", author_f: "Autor", isbn_f: "ISBN", global_f: "Todo",
    dismiss_user: "Ocultar", reviews: "Reseñas", my_review: "Tu Opinión",
    daily_notes: "Notas del día", rate_book: "Calificar", save: "Guardar",
    who_read: "Lectores en Sandbook", global_rating: "Promedio Global",
    search_people: "Buscar personas...", recommend: "Recomendar", select_friend: "Elige un amigo",
    user_books: "Libros de", no_friends: "Sigue a alguien primero"
  },
  en: {
    library: "Library", plan: "Plan", social: "Social", profile: "Me",
    search_p: "Search books, authors or ISBN...", pages: "Pages", days: "Days",
    start: "Start", cancel: "Cancel", delete_q: "Delete book?",
    delete_desc: "This action cannot be undone.", delete_btn: "Delete",
    invite: "INVITE", read: "Read", pending: "Pending", favorites: "Favorites ⭐",
    in_plan: "In Plan", all: "All", in_library: "In Library",
    level: "Rank", followers: "Followers", search_now: "Search Sandbook",
    manual_p: "Total pages", scan_msg: "Scanning code...",
    title_f: "Title", author_f: "Author", isbn_f: "ISBN", global_f: "All",
    dismiss_user: "Hide", reviews: "Reviews", my_review: "Your Review",
    daily_notes: "Daily notes", rate_book: "Rate", save: "Save",
    who_read: "Sandbook Readers", global_rating: "Global Rating",
    search_people: "Search people...", recommend: "Recommend", select_friend: "Select a friend",
    user_books: "Books of", no_friends: "Follow someone first"
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

// --- FUNCIONES GLOBALES ---

const getLevelTitle = (count = 0, lang = 'es') => {
  const t = i18n[lang];
  if (count >= 100000) return "Legendario";
  if (count >= 10000) return "Experto Superior";
  if (count >= 1000) return "Experto";
  if (count >= 100) return "Amateur";
  if (count >= 10) return "Nivel 1 Novato";
  return "Principiante";
};

const VerificationCheck = ({ count = 0, size = 14 }) => {
  if (count >= 100000) return <CheckCircle size={size} className="text-yellow-500 fill-yellow-50" />;
  if (count >= 10000) return <CheckCircle size={size} className="text-slate-400 fill-slate-50" />;
  if (count >= 1000) return <CheckCircle size={size} className="text-blue-500 fill-blue-50" />;
  if (count >= 100) return <CheckCircle size={size} className="text-green-500 fill-green-50" />;
  if (count >= 10) return <CheckCircle size={size} className="text-amber-800 fill-amber-50" />;
  return null;
};

const StarRating = ({ rating, onRate, interactive = true, size = 20 }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star 
        key={s} 
        size={size} 
        onClick={() => interactive && onRate(s)}
        className={`${interactive ? 'cursor-pointer transition-all active:scale-125' : ''} ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
      />
    ))}
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
  const [userProfile, setUserProfile] = useState({ name: '', profilePic: '', badges: [], scanCount: 0, followersCount: 0, following: [], dismissedUsers: [], readBooksList: [] });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); 
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [profileSearch, setProfileSearch] = useState('');
  
  const [showScanner, setShowScanner] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [planningBook, setPlanningBook] = useState(null);
  const [manualPages, setManualPages] = useState("");
  const [planDays, setPlanDays] = useState(7);
  
  const [expandedBooks, setExpandedBooks] = useState(new Set());
  const [bookComments, setBookComments] = useState({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const [viewingBook, setViewingBook] = useState(null);
  const [showRecommendList, setShowRecommendList] = useState(false);
  const [userComment, setUserComment] = useState("");
  const [userRating, setUserRating] = useState(0);

  // Estado para ver Perfil de otro Usuario
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedUserBooks, setSelectedUserBooks] = useState([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');

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
      else setDoc(doc(db, 'profiles', user.uid), { userId: user.uid, name: 'Lector', badges: [], scanCount: 0, readCount: 0, profilePic: '', followersCount: 0, following: [], dismissedUsers: [], readBooksList: [] });
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

  // Listener para libros de otro usuario seleccionado
  useEffect(() => {
    if (!selectedUserProfile) {
      setSelectedUserBooks([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'users', selectedUserProfile.userId, 'myBooks'), (s) => {
      setSelectedUserBooks(s.docs.map(d => d.data()));
    });
    return () => unsub();
  }, [selectedUserProfile]);

  // --- ACCIONES ---

  const handleFacebookLogin = async () => {
    try { await signInWithPopup(auth, facebookProvider); } catch (e) { console.error(e); }
  };

  const inviteWhatsApp = () => {
    const msg = `¡Únete a Sandbook y compartamos lecturas! ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const performSearch = async (forcedQ = null) => {
    const q = (forcedQ || searchQuery).trim();
    if (!q) return;
    setIsSearching(true);
    try {
      let queryParam = q;
      if (searchType === 'isbn') queryParam = `isbn:${q.replace(/\D/g, '')}`;
      else if (searchType === 'intitle') queryParam = `intitle:${q}`;
      else if (searchType === 'inauthor') queryParam = `inauthor:${q}`;
      let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(queryParam)}&maxResults=15`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;
      const res = await fetchWithRetry(url);
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch (e) { setSearchError("API Error"); } finally { setIsSearching(false); }
  };

  const handleAddBook = async (book, status, isFav = false) => {
    const bookId = book.id || book.bookId;
    const info = {
      bookId,
      title: book.volumeInfo?.title || book.title,
      authors: book.volumeInfo?.authors || book.authors || ['Anónimo'],
      thumbnail: (book.volumeInfo?.imageLinks?.thumbnail || book.thumbnail)?.replace('http:', 'https:') || 'https://via.placeholder.com/150',
      description: book.volumeInfo?.description || book.description || "",
      status, isFavorite: isFav, checkpoints: [], rating: 0, review: "", addedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid, 'myBooks', bookId), info);
    if (status === 'read') await updateDoc(doc(db, 'profiles', user.uid), { readCount: increment(1), readBooksList: arrayUnion(bookId) });
    setActiveTab('library');
  };

  const saveReadingPlan = async () => {
    if (!user || !planningBook) return;
    const pages = parseInt(manualPages);
    const days = parseInt(planDays);
    if (isNaN(pages) || isNaN(days) || pages <= 0 || days <= 0) return;
    const checkpoints = Array.from({ length: days }).map((_, i) => ({ title: `Día ${i+1}: aprox. ${Math.ceil(pages/days)} págs`, completed: false, note: "" }));
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', planningBook.id), { checkpoints, status: 'reading', totalPages: pages });
    setPlanningBook(null); setActiveTab('library');
  };

  const handleRecommendBook = async (targetId) => {
    if (!viewingBook || !user) return;
    const bookId = viewingBook.id || viewingBook.bookId;
    const recData = {
      bookId,
      title: viewingBook.volumeInfo?.title || viewingBook.title,
      authors: viewingBook.volumeInfo?.authors || viewingBook.authors || ['Anónimo'],
      thumbnail: (viewingBook.volumeInfo?.imageLinks?.thumbnail || viewingBook.thumbnail)?.replace('http:', 'https:'),
      status: 'library',
      recommendedBy: userProfile.name,
      senderId: user.uid,
      sentAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', targetId, 'myBooks', bookId), recData);
    setShowRecommendList(false);
  };

  const toggleFollow = async (targetId) => {
    if (!user || user.uid === targetId) return;
    const isF = userProfile.following?.includes(targetId);
    await updateDoc(doc(db, 'profiles', user.uid), { following: isF ? arrayRemove(targetId) : arrayUnion(targetId) });
    await updateDoc(doc(db, 'profiles', targetId), { followersCount: increment(isF ? -1 : 1) });
  };

  const filteredMyBooks = myBooks.filter(b => {
    if (filterType === 'favorite') return b.isFavorite;
    if (filterType === 'read') return b.status === 'read';
    if (filterType === 'want') return b.status === 'want';
    if (filterType === 'in_plan') return b.status === 'reading';
    if (filterType === 'in_library') return b.status === 'library';
    return true;
  });

  const filteredExternalBooks = selectedUserBooks.filter(b => {
    if (selectedUserFilter === 'favorite') return b.isFavorite;
    if (selectedUserFilter === 'read') return b.status === 'read';
    if (selectedUserFilter === 'want') return b.status === 'want';
    if (selectedUserFilter === 'in_plan') return b.status === 'reading';
    if (selectedUserFilter === 'in_library') return b.status === 'library';
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
          <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-indigo-50 transition-colors"><Languages size={18} /></button>
          <button onClick={() => {setActiveTab('profile'); setSelectedUserProfile(null);}} className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200 pr-3">
            {userProfile.profilePic ? <img src={userProfile.profilePic} className="w-8 h-8 rounded-full object-cover border-2 border-white" /> : <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{userProfile.name?.charAt(0)}</div>}
            <VerificationCheck count={userProfile.followersCount} />
          </button>
        </div>
      </header>

      {/* MODAL DETALLE DE LIBRO */}
      {viewingBook && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
              <div className="relative h-48 bg-indigo-600 flex-shrink-0">
                 <img src={viewingBook.volumeInfo?.imageLinks?.thumbnail?.replace('http:','https:') || viewingBook.thumbnail} className="absolute -bottom-12 left-8 w-28 h-40 object-cover rounded-2xl shadow-2xl border-4 border-white" />
                 <button onClick={() => {setViewingBook(null); setShowRecommendList(false);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 pt-16 scrollbar-hide">
                 <h2 className="font-black text-2xl leading-tight">{viewingBook.volumeInfo?.title || viewingBook.title}</h2>
                 <p className="text-sm text-indigo-600 font-bold mb-6">{viewingBook.volumeInfo?.authors?.join(', ') || viewingBook.authors?.join(', ')}</p>
                 
                 {/* Recomendar */}
                 <div className="flex gap-3 mb-8">
                    <button onClick={() => setShowRecommendList(!showRecommendList)} className="flex-1 flex items-center justify-center gap-2 bg-pink-50 text-pink-600 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest border border-pink-100 shadow-sm active:scale-95 transition-all">
                       <Heart size={18}/> {t.recommend}
                    </button>
                 </div>

                 {showRecommendList && (
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 mb-8 animate-in slide-in-from-top-4">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-4">{t.select_friend}</p>
                       <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                          {publicData.filter(p => userProfile.following?.includes(p.userId)).length > 0 ? (
                             publicData.filter(p => userProfile.following?.includes(p.userId)).map(p => (
                                <button key={p.userId} onClick={() => handleRecommendBook(p.userId)} className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 hover:border-indigo-300 transition-all text-left">
                                   <img src={p.profilePic || 'https://via.placeholder.com/30'} className="w-8 h-8 rounded-full object-cover" />
                                   <span className="text-xs font-bold text-slate-700">{p.name}</span>
                                </button>
                             ))
                          ) : <p className="text-center text-xs font-bold text-slate-400 py-4">{t.no_friends}</p>}
                       </div>
                    </div>
                 )}

                 <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl mb-6">
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400">{t.global_rating}</p>
                       <div className="flex items-center gap-2">
                          <span className="text-2xl font-black">{(bookComments[viewingBook.id || viewingBook.bookId]?.reduce((a,b)=>a+b.rating,0) / (bookComments[viewingBook.id || viewingBook.bookId]?.length || 1)).toFixed(1)}</span>
                          <StarRating rating={Math.round(bookComments[viewingBook.id || viewingBook.bookId]?.reduce((a,b)=>a+b.rating,0) / (bookComments[viewingBook.id || viewingBook.bookId]?.length || 1))} interactive={false} size={14} />
                       </div>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400">{t.who_read}</p>
                       <div className="flex -space-x-2 mt-1">
                          {publicData.filter(p => p.readBooksList?.includes(viewingBook.id || viewingBook.bookId)).slice(0,5).map(p => (
                             <img key={p.userId} src={p.profilePic || 'https://via.placeholder.com/30'} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" />
                          ))}
                          <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                             +{publicData.filter(p => p.readBooksList?.includes(viewingBook.id || viewingBook.bookId)).length}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mb-8"><p className="text-sm text-slate-600 leading-relaxed italic">{viewingBook.volumeInfo?.description?.replace(/<[^>]*>?/gm, '') || viewingBook.description || "Sin descripción."}</p></div>

                 <div className="space-y-6">
                    <h3 className="font-black text-sm uppercase tracking-widest border-b pb-2">{t.reviews}</h3>
                    <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                       <p className="text-xs font-bold text-indigo-900">{t.my_review}</p>
                       <StarRating rating={userRating} onRate={setUserRating} />
                       <textarea value={userComment} onChange={(e) => setUserComment(e.target.value)} className="w-full bg-white rounded-xl p-3 text-sm outline-none min-h-[80px]" placeholder="..." />
                       <button onClick={submitGlobalReview} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-xs uppercase shadow-md flex items-center justify-center gap-2"><Send size={14}/> {t.save}</button>
                    </div>
                    <div className="space-y-4 pb-8">
                       {bookComments[viewingBook.id || viewingBook.bookId]?.map(c => (
                          <div key={c.id} className="bg-slate-50 p-4 rounded-2xl">
                             <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2"><img src={c.userPic || 'https://via.placeholder.com/30'} className="w-6 h-6 rounded-full" /><span className="text-[10px] font-black">{c.userName}</span></div>
                                <StarRating rating={c.rating} interactive={false} size={10} />
                             </div>
                             <p className="text-xs text-slate-600 leading-relaxed">{c.text}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CONFIRMACIÓN ELIMINAR */}
      {bookToDelete && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl">
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="font-black text-xl mb-2">{t.delete_q}</h3>
            <p className="text-slate-400 text-sm mb-8">{t.delete_desc}</p>
            <div className="flex gap-3">
              <button onClick={() => setBookToDelete(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-500">{t.cancel}</button>
              <button onClick={async () => { await deleteDoc(doc(db, 'users', user.uid, 'myBooks', bookToDelete)); setBookToDelete(null); }} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black uppercase text-xs">{t.delete_btn}</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* VISTA PERFIL AJENO */}
        {selectedUserProfile ? (
          <div className="space-y-6 animate-in slide-in-from-right-4 pb-12">
             <button onClick={() => setSelectedUserProfile(null)} className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 p-3 rounded-2xl active:scale-95 transition-all">
                <ArrowLeft size={18}/> {t.cancel}
             </button>
             
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center relative overflow-hidden">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  {selectedUserProfile.profilePic ? <img src={selectedUserProfile.profilePic} className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" /> : <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-xl">{selectedUserProfile.name?.charAt(0)}</div>}
                  <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-slate-50 scale-125"><VerificationCheck count={selectedUserProfile.followersCount} size={24} /></div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedUserProfile.name}</h2>
                <p className="text-[10px] font-black text-indigo-600 uppercase mb-8 tracking-[0.2em]">{getLevelTitle(selectedUserProfile.readCount, lang)}</p>
                <div className="flex justify-center gap-8 text-[9px] font-black text-slate-400 uppercase bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                   <div className="text-center"><span className="text-indigo-600 text-xl block mb-1">{selectedUserProfile.readCount}</span>{t.read}</div>
                   <div className="w-px h-8 bg-slate-200"></div>
                   <div className="text-center"><span className="text-purple-600 text-xl block mb-1">{selectedUserProfile.followersCount}</span>Fans</div>
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">{t.user_books} {selectedUserProfile.name}</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['all', 'read', 'in_plan', 'want', 'favorite', 'in_library'].map(type => (
                    <button key={type} onClick={() => setSelectedUserFilter(type)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all whitespace-nowrap ${selectedUserFilter === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400'}`}>
                      {t[type]}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  {filteredExternalBooks.map((book, i) => (
                    <div key={i} className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in flex gap-4">
                       <img src={book.thumbnail} onClick={() => setViewingBook(book)} className="w-14 h-20 object-cover rounded-xl shadow-sm cursor-pointer" />
                       <div className="flex-1 flex flex-col justify-center">
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{book.title}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{book.authors[0]}</p>
                          <div className="mt-3"><StarRating rating={book.rating || 0} interactive={false} size={12}/></div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        ) : (
          /* PESTAÑAS NORMALES */
          <>
            {/* VISTA BIBLIOTECA */}
            {activeTab === 'library' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                   <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1"><p className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.level}</p></div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">{getLevelTitle(userProfile.readCount, lang)}</h2>
                        <p className="text-[10px] font-bold opacity-80 mt-2 tracking-widest">{userProfile.readCount} {t.read.toUpperCase()}</p>
                      </div>
                      <Sparkles className="opacity-30" size={32} />
                   </div>
                   <div className="h-2 bg-black/20 rounded-full overflow-hidden mt-6"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min((userProfile.readCount/100)*100, 100)}%` }} /></div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['all', 'read', 'in_plan', 'want', 'favorite', 'in_library'].map(type => (
                    <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all whitespace-nowrap ${filterType === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400'}`}>
                      {t[type]}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {filteredMyBooks.map((book, i) => {
                    const isExp = expandedBooks.has(book.bookId);
                    const doneCount = book.checkpoints?.filter(c => c.completed).length || 0;
                    const totalCount = book.checkpoints?.length || 1;
                    const perc = Math.round((doneCount / totalCount) * 100);
                    return (
                      <div key={i} className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
                        <div className="flex gap-4">
                          <img src={book.thumbnail} onClick={() => setViewingBook(book)} className="w-16 h-24 object-cover rounded-2xl shadow-sm cursor-pointer active:scale-95 transition-all" />
                          <div className="flex-1 flex flex-col justify-center">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{book.title}</h4>
                              <button onClick={() => setBookToDelete(book.bookId)} className="p-1 text-slate-200 hover:text-red-400"><X size={16}/></button>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                               <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-700" style={{width: `${perc}%`}} /></div>
                               <span className="text-[10px] font-black text-indigo-600">{perc}%</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 justify-center">
                            <button onClick={async () => await updateDoc(doc(db, 'users', user.uid, 'myBooks', book.bookId), { isFavorite: !book.isFavorite })}><Star size={18} className={book.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} /></button>
                            <button onClick={() => { const n = new Set(expandedBooks); if(n.has(book.bookId)) n.delete(book.bookId); else n.add(book.bookId); setExpandedBooks(n); }} className="p-2 bg-slate-50 rounded-xl text-slate-400">{isExp ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>
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
                                 <div className="flex items-start gap-2 px-2 mt-1">
                                    <StickyNote size={12} className="text-slate-300 mt-0.5" />
                                    <input className="flex-1 bg-transparent border-none text-[10px] outline-none text-slate-400 placeholder:opacity-30 font-medium" placeholder={t.daily_notes} value={cp.note || ""} onChange={async (e) => { const nCP = [...book.checkpoints]; nCP[idx].note = e.target.value; await updateDoc(doc(db, 'users', user.uid, 'myBooks', book.bookId), { checkpoints: nCP }); }} />
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
                    {[{id:'all',l:t.global_f},{id:'intitle',l:t.title_f},{id:'inauthor',l:t.author_f},{id:'isbn',l:t.isbn_f}].map(m => (
                      <button key={m.id} onClick={() => setSearchType(m.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${searchType === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{m.l}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                       <input type="text" placeholder={t.search_p} className="w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-[1.5rem] outline-none font-medium text-sm border-slate-100" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && performSearch()} />
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    </div>
                    <button onClick={startScanner} className="bg-indigo-100 text-indigo-600 p-4 rounded-[1.25rem] active:scale-95 transition-all"><Barcode size={24} /></button>
                  </div>
                  <button onClick={() => performSearch()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all tracking-widest">{t.search_now}</button>
                </div>
                <div className="space-y-4">
                  {searchResults.map((book) => {
                    const alreadyHave = myBooks.find(b => b.bookId === book.id);
                    return (
                      <div key={book.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in zoom-in-95">
                        <div className="flex gap-5">
                          <img src={book.volumeInfo?.imageLinks?.thumbnail?.replace('http:','https:') || 'https://via.placeholder.com/150'} onClick={() => setViewingBook(book)} className="w-24 h-36 object-cover rounded-2xl shadow-md cursor-pointer hover:scale-105 transition-all" />
                          <div className="flex-1 flex flex-col">
                            <h3 className="font-bold text-sm leading-tight line-clamp-2">{book.volumeInfo.title}</h3>
                            <p className="text-xs text-indigo-500 font-bold mb-4">{book.volumeInfo.authors?.join(', ')}</p>
                            <div className="mt-auto space-y-2">
                              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                 <span className="text-[9px] font-black uppercase text-slate-400 ml-2">{t.read}?</span>
                                 <div onClick={() => handleAddBook(book, alreadyHave?.status === 'read' ? 'want' : 'read')} className={`relative w-20 h-8 rounded-full cursor-pointer transition-all p-1 ${alreadyHave?.status === 'read' ? 'bg-green-50' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-1 bottom-1 w-6 bg-white rounded-full shadow transition-all ${alreadyHave?.status === 'read' ? 'translate-x-12' : 'translate-x-0'}`} />
                                 </div>
                              </div>
                              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                                <button onClick={() => { setPlanningBook(book); setManualPages(book.volumeInfo.pageCount || ""); }} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-[8px] font-black uppercase shadow-sm whitespace-nowrap px-3">{t.plan}</button>
                                <button onClick={() => handleAddBook(book, 'library')} className="bg-indigo-50 text-indigo-600 p-2 rounded-xl active:scale-95"><Library size={14}/></button>
                                <button onClick={() => handleAddBook(book, 'want', true)} className="p-2 bg-yellow-50 text-yellow-600 rounded-xl active:scale-95"><Star size={16}/></button>
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
               <div className="space-y-6 animate-in fade-in">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-lg mb-4 text-center uppercase tracking-tighter">{t.social}</h3>
                    <div className="relative mb-6">
                       <input type="text" placeholder={t.search_people} className="w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl outline-none font-medium text-sm border-slate-100 focus:ring-2 focus:ring-indigo-500" value={profileSearch} onChange={(e) => setProfileSearch(e.target.value)} />
                       <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={inviteWhatsApp} className="flex-1 py-4 bg-green-500 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><MessageCircle size={20}/><span className="text-xs font-black uppercase">{t.invite}</span></button>
                      <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`)} className="flex-1 py-4 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Facebook size={20}/><span className="text-xs font-black uppercase">{t.invite}</span></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                     {publicData.filter(p => p.userId !== user?.uid && !userProfile.dismissedUsers?.includes(p.userId)).filter(p => p.name.toLowerCase().includes(profileSearch.toLowerCase())).map(p => (
                        <div key={p.userId} onClick={() => setSelectedUserProfile(p)} className="bg-white p-4 rounded-[2.5rem] border shadow-sm flex items-center justify-between animate-in zoom-in-95 group cursor-pointer hover:border-indigo-200">
                           <div className="flex items-center gap-3">
                              <div className="relative">
                                 {p.profilePic ? <img src={p.profilePic} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" /> : <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center font-black text-indigo-600 text-lg">{p.name?.charAt(0)}</div>}
                                 <div className="absolute -bottom-1 -right-1"><VerificationCheck count={p.followersCount} /></div>
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-800 text-sm">{p.name}</h4>
                                 <p className="text-[9px] font-black text-indigo-500 uppercase">{getLevelTitle(p.readCount, lang)}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.followersCount || 0} {t.followers}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <button onClick={(e) => {e.stopPropagation(); updateDoc(doc(db, 'profiles', user.uid), { dismissedUsers: arrayUnion(p.userId) });}} className="p-3 text-slate-200 hover:text-red-400"><UserX size={18}/></button>
                              <button onClick={async (e) => {
                                 e.stopPropagation();
                                 const isF = userProfile.following?.includes(p.userId);
                                 await updateDoc(doc(db, 'profiles', user.uid), { following: isF ? arrayRemove(p.userId) : arrayUnion(p.userId) });
                                 await updateDoc(doc(db, 'profiles', p.userId), { followersCount: increment(isF ? -1 : 1) });
                              }} className={`p-3 rounded-2xl transition-all ${userProfile.following?.includes(p.userId) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                 {userProfile.following?.includes(p.userId) ? <UserCheck size={20}/> : <UserPlus size={20}/>}
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* PERFIL PROPIO */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center relative overflow-hidden">
                  <button onClick={() => setIsEditingProfile(true)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 shadow-sm transition-all active:rotate-12"><Edit3 size={18} /></button>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {userProfile.profilePic ? <img src={userProfile.profilePic} className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" /> : <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-xl">{userProfile.name?.charAt(0)}</div>}
                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-slate-50 scale-125"><VerificationCheck count={userProfile.followersCount} size={24} /></div>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{userProfile.name}</h2>
                  <p className="text-[10px] font-black text-indigo-600 uppercase mb-8 tracking-[0.2em]">{getLevelTitle(userProfile.readCount, lang)}</p>
                  <div className="flex justify-center gap-8 text-[9px] font-black text-slate-400 uppercase bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                     <div className="text-center"><span className="text-indigo-600 text-xl block mb-1">{userProfile.readCount}</span>{t.read}</div>
                     <div className="w-px h-8 bg-slate-200"></div>
                     <div className="text-center"><span className="text-purple-600 text-xl block mb-1">{userProfile.followersCount}</span>Fans</div>
                     <div className="w-px h-8 bg-slate-200"></div>
                     <div className="text-center"><span className="text-amber-600 text-xl block mb-1">{userProfile.badges?.length || 0}</span>Logros</div>
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="bg-white p-6 rounded-[3rem] border-2 border-indigo-500 shadow-2xl space-y-4 animate-in slide-in-from-top-4">
                    <input type="text" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 outline-none font-bold text-sm" placeholder="Nombre..." />
                    <label className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-6 cursor-pointer text-slate-400 hover:border-indigo-300 transition-all">
                      <Upload size={18} /> <span className="text-xs font-black uppercase tracking-widest">Cambiar Foto</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <button onClick={async () => { await updateDoc(doc(db, 'profiles', user.uid), { name: userProfile.name, profilePic: userProfile.profilePic }); setIsEditingProfile(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg tracking-widest">Guardar</button>
                  </div>
                )}

                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2 tracking-widest"><Award size={18} className="text-amber-500" /> {t.badges_title}</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const id = (i + 1).toString();
                      const unlocked = userProfile.badges?.includes(id);
                      return (
                        <div key={id} className="flex flex-col items-center gap-1 group relative">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 transform ${unlocked ? 'bg-indigo-50 shadow-md scale-100 border border-indigo-100' : 'bg-slate-50 opacity-20 scale-90'}`}>
                            {unlocked ? <img src={`/${id}.png`} className="w-full h-full object-contain p-1 animate-in zoom-in" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/5971/5971593.png"} } /> : <Lock size={20} className="text-slate-200" />}
                          </div>
                          <span className={`text-[7px] font-black text-center uppercase leading-tight ${unlocked ? 'text-indigo-600' : 'text-slate-300'}`}>{unlocked ? BADGE_DEFS[id].name : "???"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-8 py-4 flex justify-between items-center z-40 shadow-2xl">
        {[{id:'library',icon:Layout,l:t.library},{id:'search',icon:Search,l:t.plan},{id:'social',icon:Globe,l:t.social},{id:'profile',icon:User,l:t.profile}].map(t_nav => (
          <button key={t_nav.id} onClick={() => {setActiveTab(t_nav.id); setSelectedUserProfile(null);}} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === t_nav.id ? 'text-indigo-600 scale-110' : 'text-slate-400 opacity-60'}`}>
            <t_nav.icon size={22} strokeWidth={activeTab === t_nav.id ? 2.5 : 2} />
            <span className="text-[7px] font-black uppercase tracking-widest">{t_nav.l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

