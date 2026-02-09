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
  limit,
  writeBatch
} from 'firebase/firestore';
import { 
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { 
  BookOpen, Search, Trophy, Plus, CheckCircle, Layout, User, Award, Loader2, PenTool, Globe, Camera, MessageSquare, Send, X, ChevronDown, ChevronUp, ChevronRight, Settings, Edit3, ListChecks, Lock, Flag, Sparkles, Star, Upload, Book as BookIcon, AlertCircle, Calendar, FileText, Info, Maximize2, Minimize2, UserPlus, UserCheck, Users, Trash2, Facebook, Languages, Share2, UserX, MessageCircle, StickyNote, Barcode, Library, Heart, ArrowLeft, Moon, Sun, Sunset, LogIn, LogOut, MessageSquarePlus, Eye, EyeOff, Bell, ThumbsUp, ThumbsDown, Bookmark, Quote, PenLine, TrendingUp, Clock, Flame, Target, Hash, Mic, Filter, MapPin, UserMinus, Shield, Mail, Phone, Home, HelpCircle, Download
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
const GOOGLE_LENS_API_KEY = import.meta.env.VITE_GOOGLE_LENS_API_KEY || "";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const facebookProvider = new FacebookAuthProvider();
const googleProvider = new GoogleAuthProvider();

// --- TRADUCCIONES ---
const i18n = {
  es: {
    library: "Biblioteca", plan: "Planear", social: "Red", profile: "Yo",
    search_p: "Busca libros, autores o ISBN...", pages: "Páginas", days: "Días",
    start: "Comenzar", cancel: "Cancelar", delete_q: "¿Eliminar libro?",
    delete_desc: "Esta acción no se puede deshacer.", delete_btn: "Eliminar",
    invite: "INVITAR", read: "Leídos", pending: "Pendiente", favorites: "⭐ Favoritos",
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
    books_by_author: "Libros del autor", loading_more: "Cargando más...",
    search: "Buscar",
    friends: "Amigos", following: "Siguiendo", followers_list: "Seguidores",
    find_friends: "Encontrar amigos", friend_requests: "Solicitudes",
    remove_friend: "Eliminar amigo", add_friend: "Agregar amigo",
    all_users: "Todos los usuarios", google_users: "Usuarios de Google",
    anonymous_users: "Usuarios anónimos", filter_users: "Filtrar usuarios",
    accept: "Aceptar", reject: "Rechazar", pending_requests: "Solicitudes pendientes",
    no_friends_yet: "Aún no tienes amigos", find_people: "Encontrar personas",
    send_request: "Enviar solicitud", request_sent: "Solicitud enviada",
    unfollow: "Dejar de seguir", block_user: "Bloquear usuario",
    unblock_user: "Desbloquear usuario", blocked_users: "Usuarios bloqueados",
    start_date: "Fecha de inicio", google_lens_search: "Buscar con Google Lens",
    take_photo: "Tomar foto", upload_image: "Subir imagen",
    search_with_google: "Buscar con Google", author_photo: "Foto del autor",
    author_age: "Edad", birth_date: "Fecha de nacimiento", 
    nationality: "Nacionalidad", literary_genre: "Género literario",
    famous_works: "Obras famosas", awards: "Premios", 
    search_by_image: "Buscar por imagen", no_image_found: "Imagen no encontrada",
    try_google_lens: "Intentar con Google Lens", select_start_date: "Selecciona fecha de inicio",
    today: "Hoy", tomorrow: "Mañana", next_week: "Próxima semana",
    custom_date: "Fecha personalizada",
    liked: "Me gustan", current_page: "Página actual", page_number: "Número de página",
    tutorial_next: "Siguiente", tutorial_skip: "Omitir tutorial", tutorial_welcome: "¡Bienvenido a Sandbook!",
    tutorial_step1: "Biblioteca: Aquí verás todos tus libros organizados",
    tutorial_step2: "Planificar: Crea planes de lectura con metas diarias",
    tutorial_step3: "Red Social: Conecta con otros lectores y autores",
    tutorial_step4: "Tu Perfil: Gana insignias y sigue tu progreso",
    // Nuevas traducciones
    favorite_writers: "Escritores ⭐",
    saved_posts: "Frases Guardadas",
    messages: "Mensajes",
    send_message: "Enviar mensaje",
    new_message: "Nuevo mensaje",
    to: "Para",
    message: "Mensaje",
    conversation: "Conversación",
    type_message: "Escribe un mensaje...",
    no_messages: "No hay mensajes",
    mark_as_favorite_writer: "Marcar como escritor favorito",
    remove_favorite_writer: "Quitar de escritores favoritos",
    save_post: "Guardar publicación",
    remove_saved_post: "Quitar de guardados",
    saved: "Guardado",
    writers_section: "Escritores Favoritos",
    saved_section: "Frases Guardadas",
    view_read_books: "Ver libros leídos",
    // Traducciones adicionales
    help_community: "Ayuda a la comunidad",
    upload_cover: "Subir portada",
    take_photo_cover: "Tomar foto de portada",
    no_cover_available: "Portada no disponible",
    welcome_video: "Bienvenido a Sandbook",
    skip_video: "Saltar video",
    register_with_google: "Registrarse con Google",
    continue_without_account: "Continuar sin cuenta",
    require_google_login: "Para usar todas las funciones, regístrate con Google",
    install_app: "Instalar App",
    share_image: "Compartir imagen",
    upload_book_cover: "Subir portada del libro",
    search_in_my_books: "Buscar en mis libros..."
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
    books_by_author: "Author's books", loading_more: "Loading more...",
    search: "Search",
    friends: "Friends", following: "Following", followers_list: "Followers",
    find_friends: "Find friends", friend_requests: "Friend requests",
    remove_friend: "Remove friend", add_friend: "Add friend",
    all_users: "All users", google_users: "Google users",
    anonymous_users: "Anonymous users", filter_users: "Filter users",
    accept: "Accept", reject: "Reject", pending_requests: "Pending requests",
    no_friends_yet: "No friends yet", find_people: "Find people",
    send_request: "Send request", request_sent: "Request sent",
    unfollow: "Unfollow", block_user: "Block user",
    unblock_user: "Unblock user", blocked_users: "Blocked users",
    start_date: "Start date", google_lens_search: "Search with Google Lens",
    take_photo: "Take photo", upload_image: "Upload image",
    search_with_google: "Search with Google", author_photo: "Author photo",
    author_age: "Age", birth_date: "Birth date", 
    nationality: "Nationality", literary_genre: "Literary genre",
    famous_works: "Famous works", awards: "Awards", 
    search_by_image: "Search by image", no_image_found: "Image not found",
    try_google_lens: "Try with Google Lens", select_start_date: "Select start date",
    today: "Today", tomorrow: "Tomorrow", next_week: "Next week",
    custom_date: "Custom date",
    liked: "Liked", current_page: "Current page", page_number: "Page number",
    tutorial_next: "Next", tutorial_skip: "Skip tutorial", tutorial_welcome: "Welcome to Sandbook!",
    tutorial_step1: "Library: Here you'll see all your organized books",
    tutorial_step2: "Plan: Create reading plans with daily goals",
    tutorial_step3: "Social: Connect with other readers and authors",
    tutorial_step4: "Your Profile: Earn badges and track your progress",
    // New translations
    favorite_writers: "Writers ⭐",
    saved_posts: "Saved Quotes",
    messages: "Messages",
    send_message: "Send message",
    new_message: "New message",
    to: "To",
    message: "Message",
    conversation: "Conversation",
    type_message: "Type a message...",
    no_messages: "No messages",
    mark_as_favorite_writer: "Mark as favorite writer",
    remove_favorite_writer: "Remove from favorite writers",
    save_post: "Save post",
    remove_saved_post: "Remove from saved",
    saved: "Saved",
    writers_section: "Favorite Writers",
    saved_section: "Saved Quotes",
    view_read_books: "View read books",
    // Additional translations
    help_community: "Help the community",
    upload_cover: "Upload cover",
    take_photo_cover: "Take cover photo",
    no_cover_available: "Cover not available",
    welcome_video: "Welcome to Sandbook",
    skip_video: "Skip video",
    register_with_google: "Register with Google",
    continue_without_account: "Continue without account",
    require_google_login: "To use all features, register with Google",
    install_app: "Install App",
    share_image: "Share image",
    upload_book_cover: "Upload book cover",
    search_in_my_books: "Search in my books..."
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
  if (count >= 2100) return lang === 'es' ? "Leyenda" : "Legend";
  if (count >= 1000) return lang === 'es' ? "Legendario" : "Legendary";
  if (count >= 500) return lang === 'es' ? "Doctorado" : "Doctorate";
  if (count >= 100) return lang === 'es' ? "Licenciado" : "Graduate";
  if (count >= 50) return lang === 'es' ? "Profesional" : "Professional";
  if (count >= 25) return lang === 'es' ? "Maestro" : "Master";
  if (count >= 10) return lang === 'es' ? "Amateur" : "Amateur";
  if (count >= 1) return lang === 'es' ? "Novato" : "Novice";
  return lang === 'es' ? "Principiante" : "Beginner";
};

// Función para obtener el símbolo del nivel
const getLevelSymbol = (count = 0) => {
  if (count >= 2100) return "/btc.png"; // Bitcoin
  if (count >= 1000) return "/diamante.png"; // Diamante
  if (count >= 500) return "/oro.png"; // Oro
  if (count >= 100) return "/plata.png"; // Plata
  if (count >= 50) return "/cobre.png"; // Cobre
  if (count >= 25) return "/vidrio.png"; // Vidrio
  if (count >= 10) return "/madera.png"; // Madera
  if (count >= 1) return "/piedra.png"; // Piedra
  return "/papel.png"; // Papel
};

const VerificationCheck = ({ count = 0, size = 14 }) => {
  if (count >= 2100) return <img src="/btc.png" className="w-5 h-5 object-contain" />;
  if (count >= 1000) return <img src="/diamante.png" className="w-5 h-5 object-contain" />;
  if (count >= 500) return <img src="/oro.png" className="w-5 h-5 object-contain" />;
  if (count >= 100) return <img src="/plata.png" className="w-5 h-5 object-contain" />;
  if (count >= 50) return <img src="/cobre.png" className="w-5 h-5 object-contain" />;
  if (count >= 25) return <img src="/vidrio.png" className="w-5 h-5 object-contain" />;
  if (count >= 10) return <img src="/madera.png" className="w-5 h-5 object-contain" />;
  if (count >= 1) return <img src="/piedra.png" className="w-5 h-5 object-contain" />;
  return <img src="/papel.png" className="w-5 h-5 object-contain" />;
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
    theme: 'dark', // Cambiado a 'dark' por defecto
    likes: [], // Array de bookIds que le dieron like
    dislikes: [], // Array de bookIds que le dieron dislike
    friendRequests: [], // Solicitudes de amistad recibidas
    sentRequests: [], // Solicitudes de amistad enviadas
    isGoogleUser: false, // Si el usuario inició sesión con Google
    isAnonymous: true, // Si el usuario es anónimo
    favoriteWriters: [], // Array de nombres de escritores favoritos
    savedPosts: [] // Array de IDs de publicaciones guardadas
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
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [showStartDateOptions, setShowStartDateOptions] = useState(false);
  
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

  // Estado para modo de vista - Cambiado a 'dark' por defecto
  const [theme, setTheme] = useState('dark');

  // Nuevos estados para funcionalidades solicitadas
  const [showWriters, setShowWriters] = useState(false);
  const [writerSearch, setWriterSearch] = useState('');
  const [writerResults, setWriterResults] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [authorBooks, setAuthorBooks] = useState([]);
  const [authorDetails, setAuthorDetails] = useState(null);
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

  // Nuevos estados para gestión de amigos
  const [showFriendsSection, setShowFriendsSection] = useState(false);
  const [friendsSearch, setFriendsSearch] = useState('');
  const [friendsFilter, setFriendsFilter] = useState('all'); // 'all', 'following', 'followers', 'google', 'anonymous'
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentFriendRequests, setSentFriendRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [followersList, setFollowersList] = useState([]);

  // Estado para interacciones con publicaciones del muro
  const [wallPostComments, setWallPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  // Estado para Google Lens/search por imagen (removido según solicitud)
  const [showGoogleLens, setShowGoogleLens] = useState(false);

  // Nuevo estado para número de página actual en plan de lectura
  const [currentPageInputs, setCurrentPageInputs] = useState({});

  // Nuevo estado para tutorial
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Estado para el progreso de insignias
  const [badgeProgress, setBadgeProgress] = useState({});

  // Nuevos estados para funcionalidades adicionales
  const [showMessages, setShowMessages] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState(null);
  const [messageSearch, setMessageSearch] = useState('');

  // Estado para ver libros leídos de otros usuarios
  const [viewingReadBooks, setViewingReadBooks] = useState(false);
  const [readBooksList, setReadBooksList] = useState([]);

  // Estado para sección de escritores favoritos
  const [showFavoriteWriters, setShowFavoriteWriters] = useState(false);
  const [favoriteWritersList, setFavoriteWritersList] = useState([]);

  // Estado para sección de publicaciones guardadas
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [savedPostsList, setSavedPostsList] = useState([]);

  // Estado para dar like a libros de otros usuarios
  const [globalLikes, setGlobalLikes] = useState({}); // { bookId: { likes: [], dislikes: [] } }

  // Estado para PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Estado para video de bienvenida
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(true);

  // Estado para modal de portada de libro
  const [showCoverUploadModal, setShowCoverUploadModal] = useState(false);
  const [bookForCoverUpload, setBookForCoverUpload] = useState(null);

  // Estado para requerir login con Google
  const [requireGoogleLogin, setRequireGoogleLogin] = useState(false);

  // Estado para las portadas subidas por la comunidad
  const [communityCovers, setCommunityCovers] = useState({});

  // Nuevo estado para buscar en mis libros
  const [librarySearch, setLibrarySearch] = useState('');

  const victoryAudio = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"));
  const videoRef = useRef(null);

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

  // Función para calcular el progreso de insignias
  const calculateBadgeProgress = () => {
    if (!userProfile) return {};
    
    const progress = {};
    const readCount = userProfile.readCount || 0;
    const scanCount = userProfile.scanCount || 0;
    
    // Reglas para cada insignia
    progress[1] = Math.min(readCount >= 1 ? 100 : 0, 100); // Velocista
    progress[2] = Math.min(readCount >= 1 ? 100 : 0, 100); // Titán
    progress[3] = Math.min(readCount >= 1 ? 100 : 0, 100); // Inicio
    progress[4] = Math.min(readCount >= 1 ? 100 : 0, 100); // Rayo
    progress[5] = Math.min(readCount >= 1 ? 100 : 0, 100); // Semana
    progress[6] = Math.min(readCount >= 1 ? 100 : 0, 100); // Mes
    progress[7] = Math.min((readCount / 10) * 100, 100); // Diez
    progress[8] = Math.min(readCount >= 1 ? 100 : 0, 100); // Perfecto
    progress[9] = Math.min((readCount / 20) * 100, 100); // Veinte
    progress[10] = Math.min((readCount / 30) * 100, 100); // Treinta
    progress[11] = Math.min((readCount / 50) * 100, 100); // Cincuenta
    progress[12] = Math.min((readCount / 100) * 100, 100); // Cien
    progress[13] = Math.min((readCount / 50) * 100, 100); // Oro Anual
    progress[14] = Math.min((scanCount / 10) * 100, 100); // Scan 10
    progress[15] = Math.min((scanCount / 20) * 100, 100); // Scan 20
    progress[16] = Math.min((scanCount / 30) * 100, 100); // Scan 30
    progress[17] = Math.min((scanCount / 40) * 100, 100); // Scan 40
    progress[18] = Math.min((scanCount / 50) * 100, 100); // Scan 50
    progress[19] = Math.min((scanCount / 100) * 100, 100); // Scan 100
    progress[20] = Math.min((userProfile.badges?.length || 0) / 19 * 100, 100); // Maestro
    
    return progress;
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

  // Función para obtener detalles del autor (Wikipedia API)
  const fetchAuthorDetails = async (authorName) => {
    try {
      // Primero intentamos con Wikipedia API
      const wikiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(authorName)}`;
      const wikiRes = await fetch(wikiUrl);
      
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        
        // Extraer información relevante
        const details = {
          name: authorName,
          biography: wikiData.extract || '',
          thumbnail: wikiData.thumbnail?.source || '',
          description: wikiData.description || '',
          extract: wikiData.extract || ''
        };
        
        // Intentar extraer fecha de nacimiento si está disponible
        if (wikiData.extract) {
          const birthMatch = wikiData.extract.match(/(\d{1,2} de [a-zA-Z]+ de \d{4})|(\d{4})/);
          if (birthMatch) {
            details.birthDate = birthMatch[0];
            // Calcular edad aproximada si tenemos año
            const yearMatch = birthMatch[0].match(/\d{4}/);
            if (yearMatch) {
              const birthYear = parseInt(yearMatch[0]);
              const currentYear = new Date().getFullYear();
              details.age = currentYear - birthYear;
            }
          }
        }
        
        setAuthorDetails(details);
      } else {
        // Si Wikipedia falla, crear detalles básicos
        setAuthorDetails({
          name: authorName,
          biography: `${authorName} es un autor reconocido cuyas obras han sido ampliamente leídas.`,
          thumbnail: '',
          description: 'Autor',
          birthDate: 'Información no disponible',
          age: 'Desconocida',
          nationality: 'Información no disponible',
          literaryGenre: 'Varios géneros',
          famousWorks: authorBooks.slice(0, 3).map(b => b.volumeInfo?.title).filter(Boolean),
          awards: ['Autor reconocido']
        });
      }
    } catch (err) {
      console.error("Error obteniendo detalles del autor:", err);
      // Crear detalles básicos como fallback
      setAuthorDetails({
        name: authorName,
        biography: `${authorName} es un autor reconocido cuyas obras han sido ampliamente leídas. Esta información está siendo actualizada.`,
        thumbnail: '',
        description: 'Autor',
        birthDate: 'Información no disponible',
        age: 'Desconocida',
        nationality: 'Información no disponible',
        literaryGenre: 'Varios géneros',
        famousWorks: authorBooks.slice(0, 3).map(b => b.volumeInfo?.title).filter(Boolean),
        awards: ['Autor reconocido']
      });
    }
  };

  // Función para buscar en Google directamente
  const searchWithGoogle = (bookTitle) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(bookTitle)}+book`;
    window.open(searchUrl, '_blank');
  };

  // Función para actualizar página actual en plan de lectura
  const updateCurrentPage = async (bookId, currentPage) => {
    if (!user || !currentPage || isNaN(currentPage)) return;
    
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { 
      currentPage: parseInt(currentPage)
    });
    
    // Actualizar el estado local
    setCurrentPageInputs(prev => ({ ...prev, [bookId]: '' }));
  };

  // Cargar mensajes y conversaciones
  const loadConversations = () => {
    if (!user) return;
    
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc'),
      limit(20)
    );
    
    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConversations(convos);
    }, (error) => {
      console.error("Error cargando conversaciones:", error);
      // Crear índice manualmente si es necesario
      if (error.code === 'failed-precondition') {
        console.log("Por favor crea el índice en Firebase Console");
      }
    });
    
    return unsubscribe;
  };

  // Cargar likes globales de libros
  const loadGlobalLikes = () => {
    const likesQuery = query(collection(db, 'globalLikes'));
    
    const unsubscribe = onSnapshot(likesQuery, (snapshot) => {
      const likesMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        likesMap[data.bookId] = {
          likes: data.likes || [],
          dislikes: data.dislikes || []
        };
      });
      setGlobalLikes(likesMap);
    });
    
    return unsubscribe;
  };

  // Cargar escritores favoritos
  const loadFavoriteWriters = () => {
    if (!user) return;
    
    const favoritesQuery = query(
      collection(db, 'favoriteWriters'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(favoritesQuery, (snapshot) => {
      const writers = snapshot.docs.map(doc => doc.data().authorName);
      setFavoriteWritersList(writers);
      
      // Actualizar perfil local
      setUserProfile(prev => ({ ...prev, favoriteWriters: writers }));
    });
    
    return unsubscribe;
  };

  // Cargar publicaciones guardadas - CORREGIDA SIN ÍNDICE
  const loadSavedPosts = () => {
    if (!user) return;
    
    const savedQuery = query(
      collection(db, 'savedPosts'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(savedQuery, (snapshot) => {
      const savedPostIds = snapshot.docs.map(doc => doc.data().postId);
      setSavedPostsList(savedPostIds);
      
      // Actualizar perfil local
      setUserProfile(prev => ({ ...prev, savedPosts: savedPostIds }));
    }, (error) => {
      console.error("Error cargando posts guardados:", error);
      // Cargar sin el orden para evitar el error de índice
      const simpleQuery = query(
        collection(db, 'savedPosts'),
        where('userId', '==', user.uid)
      );
      
      const simpleUnsub = onSnapshot(simpleQuery, (snapshot) => {
        const savedPostIds = snapshot.docs.map(doc => doc.data().postId);
        setSavedPostsList(savedPostIds);
        setUserProfile(prev => ({ ...prev, savedPosts: savedPostIds }));
      });
      
      return simpleUnsub;
    });
    
    return unsubscribe;
  };

  // Función para cargar mensajes de una conversación
  const loadMessages = (conversationId) => {
    if (!user || !conversationId) return;
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Aquí almacenaríamos los mensajes en el estado correspondiente
      // Por ahora solo para demostración
      console.log('Mensajes cargados:', messages);
    }, (error) => {
      console.error("Error cargando mensajes:", error);
    });
    
    return unsubscribe;
  };

  // Cargar portadas de la comunidad
  const loadCommunityCovers = () => {
    const coversQuery = query(collection(db, 'bookCovers'));
    
    const unsubscribe = onSnapshot(coversQuery, (snapshot) => {
      const coversMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        coversMap[data.bookId] = data;
      });
      setCommunityCovers(coversMap);
    });
    
    return unsubscribe;
  };

  // Función para manejar la instalación PWA
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuario aceptó la instalación');
      setShowInstallPrompt(false);
    } else {
      console.log('Usuario rechazó la instalación');
    }
    
    setDeferredPrompt(null);
  };

  // Función para subir portada de libro a Firebase Storage
  const handleBookCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user || !bookForCoverUpload) return;
    
    try {
      // Subir a Firebase Storage
      const bookId = bookForCoverUpload.id || bookForCoverUpload.bookId;
      const fileName = `${bookId}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `bookCovers/${fileName}`);
      
      // Subir el archivo
      await uploadBytes(storageRef, file);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      
      // Actualizar en la base de datos para compartir con toda la comunidad
      await setDoc(doc(db, 'bookCovers', bookId), {
        bookId,
        title: bookForCoverUpload.volumeInfo?.title || bookForCoverUpload.title,
        authors: bookForCoverUpload.volumeInfo?.authors || bookForCoverUpload.authors || ['Anónimo'],
        thumbnail: downloadURL,
        uploadedBy: user.uid,
        uploadedByName: userProfile.name,
        uploadedAt: serverTimestamp(),
        upvotes: 1,
        upvotedBy: [user.uid]
      }, { merge: true });
      
      // También actualizar en el libro del usuario si lo tiene
      const userBookRef = doc(db, 'users', user.uid, 'myBooks', bookId);
      const userBookSnap = await getDoc(userBookRef);
      if (userBookSnap.exists()) {
        await updateDoc(userBookRef, {
          thumbnail: downloadURL,
          coverUploadedBy: user.uid,
          coverUploadedAt: new Date().toISOString()
        });
      }
      
      alert(lang === 'es' ? '¡Portada subida con éxito! Ayudas a la comunidad.' : 'Cover uploaded successfully! You help the community.');
      setShowCoverUploadModal(false);
      setBookForCoverUpload(null);
    } catch (error) {
      console.error('Error subiendo portada:', error);
      alert(lang === 'es' ? 'Error subiendo portada' : 'Error uploading cover');
    }
  };

  // Función para tomar foto de portada
  const takePhotoForCover = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(lang === 'es' ? 'Tu dispositivo no soporta la cámara' : 'Your device does not support camera');
      return;
    }
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        // Crear un modal para tomar foto
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
        const videoContainer = document.createElement('div');
        videoContainer.style.width = '100%';
        videoContainer.style.maxWidth = '500px';
        videoContainer.style.height = '70vh';
        videoContainer.style.overflow = 'hidden';
        videoContainer.style.borderRadius = '20px';
        
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '20px';
        
        const captureButton = document.createElement('button');
        captureButton.textContent = lang === 'es' ? 'Tomar Foto' : 'Take Photo';
        captureButton.style.padding = '15px 30px';
        captureButton.style.backgroundColor = '#4F46E5';
        captureButton.style.color = 'white';
        captureButton.style.border = 'none';
        captureButton.style.borderRadius = '10px';
        captureButton.style.fontWeight = 'bold';
        captureButton.style.cursor = 'pointer';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = lang === 'es' ? 'Cancelar' : 'Cancel';
        cancelButton.style.padding = '15px 30px';
        cancelButton.style.backgroundColor = '#6B7280';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '10px';
        cancelButton.style.fontWeight = 'bold';
        cancelButton.style.cursor = 'pointer';
        
        captureButton.onclick = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          
          // Convertir a blob
          canvas.toBlob(async (blob) => {
            // Detener stream
            stream.getTracks().forEach(track => track.stop());
            
            // Subir la foto a Firebase Storage
            try {
              const bookId = bookForCoverUpload.id || bookForCoverUpload.bookId;
              const fileName = `${bookId}_${Date.now()}_photo.jpg`;
              const storageRef = ref(storage, `bookCovers/${fileName}`);
              
              await uploadBytes(storageRef, blob);
              const downloadURL = await getDownloadURL(storageRef);
              
              // Actualizar en la base de datos
              await setDoc(doc(db, 'bookCovers', bookId), {
                bookId,
                title: bookForCoverUpload.volumeInfo?.title || bookForCoverUpload.title,
                authors: bookForCoverUpload.volumeInfo?.authors || bookForCoverUpload.authors || ['Anónimo'],
                thumbnail: downloadURL,
                uploadedBy: user.uid,
                uploadedByName: userProfile.name,
                uploadedAt: serverTimestamp(),
                upvotes: 1,
                upvotedBy: [user.uid]
              }, { merge: true });
              
              // Actualizar en el libro del usuario si lo tiene
              const userBookRef = doc(db, 'users', user.uid, 'myBooks', bookId);
              const userBookSnap = await getDoc(userBookRef);
              if (userBookSnap.exists()) {
                await updateDoc(userBookRef, {
                  thumbnail: downloadURL,
                  coverUploadedBy: user.uid,
                  coverUploadedAt: new Date().toISOString()
                });
              }
              
              alert(lang === 'es' ? '¡Foto subida con éxito!' : 'Photo uploaded successfully!');
            } catch (error) {
              console.error('Error subiendo foto:', error);
              alert(lang === 'es' ? 'Error subiendo foto' : 'Error uploading photo');
            }
            
            document.body.removeChild(modal);
            setShowCoverUploadModal(false);
            setBookForCoverUpload(null);
          }, 'image/jpeg', 0.9);
        };
        
        cancelButton.onclick = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        };
        
        buttonContainer.appendChild(captureButton);
        buttonContainer.appendChild(cancelButton);
        
        videoContainer.appendChild(video);
        modal.appendChild(videoContainer);
        modal.appendChild(buttonContainer);
        document.body.appendChild(modal);
      })
      .catch(error => {
        console.error('Error accediendo a la cámara:', error);
        alert(lang === 'es' ? 'Error accediendo a la cámara' : 'Error accessing camera');
      });
  };

  // Obtener la mejor portada disponible para un libro
  const getBestCoverForBook = (bookId) => {
    // 1. Primero verificar si hay portada de la comunidad
    const communityCover = communityCovers[bookId];
    if (communityCover?.thumbnail) {
      return {
        url: communityCover.thumbnail,
        source: 'community',
        uploader: communityCover.uploadedByName
      };
    }
    
    // 2. Buscar en los libros del usuario actual
    const userBook = myBooks.find(b => b.bookId === bookId);
    if (userBook?.thumbnail && userBook.thumbnail.startsWith('https://')) {
      return {
        url: userBook.thumbnail,
        source: 'user'
      };
    }
    
    // 3. Buscar en los resultados de búsqueda
    const searchBook = searchResults.find(b => b.id === bookId);
    if (searchBook?.volumeInfo?.imageLinks?.thumbnail) {
      return {
        url: searchBook.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:'),
        source: 'google'
      };
    }
    
    // 4. Portada por defecto
    return {
      url: 'https://via.placeholder.com/150x200?text=NO+COVER',
      source: 'default'
    };
  };

  // Función para crear notificación
  const createNotification = async (targetUserId, type, title, message, extraData = {}) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        type,
        title,
        message,
        ...extraData,
        read: false,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creando notificación:", error);
    }
  };

  // Función para enviar solicitud de amistad con notificación
  const sendFriendRequestWithNotification = async (targetId, targetName) => {
    if (!user || user.uid === targetId) return;
    
    // Verificar si ya hay una solicitud pendiente
    const existingRequest = sentFriendRequests.find(req => req.receiverId === targetId);
    if (existingRequest) {
      alert(lang === 'es' ? 'Ya enviaste una solicitud a este usuario' : 'You already sent a request to this user');
      return;
    }
    
    // Crear solicitud de amistad
    const requestData = {
      senderId: user.uid,
      senderName: userProfile.name,
      senderPic: userProfile.profilePic,
      receiverId: targetId,
      receiverName: targetName,
      status: 'pending',
      timestamp: serverTimestamp()
    };
    
    await addDoc(collection(db, 'friendRequests'), requestData);
    
    // Crear notificación para el usuario
    await createNotification(
      targetId,
      'friend_request',
      lang === 'es' ? 'Nueva solicitud de amistad' : 'New friend request',
      lang === 'es' 
        ? `${userProfile.name} te envió una solicitud de amistad`
        : `${userProfile.name} sent you a friend request`,
      {
        senderId: user.uid,
        senderName: userProfile.name
      }
    );
    
    alert(lang === 'es' ? 'Solicitud de amistad enviada' : 'Friend request sent');
  };

  // Función para aceptar solicitud de amistad con notificación
  const acceptFriendRequestWithNotification = async (requestId, senderId, senderName) => {
    if (!user) return;
    
    // Actualizar estado de la solicitud
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
    
    // Agregar como seguidores mutuos
    await updateDoc(doc(db, 'profiles', user.uid), { 
      following: arrayUnion(senderId)
    });
    
    await updateDoc(doc(db, 'profiles', senderId), { 
      followersCount: increment(1),
      following: arrayUnion(user.uid)
    });
    
    // Crear notificación para el remitente
    await createNotification(
      senderId,
      'friend_request_accepted',
      lang === 'es' ? 'Solicitud de amistad aceptada' : 'Friend request accepted',
      lang === 'es' 
        ? `${userProfile.name} aceptó tu solicitud de amistad`
        : `${userProfile.name} accepted your friend request`
    );
    
    alert(lang === 'es' ? 'Solicitud de amistad aceptada' : 'Friend request accepted');
  };

  // Función para enviar mensaje con notificación
  const sendMessageWithNotification = async (receiverId, receiverName, messageText) => {
    if (!user || !receiverId || !messageText.trim()) return;
    
    // Buscar si ya existe una conversación entre estos usuarios
    const existingConversation = conversations.find(conv => 
      conv.participants.includes(user.uid) && conv.participants.includes(receiverId)
    );
    
    const conversationId = existingConversation?.id || doc(collection(db, 'conversations')).id;
    
    // Crear o actualizar conversación
    await setDoc(doc(db, 'conversations', conversationId), {
      participants: [user.uid, receiverId],
      participantNames: [userProfile.name, receiverName],
      lastMessage: messageText,
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: user.uid,
      lastMessageSenderName: userProfile.name,
      unreadCount: {
        [receiverId]: (existingConversation?.unreadCount?.[receiverId] || 0) + 1
      }
    }, { merge: true });
    
    // Crear mensaje
    const messageData = {
      conversationId,
      senderId: user.uid,
      senderName: userProfile.name,
      senderPic: userProfile.profilePic,
      receiverId,
      receiverName,
      text: messageText,
      timestamp: serverTimestamp(),
      read: false
    };
    
    await addDoc(collection(db, 'messages'), messageData);
    
    // Crear notificación para el receptor
    await createNotification(
      receiverId,
      'message',
      lang === 'es' ? 'Nuevo mensaje' : 'New message',
      lang === 'es' 
        ? `${userProfile.name}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`
        : `${userProfile.name}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
      {
        senderId: user.uid,
        senderName: userProfile.name,
        conversationId
      }
    );
    
    setNewMessage('');
    setShowNewMessageModal(false);
    setSelectedUserForMessage(null);
    
    // Si no hay conversación seleccionada, seleccionar esta
    if (!selectedConversation || selectedConversation.id !== conversationId) {
      const convData = {
        id: conversationId,
        participants: [user.uid, receiverId],
        participantNames: [userProfile.name, receiverName],
        lastMessage: messageText,
        lastMessageAt: new Date().toISOString()
      };
      setSelectedConversation(convData);
      setShowMessages(true);
      loadMessages(conversationId);
    }
  };

  // Función para crear publicación en el muro con notificaciones a seguidores
  const submitWallPostWithNotifications = async () => {
    if (!user || !postContent.trim() || postContent.length > 2500) return;
    
    try {
      const postData = {
        userId: user.uid,
        userName: userProfile.name,
        userPic: userProfile.profilePic,
        content: postContent,
        bookId: selectedBookForPost?.id || selectedBookForPost?.bookId,
        bookTitle: selectedBookForPost?.volumeInfo?.title || selectedBookForPost?.title,
        bookAuthors: selectedBookForPost?.volumeInfo?.authors || selectedBookForPost?.authors,
        bookThumbnail: selectedBookForPost?.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || selectedBookForPost?.thumbnail,
        timestamp: serverTimestamp(),
        likes: 0,
        likesBy: [], // Array de userIds que dieron like
        comments: []
      };
      
      const postRef = await addDoc(collection(db, 'wallPosts'), postData);
      
      // Notificar a los seguidores
      if (userProfile.following?.length > 0) {
        const batch = writeBatch(db);
        userProfile.following.forEach(followerId => {
          const notificationRef = doc(collection(db, 'notifications'));
          batch.set(notificationRef, {
            userId: followerId,
            type: 'new_post',
            title: lang === 'es' ? 'Nueva publicación' : 'New post',
            message: lang === 'es' 
              ? `${userProfile.name} publicó una nueva frase`
              : `${userProfile.name} posted a new quote`,
            postId: postRef.id,
            senderId: user.uid,
            senderName: userProfile.name,
            read: false,
            timestamp: serverTimestamp()
          });
        });
        
        try {
          await batch.commit();
        } catch (error) {
          console.error("Error notificando seguidores:", error);
        }
      }
      
      // Limpiar formulario
      setPostContent('');
      setSelectedBookForPost(null);
      setShowPostModal(false);
      setShowBookSelector(false);
      setBooksForPost([]);
      setPostSearch('');
      
      alert(lang === 'es' ? "¡Publicación creada!" : "Post created!");
    } catch (error) {
      console.error("Error al publicar:", error);
      alert(lang === 'es' ? "Error al publicar. Intenta nuevamente." : "Error posting. Please try again.");
    }
  };

  useEffect(() => {
    // PWA Installation Handler
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });
    
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      console.log('PWA instalada');
    });
    
    // Verificar si ya se mostró el video de bienvenida
    const welcomeVideoShown = localStorage.getItem('sandbook_welcome_video_shown');
    if (welcomeVideoShown) {
      setShowWelcomeVideo(false);
    }
    
    // Verificar si ya se mostró el tutorial
    const tutorialShown = localStorage.getItem('sandbook_tutorial_shown');
    if (!tutorialShown) {
      setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
    }
    
    // Cargar script QR
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode";
    script.async = true;
    document.body.appendChild(script);
    
    // Cargar portadas de la comunidad
    loadCommunityCovers();
    
    return () => { 
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        
        // Si el usuario es anónimo, mostrar modal para registro con Google
        if (u.isAnonymous) {
          setRequireGoogleLogin(true);
        } else {
          setRequireGoogleLogin(false);
        }
        
        // Cargar perfil del usuario
        const profileDoc = await getDoc(doc(db, 'profiles', u.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setUserProfile(prev => ({ 
            ...prev, 
            ...data,
            isGoogleUser: !u.isAnonymous && u.providerData.some(p => p.providerId === 'google.com'),
            isAnonymous: u.isAnonymous
          }));
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
            theme: 'dark', // Por defecto modo oscuro
            likes: [],
            dislikes: [],
            friendRequests: [],
            sentRequests: [],
            isGoogleUser: !u.isAnonymous && u.providerData.some(p => p.providerId === 'google.com'),
            isAnonymous: u.isAnonymous,
            favoriteWriters: [],
            savedPosts: []
          };
          await setDoc(doc(db, 'profiles', u.uid), newProfile);
          setUserProfile(newProfile);
        }
        
        // Cargar notificaciones
        loadNotifications(u.uid);
        // Cargar posts del muro
        loadWallPosts();
        // Cargar lista de amigos
        loadFriendsData(u.uid);
        // Cargar conversaciones
        loadConversations();
        // Cargar likes globales
        loadGlobalLikes();
        // Cargar escritores favoritos
        loadFavoriteWriters();
        // Cargar publicaciones guardadas
        loadSavedPosts();
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

  // Cargar datos de amigos
  const loadFriendsData = (userId) => {
    if (!userId) return;
    
    // Cargar solicitudes de amistad
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', userId),
      where('status', '==', 'pending')
    );
    
    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriendRequests(requests);
    });
    
    // Cargar solicitudes enviadas
    const sentRequestsQuery = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', userId),
      where('status', '==', 'pending')
    );
    
    const unsubSentRequests = onSnapshot(sentRequestsQuery, (snapshot) => {
      const sentRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSentFriendRequests(sentRequests);
    });
    
    return () => {
      unsubRequests && unsubRequests();
      unsubSentRequests && unsubSentRequests();
    };
  };

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

  // Cargar posts del muro - CORREGIDA SIN ÍNDICE
  const loadWallPosts = () => {
    if (!user) return;
    
    // Query simplificada para evitar error de índice
    const postsQuery = query(
      collection(db, 'wallPosts')
    );
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar localmente por timestamp descendente
      posts.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setWallPosts(posts.slice(0, 50)); // Limitar a 50 posts
    }, (error) => {
      console.error("Error cargando posts del muro:", error);
    });
    
    return unsubscribe;
  };

  // Cargar comentarios de publicaciones del muro
  const loadWallPostComments = () => {
    if (!user) return;
    
    const commentsQuery = query(
      collection(db, 'wallPostComments')
    );
    
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const commentsMap = {};
      comments.forEach(comment => {
        if (!commentsMap[comment.postId]) commentsMap[comment.postId] = [];
        commentsMap[comment.postId].push(comment);
      });
      setWallPostComments(commentsMap);
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

  // Filtrar y organizar datos de amigos
  useEffect(() => {
    if (!publicData.length || !userProfile.following) return;
    
    // Obtener lista de amigos (usuarios que sigues y te siguen)
    const friends = publicData.filter(p => 
      userProfile.following?.includes(p.userId) && 
      p.following?.includes(user?.uid)
    );
    
    // Obtener lista de seguidores (usuarios que te siguen pero no sigues)
    const followers = publicData.filter(p => 
      p.following?.includes(user?.uid) && 
      !userProfile.following?.includes(p.userId)
    );
    
    setFriendsList(friends);
    setFollowersList(followers);
  }, [publicData, userProfile.following, user?.uid]);

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
        setUserProfile(prev => ({ 
          ...prev, 
          ...data,
          isGoogleUser: !user.isAnonymous && user.providerData.some(p => p.providerId === 'google.com'),
          isAnonymous: user.isAnonymous
        }));
        if (data.theme && data.theme !== theme) {
          setTheme(data.theme);
        }
        // Calcular progreso de insignias
        setBadgeProgress(calculateBadgeProgress());
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
    // Cargar amigos
    const unsubFriends = loadFriendsData(user.uid);
    // Cargar comentarios de posts del muro
    const unsubWallComments = loadWallPostComments();
    // Cargar conversaciones
    const unsubConversations = loadConversations();
    // Cargar likes globales
    const unsubGlobalLikes = loadGlobalLikes();
    // Cargar escritores favoritos
    const unsubFavoriteWriters = loadFavoriteWriters();
    // Cargar publicaciones guardadas
    const unsubSavedPosts = loadSavedPosts();
    
    return () => { 
      unsubBooks(); 
      unsubProfile(); 
      unsubPublic(); 
      unsubComments(); 
      if (unsubPosts) unsubPosts();
      if (unsubFriends) unsubFriends();
      if (unsubWallComments) unsubWallComments();
      if (unsubConversations) unsubConversations();
      if (unsubGlobalLikes) unsubGlobalLikes();
      if (unsubFavoriteWriters) unsubFavoriteWriters();
      if (unsubSavedPosts) unsubSavedPosts();
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
      setRequireGoogleLogin(false);
    } catch (e) { 
      console.error("Error en login Google:", e);
      alert(lang === 'es' ? "Error al iniciar sesión con Google" : "Error signing in with Google");
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Volver a autenticación anónima
      await signInAnonymously(auth);
      setRequireGoogleLogin(true);
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
    setAuthorDetails(null);
    
    try {
      let url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(authorName)}"&maxResults=10`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;

      const res = await fetchWithRetry(url);
      const data = await res.json();
      
      if (data.items) {
        setAuthorBooks(data.items);
        // Obtener detalles del autor
        await fetchAuthorDetails(authorName);
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
    
    // Obtener la mejor portada disponible
    const bestCover = getBestCoverForBook(bookId);
    
    const info = {
      bookId,
      title: book.volumeInfo?.title || book.title,
      authors: book.volumeInfo?.authors || book.authors || ['Anónimo'],
      thumbnail: bestCover.url,
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

  // Función para manejar like/dislike de libros (GLOBAL)
  const handleGlobalBookReaction = async (bookId, reaction) => {
    if (!user) return;
    
    const wasLiked = globalLikes[bookId]?.likes?.includes(user.uid);
    const wasDisliked = globalLikes[bookId]?.dislikes?.includes(user.uid);
    
    // Obtener referencias actuales
    const currentLikes = globalLikes[bookId]?.likes || [];
    const currentDislikes = globalLikes[bookId]?.dislikes || [];
    
    let newLikes = [...currentLikes];
    let newDislikes = [...currentDislikes];
    
    if (reaction === 'like') {
      if (wasLiked) {
        // Quitar like
        newLikes = newLikes.filter(id => id !== user.uid);
      } else {
        // Agregar like
        newLikes.push(user.uid);
        // Si tenía dislike, quitarlo
        if (wasDisliked) {
          newDislikes = newDislikes.filter(id => id !== user.uid);
        }
      }
    } else if (reaction === 'dislike') {
      if (wasDisliked) {
        // Quitar dislike
        newDislikes = newDislikes.filter(id => id !== user.uid);
      } else {
        // Agregar dislike
        newDislikes.push(user.uid);
        // Si tenía like, quitarlo
        if (wasLiked) {
          newLikes = newLikes.filter(id => id !== user.uid);
        }
      }
    }
    
    // Actualizar en la base de datos
    const likeDocRef = doc(db, 'globalLikes', bookId);
    await setDoc(likeDocRef, {
      bookId,
      likes: newLikes,
      dislikes: newDislikes,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const saveReadingPlan = async () => {
    if (!user || !planningBook) return;
    const pages = parseInt(manualPages);
    const days = parseInt(planDays);
    if (isNaN(pages) || isNaN(days) || pages <= 0 || days <= 0) return;
    
    // Calcular páginas por día
    const pagesPerDay = Math.ceil(pages / days);
    const checkpoints = [];
    
    // Calcular fecha de inicio
    const startDate = new Date(planStartDate);
    
    for (let i = 1; i <= days; i++) {
      const startPage = (i - 1) * pagesPerDay + 1;
      const endPage = Math.min(i * pagesPerDay, pages);
      const checkpointDate = new Date(startDate);
      checkpointDate.setDate(startDate.getDate() + i - 1);
      
      checkpoints.push({ 
        title: `Día ${i}: Páginas ${startPage}-${endPage}`, 
        completed: false, 
        note: "",
        dayNumber: i,
        pages: `${startPage}-${endPage}`,
        startPage,
        endPage,
        date: checkpointDate.toISOString()
      });
    }
    
    const bookId = planningBook.id || planningBook.bookId;
    
    // Primero asegurarnos de que el libro existe en la biblioteca
    const bookExists = myBooks.find(b => b.bookId === bookId);
    if (!bookExists) {
      // Si el libro no existe, agregarlo primero
      await handleAddBook(planningBook, 'reading', false, true);
    }
    
    // Ahora actualizar con el plan
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { 
      checkpoints, 
      status: 'reading', 
      totalPages: pages,
      planStartDate: startDate.toISOString(),
      planDays: days,
      pagesPerDay: pagesPerDay,
      planEndDate: new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
    });
    
    // Crear notificación del plan
    await createNotification(
      user.uid,
      'reading_plan_started',
      lang === 'es' ? '¡Plan de lectura iniciado!' : 'Reading plan started!',
      lang === 'es' 
        ? `Comenzaste a leer "${planningBook.volumeInfo?.title || planningBook.title}". Meta: ${pages} páginas en ${days} días.`
        : `You started reading "${planningBook.volumeInfo?.title || planningBook.title}". Goal: ${pages} pages in ${days} days.`,
      { bookId }
    );
    
    setPlanningBook(null);
    setManualPages("");
    setPlanDays(7);
    setPlanStartDate(new Date().toISOString().split('T')[0]);
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
      await createNotification(
        user.uid,
        'book_completed',
        lang === 'es' ? '¡Libro completado!' : 'Book completed!',
        lang === 'es' 
          ? `Felicidades, completaste "${book.title}".`
          : `Congratulations, you completed "${book.title}".`,
        { bookId }
      );
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
      thumbnail: (viewingBook.volumeInfo?.imageLinks?.thumbnail || viewingBook.thumbnail)?.replace('http:','https:') || 'https://via.placeholder.com/150',
      status: 'library',
      recommendedBy: userProfile.name,
      senderId: user.uid,
      recommendationMessage: recommendMessage,
      sentAt: new Date().toISOString(),
      inLibrary: true
    };
    
    await setDoc(doc(db, 'users', targetId, 'myBooks', bookId), recData);
    
    // Crear notificación para el amigo
    await createNotification(
      targetId,
      'book_recommendation',
      lang === 'es' ? '¡Te recomendaron un libro!' : 'Book recommendation!',
      lang === 'es' 
        ? `${userProfile.name} te recomendó "${recData.title}"${recommendMessage ? ` con el mensaje: "${recommendMessage}"` : ''}`
        : `${userProfile.name} recommended "${recData.title}"${recommendMessage ? ` with message: "${recommendMessage}"` : ''}`,
      {
        bookId,
        senderId: user.uid,
        senderName: userProfile.name
      }
    );
    
    setShowRecommendList(false);
    setRecommendMessage("");
    alert(lang === 'es' ? "¡Libro recomendado con éxito!" : "Book recommended successfully!");
  };

  // Publicar en el muro - CORREGIDA
  const submitWallPost = async () => {
    await submitWallPostWithNotifications();
  };

  // Buscar libros para seleccionar en publicación - CORREGIDA
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
        // Si no hay resultados en Google Books, buscar en los libros del usuario
        const userBooksResults = myBooks.filter(book => 
          book.title?.toLowerCase().includes(postSearch.toLowerCase()) ||
          book.authors?.some(author => author.toLowerCase().includes(postSearch.toLowerCase()))
        );
        setBooksForPost(userBooksResults.slice(0, 10));
      }
    } catch (err) {
      console.error("Error buscando libros:", err);
      // En caso de error, mostrar libros del usuario
      const userBooksResults = myBooks.filter(book => 
        book.title?.toLowerCase().includes(postSearch.toLowerCase()) ||
        book.authors?.some(author => author.toLowerCase().includes(postSearch.toLowerCase()))
      );
      setBooksForPost(userBooksResults.slice(0, 10));
    }
  };

  // Funciones para gestión de amigos
  const sendFriendRequest = async (targetId, targetName) => {
    await sendFriendRequestWithNotification(targetId, targetName);
  };

  const acceptFriendRequest = async (requestId, senderId, senderName) => {
    await acceptFriendRequestWithNotification(requestId, senderId, senderName);
  };

  const rejectFriendRequest = async (requestId) => {
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'rejected' });
    alert(lang === 'es' ? 'Solicitud de amistad rechazada' : 'Friend request rejected');
  };

  const cancelFriendRequest = async (requestId) => {
    await deleteDoc(doc(db, 'friendRequests', requestId));
    alert(lang === 'es' ? 'Solicitud de amistad cancelada' : 'Friend request cancelled');
  };

  const removeFriend = async (friendId) => {
    if (!user || user.uid === friendId) return;
    
    // Eliminar de la lista de seguimiento
    await updateDoc(doc(db, 'profiles', user.uid), { 
      following: arrayRemove(friendId)
    });
    
    await updateDoc(doc(db, 'profiles', friendId), { 
      followersCount: increment(-1),
      following: arrayRemove(user.uid)
    });
    
    alert(lang === 'es' ? 'Amigo eliminado' : 'Friend removed');
  };

  const toggleFollow = async (targetId) => {
    if (!user || user.uid === targetId) return;
    const isF = userProfile.following?.includes(targetId);
    await updateDoc(doc(db, 'profiles', user.uid), { following: isF ? arrayRemove(targetId) : arrayUnion(targetId) });
    await updateDoc(doc(db, 'profiles', targetId), { followersCount: increment(isF ? -1 : 1) });
    
    // Crear notificación si se empieza a seguir
    if (!isF) {
      await createNotification(
        targetId,
        'new_follower',
        lang === 'es' ? 'Nuevo seguidor' : 'New follower',
        lang === 'es' 
          ? `${userProfile.name} empezó a seguirte`
          : `${userProfile.name} started following you`
      );
    }
  };

  // Dar like a una publicación del muro
  const likeWallPost = async (postId, currentLikes, currentLikesBy = []) => {
    if (!user) return;
    
    const post = wallPosts.find(p => p.id === postId);
    if (!post) return;
    
    const alreadyLiked = currentLikesBy.includes(user.uid);
    const newLikes = alreadyLiked ? currentLikes - 1 : currentLikes + 1;
    const newLikesBy = alreadyLiked 
      ? currentLikesBy.filter(id => id !== user.uid)
      : [...currentLikesBy, user.uid];
    
    await updateDoc(doc(db, 'wallPosts', postId), {
      likes: newLikes,
      likesBy: newLikesBy
    });
    
    // Crear notificación si se da like (solo si no es el propio usuario)
    if (!alreadyLiked && post.userId !== user.uid) {
      await createNotification(
        post.userId,
        'post_liked',
        lang === 'es' ? 'A alguien le gustó tu publicación' : 'Someone liked your post',
        lang === 'es' 
          ? `${userProfile.name} le dio like a tu publicación`
          : `${userProfile.name} liked your post`,
        { postId }
      );
    }
  };

  // Agregar comentario a una publicación del muro
  const addWallPostComment = async (postId, commentText) => {
    if (!user || !commentText.trim()) return;
    
    const post = wallPosts.find(p => p.id === postId);
    if (!post) return;
    
    const commentData = {
      postId,
      userId: user.uid,
      userName: userProfile.name,
      userPic: userProfile.profilePic,
      text: commentText,
      timestamp: serverTimestamp()
    };
    
    await addDoc(collection(db, 'wallPostComments'), commentData);
    
    // Crear notificación (solo si no es el propio usuario)
    if (post.userId !== user.uid) {
      await createNotification(
        post.userId,
        'post_comment',
        lang === 'es' ? 'Nuevo comentario' : 'New comment',
        lang === 'es' 
          ? `${userProfile.name} comentó en tu publicación: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`
          : `${userProfile.name} commented on your post: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
        { postId }
      );
    }
    
    // Limpiar el campo de comentario
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
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

  // Función para el tutorial
  const handleTutorialNext = () => {
    if (tutorialStep < 4) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      localStorage.setItem('sandbook_tutorial_shown', 'true');
    }
  };

  const handleTutorialSkip = () => {
    setShowTutorial(false);
    localStorage.setItem('sandbook_tutorial_shown', 'true');
  };

  // Funciones para mensajería
  const sendMessage = async (receiverId, receiverName, messageText) => {
    await sendMessageWithNotification(receiverId, receiverName, messageText);
  };

  // Función para marcar mensajes como leídos
  const markMessagesAsRead = async (conversationId) => {
    if (!user || !conversationId) return;
    
    // Actualizar conversación para resetear el contador de no leídos
    await updateDoc(doc(db, 'conversations', conversationId), {
      [`unreadCount.${user.uid}`]: 0
    });
    
    // Marcar mensajes como leídos
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('receiverId', '==', user.uid),
      where('read', '==', false)
    );
    
    const snapshot = await getDoc(messagesQuery);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    }
  };

  // Función para guardar/eliminar escritor favorito
  const toggleFavoriteWriter = async (authorName) => {
    if (!user) return;
    
    const isFavorite = favoriteWritersList.includes(authorName);
    
    if (isFavorite) {
      // Eliminar de favoritos
      const favoriteQuery = query(
        collection(db, 'favoriteWriters'),
        where('userId', '==', user.uid),
        where('authorName', '==', authorName)
      );
      
      const snapshot = await getDoc(favoriteQuery);
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await deleteDoc(doc(db, 'favoriteWriters', docId));
      }
      
      setFavoriteWritersList(prev => prev.filter(name => name !== authorName));
      setUserProfile(prev => ({ 
        ...prev, 
        favoriteWriters: prev.favoriteWriters?.filter(name => name !== authorName) || []
      }));
      
      alert(lang === 'es' ? 'Escritor eliminado de favoritos' : 'Writer removed from favorites');
    } else {
      // Agregar a favoritos
      await addDoc(collection(db, 'favoriteWriters'), {
        userId: user.uid,
        authorName,
        addedAt: serverTimestamp()
      });
      
      setFavoriteWritersList(prev => [...prev, authorName]);
      setUserProfile(prev => ({ 
        ...prev, 
        favoriteWriters: [...(prev.favoriteWriters || []), authorName]
      }));
      
      alert(lang === 'es' ? 'Escritor agregado a favoritos' : 'Writer added to favorites');
    }
  };

  // Función para guardar/eliminar publicación
  const toggleSavedPost = async (postId) => {
    if (!user) return;
    
    const isSaved = savedPostsList.includes(postId);
    
    if (isSaved) {
      // Eliminar de guardados
      const savedQuery = query(
        collection(db, 'savedPosts'),
        where('userId', '==', user.uid),
        where('postId', '==', postId)
      );
      
      const snapshot = await getDoc(savedQuery);
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await deleteDoc(doc(db, 'savedPosts', docId));
      }
      
      setSavedPostsList(prev => prev.filter(id => id !== postId));
      setUserProfile(prev => ({ 
        ...prev, 
        savedPosts: prev.savedPosts?.filter(id => id !== postId) || []
      }));
      
      alert(lang === 'es' ? 'Publicación eliminada de guardados' : 'Post removed from saved');
    } else {
      // Agregar a guardados
      const post = wallPosts.find(p => p.id === postId);
      if (post) {
        await addDoc(collection(db, 'savedPosts'), {
          userId: user.uid,
          postId,
          postData: post,
          savedAt: serverTimestamp()
        });
        
        setSavedPostsList(prev => [...prev, postId]);
        setUserProfile(prev => ({ 
          ...prev, 
          savedPosts: [...(prev.savedPosts || []), postId]
        }));
        
        alert(lang === 'es' ? 'Publicación guardada' : 'Post saved');
      }
    }
  };

  // Función para ver libros leídos de un usuario
  const viewUserReadBooks = (userProfileData) => {
    if (!userProfileData) return;
    
    const readBooks = selectedUserBooks.filter(book => book.status === 'read');
    setReadBooksList(readBooks);
    setViewingReadBooks(true);
  };

  // Función para saltar video de bienvenida
  const skipWelcomeVideo = () => {
    setShowWelcomeVideo(false);
    localStorage.setItem('sandbook_welcome_video_shown', 'true');
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Función para continuar sin registro
  const continueWithoutAccount = () => {
    setRequireGoogleLogin(false);
  };

  // Votar por una portada de la comunidad
  const voteForCover = async (bookId, userId) => {
    if (!user) return;
    
    const cover = communityCovers[bookId];
    if (!cover) return;
    
    const hasVoted = cover.upvotedBy?.includes(user.uid);
    
    if (hasVoted) {
      // Quitar voto
      await updateDoc(doc(db, 'bookCovers', bookId), {
        upvotes: increment(-1),
        upvotedBy: arrayRemove(user.uid)
      });
    } else {
      // Agregar voto
      await updateDoc(doc(db, 'bookCovers', bookId), {
        upvotes: increment(1),
        upvotedBy: arrayUnion(user.uid)
      });
    }
  };

  // Filtrar libros en la biblioteca con búsqueda
  const filteredMyBooks = myBooks.filter(b => {
    if (librarySearch) {
      const searchLower = librarySearch.toLowerCase();
      const matchesSearch = 
        b.title?.toLowerCase().includes(searchLower) ||
        b.authors?.some(author => author.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    if (filterType === 'favorite') return b.isFavorite;
    if (filterType === 'read') return b.status === 'read';
    if (filterType === 'liked') return userProfile.likes?.includes(b.bookId); // Nueva sección "Me gustan"
    if (filterType === 'in_plan') return b.status === 'reading';
    if (filterType === 'in_library') return b.inLibrary;
    return true;
  });

  const filteredExternalBooks = selectedUserBooks.filter(b => {
    if (selectedUserFilter === 'favorite') return b.isFavorite;
    if (selectedUserFilter === 'read') return b.status === 'read';
    if (selectedUserFilter === 'liked') return selectedUserProfile?.likes?.includes(b.bookId);
    if (selectedUserFilter === 'in_plan') return b.status === 'reading';
    if (selectedUserFilter === 'in_library') return b.inLibrary;
    return true;
  });

  // Función para contar lectores de un libro
  const getReadersCount = (bookId) => {
    return publicData.filter(p => p.readBooksList?.includes(bookId)).length;
  };

  // Filtrar usuarios para la sección de amigos (EXCLUYENDO usuarios descartados y el usuario actual)
  const filteredUsers = publicData.filter(p => {
    if (p.userId === user?.uid) return false; // Excluir al usuario actual
    if (userProfile.dismissedUsers?.includes(p.userId)) return false; // Excluir usuarios descartados
    
    // Filtrar por búsqueda
    if (friendsSearch && !p.name?.toLowerCase().includes(friendsSearch.toLowerCase())) {
      return false;
    }
    
    // Filtrar por tipo de usuario
    if (friendsFilter === 'google' && !p.isGoogleUser) return false;
    if (friendsFilter === 'anonymous' && !p.isAnonymous) return false;
    if (friendsFilter === 'following' && !userProfile.following?.includes(p.userId)) return false;
    if (friendsFilter === 'followers' && !p.following?.includes(user?.uid)) return false;
    
    return true;
  });

  // Función para establecer fecha de inicio rápida
  const setQuickStartDate = (option) => {
    const today = new Date();
    let newDate = new Date();
    
    switch(option) {
      case 'today':
        // Ya es today por defecto
        break;
      case 'tomorrow':
        newDate.setDate(today.getDate() + 1);
        break;
      case 'next_week':
        newDate.setDate(today.getDate() + 7);
        break;
      case 'custom':
        // Mostrar selector de fecha
        document.getElementById('start-date-picker')?.focus();
        return;
    }
    
    setPlanStartDate(newDate.toISOString().split('T')[0]);
    setShowStartDateOptions(false);
  };

  // Calcular libros por mes para perfil de otros usuarios
  const calculateUserBooksThisMonth = (userBooks) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthRead = userBooks.filter(book => {
      if (book.status !== 'read') return false;
      const finishDate = book.finishDate || book.addedAt;
      if (!finishDate) return false;
      const bookDate = new Date(finishDate);
      return bookDate >= startOfMonth;
    }).length;
    
    return monthRead;
  };

  // Calcular libros en plan para perfil de otros usuarios
  const calculateUserCurrentlyReading = (userBooks) => {
    const reading = userBooks.filter(book => book.status === 'reading').length;
    return reading;
  };

  // Filtrar escritores favoritos
  const filteredFavoriteWriters = favoriteWritersList.filter(writer => 
    !writerSearch || writer.toLowerCase().includes(writerSearch.toLowerCase())
  );

  // Filtrar publicaciones guardadas
  const filteredSavedPosts = wallPosts.filter(post => 
    savedPostsList.includes(post.id)
  );

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} pb-24 font-sans overflow-x-hidden selection:bg-indigo-200 selection:text-white`}>
      
      {/* VIDEO DE BIENVENIDA */}
      {showWelcomeVideo && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            className="w-full h-full object-cover"
            onEnded={() => {
              setShowWelcomeVideo(false);
              localStorage.setItem('sandbook_welcome_video_shown', 'true');
            }}
          >
            <source src="/sandbook.mp4" type="video/mp4" />
            Tu navegador no soporta videos HTML5.
          </video>
          <button 
            onClick={skipWelcomeVideo}
            className="absolute bottom-20 bg-black/50 text-white px-6 py-3 rounded-full font-bold hover:bg-black/70 transition-colors"
          >
            {t.skip_video}
          </button>
        </div>
      )}

      {/* MODAL DE REGISTRO CON GOOGLE */}
      {requireGoogleLogin && (
        <div className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-800 text-white rounded-3xl p-8 max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <img src="/logo.png" className="w-40 h-40 object-contain" alt="Sandbook" />
            </div>
            <h2 className="text-2xl font-bold">{t.welcome_video}</h2>
            <p className="text-gray-300">{t.require_google_login}</p>
            
            <div className="space-y-4">
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 py-4 rounded-2xl font-bold text-lg transition-colors"
              >
                <img src="https://www.google.com/favicon.ico" className="w-6 h-6" />
                {t.register_with_google}
              </button>
              
              <button 
                onClick={continueWithoutAccount}
                className="w-full border border-gray-600 text-gray-300 hover:bg-gray-700 py-4 rounded-2xl font-bold text-lg transition-colors"
              >
                {t.continue_without_account}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT DE INSTALACIÓN PWA */}
      {showInstallPrompt && (
        <div className="fixed bottom-24 left-4 right-4 z-[9997] bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="w-16 h-16 object-contain" alt="Sandbook" />
            <div>
              <p className="font-bold">Instalar Sandbook</p>
              <p className="text-sm opacity-90">Para una mejor experiencia</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowInstallPrompt(false)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold"
            >
              Ahora no
            </button>
            <button 
              onClick={handleInstallClick}
              className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-sm font-bold hover:bg-gray-100"
            >
              Instalar
            </button>
          </div>
        </div>
      )}

      {/* MODAL SUBIR PORTADA DE LIBRO */}
      {showCoverUploadModal && bookForCoverUpload && (
        <div className="fixed inset-0 z-[9996] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-800 text-white rounded-3xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{t.help_community}</h2>
              <button onClick={() => {setShowCoverUploadModal(false); setBookForCoverUpload(null);}}>
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-300 mb-4">{t.upload_book_cover}</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-32 h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                    {bookForCoverUpload.volumeInfo?.imageLinks?.thumbnail ? (
                      <img 
                        src={bookForCoverUpload.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')} 
                        className="w-full h-full object-cover rounded-lg"
                        alt={bookForCoverUpload.volumeInfo.title}
                      />
                    ) : (
                      <BookIcon size={48} className="text-gray-500" />
                    )}
                  </div>
                  <ChevronRight size={24} className="text-gray-400" />
                  <div className="w-32 h-48 bg-indigo-900/30 rounded-lg border-2 border-dashed border-indigo-500 flex items-center justify-center">
                    <Upload size={48} className="text-indigo-400" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="block">
                  <div className="flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-600 py-4 rounded-2xl cursor-pointer transition-colors">
                    <Upload size={20} />
                    <span className="font-bold">{t.upload_cover}</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleBookCoverUpload}
                    className="hidden"
                  />
                </label>
                
                <button 
                  onClick={takePhotoForCover}
                  className="w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 py-4 rounded-2xl font-bold transition-colors"
                >
                  <Camera size={20} />
                  {t.take_photo_cover}
                </button>
              </div>
              
              <p className="text-sm text-gray-400 text-center">
                {t.help_community}: {bookForCoverUpload.volumeInfo?.title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TUTORIAL */}
      {showTutorial && (
        <div className="fixed inset-0 z-[9995] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-8 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-2xl font-black text-white text-center">
                {tutorialStep === 0 ? t.tutorial_welcome :
                 tutorialStep === 1 ? t.library :
                 tutorialStep === 2 ? t.plan :
                 tutorialStep === 3 ? t.social : t.profile}
              </h2>
              <div className="flex justify-center gap-1 mt-4">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`w-2 h-2 rounded-full ${step <= tutorialStep ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="text-center mb-8">
                {tutorialStep === 0 && (
                  <>
                    <BookOpen size={64} className="mx-auto mb-6 text-indigo-500" />
                    <h3 className="text-xl font-black mb-4">{t.tutorial_welcome}</h3>
                    <p className="text-slate-600 dark:text-gray-300">
                      {lang === 'es' 
                        ? 'Sandbook es tu compañero de lectura perfecto. Te guiaremos por las principales funciones.' 
                        : 'Sandbook is your perfect reading companion. We\'ll guide you through the main features.'}
                    </p>
                  </>
                )}
                {tutorialStep === 1 && (
                  <>
                    <Layout size={64} className="mx-auto mb-6 text-green-500" />
                    <h3 className="text-xl font-black mb-4">{t.library}</h3>
                    <p className="text-slate-600 dark:text-gray-300">
                      {t.tutorial_step1}
                    </p>
                    <div className="mt-6 p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl">
                      <p className="text-sm font-bold">📚 {lang === 'es' ? 'Organiza por:' : 'Organize by:'}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                        • {t.read}<br/>
                        • {t.liked}<br/>
                        • {t.favorites}<br/>
                        • {t.in_plan}
                      </p>
                    </div>
                  </>
                )}
                {tutorialStep === 2 && (
                  <>
                    <Calendar size={64} className="mx-auto mb-6 text-blue-500" />
                    <h3 className="text-xl font-black mb-4">{t.plan}</h3>
                    <p className="text-slate-600 dark:text-gray-300">
                      {t.tutorial_step2}
                    </p>
                    <div className="mt-6 p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl">
                      <p className="text-sm font-bold">📅 {lang === 'es' ? 'Crea planes:' : 'Create plans:'}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                        • {lang === 'es' ? 'Establece metas diarias' : 'Set daily goals'}<br/>
                        • {lang === 'es' ? 'Registra tu página actual' : 'Track your current page'}<br/>
                        • {lang === 'es' ? 'Sigue tu progreso' : 'Track your progress'}
                      </p>
                    </div>
                  </>
                )}
                {tutorialStep === 3 && (
                  <>
                    <Globe size={64} className="mx-auto mb-6 text-purple-500" />
                    <h3 className="text-xl font-black mb-4">{t.social}</h3>
                    <p className="text-slate-600 dark:text-gray-300">
                      {t.tutorial_step3}
                    </p>
                    <div className="mt-6 p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl">
                      <p className="text-sm font-bold">👥 {lang === 'es' ? 'Conecta con:' : 'Connect with:'}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                        • {t.friends}<br/>
                        • {t.writers}<br/>
                        • {lang === 'es' ? 'Comparte citas' : 'Share quotes'}<br/>
                        • {lang === 'es' ? 'Descubre autores' : 'Discover authors'}
                      </p>
                    </div>
                  </>
                )}
                {tutorialStep === 4 && (
                  <>
                    <User size={64} className="mx-auto mb-6 text-amber-500" />
                    <h3 className="text-xl font-black mb-4">{t.profile}</h3>
                    <p className="text-slate-600 dark:text-gray-300">
                      {t.tutorial_step4}
                    </p>
                    <div className="mt-6 p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl">
                      <p className="text-sm font-bold">🏆 {lang === 'es' ? 'Logros:' : 'Achievements:'}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                        • {lang === 'es' ? 'Gana insignias por leer' : 'Earn badges for reading'}<br/>
                        • {lang === 'es' ? 'Sube de nivel' : 'Level up'}<br/>
                        • {lang === 'es' ? 'Personaliza tu perfil' : 'Customize your profile'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleTutorialSkip}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 font-bold text-sm"
                >
                  {t.tutorial_skip}
                </button>
                <button 
                  onClick={handleTutorialNext}
                  className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
                >
                  {tutorialStep === 4 ? (lang === 'es' ? 'Comenzar' : 'Get Started') : t.tutorial_next}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-800/90' : theme === 'sunset' ? 'bg-orange-100/90' : 'bg-white/90'} backdrop-blur-md border-b ${themeClasses.border} px-6 py-4 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl">
            <img src="/logo.png" className="w-40 h-10 object-contain" alt="Sandbook" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Botón de instalar PWA */}
          {showInstallPrompt && (
            <button 
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold flex items-center gap-1"
              title={t.install_app}
            >
              <Download size={14} />
              Instalar
            </button>
          )}
          
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
          
          {/* Mensajes */}
          <div className="relative">
            <button 
              onClick={() => setShowMessages(!showMessages)}
              className={`p-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200'} rounded-full relative`}
            >
              <MessageSquare size={18} />
              {conversations.filter(conv => 
                conv.unreadCount && conv.unreadCount[user?.uid] > 0
              ).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {conversations.filter(conv => 
                    conv.unreadCount && conv.unreadCount[user?.uid] > 0
                  ).length}
                </span>
              )}
            </button>
          </div>
          
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
          
          <button onClick={() => {setActiveTab('profile'); setSelectedUserProfile(null); setShowWriters(false); setShowFriendsSection(false); setShowMessages(false);}} className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 border-amber-200' : 'bg-slate-100 border-slate-200'} p-1 rounded-full border pr-3`}>
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
              <img 
                src={getBestCoverForBook(viewingBook.id || viewingBook.bookId).url} 
                className="absolute -bottom-12 left-8 w-28 h-40 object-contain rounded-2xl shadow-2xl border-4 border-white bg-white" 
              />
              <button onClick={() => {setViewingBook(null); setShowRecommendList(false);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 pt-16 scrollbar-hide">
              <h2 className="font-black text-2xl leading-tight">{viewingBook.volumeInfo?.title || viewingBook.title}</h2>
              <p className="text-sm text-indigo-600 font-bold mb-6">
                {viewingBook.volumeInfo?.authors?.map((author, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setViewingBook(null);
                      setShowWriters(true);
                      setWriterSearch(author);
                      setTimeout(() => searchAuthors(), 100);
                    }}
                    className="hover:underline hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    {author}{idx < (viewingBook.volumeInfo?.authors?.length || 1) - 1 ? ', ' : ''}
                  </button>
                )) || viewingBook.authors?.map((author, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setViewingBook(null);
                      setShowWriters(true);
                      setWriterSearch(author);
                      setTimeout(() => searchAuthors(), 100);
                    }}
                    className="hover:underline hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    {author}{idx < (viewingBook.authors?.length || 1) - 1 ? ', ' : ''}
                  </button>
                ))}
              </p>
              
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

              {/* Botones de Like/Dislike GLOBALES */}
              <div className="flex gap-3 mb-6">
                <button 
                  onClick={() => handleGlobalBookReaction(viewingBook.id || viewingBook.bookId, 'like')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${
                    globalLikes[viewingBook.id || viewingBook.bookId]?.likes?.includes(user?.uid)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                  }`}
                >
                  <ThumbsUp size={18} />
                  {t.like}
                  <span className="text-xs font-black">
                    {globalLikes[viewingBook.id || viewingBook.bookId]?.likes?.length || 0}
                  </span>
                </button>
                <button 
                  onClick={() => handleGlobalBookReaction(viewingBook.id || viewingBook.bookId, 'dislike')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${
                    globalLikes[viewingBook.id || viewingBook.bookId]?.dislikes?.includes(user?.uid)
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
                  }`}
                >
                  <ThumbsDown size={18} />
                  {t.dislike}
                  <span className="text-xs font-black">
                    {globalLikes[viewingBook.id || viewingBook.bookId]?.dislikes?.length || 0}
                  </span>
                </button>
              </div>

              {/* Información de portada de la comunidad */}
              {communityCovers[viewingBook.id || viewingBook.bookId] && (
                <div className="mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={12} className="text-indigo-500" />
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">
                      Portada subida por {communityCovers[viewingBook.id || viewingBook.bookId].uploadedByName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => voteForCover(viewingBook.id || viewingBook.bookId, user?.uid)}
                      className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                        communityCovers[viewingBook.id || viewingBook.bookId]?.upvotedBy?.includes(user?.uid)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                      }`}
                    >
                      <ThumbsUp size={10} />
                      {communityCovers[viewingBook.id || viewingBook.bookId]?.upvotes || 0}
                    </button>
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400">
                      {new Date(communityCovers[viewingBook.id || viewingBook.bookId]?.uploadedAt?.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Botón para subir portada si no hay buena imagen */}
              {getBestCoverForBook(viewingBook.id || viewingBook.bookId).source === 'default' && (
                <div className="mb-6">
                  <button 
                    onClick={() => {
                      setShowCoverUploadModal(true);
                      setBookForCoverUpload(viewingBook);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl font-bold text-sm transition-colors"
                  >
                    <Camera size={18} />
                    {t.help_community}: {t.upload_cover}
                  </button>
                  <p className="text-xs text-center text-slate-500 dark:text-gray-400 mt-2">
                    {t.no_cover_available}
                  </p>
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

      {/* MODAL PUBLICAR EN MURO - CORREGIDO */}
      {showPostModal && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[90vh]`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.post_quote}</h2>
              <button onClick={() => {setShowPostModal(false); setShowBookSelector(false); setBooksForPost([]); setPostSearch('');}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
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
                    <img src={selectedBookForPost.thumbnail || selectedBookForPost.volumeInfo?.imageLinks?.thumbnail} className="w-12 h-16 object-contain rounded-lg bg-white" />
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
                          <img src={book.thumbnail || book.volumeInfo?.imageLinks?.thumbnail} className="w-10 h-14 object-contain rounded bg-white" />
                          <div className="flex-1">
                            <p className="text-xs font-bold line-clamp-1">{book.title || book.volumeInfo?.title}</p>
                            <p className="text-[10px] text-slate-500">{book.authors?.[0] || book.volumeInfo?.authors?.[0]}</p>
                          </div>
                        </button>
                      ))}
                      {booksForPost.length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-4">
                          {lang === 'es' ? 'No se encontraron libros' : 'No books found'}
                        </p>
                      )}
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

      {/* MODAL MENSAJES */}
      {showMessages && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Header de mensajes */}
            <div className={`sticky top-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} z-10 border-b ${themeClasses.border} px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setShowMessages(false);
                    setSelectedConversation(null);
                  }} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tighter">{t.messages}</h1>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{t.conversation}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewMessageModal(true)}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
              >
                <MessageSquarePlus size={20} />
              </button>
            </div>

            <div className="max-w-4xl mx-auto p-4">
              {/* Lista de conversaciones */}
              {!selectedConversation ? (
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={lang === 'es' ? "Buscar conversaciones..." : "Search conversations..."}
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none text-sm border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                  
                  {conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : 'text-slate-200'} mb-4`} size={48} />
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>
                        {t.no_messages}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversations.map(conv => {
                        const otherParticipantId = conv.participants.find(p => p !== user.uid);
                        const otherParticipantName = conv.participantNames[conv.participants.findIndex(p => p !== user.uid)];
                        const otherParticipant = publicData.find(p => p.userId === otherParticipantId);
                        
                        return (
                          <button
                            key={conv.id}
                            onClick={() => {
                              setSelectedConversation(conv);
                              markMessagesAsRead(conv.id);
                            }}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl border ${themeClasses.border} text-left hover:border-indigo-300 dark:hover:border-indigo-500 transition-all ${
                              conv.unreadCount && conv.unreadCount[user?.uid] > 0
                                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                : theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                            }`}
                          >
                            <img 
                              src={otherParticipant?.profilePic || 'https://via.placeholder.com/40'} 
                              className="w-12 h-12 rounded-full object-cover" 
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm">{otherParticipantName}</h4>
                                <span className="text-xs text-slate-500 dark:text-gray-400">
                                  {new Date(conv.lastMessageAt?.seconds * 1000).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-gray-300 truncate">
                                {conv.lastMessageSenderId === user.uid ? 'Tú: ' : ''}
                                {conv.lastMessage}
                              </p>
                              {conv.unreadCount && conv.unreadCount[user?.uid] > 0 && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                  {conv.unreadCount[user.uid]} nuevo{conv.unreadCount[user.uid] > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header de conversación */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedConversation(null)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    {(() => {
                      const otherParticipantId = selectedConversation.participants.find(p => p !== user.uid);
                      const otherParticipantName = selectedConversation.participantNames[selectedConversation.participants.findIndex(p => p !== user.uid)];
                      const otherParticipant = publicData.find(p => p.userId === otherParticipantId);
                      
                      return (
                        <>
                          <img 
                            src={otherParticipant?.profilePic || 'https://via.placeholder.com/40'} 
                            className="w-10 h-10 rounded-full object-cover" 
                          />
                          <div>
                            <h3 className="font-bold text-sm">{otherParticipantName}</h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {otherParticipant?.readCount || 0} {t.read.toLowerCase()} • {getLevelTitle(otherParticipant?.readCount, lang)}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Área de mensajes */}
                  <div className={`h-96 overflow-y-auto p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-50'} space-y-4`}>
                    {/* Los mensajes se cargarían aquí */}
                    <p className="text-center text-sm text-slate-400 dark:text-gray-400 py-8">
                      {lang === 'es' ? 'Cargando mensajes...' : 'Loading messages...'}
                    </p>
                  </div>
                  
                  {/* Input para enviar mensaje */}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={t.type_message}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newMessage.trim()) {
                          const otherParticipantId = selectedConversation.participants.find(p => p !== user.uid);
                          const otherParticipantName = selectedConversation.participantNames[selectedConversation.participants.findIndex(p => p !== user.uid)];
                          sendMessage(otherParticipantId, otherParticipantName, newMessage);
                        }
                      }}
                      className={`flex-1 px-4 py-3 rounded-2xl text-sm outline-none ${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-gray-100 border-gray-600' 
                          : 'bg-white text-slate-900 border-slate-200'
                      } border`}
                    />
                    <button 
                      onClick={() => {
                        const otherParticipantId = selectedConversation.participants.find(p => p !== user.uid);
                        const otherParticipantName = selectedConversation.participantNames[selectedConversation.participants.findIndex(p => p !== user.uid)];
                        sendMessage(otherParticipantId, otherParticipantName, newMessage);
                      }}
                      disabled={!newMessage.trim()}
                      className={`px-4 py-3 rounded-2xl font-bold ${
                        !newMessage.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO MENSAJE */}
      {showNewMessageModal && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.new_message}</h2>
              <button onClick={() => {setShowNewMessageModal(false); setSelectedUserForMessage(null);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold mb-2 block">{t.to}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={lang === 'es' ? "Buscar usuario..." : "Search user..."}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none ${
                        theme === 'dark' 
                          ? 'bg-gray-700 text-gray-100 border-gray-600' 
                          : 'bg-white text-slate-900 border-slate-200'
                      } border`}
                      onChange={(e) => setMessageSearch(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                  
                  {/* Lista de usuarios */}
                  <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
                    {publicData
                      .filter(p => p.userId !== user.uid)
                      .filter(p => !messageSearch || p.name.toLowerCase().includes(messageSearch.toLowerCase()))
                      .map(p => (
                        <button
                          key={p.userId}
                          onClick={() => setSelectedUserForMessage(p)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border ${
                            selectedUserForMessage?.userId === p.userId
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                              : themeClasses.border
                          }`}
                        >
                          <img src={p.profilePic || 'https://via.placeholder.com/30'} className="w-10 h-10 rounded-full object-cover" />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-bold">{p.name}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {p.readCount || 0} {t.read.toLowerCase()}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
                
                {selectedUserForMessage && (
                  <>
                    <div>
                      <label className="text-xs font-bold mb-2 block">{t.message}</label>
                      <textarea 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t.type_message}
                        className={`w-full rounded-xl p-3 text-sm outline-none min-h-[120px] ${
                          theme === 'dark' 
                            ? 'bg-gray-700 text-gray-100 border-gray-600' 
                            : 'bg-white text-slate-900 border-slate-200'
                        } border`}
                      />
                    </div>
                    
                    <button 
                      onClick={() => sendMessage(selectedUserForMessage.userId, selectedUserForMessage.name, newMessage)}
                      disabled={!newMessage.trim()}
                      className={`w-full py-3 rounded-xl font-bold ${
                        !newMessage.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {t.send_message}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIBROS LEÍDOS DE USUARIO */}
      {viewingReadBooks && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">
                {selectedUserProfile?.name} - {t.read}
              </h2>
              <button onClick={() => setViewingReadBooks(false)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {readBooksList.length === 0 ? (
                  <div className="text-center py-12">
                    <BookIcon className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                    <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>
                      {lang === 'es' ? 'No hay libros leídos' : 'No read books'}
                    </p>
                  </div>
                ) : (
                  readBooksList.map((book, i) => (
                    <div key={i} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border} flex gap-4`}>
                      <img 
                        src={book.thumbnail} 
                        onClick={() => setViewingBook(book)} 
                        className="w-14 h-20 object-contain rounded-xl shadow-sm cursor-pointer bg-white" 
                      />
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-sm line-clamp-1">{book.title}</h4>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-gray-400 uppercase">{book.authors?.[0] || 'Autor desconocido'}</p>
                        <div className="mt-2">
                          <StarRating rating={book.rating || 0} interactive={false} size={12}/>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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

      {/* MODAL PLANIFICADOR CON FECHA DE INICIO */}
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
              
              {/* Fecha de inicio */}
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase ml-1 tracking-widest">{t.start_date}</label>
                <div className="relative">
                  <input 
                    type="date" 
                    id="start-date-picker"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : theme === 'sunset' ? 'bg-amber-100 border-amber-300 text-gray-800' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  <button 
                    onClick={() => setShowStartDateOptions(!showStartDateOptions)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <ChevronDown size={20} />
                  </button>
                  
                  {/* Opciones rápidas de fecha */}
                  {showStartDateOptions && (
                    <div className={`absolute top-full left-0 right-0 mt-2 ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-white'} rounded-2xl border ${themeClasses.border} shadow-lg z-10`}>
                      <div className="p-2">
                        <p className="text-xs font-bold text-slate-400 dark:text-gray-400 mb-2 px-2">{t.select_start_date}</p>
                        <button 
                          onClick={() => setQuickStartDate('today')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-sm"
                        >
                          {t.today} ({new Date().toLocaleDateString()})
                        </button>
                        <button 
                          onClick={() => setQuickStartDate('tomorrow')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-sm"
                        >
                          {t.tomorrow} ({new Date(Date.now() + 86400000).toLocaleDateString()})
                        </button>
                        <button 
                          onClick={() => setQuickStartDate('next_week')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-sm"
                        >
                          {t.next_week} ({new Date(Date.now() + 7 * 86400000).toLocaleDateString()})
                        </button>
                        <button 
                          onClick={() => setQuickStartDate('custom')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-sm"
                        >
                          {t.custom_date}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                  <p className="text-xs mt-1">
                    {lang === 'es' 
                      ? `Fecha de inicio: ${new Date(planStartDate).toLocaleDateString()}`
                      : `Start date: ${new Date(planStartDate).toLocaleDateString()}`
                    }
                  </p>
                  <p className="text-xs mt-1">
                    {lang === 'es' 
                      ? `Fecha de finalización: ${new Date(new Date(planStartDate).getTime() + parseInt(planDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}`
                      : `End date: ${new Date(new Date(planStartDate).getTime() + parseInt(planDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}`
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
                onClick={() => {
                  setPlanningBook(null);
                  setManualPages("");
                  setPlanDays(7);
                  setPlanStartDate(new Date().toISOString().split('T')[0]);
                  setShowStartDateOptions(false);
                }} 
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

      {/* VISTA ESCRITORES CON DETALLES COMPLETOS */}
      {showWriters && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Header de escritores */}
            <div className={`sticky top-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} z-10 border-b ${themeClasses.border} px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setShowWriters(false);
                    setSelectedAuthor(null);
                    setAuthorDetails(null);
                  }} 
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
              {/* Botones para secciones especiales */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowFavoriteWriters(true)}
                  className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-indigo-50'} p-4 rounded-2xl border ${themeClasses.border} text-center hover:border-indigo-300 dark:hover:border-indigo-500 transition-all`}
                >
                  <Star size={24} className="mx-auto mb-2 text-yellow-500" />
                  <p className="text-sm font-bold">{t.favorite_writers}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{favoriteWritersList.length} {lang === 'es' ? 'guardados' : 'saved'}</p>
                </button>
                <button 
                  onClick={() => setShowSavedPosts(true)}
                  className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'} p-4 rounded-2xl border ${themeClasses.border} text-center hover:border-purple-300 dark:hover:border-purple-500 transition-all`}
                >
                  <Bookmark size={24} className="mx-auto mb-2 text-purple-500" />
                  <p className="text-sm font-bold">{t.saved_posts}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{savedPostsList.length} {lang === 'es' ? 'guardadas' : 'saved'}</p>
                </button>
              </div>

              {/* Buscador de escritores */}
              {!selectedAuthor && (
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
              )}

              {/* Detalles completos del autor seleccionado */}
              {selectedAuthor && authorDetails && (
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-[2.5rem] border ${themeClasses.border} p-6 space-y-8 animate-in slide-in-from-top-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-6">
                      {authorDetails.thumbnail ? (
                        <img 
                          src={authorDetails.thumbnail} 
                          className="w-32 h-32 object-contain rounded-2xl shadow-lg bg-white" 
                          alt={authorDetails.name}
                        />
                      ) : (
                        <div className="w-32 h-32 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center text-4xl font-bold text-indigo-600 dark:text-indigo-300">
                          {authorDetails.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-3xl font-black">{authorDetails.name}</h2>
                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{authorDetails.description}</p>
                          </div>
                          <button 
                            onClick={() => toggleFavoriteWriter(authorDetails.name)}
                            className={`p-2 rounded-full ${
                              favoriteWritersList.includes(authorDetails.name)
                                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                            title={favoriteWritersList.includes(authorDetails.name) ? t.remove_favorite_writer : t.mark_as_favorite_writer}
                          >
                            <Star size={20} className={favoriteWritersList.includes(authorDetails.name) ? 'fill-yellow-400' : ''} />
                          </button>
                        </div>
                        
                        {/* Información básica del autor */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          {authorDetails.birthDate && (
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.birth_date}</p>
                              <p className="text-sm font-bold">{authorDetails.birthDate}</p>
                            </div>
                          )}
                          {authorDetails.age && (
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.author_age}</p>
                              <p className="text-sm font-bold">{authorDetails.age} {lang === 'es' ? 'años' : 'years'}</p>
                            </div>
                          )}
                          {authorDetails.nationality && (
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.nationality}</p>
                              <p className="text-sm font-bold">{authorDetails.nationality}</p>
                            </div>
                          )}
                          {authorDetails.literaryGenre && (
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.literary_genre}</p>
                              <p className="text-sm font-bold">{authorDetails.literaryGenre}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedAuthor(null);
                        setAuthorDetails(null);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {/* Biografía */}
                  <div>
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                      <BookOpen size={20} /> {t.biography}
                    </h3>
                    <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-50'} p-6 rounded-2xl`}>
                      <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">
                        {authorDetails.biography || authorDetails.extract || 
                          (lang === 'es' 
                            ? `Biografía de ${authorDetails.name} no disponible en este momento. Esta información está siendo actualizada.`
                            : `Biography of ${authorDetails.name} is not available at this time. This information is being updated.`
                          )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Obras famosas */}
                  {authorDetails.famousWorks && authorDetails.famousWorks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                        <Trophy size={20} /> {t.famous_works}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {authorDetails.famousWorks.map((work, idx) => (
                          <span 
                            key={idx} 
                            className={`px-3 py-2 rounded-full ${theme === 'dark' ? 'bg-indigo-900/30 text-indigo-300' : theme === 'sunset' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700'} text-sm font-bold`}
                          >
                            {work}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Premios */}
                  {authorDetails.awards && authorDetails.awards.length > 0 && (
                    <div>
                      <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                        <Award size={20} /> {t.awards}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {authorDetails.awards.map((award, idx) => (
                          <span 
                            key={idx} 
                            className={`px-3 py-2 rounded-full ${theme === 'dark' ? 'bg-amber-900/30 text-amber-300' : theme === 'sunset' ? 'bg-yellow-100 text-yellow-800' : 'bg-amber-100 text-amber-700'} text-sm font-bold`}
                          >
                            {award}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Libros del autor */}
                  <div>
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                      <BookIcon size={20} /> {t.books_written} ({authorBooks.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {authorBooks.slice(0, 8).map((book, idx) => (
                        <div 
                          key={idx} 
                          className={`flex gap-3 p-3 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700 border ${themeClasses.border} transition-all`}
                          onClick={() => {
                            setShowWriters(false);
                            setTimeout(() => setViewingBook(book), 100);
                          }}
                        >
                          <img 
                            src={book.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150'} 
                            className="w-16 h-20 object-contain rounded-lg bg-white" 
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
                    
                    {authorBooks.length > 8 && (
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
                          {writer.thumbnail ? (
                            <img src={writer.thumbnail} className="w-12 h-12 object-contain rounded-full bg-white" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg">
                              {writer.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-bold text-sm">{writer.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {writer.booksCount} {lang === 'es' ? 'libros' : 'books'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteWriter(writer.name);
                              }}
                              className={`p-1 rounded-full ${
                                favoriteWritersList.includes(writer.name)
                                  ? 'text-yellow-500'
                                  : 'text-slate-300 hover:text-yellow-500'
                              }`}
                              title={favoriteWritersList.includes(writer.name) ? t.remove_favorite_writer : t.mark_as_favorite_writer}
                            >
                              <Star size={16} className={favoriteWritersList.includes(writer.name) ? 'fill-yellow-400' : ''} />
                            </button>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                          </div>
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

      {/* MODAL ESCRITORES FAVORITOS */}
      {showFavoriteWriters && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.writers_section}</h2>
              <button onClick={() => setShowFavoriteWriters(false)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {favoriteWritersList.length === 0 ? (
                <div className="text-center py-12">
                  <Star className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>
                    {lang === 'es' ? 'No hay escritores favoritos' : 'No favorite writers'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
                    {lang === 'es' 
                      ? 'Agrega escritores a favoritos desde la sección de escritores'
                      : 'Add writers to favorites from the writers section'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favoriteWritersList.map((writer, idx) => (
                    <div key={idx} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg">
                          {writer.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{writer}</h4>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            {lang === 'es' ? 'Escritor favorito' : 'Favorite writer'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setShowFavoriteWriters(false);
                            setShowWriters(true);
                            setWriterSearch(writer);
                            setTimeout(() => searchAuthors(), 100);
                          }}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                          title={lang === 'es' ? 'Ver detalles' : 'View details'}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => toggleFavoriteWriter(writer)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                          title={t.remove_favorite_writer}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUBLICACIONES GUARDADAS */}
      {showSavedPosts && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.saved_section}</h2>
              <button onClick={() => setShowSavedPosts(false)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {filteredSavedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>
                    {lang === 'es' ? 'No hay publicaciones guardadas' : 'No saved posts'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
                    {lang === 'es' 
                      ? 'Guarda publicaciones interesantes desde el muro'
                      : 'Save interesting posts from the wall'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSavedPosts.map((post) => {
                    const postComments = wallPostComments[post.id] || [];
                    
                    return (
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
                          <button 
                            onClick={() => toggleSavedPost(post.id)}
                            className="p-2 text-yellow-500 hover:text-yellow-600"
                            title={t.remove_saved_post}
                          >
                            <Bookmark size={18} className="fill-yellow-400" />
                          </button>
                        </div>
                        
                        <p className="text-sm text-slate-700 dark:text-gray-300 mb-4 leading-relaxed">
                          {post.content}
                        </p>
                        
                        {post.bookTitle && (
                          <div className={`p-3 rounded-2xl mb-4 ${theme === 'dark' ? 'bg-gray-700' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                              {post.bookThumbnail && (
                                <img src={post.bookThumbnail} className="w-12 h-16 object-contain rounded-lg bg-white" />
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
                        
                        {/* Interacciones */}
                        <div className="pt-4 border-t border-slate-100 dark:border-gray-700">
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1 text-slate-500 dark:text-gray-400">
                              <Heart size={16} />
                              <span className="text-xs">{post.likes || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 text-slate-500 dark:text-gray-400">
                              <MessageSquare size={16} />
                              <span className="text-xs">{postComments.length}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* VISTA PERFIL DE OTRO USUARIO - MEJORADA */}
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
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-2 tracking-[0.2em]">
                {getLevelTitle(selectedUserProfile.readCount, lang)} 
                <img src={getLevelSymbol(selectedUserProfile.readCount)} className="w-6 h-6 object-contain inline-block ml-2" alt="Nivel" />
              </p>
              
              {/* Botón para ver libros leídos */}
              <button 
                onClick={() => viewUserReadBooks(selectedUserProfile)}
                className={`mb-4 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-indigo-50 hover:bg-indigo-100'} p-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors`}
              >
                <BookOpen size={16} />
                {t.view_read_books}
                <span className="text-xs font-black bg-indigo-600 text-white px-2 py-1 rounded-full">
                  {selectedUserBooks.filter(b => b.status === 'read').length}
                </span>
              </button>
              
              {/* Botón para enviar mensaje */}
              <button 
                onClick={() => {
                  setSelectedUserForMessage(selectedUserProfile);
                  setShowNewMessageModal(true);
                }}
                className={`mb-4 ${theme === 'dark' ? 'bg-indigo-700 hover:bg-indigo-600' : theme === 'sunset' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'} p-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors text-white`}
              >
                <MessageSquare size={16} />
                {t.send_message}
              </button>
              
              {/* Estadísticas mejoradas para perfil de otros usuarios */}
              <div className={`grid grid-cols-2 gap-4 text-[9px] font-black text-slate-400 dark:text-gray-400 uppercase ${
                theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'
              } p-6 rounded-[2.5rem] border ${
                theme === 'dark' ? 'border-gray-700' : theme === 'sunset' ? 'border-amber-200' : 'border-slate-100'
              } shadow-inner mt-4`}>
                <div className="text-center">
                  <span className="text-indigo-600 dark:text-indigo-400 text-xl block leading-none mb-1">{selectedUserProfile.readCount || 0}</span>
                  {t.read}
                </div>
                <div className="text-center">
                  <span className="text-purple-600 dark:text-purple-400 text-xl block leading-none mb-1">{selectedUserProfile.followersCount || 0}</span>
                  {t.followers}
                </div>
                <div className="text-center">
                  <span className="text-green-600 dark:text-green-400 text-xl block leading-none mb-1">{calculateUserCurrentlyReading(selectedUserBooks)}</span>
                  {t.currently_reading}
                </div>
                <div className="text-center">
                  <span className="text-amber-600 dark:text-amber-400 text-xl block leading-none mb-1">{calculateUserBooksThisMonth(selectedUserBooks)}</span>
                  {t.books_this_month}
                </div>
              </div>
              
              {/* Información de seguimiento */}
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs font-bold">{selectedUserProfile.following?.length || 0}</p>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400">{t.following}</p>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-gray-700"></div>
                <div className="text-center">
                  <p className="text-xs font-bold">{followersList.filter(f => f.userId === selectedUserProfile.userId).length > 0 ? 1 : 0}</p>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400">{lang === 'es' ? 'Te sigue' : 'Follows you'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest px-2">
                {t.user_books} {selectedUserProfile.name}
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'read', 'in_plan', 'liked', 'favorite', 'in_library'].map(type => (
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
                {filteredExternalBooks.map((book, i) => {
                  const bookLikes = globalLikes[book.bookId];
                  
                  return (
                    <div key={i} className={`${themeClasses.card} p-4 rounded-[2.5rem] border ${themeClasses.border} shadow-sm animate-in fade-in flex gap-4`}>
                      <img 
                        src={book.thumbnail} 
                        onClick={() => setViewingBook(book)} 
                        className="w-14 h-20 object-contain rounded-xl shadow-sm cursor-pointer bg-white" 
                      />
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-sm line-clamp-1">{book.title}</h4>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-gray-400 uppercase">{book.authors?.[0] || 'Autor desconocido'}</p>
                        <div className="mt-3">
                          <StarRating rating={book.rating || 0} interactive={false} size={12}/>
                        </div>
                        {/* Botones de like/dislike globales */}
                        <div className="flex gap-2 mt-2">
                          <button 
                            onClick={() => handleGlobalBookReaction(book.bookId, 'like')}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${
                              bookLikes?.likes?.includes(user?.uid)
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            <ThumbsUp size={10} />
                            {bookLikes?.likes?.length || 0}
                          </button>
                          <button 
                            onClick={() => handleGlobalBookReaction(book.bookId, 'dislike')}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${
                              bookLikes?.dislikes?.includes(user?.uid)
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            <ThumbsDown size={10} />
                            {bookLikes?.dislikes?.length || 0}
                          </button>
                        </div>
                        {/* Mostrar estado del libro */}
                        <div className="mt-2">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            book.status === 'read' ? 'bg-green-100 text-green-700' :
                            book.status === 'reading' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {book.status === 'read' ? t.read : book.status === 'reading' ? t.in_plan : t.in_library}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredExternalBooks.length === 0 && (
                  <div className={`text-center py-12 ${themeClasses.card} rounded-[2.5rem] border border-dashed ${themeClasses.border}`}>
                    <BookIcon className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                    <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>
                      {lang === 'es' ? 'No hay libros en esta sección' : 'No books in this section'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* PESTAÑAS NORMALES */
          <>
            {/* VISTA BIBLIOTECA */}
            {activeTab === 'library' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Tarjeta de nivel CON SÍMBOLO */}
                <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-indigo-800 to-purple-900' : theme === 'sunset' ? 'bg-gradient-to-br from-orange-500 to-pink-500' : 'bg-gradient-to-br from-indigo-600 to-purple-700'} p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden`}>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.level}</p>
                        <img src={getLevelSymbol(userProfile.readCount)} className="w-6 h-6 object-contain" alt="Nivel" />
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
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min((userProfile.readCount/2100)*100, 100)}%` }} />
                  </div>
                </div>

                {/* Buscador en mis libros */}
                <div className={`${themeClasses.card} p-4 rounded-[2rem] border ${themeClasses.border} shadow-sm`}>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={t.search_in_my_books}
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm outline-none ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : theme === 'sunset' 
                          ? 'bg-amber-100 border-amber-300 text-gray-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      } border`}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
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

                {/* Filtros - CAMBIADO: "want" reemplazado por "liked" */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['all', 'read', 'in_plan', 'liked', 'favorite', 'in_library'].map(type => (
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
                            className="w-16 h-24 object-contain rounded-2xl shadow-sm cursor-pointer active:scale-95 transition-all bg-white" 
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
                            {/* Deslizador Leído/No leído en todas las secciones */}
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 p-2 rounded-2xl border border-slate-100 dark:border-gray-700 mt-3">
                              <span className="text-[9px] font-black uppercase text-slate-400 dark:text-gray-400 ml-2">{t.read}?</span>
                              <div 
                                onClick={() => handleAddBook(book, book.status === 'read' ? 'library' : 'read', book.isFavorite, book.inLibrary)} 
                                className={`relative w-16 h-7 rounded-full cursor-pointer transition-all p-1 ${
                                  book.status === 'read' 
                                    ? 'bg-green-500 dark:bg-green-700' 
                                    : 'bg-slate-200 dark:bg-gray-700'
                                }`}
                              >
                                <div className={`absolute top-1 bottom-1 w-5 bg-white dark:bg-gray-300 rounded-full shadow transition-all ${
                                  book.status === 'read' ? 'translate-x-9' : 'translate-x-0'
                                }`} />
                              </div>
                            </div>
                            {/* Barra de porcentaje SOLO para libros en plan de lectura */}
                            {book.status === 'reading' && book.checkpoints?.length > 0 && (
                              <div className="flex items-center gap-2 mt-4">
                                <div className="flex-1 h-1 bg-slate-50 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 transition-all duration-700" style={{width: `${perc}%`}} />
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{perc}%</span>
                              </div>
                            )}
                            {/* Input para número de página actual - SOLO para libros en plan de lectura */}
                            {book.status === 'reading' && (
                              <div className="flex items-center gap-2 mt-3">
                                <input 
                                  type="number" 
                                  placeholder={t.current_page}
                                  value={currentPageInputs[book.bookId] || book.currentPage || ''}
                                  onChange={(e) => setCurrentPageInputs(prev => ({ ...prev, [book.bookId]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && currentPageInputs[book.bookId]) {
                                      updateCurrentPage(book.bookId, currentPageInputs[book.bookId]);
                                    }
                                  }}
                                  className={`flex-1 px-3 py-2 rounded-xl text-xs border ${
                                    theme === 'dark' 
                                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                                      : theme === 'sunset' 
                                      ? 'bg-amber-100 border-amber-300 text-amber-900' 
                                      : 'bg-slate-50 border-slate-200 text-slate-900'
                                  }`}
                                  min="1"
                                  max={book.totalPages || 1000}
                                />
                                <button 
                                  onClick={() => updateCurrentPage(book.bookId, currentPageInputs[book.bookId] || book.currentPage)}
                                  disabled={!currentPageInputs[book.bookId] && !book.currentPage}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold ${
                                    !currentPageInputs[book.bookId] && !book.currentPage
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  }`}
                                >
                                  {t.save}
                                </button>
                              </div>
                            )}
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
                                onClick={() => { 
                                  setPlanningBook(book); 
                                  setManualPages(book.totalPages || book.volumeInfo?.pageCount || ""); 
                                }} 
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
                              {book.planStartDate && (
                                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                  {new Date(book.planStartDate).toLocaleDateString()}
                                </p>
                              )}
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
                                    {cp.date && (
                                      <span className="text-[10px] text-slate-400 dark:text-gray-500">
                                        {new Date(cp.date).toLocaleDateString()}
                                      </span>
                                    )}
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
                    const bestCover = getBestCoverForBook(book.id);
                    const bookLikes = globalLikes[book.id];
                    const hasGoodCover = bestCover.source !== 'default';
                    
                    return (
                      <div key={book.id} className={`${themeClasses.card} p-5 rounded-[2.5rem] border ${themeClasses.border} shadow-sm animate-in zoom-in-95`}>
                        <div className="flex gap-5">
                          <div className="relative">
                            <img 
                              src={bestCover.url} 
                              onClick={() => setViewingBook(book)} 
                              className="w-24 h-36 object-contain rounded-2xl shadow-md cursor-pointer hover:scale-105 transition-all bg-white" 
                            />
                            {!hasGoodCover && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <button 
                                  onClick={() => {
                                    setShowCoverUploadModal(true);
                                    setBookForCoverUpload(book);
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                >
                                  <Camera size={12} />
                                  {t.help_community}
                                </button>
                              </div>
                            )}
                            {bestCover.source === 'community' && (
                              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                👥
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <h3 className="font-bold text-sm leading-tight line-clamp-2">{book.volumeInfo.title}</h3>
                            <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold mb-2">
                              {book.volumeInfo.authors?.map((author, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setViewingBook(null);
                                    setShowWriters(true);
                                    setWriterSearch(author);
                                    setTimeout(() => searchAuthors(), 100);
                                  }}
                                  className="hover:underline hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                >
                                  {author}{idx < (book.volumeInfo?.authors?.length || 1) - 1 ? ', ' : ''}
                                </button>
                              ))}
                            </p>
                            
                            {/* Botones de like/dislike globales */}
                            <div className="flex gap-2 mb-3">
                              <button 
                                onClick={() => handleGlobalBookReaction(book.id, 'like')}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${
                                  bookLikes?.likes?.includes(user?.uid)
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                              >
                                <ThumbsUp size={10} />
                                {bookLikes?.likes?.length || 0}
                              </button>
                              <button 
                                onClick={() => handleGlobalBookReaction(book.id, 'dislike')}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${
                                  bookLikes?.dislikes?.includes(user?.uid)
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                              >
                                <ThumbsDown size={10} />
                                {bookLikes?.dislikes?.length || 0}
                              </button>
                            </div>
                            
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
                                  onClick={() => handleAddBook(book, alreadyHave?.status === 'read' ? 'library' : 'read')} 
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
                                  onClick={() => { 
                                    setPlanningBook(book); 
                                    setManualPages(book.volumeInfo.pageCount || ""); 
                                  }} 
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
                                  onClick={() => handleAddBook(book, 'library', true)} 
                                  className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 rounded-xl active:scale-95"
                                >
                                  <Star size={16}/>
                                </button>
                                
                                {/* Botón para subir portada si no hay buena imagen */}
                                {!hasGoodCover && (
                                  <button 
                                    onClick={() => {
                                      setShowCoverUploadModal(true);
                                      setBookForCoverUpload(book);
                                    }}
                                    className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 rounded-xl active:scale-95"
                                    title={t.help_community}
                                  >
                                    <Camera size={14}/>
                                  </button>
                                )}
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
                {/* Sección de Amigos */}
                <div className={`${themeClasses.card} p-6 rounded-[2.5rem] border ${themeClasses.border} shadow-sm space-y-6`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-tighter">{t.friends}</h3>
                    <button 
                      onClick={() => setShowFriendsSection(!showFriendsSection)}
                      className={`p-2 rounded-full ${showFriendsSection ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {showFriendsSection ? <X size={18} /> : <Users size={18} />}
                    </button>
                  </div>
                  
                  {showFriendsSection ? (
                    <div className="space-y-6 animate-in fade-in">
                      {/* Contadores de amigos */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`text-center p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{friendsList.length}</p>
                          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.friends}</p>
                        </div>
                        <div className={`text-center p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{followersList.length}</p>
                          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.followers_list}</p>
                        </div>
                        <div className={`text-center p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                          <p className="text-2xl font-black text-green-600 dark:text-green-400">{friendRequests.length}</p>
                          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.friend_requests}</p>
                        </div>
                        <div className={`text-center p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                          <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{userProfile.dismissedUsers?.length || 0}</p>
                          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.dismiss_user}</p>
                        </div>
                      </div>
                      
                      {/* Filtros */}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['all', 'following', 'followers', 'google', 'anonymous'].map(filter => (
                          <button 
                            key={filter} 
                            onClick={() => setFriendsFilter(filter)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all whitespace-nowrap ${
                              friendsFilter === filter 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : `${theme === 'dark' ? 'bg-gray-800 text-gray-300' : theme === 'sunset' ? 'bg-amber-50 text-amber-800' : 'bg-white text-slate-400'}`
                            }`}
                          >
                            {t[filter]}
                          </button>
                        ))}
                      </div>
                      
                      {/* Buscador */}
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder={t.find_people}
                          value={friendsSearch}
                          onChange={(e) => setFriendsSearch(e.target.value)}
                          className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none text-sm border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : theme === 'sunset' 
                              ? 'bg-amber-100 border-amber-300 text-amber-900' 
                              : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      </div>
                      
                      {/* Solicitudes de amistad pendientes */}
                      {friendRequests.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-400 dark:text-gray-400">{t.pending_requests}</h4>
                          {friendRequests.map(request => (
                            <div key={request.id} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-white'} p-4 rounded-2xl border ${themeClasses.border}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <img src={request.senderPic || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover" />
                                  <div>
                                    <p className="text-sm font-bold">{request.senderName}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-gray-400">
                                      {new Date(request.timestamp?.seconds * 1000).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => acceptFriendRequest(request.id, request.senderId, request.senderName)}
                                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold"
                                  >
                                    {t.accept}
                                  </button>
                                  <button 
                                    onClick={() => rejectFriendRequest(request.id)}
                                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
                                  >
                                    {t.reject}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Lista de usuarios */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-400 dark:text-gray-400">
                          {friendsFilter === 'all' ? t.all_users : 
                           friendsFilter === 'google' ? t.google_users : 
                           friendsFilter === 'anonymous' ? t.anonymous_users : 
                           friendsFilter === 'following' ? t.following : 
                           t.followers_list}
                        </h4>
                        
                        {filteredUsers.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                            <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>
                              {t.no_friends_yet}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {filteredUsers.map(p => {
                              const isFollowing = userProfile.following?.includes(p.userId);
                              const isFriend = friendsList.some(f => f.userId === p.userId);
                              const hasSentRequest = sentFriendRequests.some(req => req.receiverId === p.userId);
                              const isDismissed = userProfile.dismissedUsers?.includes(p.userId);
                              
                              return (
                                <div key={p.userId} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-white'} p-4 rounded-2xl border ${themeClasses.border} flex items-center justify-between`}>
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <img src={p.profilePic || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full object-cover" />
                                      {p.isGoogleUser ? (
                                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-slate-200">
                                          <img src="https://www.google.com/favicon.ico" className="w-3 h-3 object-contain" />
                                        </div>
                                      ) : (
                                        <div className="absolute -bottom-1 -right-1 bg-slate-600 text-white p-1 rounded-full text-[8px] font-bold">
                                          A
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold">{p.name}</p>
                                      <p className="text-[10px] text-slate-500 dark:text-gray-400">
                                        {p.readCount || 0} {t.read.toLowerCase()} • {getLevelTitle(p.readCount, lang)}
                                        <img src={getLevelSymbol(p.readCount)} className="w-3 h-3 object-contain inline-block ml-1" alt="Nivel" />
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    {isDismissed ? (
                                      <button 
                                        onClick={async () => {
                                          await updateDoc(doc(db, 'profiles', user.uid), { 
                                            dismissedUsers: arrayRemove(p.userId) 
                                          });
                                        }}
                                        className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-xs font-bold"
                                        title={lang === 'es' ? 'Mostrar usuario' : 'Show user'}
                                      >
                                        <Eye size={14} />
                                      </button>
                                    ) : (
                                      <>
                                        <button 
                                          onClick={() => setSelectedUserProfile(p)}
                                          className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold"
                                          title={lang === 'es' ? 'Ver perfil' : 'View profile'}
                                        >
                                          <Eye size={14} />
                                        </button>
                                        
                                        <button 
                                          onClick={() => {
                                            setSelectedUserForMessage(p);
                                            setShowNewMessageModal(true);
                                          }}
                                          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold"
                                          title={t.send_message}
                                        >
                                          <MessageSquare size={14} />
                                        </button>
                                        
                                        {isFriend ? (
                                          <button 
                                            onClick={() => removeFriend(p.userId)}
                                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
                                            title={t.remove_friend}
                                          >
                                            <UserMinus size={14} />
                                          </button>
                                        ) : hasSentRequest ? (
                                          <button 
                                            onClick={() => {
                                              const request = sentFriendRequests.find(req => req.receiverId === p.userId);
                                              if (request) cancelFriendRequest(request.id);
                                            }}
                                            className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-xs font-bold"
                                            title={t.request_sent}
                                          >
                                            <Clock size={14} />
                                          </button>
                                        ) : (
                                          <button 
                                            onClick={() => sendFriendRequest(p.userId, p.name)}
                                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold"
                                            title={t.send_request}
                                          >
                                            <UserPlus size={14} />
                                          </button>
                                        )}
                                        
                                        <button 
                                          onClick={async () => {
                                            await updateDoc(doc(db, 'profiles', user.uid), { 
                                              dismissedUsers: arrayUnion(p.userId) 
                                            });
                                          }}
                                          className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl text-xs font-bold"
                                          title={t.dismiss_user}
                                        >
                                          <EyeOff size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Resumen rápido de amigos */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">{friendsList.length} {t.friends}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">{followersList.length} {t.followers_list}</p>
                        </div>
                        <button 
                          onClick={() => setShowFriendsSection(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                        >
                          {t.find_friends}
                        </button>
                      </div>
                      
                      {/* Mostrar algunos amigos */}
                      {friendsList.length > 0 ? (
                        <div className="flex -space-x-3">
                          {friendsList.slice(0, 5).map(friend => (
                            <img 
                              key={friend.userId}
                              src={friend.profilePic || 'https://via.placeholder.com/40'} 
                              className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 object-cover cursor-pointer hover:scale-110 transition-all"
                              onClick={() => setSelectedUserProfile(friend)}
                              title={friend.name}
                            />
                          ))}
                          {friendsList.length > 5 && (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                              +{friendsList.length - 5}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-400 dark:text-gray-400">{t.no_friends_yet}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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

                {/* Muro de publicaciones con interacciones */}
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
                      {wallPosts.map((post) => {
                        const hasLiked = post.likesBy?.includes(user?.uid) || false;
                        const postComments = wallPostComments[post.id] || [];
                        const isSaved = savedPostsList.includes(post.id);
                        
                        return (
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
                              <button 
                                onClick={() => toggleSavedPost(post.id)}
                                className={`p-1 ${
                                  isSaved 
                                    ? 'text-yellow-500' 
                                    : 'text-slate-400 hover:text-yellow-500'
                                }`}
                                title={isSaved ? t.remove_saved_post : t.save_post}
                              >
                                <Bookmark size={18} className={isSaved ? 'fill-yellow-400' : ''} />
                              </button>
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
                                    <img src={post.bookThumbnail} className="w-12 h-16 object-contain rounded-lg bg-white" />
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
                            
                            {/* Interacciones: Like y Comentarios */}
                            <div className="pt-4 border-t border-slate-100 dark:border-gray-700">
                              <div className="flex items-center gap-4 mb-4">
                                <button 
                                  onClick={() => likeWallPost(post.id, post.likes || 0, post.likesBy || [])}
                                  className={`flex items-center gap-1 transition-colors ${hasLiked ? 'text-red-500' : 'text-slate-500 dark:text-gray-400 hover:text-red-500'}`}
                                >
                                  <Heart size={16} className={hasLiked ? "fill-red-500" : ""} />
                                  <span className="text-xs">{post.likes || 0}</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    // Expandir/contraer comentarios
                                    const commentInput = document.getElementById(`comment-input-${post.id}`);
                                    if (commentInput) {
                                      commentInput.focus();
                                    }
                                  }}
                                  className="flex items-center gap-1 text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                                >
                                  <MessageSquare size={16} />
                                  <span className="text-xs">{postComments.length}</span>
                                </button>
                              </div>
                              
                              {/* Comentarios */}
                              {postComments.length > 0 && (
                                <div className="space-y-3 mb-4">
                                  {postComments.slice(0, 3).map(comment => (
                                    <div key={comment.id} className="flex items-start gap-2">
                                      <img src={comment.userPic || 'https://via.placeholder.com/30'} className="w-6 h-6 rounded-full mt-1" />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold">{comment.userName}</span>
                                          <span className="text-[10px] text-slate-400">
                                            {new Date(comment.timestamp?.seconds * 1000).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-gray-300 mt-1">{comment.text}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {postComments.length > 3 && (
                                    <p className="text-xs text-slate-400 text-center">
                                      {lang === 'es' ? `Ver ${postComments.length - 3} comentarios más` : `View ${postComments.length - 3} more comments`}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {/* Input para nuevo comentario */}
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder={lang === 'es' ? "Escribe un comentario..." : "Write a comment..."}
                                  value={commentInputs[post.id] || ''}
                                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && commentInputs[post.id]?.trim()) {
                                      addWallPostComment(post.id, commentInputs[post.id]);
                                    }
                                  }}
                                  id={`comment-input-${post.id}`}
                                  className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none ${
                                    theme === 'dark' 
                                      ? 'bg-gray-700 text-gray-100 border-gray-600' 
                                      : theme === 'sunset' 
                                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                      : 'bg-slate-50 text-slate-900 border-slate-200'
                                  } border`}
                                />
                                <button 
                                  onClick={() => addWallPostComment(post.id, commentInputs[post.id] || '')}
                                  disabled={!commentInputs[post.id]?.trim()}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold ${
                                    !commentInputs[post.id]?.trim()
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  }`}
                                >
                                  {t.save}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PERFIL PROPIO - MEJORADO */}
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
                  
                  {/* Nombre y nivel CON SÍMBOLO */}
                  <h2 className="text-2xl font-black tracking-tight">{userProfile.name}</h2>
                  {userProfile.email && (
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{userProfile.email}</p>
                  )}
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-2 tracking-[0.2em]">
                    {getLevelTitle(userProfile.readCount, lang)} 
                    <img src={getLevelSymbol(userProfile.readCount)} className="w-6 h-6 object-contain inline-block ml-2" alt="Nivel" />
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
                  
                  {/* Información de seguimiento */}
                  <div className="mt-4 flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-xs font-bold">{userProfile.following?.length || 0}</p>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400">{t.following}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-gray-700"></div>
                    <div className="text-center">
                      <p className="text-xs font-bold">{friendsList.length}</p>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400">{t.friends}</p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción del perfil */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={inviteWhatsApp}
                    className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'sunset' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-white hover:bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border} shadow-sm flex flex-col items-center justify-center transition-all`}
                  >
                    <UserPlus size={24} className="text-indigo-600 dark:text-indigo-400 mb-2" />
                    <span className="text-xs font-bold">{t.invite}</span>
                  </button>
                  
                  <button 
                    onClick={handleLogout}
                    className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'sunset' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-white hover:bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border} shadow-sm flex flex-col items-center justify-center transition-all`}
                  >
                    <LogOut size={24} className="text-red-600 dark:text-red-400 mb-2" />
                    <span className="text-xs font-bold">{t.logout}</span>
                  </button>
                </div>

                {/* Insignias */}
                <div className={`${themeClasses.card} p-6 rounded-[2.5rem] border ${themeClasses.border} shadow-sm space-y-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{t.badges_title}</h3>
                    <span className="text-xs text-slate-400 dark:text-gray-400">
                      {userProfile.badges?.length || 0}/20
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(BADGE_DEFS).slice(0, 8).map(([id, badge]) => (
                      <div 
                        key={id} 
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center relative ${
                          userProfile.badges?.includes(parseInt(id)) 
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700' 
                            : 'bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600'
                        }`}
                        title={`${badge.name}: ${badge.desc}`}
                      >
                        <Trophy size={20} className={
                          userProfile.badges?.includes(parseInt(id)) 
                            ? 'text-yellow-600 dark:text-yellow-300' 
                            : 'text-slate-300 dark:text-gray-500'
                        } />
                        <span className="text-[8px] font-black mt-1">{badge.name}</span>
                        
                        {/* Barra de progreso para insignias no obtenidas */}
                        {!userProfile.badges?.includes(parseInt(id)) && badgeProgress[id] && (
                          <div className="absolute bottom-1 left-2 right-2 h-1 bg-slate-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-700" 
                              style={{ width: `${badgeProgress[id]}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {userProfile.badges?.length === 0 && (
                    <p className="text-center text-xs text-slate-400 dark:text-gray-400 py-4">
                      {lang === 'es' ? 'Gana insignias leyendo libros' : 'Earn badges by reading books'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* NAVEGACIÓN INFERIOR */}
      <nav className={`fixed bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-white'} border-t ${themeClasses.border} p-4 z-40`}>
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-2">
          <button 
            onClick={() => {setActiveTab('library'); setSelectedUserProfile(null); setShowWriters(false); setShowFriendsSection(false); setShowMessages(false);}}
            className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeTab === 'library' ? (theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : theme === 'sunset' ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white') : (theme === 'dark' ? 'text-gray-400' : 'text-slate-400')}`}
          >
            <Layout size={20} />
            <span className="text-[10px] font-black uppercase mt-1">{t.library}</span>
          </button>
          
          <button 
            onClick={() => {setActiveTab('search'); setSelectedUserProfile(null); setShowWriters(false); setShowFriendsSection(false); setShowMessages(false);}}
            className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeTab === 'search' ? (theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : theme === 'sunset' ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white') : (theme === 'dark' ? 'text-gray-400' : 'text-slate-400')}`}
          >
            <Search size={20} />
            <span className="text-[10px] font-black uppercase mt-1">{t.search}</span>
          </button>
          
          <button 
            onClick={() => {setActiveTab('social'); setSelectedUserProfile(null); setShowWriters(false); setShowFriendsSection(false); setShowMessages(false);}}
            className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeTab === 'social' ? (theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : theme === 'sunset' ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white') : (theme === 'dark' ? 'text-gray-400' : 'text-slate-400')}`}
          >
            <Globe size={20} />
            <span className="text-[10px] font-black uppercase mt-1">{t.social}</span>
          </button>
          
          <button 
            onClick={() => {setActiveTab('profile'); setSelectedUserProfile(null); setShowWriters(false); setShowFriendsSection(false); setShowMessages(false);}}
            className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeTab === 'profile' ? (theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : theme === 'sunset' ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white') : (theme === 'dark' ? 'text-gray-400' : 'text-slate-400')}`}
          >
            <User size={20} />
            <span className="text-[10px] font-black uppercase mt-1">{t.profile}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
