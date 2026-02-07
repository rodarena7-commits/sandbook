import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  FacebookAuthProvider,
  GoogleAuthProvider,
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
  arrayRemove,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  BookOpen, Search, Trophy, Plus, CheckCircle, Layout, User, Award, Loader2, PenTool, Globe, Camera, MessageSquare, Send, X, ChevronDown, ChevronUp, Settings, Edit3, ListChecks, Lock, Flag, Sparkles, Star, Upload, Book as BookIcon, AlertCircle, Calendar, FileText, Info, Maximize2, Minimize2, UserPlus, UserCheck, Users, Trash2, Facebook, Languages, Share2, UserX, MessageCircle, StickyNote, Barcode, Library, Heart, ArrowLeft, Moon, Sun, Sunset, LogIn, LogOut, MessageSquarePlus, Eye, EyeOff, Bell, ThumbsUp, ThumbsDown, Bookmark, Quote, PenLine, TrendingUp, Clock, Flame, Target, Hash, Mic, Filter, MapPin
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
const googleProvider = new GoogleAuthProvider();

// --- TRADUCCIONES ---
const i18n = {
  es: {
    library: "Biblioteca", plan: "Planear", social: "Red", profile: "Yo",
    search_p: "Busca libros, autores o ISBN...", pages: "Páginas", days: "Días",
    start: "Comenzar", cancel: "Cancelar", delete_q: "¿Eliminar libro?",
    delete_desc: "Esta acción no se puede deshacer.", delete_btn: "Eliminar",
    invite: "INVITAR", read: "Leídos", pending: "Pendientes", favorites: "⭐ Favoritos",
    in_plan: "En plan", all: "Todos", in_library: "En Biblioteca",
    level: "Rango", followers: "Seguidores", search_now: "Buscar en Sandbook",
    manual_p: "Páginas totales", scan_msg: "Escaneando código...",
    title_f: "Título", author_f: "Autor", isbn_f: "ISBN", global_f: "Todo",
    dismiss_user: "Ocultar", reviews: "Reseñas", my_review: "Tu Opinión",
    daily_notes: "Notas del día", rate_book: "Calificar", save: "Guardar",
    who_read: "Lectores en Sandbook", global_rating: "Promedio Global",
    search_people: "Buscar personas...", recommend: "Recomendar", select_friend: "Elige un amigo",
    user_books: "Libros de", no_friends: "Sigue a alguien primero",
    badges_title: "Insignias", login: "Iniciar Sesión", logout: "Cerrar Sesión",
    google_login: "Google", facebook_login: "Facebook", anonymous: "Anónimo",
    message_placeholder: "Escribe un mensaje para tu amigo...",
    theme_dark: "Noche", theme_light: "Día", theme_sunset: "Atardecer",
    readers_count: "Personas que leyeron", add_to_library: "Añadir a biblioteca",
    remove_from_library: "Quitar de biblioteca", in_your_library: "En tu biblioteca",
    reading_plan: "Plan de lectura", complete_profile: "Completa tu perfil",
    currently_reading: "Leyendo ahora", books_this_month: "Libros este mes",
    writers: "Escritores", search_writers: "Buscar escritores...",
    biography: "Biografía", books_written: "Libros escritos",
    like: "Me gusta", dislike: "No me gusta",
    wall: "Muro", post_quote: "Publicar frase", max_characters: "Máximo 2500 caracteres",
    select_book: "Seleccionar libro", write_quote: "Escribe una frase del libro...",
    posts: "Publicaciones", no_posts: "No hay publicaciones aún",
    authors: "Autores", author_details: "Detalles del autor",
    books_by_author: "Libros del autor", loading_more: "Cargando más..."
  },
  en: {
    library: "Library", plan: "Plan", social: "Social", profile: "Me",
    search_p: "Search books, authors or ISBN...", pages: "Pages", days: "Days",
    start: "Start", cancel: "Cancel", delete_q: "Delete book?",
    delete_desc: "This action cannot be undone.", delete_btn: "Delete",
    invite: "INVITE", read: "Read", pending: "Pending", favorites: "⭐ Favorites",
    in_plan: "In Plan", all: "All", in_library: "In Library",
    level: "Rank", followers: "Followers", search_now: "Search Sandbook",
    manual_p: "Total pages", scan_msg: "Scanning code...",
    title_f: "Title", author_f: "Author", isbn_f: "ISBN", global_f: "All",
    dismiss_user: "Hide", reviews: "Reviews", my_review: "Your Review",
    daily_notes: "Daily notes", rate_book: "Rate", save: "Save",
    who_read: "Sandbook Readers", global_rating: "Global Rating",
    search_people: "Search people...", recommend: "Recommend", select_friend: "Select a friend",
    user_books: "Books of", no_friends: "Follow someone first",
    badges_title: "Badges", login: "Login", logout: "Logout",
    google_login: "Google", facebook_login: "Facebook", anonymous: "Anonymous",
    message_placeholder: "Write a message for your friend...",
    theme_dark: "Night", theme_light: "Day", theme_sunset: "Sunset",
    readers_count: "People who read", add_to_library: "Add to library",
    remove_from_library: "Remove from library", in_your_library: "In your library",
    reading_plan: "Reading plan", complete_profile: "Complete your profile",
    currently_reading: "Currently reading", books_this_month: "Books this month",
    writers: "Writers", search_writers: "Search writers...",
    biography: "Biography", books_written: "Books written",
    like: "Like", dislike: "Dislike",
    wall: "Wall", post_quote: "Post quote", max_characters: "Max 2500 characters",
    select_book: "Select book", write_quote: "Write a quote from the book...",
    posts: "Posts", no_posts: "No posts yet",
    authors: "Authors", author_details: "Author details",
    books_by_author: "Author's books", loading_more: "Loading more..."
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
  if (count >= 100000) return lang === 'es' ? "Legendario" : "Legendary";
  if (count >= 10000) return lang === 'es' ? "Experto Superior" : "High Expert";
  if (count >= 1000) return lang === 'es' ? "Experto" : "Expert";
  if (count >= 100) return lang === 'es' ? "Amateur" : "Amateur";
  if (count >= 10) return lang === 'es' ? "Nivel 1 Novato" : "Level 1 Novice";
  return lang === 'es' ? "Principiante" : "Beginner";
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
        className={`${interactive ? 'cursor-pointer transition-all active:scale-125' : ''} ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
      />
    ))}
  </div>
);

// Función para convertir imagen a blanco y negro
const convertToGrayscale = (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
        // Mantener el alpha (data[i + 3])
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.src = imageDataUrl;
  });
};

// --- APP PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('es');
  const t = i18n[lang];

  const [activeTab, setActiveTab] = useState('library'); 
  const [myBooks, setMyBooks] = useState([]);
  const [publicData, setPublicData] = useState([]);
  const [userProfile, setUserProfile] = useState({ 
    name: '', 
    profilePic: '', 
    badges: [], 
    scanCount: 0, 
    followersCount: 0, 
    following: [], 
    dismissedUsers: [], 
    readBooksList: [],
    readCount: 0,
    email: '',
    theme: 'light', // 'light', 'dark', 'sunset'
    likes: [], // Array de bookIds que le dieron like
    dislikes: [] // Array de bookIds que le dieron dislike
  });
  
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
  const [recommendMessage, setRecommendMessage] = useState("");
  const [userComment, setUserComment] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Estado para ver Perfil de otro Usuario
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedUserBooks, setSelectedUserBooks] = useState([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');

  // Estado para modo de vista
  const [theme, setTheme] = useState('light');

  // Nuevos estados para funcionalidades solicitadas
  const [showWriters, setShowWriters] = useState(false);
  const [writerSearch, setWriterSearch] = useState('');
  const [writerResults, setWriterResults] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [authorBooks, setAuthorBooks] = useState([]);
  const [wallPosts, setWallPosts] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedBookForPost, setSelectedBookForPost] = useState(null);
  const [booksForPost, setBooksForPost] = useState([]);
  const [postSearch, setPostSearch] = useState('');
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [currentlyReadingCount, setCurrentlyReadingCount] = useState(0);
  const [booksThisMonth, setBooksThisMonth] = useState(0);
  const [postsLoading, setPostsLoading] = useState(false);
  const [authorSearchLoading, setAuthorSearchLoading] = useState(false);
  const [moreBooksLoading, setMoreBooksLoading] = useState(false);

  const victoryAudio = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"));

  // Función para obtener tema basado en CSS
  const getThemeClasses = () => {
    switch(theme) {
      case 'dark':
        return {
          bg: 'bg-gray-900',
          text: 'text-gray-100',
          card: 'bg-gray-800 text-gray-100',
          border: 'border-gray-700',
          input: 'bg-gray-700 border-gray-600 text-gray-100',
          button: 'bg-gray-700 hover:bg-gray-600 text-gray-100',
          primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          secondary: 'bg-gray-600 hover:bg-gray-500 text-gray-100',
          accent: 'bg-purple-600 hover:bg-purple-700 text-white'
        };
      case 'sunset':
        return {
          bg: 'bg-orange-50',
          text: 'text-gray-800',
          card: 'bg-amber-50 text-gray-800',
          border: 'border-amber-200',
          input: 'bg-amber-100 border-amber-300 text-gray-800',
          button: 'bg-amber-500 hover:bg-amber-400 text-white',
          primary: 'bg-orange-500 hover:bg-orange-600 text-white',
          secondary: 'bg-amber-400 hover:bg-amber-300 text-gray-800',
          accent: 'bg-pink-500 hover:bg-pink-600 text-white'
        };
      default: // light
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-900',
          card: 'bg-white text-slate-900',
          border: 'border-slate-200',
          input: 'bg-slate-50 border-slate-200 text-slate-900',
          button: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
          primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-700',
          accent: 'bg-purple-600 hover:bg-purple-700 text-white'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const fetchWithRetry = async (url, retries = 3, delay = 2000) => {
    const res = await fetch(url);
    if (res.status === 429 && retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, retries - 1, delay * 2);
    }
    return res;
  };

  // Función para buscar más libros de un autor
  const searchMoreBooksByAuthor = async (authorName, page = 0) => {
    try {
      setMoreBooksLoading(true);
      let url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(authorName)}"&maxResults=20&startIndex=${page * 20}`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;

      const res = await fetchWithRetry(url);
      const data = await res.json();
      
      if (data.items) {
        const uniqueBooks = data.items.filter(newBook => 
          !authorBooks.some(existingBook => existingBook.id === newBook.id)
        );
        setAuthorBooks(prev => [...prev, ...uniqueBooks]);
      }
    } catch (err) {
      console.error("Error buscando más libros:", err);
    } finally {
      setMoreBooksLoading(false);
    }
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
      if (u) {
        setUser(u);
        // Cargar perfil del usuario
        const profileDoc = await getDoc(doc(db, 'profiles', u.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setUserProfile(prev => ({ ...prev, ...data }));
          if (data.theme) setTheme(data.theme);
        } else {
          // Crear perfil si no existe
          const newProfile = {
            userId: u.uid,
            name: u.displayName || 'Lector',
            email: u.email || '',
            profilePic: u.photoURL || '',
            badges: [],
            scanCount: 0,
            readCount: 0,
            followersCount: 0,
            following: [],
            dismissedUsers: [],
            readBooksList: [],
            theme: 'light',
            likes: [],
            dislikes: []
          };
          await setDoc(doc(db, 'profiles', u.uid), newProfile);
          setUserProfile(newProfile);
        }
        
        // Cargar notificaciones
        loadNotifications(u.uid);
        // Cargar posts del muro
        loadWallPosts();
      } else {
        // Iniciar sesión anónima
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error en autenticación anónima:", error);
        }
      }
    });
  }, []);

  // Cargar notificaciones
  const loadNotifications = async (userId) => {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });
    return unsubscribe;
  };

  // Cargar posts del muro
  const loadWallPosts = () => {
    if (!user) return;
    
    const postsQuery = query(
      collection(db, 'wallPosts'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWallPosts(posts);
    });
    
    return unsubscribe;
  };

  // Calcular libros leídos este mes
  const calculateBooksThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthRead = myBooks.filter(book => {
      if (book.status !== 'read') return false;
      const finishDate = book.finishDate || book.addedAt;
      if (!finishDate) return false;
      const bookDate = new Date(finishDate);
      return bookDate >= startOfMonth;
    }).length;
    
    setBooksThisMonth(monthRead);
  };

  // Calcular libros en plan actualmente
  const calculateCurrentlyReading = () => {
    const reading = myBooks.filter(book => book.status === 'reading').length;
    setCurrentlyReadingCount(reading);
  };

  useEffect(() => {
    if (!user) return;
    const unsubBooks = onSnapshot(collection(db, 'users', user.uid, 'myBooks'), (s) => {
      const books = s.docs.map(d => d.data());
      setMyBooks(books);
      calculateCurrentlyReading();
      calculateBooksThisMonth();
    });
    const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (d) => {
      if (d.exists()) {
        const data = d.data();
        setUserProfile(prev => ({ ...prev, ...data }));
        if (data.theme && data.theme !== theme) {
          setTheme(data.theme);
        }
      }
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
    
    // Cargar posts
    const unsubPosts = loadWallPosts();
    
    return () => { 
      unsubBooks(); 
      unsubProfile(); 
      unsubPublic(); 
      unsubComments(); 
      if (unsubPosts) unsubPosts();
    };
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

  const handleGoogleLogin = async () => {
    try { 
      const result = await signInWithPopup(auth, googleProvider);
      // El perfil se actualizará automáticamente en el listener de auth
    } catch (e) { 
      console.error("Error en login Google:", e);
      alert(lang === 'es' ? "Error al iniciar sesión con Google" : "Error signing in with Google");
    }
  };

  // Comentado el login con Facebook según solicitud
  /*
  const handleFacebookLogin = async () => {
    try { 
      await signInWithPopup(auth, facebookProvider);
    } catch (e) { 
      console.error("Error en login Facebook:", e);
      alert(lang === 'es' ? "Error al iniciar sesión con Facebook" : "Error signing in with Facebook");
    }
  };
  */

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Volver a autenticación anónima
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const inviteWhatsApp = () => {
    const msg = `¡Seamos amigos en Sandbook! Descarga la app aquí: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
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
      else if (searchType === 'inauthor') {
        // Búsqueda mejorada por autor - más resultados
        queryParam = `inauthor:"${q}"`;
      }

      // Aumentar resultados a 30 para búsquedas por autor
      const maxResults = searchType === 'inauthor' ? 30 : 15;
      let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(queryParam)}&maxResults=${maxResults}`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;

      const res = await fetchWithRetry(url);
      const data = await res.json();
      if (data.items) setSearchResults(data.items);
      else setSearchError(lang === 'es' ? "Sin resultados" : "No results");
    } catch (err) { setSearchError("API Error"); } finally { setIsSearching(false); }
  };

  // Buscar autores
  const searchAuthors = async () => {
    if (!writerSearch.trim()) return;
    setAuthorSearchLoading(true);
    try {
      let url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(writerSearch)}"&maxResults=10`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;

      const res = await fetchWithRetry(url);
      const data = await res.json();
      
      if (data.items) {
        // Extraer autores únicos
        const authorsMap = new Map();
        data.items.forEach(item => {
          if (item.volumeInfo?.authors) {
            item.volumeInfo.authors.forEach(author => {
              if (!authorsMap.has(author) && author.toLowerCase().includes(writerSearch.toLowerCase())) {
                authorsMap.set(author, {
                  name: author,
                  booksCount: 1,
                  thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null
                });
              } else if (authorsMap.has(author)) {
                const existing = authorsMap.get(author);
                authorsMap.set(author, { ...existing, booksCount: existing.booksCount + 1 });
              }
            });
          }
        });
        
        setWriterResults(Array.from(authorsMap.values()));
      } else {
        setWriterResults([]);
      }
    } catch (err) {
      console.error("Error buscando autores:", err);
      setWriterResults([]);
    } finally {
      setAuthorSearchLoading(false);
    }
  };

  // Ver detalles del autor
  const viewAuthorDetails = async (authorName) => {
    setSelectedAuthor(authorName);
    setAuthorBooks([]);
    
    try {
      let url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(authorName)}"&maxResults=10`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;

      const res = await fetchWithRetry(url);
      const data = await res.json();
      
      if (data.items) {
        setAuthorBooks(data.items);
      }
    } catch (err) {
      console.error("Error cargando libros del autor:", err);
    }
  };

  const startScanner = () => {
    setShowScanner(true);
    setTimeout(() => {
      if (!window.Html5Qrcode) {
        console.error("Html5Qrcode no está cargado");
        setShowScanner(false);
        return;
      }
      
      const html5QrCode = new window.Html5Qrcode("reader");
      html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, 
        (res) => { 
          html5QrCode.stop().then(() => {
            setShowScanner(false); 
            setSearchQuery(res); 
            setSearchType('isbn');
            if (user) {
              updateDoc(doc(db, 'profiles', user.uid), { scanCount: increment(1) });
            }
            performSearch(res); 
          }).catch(() => setShowScanner(false));
        },
        () => {}
      ).catch(() => setShowScanner(false));
    }, 500);
  };

  const handleAddBook = async (book, status, isFav = false, addToLibrary = false) => {
    if (!user) return;
    const bookId = book.id || book.bookId;
    const info = {
      bookId,
      title: book.volumeInfo?.title || book.title,
      authors: book.volumeInfo?.authors || book.authors || ['Anónimo'],
      thumbnail: (book.volumeInfo?.imageLinks?.thumbnail || book.thumbnail)?.replace('http:', 'https:') || 'https://via.placeholder.com/150',
      description: book.volumeInfo?.description || book.description || "",
      status, 
      isFavorite: isFav, 
      inLibrary: addToLibrary || status === 'library',
      checkpoints: [], 
      rating: 0, 
      review: "", 
      addedAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0
    };
    await setDoc(doc(db, 'users', user.uid, 'myBooks', bookId), info);
    if (status === 'read') {
      await updateDoc(doc(db, 'profiles', user.uid), { 
        readCount: increment(1),
        readBooksList: arrayUnion(bookId)
      });
    }
    setActiveTab('library');
  };

  const toggleLibraryStatus = async (bookId) => {
    if (!user) return;
    const book = myBooks.find(b => b.bookId === bookId);
    if (book) {
      await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { 
        inLibrary: !book.inLibrary 
      });
    }
  };

  // Función para manejar like/dislike
  const handleBookReaction = async (bookId, reaction) => {
    if (!user) return;
    
    const book = myBooks.find(b => b.bookId === bookId);
    if (!book) return;
    
    const wasLiked = userProfile.likes?.includes(bookId);
    const wasDisliked = userProfile.dislikes?.includes(bookId);
    
    // Actualizar reacciones del usuario
    let newLikes = [...(userProfile.likes || [])];
    let newDislikes = [...(userProfile.dislikes || [])];
    
    if (reaction === 'like') {
      if (wasLiked) {
        // Quitar like
        newLikes = newLikes.filter(id => id !== bookId);
      } else {
        // Agregar like
        newLikes.push(bookId);
        // Si tenía dislike, quitarlo
        if (wasDisliked) {
          newDislikes = newDislikes.filter(id => id !== bookId);
        }
      }
    } else if (reaction === 'dislike') {
      if (wasDisliked) {
        // Quitar dislike
        newDislikes = newDislikes.filter(id => id !== bookId);
      } else {
        // Agregar dislike
        newDislikes.push(bookId);
        // Si tenía like, quitarlo
        if (wasLiked) {
          newLikes = newLikes.filter(id => id !== bookId);
        }
      }
    }
    
    // Calcular nuevos contadores
    const newLikeCount = newLikes.length;
    const newDislikeCount = newDislikes.length;
    
    // Actualizar perfil del usuario
    await updateDoc(doc(db, 'profiles', user.uid), {
      likes: newLikes,
      dislikes: newDislikes
    });
    
    // Actualizar libro
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), {
      likes: newLikeCount,
      dislikes: newDislikeCount
    });
  };

  const saveReadingPlan = async () => {
    if (!user || !planningBook) return;
    const pages = parseInt(manualPages);
    const days = parseInt(planDays);
    if (isNaN(pages) || isNaN(days) || pages <= 0 || days <= 0) return;
    
    // Calcular páginas por día
    const pagesPerDay = Math.ceil(pages / days);
    const checkpoints = [];
    
    for (let i = 1; i <= days; i++) {
      const startPage = (i - 1) * pagesPerDay + 1;
      const endPage = Math.min(i * pagesPerDay, pages);
      checkpoints.push({ 
        title: `Día ${i}: Páginas ${startPage}-${endPage}`, 
        completed: false, 
        note: "",
        dayNumber: i,
        pages: `${startPage}-${endPage}`,
        startPage,
        endPage
      });
    }
    
    const bookId = planningBook.id || planningBook.bookId;
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { 
      checkpoints, 
      status: 'reading', 
      totalPages: pages,
      planStartDate: new Date().toISOString(),
      planDays: days,
      pagesPerDay: pagesPerDay,
      planEndDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    });
    
    // Crear notificación del plan
    await addDoc(collection(db, 'notifications'), {
      userId: user.uid,
      type: 'reading_plan_started',
      title: lang === 'es' ? '¡Plan de lectura iniciado!' : 'Reading plan started!',
      message: lang === 'es' 
        ? `Comenzaste a leer "${planningBook.volumeInfo?.title || planningBook.title}". Meta: ${pages} páginas en ${days} días.`
        : `You started reading "${planningBook.volumeInfo?.title || planningBook.title}". Goal: ${pages} pages in ${days} days.`,
      bookId: bookId,
      read: false,
      timestamp: serverTimestamp()
    });
    
    setPlanningBook(null);
    setActiveTab('library');
  };

  const toggleCheckpoint = async (bookId, idx) => {
    if (!user) return;
    const book = myBooks.find(b => b.bookId === bookId);
    const nCP = [...book.checkpoints];
    nCP[idx].completed = !nCP[idx].completed;
    const allDone = nCP.every(c => c.completed);
    
    // Si se completa el último checkpoint, marcar como leído
    if (allDone) {
      await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { 
        checkpoints: nCP, 
        status: 'read',
        finishDate: new Date().toISOString()
      });
      
      victoryAudio.current.play().catch(() => {});
      await updateDoc(doc(db, 'profiles', user.uid), { readCount: increment(1), readBooksList: arrayUnion(bookId) });
      
      // Crear notificación de libro completado
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type: 'book_completed',
        title: lang === 'es' ? '¡Libro completado!' : 'Book completed!',
        message: lang === 'es' 
          ? `Felicidades, completaste "${book.title}".`
          : `Congratulations, you completed "${book.title}".`,
        bookId: bookId,
        read: false,
        timestamp: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { checkpoints: nCP });
    }
  };

  const submitGlobalReview = async () => {
    if (!userRating || !viewingBook || !user) return;
    const bookId = viewingBook.id || viewingBook.bookId;
    await addDoc(collection(db, 'comments'), {
      bookId, 
      userId: user.uid, 
      userName: userProfile.name, 
      userPic: userProfile.profilePic, 
      text: userComment, 
      rating: userRating, 
      timestamp: serverTimestamp()
    });
    setUserComment("");
    setUserRating(0);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        let imageDataUrl = reader.result;
        
        // Opción para convertir a blanco y negro
        if (window.confirm(lang === 'es' ? "¿Quieres convertir la imagen a blanco y negro?" : "Convert image to black and white?")) {
          imageDataUrl = await convertToGrayscale(imageDataUrl);
        }
        
        setUserProfile(p => ({ ...p, profilePic: imageDataUrl }));
        await updateDoc(doc(db, 'profiles', user.uid), { profilePic: imageDataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecommendBook = async (targetId, targetName) => {
    if (!viewingBook || !user) return;
    const bookId = viewingBook.id || viewingBook.bookId;
    
    // Añadir libro a la biblioteca del amigo
    const recData = {
      bookId,
      title: viewingBook.volumeInfo?.title || viewingBook.title,
      authors: viewingBook.volumeInfo?.authors || viewingBook.authors || ['Anónimo'],
      thumbnail: (viewingBook.volumeInfo?.imageLinks?.thumbnail || viewingBook.thumbnail)?.replace('http:', 'https:') || 'https://via.placeholder.com/150',
      status: 'library',
      recommendedBy: userProfile.name,
      senderId: user.uid,
      recommendationMessage: recommendMessage,
      sentAt: new Date().toISOString(),
      inLibrary: true
    };
    
    await setDoc(doc(db, 'users', targetId, 'myBooks', bookId), recData);
    
    // Crear notificación para el amigo
    await addDoc(collection(db, 'notifications'), {
      userId: targetId,
      type: 'book_recommendation',
      title: lang === 'es' ? '¡Te recomendaron un libro!' : 'Book recommendation!',
      message: lang === 'es' 
        ? `${userProfile.name} te recomendó "${recData.title}"${recommendMessage ? ` con el mensaje: "${recommendMessage}"` : ''}`
        : `${userProfile.name} recommended "${recData.title}"${recommendMessage ? ` with message: "${recommendMessage}"` : ''}`,
      bookId: bookId,
      senderId: user.uid,
      senderName: userProfile.name,
      read: false,
      timestamp: serverTimestamp()
    });
    
    setShowRecommendList(false);
    setRecommendMessage("");
    alert(lang === 'es' ? "¡Libro recomendado con éxito!" : "Book recommended successfully!");
  };

  // Publicar en el muro
  const submitWallPost = async () => {
    if (!user || !postContent.trim() || postContent.length > 2500) return;
    
    const postData = {
      userId: user.uid,
      userName: userProfile.name,
      userPic: userProfile.profilePic,
      content: postContent,
      bookId: selectedBookForPost?.id,
      bookTitle: selectedBookForPost?.volumeInfo?.title || selectedBookForPost?.title,
      bookAuthors: selectedBookForPost?.volumeInfo?.authors || selectedBookForPost?.authors,
      bookThumbnail: selectedBookForPost?.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || selectedBookForPost?.thumbnail,
      timestamp: serverTimestamp(),
      likes: 0,
      comments: []
    };
    
    await addDoc(collection(db, 'wallPosts'), postData);
    
    // Limpiar formulario
    setPostContent('');
    setSelectedBookForPost(null);
    setShowPostModal(false);
    setShowBookSelector(false);
    
    alert(lang === 'es' ? "¡Publicación creada!" : "Post created!");
  };

  // Buscar libros para seleccionar en publicación
  const searchBooksForPost = async () => {
    if (!postSearch.trim()) {
      // Mostrar libros del usuario
      setBooksForPost(myBooks.slice(0, 10));
      return;
    }
    
    try {
      let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(postSearch)}&maxResults=10`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;

      const res = await fetchWithRetry(url);
      const data = await res.json();
      
      if (data.items) {
        setBooksForPost(data.items);
      } else {
        setBooksForPost([]);
      }
    } catch (err) {
      console.error("Error buscando libros:", err);
      setBooksForPost([]);
    }
  };

  const toggleFollow = async (targetId) => {
    if (!user || user.uid === targetId) return;
    const isF = userProfile.following?.includes(targetId);
    await updateDoc(doc(db, 'profiles', user.uid), { following: isF ? arrayRemove(targetId) : arrayUnion(targetId) });
    await updateDoc(doc(db, 'profiles', targetId), { followersCount: increment(isF ? -1 : 1) });
  };

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    if (user) {
      await updateDoc(doc(db, 'profiles', user.uid), { theme: newTheme });
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  };

  const filteredMyBooks = myBooks.filter(b => {
    if (filterType === 'favorite') return b.isFavorite;
    if (filterType === 'read') return b.status === 'read';
    if (filterType === 'want') return b.status === 'want';
    if (filterType === 'in_plan') return b.status === 'reading';
    if (filterType === 'in_library') return b.inLibrary;
    if (filterType === 'pending') return b.status === 'want'; // Nueva sección Pendiente
    return true;
  });

  const filteredExternalBooks = selectedUserBooks.filter(b => {
    if (selectedUserFilter === 'favorite') return b.isFavorite;
    if (selectedUserFilter === 'read') return b.status === 'read';
    if (selectedUserFilter === 'want') return b.status === 'want';
    if (selectedUserFilter === 'in_plan') return b.status === 'reading';
    if (selectedUserFilter === 'in_library') return b.inLibrary;
    return true;
  });

  // Función para contar lectores de un libro
  const getReadersCount = (bookId) => {
    return publicData.filter(p => p.readBooksList?.includes(bookId)).length;
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} pb-24 font-sans overflow-x-hidden selection:bg-indigo-200 selection:text-white`}>
      
      {/* HEADER */}
      <header className={`sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-800/90' : theme === 'sunset' ? 'bg-orange-100/90' : 'bg-white/90'} backdrop-blur-md border-b ${themeClasses.border} px-6 py-4 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-2">
          <div className={`${theme === 'dark' ? 'bg-indigo-700' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} p-2 rounded-xl text-white shadow-lg`}>
            <BookOpen size={20} strokeWidth={3} />
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tighter">Sandbook</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Selector de tema */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-700 p-1 rounded-full">
            <button 
              onClick={() => changeTheme('light')}
              className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white shadow' : 'opacity-50'}`}
              title={t.theme_light}
            >
              <Sun size={16} className="text-amber-500" />
            </button>
            <button 
              onClick={() => changeTheme('sunset')}
              className={`p-1.5 rounded-full transition-all ${theme === 'sunset' ? 'bg-white shadow' : 'opacity-50'}`}
              title={t.theme_sunset}
            >
              <Sunset size={16} className="text-orange-500" />
            </button>
            <button 
              onClick={() => changeTheme('dark')}
              className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-gray-800 shadow' : 'opacity-50'}`}
              title={t.theme_dark}
            >
              <Moon size={16} className="text-blue-400" />
            </button>
          </div>
          
          <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} className={`p-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200'} rounded-full transition-colors`}>
            <Languages size={18} />
          </button>
          
          {/* Notificaciones */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200'} rounded-full relative`}
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            
            {/* Dropdown de notificaciones */}
            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-white'} rounded-xl shadow-xl border ${themeClasses.border} max-h-96 overflow-y-auto z-50`}>
                <div className="p-4 border-b border-slate-200 dark:border-gray-700">
                  <h3 className="font-bold text-sm">{lang === 'es' ? 'Notificaciones' : 'Notifications'}</h3>
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-slate-400 dark:text-gray-400">{lang === 'es' ? 'No hay notificaciones' : 'No notifications'}</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-gray-700">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className="p-4 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => markNotificationAsRead(notif.id)}
                      >
                        <p className="font-bold text-sm mb-1">{notif.title}</p>
                        <p className="text-xs text-slate-600 dark:text-gray-300">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 dark:text-gray-400 mt-2">
                          {new Date(notif.timestamp?.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button onClick={() => {setActiveTab('profile'); setSelectedUserProfile(null); setShowWriters(false);}} className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 border-amber-200' : 'bg-slate-100 border-slate-200'} p-1 rounded-full border pr-3`}>
            {userProfile.profilePic ? (
              <img src={userProfile.profilePic} className="w-8 h-8 rounded-full object-cover border-2 border-white" />
            ) : (
              <div className={`w-8 h-8 ${theme === 'dark' ? 'bg-indigo-700' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-500'} rounded-full flex items-center justify-center text-white text-[10px] font-bold`}>
                {userProfile.name?.charAt(0) || 'U'}
              </div>
            )}
            <VerificationCheck count={userProfile.followersCount} />
          </button>
        </div>
      </header>

      {/* MODAL DETALLE DE LIBRO (PORTADA) */}
      {viewingBook && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative h-48 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <img src={viewingBook.volumeInfo?.imageLinks?.thumbnail?.replace('http:','https:') || viewingBook.thumbnail} className="absolute -bottom-12 left-8 w-28 h-40 object-cover rounded-2xl shadow-2xl border-4 border-white" />
              <button onClick={() => {setViewingBook(null); setShowRecommendList(false);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 pt-16 scrollbar-hide">
              <h2 className="font-black text-2xl leading-tight">{viewingBook.volumeInfo?.title || viewingBook.title}</h2>
              <p className="text-sm text-indigo-600 font-bold mb-6">{viewingBook.volumeInfo?.authors?.join(', ') || viewingBook.authors?.join(', ')}</p>
              
              {/* Botones de acción */}
              <div className="flex gap-3 mb-8">
                <button onClick={() => setShowRecommendList(!showRecommendList)} className="flex-1 flex items-center justify-center gap-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest border border-pink-100 dark:border-pink-800 shadow-sm active:scale-95 transition-all">
                  <Heart size={18}/> {t.recommend}
                </button>
                
                {/* Botón de biblioteca */}
                <button 
                  onClick={() => {
                    const isInLibrary = myBooks.find(b => b.bookId === (viewingBook.id || viewingBook.bookId))?.inLibrary;
                    if (isInLibrary) {
                      toggleLibraryStatus(viewingBook.id || viewingBook.bookId);
                    } else {
                      handleAddBook(viewingBook, 'library', false, true);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest border shadow-sm active:scale-95 transition-all ${
                    myBooks.find(b => b.bookId === (viewingBook.id || viewingBook.bookId))?.inLibrary
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 border-green-100 dark:border-green-800'
                      : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800'
                  }`}
                >
                  <Library size={18}/>
                  {myBooks.find(b => b.bookId === (viewingBook.id || viewingBook.bookId))?.inLibrary ? t.in_your_library : t.add_to_library}
                </button>
              </div>

              {/* Lista de amigos para recomendar */}
              {showRecommendList && (
                <div className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-6 rounded-[2rem] border ${theme === 'dark' ? 'border-gray-700' : theme === 'sunset' ? 'border-amber-200' : 'border-slate-200'} mb-8 animate-in slide-in-from-top-4`}>
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400 mb-4">{t.select_friend}</p>
                  
                  {/* Campo de mensaje */}
                  <textarea
                    value={recommendMessage}
                    onChange={(e) => setRecommendMessage(e.target.value)}
                    placeholder={t.message_placeholder}
                    className={`w-full mb-4 p-3 rounded-xl text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                    rows="2"
                  />
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                    {publicData.filter(p => userProfile.following?.includes(p.userId)).length > 0 ? (
                      publicData.filter(p => userProfile.following?.includes(p.userId)).map(p => (
                        <button 
                          key={p.userId} 
                          onClick={() => handleRecommendBook(p.userId, p.name)}
                          className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-2xl border border-slate-100 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all text-left"
                        >
                          <img src={p.profilePic || 'https://via.placeholder.com/30'} className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-xs font-bold text-slate-700 dark:text-gray-200">{p.name}</span>
                        </button>
                      ))
                    ) : <p className="text-center text-xs font-bold text-slate-400 dark:text-gray-400 py-4">{t.no_friends}</p>}
                  </div>
                </div>
              )}

              {/* Botones de Like/Dislike */}
              {myBooks.find(b => b.bookId === (viewingBook.id || viewingBook.bookId))?.status === 'read' && (
                <div className="flex gap-3 mb-6">
                  <button 
                    onClick={() => handleBookReaction(viewingBook.id || viewingBook.bookId, 'like')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${
                      userProfile.likes?.includes(viewingBook.id || viewingBook.bookId)
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                    }`}
                  >
                    <ThumbsUp size={18} />
                    {t.like}
                    <span className="text-xs font-black">
                      {myBooks.find(b => b.bookId === (viewingBook.id || viewingBook.bookId))?.likes || 0}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleBookReaction(viewingBook.id || viewingBook.bookId, 'dislike')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${
                      userProfile.dislikes?.includes(viewingBook.id || viewingBook.bookId)
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
                    }`}
                  >
                    <ThumbsDown size={18} />
                    {t.dislike}
                    <span className="text-xs font-black">
                      {myBooks.find(b => b.bookId === (viewingBook.id || viewingBook.bookId))?.dislikes || 0}
                    </span>
                  </button>
                </div>
              )}

              {/* Estadísticas del libro */}
              <div className={`flex items-center gap-4 ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl mb-6`}>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.global_rating}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black">
                      {(bookComments[viewingBook.id || viewingBook.bookId]?.reduce((a,b)=>a+b.rating,0) / (bookComments[viewingBook.id || viewingBook.bookId]?.length || 1) || 0).toFixed(1)}
                    </span>
                    <StarRating 
                      rating={Math.round(bookComments[viewingBook.id || viewingBook.bookId]?.reduce((a,b)=>a+b.rating,0) / (bookComments[viewingBook.id || viewingBook.bookId]?.length || 1) || 0)} 
                      interactive={false} 
                      size={14} 
                    />
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-gray-700" />
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.readers_count}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-black">{getReadersCount(viewingBook.id || viewingBook.bookId)}</span>
                    <div className="flex -space-x-2">
                      {publicData.filter(p => p.readBooksList?.includes(viewingBook.id || viewingBook.bookId)).slice(0,3).map(p => (
                        <img key={p.userId} src={p.profilePic || 'https://via.placeholder.com/30'} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover shadow-sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Imagen del autor si está disponible */}
              {viewingBook.volumeInfo?.authors && (
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400 mb-2">{t.authors}</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingBook.volumeInfo.authors.map((author, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => {
                          setViewingBook(null);
                          setShowWriters(true);
                          setWriterSearch(author);
                          setTimeout(() => searchAuthors(), 100);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200'} transition-colors`}
                      >
                        <User size={12} />
                        <span className="text-xs font-bold">{author}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripción */}
              <div className="mb-8">
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed italic">
                  {viewingBook.volumeInfo?.description?.replace(/<[^>]*>?/gm, '') || viewingBook.description || (lang === 'es' ? "Sin descripción." : "No description available.")}
                </p>
              </div>

              {/* Reseñas */}
              <div className="space-y-6">
                <h3 className="font-black text-sm uppercase tracking-widest border-b pb-2 border-slate-200 dark:border-gray-700">{t.reviews}</h3>
                <div className={`${theme === 'dark' ? 'bg-indigo-900/30' : theme === 'sunset' ? 'bg-orange-50' : 'bg-indigo-50'} p-6 rounded-[2rem] border ${theme === 'dark' ? 'border-indigo-800' : theme === 'sunset' ? 'border-orange-200' : 'border-indigo-100'} space-y-4`}>
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">{t.my_review}</p>
                  <StarRating rating={userRating} onRate={setUserRating} />
                  <textarea 
                    value={userComment} 
                    onChange={(e) => setUserComment(e.target.value)} 
                    className={`w-full rounded-xl p-3 text-sm outline-none min-h-[80px] ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`} 
                    placeholder="..." 
                  />
                  <button 
                    onClick={submitGlobalReview} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black text-xs uppercase shadow-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <Send size={14}/> {t.save}
                  </button>
                </div>
                <div className="space-y-4 pb-8">
                  {bookComments[viewingBook.id || viewingBook.bookId]?.map(c => (
                    <div key={c.id} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img src={c.userPic || 'https://via.placeholder.com/30'} className="w-6 h-6 rounded-full" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-gray-200">{c.userName}</span>
                        </div>
                        <StarRating rating={c.rating} interactive={false} size={10} />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUBLICAR EN MURO */}
      {showPostModal && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[90vh]`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.post_quote}</h2>
              <button onClick={() => {setShowPostModal(false); setShowBookSelector(false);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Seleccionar libro */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold">{t.select_book} <span className="text-xs text-slate-400">({lang === 'es' ? 'Opcional' : 'Optional'})</span></p>
                  <button 
                    onClick={() => setShowBookSelector(!showBookSelector)}
                    className={`text-xs font-bold px-3 py-1 rounded-full ${showBookSelector ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {showBookSelector ? 'Ocultar' : 'Seleccionar'}
                  </button>
                </div>
                
                {selectedBookForPost && (
                  <div className={`flex items-center gap-3 p-3 rounded-2xl mb-3 ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                    <img src={selectedBookForPost.thumbnail || selectedBookForPost.volumeInfo?.imageLinks?.thumbnail} className="w-12 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="text-sm font-bold line-clamp-1">{selectedBookForPost.title || selectedBookForPost.volumeInfo?.title}</p>
                      <p className="text-xs text-slate-500">{selectedBookForPost.authors?.[0] || selectedBookForPost.volumeInfo?.authors?.[0]}</p>
                    </div>
                    <button onClick={() => setSelectedBookForPost(null)} className="p-2 text-slate-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                {showBookSelector && (
                  <div className={`mb-4 p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        placeholder={lang === 'es' ? "Buscar libro..." : "Search book..."}
                        value={postSearch}
                        onChange={(e) => setPostSearch(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                      />
                      <button 
                        onClick={searchBooksForPost}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
                      >
                        {t.search}
                      </button>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {booksForPost.map((book, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedBookForPost(book);
                            setShowBookSelector(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-left"
                        >
                          <img src={book.thumbnail || book.volumeInfo?.imageLinks?.thumbnail} className="w-10 h-14 object-cover rounded" />
                          <div className="flex-1">
                            <p className="text-xs font-bold line-clamp-1">{book.title || book.volumeInfo?.title}</p>
                            <p className="text-[10px] text-slate-500">{book.authors?.[0] || book.volumeInfo?.authors?.[0]}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Textarea para la publicación */}
              <div className="mb-4">
                <textarea 
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={t.write_quote}
                  className={`w-full rounded-2xl p-4 text-sm outline-none min-h-[200px] ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                  maxLength={2500}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-slate-400">{t.max_characters}</p>
                  <p className={`text-xs font-bold ${postContent.length >= 2500 ? 'text-red-500' : 'text-slate-400'}`}>
                    {postContent.length}/2500
                  </p>
                </div>
              </div>
              
              <button 
                onClick={submitWallPost}
                disabled={!postContent.trim()}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase shadow-md flex items-center justify-center gap-2 transition-all ${
                  !postContent.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Send size={16}/> {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN ELIMINAR */}
      {bookToDelete && (
        <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border ${themeClasses.border}`}>
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="font-black text-xl mb-2 uppercase">{t.delete_q}</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{t.delete_desc}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setBookToDelete(null)} 
                className={`flex-1 py-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200'} font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-slate-500'} uppercase text-[10px] transition-colors`}
              >
                {t.cancel}
              </button>
              <button 
                onClick={async () => { 
                  await deleteDoc(doc(db, 'users', user.uid, 'myBooks', bookToDelete)); 
                  setBookToDelete(null); 
                }} 
                className="flex-1 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase text-[10px] transition-colors"
              >
                {t.delete_btn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANIFICADOR */}
      {planningBook && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 border ${themeClasses.border}`}>
            <h3 className="font-black text-xl mb-6 text-indigo-600 dark:text-indigo-400 flex items-center gap-2 uppercase tracking-tighter">
              <Calendar /> {t.reading_plan}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase ml-1 tracking-widest">{t.manual_p}</label>
                <input 
                  type="number" 
                  value={manualPages} 
                  onChange={(e) => setManualPages(e.target.value)} 
                  className={`w-full ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : theme === 'sunset' ? 'bg-amber-100 border-amber-300 text-gray-800' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500`} 
                  placeholder={lang === 'es' ? "Ej: 300" : "Ex: 300"}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase ml-1 tracking-widest">{t.days}</label>
                <input 
                  type="number" 
                  value={planDays} 
                  onChange={(e) => setPlanDays(e.target.value)} 
                  className={`w-full ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : theme === 'sunset' ? 'bg-amber-100 border-amber-300 text-gray-800' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder={lang === 'es' ? "Ej: 7" : "Ex: 7"}
                />
              </div>
              
              {/* Mostrar cálculo */}
              {manualPages && planDays && parseInt(manualPages) > 0 && parseInt(planDays) > 0 && (
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} border ${theme === 'dark' ? 'border-gray-700' : theme === 'sunset' ? 'border-amber-200' : 'border-slate-200'}`}>
                  <p className="text-sm font-bold mb-2">{lang === 'es' ? 'Plan de lectura:' : 'Reading plan:'}</p>
                  <p className="text-xs">
                    {lang === 'es' 
                      ? `Leerás ${Math.ceil(parseInt(manualPages) / parseInt(planDays))} páginas por día durante ${parseInt(planDays)} días.`
                      : `You'll read ${Math.ceil(parseInt(manualPages) / parseInt(planDays))} pages per day for ${parseInt(planDays)} days.`
                    }
                  </p>
                  <p className="text-xs mt-2">
                    {lang === 'es' 
                      ? `Total: ${parseInt(manualPages)} páginas`
                      : `Total: ${parseInt(manualPages)} pages`
                    }
                  </p>
                </div>
              )}
              
              <button 
                onClick={saveReadingPlan} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg mt-4 tracking-widest active:scale-95 transition-all"
                disabled={!manualPages || !planDays || parseInt(manualPages) <= 0 || parseInt(planDays) <= 0}
              >
                {t.start}
              </button>
              <button 
                onClick={() => setPlanningBook(null)} 
                className="w-full text-slate-400 dark:text-gray-400 font-bold text-[10px] mt-3 uppercase tracking-widest"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESCÁNER */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="w-full max-w-md aspect-square bg-slate-900 rounded-3xl overflow-hidden border-2 border-indigo-500" id="reader"></div>
          <p className="mt-8 font-bold animate-pulse text-xs uppercase tracking-widest">{t.scan_msg}</p>
          <button onClick={() => setShowScanner(false)} className="mt-8 p-4 bg-white/10 rounded-full">
            <X size={24} />
          </button>
        </div>
      )}

      {/* VISTA ESCRITORES */}
      {showWriters && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Header de escritores */}
            <div className={`sticky top-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} z-10 border-b ${themeClasses.border} px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowWriters(false)} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tighter">{t.writers}</h1>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{t.authors}</p>
                </div>
              </div>
              <button 
                onClick={() => setLang(lang === 'es' ? 'en' : 'es')} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <Languages size={18} />
              </button>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-6">
              {/* Buscador de escritores */}
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-50'} p-6 rounded-[2.5rem] border ${themeClasses.border}`}>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={t.search_writers}
                    value={writerSearch}
                    onChange={(e) => setWriterSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchAuthors()}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none font-medium text-sm border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>
                <button 
                  onClick={searchAuthors}
                  disabled={authorSearchLoading}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {authorSearchLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {lang === 'es' ? 'Buscando...' : 'Searching...'}
                    </>
                  ) : (
                    t.search_now
                  )}
                </button>
              </div>

              {/* Detalles del autor seleccionado */}
              {selectedAuthor && (
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-[2.5rem] border ${themeClasses.border} p-6 space-y-6 animate-in slide-in-from-top-4`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black">{selectedAuthor}</h2>
                    <button 
                      onClick={() => setSelectedAuthor(null)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <BookOpen size={16} /> {t.biography}
                    </h3>
                    <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">
                      {authorBooks[0]?.volumeInfo?.description 
                        ? authorBooks[0].volumeInfo.description.replace(/<[^>]*>?/gm, '').substring(0, 500) + '...'
                        : (lang === 'es' 
                            ? 'Biografía no disponible. Este autor ha escrito varios libros disponibles en nuestra plataforma.'
                            : 'Biography not available. This author has written several books available on our platform.'
                          )}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <BookIcon size={16} /> {t.books_written}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {authorBooks.slice(0, 6).map((book, idx) => (
                        <div 
                          key={idx} 
                          className={`flex gap-3 p-3 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700 border ${themeClasses.border} transition-all`}
                          onClick={() => setViewingBook(book)}
                        >
                          <img 
                            src={book.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150'} 
                            className="w-16 h-20 object-cover rounded-lg" 
                          />
                          <div className="flex-1">
                            <h4 className="font-bold text-sm line-clamp-2">{book.volumeInfo?.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                              {book.volumeInfo?.publishedDate?.substring(0, 4) || 'Año desconocido'}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-gray-500 mt-2 line-clamp-2">
                              {book.volumeInfo?.description?.replace(/<[^>]*>?/gm, '').substring(0, 100) || 'Sin descripción'}...
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {authorBooks.length > 6 && (
                      <div className="text-center mt-6">
                        <button 
                          onClick={() => searchMoreBooksByAuthor(selectedAuthor, 1)}
                          disabled={moreBooksLoading}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                          {moreBooksLoading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              {t.loading_more}
                            </>
                          ) : (
                            t.loading_more
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resultados de búsqueda de escritores */}
              {!selectedAuthor && writerResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 dark:text-gray-400">{lang === 'es' ? 'Escritores encontrados:' : 'Writers found:'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {writerResults.map((writer, idx) => (
                      <button
                        key={idx}
                        onClick={() => viewAuthorDetails(writer.name)}
                        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl border ${themeClasses.border} text-left hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg">
                            {writer.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm">{writer.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {writer.booksCount} {lang === 'es' ? 'libros' : 'books'}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* VISTA PERFIL DE OTRO USUARIO */}
        {selectedUserProfile ? (
          <div className="space-y-6 animate-in slide-in-from-right-4 pb-12">
            <button 
              onClick={() => setSelectedUserProfile(null)} 
              className={`flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-100' : 'bg-indigo-50'} p-3 rounded-2xl active:scale-95 transition-all`}
            >
              <ArrowLeft size={18}/> {t.cancel}
            </button>
            
            <div className={`${themeClasses.card} p-8 rounded-[3rem] border ${themeClasses.border} shadow-sm text-center relative overflow-hidden`}>
              <div className="relative w-32 h-32 mx-auto mb-4">
                {selectedUserProfile.profilePic ? (
                  <img src={selectedUserProfile.profilePic} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl" />
                ) : (
                  <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-5xl border-4 border-white dark:border-gray-800 shadow-xl">
                    {selectedUserProfile.name?.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-slate-50 dark:border-gray-700 scale-125">
                  <VerificationCheck count={selectedUserProfile.followersCount} size={24} />
                </div>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{selectedUserProfile.name}</h2>
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-8 tracking-[0.2em]">
                {getLevelTitle(selectedUserProfile.readCount, lang)}
              </p>
              <div className={`flex justify-center gap-8 text-[9px] font-black text-slate-400 dark:text-gray-400 uppercase ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-6 rounded-[2.5rem] border ${theme === 'dark' ? 'border-gray-700' : theme === 'sunset' ? 'border-amber-200' : 'border-slate-100'}`}>
                <div className="text-center">
                  <span className="text-indigo-600 dark:text-indigo-400 text-xl block mb-1">{selectedUserProfile.readCount}</span>
                  {t.read}
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-gray-700"></div>
                <div className="text-center">
                  <span className="text-purple-600 dark:text-purple-400 text-xl block mb-1">{selectedUserProfile.followersCount}</span>
                  {t.followers}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest px-2">
                {t.user_books} {selectedUserProfile.name}
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'read', 'in_plan', 'want', 'favorite', 'in_library'].map(type => (
                  <button 
                    key={type} 
                    onClick={() => setSelectedUserFilter(type)} 
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all whitespace-nowrap ${
                      selectedUserFilter === type 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : `${theme === 'dark' ? 'bg-gray-800 text-gray-300' : theme === 'sunset' ? 'bg-amber-50 text-amber-800' : 'bg-white text-slate-400'}`
                    }`}
                  >
                    {t[type]}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {filteredExternalBooks.map((book, i) => (
                  <div key={i} className={`${themeClasses.card} p-4 rounded-[2.5rem] border ${themeClasses.border} shadow-sm animate-in fade-in flex gap-4`}>
                    <img 
                      src={book.thumbnail} 
                      onClick={() => setViewingBook(book)} 
                      className="w-14 h-20 object-cover rounded-xl shadow-sm cursor-pointer" 
                    />
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-bold text-sm line-clamp-1">{book.title}</h4>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-gray-400 uppercase">{book.authors?.[0] || 'Autor desconocido'}</p>
                      <div className="mt-3">
                        <StarRating rating={book.rating || 0} interactive={false} size={12}/>
                      </div>
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
                {/* Tarjeta de nivel */}
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-indigo-800 to-purple-900' : theme === 'sunset' ? 'bg-gradient-to-br from-orange-500 to-pink-500' : 'bg-gradient-to-br from-indigo-600 to-purple-700'} p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden`}>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.level}</p>
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">{getLevelTitle(userProfile.readCount, lang)}</h2>
                      <div className="flex items-center gap-4 mt-4">
                        <div>
                          <p className="text-[10px] font-bold opacity-80 tracking-widest">{t.currently_reading}</p>
                          <p className="text-lg font-black">{currentlyReadingCount}</p>
                        </div>
                        <div className="w-px h-8 bg-white/30"></div>
                        <div>
                          <p className="text-[10px] font-bold opacity-80 tracking-widest">{t.books_this_month}</p>
                          <p className="text-lg font-black">{booksThisMonth}</p>
                        </div>
                        <div className="w-px h-8 bg-white/30"></div>
                        <div>
                          <p className="text-[10px] font-bold opacity-80 tracking-widest">{t.read}</p>
                          <p className="text-lg font-black">{userProfile.readCount}</p>
                        </div>
                      </div>
                    </div>
                    <Sparkles className="opacity-30" size={32} />
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min((userProfile.readCount/100)*100, 100)}%` }} />
                  </div>
                </div>

                {/* Botón para publicar en el muro */}
                <button 
                  onClick={() => setShowPostModal(true)}
                  className={`w-full ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'sunset' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-white hover:bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border} shadow-sm flex items-center gap-3 transition-all`}
                >
                  <div className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-indigo-900' : theme === 'sunset' ? 'bg-orange-100' : 'bg-indigo-100'} flex items-center justify-center`}>
                    <MessageSquarePlus size={20} className={theme === 'dark' ? 'text-indigo-300' : theme === 'sunset' ? 'text-orange-600' : 'text-indigo-600'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">{t.post_quote}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{t.wall}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>

                {/* Filtros */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['all', 'read', 'in_plan', 'want', 'pending', 'favorite', 'in_library'].map(type => (
                    <button 
                      key={type} 
                      onClick={() => setFilterType(type)} 
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all whitespace-nowrap ${
                        filterType === type 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : `${theme === 'dark' ? 'bg-gray-800 text-gray-300 border-gray-700' : theme === 'sunset' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-white text-slate-400 border-slate-200'}`
                      }`}
                    >
                      {type === 'favorite' ? '⭐' : t[type]}
                    </button>
                  ))}
                </div>

                {/* Lista de libros */}
                <div className="space-y-4">
                  {filteredMyBooks.length === 0 ? (
                    <div className={`text-center py-20 ${themeClasses.card} rounded-[2.5rem] border border-dashed ${themeClasses.border}`}>
                      <BookIcon className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                      <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>
                        {lang === 'es' ? 'Sin libros en esta sección' : 'No books in this section'}
                      </p>
                    </div>
                  ) : filteredMyBooks.map((book, i) => {
                    const isExp = expandedBooks.has(book.bookId);
                    const doneCount = book.checkpoints?.filter(c => c.completed).length || 0;
                    const totalCount = book.checkpoints?.length || 1;
                    const perc = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                    
                    return (
                      <div key={i} className={`${themeClasses.card} p-4 rounded-[2.5rem] border ${themeClasses.border} shadow-sm animate-in fade-in overflow-hidden`}>
                        <div className="flex gap-4">
                          <img 
                            src={book.thumbnail} 
                            onClick={() => setViewingBook(book)} 
                            className="w-16 h-24 object-cover rounded-2xl shadow-sm cursor-pointer active:scale-95 transition-all" 
                          />
                          <div className="flex-1 flex flex-col justify-center">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-sm line-clamp-1">{book.title}</h4>
                              <button 
                                onClick={() => setBookToDelete(book.bookId)} 
                                className="p-1 text-slate-200 hover:text-red-400"
                              >
                                <X size={16}/>
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              <div className="flex-1 h-1 bg-slate-50 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-700" style={{width: `${perc}%`}} />
                              </div>
                              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{perc}%</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 justify-center">
                            {/* Botón de favorito */}
                            <button 
                              onClick={async () => await updateDoc(doc(db, 'users', user.uid, 'myBooks', book.bookId), { isFavorite: !book.isFavorite })} 
                              className="p-1"
                            >
                              <Star size={18} className={book.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-300 dark:text-gray-600"} />
                            </button>
                            
                            {/* Botón de biblioteca */}
                            <button 
                              onClick={() => toggleLibraryStatus(book.bookId)} 
                              className="p-1"
                            >
                              <Library size={18} className={book.inLibrary ? "text-green-500 fill-green-100" : "text-slate-300 dark:text-gray-600"} />
                            </button>
                            
                            {/* Botón de planear - visible en todas las secciones excepto "En plan" */}
                            {book.status !== 'reading' && (
                              <button 
                                onClick={() => { setPlanningBook(book); setManualPages(book.totalPages || ""); }} 
                                className="p-1"
                                title={t.plan}
                              >
                                <Calendar size={18} className="text-blue-500" />
                              </button>
                            )}
                            
                            {/* Botón de expandir */}
                            <button 
                              onClick={() => { 
                                const n = new Set(expandedBooks); 
                                if(n.has(book.bookId)) n.delete(book.bookId); 
                                else n.add(book.bookId); 
                                setExpandedBooks(n); 
                              }} 
                              className="p-2 bg-slate-50 dark:bg-gray-700 rounded-xl text-slate-400 dark:text-gray-400"
                            >
                              {isExp ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
                            </button>
                          </div>
                        </div>
                        
                        {/* Checkpoints expandidos */}
                        {isExp && book.checkpoints?.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-gray-700 mt-4 animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold text-slate-400 dark:text-gray-400">
                                {book.planDays} {t.days} • {book.totalPages} {t.pages}
                              </p>
                              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                {doneCount}/{totalCount} {lang === 'es' ? 'días completados' : 'days completed'}
                              </p>
                            </div>
                            
                            {book.checkpoints.map((cp, idx) => (
                              <div key={idx} className="space-y-2">
                                <button 
                                  onClick={() => toggleCheckpoint(book.bookId, idx)} 
                                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                    cp.completed 
                                      ? 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800 text-green-700 dark:text-green-300' 
                                      : `${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : theme === 'sunset' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-bold">{cp.title}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500">
                                      {cp.pages} {t.pages.toLowerCase()}
                                    </span>
                                  </div>
                                  {cp.completed && <CheckCircle size={14}/>}
                                </button>
                                <div className="flex items-start gap-2 px-2">
                                  <StickyNote size={12} className="text-slate-300 dark:text-gray-600 mt-1" />
                                  <input 
                                    className="flex-1 bg-transparent border-none text-[10px] outline-none text-slate-400 dark:text-gray-400 placeholder:opacity-30" 
                                    placeholder={t.daily_notes} 
                                    value={cp.note || ""}
                                    onChange={async (e) => {
                                      const nCP = [...book.checkpoints]; 
                                      nCP[idx].note = e.target.value;
                                      await updateDoc(doc(db, 'users', user.uid, 'myBooks', book.bookId), { checkpoints: nCP });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BUSCADOR LIBROS */}
            {activeTab === 'search' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Barra de búsqueda */}
                <div className={`${themeClasses.card} p-6 rounded-[2.5rem] border ${themeClasses.border} shadow-sm space-y-4`}>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {[{id:'all',l:t.global_f},{id:'intitle',l:t.title_f},{id:'inauthor',l:t.author_f},{id:'isbn',l:t.isbn_f}].map(m => (
                      <button 
                        key={m.id} 
                        onClick={() => setSearchType(m.id)} 
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                          searchType === m.id 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                            : `${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : theme === 'sunset' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`
                        }`}
                      >
                        {m.l}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder={t.search_p} 
                        className={`w-full pl-12 pr-4 py-4 rounded-[1.5rem] outline-none font-medium text-sm border ${
                          theme === 'dark' 
                            ? 'bg-gray-800 border-gray-700 text-gray-100' 
                            : theme === 'sunset' 
                            ? 'bg-amber-100 border-amber-300 text-amber-900' 
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && performSearch()} 
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    </div>
                    <button 
                      onClick={startScanner} 
                      className={`${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-indigo-300' 
                          : theme === 'sunset' 
                          ? 'bg-orange-100 text-orange-600' 
                          : 'bg-indigo-100 text-indigo-600'
                      } p-4 rounded-[1.25rem] active:scale-95 transition-all shadow-inner`}
                    >
                      <Barcode size={24} />
                    </button>
                  </div>
                  <button 
                    onClick={() => performSearch()} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all tracking-widest"
                  >
                    {t.search_now}
                  </button>
                </div>

                {/* Resultados de búsqueda */}
                <div className="space-y-4">
                  {searchResults.map((book) => {
                    const alreadyHave = myBooks.find(b => b.bookId === book.id);
                    const readersCount = getReadersCount(book.id);
                    
                    return (
                      <div key={book.id} className={`${themeClasses.card} p-5 rounded-[2.5rem] border ${themeClasses.border} shadow-sm animate-in zoom-in-95`}>
                        <div className="flex gap-5">
                          <img 
                            src={book.volumeInfo?.imageLinks?.thumbnail?.replace('http:','https:') || 'https://via.placeholder.com/150'} 
                            onClick={() => setViewingBook(book)} 
                            className="w-24 h-36 object-cover rounded-2xl shadow-md cursor-pointer hover:scale-105 transition-all" 
                          />
                          <div className="flex-1 flex flex-col">
                            <h3 className="font-bold text-sm leading-tight line-clamp-2">{book.volumeInfo.title}</h3>
                            <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold mb-2">
                              {book.volumeInfo.authors?.join(', ')}
                            </p>
                            
                            {/* Contador de lectores */}
                            {readersCount > 0 && (
                              <div className="flex items-center gap-1 mb-3">
                                <Users size={12} className="text-slate-400" />
                                <span className="text-[10px] text-slate-500 dark:text-gray-400">
                                  {readersCount} {lang === 'es' ? 'personas leyeron' : 'people read'}
                                </span>
                              </div>
                            )}
                            
                            <div className="mt-auto space-y-2">
                              {/* Toggle de leído */}
                              <div className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 p-2 rounded-2xl border border-slate-100 dark:border-gray-700">
                                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-gray-400 ml-2">{t.read}?</span>
                                <div 
                                  onClick={() => handleAddBook(book, alreadyHave?.status === 'read' ? 'want' : 'read')} 
                                  className={`relative w-20 h-8 rounded-full cursor-pointer transition-all p-1 ${
                                    alreadyHave?.status === 'read' 
                                      ? 'bg-green-500 dark:bg-green-700' 
                                      : 'bg-slate-200 dark:bg-gray-700'
                                  }`}
                                >
                                  <div className={`absolute top-1 bottom-1 w-6 bg-white dark:bg-gray-300 rounded-full shadow transition-all ${
                                    alreadyHave?.status === 'read' ? 'translate-x-12' : 'translate-x-0'
                                  }`} />
                                </div>
                              </div>
                              
                              {/* Botones de acción */}
                              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                                <button 
                                  onClick={() => { setPlanningBook(book); setManualPages(book.volumeInfo.pageCount || ""); }} 
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-[8px] font-black uppercase shadow-sm whitespace-nowrap px-3"
                                >
                                  {t.plan}
                                </button>
                                
                                {/* Botón de biblioteca */}
                                <button 
                                  onClick={() => {
                                    const isInLibrary = alreadyHave?.inLibrary;
                                    if (isInLibrary) {
                                      toggleLibraryStatus(book.id);
                                    } else {
                                      handleAddBook(book, 'library', false, true);
                                    }
                                  }}
                                  className={`p-2 rounded-xl active:scale-95 ${
                                    alreadyHave?.inLibrary
                                      ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300'
                                      : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                                  }`}
                                >
                                  <Library size={14}/>
                                </button>
                                
                                <button 
                                  onClick={() => handleAddBook(book, 'want', true)} 
                                  className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 rounded-xl active:scale-95"
                                >
                                  <Star size={16}/>
                                </button>
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
                {/* Botón para ver escritores */}
                <button 
                  onClick={() => setShowWriters(true)}
                  className={`w-full ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'sunset' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-white hover:bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border} shadow-sm flex items-center gap-3 transition-all`}
                >
                  <div className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-purple-900' : theme === 'sunset' ? 'bg-pink-100' : 'bg-purple-100'} flex items-center justify-center`}>
                    <PenTool size={20} className={theme === 'dark' ? 'text-purple-300' : theme === 'sunset' ? 'text-pink-600' : 'text-purple-600'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">{t.writers}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{t.authors}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>

                {/* Muro de publicaciones */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{t.wall}</h3>
                    <button 
                      onClick={() => setShowPostModal(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      <Plus size={14} /> {t.post_quote}
                    </button>
                  </div>
                  
                  {wallPosts.length === 0 ? (
                    <div className={`text-center py-12 ${themeClasses.card} rounded-[2.5rem] border border-dashed ${themeClasses.border}`}>
                      <MessageSquare className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                      <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>
                        {t.no_posts}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {wallPosts.map((post) => (
                        <div key={post.id} className={`${themeClasses.card} p-6 rounded-[2.5rem] border ${themeClasses.border} shadow-sm`}>
                          <div className="flex items-start gap-3 mb-4">
                            <img 
                              src={post.userPic || 'https://via.placeholder.com/40'} 
                              className="w-10 h-10 rounded-full object-cover" 
                            />
                            <div className="flex-1">
                              <h4 className="font-bold text-sm">{post.userName}</h4>
                              <p className="text-xs text-slate-500 dark:text-gray-400">
                                {new Date(post.timestamp?.seconds * 1000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-slate-700 dark:text-gray-300 mb-4 leading-relaxed">
                            {post.content}
                          </p>
                          
                          {post.bookTitle && (
                            <div 
                              className={`p-3 rounded-2xl mb-4 cursor-pointer ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-slate-50 hover:bg-slate-100'} transition-colors`}
                              onClick={() => {
                                // Buscar el libro para ver detalles
                                const bookToView = myBooks.find(b => b.bookId === post.bookId) || 
                                                  searchResults.find(b => b.id === post.bookId);
                                if (bookToView) setViewingBook(bookToView);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {post.bookThumbnail && (
                                  <img src={post.bookThumbnail} className="w-12 h-16 object-cover rounded-lg" />
                                )}
                                <div>
                                  <p className="text-xs font-bold">{post.bookTitle}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-gray-400">
                                    {post.bookAuthors?.join(', ')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-gray-700">
                            <button className="flex items-center gap-1 text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300">
                              <Heart size={16} />
                              <span className="text-xs">{post.likes || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300">
                              <MessageSquare size={16} />
                              <span className="text-xs">{post.comments?.length || 0}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PERFIL PROPIO */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in pb-12">
                {/* Información del perfil */}
                <div className={`${themeClasses.card} p-8 rounded-[3rem] border ${themeClasses.border} shadow-sm text-center relative overflow-hidden`}>
                  {/* Botón de editar */}
                  <button 
                    onClick={() => setIsEditingProfile(true)} 
                    className={`absolute top-8 right-8 p-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-slate-50 hover:bg-slate-100'} rounded-full text-slate-400 hover:text-indigo-600 shadow-sm transition-all active:rotate-12`}
                  >
                    <Edit3 size={18} />
                  </button>
                  
                  {/* Foto de perfil */}
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {userProfile.profilePic ? (
                      <img src={userProfile.profilePic} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl" />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-5xl border-4 border-white dark:border-gray-800 shadow-xl">
                        {userProfile.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-slate-50 dark:border-gray-700 scale-125">
                      <VerificationCheck count={userProfile.followersCount} size={24} />
                    </div>
                  </div>
                  
                  {/* Nombre y nivel */}
                  <h2 className="text-2xl font-black tracking-tight">{userProfile.name}</h2>
                  {userProfile.email && (
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{userProfile.email}</p>
                  )}
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-8 tracking-[0.2em]">
                    {getLevelTitle(userProfile.readCount, lang)}
                  </p>
                  
                  {/* Estadísticas mejoradas */}
                  <div className={`grid grid-cols-2 gap-4 text-[9px] font-black text-slate-400 dark:text-gray-400 uppercase ${
                    theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'
                  } p-6 rounded-[2.5rem] border ${
                    theme === 'dark' ? 'border-gray-700' : theme === 'sunset' ? 'border-amber-200' : 'border-slate-100'
                  } shadow-inner`}>
                    <div className="text-center">
                      <span className="text-indigo-600 dark:text-indigo-400 text-xl block leading-none mb-1">{userProfile.readCount}</span>
                      {t.read}
                    </div>
                    <div className="text-center">
                      <span className="text-purple-600 dark:text-purple-400 text-xl block leading-none mb-1">{userProfile.followersCount}</span>
                      {t.followers}
                    </div>
                    <div className="text-center">
                      <span className="text-green-600 dark:text-green-400 text-xl block leading-none mb-1">{currentlyReadingCount}</span>
                      {t.currently_reading}
                    </div>
                    <div className="text-center">
                      <span className="text-amber-600 dark:text-amber-400 text-xl block leading-none mb-1">{booksThisMonth}</span>
                      {t.books_this_month}
                    </div>
                  </div>
                  
                  {/* Botones de login/logout */}
                  <div className="mt-6 flex gap-3">
                    {user?.isAnonymous ? (
                      <>
                        <button 
                          onClick={handleGoogleLogin} 
                          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3 rounded-2xl font-bold text-xs uppercase shadow-sm transition-colors"
                        >
                          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
                          {t.google_login}
                        </button>
                        {/* Comentado según solicitud */}
                        {/*
                        <button 
                          onClick={handleFacebookLogin} 
                          className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white py-3 rounded-2xl font-bold text-xs uppercase shadow-sm transition-colors"
                        >
                          <Facebook size={16} />
                          {t.facebook_login}
                        </button>
                        */}
                      </>
                    ) : (
                      <button 
                        onClick={handleLogout} 
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-bold text-xs uppercase shadow-sm transition-colors"
                      >
                        <LogOut size={16} />
                        {t.logout}
                      </button>
                    )}
                  </div>
                </div>

                {/* Modal de edición de perfil */}
                {isEditingProfile && (
                  <div className={`${themeClasses.card} p-6 rounded-[3rem] border-2 border-indigo-500 shadow-2xl space-y-4 animate-in slide-in-from-top-4`}>
                    <h3 className="font-black text-sm uppercase flex items-center gap-2 mb-2">
                      <Settings size={18}/> {lang === 'es' ? 'Editar Perfil' : 'Edit Profile'}
                    </h3>
                    <input 
                      type="text" 
                      value={userProfile.name} 
                      onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} 
                      className={`w-full border rounded-2xl p-4 outline-none font-bold text-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : theme === 'sunset' 
                          ? 'bg-amber-100 border-amber-300 text-amber-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`} 
                      placeholder={lang === 'es' ? "Nombre..." : "Name..."} 
                    />
                    <label className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-6 cursor-pointer transition-all ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-600 text-gray-400 hover:border-indigo-500' 
                        : theme === 'sunset' 
                        ? 'bg-amber-50 border-amber-300 text-amber-500 hover:border-orange-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-300'
                    }`}>
                      <Upload size={18} /> 
                      <span className="text-xs font-black uppercase">{lang === 'es' ? 'Cambiar Foto' : 'Change Photo'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <button 
                      onClick={async () => { 
                        await updateDoc(doc(db, 'profiles', user.uid), { 
                          name: userProfile.name, 
                          profilePic: userProfile.profilePic 
                        }); 
                        setIsEditingProfile(false); 
                      }} 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all"
                    >
                      {t.save}
                    </button>
                    <button 
                      onClick={() => setIsEditingProfile(false)} 
                      className="w-full text-slate-400 dark:text-gray-400 font-bold text-[10px] mt-2 uppercase tracking-widest"
                    >
                      {t.cancel}
                    </button>
                  </div>
                )}

                {/* Insignias */}
                <div className={`${themeClasses.card} p-8 rounded-[3rem] border ${themeClasses.border} shadow-sm space-y-6`}>
                  <h3 className="text-xs font-black uppercase flex items-center gap-2 tracking-widest">
                    <Award size={18} className="text-amber-500" /> {t.badges_title}
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const id = (i + 1).toString();
                      const unlocked = userProfile.badges?.includes(id);
                      return (
                        <div key={id} className="flex flex-col items-center gap-1 group relative">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 transform ${
                            unlocked 
                              ? `${theme === 'dark' ? 'bg-indigo-900/30' : theme === 'sunset' ? 'bg-orange-50' : 'bg-indigo-50'} shadow-md scale-100 border ${
                                  theme === 'dark' ? 'border-indigo-800' : theme === 'sunset' ? 'border-orange-200' : 'border-indigo-100'
                                }` 
                              : `${theme === 'dark' ? 'bg-gray-800 opacity-30' : theme === 'sunset' ? 'bg-amber-50 opacity-20' : 'bg-slate-50 opacity-20'} scale-90`
                          }`}>
                            {unlocked ? (
                              <img 
                                src={`/${id}.png`} 
                                className="w-full h-full object-contain p-1 animate-in zoom-in" 
                                onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/5971/5971593.png"} } 
                              />
                            ) : (
                              <Lock size={20} className={theme === 'dark' ? "text-gray-600" : "text-slate-200"} />
                            )}
                          </div>
                          <span className={`text-[7px] font-black text-center uppercase leading-tight ${
                            unlocked 
                              ? 'text-indigo-600 dark:text-indigo-400' 
                              : 'text-slate-300 dark:text-gray-600'
                          }`}>
                            {unlocked ? BADGE_DEFS[id].name : "???"}
                          </span>
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

      {/* NAV BAR INFERIOR */}
      <nav className={`fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t ${themeClasses.border} px-8 py-4 flex justify-between items-center z-40 shadow-2xl ${
        theme === 'dark' 
          ? 'bg-gray-800/95' 
          : theme === 'sunset' 
          ? 'bg-orange-50/95' 
          : 'bg-white/95'
      }`}>
        {[{id:'library',icon:Layout,l:t.library},{id:'search',icon:Search,l:t.plan},{id:'social',icon:Globe,l:t.social},{id:'profile',icon:User,l:t.profile}].map(t_nav => (
          <button 
            key={t_nav.id} 
            onClick={() => {setActiveTab(t_nav.id); setSelectedUserProfile(null); setShowWriters(false);}} 
            className={`flex flex-col items-center gap-1.5 transition-all ${
              activeTab === t_nav.id 
                ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
                : 'text-slate-400 dark:text-gray-500 opacity-60'
            }`}
          >
            <t_nav.icon size={22} strokeWidth={activeTab === t_nav.id ? 2.5 : 2} />
            <span className="text-[7px] font-black uppercase tracking-widest">{t_nav.l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
