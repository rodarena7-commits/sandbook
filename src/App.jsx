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
  Users,
  Trash2,
  Facebook,
  Languages
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

// --- DICCIONARIO DE TRADUCCIONES ---
const i18n = {
  es: {
    welcome: "Bienvenido a Sandbook",
    library: "Biblioteca",
    plan: "Planear",
    social: "Red",
    profile: "Yo",
    read: "Leído",
    pending: "Pendiente",
    favorites: "Favoritos ⭐",
    all: "Todo",
    search_placeholder: "Busca libros o autores...",
    pages: "Páginas",
    days: "Días",
    start_adventure: "Comenzar Aventura",
    confirm_delete: "¿Estás seguro de eliminar este libro?",
    confirm_delete_desc: "Esta acción no se puede deshacer.",
    cancel: "Cancelar",
    delete: "Eliminar",
    invite: "Invitar amigos",
    level_legendary: "Legendario",
    level_expert: "Experto",
    level_amateur: "Amateur",
    level_novice: "Nivel 1 Novato",
    level_beginner: "Principiante",
    login_fb: "Entrar con Facebook",
    unlocked: "Desbloqueado",
    locked: "Bloqueado"
  },
  en: {
    welcome: "Welcome to Sandbook",
    library: "Library",
    plan: "Plan",
    social: "Social",
    profile: "Me",
    read: "Read",
    pending: "Pending",
    favorites: "Favorites ⭐",
    all: "All",
    search_placeholder: "Search books or authors...",
    pages: "Pages",
    days: "Days",
    start_adventure: "Start Adventure",
    confirm_delete: "Are you sure you want to delete this book?",
    confirm_delete_desc: "This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    invite: "Invite friends",
    level_legendary: "Legendary",
    level_expert: "Expert",
    level_amateur: "Amateur",
    level_novice: "Level 1 Novice",
    level_beginner: "Beginner",
    login_fb: "Login with Facebook",
    unlocked: "Unlocked",
    locked: "Locked"
  }
};

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

const VerificationBadge = ({ followers = 0, size = 16 }) => {
  if (followers >= 100000) return <CheckCircle size={size} className="text-yellow-500 fill-yellow-50" />;
  if (followers >= 10000) return <CheckCircle size={size} className="text-slate-400 fill-slate-50" />;
  if (followers >= 1000) return <CheckCircle size={size} className="text-blue-500 fill-blue-50" />;
  if (followers >= 100) return <CheckCircle size={size} className="text-green-500 fill-green-50" />;
  if (followers >= 10) return <CheckCircle size={size} className="text-amber-800 fill-amber-50" />;
  return null;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('es'); // 'es' o 'en'
  const t = i18n[lang];

  const [activeTab, setActiveTab] = useState('library'); 
  const [myBooks, setMyBooks] = useState([]);
  const [publicData, setPublicData] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: '', profilePic: '', badges: [], scanCount: 0, followersCount: 0, following: [] });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); 
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  
  const [bookToDelete, setBookToDelete] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [planningBook, setPlanningBook] = useState(null);
  const [planDays, setPlanDays] = useState(7);
  const [manualPages, setManualPages] = useState("");
  const [expandedBooks, setExpandedBooks] = useState(new Set());
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const victoryAudio = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"));

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
      else setDoc(doc(db, 'profiles', user.uid), { userId: user.uid, name: user.displayName || 'Lector', badges: [], scanCount: 0, readCount: 0, profilePic: user.photoURL || '', followersCount: 0, following: [] });
    });
    const unsubPublic = onSnapshot(collection(db, 'profiles'), (s) => setPublicData(s.docs.map(d => d.data())));
    return () => { unsubBooks(); unsubProfile(); unsubPublic(); };
  }, [user]);

  const loginWithFacebook = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      setUser(result.user);
    } catch (error) {
      console.error("Facebook login error", error);
    }
  };

  const inviteFacebookFriends = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const deleteBook = async () => {
    if (!user || !bookToDelete) return;
    await deleteDoc(doc(db, 'users', user.uid, 'myBooks', bookToDelete));
    setBookToDelete(null);
  };

  const getUserLevelName = (readCount = 0) => {
    if (readCount >= 100000) return t.level_legendary;
    if (readCount >= 1000) return t.level_expert;
    if (readCount >= 100) return t.level_amateur;
    if (readCount >= 10) return t.level_novice;
    return t.level_beginner;
  };

  // --- BUSCADOR ---
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

      const response = await fetch(url);
      const data = await response.json();
      if (data.items) setSearchResults(data.items);
      else setSearchError(lang === 'es' ? "No se hallaron resultados" : "No results found");
    } catch (err) { setSearchError("API Error"); } finally { setIsSearching(false); }
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserProfile(p => ({ ...p, profilePic: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100"><BookOpen size={20} strokeWidth={3} /></div>
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tight">Sandbook</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-indigo-50 transition-colors">
            <Languages size={20} />
          </button>
          <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200 pr-3">
            {userProfile.profilePic ? <img src={userProfile.profilePic} className="w-8 h-8 rounded-full object-cover border-2 border-white" /> : <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{userProfile.name?.charAt(0)}</div>}
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-700 hidden sm:block truncate max-w-[80px]">{userProfile.name}</span>
              <VerificationBadge followers={userProfile.followersCount} />
            </div>
          </button>
        </div>
      </header>

      {/* CARTEL DE CONFIRMACIÓN ELIMINAR */}
      {bookToDelete && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl scale-in-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="font-black text-xl mb-2">{t.confirm_delete}</h3>
            <p className="text-slate-400 text-sm mb-8">{t.confirm_delete_desc}</p>
            <div className="flex gap-3">
              <button onClick={() => setBookToDelete(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-500">{t.cancel}</button>
              <button onClick={deleteBook} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black uppercase text-xs">{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANNER */}
      {planningBook && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="font-black text-xl mb-6 text-indigo-600 flex items-center gap-2"><Calendar /> {t.plan}</h3>
            <div className="space-y-4">
               <div><label className="text-[10px] font-black text-slate-400 uppercase">{t.pages}</label>
               <input type="number" value={manualPages} onChange={(e) => setManualPages(e.target.value)} className="w-full bg-slate-50 border rounded-2xl p-4 font-bold outline-none" /></div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase">{t.days}</label>
               <input type="number" value={planDays} onChange={(e) => setPlanDays(e.target.value)} className="w-full bg-slate-50 border rounded-2xl p-4 font-bold outline-none" /></div>
               <button onClick={saveAutomaticPlan} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg mt-4">{t.start_adventure}</button>
               <button onClick={() => setPlanningBook(null)} className="w-full text-slate-400 font-bold text-xs mt-2">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* VISTA BIBLIOTECA */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <div className="flex items-center gap-2 mb-1"><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p></div>
                        <h2 className="text-2xl font-black">{getUserLevelName(userProfile.readCount)}</h2>
                     </div>
                     <Sparkles className="opacity-30" size={32} />
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-2"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min((userProfile.readCount/100)*100, 100)}%` }} /></div>
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-80"><span>{userProfile.readCount} {t.read}</span><span>Meta: 100</span></div>
               </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['all', 'read', 'want', 'favorite'].map(type => (
                <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all ${filterType === type ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                  {t[type] || t.all}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {myBooks.filter(b => filterType === 'all' || (filterType === 'favorite' && b.isFavorite) || (filterType === 'read' && b.status === 'read') || (filterType === 'want' && b.status !== 'read')).map((book, i) => (
                <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in">
                  <div className="flex gap-4">
                    <img src={book.thumbnail} className="w-14 h-20 object-cover rounded-xl shadow-sm" />
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{book.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{book.authors[0]}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                       <button onClick={() => setBookToDelete(book.bookId)} className="p-2 text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={18}/></button>
                       <button onClick={() => { const n = new Set(expandedBooks); if(n.has(book.bookId)) n.delete(book.bookId); else n.add(book.bookId); setExpandedBooks(n); }} className="p-2 text-slate-400"><Maximize2 size={16}/></button>
                    </div>
                  </div>
                  {expandedBooks.has(book.bookId) && book.checkpoints?.map((cp, idx) => (
                    <button key={idx} onClick={() => toggleCheckpoint(book.bookId, idx)} className={`w-full flex items-center justify-between p-3 mt-2 rounded-2xl border ${cp.completed ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                      <span className="text-xs font-bold">{cp.title}</span>
                      {cp.completed && <CheckCircle size={14}/>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA BUSCADOR */}
        {activeTab === 'search' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-2">
                <input type="text" placeholder={t.search_placeholder} className="flex-1 bg-slate-50 border rounded-[1.5rem] px-6 py-4 outline-none font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && performSearch()} />
                <button onClick={() => performSearch()} className="bg-indigo-600 text-white p-4 rounded-[1.25rem] shadow-lg"><Search size={24} /></button>
              </div>
            </div>

            <div className="space-y-4">
              {searchResults.map((book) => (
                <div key={book.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4 animate-in zoom-in-95">
                  <img src={book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150'} className="w-24 h-36 object-cover rounded-2xl shadow-md" />
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div><h3 className="font-bold text-sm leading-tight line-clamp-2">{book.volumeInfo.title}</h3><p className="text-xs text-indigo-500 font-bold mt-1">{book.volumeInfo.authors?.join(', ')}</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => { setPlanningBook(book); setManualPages(book.volumeInfo.pageCount || ""); }} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-[1rem] text-[9px] font-black uppercase">{t.plan}</button>
                      <button onClick={() => handleAddBook(book, 'read')} className="px-4 bg-green-50 text-green-600 rounded-[1rem] text-[9px] font-black uppercase">{t.read}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA RED SOCIAL */}
        {activeTab === 'social' && (
           <div className="space-y-4 animate-in fade-in">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                <div><h3 className="font-black text-lg">{t.social}</h3><p className="text-[10px] text-slate-400 font-bold uppercase">{t.invite}</p></div>
                <button onClick={inviteFacebookFriends} className="p-3 bg-[#1877F2] text-white rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                  <Facebook size={20} /> <span className="text-xs font-black uppercase tracking-widest">Facebook</span>
                </button>
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
                             <h4 className="font-bold text-slate-800 text-sm">{p.name}</h4>
                             <p className="text-[9px] font-bold text-slate-400 uppercase">{p.readCount || 0} Books • {p.followersCount || 0} Fans</p>
                          </div>
                       </div>
                       <button onClick={() => toggleFollow(p.userId)} className={`p-3 rounded-2xl transition-all ${userProfile.following?.includes(p.userId) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
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
              <button onClick={() => setIsEditingProfile(true)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400"><Edit3 size={18} /></button>
              
              <div className="relative w-32 h-32 mx-auto mb-4">
                {userProfile.profilePic ? <img src={userProfile.profilePic} className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" /> : <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-xl">{userProfile.name?.charAt(0)}</div>}
                <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-lg"><VerificationBadge followers={userProfile.followersCount} size={28} /></div>
              </div>

              <h2 className="text-2xl font-black text-slate-800">{userProfile.name}</h2>
              <p className="text-[10px] font-black text-indigo-600 uppercase mb-6">{getUserLevelName(userProfile.readCount)}</p>
              
              {!auth.currentUser?.providerData.some(p => p.providerId === 'facebook.com') && (
                <button onClick={loginWithFacebook} className="mb-6 w-full py-3 bg-[#1877F2] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                   <Facebook size={14} /> {t.login_fb}
                </button>
              )}

              <div className="flex justify-center gap-8 text-[10px] font-black text-slate-400 uppercase bg-slate-50 p-4 rounded-3xl border border-slate-100">
                 <div className="text-center"><span className="text-indigo-600 text-lg block">{userProfile.readCount}</span>{t.read}</div>
                 <div className="w-px h-8 bg-slate-200"></div>
                 <div className="text-center"><span className="text-purple-600 text-lg block">{userProfile.followersCount}</span>Fans</div>
              </div>
            </div>

            {isEditingProfile && (
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-500 shadow-xl space-y-4">
                <input type="text" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-slate-50 border rounded-2xl p-4 outline-none font-bold" />
                <label className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed rounded-2xl py-4 cursor-pointer text-slate-400">
                  <Upload size={18} /> <span className="text-xs font-bold">Cambiar Foto</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button onClick={async () => { await updateDoc(doc(db, 'profiles', user.uid), { name: userProfile.name, profilePic: userProfile.profilePic }); setIsEditingProfile(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs">Guardar</button>
              </div>
            )}

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><Award size={18} className="text-amber-500" /> Logros Sandbook</h3>
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 20 }).map((_, i) => {
                  const id = (i + 1).toString();
                  const unlocked = userProfile.badges?.includes(id);
                  return (
                    <div key={id} className="flex flex-col items-center gap-1 group relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${unlocked ? 'bg-indigo-50 shadow-md scale-100' : 'bg-slate-50 opacity-20 scale-90'}`}>
                        {unlocked ? <img src={`/${id}.png`} className="w-full h-full object-contain p-1" onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/5971/5971593.png"} /> : <Lock size={20} className="text-slate-300" />}
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
        {[{id:'library',icon:Layout},{id:'search',icon:Search},{id:'social',icon:Globe},{id:'profile',icon:User}].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === t.id ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <t.icon size={22} strokeWidth={activeTab === t.id ? 2.5 : 2} />
          </button>
        ))}
      </nav>
    </div>
  );
}

