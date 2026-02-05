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
  Book as BookIcon
} from 'lucide-react';

// --- TUS CREDENCIALES REALES ---
const firebaseConfig = {
  apiKey: "AIzaSyDM9GK7_gnd0GaVbxwK9xnwl0qk75MnFXw",
  authDomain: "playmobil-2d74d.firebaseapp.com",
  projectId: "playmobil-2d74d",
  storageBucket: "playmobil-2d74d.firebasestorage.app",
  messagingSenderId: "85202851148",
  appId: "1:85202851148:web:bf8eba63238c06c7b4ebe9",
  measurementId: "G-MX2B76PCD6"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'sandbook-v1';

// --- CONFIGURACIÓN DE LAS 20 INSIGNIAS ---
const BADGE_LEVELS = [
  { id: 1, min: 1, name: "Primeras Letras" },
  { id: 2, min: 3, name: "Curiosidad Despierta" },
  { id: 3, min: 5, name: "Pequeño Lector" },
  { id: 4, min: 8, name: "Senda de Tinta" },
  { id: 5, min: 12, name: "Ratón de Biblioteca" },
  { id: 6, min: 18, name: "Viajero Novato" },
  { id: 7, min: 25, name: "Explorador de Mundos" },
  { id: 8, min: 35, name: "Coleccionista de Historias" },
  { id: 9, min: 45, name: "Buscador de Sabiduría" },
  { id: 10, min: 55, name: "Devorador de Páginas" },
  { id: 11, min: 65, name: "Mente Inquieta" },
  { id: 12, min: 75, name: "Erudito en Potencia" },
  { id: 13, min: 90, name: "Maestro de la Tinta" },
  { id: 14, min: 105, name: "Guardián del Saber" },
  { id: 15, min: 120, name: "Arquitecto de Sueños" },
  { id: 16, min: 140, name: "Filósofo Moderno" },
  { id: 17, min: 165, name: "Titán Literario" },
  { id: 18, min: 190, name: "Deidad de los Libros" },
  { id: 19, min: 220, name: "Leyenda Eterna" },
  { id: 20, min: 250, name: "Omnisciente" }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); 
  const [myBooks, setMyBooks] = useState([]);
  const [publicData, setPublicData] = useState([]);
  const [follows, setFollows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, intitle, inauthor, isbn
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [goal, setGoal] = useState(12);
  const [isWriter, setIsWriter] = useState(false);
  
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

    const unsubMyBooks = onSnapshot(collection(db, 'users', user.uid, 'myBooks'), (s) => {
      setMyBooks(s.docs.map(d => d.data()));
    });

    const unsubProfiles = onSnapshot(collection(db, 'profiles'), (s) => {
      setPublicData(s.docs.map(d => d.data()));
    });

    const unsubComments = onSnapshot(collection(db, 'comments'), (s) => {
      const map = {};
      s.docs.forEach(doc => {
        const d = doc.data();
        if (!map[d.bookId]) map[d.bookId] = [];
        map[d.bookId].push({ id: doc.id, ...d });
      });
      setBookComments(map);
    });

    const unsubFollows = onSnapshot(collection(db, 'users', user.uid, 'following'), (s) => {
      setFollows(s.docs.map(d => d.id));
    });

    getDoc(doc(db, 'profiles', user.uid)).then(d => {
      if (d.exists()) {
        const data = d.data();
        setIsWriter(data.isWriter || false);
        setUserName(data.name || '');
        setProfilePic(data.profilePic || '');
      } else {
        const defaultName = `Lector_${user.uid.slice(0,4)}`;
        setUserName(defaultName);
        setDoc(doc(db, 'profiles', user.uid), { 
          userId: user.uid, name: defaultName, isWriter: false, readCount: 0, profilePic: '' 
        });
      }
    });

    return () => { unsubMyBooks(); unsubProfiles(); unsubComments(); unsubFollows(); };
  }, [user]);

  // --- LÓGICA DE IMAGEN ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result); // Base64
      };
      reader.readAsDataURL(file);
    }
  };

  // --- BÚSQUEDA ---
  const performSearch = async (forcedQuery = null, forcedType = null) => {
    const q = forcedQuery || searchQuery;
    const type = forcedType || searchType;
    if (!q.trim()) return;

    setIsSearching(true);
    try {
      let url = `https://www.googleapis.com/books/v1/volumes?q=`;
      if (type === 'isbn' || q.startsWith('isbn:')) {
        const cleanIsbn = q.replace('isbn:', '').trim();
        url += `isbn:${cleanIsbn}`;
      } else if (type === 'intitle') {
        url += `intitle:${encodeURIComponent(q)}`;
      } else if (type === 'inauthor') {
        url += `inauthor:${encodeURIComponent(q)}`;
      } else {
        url += encodeURIComponent(q);
      }
      
      const response = await fetch(url + "&maxResults=15");
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (err) {
      console.error(err);
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
          html5QrCode.stop(); 
          setShowScanner(false); 
          setSearchQuery(res);
          setSearchType('isbn');
          performSearch(res, 'isbn'); 
        },
        () => {}
      ).catch(e => console.error(e));
    }, 500);
  };

  const handleAddBook = async (bookData, status, isFav = false) => {
    if (!user) return;
    const info = {
      bookId: bookData.id,
      title: bookData.volumeInfo.title,
      authors: bookData.volumeInfo.authors || ['Anónimo'],
      thumbnail: bookData.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150x220?text=No+Image',
      status: status,
      isFavorite: isFav,
      checkpoints: [],
      addedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid, 'myBooks', bookData.id), info);
    if (status === 'reading') {
      setEditingPlanBook(info);
      setTempCheckpoints([]);
    }
  };

  const toggleFavorite = async (bookId) => {
    if (!user) return;
    const book = myBooks.find(b => b.bookId === bookId);
    if (!book) return;
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { isFavorite: !book.isFavorite });
  };

  const toggleCheckpoint = async (bookId, idx) => {
    const book = myBooks.find(b => b.bookId === bookId);
    const nCP = [...book.checkpoints];
    nCP[idx].completed = !nCP[idx].completed;
    const allDone = nCP.every(c => c.completed);
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { checkpoints: nCP, status: allDone ? 'read' : 'reading' });
    if (allDone) {
      victoryAudio.current.play().catch(() => {});
      await updateDoc(doc(db, 'profiles', user.uid), { readCount: myBooks.filter(b => b.status === 'read').length + 1, lastBook: book.title });
    }
  };

  const saveReadingPlan = async () => {
    if (!user || !editingPlanBook) return;
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', editingPlanBook.bookId), {
      checkpoints: tempCheckpoints,
      status: tempCheckpoints.length > 0 ? 'reading' : 'want'
    });
    setEditingPlanBook(null);
  };

  const postComment = async (bookId) => {
    if (!newComment.trim() || !user) return;
    await addDoc(collection(db, 'comments'), {
      bookId, userId: user.uid, userName, userPic: profilePic, text: newComment, timestamp: serverTimestamp(), isWriter
    });
    setNewComment("");
  };

  const readBooksCount = myBooks.filter(b => b.status === 'read').length;
  const currentBadge = [...BADGE_LEVELS].reverse().find(b => readBooksCount >= b.min) || null;
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
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg">
            <BookOpen size={20} strokeWidth={3} />
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tighter">Sandbook</h1>
        </div>
        <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200">
          {profilePic ? (
            <img src={profilePic} className="w-8 h-8 rounded-full object-cover border-2 border-white" alt="Perfil" />
          ) : (
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold uppercase">{userName?.charAt(0)}</div>
          )}
          <span className="text-xs font-bold text-slate-700 hidden sm:block max-w-[80px] truncate px-2">{userName}</span>
        </button>
      </header>

      {/* MODALES */}
      {editingPlanBook && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h3 className="font-black text-lg flex items-center gap-2"><ListChecks /> Planificar Lectura</h3>
              <button onClick={() => setEditingPlanBook(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {tempCheckpoints.map((cp, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="text" value={cp.title} onChange={(e) => { const n = [...tempCheckpoints]; n[idx].title = e.target.value; setTempCheckpoints(n); }} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button onClick={() => setTempCheckpoints(tempCheckpoints.filter((_, i) => i !== idx))} className="text-red-400 p-1"><X size={18} /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => setTempCheckpoints([...tempCheckpoints, { title: `Checkpoint ${tempCheckpoints.length + 1}`, completed: false }])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs">+ Agregar Checkpoint</button>
              <button onClick={saveReadingPlan} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs">Comenzar Plan</button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md aspect-square bg-slate-900 rounded-3xl overflow-hidden border-2 border-indigo-500" id="reader"></div>
          <p className="mt-8 text-white font-bold">Encuadra el código ISBN</p>
          <button onClick={() => setShowScanner(false)} className="absolute top-10 right-10 text-white p-3 bg-white/10 rounded-full"><X size={24} /></button>
        </div>
      )}

      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* VISTA: MURO */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2.5rem] text-white shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  {currentBadge ? (
                    <img src={`/${currentBadge.id}.png`} className="w-16 h-16 object-contain" alt="Badge" onError={(e) => e.target.style.display='none'} />
                  ) : (
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl">🥚</div>
                  )}
                  <div><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Rango Sandbook</p><h2 className="text-2xl font-black">{currentBadge?.name || "Lector Novato"}</h2></div>
                </div>
              </div>
              <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/10"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min((readBooksCount/goal)*100, 100)}%` }} /></div>
              <div className="mt-2 flex justify-between text-[10px] font-bold"><span>META ANUAL</span><span>{readBooksCount} / {goal} libros</span></div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['all', 'read', 'want', 'favorite'].map(type => (
                <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap border transition-all ${filterType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {type === 'all' ? 'Todos' : type === 'read' ? 'Leídos' : type === 'want' ? 'Para leer' : 'Favoritos ⭐'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredBooks.map((book, i) => {
                const done = book.checkpoints?.filter(c => c.completed).length || 0;
                const total = book.checkpoints?.length || 0;
                const perc = total > 0 ? (done / total) * 100 : (book.status === 'read' ? 100 : 0);
                return (
                  <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4">
                    <div className="flex gap-4 mb-4">
                      <img src={book.thumbnail} className="w-16 h-24 object-cover rounded-xl shadow-sm" />
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="flex justify-between items-start">
                          <div><h4 className="font-bold text-slate-800 line-clamp-1">{book.title}</h4><p className="text-xs text-slate-400">{book.authors[0]}</p></div>
                          <button onClick={() => toggleFavorite(book.bookId)}><Star className={book.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} size={20} /></button>
                        </div>
                        <div className="space-y-1 mt-4">
                          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase"><span>Progreso</span><span>{Math.round(perc)}%</span></div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{width: `${perc}%`}} /></div>
                        </div>
                      </div>
                    </div>
                    {book.checkpoints?.length > 0 && (
                      <div className="space-y-2 border-t border-slate-50 pt-4">
                        {book.checkpoints.map((cp, idx) => (
                          <button key={idx} onClick={() => toggleCheckpoint(book.bookId, idx)} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-2xl active:scale-95 transition-all">
                            <div className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${cp.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 bg-white'}`}>{cp.completed && <CheckCircle size={14} />}</div><span className={`text-xs font-bold ${cp.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{cp.title}</span></div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA: BUSCADOR */}
        {activeTab === 'search' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'all', label: 'Todo', icon: Globe },
                  { id: 'intitle', label: 'Título', icon: BookIcon },
                  { id: 'inauthor', label: 'Autor', icon: User },
                  { id: 'isbn', label: 'ISBN', icon: Flag }
                ].map(mode => (
                  <button key={mode.id} onClick={() => setSearchType(mode.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border transition-all ${searchType === mode.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    <mode.icon size={12} /> {mode.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="text" placeholder={`Buscar ${searchType === 'inauthor' ? 'por autor...' : 'libros...'}`} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && performSearch()} />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <button onClick={startScanner} className="bg-indigo-100 text-indigo-600 p-4 rounded-[1.25rem] hover:bg-indigo-200 transition-all"><Camera size={24} /></button>
              </div>
              <button onClick={() => performSearch()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> Buscar Ahora</>}
              </button>
            </div>

            <div className="space-y-4">
              {searchResults.map((book) => {
                const coms = bookComments[book.id] || [];
                const exp = expandedComments === book.id;
                return (
                  <div key={book.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 flex gap-4">
                      <img src={book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150x220?text=Sin+Portada'} className="w-24 h-36 object-cover rounded-2xl shadow-md" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-sm leading-tight line-clamp-2">{book.volumeInfo.title}</h3>
                          <p className="text-xs text-indigo-500 font-bold mt-1">{book.volumeInfo.authors?.join(', ')}</p>
                          <p className="text-[10px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">{book.volumeInfo.description}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => handleAddBook(book, 'reading')} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-[1rem] text-[9px] font-black uppercase shadow-sm">Planificar</button>
                          <button onClick={() => handleAddBook(book, 'want')} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-[1rem] text-[9px] font-black uppercase">Para leer</button>
                          <button onClick={() => handleAddBook(book, 'want', true)} className="p-2 bg-yellow-50 text-yellow-600 rounded-xl"><Star size={18} /></button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 border-t border-slate-100">
                      <button onClick={() => setExpandedComments(exp ? null : book.id)} className="w-full px-4 py-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400"><div className="flex items-center gap-2"><MessageSquare size={14} /> {coms.length} Reseñas</div>{exp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                      {exp && (
                        <div className="p-4 pt-0 space-y-4">
                          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                            {coms.map(c => (
                              <div key={c.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex gap-3">
                                {c.userPic ? <img src={c.userPic} className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-[9px] font-bold">{c.userName?.charAt(0)}</div>}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-bold text-slate-700">{c.userName}</span>{c.isWriter && <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded font-black">✍️</span>}</div>
                                  <p className="text-xs text-slate-600 leading-tight">{c.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="relative mt-2"><input type="text" placeholder="Escribe tu reseña..." className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs pr-12 outline-none" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && postComment(book.id)} /><button onClick={() => postComment(book.id)} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 p-2"><Send size={16} /></button></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA: RED */}
        {activeTab === 'social' && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Lectores de Sandbook</h3>
            <div className="grid grid-cols-1 gap-3">
              {publicData.filter(p => p.userId !== user?.uid).map(p => (
                <div key={p.userId} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {p.profilePic ? <img src={p.profilePic} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" /> : <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center font-black text-indigo-600 text-lg shadow-inner">{p.name?.charAt(0)}</div>}
                    <div><div className="flex items-center gap-2"><h4 className="font-bold text-slate-800 text-sm">{p.name}</h4>{p.isWriter && <PenTool size={12} className="text-amber-500" />}</div><p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{p.readCount || 0} Libros leídos</p></div>
                  </div>
                  <button onClick={async () => { const r = doc(db, 'users', user.uid, 'following', p.userId); if (follows.includes(p.userId)) await deleteDoc(r); else await setDoc(r, { followedAt: serverTimestamp() }); }} className={`p-3 rounded-2xl transition-all ${follows.includes(p.userId) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>{follows.includes(p.userId) ? <UserCheck size={20} /> : <UserPlus size={20} />}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA: PERFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center relative group">
              <button onClick={() => setIsEditingProfile(true)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 transition-all"><Edit3 size={18} /></button>
              <div className="relative w-28 h-28 mx-auto mb-4">{profilePic ? <img src={profilePic} className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl shadow-indigo-100" /> : <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-4xl border-4 border-white shadow-xl">{userName?.charAt(0)}</div>}{isWriter && <div className="absolute -bottom-1 -right-1 bg-amber-400 p-2.5 rounded-full border-4 border-white text-white shadow-lg animate-bounce-subtle"><PenTool size={16} strokeWidth={3} /></div>}</div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{userName}</h2>
              <div className="flex justify-center gap-6 mt-6">
                <div className="text-center"><p className="text-lg font-black text-indigo-600">{follows.length}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Siguiendo</p></div>
                <div className="w-px h-8 bg-slate-100 my-auto"></div>
                <div className="text-center"><p className="text-lg font-black text-purple-600">{readBooksCount}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Leídos</p></div>
              </div>
            </div>

            {isEditingProfile && (
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-500 shadow-xl space-y-4 animate-in slide-in-from-top-4">
                <h3 className="font-black text-sm uppercase flex items-center gap-2"><Settings size={18} /> Perfil</h3>
                <div className="space-y-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Público</label><input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none" /></div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Foto de Perfil</label>
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-3 cursor-pointer hover:border-indigo-300 hover:text-indigo-600 transition-all">
                        <Upload size={18} /> <span className="text-xs font-bold">Cargar desde dispositivo</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl"><span className="text-xs font-bold">Modo Escritor</span><button onClick={() => setIsWriter(!isWriter)} className={`w-12 h-6 rounded-full relative transition-all ${isWriter ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isWriter ? 'right-1' : 'left-1'}`} /></button></div>
                  <div className="flex gap-2"><button onClick={() => setIsEditingProfile(false)} className="flex-1 py-3 text-xs font-bold text-slate-500">Cerrar</button><button onClick={async () => { await updateDoc(doc(db, 'profiles', user.uid), { name: userName, profilePic: profilePic, isWriter: isWriter }); setIsEditingProfile(false); }} className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-xs font-black shadow-lg shadow-indigo-100">Guardar</button></div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> Logros Sandbook</h3>
              <div className="grid grid-cols-4 gap-4">
                {BADGE_LEVELS.map((b) => {
                  const unlocked = readBooksCount >= b.min;
                  return (
                    <div key={b.id} className="flex flex-col items-center gap-2 group relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${unlocked ? 'bg-indigo-50 shadow-md scale-100' : 'bg-slate-100 scale-90 opacity-40'}`}>
                        {unlocked ? <img src={`/${b.id}.png`} className="w-full h-full object-contain p-1" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/5971/5971593.png"; }} /> : <Lock size={20} className="text-slate-300" />}
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
          {id: 'library', icon: Layout, label: 'Biblioteca'},
          {id: 'search', icon: Search, label: 'Planear'},
          {id: 'social', icon: Globe, label: 'Red'},
          {id: 'profile', icon: User, label: 'Yo'}
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

