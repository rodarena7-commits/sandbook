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
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { 
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { 
  BookOpen, Search, Trophy, Plus, CheckCircle, Layout, User, Award, Loader2, PenTool, Globe, Camera, MessageSquare, Send, X, ChevronDown, ChevronUp, ChevronRight, Settings, Edit3, ListChecks, Lock, Flag, Sparkles, Star, Upload, Book as BookIcon, AlertCircle, Calendar, FileText, Info, Maximize2, Minimize2, UserPlus, UserCheck, Users, Trash2, Facebook, Languages, Share2, UserX, MessageCircle, StickyNote, Barcode, Library, Heart, ArrowLeft, Moon, Sun, Sunset, LogIn, LogOut, MessageSquarePlus, Eye, EyeOff, Bell, ThumbsUp, ThumbsDown, Bookmark, Quote, PenLine, TrendingUp, Clock, Flame, Target, Hash, Mic, Filter, MapPin, UserMinus, Shield, Mail, Phone, Home, HelpCircle, Download, ChevronLeft, ZoomIn, ZoomOut, Handshake, Edit, MoreVertical
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
    search_in_my_books: "Buscar en mis libros...",
    following_list: "Siguiendo",
    followers_list_full: "Seguidores",
    mutual_friends: "Amigos mutuos",
    more_by_author: "Más del mismo autor",
    similar_books: "Libros similares",
    recommended_books: "Recomendaciones",
    load_more: "Cargar más",
    click_to_zoom: "Haz clic para ampliar",
    zoom_image: "Ampliar imagen",
    close: "Cerrar",
    download: "Descargar",
    borrow_book: "Pedir prestado",
    borrow_request_sent: "Solicitud de préstamo enviada",
    reading_progress: "Progreso de lectura",
    current_day: "Día actual",
    days_completed: "días completados",
    total_days: "días totales",
    started_on: "Comenzó el",
    edit_post: "Editar publicación",
    delete_post: "Eliminar publicación",
    make_public: "Hacer pública",
    make_private: "Hacer privada",
    post_options: "Opciones",
    confirm_delete_post: "¿Eliminar publicación?",
    confirm_delete_post_desc: "Esta acción no se puede deshacer.",
    badge_locked: "Insignia bloqueada",
    badge_unlocked: "¡Insignia desbloqueada!",
    badge_requirement: "Requisito",
    badge_progress: "Progreso",
    view_profile: "Ver perfil",
    view_book_details: "Ver detalles del libro"
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
    search_in_my_books: "Search in my books...",
    following_list: "Following",
    followers_list_full: "Followers",
    mutual_friends: "Mutual friends",
    more_by_author: "More by this author",
    similar_books: "Similar books",
    recommended_books: "Recommendations",
    load_more: "Load more",
    click_to_zoom: "Click to zoom",
    zoom_image: "Zoom image",
    close: "Close",
    download: "Download",
    borrow_book: "Borrow book",
    borrow_request_sent: "Borrow request sent",
    reading_progress: "Reading progress",
    current_day: "Current day",
    days_completed: "days completed",
    total_days: "total days",
    started_on: "Started on",
    edit_post: "Edit post",
    delete_post: "Delete post",
    make_public: "Make public",
    make_private: "Make private",
    post_options: "Options",
    confirm_delete_post: "Delete post?",
    confirm_delete_post_desc: "This action cannot be undone.",
    badge_locked: "Badge locked",
    badge_unlocked: "Badge unlocked!",
    badge_requirement: "Requirement",
    badge_progress: "Progress",
    view_profile: "View profile",
    view_book_details: "View book details"
  }
};

const BADGE_DEFS = {
  1: { name: "Velocista", desc: "Al libro más rápido en leer", requirement: { type: 'fastest_book', value: 1 } },
  2: { name: "Titán", desc: "Al libro más largo leído", requirement: { type: 'longest_book', value: 1 } },
  3: { name: "Inicio", desc: "Al leer tu primer libro", requirement: { type: 'read_count', value: 1 } },
  4: { name: "Rayo", desc: "Leer un libro en un día", requirement: { type: 'one_day_book', value: 1 } },
  5: { name: "Semana", desc: "Leer un libro en una semana", requirement: { type: 'one_week_book', value: 1 } },
  6: { name: "Mes", desc: "Leer un libro en un mes", requirement: { type: 'one_month_book', value: 1 } },
  7: { name: "Diez", desc: "Por leer 10 libros", requirement: { type: 'read_count', value: 10 } },
  8: { name: "Perfecto", desc: "Cumplir meta sin saltear días", requirement: { type: 'perfect_plan', value: 1 } },
  9: { name: "Veinte", desc: "20 libros en un año", requirement: { type: 'yearly_books', value: 20 } },
  10: { name: "Treinta", desc: "30 libros en un año", requirement: { type: 'yearly_books', value: 30 } },
  11: { name: "Cincuenta", desc: "50 libros en total", requirement: { type: 'read_count', value: 50 } },
  12: { name: "Cien", desc: "100 libros en total", requirement: { type: 'read_count', value: 100 } },
  13: { name: "Oro Anual", desc: "50 libros en un año", requirement: { type: 'yearly_books', value: 50 } },
  14: { name: "Scan 10", desc: "10 libros escaneados", requirement: { type: 'scan_count', value: 10 } },
  15: { name: "Scan 20", desc: "20 libros escaneados", requirement: { type: 'scan_count', value: 20 } },
  16: { name: "Scan 30", desc: "30 libros escaneados", requirement: { type: 'scan_count', value: 30 } },
  17: { name: "Scan 40", desc: "40 libros escaneados", requirement: { type: 'scan_count', value: 40 } },
  18: { name: "Scan 50", desc: "50 libros escaneados", requirement: { type: 'scan_count', value: 50 } },
  19: { name: "Scan 100", desc: "100 libros escaneados", requirement: { type: 'scan_count', value: 100 } },
  20: { name: "Maestro", desc: "Cumplir 19 insignias", requirement: { type: 'total_badges', value: 19 } }
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

const getLevelSymbol = (count = 0) => {
  if (count >= 2100) return "/btc.png";
  if (count >= 1000) return "/diamante.png";
  if (count >= 500) return "/oro.png";
  if (count >= 100) return "/plata.png";
  if (count >= 50) return "/cobre.png";
  if (count >= 25) return "/vidrio.png";
  if (count >= 10) return "/madera.png";
  if (count >= 1) return "/piedra.png";
  return "/papel.png";
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
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.src = imageDataUrl;
  });
};

// --- FUNCIÓN PARA VERIFICAR SI LA IMAGEN ESTÁ EN BLANCO ---
const isImageBlank = (imgElement) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let whitePixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 250 && data[i+1] > 250 && data[i+2] > 250) {
        whitePixels++;
      }
    }
    
    const totalPixels = canvas.width * canvas.height;
    const whitePercentage = (whitePixels / totalPixels) * 100;
    
    resolve(whitePercentage > 98);
  });
};

// --- FUNCIÓN PRIORIZADA: BUSCAR PORTADA (Open Library primero, luego Google Books) ---
const getBestCoverForBook = async (bookId, bookData = null, lang = 'es') => {
  // 1. Portada de la comunidad (mantenemos por si hay, pero ya no la sugeriremos)
  if (window.communityCovers && window.communityCovers[bookId]?.thumbnail) {
    return {
      url: window.communityCovers[bookId].thumbnail,
      source: 'community',
      uploader: window.communityCovers[bookId].uploadedByName
    };
  }
  
  // 2. OPEN LIBRARY (PRIMERO) - Búsqueda por ISBN
  const isbn = bookData?.volumeInfo?.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier || 
              bookData?.isbn;
  const title = bookData?.volumeInfo?.title || bookData?.title;
  const authors = bookData?.volumeInfo?.authors || bookData?.authors || [];
  
  try {
    // Intentar primero por ISBN
    if (isbn) {
      const cleanIsbn = isbn.replace(/\D/g, '');
      const langParam = lang === 'es' ? '&lang=es' : '';
      const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data${langParam}`;
      const res = await fetch(olUrl);
      const data = await res.json();
      const bookDataOL = data[`ISBN:${cleanIsbn}`];
      
      if (bookDataOL?.cover?.large) {
        return {
          url: bookDataOL.cover.large,
          source: 'openlibrary'
        };
      }
    }
    
    // Si no hay ISBN o no encontró, buscar por título + autor
    if (title) {
      const langParam = lang === 'es' ? '&lang=es' : '';
      let searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=5${langParam}`;
      
      if (authors.length > 0) {
        searchUrl += `&author=${encodeURIComponent(authors[0])}`;
      }
      
      const res = await fetch(searchUrl);
      const data = await res.json();
      
      if (data.docs && data.docs.length > 0) {
        for (const doc of data.docs) {
          if (doc.cover_i) {
            return {
              url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
              source: 'openlibrary'
            };
          }
        }
      }
    }
  } catch (error) {
    console.error("Error buscando en Open Library:", error);
  }
  
  // 3. GOOGLE BOOKS (SEGUNDO) - Solo si Open Library falló
  if (bookData?.volumeInfo?.imageLinks?.thumbnail) {
    return {
      url: bookData.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:'),
      source: 'google'
    };
  }
  
  // 4. Por defecto
  return {
    url: 'https://via.placeholder.com/150x200?text=NO+COVER',
    source: 'default'
  };
};

// --- COMPONENTE PARA ZOOM DE PORTADA ---
const CoverZoomModal = ({ imageUrl, title, onClose, t }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portada-${title || 'libro'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando imagen:", error);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          title={t.zoom_image}
        >
          <ZoomIn size={24} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          title={t.zoom_image}
        >
          <ZoomOut size={24} />
        </button>
        <button
          onClick={handleDownload}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          title={t.download}
        >
          <Download size={24} />
        </button>
        <button
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          title={t.close}
        >
          <X size={24} />
        </button>
      </div>
      
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt={title}
          className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          draggable={false}
        />
      </div>
      
      <p className="absolute bottom-4 left-4 text-white/50 text-sm max-w-md truncate">
        {title}
      </p>
    </div>
  );
};

// --- COMPONENTE PARA PORTADA DE LIBRO EN MODAL ---
const BookCoverDisplay = ({ bookId, bookData, theme, myBooks, lang, onZoom, onClick }) => {
  const [coverInfo, setCoverInfo] = useState({ url: 'https://via.placeholder.com/150x200?text=NO+COVER', source: 'default' });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadCover = async () => {
      setIsLoading(true);
      
      // 1. Portada en mis libros
      const userBook = myBooks?.find(b => b.bookId === bookId);
      if (userBook?.thumbnail && userBook.thumbnail.startsWith('https://')) {
        setCoverInfo({ url: userBook.thumbnail, source: 'user' });
        setIsLoading(false);
        return;
      }
      
      // 2. OPEN LIBRARY (PRIMERO)
      const cover = await getBestCoverForBook(bookId, bookData, lang);
      setCoverInfo(cover);
      setIsLoading(false);
    };
    loadCover();
  }, [bookId, bookData, myBooks, lang]);
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (onZoom && coverInfo.url && !coverInfo.url.includes('placeholder')) {
      onZoom(coverInfo.url, bookData?.volumeInfo?.title || bookData?.title);
    }
  };
  
  return (
    <>
      <img 
        src={coverInfo.url} 
        className={`absolute -bottom-12 left-8 w-28 h-40 object-contain rounded-2xl shadow-2xl border-4 border-white bg-white transition-transform hover:scale-105 ${onClick || onZoom ? 'cursor-pointer' : ''}`}
        style={{ filter: isLoading ? 'blur(8px)' : 'none' }}
        onClick={handleClick}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/150x200?text=NO+COVER';
        }}
      />
      {coverInfo.source === 'openlibrary' && (
        <div className="absolute -bottom-8 left-24 bg-blue-600 text-white text-[8px] font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
          OL
        </div>
      )}
      {coverInfo.source === 'google' && (
        <div className="absolute -bottom-8 left-24 bg-red-600 text-white text-[8px] font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
          G
        </div>
      )}
      {onZoom && coverInfo.source !== 'default' && (
        <div className="absolute -bottom-8 left-8 bg-black/50 text-white text-[8px] font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
          <ZoomIn size={10} />
        </div>
      )}
    </>
  );
};

// --- COMPONENTE PARA PORTADA EN RESULTADOS DE BÚSQUEDA ---
const SearchBookCover = ({ book, alreadyHave, t, lang, onViewDetails }) => {
  const [coverInfo, setCoverInfo] = useState({ url: 'https://via.placeholder.com/150x200?text=NO+COVER', source: 'default' });
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);
  
  useEffect(() => {
    const loadCover = async () => {
      setIsLoading(true);
      
      if (alreadyHave?.thumbnail) {
        setCoverInfo({ url: alreadyHave.thumbnail, source: 'user' });
        setIsLoading(false);
        return;
      }
      
      const cover = await getBestCoverForBook(book.id, book, lang);
      setCoverInfo(cover);
      setIsLoading(false);
    };
    loadCover();
  }, [book.id, alreadyHave, lang]);
  
  useEffect(() => {
    const checkIfBlank = async () => {
      if (imgRef.current && coverInfo.source === 'google' && !coverInfo.url.includes('placeholder')) {
        const blank = await isImageBlank(imgRef.current);
        if (blank) {
          const openLibraryCover = await getBestCoverForBook(book.id, book, lang);
          if (openLibraryCover.source === 'openlibrary') {
            setCoverInfo(openLibraryCover);
          }
        }
      }
    };
    
    if (imgRef.current && coverInfo.url) {
      const img = new Image();
      img.src = coverInfo.url;
      img.onload = () => {
        if (imgRef.current) {
          imgRef.current.src = coverInfo.url;
          checkIfBlank();
        }
      };
    }
  }, [coverInfo.url, book.id, book, lang]);
  
  return (
    <div className="relative">
      <img 
        ref={imgRef}
        src={coverInfo.url} 
        className={`w-24 h-36 object-contain rounded-2xl shadow-md cursor-pointer hover:scale-105 transition-all bg-white ${isLoading ? 'animate-pulse' : ''}`}
        style={{ filter: isLoading ? 'blur(4px)' : 'none' }}
        onClick={() => onViewDetails(book)}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/150x200?text=NO+COVER';
        }}
      />
      {coverInfo.source === 'google' && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
          G
        </div>
      )}
      {coverInfo.source === 'openlibrary' && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
          OL
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PARA MOSTRAR PROGRESO DE LECTURA DE OTRO USUARIO ---
const UserReadingProgress = ({ book, theme, t }) => {
  if (book.status !== 'reading' || !book.checkpoints || book.checkpoints.length === 0) return null;
  
  const completedDays = book.checkpoints.filter(cp => cp.completed).length;
  const totalDays = book.checkpoints.length;
  const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  
  // Calcular el día actual basado en la fecha
  let currentDay = null;
  if (book.planStartDate) {
    const startDate = new Date(book.planStartDate);
    const today = new Date();
    const diffTime = today - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    currentDay = Math.min(Math.max(diffDays + 1, 1), totalDays);
  }
  
  return (
    <div className={`mt-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">
          {t.reading_progress}
        </span>
        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
          {progress}%
        </span>
      </div>
      
      <div className="h-1.5 bg-slate-200 dark:bg-gray-600 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-indigo-500 transition-all duration-700" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-500 dark:text-gray-400">
          {completedDays} {t.days_completed} / {totalDays} {t.total_days}
        </span>
        {currentDay && (
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {t.current_day}: {currentDay}
          </span>
        )}
      </div>
      
      {book.planStartDate && (
        <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-2">
          {t.started_on}: {new Date(book.planStartDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};


// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('es');
  const t = i18n[lang];
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
    theme: 'dark',
    likes: [],
    dislikes: [],
    friendRequests: [],
    sentRequests: [],
    isGoogleUser: false,
    isAnonymous: true,
    favoriteWriters: [],
    savedPosts: []
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

  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedUserBooks, setSelectedUserBooks] = useState([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');

  const [theme, setTheme] = useState('dark');

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

  const [showFriendsSection, setShowFriendsSection] = useState(false);
  const [friendsSearch, setFriendsSearch] = useState('');
  const [friendsFilter, setFriendsFilter] = useState('all');
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentFriendRequests, setSentFriendRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [mutualFriendsList, setMutualFriendsList] = useState([]);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showMutualFriendsModal, setShowMutualFriendsModal] = useState(false);

  const [wallPostComments, setWallPostComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const [showGoogleLens, setShowGoogleLens] = useState(false);

  const [currentPageInputs, setCurrentPageInputs] = useState({});

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const [badgeProgress, setBadgeProgress] = useState({});

  const [showMessages, setShowMessages] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeMessages, setActiveMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState(null);
  const [messageSearch, setMessageSearch] = useState('');

  const [viewingReadBooks, setViewingReadBooks] = useState(false);
  const [readBooksList, setReadBooksList] = useState([]);

  const [showFavoriteWriters, setShowFavoriteWriters] = useState(false);
  const [favoriteWritersList, setFavoriteWritersList] = useState([]);

  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [savedPostsList, setSavedPostsList] = useState([]);

  const [globalLikes, setGlobalLikes] = useState({});

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const [showWelcomeVideo, setShowWelcomeVideo] = useState(true);

  const [requireGoogleLogin, setRequireGoogleLogin] = useState(false);

  const [librarySearch, setLibrarySearch] = useState('');

  // --- NUEVOS ESTADOS PARA PRÉSTAMOS ---
  const [borrowRequests, setBorrowRequests] = useState({});
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [bookToBorrow, setBookToBorrow] = useState(null);

  // --- NUEVOS ESTADOS PARA ZOOM DE PORTADA ---
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomTitle, setZoomTitle] = useState('');

  // --- NUEVOS ESTADOS PARA OPEN LIBRARY Y RECOMENDACIONES ---
  const [authorRecommendations, setAuthorRecommendations] = useState([]);
  const [genreRecommendations, setGenreRecommendations] = useState([]);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [currentRecommendationPage, setCurrentRecommendationPage] = useState({
    author: 0,
    genre: 0,
    similar: 0
  });

  // --- NUEVOS ESTADOS PARA FUNCIONALIDADES SOLICITADAS ---
  // Estados para editar/eliminar posts
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [postToDelete, setPostToDelete] = useState(null);
  const [showPostOptions, setShowPostOptions] = useState(null);
  
  // Estados para modales de perfil y libro
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [userProfileModalData, setUserProfileModalData] = useState(null);
  const [showBookDetailModal, setShowBookDetailModal] = useState(false);
  const [bookDetailData, setBookDetailData] = useState(null);
  
  // Estados para insignias
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const victoryAudio = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"));
  const videoRef = useRef(null);
  const notificationsModalRef = useRef(null);

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
      default:
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

  // --- FUNCIÓN PRIORIZADA: BUSCAR PORTADA (Open Library primero, luego Google Books) ---
  const getBestCoverForBook = async (bookId, bookData = null, langParam = lang) => {
    // 1. Portada en mis libros
    const userBook = myBooks.find(b => b.bookId === bookId);
    if (userBook?.thumbnail && userBook.thumbnail.startsWith('https://')) {
      return {
        url: userBook.thumbnail,
        source: 'user'
      };
    }
    
    // 2. OPEN LIBRARY (PRIMERO)
    const isbn = bookData?.volumeInfo?.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier || 
                bookData?.isbn;
    const title = bookData?.volumeInfo?.title || bookData?.title;
    const authors = bookData?.volumeInfo?.authors || bookData?.authors || [];
    
    try {
      if (isbn) {
        const cleanIsbn = isbn.replace(/\D/g, '');
        const langParamStr = langParam === 'es' ? '&lang=es' : '';
        const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data${langParamStr}`;
        const res = await fetch(olUrl);
        const data = await res.json();
        const bookDataOL = data[`ISBN:${cleanIsbn}`];
        
        if (bookDataOL?.cover?.large) {
          return {
            url: bookDataOL.cover.large,
            source: 'openlibrary'
          };
        }
      }
      
      if (title) {
        const langParamStr = langParam === 'es' ? '&lang=es' : '';
        let searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=5${langParamStr}`;
        
        if (authors.length > 0) {
          searchUrl += `&author=${encodeURIComponent(authors[0])}`;
        }
        
        const res = await fetch(searchUrl);
        const data = await res.json();
        
        if (data.docs && data.docs.length > 0) {
          for (const doc of data.docs) {
            if (doc.cover_i) {
              return {
                url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
                source: 'openlibrary'
              };
            }
          }
        }
      }
    } catch (error) {
      console.error("Error buscando en Open Library:", error);
    }
    
    // 3. GOOGLE BOOKS (SEGUNDO)
    if (bookData?.volumeInfo?.imageLinks?.thumbnail) {
      return {
        url: bookData.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:'),
        source: 'google'
      };
    }
    
    // 4. Por defecto
    return {
      url: 'https://via.placeholder.com/150x200?text=NO+COVER',
      source: 'default'
    };
  };

  const searchBooksByAuthor = async (author, limit = 20) => {
    if (!author) return [];
    try {
      const langParam = lang === 'es' ? '&lang=es' : '';
      const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=${limit}${langParam}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.docs
        .filter(book => book.title && book.key)
        .map(book => ({
          id: book.key.replace('/works/', ''),
          title: book.title,
          authors: [author],
          coverId: book.cover_i,
          thumbnail: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
          firstPublishYear: book.first_publish_year,
          isbn: book.isbn?.[0]
        }));
    } catch (error) {
      console.error("Error buscando libros por autor:", error);
      return [];
    }
  };

  const searchSimilarBooks = async (title, subjects = [], limit = 20) => {
    try {
      let query = '';
      const langParam = lang === 'es' ? '&lang=es' : '';
      
      if (subjects && subjects.length > 0) {
        const subject = subjects[0];
        query = `subject:${encodeURIComponent(subject)}`;
      } else {
        const keywords = title
          .split(' ')
          .filter(word => word.length > 3)
          .slice(0, 3)
          .join(' ');
        query = encodeURIComponent(keywords);
      }
      
      const url = `https://openlibrary.org/search.json?q=${query}&limit=${limit}${langParam}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.docs
        .filter(book => book.title && book.key && book.title !== title)
        .slice(0, 15)
        .map(book => ({
          id: book.key.replace('/works/', ''),
          title: book.title,
          authors: book.author_name || ['Desconocido'],
          coverId: book.cover_i,
          thumbnail: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
          firstPublishYear: book.first_publish_year,
          subjects: book.subject || []
        }));
    } catch (error) {
      console.error("Error buscando libros similares:", error);
      return [];
    }
  };

  const loadBookRecommendations = async (book) => {
    if (!book) return;
    setLoadingRecommendations(true);
    const bookTitle = book.volumeInfo?.title || book.title;
    const bookAuthors = book.volumeInfo?.authors || book.authors || [];
    const bookSubjects = book.volumeInfo?.categories || book.categories || [];
    
    try {
      if (bookAuthors.length > 0) {
        const authorBooks = await searchBooksByAuthor(bookAuthors[0], 30);
        const filteredAuthorBooks = authorBooks.filter(b => 
          b.title !== bookTitle && 
          !myBooks.some(mb => mb.bookId === b.id)
        );
        setAuthorRecommendations(filteredAuthorBooks);
      }
      
      const similar = await searchSimilarBooks(bookTitle, bookSubjects, 30);
      const filteredSimilar = similar.filter(b => 
        b.title !== bookTitle && 
        !myBooks.some(mb => mb.bookId === b.id) &&
        !authorRecommendations.some(ab => ab.id === b.id)
      );
      setSimilarBooks(filteredSimilar);
      
      if (bookTitle) {
        const genreBooks = await searchSimilarBooks(bookTitle, bookSubjects.slice(0, 5), 30);
        const filteredGenre = genreBooks.filter(b => 
          b.title !== bookTitle && 
          !myBooks.some(mb => mb.bookId === b.id) &&
          !authorRecommendations.some(ab => ab.id === b.id) &&
          !similar.some(sb => sb.id === b.id)
        );
        setGenreRecommendations(filteredGenre);
      }
    } catch (error) {
      console.error("Error cargando recomendaciones:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchWithRetry = async (url, retries = 3, delay = 2000) => {
    const res = await fetch(url);
    if (res.status === 429 && retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, retries - 1, delay * 2);
    }
    return res;
  };

  const calculateBadgeProgress = () => {
    if (!userProfile) return {};
    const progress = {};
    const readCount = userProfile.readCount || 0;
    const scanCount = userProfile.scanCount || 0;
    progress[1] = Math.min(readCount >= 1 ? 100 : 0, 100);
    progress[2] = Math.min(readCount >= 1 ? 100 : 0, 100);
    progress[3] = Math.min(readCount >= 1 ? 100 : 0, 100);
    progress[4] = Math.min(readCount >= 1 ? 100 : 0, 100);
    progress[5] = Math.min(readCount >= 1 ? 100 : 0, 100);
    progress[6] = Math.min(readCount >= 1 ? 100 : 0, 100);
    progress[7] = Math.min((readCount / 10) * 100, 100);
    progress[8] = Math.min(readCount >= 1 ? 100 : 0, 100);
    progress[9] = Math.min((readCount / 20) * 100, 100);
    progress[10] = Math.min((readCount / 30) * 100, 100);
    progress[11] = Math.min((readCount / 50) * 100, 100);
    progress[12] = Math.min((readCount / 100) * 100, 100);
    progress[13] = Math.min((readCount / 50) * 100, 100);
    progress[14] = Math.min((scanCount / 10) * 100, 100);
    progress[15] = Math.min((scanCount / 20) * 100, 100);
    progress[16] = Math.min((scanCount / 30) * 100, 100);
    progress[17] = Math.min((scanCount / 40) * 100, 100);
    progress[18] = Math.min((scanCount / 50) * 100, 100);
    progress[19] = Math.min((scanCount / 100) * 100, 100);
    progress[20] = Math.min((userProfile.badges?.length || 0) / 19 * 100, 100);
    return progress;
  };

  const searchMoreBooksByAuthor = async (authorName, page = 0) => {
    try {
      setMoreBooksLoading(true);
      const langParam = lang === 'es' ? '&lang=es' : '';
      let url = `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&limit=20&page=${page + 1}${langParam}`;
      const res = await fetchWithRetry(url);
      const data = await res.json();
      
      if (data.docs) {
        const newBooks = data.docs
          .filter(book => book.title && book.key)
          .map(book => ({
            id: book.key.replace('/works/', ''),
            volumeInfo: {
              title: book.title,
              authors: [authorName],
              description: book.first_sentence?.[0] || '',
              publishedDate: book.first_publish_year?.toString(),
              imageLinks: book.cover_i ? {
                thumbnail: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
              } : null
            }
          }));
        
        const uniqueBooks = newBooks.filter(newBook => 
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

  const fetchAuthorDetails = async (authorName) => {
    try {
      const wikiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(authorName)}`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const details = {
          name: authorName,
          biography: wikiData.extract || '',
          thumbnail: wikiData.thumbnail?.source || '',
          description: wikiData.description || '',
          extract: wikiData.extract || ''
        };
        if (wikiData.extract) {
          const birthMatch = wikiData.extract.match(/(\d{1,2} de [a-zA-Z]+ de \d{4})|(\d{4})/);
          if (birthMatch) {
            details.birthDate = birthMatch[0];
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

  const searchWithGoogle = (bookTitle) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(bookTitle)}+book`;
    window.open(searchUrl, '_blank');
  };

  const updateCurrentPage = async (bookId, currentPage) => {
    if (!user || !currentPage || isNaN(currentPage)) return;
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { 
      currentPage: parseInt(currentPage)
    });
    setCurrentPageInputs(prev => ({ ...prev, [bookId]: '' }));
  };

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
      setActiveMessages(messages);
    }, (error) => {
      console.error("Error cargando mensajes:", error);
    });
    return unsubscribe;
  };

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

  const loadFavoriteWriters = () => {
    if (!user) return;
    const favoritesQuery = collection(db, 'favoriteWriters');
    const unsubscribe = onSnapshot(favoritesQuery, (snapshot) => {
      const writers = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId === user.uid) {
          writers.push(data.authorName);
        }
      });
      setFavoriteWritersList(writers);
      setUserProfile(prev => ({ ...prev, favoriteWriters: writers }));
    });
    return unsubscribe;
  };

  const loadSavedPosts = () => {
    if (!user) return;
    const savedQuery = collection(db, 'savedPosts');
    const unsubscribe = onSnapshot(savedQuery, (snapshot) => {
      const savedPostIds = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId === user.uid) {
          savedPostIds.push(data.postId);
        }
      });
      setSavedPostsList(savedPostIds);
      setUserProfile(prev => ({ ...prev, savedPosts: savedPostIds }));
    });
    return unsubscribe;
  };

  const loadConversations = () => {
    if (!user) return;
    const conversationsQuery = collection(db, 'conversations');
    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const convos = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.participants?.includes(user.uid)) {
          convos.push({ id: doc.id, ...data });
        }
      });
      convos.sort((a, b) => {
        const timeA = a.lastMessageAt?.seconds || 0;
        const timeB = b.lastMessageAt?.seconds || 0;
        return timeB - timeA;
      });
      setConversations(convos);
    }, (error) => {
      console.error("Error cargando conversaciones:", error);
    });
    return unsubscribe;
  };

  const loadBorrowRequests = () => {
    if (!user) return;
    const borrowQuery = query(collection(db, 'borrowRequests'));
    const unsubscribe = onSnapshot(borrowQuery, (snapshot) => {
      const requests = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.bookId) {
          if (!requests[data.bookId]) requests[data.bookId] = [];
          requests[data.bookId].push({ id: doc.id, ...data });
        }
      });
      setBorrowRequests(requests);
    });
    return unsubscribe;
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
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

  const sendFriendRequestWithNotification = async (targetId, targetName) => {
    if (!user || user.uid === targetId) return;
    const existingRequest = sentFriendRequests.find(req => req.receiverId === targetId);
    if (existingRequest) {
      alert(lang === 'es' ? 'Ya enviaste una solicitud a este usuario' : 'You already sent a request to this user');
      return;
    }
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

  const acceptFriendRequestWithNotification = async (requestId, senderId, senderName) => {
    if (!user) return;
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
    await updateDoc(doc(db, 'profiles', user.uid), { 
      following: arrayUnion(senderId)
    });
    await updateDoc(doc(db, 'profiles', senderId), { 
      followersCount: increment(1),
      following: arrayUnion(user.uid)
    });
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

  const sendMessageWithNotification = async (receiverId, receiverName, messageText) => {
    if (!user || !receiverId || !messageText.trim()) return;
    const existingConversation = conversations.find(conv => 
      conv.participants.includes(user.uid) && conv.participants.includes(receiverId)
    );
    const conversationId = existingConversation?.id || doc(collection(db, 'conversations')).id;
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

  const sendBorrowRequest = async (book, ownerId, ownerName) => {
    if (!user || user.uid === ownerId) return;
    
    // Verificar si ya existe una solicitud pendiente
    const existingRequest = borrowRequests[book.bookId]?.find(
      req => req.borrowerId === user.uid && req.status === 'pending'
    );
    
    if (existingRequest) {
      alert(lang === 'es' ? 'Ya enviaste una solicitud de préstamo para este libro' : 'You already sent a borrow request for this book');
      return;
    }
    
    try {
      await addDoc(collection(db, 'borrowRequests'), {
        bookId: book.bookId,
        bookTitle: book.title,
        bookThumbnail: book.thumbnail,
        ownerId,
        ownerName,
        borrowerId: user.uid,
        borrowerName: userProfile.name,
        borrowerPic: userProfile.profilePic,
        status: 'pending',
        message: '',
        timestamp: serverTimestamp()
      });
      
      await createNotification(
        ownerId,
        'borrow_request',
        lang === 'es' ? 'Solicitud de préstamo' : 'Borrow request',
        lang === 'es' 
          ? `${userProfile.name} quiere pedir prestado "${book.title}"`
          : `${userProfile.name} wants to borrow "${book.title}"`,
        {
          bookId: book.bookId,
          bookTitle: book.title,
          borrowerId: user.uid,
          borrowerName: userProfile.name
        }
      );
      
      alert(lang === 'es' ? 'Solicitud de préstamo enviada' : 'Borrow request sent');
      setShowBorrowModal(false);
      setBookToBorrow(null);
    } catch (error) {
      console.error("Error enviando solicitud de préstamo:", error);
      alert(lang === 'es' ? 'Error al enviar la solicitud' : 'Error sending request');
    }
  };

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
        bookThumbnail: selectedBookForPost?.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || 
                     selectedBookForPost?.thumbnail || '',
        timestamp: serverTimestamp(),
        likes: 0,
        likesBy: [],
        comments: [],
        isPublic: true // Por defecto público
      };
      const postRef = await addDoc(collection(db, 'wallPosts'), postData);
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

  // --- FUNCIÓN PARA SINCRONIZAR LIBROS LEÍDOS AL ELIMINAR ---
  const syncReadBooksAfterDelete = async (deletedBookId) => {
    if (!user) return;
    const deletedBook = myBooks.find(b => b.bookId === deletedBookId);
    if (deletedBook?.status === 'read') {
      await updateDoc(doc(db, 'profiles', user.uid), { 
        readCount: increment(-1),
        readBooksList: arrayRemove(deletedBookId)
      });
    }
  };

  // --- NUEVAS FUNCIONES PARA EDITAR/ELIMINAR POSTS ---
  const editWallPost = async (postId, newContent) => {
    if (!user || !newContent.trim()) return;
    try {
      await updateDoc(doc(db, 'wallPosts', postId), {
        content: newContent,
        editedAt: serverTimestamp()
      });
      setEditingPost(null);
      setEditPostContent('');
      alert(lang === 'es' ? 'Publicación actualizada' : 'Post updated');
    } catch (error) {
      console.error("Error editando publicación:", error);
      alert(lang === 'es' ? 'Error al actualizar' : 'Error updating');
    }
  };

  const deleteWallPost = async (postId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'wallPosts', postId));
      // Eliminar comentarios asociados
      const commentsQuery = query(
        collection(db, 'wallPostComments'),
        where('postId', '==', postId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const batch = writeBatch(db);
      commentsSnapshot.docs.forEach(commentDoc => {
        batch.delete(commentDoc.ref);
      });
      await batch.commit();
      
      setPostToDelete(null);
      alert(lang === 'es' ? 'Publicación eliminada' : 'Post deleted');
    } catch (error) {
      console.error("Error eliminando publicación:", error);
      alert(lang === 'es' ? 'Error al eliminar' : 'Error deleting');
    }
  };

  const togglePostPrivacy = async (postId, currentPrivacy) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'wallPosts', postId), {
        isPublic: !currentPrivacy
      });
      alert(lang === 'es' 
        ? !currentPrivacy ? 'Publicación hecha pública' : 'Publicación hecha privada'
        : !currentPrivacy ? 'Post made public' : 'Post made private'
      );
    } catch (error) {
      console.error("Error cambiando privacidad:", error);
    }
  };

  // --- FUNCIÓN PARA MOSTRAR PERFIL DE USUARIO EN MODAL ---
  const openUserProfileModal = (userData) => {
    setUserProfileModalData(userData);
    setShowUserProfileModal(true);
  };

  // --- FUNCIÓN PARA MOSTRAR DETALLE DE LIBRO EN MODAL ---
  const openBookDetailModal = (bookData) => {
    setBookDetailData(bookData);
    setShowBookDetailModal(true);
  };

  // --- FUNCIÓN PARA MOSTRAR DETALLE DE INSIGNIA ---
  const openBadgeModal = (badgeId) => {
    setSelectedBadge({ id: badgeId, ...BADGE_DEFS[badgeId] });
    setShowBadgeModal(true);
  };

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      console.log('PWA instalada');
    });
    const welcomeVideoShown = localStorage.getItem('sandbook_welcome_video_shown');
    if (welcomeVideoShown) {
      setShowWelcomeVideo(false);
    }
    const tutorialShown = localStorage.getItem('sandbook_tutorial_shown');
    if (!tutorialShown) {
      setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
    }
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode";
    script.async = true;
    document.body.appendChild(script);
    return () => { 
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setIsAuthLoading(true);
      if (u) {
        setUser(u);
        if (u.isAnonymous) {
          setRequireGoogleLogin(true);
        } else {
          setRequireGoogleLogin(false);
        }
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
            theme: 'dark',
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
        loadNotifications(u.uid);
        loadWallPosts();
        loadFriendsData(u.uid);
        loadConversations();
        loadGlobalLikes();
        loadFavoriteWriters();
        loadSavedPosts();
        loadBorrowRequests();
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error en autenticación anónima:", error);
        }
      }
      setIsAuthLoading(false);
    });
  }, []);

  const loadFollowLists = () => {
    if (!user || !publicData.length) return;
    const followers = publicData.filter(p => 
      p.following?.includes(user.uid)
    );
    setFollowersList(followers);
    const following = publicData.filter(p => 
      userProfile.following?.includes(p.userId)
    );
    setFollowingList(following);
    const mutualFriends = publicData.filter(p => 
      p.following?.includes(user.uid) && 
      userProfile.following?.includes(p.userId)
    );
    setMutualFriendsList(mutualFriends);
    setFriendsList(mutualFriends);
  };

  useEffect(() => {
    loadFollowLists();
  }, [publicData, userProfile.following, user?.uid]);

  const loadFriendsData = (userId) => {
    if (!userId) return;
    const requestsQuery = collection(db, 'friendRequests');
    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests = [];
      const sentRequests = [];
      snapshot.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (data.receiverId === userId && data.status === 'pending') {
          requests.push(data);
        }
        if (data.senderId === userId && data.status === 'pending') {
          sentRequests.push(data);
        }
      });
      setFriendRequests(requests);
      setSentFriendRequests(sentRequests);
    });
    return () => unsubRequests && unsubRequests();
  };

  const loadNotifications = async (userId) => {
    const notificationsQuery = collection(db, 'notifications');
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId === userId && !data.read) {
          notifs.push({ id: doc.id, ...data });
        }
      });
      setNotifications(notifs);
    });
    return unsubscribe;
  };

  const loadWallPosts = () => {
    if (!user) return;
    const postsQuery = collection(db, 'wallPosts');
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      posts.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setWallPosts(posts.slice(0, 50));
    }, (error) => {
      console.error("Error cargando posts del muro:", error);
    });
    return unsubscribe;
  };

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
        setUserProfile(prev => ({ 
          ...prev, 
          ...data,
          isGoogleUser: !user.isAnonymous && user.providerData.some(p => p.providerId === 'google.com'),
          isAnonymous: user.isAnonymous
        }));
        if (data.theme && data.theme !== theme) {
          setTheme(data.theme);
        }
        setBadgeProgress(calculateBadgeProgress());
        loadFollowLists();
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
    const unsubPosts = loadWallPosts();
    const unsubFriends = loadFriendsData(user.uid);
    const unsubWallComments = loadWallPostComments();
    const unsubConversations = loadConversations();
    const unsubGlobalLikes = loadGlobalLikes();
    const unsubFavoriteWriters = loadFavoriteWriters();
    const unsubSavedPosts = loadSavedPosts();
    const unsubBorrowRequests = loadBorrowRequests();
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
      if (unsubBorrowRequests) unsubBorrowRequests();
    };
  }, [user]);

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

  useEffect(() => {
    if (viewingBook) {
      loadBookRecommendations(viewingBook);
    } else {
      setAuthorRecommendations([]);
      setGenreRecommendations([]);
      setSimilarBooks([]);
      setCurrentRecommendationPage({
        author: 0,
        genre: 0,
        similar: 0
      });
    }
  }, [viewingBook]);

  // --- Cerrar notificaciones al hacer click fuera ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsModalRef.current && !notificationsModalRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        queryParam = `inauthor:"${q}"`;
      }
      const maxResults = searchType === 'inauthor' ? 30 : 15;
      let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(queryParam)}&maxResults=${maxResults}`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;
      const res = await fetchWithRetry(url);
      const data = await res.json();
      if (data.items) setSearchResults(data.items);
      else setSearchError(lang === 'es' ? "Sin resultados" : "No results");
    } catch (err) { setSearchError("API Error"); } finally { setIsSearching(false); }
  };

  const searchAuthors = async () => {
    if (!writerSearch.trim()) return;
    setAuthorSearchLoading(true);
    try {
      let url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(writerSearch)}"&maxResults=10`;
      if (GOOGLE_BOOKS_API_KEY) url += `&key=${GOOGLE_BOOKS_API_KEY}`;
      const res = await fetchWithRetry(url);
      const data = await res.json();
      if (data.items) {
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

  const viewAuthorDetails = async (authorName) => {
    setSelectedAuthor(authorName);
    setAuthorBooks([]);
    setAuthorDetails(null);
    try {
      const langParam = lang === 'es' ? '&lang=es' : '';
      let url = `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&limit=10${langParam}`;
      const res = await fetchWithRetry(url);
      const data = await res.json();
      
      if (data.docs) {
        const books = data.docs.map(book => ({
          id: book.key?.replace('/works/', ''),
          volumeInfo: {
            title: book.title,
            authors: [authorName],
            description: book.first_sentence?.[0] || '',
            publishedDate: book.first_publish_year?.toString(),
            imageLinks: book.cover_i ? {
              thumbnail: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            } : null
          }
        }));
        setAuthorBooks(books);
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

  // --- MODIFICADA: handleAddBook con Open Library primero ---
  const handleAddBook = async (book, status, isFav = false, addToLibrary = false) => {
    if (!user) return;
    const bookId = book.id || book.bookId;
    const bestCover = await getBestCoverForBook(bookId, book, lang);
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
    
    // Si se marca como leído, incrementar readCount y agregar a readBooksList
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

  const handleGlobalBookReaction = async (bookId, reaction) => {
    if (!user) return;
    const wasLiked = globalLikes[bookId]?.likes?.includes(user.uid);
    const wasDisliked = globalLikes[bookId]?.dislikes?.includes(user.uid);
    const currentLikes = globalLikes[bookId]?.likes || [];
    const currentDislikes = globalLikes[bookId]?.dislikes || [];
    let newLikes = [...currentLikes];
    let newDislikes = [...currentDislikes];
    if (reaction === 'like') {
      if (wasLiked) {
        newLikes = newLikes.filter(id => id !== user.uid);
      } else {
        newLikes.push(user.uid);
        if (wasDisliked) {
          newDislikes = newDislikes.filter(id => id !== user.uid);
        }
      }
    } else if (reaction === 'dislike') {
      if (wasDisliked) {
        newDislikes = newDislikes.filter(id => id !== user.uid);
      } else {
        newDislikes.push(user.uid);
        if (wasLiked) {
          newLikes = newLikes.filter(id => id !== user.uid);
        }
      }
    }
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
    const pagesPerDay = Math.ceil(pages / days);
    const checkpoints = [];
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
    const bookExists = myBooks.find(b => b.bookId === bookId);
    if (!bookExists) {
      await handleAddBook(planningBook, 'reading', false, true);
    }
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { 
      checkpoints, 
      status: 'reading', 
      totalPages: pages,
      planStartDate: startDate.toISOString(),
      planDays: days,
      pagesPerDay: pagesPerDay,
      planEndDate: new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
    });
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
    if (allDone) {
      await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { 
        checkpoints: nCP, 
        status: 'read',
        finishDate: new Date().toISOString()
      });
      victoryAudio.current.play().catch(() => {});
      await updateDoc(doc(db, 'profiles', user.uid), { readCount: increment(1), readBooksList: arrayUnion(bookId) });
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
    const bestCover = await getBestCoverForBook(bookId, viewingBook, lang);
    const recData = {
      bookId,
      title: viewingBook.volumeInfo?.title || viewingBook.title,
      authors: viewingBook.volumeInfo?.authors || viewingBook.authors || ['Anónimo'],
      thumbnail: bestCover.url,
      status: 'library',
      recommendedBy: userProfile.name,
      senderId: user.uid,
      recommendationMessage: recommendMessage,
      sentAt: new Date().toISOString(),
      inLibrary: true
    };
    await setDoc(doc(db, 'users', targetId, 'myBooks', bookId), recData);
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

  const submitWallPost = async () => {
    await submitWallPostWithNotifications();
  };

  const searchBooksForPost = async () => {
    if (!postSearch.trim()) {
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
        const userBooksResults = myBooks.filter(book => 
          book.title?.toLowerCase().includes(postSearch.toLowerCase()) ||
          book.authors?.some(author => author.toLowerCase().includes(postSearch.toLowerCase()))
        );
        setBooksForPost(userBooksResults.slice(0, 10));
      }
    } catch (err) {
      console.error("Error buscando libros:", err);
      const userBooksResults = myBooks.filter(book => 
        book.title?.toLowerCase().includes(postSearch.toLowerCase()) ||
        book.authors?.some(author => author.toLowerCase().includes(postSearch.toLowerCase()))
      );
      setBooksForPost(userBooksResults.slice(0, 10));
    }
  };

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
    loadFollowLists();
  };

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

  const sendMessage = async (receiverId, receiverName, messageText) => {
    await sendMessageWithNotification(receiverId, receiverName, messageText);
  };

  const markMessagesAsRead = async (conversationId) => {
    if (!user || !conversationId) return;
    await updateDoc(doc(db, 'conversations', conversationId), {
      [`unreadCount.${user.uid}`]: 0
    });
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('receiverId', '==', user.uid),
      where('read', '==', false)
    );
    const snapshot = await getDocs(messagesQuery);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    }
  };

  const toggleFavoriteWriter = async (authorName) => {
    if (!user) return;
    const isFavorite = favoriteWritersList.includes(authorName);
    if (isFavorite) {
      const favoriteQuery = query(
        collection(db, 'favoriteWriters'),
        where('userId', '==', user.uid),
        where('authorName', '==', authorName)
      );
      const snapshot = await getDocs(favoriteQuery);
      if (!snapshot.empty) {
        snapshot.docs.forEach(doc => {
          deleteDoc(doc.ref);
        });
      }
      setFavoriteWritersList(prev => prev.filter(name => name !== authorName));
      setUserProfile(prev => ({ 
        ...prev, 
        favoriteWriters: prev.favoriteWriters?.filter(name => name !== authorName) || []
      }));
      alert(lang === 'es' ? 'Escritor eliminado de favoritos' : 'Writer removed from favorites');
    } else {
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

  const toggleSavedPost = async (postId) => {
    if (!user) return;
    const isSaved = savedPostsList.includes(postId);
    if (isSaved) {
      const savedQuery = query(
        collection(db, 'savedPosts'),
        where('userId', '==', user.uid),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(savedQuery);
      if (!snapshot.empty) {
        snapshot.docs.forEach(doc => {
          deleteDoc(doc.ref);
        });
      }
      setSavedPostsList(prev => prev.filter(id => id !== postId));
      setUserProfile(prev => ({ 
        ...prev, 
        savedPosts: prev.savedPosts?.filter(id => id !== postId) || []
      }));
      alert(lang === 'es' ? 'Publicación eliminada de guardados' : 'Post removed from saved');
    } else {
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

  const viewUserReadBooks = (userProfileData) => {
    if (!userProfileData) return;
    const readBooks = selectedUserBooks.filter(book => book.status === 'read');
    setReadBooksList(readBooks);
    setViewingReadBooks(true);
  };

  const skipWelcomeVideo = () => {
    setShowWelcomeVideo(false);
    localStorage.setItem('sandbook_welcome_video_shown', 'true');
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const continueWithoutAccount = () => {
    setRequireGoogleLogin(false);
  };

  // --- FUNCIÓN PARA MANEJAR CLIC EN PORTADA O TÍTULO ---
  const handleViewBookDetails = (book) => {
    setViewingBook(book);
  };

  // --- FUNCIÓN PARA MANEJAR CLIC EN FOTO DE PERFIL ---
  const handleViewUserProfile = (userData) => {
    setSelectedUserProfile(userData);
    setActiveTab('profile');
  };

  // --- FUNCIÓN PARA MANEJAR ZOOM DE PORTADA ---
  const handleZoomImage = (imageUrl, title) => {
    setZoomImage(imageUrl);
    setZoomTitle(title);
  };

  const renderFollowModal = (title, list, type) => {
    return (
      <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
        <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
          <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
            <h2 className="text-xl font-black text-white text-center">{title}</h2>
            <button onClick={() => {
              if (type === 'following') setShowFollowingModal(false);
              if (type === 'followers') setShowFollowersModal(false);
              if (type === 'mutual') setShowMutualFriendsModal(false);
            }} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
              <X size={24}/>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {list.length === 0 ? (
              <div className="text-center py-12">
                <Users className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>
                  {lang === 'es' ? `No hay ${type === 'following' ? 'personas que sigues' : type === 'followers' ? 'seguidores' : 'amigos mutuos'}` : `No ${type === 'following' ? 'people you follow' : type === 'followers' ? 'followers' : 'mutual friends'}`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {list.map(user => (
                  <div key={user.userId} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.profilePic || 'https://via.placeholder.com/40'} 
                        className="w-12 h-12 rounded-full object-cover cursor-pointer"
                        onClick={() => openUserProfileModal(user)}
                      />
                      <div>
                        <p className="text-sm font-bold cursor-pointer" onClick={() => openUserProfileModal(user)}>
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                          {user.readCount || 0} {t.read.toLowerCase()} • {getLevelTitle(user.readCount, lang)}
                          <img src={getLevelSymbol(user.readCount)} className="w-3 h-3 object-contain inline-block ml-1" alt="Nivel" />
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openUserProfileModal(user)}
                        className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold"
                        title={lang === 'es' ? 'Ver perfil' : 'View profile'}
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUserForMessage(user);
                          setShowNewMessageModal(true);
                        }}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold"
                        title={t.send_message}
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
    if (filterType === 'liked') return userProfile.likes?.includes(b.bookId);
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

  const getReadersCount = (bookId) => {
    return publicData.filter(p => p.readBooksList?.includes(bookId)).length;
  };

  const filteredUsers = publicData.filter(p => {
    if (p.userId === user?.uid) return false;
    if (userProfile.dismissedUsers?.includes(p.userId)) return false;
    if (friendsSearch && !p.name?.toLowerCase().includes(friendsSearch.toLowerCase())) {
      return false;
    }
    if (friendsFilter === 'google' && !p.isGoogleUser) return false;
    if (friendsFilter === 'anonymous' && !p.isAnonymous) return false;
    if (friendsFilter === 'following' && !userProfile.following?.includes(p.userId)) return false;
    if (friendsFilter === 'followers' && !p.following?.includes(user?.uid)) return false;
    return true;
  });

  const setQuickStartDate = (option) => {
    const today = new Date();
    let newDate = new Date();
    switch(option) {
      case 'today':
        break;
      case 'tomorrow':
        newDate.setDate(today.getDate() + 1);
        break;
      case 'next_week':
        newDate.setDate(today.getDate() + 7);
        break;
      case 'custom':
        document.getElementById('start-date-picker')?.focus();
        return;
    }
    setPlanStartDate(newDate.toISOString().split('T')[0]);
    setShowStartDateOptions(false);
  };

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

  const calculateUserCurrentlyReading = (userBooks) => {
    const reading = userBooks.filter(book => book.status === 'reading').length;
    return reading;
  };

  const filteredFavoriteWriters = favoriteWritersList.filter(writer => 
    !writerSearch || writer.toLowerCase().includes(writerSearch.toLowerCase())
  );

  const filteredSavedPosts = wallPosts.filter(post => 
    savedPostsList.includes(post.id)
  );

  // --- COMPONENTE: Carrusel de recomendaciones ---
  const RecommendationCarousel = ({ title, books, onBookClick, currentPage, setCurrentPage, itemsPerPage = 6 }) => {
    if (!books || books.length === 0) return null;
    const totalPages = Math.ceil(books.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const displayedBooks = books.slice(startIndex, startIndex + itemsPerPage);
    const nextPage = () => {
      if (currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
      }
    };
    const prevPage = () => {
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    };
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm uppercase tracking-widest border-b pb-2 border-slate-200 dark:border-gray-700">{title}</h3>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button 
                onClick={prevPage} 
                disabled={currentPage === 0}
                className={`p-1 rounded-full ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-gray-700'}`}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={nextPage} 
                disabled={currentPage >= totalPages - 1}
                className={`p-1 rounded-full ${currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-gray-700'}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {displayedBooks.map((book, idx) => (
            <div 
              key={idx} 
              className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-2 rounded-xl border ${themeClasses.border} cursor-pointer hover:scale-105 transition-all`}
              onClick={() => onBookClick(book)}
            >
              <div className="aspect-[2/3] mb-2 bg-white rounded-lg overflow-hidden">
                <img 
                  src={book.thumbnail || 'https://via.placeholder.com/150x200?text=NO+COVER'} 
                  className="w-full h-full object-contain"
                  alt={book.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150x200?text=NO+COVER';
                  }}
                />
              </div>
              <p className="text-xs font-bold line-clamp-2">{book.title}</p>
              <p className="text-[8px] text-slate-500 dark:text-gray-400 mt-1 line-clamp-1">
                {Array.isArray(book.authors) ? book.authors[0] : book.authors}
              </p>
              {book.firstPublishYear && (
                <p className="text-[8px] text-slate-400 dark:text-gray-500 mt-1">
                  {book.firstPublishYear}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- LOADER DE AUTENTICACIÓN ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-8">
        <div className="relative animate-bounce">
          <BookOpen size={80} className="text-white animate-pulse" />
          <div className="absolute -top-2 -right-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="w-4 h-4 bg-yellow-400 rounded-full absolute inset-0"></div>
          </div>
        </div>
        <h1 className="mt-8 text-3xl font-black text-white tracking-tighter animate-pulse">
          Sandbook
        </h1>
        <div className="mt-8 w-48 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-white rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>
        <p className="mt-4 text-white/70 text-sm font-medium">
          {lang === 'es' ? 'Cargando tu biblioteca...' : 'Loading your library...'}
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} pb-24 font-sans overflow-x-hidden selection:bg-indigo-200 selection:text-white`}>
      
      {/* MODAL ZOOM DE PORTADA */}
      {zoomImage && (
        <CoverZoomModal 
          imageUrl={zoomImage}
          title={zoomTitle}
          onClose={() => setZoomImage(null)}
          t={t}
        />
      )}
      
      {/* MODAL DE INSIGNIA */}
      {showBadgeModal && selectedBadge && (
        <div className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-yellow-800' : theme === 'sunset' ? 'bg-amber-500' : 'bg-yellow-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{selectedBadge.name}</h2>
              <button onClick={() => setShowBadgeModal(false)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center mb-6">
                <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${userProfile.badges?.includes(parseInt(selectedBadge.id)) ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <Trophy size={48} className={userProfile.badges?.includes(parseInt(selectedBadge.id)) ? 'text-yellow-600 dark:text-yellow-300' : 'text-gray-400 dark:text-gray-500'} />
                </div>
                <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">{selectedBadge.desc}</p>
                
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-700' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-2">{t.badge_requirement}</p>
                  <p className="text-sm font-bold">
                    {selectedBadge.requirement.type === 'read_count' && `${selectedBadge.requirement.value} ${t.read.toLowerCase()}`}
                    {selectedBadge.requirement.type === 'scan_count' && `${selectedBadge.requirement.value} ${lang === 'es' ? 'libros escaneados' : 'scanned books'}`}
                    {selectedBadge.requirement.type === 'yearly_books' && `${selectedBadge.requirement.value} ${lang === 'es' ? 'libros en un año' : 'books in a year'}`}
                    {selectedBadge.requirement.type === 'total_badges' && `${selectedBadge.requirement.value} ${lang === 'es' ? 'insignias' : 'badges'}`}
                    {(selectedBadge.requirement.type === 'fastest_book' || selectedBadge.requirement.type === 'longest_book' || selectedBadge.requirement.type === 'one_day_book' || selectedBadge.requirement.type === 'one_week_book' || selectedBadge.requirement.type === 'one_month_book' || selectedBadge.requirement.type === 'perfect_plan') && selectedBadge.desc}
                  </p>
                </div>
                
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500 dark:text-gray-400 mb-2">{t.badge_progress}</p>
                  <div className="h-3 bg-slate-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-1000" 
                      style={{ width: `${badgeProgress[selectedBadge.id] || 0}%` }} 
                    />
                  </div>
                  <p className="text-sm font-bold mt-2">{Math.round(badgeProgress[selectedBadge.id] || 0)}%</p>
                </div>
                
                {userProfile.badges?.includes(parseInt(selectedBadge.id)) ? (
                  <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">{t.badge_unlocked}</p>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl">
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400">{t.badge_locked}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL EDITAR PUBLICACIÓN */}
      {editingPost && (
        <div className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[90vh]`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.edit_post}</h2>
              <button onClick={() => {setEditingPost(null); setEditPostContent('');}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <textarea 
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                className={`w-full rounded-2xl p-4 text-sm outline-none min-h-[200px] ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                maxLength={2500}
              />
              <div className="flex justify-between mt-2 mb-4">
                <p className="text-xs text-slate-400">{t.max_characters}</p>
                <p className={`text-xs font-bold ${editPostContent.length >= 2500 ? 'text-red-500' : 'text-slate-400'}`}>
                  {editPostContent.length}/2500
                </p>
              </div>
              <button 
                onClick={() => editWallPost(editingPost, editPostContent)}
                disabled={!editPostContent.trim()}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase shadow-md flex items-center justify-center gap-2 transition-all ${
                  !editPostContent.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Edit size={16}/> {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL CONFIRMAR ELIMINAR PUBLICACIÓN */}
      {postToDelete && (
        <div className="fixed inset-0 z-[1001] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border ${themeClasses.border}`}>
            <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="font-black text-xl mb-2 uppercase">{t.confirm_delete_post}</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{t.confirm_delete_post_desc}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPostToDelete(null)} 
                className={`flex-1 py-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200'} font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-slate-500'} uppercase text-[10px] transition-colors`}
              >
                {t.cancel}
              </button>
              <button 
                onClick={() => deleteWallPost(postToDelete)} 
                className="flex-1 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase text-[10px] transition-colors"
              >
                {t.delete_btn}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* MODAL PERFIL DE USUARIO (POR ENCIMA DE TODO) */}
      {showUserProfileModal && userProfileModalData && (
        <div className="fixed inset-0 z-[1002] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative h-48 ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-800 to-purple-900' : theme === 'sunset' ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} flex-shrink-0`}>
              <button onClick={() => setShowUserProfileModal(false)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-shrink-0 px-6 pb-4">
              <div className="relative -mt-16 mb-4">
                <img 
                  src={userProfileModalData.profilePic || 'https://via.placeholder.com/150'} 
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover mx-auto"
                  alt={userProfileModalData.name}
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                  <VerificationCheck count={userProfileModalData.readCount || 0} size={20} />
                </div>
              </div>
              <div className="text-center">
                <h2 className="font-black text-xl">{userProfileModalData.name}</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                  {getLevelTitle(userProfileModalData.readCount || 0, lang)}
                </p>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="text-center cursor-pointer" onClick={() => {
                    setShowUserProfileModal(false);
                    setShowFollowersModal(true);
                  }}>
                    <p className="font-black text-lg">{userProfileModalData.followersCount || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{t.followers}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-lg">{userProfileModalData.readCount || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{t.read}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-lg">{userProfileModalData.scanCount || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{lang === 'es' ? 'Escaneos' : 'Scans'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Libros del usuario */}
              <div className="mt-6">
                <h3 className="font-black text-sm uppercase tracking-widest mb-4">{t.user_books} {userProfileModalData.name}</h3>
                {selectedUserBooks.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto text-slate-300 dark:text-gray-600 mb-2" size={32} />
                    <p className="text-xs text-slate-400">{lang === 'es' ? 'No hay libros' : 'No books'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedUserBooks.slice(0, 8).map((book, idx) => (
                      <div 
                        key={idx} 
                        className="aspect-[2/3] rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all"
                        onClick={() => {
                          setShowUserProfileModal(false);
                          openBookDetailModal(book);
                        }}
                      >
                        <img 
                          src={book.thumbnail || 'https://via.placeholder.com/150x200?text=NO+COVER'} 
                          className="w-full h-full object-contain bg-slate-100 dark:bg-gray-800"
                          alt={book.title}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Insignias */}
              <div className="mt-6">
                <h3 className="font-black text-sm uppercase tracking-widest mb-4">{t.badges_title}</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(BADGE_DEFS).slice(0, 10).map(([id, def]) => {
                    const hasBadge = userProfileModalData.badges?.includes(parseInt(id));
                    return (
                      <button 
                        key={id}
                        onClick={() => openBadgeModal(id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${hasBadge ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-gray-200 dark:bg-gray-700 opacity-50'}`}
                      >
                        <Trophy size={16} className={hasBadge ? 'text-yellow-600 dark:text-yellow-300' : 'text-gray-400'} />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Acciones */}
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => {
                    setShowUserProfileModal(false);
                    toggleFollow(userProfileModalData.userId);
                  }}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm uppercase transition-all ${
                    userProfile.following?.includes(userProfileModalData.userId)
                      ? 'bg-gray-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {userProfile.following?.includes(userProfileModalData.userId) ? t.unfollow : t.add_friend}
                </button>
                <button 
                  onClick={() => {
                    setShowUserProfileModal(false);
                    setSelectedUserForMessage(userProfileModalData);
                    setShowNewMessageModal(true);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm uppercase transition-all"
                >
                  <MessageSquare size={16} className="inline mr-2" /> {t.send_message}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL DETALLE DE LIBRO (POR ENCIMA DE TODO) */}
      {showBookDetailModal && bookDetailData && (
        <div className="fixed inset-0 z-[1002] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative h-56 ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-800 to-purple-900' : theme === 'sunset' ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} flex-shrink-0`}>
              <button onClick={() => setShowBookDetailModal(false)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-shrink-0 px-6 pb-4">
              <div className="relative -mt-24 mb-4">
                <img 
                  src={bookDetailData.thumbnail || bookDetailData.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/150x200?text=NO+COVER'} 
                  className="w-40 h-56 object-contain rounded-2xl shadow-2xl border-4 border-white dark:border-gray-800 mx-auto cursor-pointer hover:scale-105 transition-all"
                  alt={bookDetailData.title || bookDetailData.volumeInfo?.title}
                  onClick={() => handleZoomImage(bookDetailData.thumbnail || bookDetailData.volumeInfo?.imageLinks?.thumbnail, bookDetailData.title || bookDetailData.volumeInfo?.title)}
                />
              </div>
              <div className="text-center">
                <h2 className="font-black text-lg">{bookDetailData.title || bookDetailData.volumeInfo?.title}</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                  {Array.isArray(bookDetailData.authors || bookDetailData.volumeInfo?.authors) 
                    ? (bookDetailData.authors || bookDetailData.volumeInfo?.authors).join(', ')
                    : (bookDetailData.authors || bookDetailData.volumeInfo?.authors)}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Descripción */}
              <div className="mt-4">
                <h3 className="font-black text-sm uppercase tracking-widest mb-2">{lang === 'es' ? 'Descripción' : 'Description'}</h3>
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                  {bookDetailData.description || bookDetailData.volumeInfo?.description || (lang === 'es' ? 'Sin descripción disponible' : 'No description available')}
                </p>
              </div>
              
              {/* Información adicional */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-700' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 uppercase">{t.pages}</p>
                  <p className="font-bold text-lg">{bookDetailData.totalPages || bookDetailData.volumeInfo?.pageCount || '-'}</p>
                </div>
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-700' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 uppercase">{lang === 'es' ? 'Estado' : 'Status'}</p>
                  <p className="font-bold text-lg">
                    {bookDetailData.status === 'read' ? t.read : 
                     bookDetailData.status === 'reading' ? t.in_plan : 
                     bookDetailData.status === 'library' ? t.in_library : t.pending}
                  </p>
                </div>
              </div>
              
              {/* Acciones */}
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => {
                    setShowBookDetailModal(false);
                    handleAddBook(bookDetailData, 'library', false, true);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase transition-all"
                >
                  <BookOpen size={16} className="inline mr-2" /> {t.add_to_library}
                </button>
                <button 
                  onClick={() => {
                    setShowBookDetailModal(false);
                    setPlanningBook(bookDetailData);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm uppercase transition-all"
                >
                  <Calendar size={16} className="inline mr-2" /> {t.reading_plan}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL CONFIRMAR ELIMINAR */}
      {bookToDelete && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
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
                  if (!user) return;
                  await syncReadBooksAfterDelete(bookToDelete);
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

      {/* MODAL PLANIFICAR */}
      {planningBook && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[90vh]`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.reading_plan}</h2>
              <button onClick={() => setPlanningBook(null)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col items-center gap-4 mb-6">
                <img 
                  src={planningBook.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || planningBook.thumbnail || 'https://via.placeholder.com/150x200?text=NO+COVER'} 
                  className="w-24 h-36 object-contain rounded-2xl shadow-md bg-white"
                  alt={planningBook.volumeInfo?.title || planningBook.title}
                />
                <div className="text-center">
                  <h3 className="font-black text-lg">{planningBook.volumeInfo?.title || planningBook.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{planningBook.volumeInfo?.authors?.join(', ') || planningBook.authors?.join(', ')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-2">{t.manual_p}</label>
                  <input 
                    type="number" 
                    value={manualPages} 
                    onChange={(e) => setManualPages(e.target.value)} 
                    className={`w-full rounded-2xl px-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                    placeholder="Ej: 300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-2">{t.days}</label>
                  <input 
                    type="number" 
                    value={planDays} 
                    onChange={(e) => setPlanDays(e.target.value)} 
                    className={`w-full rounded-2xl px-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                    placeholder="7"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-2">{t.start_date}</label>
                  <div className="relative">
                    <input 
                      id="start-date-picker"
                      type="date" 
                      value={planStartDate} 
                      onChange={(e) => setPlanStartDate(e.target.value)} 
                      className={`w-full rounded-2xl px-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                    />
                    <button 
                      onClick={() => setShowStartDateOptions(!showStartDateOptions)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
                    >
                      <ChevronDown size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-slate-400'} />
                    </button>
                  </div>
                  {showStartDateOptions && (
                    <div className={`mt-2 p-2 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : theme === 'sunset' ? 'bg-amber-100' : 'bg-slate-50'} space-y-1`}>
                      <button onClick={() => setQuickStartDate('today')} className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/10 ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>
                        {t.today}
                      </button>
                      <button onClick={() => setQuickStartDate('tomorrow')} className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/10 ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>
                        {t.tomorrow}
                      </button>
                      <button onClick={() => setQuickStartDate('next_week')} className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/10 ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>
                        {t.next_week}
                      </button>
                    </div>
                  )}
                </div>
                {manualPages && planDays && (
                  <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-indigo-900/30' : theme === 'sunset' ? 'bg-orange-100' : 'bg-indigo-50'}`}>
                    <p className="text-xs text-center">
                      <span className="font-bold">{Math.ceil(parseInt(manualPages) / parseInt(planDays))}</span> {lang === 'es' ? 'páginas por día' : 'pages per day'}
                    </p>
                  </div>
                )}
              </div>
              <button 
                onClick={saveReadingPlan}
                disabled={!manualPages || !planDays}
                className={`w-full mt-6 py-4 rounded-2xl font-black text-sm uppercase shadow-md flex items-center justify-center gap-2 transition-all ${
                  !manualPages || !planDays
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Calendar size={18}/> {t.start}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERFIL EXTERNO */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative h-48 ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-800 to-purple-900' : theme === 'sunset' ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} flex-shrink-0`}>
              <button onClick={() => setSelectedUserProfile(null)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-shrink-0 px-6 pb-4">
              <div className="relative -mt-16 mb-4">
                <img 
                  src={selectedUserProfile.profilePic || 'https://via.placeholder.com/150'} 
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover mx-auto"
                  alt={selectedUserProfile.name}
                />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                  <VerificationCheck count={selectedUserProfile.readCount || 0} size={20} />
                </div>
              </div>
              <div className="text-center">
                <h2 className="font-black text-xl">{selectedUserProfile.name}</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                  {getLevelTitle(selectedUserProfile.readCount || 0, lang)}
                </p>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="text-center cursor-pointer" onClick={() => {
                    setSelectedUserProfile(null);
                    setShowFollowersModal(true);
                  }}>
                    <p className="font-black text-lg">{selectedUserProfile.followersCount || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{t.followers}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-lg">{selectedUserProfile.readCount || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{t.read}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-lg">{selectedUserProfile.scanCount || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{lang === 'es' ? 'Escaneos' : 'Scans'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="flex gap-3 mb-6">
                <button 
                  onClick={() => toggleFollow(selectedUserProfile.userId)}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm uppercase transition-all ${
                    userProfile.following?.includes(selectedUserProfile.userId)
                      ? 'bg-gray-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {userProfile.following?.includes(selectedUserProfile.userId) ? t.unfollow : t.add_friend}
                </button>
                <button 
                  onClick={() => {
                    setSelectedUserForMessage(selectedUserProfile);
                    setShowNewMessageModal(true);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm uppercase transition-all"
                >
                  <MessageSquare size={16} className="inline mr-2" /> {t.send_message}
                </button>
              </div>
              
              <div className="flex justify-center gap-2 mb-6">
                {['all', 'read', 'in_plan', 'in_library'].map((type) => (
                  <button 
                    key={type} 
                    onClick={() => setSelectedUserFilter(type)} 
                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${selectedUserFilter === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400'}`}
                  >
                    {type === 'all' ? t.all : type === 'read' ? t.read : type === 'in_plan' ? t.in_plan : t.in_library}
                  </button>
                ))}
              </div>
              
              {filteredExternalBooks.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{t.no_friends}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExternalBooks.map((book) => (
                    <div key={book.bookId} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border}`}>
                      <div className="flex gap-4">
                        <img 
                          src={book.thumbnail || 'https://via.placeholder.com/150x200?text=NO+COVER'} 
                          className="w-16 h-24 object-contain rounded-xl bg-white shadow-sm cursor-pointer hover:scale-105 transition-all"
                          alt={book.title}
                          onClick={() => {
                            setSelectedUserProfile(null);
                            openBookDetailModal(book);
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm truncate cursor-pointer" onClick={() => {
                            setSelectedUserProfile(null);
                            openBookDetailModal(book);
                          }}>{book.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{book.authors?.join(', ')}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase ${
                              book.status === 'read' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' : 
                              book.status === 'reading' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 
                              'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400'
                            }`}>
                              {book.status === 'read' ? t.read : book.status === 'reading' ? t.in_plan : t.in_library}
                            </span>
                            {book.isFavorite && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                          </div>
                          <UserReadingProgress book={book} theme={theme} t={t} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DE LIBRO */}
      {viewingBook && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative h-48 ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-800 to-purple-900' : theme === 'sunset' ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} flex-shrink-0`}>
              <button onClick={() => setViewingBook(null)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-shrink-0 px-6 pb-4">
              <div className="relative -mt-16 mb-4">
                <img 
                  src={viewingBook.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || viewingBook.thumbnail || 'https://via.placeholder.com/150x200?text=NO+COVER'} 
                  className="w-32 h-48 object-contain rounded-2xl shadow-2xl border-4 border-white dark:border-gray-800 mx-auto cursor-pointer hover:scale-105 transition-all"
                  alt={viewingBook.volumeInfo?.title || viewingBook.title}
                  onClick={() => handleZoomImage(viewingBook.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || viewingBook.thumbnail, viewingBook.volumeInfo?.title || viewingBook.title)}
                />
              </div>
              <div className="text-center">
                <h2 className="font-black text-lg">{viewingBook.volumeInfo?.title || viewingBook.title}</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{viewingBook.volumeInfo?.authors?.join(', ') || viewingBook.authors?.join(', ')}</p>
                <div className="flex justify-center gap-4 mt-3">
                  <div className="text-center">
                    <p className="font-black text-lg">{getReadersCount(viewingBook.id || viewingBook.bookId)}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{t.readers_count}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="flex justify-center gap-3 mb-6">
                <button 
                  onClick={() => handleAddBook(viewingBook, 'library', false, true)}
                  className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase transition-all"
                >
                  {t.add_to_library}
                </button>
                <button 
                  onClick={() => {setPlanningBook(viewingBook); setViewingBook(null);}}
                  className="px-4 py-2 rounded-2xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold uppercase transition-all"
                >
                  {t.reading_plan}
                </button>
                <button 
                  onClick={() => setShowRecommendList(true)}
                  className="px-4 py-2 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold uppercase transition-all"
                >
                  {t.recommend}
                </button>
              </div>
              
              {/* Recomendaciones del mismo autor */}
              {authorRecommendations.length > 0 && (
                <RecommendationCarousel 
                  title={t.more_by_author}
                  books={authorRecommendations}
                  onBookClick={(book) => {
                    setViewingBook({
                      id: book.id,
                      volumeInfo: {
                        title: book.title,
                        authors: book.authors,
                        imageLinks: { thumbnail: book.thumbnail }
                      }
                    });
                  }}
                  currentPage={currentRecommendationPage.author}
                  setCurrentPage={(page) => setCurrentRecommendationPage(prev => ({ ...prev, author: page }))}
                />
              )}
              
              {/* Recomendaciones del mismo género */}
              {genreRecommendations.length > 0 && (
                <RecommendationCarousel 
                  title={t.similar_books}
                  books={genreRecommendations}
                  onBookClick={(book) => {
                    setViewingBook({
                      id: book.id,
                      volumeInfo: {
                        title: book.title,
                        authors: book.authors,
                        imageLinks: { thumbnail: book.thumbnail }
                      }
                    });
                  }}
                  currentPage={currentRecommendationPage.genre}
                  setCurrentPage={(page) => setCurrentRecommendationPage(prev => ({ ...prev, genre: page }))}
                />
              )}
              
              {/* Libros similares */}
              {similarBooks.length > 0 && (
                <RecommendationCarousel 
                  title={t.recommended_books}
                  books={similarBooks}
                  onBookClick={(book) => {
                    setViewingBook({
                      id: book.id,
                      volumeInfo: {
                        title: book.title,
                        authors: book.authors,
                        imageLinks: { thumbnail: book.thumbnail }
                      }
                    });
                  }}
                  currentPage={currentRecommendationPage.similar}
                  setCurrentPage={(page) => setCurrentRecommendationPage(prev => ({ ...prev, similar: page }))}
                />
              )}
              
              <div className="space-y-4">
                <h3 className="font-black text-sm uppercase tracking-widest border-b pb-2 border-slate-200 dark:border-gray-700">{t.reviews}</h3>
                {(bookComments[viewingBook.id || viewingBook.bookId] || []).length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-2`} size={32} />
                    <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{lang === 'es' ? 'Sin reseñas' : 'No reviews'}</p>
                  </div>
                ) : (
                  (bookComments[viewingBook.id || viewingBook.bookId] || []).map((c) => (
                    <div key={c.id} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl`}>
                      <div className="flex items-center gap-3 mb-2">
                        <img src={c.userPic || 'https://via.placeholder.com/30'} className="w-8 h-8 rounded-full object-cover" alt={c.userName} />
                        <div>
                          <p className="font-bold text-xs">{c.userName}</p>
                          <StarRating rating={c.rating} interactive={false} size={12} />
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-gray-300">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-gray-700">
                <h3 className="font-black text-sm uppercase tracking-widest mb-4">{t.my_review}</h3>
                <div className="flex justify-center mb-4">
                  <StarRating rating={userRating} onRate={setUserRating} />
                </div>
                <textarea 
                  value={userComment} 
                  onChange={(e) => setUserComment(e.target.value)} 
                  className={`w-full rounded-2xl p-4 text-sm outline-none min-h-[100px] ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                  placeholder={lang === 'es' ? 'Escribe tu opinión...' : 'Write your review...'}
                />
                <button 
                  onClick={submitGlobalReview}
                  disabled={!userRating}
                  className={`w-full mt-4 py-3 rounded-2xl font-black text-sm uppercase shadow-md transition-all ${
                    !userRating 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECOMENDAR */}
      {showRecommendList && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-purple-800' : theme === 'sunset' ? 'bg-pink-500' : 'bg-purple-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.select_friend}</h2>
              <button onClick={() => setShowRecommendList(false)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <textarea 
                value={recommendMessage} 
                onChange={(e) => setRecommendMessage(e.target.value)} 
                className={`w-full rounded-2xl p-4 text-sm outline-none mb-4 ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                placeholder={t.message_placeholder}
              />
              {friendsList.length === 0 ? (
                <div className="text-center py-12">
                  <Users className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{t.no_friends}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friendsList.map((friend) => (
                    <button 
                      key={friend.userId} 
                      onClick={() => handleRecommendBook(friend.userId, friend.name)}
                      className={`w-full p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'sunset' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-slate-50 hover:bg-slate-100'} flex items-center gap-4 transition-all`}
                    >
                      <img src={friend.profilePic || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full object-cover" alt={friend.name} />
                      <div className="flex-1 text-left">
                        <p className="font-bold text-sm">{friend.name}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">{friend.readCount || 0} {t.read.toLowerCase()}</p>
                      </div>
                      <Send size={20} className="text-indigo-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESCANER */}
      {showScanner && (
        <div className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setShowScanner(false)} 
              className="absolute -top-12 right-0 p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
            >
              <X size={24}/>
            </button>
            <div id="reader" className="w-full aspect-[3/4] rounded-3xl overflow-hidden bg-black"></div>
            <p className="text-center text-white/70 text-sm mt-4 font-medium">{t.scan_msg}</p>
          </div>
        </div>
      )}

      {/* MODAL ESCRITORES */}
      {showWriters && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.writers}</h2>
              <button onClick={() => setShowWriters(false)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-shrink-0 p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                  type="text" 
                  value={writerSearch} 
                  onChange={(e) => setWriterSearch(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && searchAuthors()}
                  className={`w-full rounded-2xl pl-12 pr-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                  placeholder={t.search_writers}
                />
              </div>
              <button 
                onClick={searchAuthors}
                disabled={authorSearchLoading || !writerSearch.trim()}
                className={`w-full mt-3 py-3 rounded-2xl font-black text-sm uppercase transition-all ${
                  authorSearchLoading || !writerSearch.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {authorSearchLoading ? <Loader2 className="animate-spin mx-auto" size={20}/> : t.search}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {writerResults.length === 0 ? (
                <div className="text-center py-12">
                  <PenTool className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{lang === 'es' ? 'Busca escritores' : 'Search writers'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {writerResults.map((writer, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {viewAuthorDetails(writer.name); setShowWriters(false);}}
                      className={`w-full p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'sunset' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-slate-50 hover:bg-slate-100'} flex items-center gap-4 transition-all`}
                    >
                      <img 
                        src={writer.thumbnail || 'https://via.placeholder.com/40'} 
                        className="w-12 h-12 rounded-full object-cover" 
                        alt={writer.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/40?text=?';
                        }}
                      />
                      <div className="flex-1 text-left">
                        <p className="font-bold text-sm">{writer.name}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">{writer.booksCount} {lang === 'es' ? 'libros' : 'books'}</p>
                      </div>
                      <ChevronRight size={20} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DE AUTOR */}
      {selectedAuthor && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative h-48 ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-800 to-purple-900' : theme === 'sunset' ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} flex-shrink-0`}>
              <button onClick={() => {setSelectedAuthor(null); setAuthorBooks([]); setAuthorDetails(null);}} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-shrink-0 px-6 pb-4">
              <div className="relative -mt-16 mb-4">
                <img 
                  src={authorDetails?.thumbnail || 'https://via.placeholder.com/150'} 
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover mx-auto"
                  alt={selectedAuthor}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=?';
                  }}
                />
              </div>
              <div className="text-center">
                <h2 className="font-black text-xl">{selectedAuthor}</h2>
                {authorDetails?.description && (
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{authorDetails.description}</p>
                )}
                <div className="flex justify-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="font-black text-lg">{authorBooks.length}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{t.books_written}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-lg">{authorDetails?.age || '-'}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{t.author_age}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleFavoriteWriter(selectedAuthor)}
                  className={`mt-4 px-4 py-2 rounded-2xl text-xs font-bold uppercase transition-all ${
                    favoriteWritersList.includes(selectedAuthor)
                      ? 'bg-yellow-500 text-white'
                      : 'bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300'
                  }`}
                >
                  {favoriteWritersList.includes(selectedAuthor) ? t.remove_favorite_writer : t.mark_as_favorite_writer}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {authorDetails?.biography && (
                <div className="mb-6">
                  <h3 className="font-black text-sm uppercase tracking-widest mb-2">{t.biography}</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">{authorDetails.biography}</p>
                </div>
              )}
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest mb-4">{t.books_by_author}</h3>
                {authorBooks.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-2`} size={32} />
                    <p className="text-xs text-slate-400">{lang === 'es' ? 'Cargando libros...' : 'Loading books...'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {authorBooks.map((book, idx) => (
                      <div 
                        key={idx} 
                        className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-2 rounded-xl border ${themeClasses.border} cursor-pointer hover:scale-105 transition-all`}
                        onClick={() => {
                          setSelectedAuthor(null);
                          setViewingBook(book);
                        }}
                      >
                        <img 
                          src={book.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150x200?text=NO+COVER'} 
                          className="w-full aspect-[2/3] object-contain rounded-lg bg-white mb-2"
                          alt={book.volumeInfo?.title}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x200?text=NO+COVER';
                          }}
                        />
                        <p className="text-xs font-bold line-clamp-2">{book.volumeInfo?.title}</p>
                      </div>
                    ))}
                  </div>
                )}
                {authorBooks.length >= 10 && (
                  <button 
                    onClick={() => searchMoreBooksByAuthor(selectedAuthor, Math.floor(authorBooks.length / 20))}
                    disabled={moreBooksLoading}
                    className="w-full mt-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase transition-all"
                  >
                    {moreBooksLoading ? <Loader2 className="animate-spin mx-auto" size={20}/> : t.load_more}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      
      {/* MODAL PUBLICAR */}
      {showPostModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.post_quote}</h2>
              <button onClick={() => {setShowPostModal(false); setPostContent(''); setSelectedBookForPost(null); setBooksForPost([]); setPostSearch('');}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <button 
                  onClick={() => setShowBookSelector(!showBookSelector)}
                  className={`w-full py-3 px-4 rounded-2xl flex items-center justify-between ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200'} transition-all`}
                >
                  <span className="font-bold text-sm">
                    {selectedBookForPost 
                      ? `${t.select_book}: ${selectedBookForPost.volumeInfo?.title || selectedBookForPost.title}` 
                      : t.select_book}
                  </span>
                  {showBookSelector ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {showBookSelector && (
                  <div className={`mt-2 p-3 rounded-2xl ${theme === 'dark' ? 'bg-gray-700' : theme === 'sunset' ? 'bg-amber-100' : 'bg-slate-50'}`}>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input 
                        type="text" 
                        value={postSearch} 
                        onChange={(e) => setPostSearch(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && searchBooksForPost()}
                        className={`w-full rounded-xl pl-9 pr-3 py-2 text-sm outline-none ${theme === 'dark' ? 'bg-gray-600 text-gray-100 border-gray-500' : theme === 'sunset' ? 'bg-amber-50 text-gray-800 border-amber-200' : 'bg-white text-slate-900 border-slate-200'} border`}
                        placeholder={t.search}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {booksForPost.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4">{lang === 'es' ? 'Busca o selecciona un libro' : 'Search or select a book'}</p>
                      ) : (
                        booksForPost.map((book, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => {setSelectedBookForPost(book); setShowBookSelector(false);}}
                            className={`w-full p-2 rounded-xl flex items-center gap-3 transition-all ${
                              selectedBookForPost?.id === book.id || selectedBookForPost?.bookId === book.bookId
                                ? 'bg-indigo-100 dark:bg-indigo-900'
                                : 'hover:bg-white/10'
                            }`}
                          >
                            <img 
                              src={book.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || book.thumbnail || 'https://via.placeholder.com/40x60?text=NO+COVER'} 
                              className="w-8 h-12 object-contain rounded bg-white"
                              alt={book.volumeInfo?.title || book.title}
                            />
                            <div className="flex-1 text-left">
                              <p className="text-xs font-bold line-clamp-1">{book.volumeInfo?.title || book.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-gray-400 line-clamp-1">{book.volumeInfo?.authors?.join(', ') || book.authors?.join(', ')}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <textarea 
                value={postContent} 
                onChange={(e) => setPostContent(e.target.value)} 
                className={`w-full rounded-2xl p-4 text-sm outline-none min-h-[200px] ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                placeholder={t.write_quote}
                maxLength={2500}
              />
              <div className="flex justify-between mt-2 mb-4">
                <p className="text-xs text-slate-400">{t.max_characters}</p>
                <p className={`text-xs font-bold ${postContent.length >= 2500 ? 'text-red-500' : 'text-slate-400'}`}>
                  {postContent.length}/2500
                </p>
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
                <Send size={18}/> {t.post_quote}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AMIGOS */}
      {showFriendsSection && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.friends}</h2>
              <button onClick={() => setShowFriendsSection(false)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-shrink-0 p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                  type="text" 
                  value={friendsSearch} 
                  onChange={(e) => setFriendsSearch(e.target.value)} 
                  className={`w-full rounded-2xl pl-12 pr-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                  placeholder={t.search_people}
                />
              </div>
              <div className="flex justify-center gap-2 mt-4 flex-wrap">
                {['all', 'google', 'anonymous', 'following', 'followers'].map((type) => (
                  <button 
                    key={type} 
                    onClick={() => setFriendsFilter(type)} 
                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${friendsFilter === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400'}`}
                  >
                    {type === 'all' ? t.all_users : type === 'google' ? t.google_users : type === 'anonymous' ? t.anonymous_users : type === 'following' ? t.following : t.followers_list}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {friendRequests.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-black text-sm uppercase tracking-widest mb-3">{t.pending_requests}</h3>
                  <div className="space-y-3">
                    {friendRequests.map((req) => (
                      <div key={req.id} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <img src={req.senderPic || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover" alt={req.senderName} />
                          <div>
                            <p className="font-bold text-sm">{req.senderName}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">{lang === 'es' ? 'Quiere ser tu amigo' : 'Wants to be your friend'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => acceptFriendRequest(req.id, req.senderId, req.senderName)}
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold"
                          >
                            {t.accept}
                          </button>
                          <button 
                            onClick={() => rejectFriendRequest(req.id)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
                          >
                            {t.reject}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{t.no_friends_yet}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((p) => {
                    const isFollowing = userProfile.following?.includes(p.userId);
                    const hasSentRequest = sentFriendRequests.some(req => req.receiverId === p.userId);
                    const isMutualFriend = p.following?.includes(user?.uid) && userProfile.following?.includes(p.userId);
                    return (
                      <div key={p.userId} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.profilePic || 'https://via.placeholder.com/40'} 
                            className="w-12 h-12 rounded-full object-cover cursor-pointer"
                            alt={p.name}
                            onClick={() => openUserProfileModal(p)}
                          />
                          <div>
                            <p className="font-bold text-sm cursor-pointer" onClick={() => openUserProfileModal(p)}>{p.name}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {p.readCount || 0} {t.read.toLowerCase()} • {getLevelTitle(p.readCount, lang)}
                              <img src={getLevelSymbol(p.readCount)} className="w-3 h-3 object-contain inline-block ml-1" alt="Nivel" />
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isMutualFriend ? (
                            <button 
                              onClick={() => removeFriend(p.userId)}
                              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
                            >
                              {t.remove_friend}
                            </button>
                          ) : isFollowing ? (
                            <button 
                              onClick={() => toggleFollow(p.userId)}
                              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                            >
                              {t.unfollow}
                            </button>
                          ) : hasSentRequest ? (
                            <button 
                              onClick={() => cancelFriendRequest(sentFriendRequests.find(req => req.receiverId === p.userId)?.id)}
                              className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-xs font-bold"
                            >
                              {t.request_sent}
                            </button>
                          ) : (
                            <button 
                              onClick={() => sendFriendRequest(p.userId, p.name)}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                            >
                              {t.send_request}
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedUserForMessage(p);
                              setShowNewMessageModal(true);
                            }}
                            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold"
                          >
                            <MessageSquare size={14} />
                          </button>
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

      {/* MODAL MENSAJES */}
      {showMessages && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.messages}</h2>
              <button onClick={() => {setShowMessages(false); setSelectedConversation(null);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
              <button 
                onClick={() => setShowNewMessageModal(true)}
                className="absolute top-6 left-6 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              >
                <MessageSquarePlus size={20}/>
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-gray-700 flex items-center gap-3">
                    <button 
                      onClick={() => {setSelectedConversation(null); setActiveMessages([]);}}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <img 
                      src={selectedConversation.participantNames?.find((_, i) => selectedConversation.participants[i] !== user?.uid) !== selectedConversation.participantNames?.[0]
                        ? selectedConversation.participantNames?.[1] 
                        : selectedConversation.participantNames?.[0]
                      } 
                      className="w-10 h-10 rounded-full object-cover"
                      alt=""
                    />
                    <div>
                      <p className="font-bold text-sm">
                        {selectedConversation.participantNames?.find((_, i) => selectedConversation.participants[i] !== user?.uid) !== selectedConversation.participantNames?.[0]
                          ? selectedConversation.participantNames?.[1] 
                          : selectedConversation.participantNames?.[0]
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                        <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{t.no_messages}</p>
                      </div>
                    ) : (
                      activeMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-2xl ${
                            msg.senderId === user?.uid 
                              ? 'bg-indigo-600 text-white rounded-br-none' 
                              : theme === 'dark' ? 'bg-gray-700 text-gray-100 rounded-bl-none' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 rounded-bl-none' : 'bg-slate-100 text-slate-900 rounded-bl-none'
                          }`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className="text-[10px] opacity-60 mt-1">
                              {msg.timestamp?.seconds 
                                ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''
                              }
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && newMessage.trim() && sendMessage(
                          selectedConversation.participants.find(id => id !== user?.uid),
                          selectedConversation.participantNames?.find((_, i) => selectedConversation.participants[i] !== user?.uid) !== selectedConversation.participantNames?.[0]
                            ? selectedConversation.participantNames?.[1] 
                            : selectedConversation.participantNames?.[0],
                          newMessage
                        )}
                        className={`flex-1 rounded-2xl px-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                        placeholder={t.type_message}
                      />
                      <button 
                        onClick={() => sendMessage(
                          selectedConversation.participants.find(id => id !== user?.uid),
                          selectedConversation.participantNames?.find((_, i) => selectedConversation.participants[i] !== user?.uid) !== selectedConversation.participantNames?.[0]
                            ? selectedConversation.participantNames?.[1] 
                            : selectedConversation.participantNames?.[0],
                          newMessage
                        )}
                        disabled={!newMessage.trim()}
                        className={`px-4 rounded-2xl font-bold transition-all ${
                          !newMessage.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Send size={18}/>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto p-6">
                  {conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                      <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{t.no_messages}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversations.map((conv) => {
                        const otherParticipantIndex = conv.participants.findIndex(id => id !== user?.uid);
                        const otherParticipantId = conv.participants[otherParticipantIndex];
                        const otherParticipantName = conv.participantNames?.[otherParticipantIndex];
                        const otherParticipant = publicData.find(p => p.userId === otherParticipantId);
                        const unreadCount = conv.unreadCount?.[user?.uid] || 0;
                        return (
                          <button 
                            key={conv.id} 
                            onClick={() => {
                              setSelectedConversation(conv);
                              markMessagesAsRead(conv.id);
                              loadMessages(conv.id);
                            }}
                            className={`w-full p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'sunset' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-slate-50 hover:bg-slate-100'} flex items-center gap-4 transition-all text-left`}
                          >
                            <img 
                              src={otherParticipant?.profilePic || 'https://via.placeholder.com/40'} 
                              className="w-12 h-12 rounded-full object-cover"
                              alt={otherParticipantName}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{otherParticipantName}</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{conv.lastMessage}</p>
                            </div>
                            {unreadCount > 0 && (
                              <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                {unreadCount}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO MENSAJE */}
      {showNewMessageModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[90vh]`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.new_message}</h2>
              <button onClick={() => {setShowNewMessageModal(false); setSelectedUserForMessage(null); setMessageSearch('');}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                  type="text" 
                  value={messageSearch} 
                  onChange={(e) => setMessageSearch(e.target.value)} 
                  className={`w-full rounded-2xl pl-12 pr-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                  placeholder={t.search_people}
                />
              </div>
              <div className="space-y-3">
                {friendsList
                  .filter(friend => friend.name?.toLowerCase().includes(messageSearch.toLowerCase()))
                  .map((friend) => (
                    <button 
                      key={friend.userId} 
                      onClick={() => {
                        setSelectedUserForMessage(friend);
                        setShowNewMessageModal(false);
                        setShowMessages(true);
                        const existingConv = conversations.find(conv => 
                          conv.participants.includes(user?.uid) && conv.participants.includes(friend.userId)
                        );
                        if (existingConv) {
                          setSelectedConversation(existingConv);
                          markMessagesAsRead(existingConv.id);
                          loadMessages(existingConv.id);
                        }
                      }}
                      className={`w-full p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : theme === 'sunset' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-slate-50 hover:bg-slate-100'} flex items-center gap-4 transition-all text-left`}
                    >
                      <img src={friend.profilePic || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full object-cover" alt={friend.name} />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{friend.name}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">{friend.readCount || 0} {t.read.toLowerCase()}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIBROS LEÍDOS */}
      {viewingReadBooks && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.view_read_books}</h2>
              <button onClick={() => setViewingReadBooks(false)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {readBooksList.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{lang === 'es' ? 'No hay libros leídos' : 'No read books'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {readBooksList.map((book, idx) => (
                    <div 
                      key={idx} 
                      className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-2 rounded-xl border ${themeClasses.border} cursor-pointer hover:scale-105 transition-all`}
                      onClick={() => {
                        setViewingReadBooks(false);
                        openBookDetailModal(book);
                      }}
                    >
                      <img 
                        src={book.thumbnail || 'https://via.placeholder.com/150x200?text=NO+COVER'} 
                        className="w-full aspect-[2/3] object-contain rounded-lg bg-white mb-2"
                        alt={book.title}
                      />
                      <p className="text-xs font-bold line-clamp-2">{book.title}</p>
                    </div>
                  ))}
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
              <h2 className="text-xl font-black text-white text-center">{t.favorite_writers}</h2>
              <button onClick={() => setShowFavoriteWriters(false)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-shrink-0 p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                  type="text" 
                  value={writerSearch} 
                  onChange={(e) => setWriterSearch(e.target.value)} 
                  className={`w-full rounded-2xl pl-12 pr-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                  placeholder={t.search_writers}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {filteredFavoriteWriters.length === 0 ? (
                <div className="text-center py-12">
                  <PenTool className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{lang === 'es' ? 'No hay escritores favoritos' : 'No favorite writers'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFavoriteWriters.map((writer, idx) => (
                    <div 
                      key={idx} 
                      className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border} flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                          <PenTool size={20} className="text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{writer}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">{lang === 'es' ? 'Escritor favorito' : 'Favorite writer'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleFavoriteWriter(writer)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FRASES GUARDADAS */}
      {showSavedPosts && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.saved_posts}</h2>
              <button onClick={() => setShowSavedPosts(false)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {filteredSavedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={48} />
                  <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{lang === 'es' ? 'No hay frases guardadas' : 'No saved quotes'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSavedPosts.map((post) => (
                    <div key={post.id} className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl border ${themeClasses.border}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={post.userPic || 'https://via.placeholder.com/40'} 
                          className="w-10 h-10 rounded-full object-cover cursor-pointer"
                          alt={post.userName}
                          onClick={() => openUserProfileModal({ name: post.userName, profilePic: post.userPic, userId: post.userId })}
                        />
                        <div>
                          <p className="font-bold text-sm cursor-pointer" onClick={() => openUserProfileModal({ name: post.userName, profilePic: post.userPic, userId: post.userId })}>{post.userName}</p>
                          <p className="text-[10px] text-slate-400">{post.timestamp?.seconds ? new Date(post.timestamp.seconds * 1000).toLocaleDateString() : ''}</p>
                        </div>
                      </div>
                      {post.bookThumbnail && (
                        <img 
                          src={post.bookThumbnail} 
                          className="w-16 h-24 object-contain rounded-lg mb-3 cursor-pointer"
                          alt={post.bookTitle}
                          onClick={() => openBookDetailModal({ title: post.bookTitle, thumbnail: post.bookThumbnail, authors: post.bookAuthors })}
                        />
                      )}
                      <p className="text-sm text-slate-600 dark:text-gray-300 mb-3">{post.content}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                          <button 
                            onClick={() => likeWallPost(post.id, post.likes || 0, post.likesBy || [])}
                            className={`flex items-center gap-1 text-xs ${(post.likesBy || []).includes(user?.uid) ? 'text-red-500' : 'text-slate-400'}`}
                          >
                            <Heart size={14} className={(post.likesBy || []).includes(user?.uid) ? 'fill-red-500' : ''} />
                            {post.likes || 0}
                          </button>
                          <button 
                            onClick={() => toggleSavedPost(post.id)}
                            className="flex items-center gap-1 text-xs text-yellow-500"
                          >
                            <Bookmark size={14} className="fill-yellow-500" />
                            {t.saved}
                          </button>
                        </div>
                        <button 
                          onClick={() => toggleSavedPost(post.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                        >
                          <Trash2 size={16} />
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

      {/* MODAL TUTORIAL */}
      {showTutorial && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-8 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'}`}>
              <h2 className="text-2xl font-black text-white text-center">{t.tutorial_welcome}</h2>
            </div>
            <div className="p-8 text-center">
              <div className="mb-8">
                {tutorialStep === 0 && (
                  <>
                    <BookOpen size={64} className="mx-auto text-indigo-500 mb-4" />
                    <p className="text-lg font-bold mb-2">{t.tutorial_step1}</p>
                  </>
                )}
                {tutorialStep === 1 && (
                  <>
                    <Calendar size={64} className="mx-auto text-green-500 mb-4" />
                    <p className="text-lg font-bold mb-2">{t.tutorial_step2}</p>
                  </>
                )}
                {tutorialStep === 2 && (
                  <>
                    <Users size={64} className="mx-auto text-purple-500 mb-4" />
                    <p className="text-lg font-bold mb-2">{t.tutorial_step3}</p>
                  </>
                )}
                {tutorialStep === 3 && (
                  <>
                    <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
                    <p className="text-lg font-bold mb-2">{t.tutorial_step4}</p>
                  </>
                )}
                {tutorialStep === 4 && (
                  <>
                    <Sparkles size={64} className="mx-auto text-pink-500 mb-4" />
                    <p className="text-lg font-bold mb-2">{lang === 'es' ? '¡Listo para comenzar!' : 'Ready to start!'}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">{lang === 'es' ? 'Disfruta tu experiencia en Sandbook' : 'Enjoy your Sandbook experience'}</p>
                  </>
                )}
              </div>
              <div className="flex justify-center gap-2 mb-6">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`w-2 h-2 rounded-full ${step === tutorialStep ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-gray-600'}`}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleTutorialSkip}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm uppercase transition-all ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : theme === 'sunset' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {t.tutorial_skip}
                </button>
                <button 
                  onClick={handleTutorialNext}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase transition-all"
                >
                  {tutorialStep === 4 ? (lang === 'es' ? '¡Comenzar!' : 'Start!') : t.tutorial_next}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRÉSTAMO */}
      {showBorrowModal && bookToBorrow && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'}`}>
              <h2 className="text-xl font-black text-white text-center">{t.borrow_book}</h2>
              <button onClick={() => {setShowBorrowModal(false); setBookToBorrow(null);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center gap-4 mb-6">
                <img 
                  src={bookToBorrow.thumbnail || 'https://via.placeholder.com/150x200?text=NO+COVER'} 
                  className="w-24 h-36 object-contain rounded-2xl shadow-md bg-white"
                  alt={bookToBorrow.title}
                />
                <div className="text-center">
                  <h3 className="font-black text-lg">{bookToBorrow.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{bookToBorrow.authors?.join(', ')}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-gray-300 text-center mb-6">
                {lang === 'es' 
                  ? `¿Quieres pedir prestado este libro a ${bookToBorrow.ownerName || 'su dueño'}?`
                  : `Do you want to borrow this book from ${bookToBorrow.ownerName || 'its owner'}?`
                }
              </p>
              <button 
                onClick={() => sendBorrowRequest(bookToBorrow, bookToBorrow.ownerId, bookToBorrow.ownerName)}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase transition-all"
              >
                {t.borrow_book}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTIFICACIONES */}
      {showNotifications && (
        <div ref={notificationsModalRef} className="fixed top-20 right-4 z-[1000] w-80 max-h-[70vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-slate-200 dark:border-gray-700">
            <h3 className="font-black text-sm uppercase">{lang === 'es' ? 'Notificaciones' : 'Notifications'}</h3>
          </div>
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="mx-auto text-slate-300 dark:text-gray-600 mb-2" size={32} />
                <p className="text-xs text-slate-400">{lang === 'es' ? 'Sin notificaciones' : 'No notifications'}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button 
                  key={notif.id} 
                  onClick={() => markNotificationAsRead(notif.id)}
                  className="w-full p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-gray-700 text-left transition-all"
                >
                  <p className="font-bold text-xs">{notif.title}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {notif.timestamp?.seconds 
                      ? new Date(notif.timestamp.seconds * 1000).toLocaleDateString()
                      : ''
                    }
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL REQUIERE GOOGLE LOGIN */}
      {requireGoogleLogin && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-8 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'}`}>
              <h2 className="text-2xl font-black text-white text-center">{t.require_google_login}</h2>
            </div>
            <div className="p-8 text-center">
              <div className="mb-8">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
                  alt="Google" 
                  className="w-16 h-16 mx-auto mb-4"
                />
                <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">
                  {lang === 'es' 
                    ? 'Para acceder a todas las funciones de Sandbook, necesitas registrarte con Google.'
                    : 'To access all Sandbook features, you need to register with Google.'
                  }
                </p>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full py-4 rounded-2xl bg-white text-slate-900 font-black text-sm uppercase shadow-md flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
                    alt="Google" 
                    className="w-5 h-5"
                  />
                  {t.register_with_google}
                </button>
                <button 
                  onClick={continueWithoutAccount}
                  className={`w-full py-4 rounded-2xl font-bold text-sm uppercase transition-all ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : theme === 'sunset' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {t.continue_without_account}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-[100] ${themeClasses.card} shadow-lg border-b ${themeClasses.border}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="text-white" size={20} />
            </div>
            <h1 className="font-black text-xl tracking-tight">Sandbook</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-gray-700' : theme === 'sunset' ? 'hover:bg-amber-100' : 'hover:bg-slate-100'} transition-colors`}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {notifications.length}
                </div>
              )}
            </button>
            <button 
              onClick={() => setShowMessages(true)}
              className={`relative p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-gray-700' : theme === 'sunset' ? 'hover:bg-amber-100' : 'hover:bg-slate-100'} transition-colors`}
            >
              <MessageSquare size={20} />
              {conversations.some(conv => (conv.unreadCount?.[user?.uid] || 0) > 0) && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {conversations.filter(conv => (conv.unreadCount?.[user?.uid] || 0) > 0).length}
                </div>
              )}
            </button>
            <button 
              onClick={() => {
                const newTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'sunset' : 'dark';
                changeTheme(newTheme);
              }}
              className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-gray-700' : theme === 'sunset' ? 'hover:bg-amber-100' : 'hover:bg-slate-100'} transition-colors`}
            >
              {theme === 'dark' ? <Sun size={20} /> : theme === 'sunset' ? <Sunset size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-gray-700' : theme === 'sunset' ? 'hover:bg-amber-100' : 'hover:bg-slate-100'} transition-colors font-bold text-xs`}
            >
              {lang === 'es' ? 'EN' : 'ES'}
            </button>
            {/* FOTO DE PERIL ARREGLADA - CÍRCULO PERFECTO */}
            <img 
              src={userProfile.profilePic || 'https://via.placeholder.com/40'} 
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 cursor-pointer hover:scale-105 transition-all"
              style={{ aspectRatio: '1/1', minWidth: '40px', minHeight: '40px' }}
              alt={userProfile.name}
              onClick={() => setActiveTab('profile')}
            />
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="pt-20 px-4 max-w-5xl mx-auto">
        {/* PESTAÑA: BIBLIOTECA */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            {/* Barra de búsqueda en biblioteca */}
            <div className={`${themeClasses.card} rounded-3xl p-4 shadow-md border ${themeClasses.border}`}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                  type="text" 
                  value={librarySearch} 
                  onChange={(e) => setLibrarySearch(e.target.value)} 
                  className={`w-full rounded-2xl pl-12 pr-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-slate-50 text-slate-900 border-slate-200'} border`}
                  placeholder={t.search_in_my_books}
                />
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {['all', 'favorite', 'read', 'liked', 'in_plan', 'in_library'].map((type) => (
                <button 
                  key={type} 
                  onClick={() => setFilterType(type)} 
                  className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase transition-all ${filterType === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400'}`}
                >
                  {type === 'all' ? t.all : type === 'favorite' ? t.favorites : type === 'read' ? t.read : type === 'liked' ? t.liked : type === 'in_plan' ? t.in_plan : t.in_library}
                </button>
              ))}
            </div>
            
            {/* Lista de libros */}
            {filteredMyBooks.length === 0 ? (
              <div className={`${themeClasses.card} rounded-3xl p-12 text-center shadow-md border ${themeClasses.border}`}>
                <BookOpen className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={64} />
                <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{lang === 'es' ? 'Tu biblioteca está vacía' : 'Your library is empty'}</p>
                <button 
                  onClick={() => setActiveTab('plan')} 
                  className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm uppercase transition-all"
                >
                  {t.search_now}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMyBooks.map((book) => (
                  <div key={book.bookId} className={`${themeClasses.card} rounded-3xl p-4 shadow-md border ${themeClasses.border}`}>
                    <div className="flex gap-4">
                      <img 
                        src={book.thumbnail || 'https://via.placeholder.com/150x200?text=NO+COVER'} 
                        className="w-20 h-28 object-contain rounded-xl bg-white shadow-sm cursor-pointer hover:scale-105 transition-all"
                        alt={book.title}
                        onClick={() => openBookDetailModal(book)}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate cursor-pointer" onClick={() => openBookDetailModal(book)}>{book.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{book.authors?.join(', ')}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase ${
                            book.status === 'read' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' : 
                            book.status === 'reading' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 
                            'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400'
                          }`}>
                            {book.status === 'read' ? t.read : book.status === 'reading' ? t.in_plan : t.in_library}
                          </span>
                          {book.isFavorite && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                        </div>
                        {book.status === 'reading' && book.checkpoints && (
                          <div className="mt-3">
                            <div className="flex justify-between text-[10px] text-slate-500 dark:text-gray-400 mb-1">
                              <span>{t.reading_progress}</span>
                              <span>{Math.round((book.checkpoints.filter(cp => cp.completed).length / book.checkpoints.length) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 transition-all duration-700" 
                                style={{ width: `${(book.checkpoints.filter(cp => cp.completed).length / book.checkpoints.length) * 100}%` }} 
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={() => openBookDetailModal(book)}
                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold"
                          >
                            {t.view_book_details}
                          </button>
                          <button 
                            onClick={() => setBookToDelete(book.bookId)}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-bold"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: PLANEAR */}
        {activeTab === 'plan' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            {/* Barra de búsqueda */}
            <div className={`${themeClasses.card} rounded-3xl p-4 shadow-md border ${themeClasses.border}`}>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                  className={`w-full rounded-2xl pl-12 pr-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-slate-50 text-slate-900 border-slate-200'} border`}
                  placeholder={t.search_p}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'intitle', 'inauthor', 'isbn'].map((type) => (
                  <button 
                    key={type} 
                    onClick={() => setSearchType(type)} 
                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${searchType === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400'}`}
                  >
                    {type === 'all' ? t.global_f : type === 'intitle' ? t.title_f : type === 'inauthor' ? t.author_f : t.isbn_f}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => performSearch()}
                  disabled={isSearching || !searchQuery.trim()}
                  className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase transition-all ${
                    isSearching || !searchQuery.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isSearching ? <Loader2 className="animate-spin mx-auto" size={20}/> : t.search}
                </button>
                <button 
                  onClick={startScanner}
                  className="px-4 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm uppercase transition-all"
                >
                  <Barcode size={20}/>
                </button>
              </div>
            </div>
            
            {/* Resultados de búsqueda */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-black text-sm uppercase tracking-widest">{t.search_now}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((book) => {
                    const alreadyHave = myBooks.find(b => b.bookId === book.id);
                    return (
                      <div key={book.id} className={`${themeClasses.card} rounded-3xl p-4 shadow-md border ${themeClasses.border}`}>
                        <div className="flex gap-4">
                          <SearchBookCover 
                            book={book} 
                            alreadyHave={alreadyHave} 
                            t={t} 
                            lang={lang}
                            onViewDetails={(book) => {
                              setViewingBook(book);
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate cursor-pointer" onClick={() => openBookDetailModal(book)}>{book.volumeInfo?.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{book.volumeInfo?.authors?.join(', ')}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{book.volumeInfo?.pageCount} {t.pages}</p>
                            <div className="flex gap-2 mt-3">
                              <button 
                                onClick={() => handleAddBook(book, 'library', false, true)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${alreadyHave ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                disabled={alreadyHave}
                              >
                                {alreadyHave ? t.in_your_library : t.add_to_library}
                              </button>
                              <button 
                                onClick={() => {setPlanningBook(book);}}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[10px] font-bold"
                              >
                                {t.reading_plan}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {searchError && (
              <div className={`${themeClasses.card} rounded-3xl p-8 text-center shadow-md border ${themeClasses.border}`}>
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <p className="text-slate-500 dark:text-gray-400">{searchError}</p>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: RED SOCIAL */}
        {activeTab === 'social' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            {/* Botón publicar */}
            <button 
              onClick={() => {
                setBooksForPost(myBooks.slice(0, 10));
                setShowPostModal(true);
              }}
              className={`w-full py-4 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase shadow-md flex items-center justify-center gap-2 transition-all`}
            >
              <PenLine size={18}/> {t.post_quote}
            </button>
            
            {/* Posts del muro */}
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
              </div>
            ) : wallPosts.length === 0 ? (
              <div className={`${themeClasses.card} rounded-3xl p-12 text-center shadow-md border ${themeClasses.border}`}>
                <MessageSquare className={`mx-auto ${theme === 'dark' ? 'text-gray-700' : theme === 'sunset' ? 'text-amber-200' : 'text-slate-200'} mb-4`} size={64} />
                <p className={`${theme === 'dark' ? 'text-gray-400' : theme === 'sunset' ? 'text-amber-400' : 'text-slate-400'} font-bold uppercase text-[10px] tracking-widest`}>{t.no_posts}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {wallPosts.map((post) => {
                  const isOwnPost = post.userId === user?.uid;
                  const isLiked = (post.likesBy || []).includes(user?.uid);
                  const isSaved = savedPostsList.includes(post.id);
                  const postComments = wallPostComments[post.id] || [];
                  return (
                    <div key={post.id} className={`${themeClasses.card} rounded-3xl p-4 shadow-md border ${themeClasses.border}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={post.userPic || 'https://via.placeholder.com/40'} 
                            className="w-10 h-10 rounded-full object-cover cursor-pointer"
                            alt={post.userName}
                            onClick={() => openUserProfileModal({ name: post.userName, profilePic: post.userPic, userId: post.userId, readCount: publicData.find(p => p.userId === post.userId)?.readCount || 0, followersCount: publicData.find(p => p.userId === post.userId)?.followersCount || 0, badges: publicData.find(p => p.userId === post.userId)?.badges || [] })}
                          />
                          <div>
                            <p className="font-bold text-sm cursor-pointer" onClick={() => openUserProfileModal({ name: post.userName, profilePic: post.userPic, userId: post.userId, readCount: publicData.find(p => p.userId === post.userId)?.readCount || 0, followersCount: publicData.find(p => p.userId === post.userId)?.followersCount || 0, badges: publicData.find(p => p.userId === post.userId)?.badges || [] })}>{post.userName}</p>
                            <p className="text-[10px] text-slate-400">{post.timestamp?.seconds ? new Date(post.timestamp.seconds * 1000).toLocaleDateString() : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Indicador de privacidad */}
                          {post.isPublic === false && (
                            <Lock size={14} className="text-slate-400" title={lang === 'es' ? 'Privado' : 'Private'} />
                          )}
                          {isOwnPost && (
                            <div className="relative">
                              <button 
                                onClick={() => setShowPostOptions(showPostOptions === post.id ? null : post.id)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {showPostOptions === post.id && (
                                <div className={`absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-xl border ${themeClasses.border} ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-white'} z-10`}>
                                  <button 
                                    onClick={() => {
                                      setEditingPost(post.id);
                                      setEditPostContent(post.content);
                                      setShowPostOptions(null);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-2xl"
                                  >
                                    <Edit size={14} /> {t.edit_post}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      togglePostPrivacy(post.id, post.isPublic);
                                      setShowPostOptions(null);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    {post.isPublic === false ? <Eye size={14} /> : <EyeOff size={14} />}
                                    {post.isPublic === false ? t.make_public : t.make_private}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setPostToDelete(post.id);
                                      setShowPostOptions(null);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center gap-2 rounded-b-2xl"
                                  >
                                    <Trash2 size={14} /> {t.delete_post}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {post.bookThumbnail && (
                        <div className="flex items-center gap-3 mb-3 p-3 bg-slate-50 dark:bg-gray-700/50 rounded-2xl">
                          <img 
                            src={post.bookThumbnail} 
                            className="w-12 h-16 object-contain rounded-lg cursor-pointer hover:scale-105 transition-all"
                            alt={post.bookTitle}
                            onClick={() => openBookDetailModal({ title: post.bookTitle, thumbnail: post.bookThumbnail, authors: post.bookAuthors })}
                          />
                          <div>
                            <p className="font-bold text-xs cursor-pointer" onClick={() => openBookDetailModal({ title: post.bookTitle, thumbnail: post.bookThumbnail, authors: post.bookAuthors })}>{post.bookTitle}</p>
                            <p className="text-[10px] text-slate-500 dark:text-gray-400">{post.bookAuthors?.join(', ')}</p>
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-slate-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-gray-700">
                        <div className="flex gap-4">
                          <button 
                            onClick={() => likeWallPost(post.id, post.likes || 0, post.likesBy || [])}
                            className={`flex items-center gap-1 text-xs transition-all ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                          >
                            <Heart size={16} className={isLiked ? 'fill-red-500' : ''} />
                            {post.likes || 0}
                          </button>
                          <button 
                            onClick={() => {
                              const input = document.getElementById(`comment-input-${post.id}`);
                              if (input) input.focus();
                            }}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500 transition-all"
                          >
                            <MessageCircle size={16} />
                            {postComments.length}
                          </button>
                          <button 
                            onClick={() => toggleSavedPost(post.id)}
                            className={`flex items-center gap-1 text-xs transition-all ${isSaved ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
                          >
                            <Bookmark size={16} className={isSaved ? 'fill-yellow-500' : ''} />
                            {isSaved ? t.saved : t.save_post}
                          </button>
                        </div>
                      </div>
                      {/* Comentarios */}
                      {postComments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {postComments.slice(0, 3).map((comment) => (
                            <div key={comment.id} className="flex gap-2 text-sm">
                              <img 
                                src={comment.userPic || 'https://via.placeholder.com/24'} 
                                className="w-6 h-6 rounded-full object-cover cursor-pointer"
                                alt={comment.userName}
                                onClick={() => openUserProfileModal({ name: comment.userName, profilePic: comment.userPic, userId: comment.userId })}
                              />
                              <div className="flex-1">
                                <p className="font-bold text-xs cursor-pointer" onClick={() => openUserProfileModal({ name: comment.userName, profilePic: comment.userPic, userId: comment.userId })}>{comment.userName}</p>
                                <p className="text-xs text-slate-600 dark:text-gray-300">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                          {postComments.length > 3 && (
                            <p className="text-xs text-slate-400">{lang === 'es' ? `Ver ${postComments.length - 3} comentarios más` : `View ${postComments.length - 3} more comments`}</p>
                          )}
                        </div>
                      )}
                      {/* Input de comentario */}
                      <div className="mt-4 flex gap-2">
                        <input 
                          id={`comment-input-${post.id}`}
                          type="text" 
                          value={commentInputs[post.id] || ''} 
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))} 
                          onKeyPress={(e) => e.key === 'Enter' && addWallPostComment(post.id, commentInputs[post.id])}
                          className={`flex-1 rounded-2xl px-4 py-2 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-slate-50 text-slate-900 border-slate-200'} border`}
                          placeholder={lang === 'es' ? 'Escribe un comentario...' : 'Write a comment...'}
                        />
                        <button 
                          onClick={() => addWallPostComment(post.id, commentInputs[post.id])}
                          disabled={!commentInputs[post.id]?.trim()}
                          className={`px-4 rounded-2xl font-bold transition-all ${
                            !commentInputs[post.id]?.trim()
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          <Send size={16}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: PERFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            {/* Header del perfil */}
            <div className={`${themeClasses.card} rounded-3xl overflow-hidden shadow-md border ${themeClasses.border}`}>
              <div className={`h-32 ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-800 to-purple-900' : theme === 'sunset' ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}></div>
              <div className="px-6 pb-6">
                <div className="relative -mt-16 mb-4 flex justify-between items-end">
                  <img 
                    src={userProfile.profilePic || 'https://via.placeholder.com/150'} 
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-xl object-cover"
                    alt={userProfile.name}
                  />
                  <button 
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md transition-all"
                  >
                    <Edit3 size={20}/>
                  </button>
                </div>
                <div className="text-center">
                  <h2 className="font-black text-2xl">{userProfile.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                    {getLevelTitle(userProfile.readCount || 0, lang)}
                    <img src={getLevelSymbol(userProfile.readCount || 0)} className="w-4 h-4 object-contain inline-block ml-1" alt="Nivel" />
                  </p>
                  <div className="flex justify-center gap-6 mt-4">
                    <button 
                      onClick={() => setShowFollowingModal(true)}
                      className="text-center hover:opacity-70 transition-opacity"
                    >
                      <p className="font-black text-lg">{followingList.length}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{t.following}</p>
                    </button>
                    <button 
                      onClick={() => setShowFollowersModal(true)}
                      className="text-center hover:opacity-70 transition-opacity"
                    >
                      <p className="font-black text-lg">{userProfile.followersCount || 0}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{t.followers}</p>
                    </button>
                    <button 
                      onClick={() => setShowMutualFriendsModal(true)}
                      className="text-center hover:opacity-70 transition-opacity"
                    >
                      <p className="font-black text-lg">{mutualFriendsList.length}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{t.friends}</p>
                    </button>
                  </div>
                </div>
                
                {isEditingProfile && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-2">{lang === 'es' ? 'Nombre' : 'Name'}</label>
                      <input 
                        type="text" 
                        value={userProfile.name} 
                        onChange={(e) => setUserProfile(p => ({ ...p, name: e.target.value }))} 
                        className={`w-full rounded-2xl px-4 py-3 text-sm outline-none ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-2">{lang === 'es' ? 'Foto de perfil' : 'Profile picture'}</label>
                      <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-gray-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700 transition-all">
                        <Camera size={24} className="text-slate-400" />
                        <span className="text-sm text-slate-500">{lang === 'es' ? 'Subir foto' : 'Upload photo'}</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                    <button 
                      onClick={async () => {
                        if (user) {
                          await updateDoc(doc(db, 'profiles', user.uid), { name: userProfile.name });
                          setIsEditingProfile(false);
                        }
                      }}
                      className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase transition-all"
                    >
                      {t.save}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${themeClasses.card} rounded-3xl p-6 text-center shadow-md border ${themeClasses.border}`}>
                <BookOpen size={32} className="mx-auto text-indigo-500 mb-2" />
                <p className="font-black text-3xl">{currentlyReadingCount}</p>
                <p className="text-[10px] text-slate-400 uppercase">{t.currently_reading}</p>
              </div>
              <div className={`${themeClasses.card} rounded-3xl p-6 text-center shadow-md border ${themeClasses.border}`}>
                <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                <p className="font-black text-3xl">{booksThisMonth}</p>
                <p className="text-[10px] text-slate-400 uppercase">{t.books_this_month}</p>
              </div>
            </div>
            
            {/* Insignias */}
            <div className={`${themeClasses.card} rounded-3xl p-6 shadow-md border ${themeClasses.border}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm uppercase tracking-widest">{t.badges_title}</h3>
                <p className="text-xs text-slate-400">{userProfile.badges?.length || 0}/20</p>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(BADGE_DEFS).map(([id, def]) => {
                  const hasBadge = userProfile.badges?.includes(parseInt(id));
                  const progress = badgeProgress[id] || 0;
                  return (
                    <button 
                      key={id}
                      onClick={() => openBadgeModal(id)}
                      className={`aspect-square rounded-2xl flex items-center justify-center transition-all hover:scale-110 ${hasBadge ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                      <div className="relative">
                        <Trophy size={24} className={hasBadge ? 'text-yellow-600 dark:text-yellow-300' : 'text-gray-400'} />
                        {!hasBadge && progress > 0 && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                            {Math.round(progress)}%
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Secciones adicionales */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowFavoriteWriters(true)}
                className={`${themeClasses.card} rounded-3xl p-6 text-center shadow-md border ${themeClasses.border} hover:scale-105 transition-all`}
              >
                <PenTool size={32} className="mx-auto text-purple-500 mb-2" />
                <p className="font-bold text-sm">{t.writers_section}</p>
                <p className="text-xs text-slate-400">{favoriteWritersList.length}</p>
              </button>
              <button 
                onClick={() => setShowSavedPosts(true)}
                className={`${themeClasses.card} rounded-3xl p-6 text-center shadow-md border ${themeClasses.border} hover:scale-105 transition-all`}
              >
                <Bookmark size={32} className="mx-auto text-yellow-500 mb-2" />
                <p className="font-bold text-sm">{t.saved_section}</p>
                <p className="text-xs text-slate-400">{savedPostsList.length}</p>
              </button>
            </div>
            
            {/* Botones de acción */}
            <div className="space-y-3">
              <button 
                onClick={() => setShowWriters(true)}
                className={`w-full py-4 rounded-3xl ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200'} font-bold text-sm uppercase transition-all flex items-center justify-center gap-2`}
              >
                <PenTool size={18}/> {t.writers}
              </button>
              <button 
                onClick={() => setShowFriendsSection(true)}
                className={`w-full py-4 rounded-3xl ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sunset' ? 'bg-amber-100 hover:bg-amber-200' : 'bg-slate-100 hover:bg-slate-200'} font-bold text-sm uppercase transition-all flex items-center justify-center gap-2`}
              >
                <Users size={18}/> {t.find_friends}
              </button>
              <button 
                onClick={inviteWhatsApp}
                className="w-full py-4 rounded-3xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm uppercase transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={18}/> {t.invite}
              </button>
              <button 
                onClick={handleLogout}
                className="w-full py-4 rounded-3xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm uppercase transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={18}/> {t.logout}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* NAVEGACIÓN INFERIOR */}
      <nav className={`fixed bottom-0 left-0 right-0 z-[100] ${themeClasses.card} shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t ${themeClasses.border} pb-safe`}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-around py-2">
            {[
              { id: 'library', icon: BookOpen, label: t.library },
              { id: 'plan', icon: Calendar, label: t.plan },
              { id: 'social', icon: Users, label: t.social },
              { id: 'profile', icon: User, label: t.profile }
            ].map(({ id, icon: Icon, label }) => (
              <button 
                key={id} 
                onClick={() => setActiveTab(id)} 
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${activeTab === id ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-gray-300'}`}
              >
                <Icon size={24} className={activeTab === id ? 'scale-110' : ''} />
                <span className="text-[10px] font-bold uppercase">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* MODALES DE SEGUIDORES/SIGUIENDO */}
      {showFollowingModal && renderFollowModal(t.following_list, followingList, 'following')}
      {showFollowersModal && renderFollowModal(t.followers_list_full, followersList, 'followers')}
      {showMutualFriendsModal && renderFollowModal(t.mutual_friends, mutualFriendsList, 'mutual')}
    </div>
  );
}
