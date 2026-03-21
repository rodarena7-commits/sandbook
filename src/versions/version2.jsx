import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup
} from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, addDoc,
  updateDoc, deleteDoc, query, where, serverTimestamp, increment,
  arrayUnion, arrayRemove, orderBy, limit, writeBatch, getDocs
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  BookOpen, Search, Trophy, CheckCircle, User, Award, Loader2,
  PenTool, Camera, MessageSquare, Send, X, ChevronDown, ChevronUp,
  ChevronRight, ChevronLeft, Edit3, Lock, Sparkles, Star,
  AlertCircle, Calendar, Users, Trash2, Languages, Share2,
  Heart, Moon, Sun, Sunset, LogOut, MessageSquarePlus,
  Eye, Bell, ThumbsUp, ThumbsDown, Bookmark, PenLine,
  TrendingUp, Clock, Flame, Target, Barcode, Library,
  UserMinus, Download, ZoomIn, ZoomOut, Handshake, Edit,
  MoreVertical, UserPlus
} from 'lucide-react';

// ─── GOOGLE FONTS ────────────────────────────────────────────
// Agregar en index.html:
// <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet" />

// ─── FIREBASE CONFIG ─────────────────────────────────────────
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
const googleProvider = new GoogleAuthProvider();

// ─── PALETA GOODREADS ─────────────────────────────────────────
const GR = {
  brown:      '#5a3e2b',
  brownMid:   '#7a5c45',
  brownLight: '#a07d60',
  cream:      '#f5f0e8',
  creamDark:  '#ece6d8',
  parchment:  '#faf7f2',
  green:      '#409640',
  greenDark:  '#2d7a2d',
  greenLight: '#eaf4ea',
  gold:       '#c9922f',
  goldLight:  '#fff3dc',
  rust:       '#c0392b',
  border:     '#d9d2c5',
  borderLight:'#ede8df',
};

// ─── TRADUCCIONES ─────────────────────────────────────────────
const i18n = {
  es: {
    library:"Biblioteca", plan:"Buscar", social:"Red", profile:"Yo",
    search_p:"Busca libros, autores o ISBN...", pages:"Páginas", days:"Días",
    start:"Comenzar", cancel:"Cancelar", delete_q:"¿Eliminar libro?",
    delete_desc:"Esta acción no se puede deshacer.", delete_btn:"Eliminar",
    invite:"INVITAR", read:"Leídos", pending:"Pendiente", favorites:"⭐ Favoritos",
    in_plan:"En plan", all:"Todos", in_library:"En Biblioteca",
    level:"Rango", followers:"Seguidores", search_now:"Buscar en Sandbook",
    manual_p:"Páginas totales", scan_msg:"Escaneando código...",
    title_f:"Título", author_f:"Autor", isbn_f:"ISBN", global_f:"Todo",
    reviews:"Reseñas", my_review:"Tu Opinión", daily_notes:"Notas del día",
    rate_book:"Calificar", save:"Guardar", who_read:"Lectores en Sandbook",
    global_rating:"Promedio Global", search_people:"Buscar personas...",
    recommend:"Recomendar", select_friend:"Elige un amigo",
    user_books:"Libros de", no_friends:"Sigue a alguien primero",
    badges_title:"Insignias", login:"Iniciar Sesión", logout:"Cerrar Sesión",
    google_login:"Google", message_placeholder:"Escribe un mensaje...",
    theme_dark:"Noche", theme_light:"Día", theme_sunset:"Atardecer",
    readers_count:"Personas que leyeron", add_to_library:"Añadir a biblioteca",
    in_your_library:"En tu biblioteca", reading_plan:"Plan de lectura",
    currently_reading:"Leyendo ahora", books_this_month:"Libros este mes",
    writers:"Escritores", search_writers:"Buscar escritores...",
    biography:"Biografía", books_written:"Libros escritos",
    like:"Me gusta", dislike:"No me gusta",
    wall:"Muro", post_quote:"Publicar frase", max_characters:"Máximo 2500 caracteres",
    select_book:"Seleccionar libro", write_quote:"Escribe una frase del libro...",
    posts:"Publicaciones", no_posts:"No hay publicaciones aún",
    authors:"Autores", loading_more:"Cargando más...", search:"Buscar",
    friends:"Amigos", following:"Siguiendo", followers_list:"Seguidores",
    find_friends:"Encontrar amigos", friend_requests:"Solicitudes",
    remove_friend:"Eliminar amigo", add_friend:"Agregar amigo",
    all_users:"Todos los usuarios", google_users:"Usuarios de Google",
    anonymous_users:"Usuarios anónimos",
    accept:"Aceptar", reject:"Rechazar", pending_requests:"Solicitudes pendientes",
    no_friends_yet:"Aún no tienes amigos", find_people:"Encontrar personas",
    send_request:"Enviar solicitud", request_sent:"Solicitud enviada",
    unfollow:"Dejar de seguir", start_date:"Fecha de inicio",
    today:"Hoy", tomorrow:"Mañana", next_week:"Próxima semana",
    custom_date:"Fecha personalizada", current_page:"Página actual",
    tutorial_next:"Siguiente", tutorial_skip:"Omitir tutorial",
    tutorial_welcome:"¡Bienvenido a Sandbook!",
    tutorial_step1:"Biblioteca: Aquí verás todos tus libros organizados",
    tutorial_step2:"Buscar: Encuentra libros con metas de lectura",
    tutorial_step3:"Red Social: Conecta con otros lectores y autores",
    tutorial_step4:"Tu Perfil: Gana insignias y sigue tu progreso",
    favorite_writers:"Escritores ⭐", saved_posts:"Frases Guardadas",
    messages:"Mensajes", send_message:"Enviar mensaje",
    new_message:"Nuevo mensaje", to:"Para", message:"Mensaje",
    conversation:"Conversación", type_message:"Escribe un mensaje...",
    no_messages:"No hay mensajes",
    mark_as_favorite_writer:"Marcar como escritor favorito",
    remove_favorite_writer:"Quitar de escritores favoritos",
    save_post:"Guardar publicación", remove_saved_post:"Quitar de guardados",
    saved:"Guardado", writers_section:"Escritores Favoritos",
    saved_section:"Frases Guardadas", view_read_books:"Ver libros leídos",
    register_with_google:"Registrarse con Google",
    continue_without_account:"Continuar sin cuenta",
    require_google_login:"Para usar todas las funciones, regístrate con Google",
    install_app:"Instalar App", search_in_my_books:"Buscar en mis libros...",
    following_list:"Siguiendo", followers_list_full:"Seguidores",
    mutual_friends:"Amigos mutuos", more_by_author:"Más del mismo autor",
    similar_books:"Libros similares", recommended_books:"Recomendaciones",
    load_more:"Cargar más", close:"Cerrar", download:"Descargar",
    borrow_book:"Pedir prestado", reading_progress:"Progreso de lectura",
    current_day:"Día actual", days_completed:"días completados",
    total_days:"días totales", started_on:"Comenzó el",
    edit_post:"Editar publicación", delete_post:"Eliminar publicación",
    make_public:"Hacer pública", make_private:"Hacer privada",
    confirm_delete_post:"¿Eliminar publicación?",
    confirm_delete_post_desc:"Esta acción no se puede deshacer.",
    badge_locked:"Insignia bloqueada", badge_unlocked:"¡Insignia desbloqueada!",
    badge_requirement:"Requisito", badge_progress:"Progreso",
    view_profile:"Ver perfil", checkpoint_notes_placeholder:"Escribe tus notas...",
    page_input_placeholder:"Página actual", my_notes:"Mis notas",
    reading_plan_status:"Estado del plan", days_left:"días restantes",
    users_who_read:"Quienes leyeron", users_who_liked:"Quienes dieron like",
    users_who_disliked:"Quienes dieron dislike", users_who_favorited:"Quienes favoritaron",
    users_with_book:"Quienes tienen el libro", view_likes:"Ver likes",
    loading_library:"Cargando biblioteca", book_stats:"Estadísticas del libro",
    liked_books:"Libros que me gustan", user_reviews:"Reseñas de usuarios",
    total_books:"Total libros", read_count:"Leídos", plan_count:"En plan",
    library_count:"En biblioteca", favorite_count:"Favoritos",
    back_cover:"Contraportada", borrowers:"Solicitantes de préstamo",
    save_page:"💾", current_page_progress:"Página actual",
    user_read_books:"Libros leídos", user_plan_books:"En plan de lectura",
    user_liked_books:"Libros que le gustan", user_library_books:"En su biblioteca",
    current_plan:"Plan actual", days_remaining:"días restantes",
    completed_checkpoints:"días completados", mark_as_read_today:"Marcar como leído hoy",
    page_progress:"Página", note_for_today:"Nota para hoy",
    save_note:"Guardar nota", reading_plan_status2:"Estado del plan",
    current_book:"Leyendo actualmente", liked:"Me gustan",
  },
  en: {
    library:"Library", plan:"Search", social:"Social", profile:"Me",
    search_p:"Search books, authors or ISBN...", pages:"Pages", days:"Days",
    start:"Start", cancel:"Cancel", delete_q:"Delete book?",
    delete_desc:"This action cannot be undone.", delete_btn:"Delete",
    invite:"INVITE", read:"Read", pending:"Pending", favorites:"⭐ Favorites",
    in_plan:"In Plan", all:"All", in_library:"In Library",
    level:"Rank", followers:"Followers", search_now:"Search Sandbook",
    manual_p:"Total pages", scan_msg:"Scanning code...",
    title_f:"Title", author_f:"Author", isbn_f:"ISBN", global_f:"All",
    reviews:"Reviews", my_review:"Your Review", daily_notes:"Daily notes",
    rate_book:"Rate", save:"Save", who_read:"Sandbook Readers",
    global_rating:"Global Rating", search_people:"Search people...",
    recommend:"Recommend", select_friend:"Select a friend",
    user_books:"Books of", no_friends:"Follow someone first",
    badges_title:"Badges", login:"Login", logout:"Logout",
    google_login:"Google", message_placeholder:"Write a message...",
    theme_dark:"Night", theme_light:"Day", theme_sunset:"Sunset",
    readers_count:"People who read", add_to_library:"Add to library",
    in_your_library:"In your library", reading_plan:"Reading plan",
    currently_reading:"Currently reading", books_this_month:"Books this month",
    writers:"Writers", search_writers:"Search writers...",
    biography:"Biography", books_written:"Books written",
    like:"Like", dislike:"Dislike",
    wall:"Wall", post_quote:"Post quote", max_characters:"Max 2500 characters",
    select_book:"Select book", write_quote:"Write a quote from the book...",
    posts:"Posts", no_posts:"No posts yet",
    authors:"Authors", loading_more:"Loading more...", search:"Search",
    friends:"Friends", following:"Following", followers_list:"Followers",
    find_friends:"Find friends", friend_requests:"Friend requests",
    remove_friend:"Remove friend", add_friend:"Add friend",
    all_users:"All users", google_users:"Google users",
    anonymous_users:"Anonymous users",
    accept:"Accept", reject:"Reject", pending_requests:"Pending requests",
    no_friends_yet:"No friends yet", find_people:"Find people",
    send_request:"Send request", request_sent:"Request sent",
    unfollow:"Unfollow", start_date:"Start date",
    today:"Today", tomorrow:"Tomorrow", next_week:"Next week",
    custom_date:"Custom date", current_page:"Current page",
    tutorial_next:"Next", tutorial_skip:"Skip tutorial",
    tutorial_welcome:"Welcome to Sandbook!",
    tutorial_step1:"Library: Here you'll see all your organized books",
    tutorial_step2:"Search: Find books with reading goals",
    tutorial_step3:"Social: Connect with other readers and authors",
    tutorial_step4:"Your Profile: Earn badges and track your progress",
    favorite_writers:"Writers ⭐", saved_posts:"Saved Quotes",
    messages:"Messages", send_message:"Send message",
    new_message:"New message", to:"To", message:"Message",
    conversation:"Conversation", type_message:"Type a message...",
    no_messages:"No messages",
    mark_as_favorite_writer:"Mark as favorite writer",
    remove_favorite_writer:"Remove from favorite writers",
    save_post:"Save post", remove_saved_post:"Remove from saved",
    saved:"Saved", writers_section:"Favorite Writers",
    saved_section:"Saved Quotes", view_read_books:"View read books",
    register_with_google:"Register with Google",
    continue_without_account:"Continue without account",
    require_google_login:"To use all features, register with Google",
    install_app:"Install App", search_in_my_books:"Search in my books...",
    following_list:"Following", followers_list_full:"Followers",
    mutual_friends:"Mutual friends", more_by_author:"More by this author",
    similar_books:"Similar books", recommended_books:"Recommendations",
    load_more:"Load more", close:"Close", download:"Download",
    borrow_book:"Borrow book", reading_progress:"Reading progress",
    current_day:"Current day", days_completed:"days completed",
    total_days:"total days", started_on:"Started on",
    edit_post:"Edit post", delete_post:"Delete post",
    make_public:"Make public", make_private:"Make private",
    confirm_delete_post:"Delete post?",
    confirm_delete_post_desc:"This action cannot be undone.",
    badge_locked:"Badge locked", badge_unlocked:"Badge unlocked!",
    badge_requirement:"Requirement", badge_progress:"Progress",
    view_profile:"View profile", checkpoint_notes_placeholder:"Write your notes...",
    page_input_placeholder:"Current page", my_notes:"My notes",
    reading_plan_status:"Plan status", days_left:"days left",
    users_who_read:"Who read", users_who_liked:"Who liked",
    users_who_disliked:"Who disliked", users_who_favorited:"Who favorited",
    users_with_book:"Who have the book", view_likes:"View likes",
    loading_library:"Loading library", book_stats:"Book statistics",
    liked_books:"Liked books", user_reviews:"User reviews",
    total_books:"Total books", read_count:"Read", plan_count:"In plan",
    library_count:"In library", favorite_count:"Favorites",
    back_cover:"Back cover", borrowers:"Borrowers",
    save_page:"💾", current_page_progress:"Current page",
    user_read_books:"Read books", user_plan_books:"In reading plan",
    user_liked_books:"Liked books", user_library_books:"In library",
    current_plan:"Current plan", days_remaining:"days remaining",
    completed_checkpoints:"days completed", mark_as_read_today:"Mark as read today",
    page_progress:"Page", note_for_today:"Note for today",
    save_note:"Save note", reading_plan_status2:"Plan status",
    current_book:"Currently reading", liked:"Liked",
  }
};

// ─── BADGES ──────────────────────────────────────────────────
const BADGE_DEFS = {
  1:{name:"Velocista",desc:"Al libro más rápido en leer",requirement:{type:'fastest_book',value:1}},
  2:{name:"Titán",desc:"Al libro más largo leído",requirement:{type:'longest_book',value:1}},
  3:{name:"Inicio",desc:"Al leer tu primer libro",requirement:{type:'read_count',value:1}},
  4:{name:"Rayo",desc:"Leer un libro en un día",requirement:{type:'one_day_book',value:1}},
  5:{name:"Semana",desc:"Leer un libro en una semana",requirement:{type:'one_week_book',value:1}},
  6:{name:"Mes",desc:"Leer un libro en un mes",requirement:{type:'one_month_book',value:1}},
  7:{name:"Diez",desc:"Por leer 10 libros",requirement:{type:'read_count',value:10}},
  8:{name:"Perfecto",desc:"Cumplir meta sin saltear días",requirement:{type:'perfect_plan',value:1}},
  9:{name:"Veinte",desc:"20 libros en un año",requirement:{type:'yearly_books',value:20}},
  10:{name:"Treinta",desc:"30 libros en un año",requirement:{type:'yearly_books',value:30}},
  11:{name:"Cincuenta",desc:"50 libros en total",requirement:{type:'read_count',value:50}},
  12:{name:"Cien",desc:"100 libros en total",requirement:{type:'read_count',value:100}},
  13:{name:"Oro Anual",desc:"50 libros en un año",requirement:{type:'yearly_books',value:50}},
  14:{name:"Scan 10",desc:"10 libros escaneados",requirement:{type:'scan_count',value:10}},
  15:{name:"Scan 20",desc:"20 libros escaneados",requirement:{type:'scan_count',value:20}},
  16:{name:"Scan 30",desc:"30 libros escaneados",requirement:{type:'scan_count',value:30}},
  17:{name:"Scan 40",desc:"40 libros escaneados",requirement:{type:'scan_count',value:40}},
  18:{name:"Scan 50",desc:"50 libros escaneados",requirement:{type:'scan_count',value:50}},
  19:{name:"Scan 100",desc:"100 libros escaneados",requirement:{type:'scan_count',value:100}},
  20:{name:"Maestro",desc:"Cumplir 19 insignias",requirement:{type:'total_badges',value:19}},
};

// ─── HELPERS GLOBALES ─────────────────────────────────────────
const getLevelTitle = (count=0, lang='es') => {
  if(count>=2100) return lang==='es'?"Leyenda":"Legend";
  if(count>=1000) return lang==='es'?"Legendario":"Legendary";
  if(count>=500)  return lang==='es'?"Doctorado":"Doctorate";
  if(count>=100)  return lang==='es'?"Licenciado":"Graduate";
  if(count>=50)   return lang==='es'?"Profesional":"Professional";
  if(count>=25)   return lang==='es'?"Maestro":"Master";
  if(count>=10)   return lang==='es'?"Amateur":"Amateur";
  if(count>=1)    return lang==='es'?"Novato":"Novice";
  return lang==='es'?"Principiante":"Beginner";
};
const getLevelSymbol = (count=0) => {
  if(count>=2100) return "/btc.png";
  if(count>=1000) return "/diamante.png";
  if(count>=500)  return "/oro.png";
  if(count>=100)  return "/plata.png";
  if(count>=50)   return "/cobre.png";
  if(count>=25)   return "/vidrio.png";
  if(count>=10)   return "/madera.png";
  if(count>=1)    return "/piedra.png";
  return "/papel.png";
};
const VerificationCheck = ({count=0}) => (
  <img src={getLevelSymbol(count)} className="w-4 h-4 object-contain inline-block" alt="nivel"/>
);

const convertToGrayscale = (imageDataUrl) => new Promise(resolve => {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img,0,0);
    const d = ctx.getImageData(0,0,canvas.width,canvas.height);
    for(let i=0;i<d.data.length;i+=4){
      const avg=(d.data[i]+d.data[i+1]+d.data[i+2])/3;
      d.data[i]=d.data[i+1]=d.data[i+2]=avg;
    }
    ctx.putImageData(d,0,0);
    resolve(canvas.toDataURL());
  };
  img.src=imageDataUrl;
});

const fetchWithRetry = async(url,retries=3,delay=2000)=>{
  const res = await fetch(url);
  if(res.status===429 && retries>0){
    await new Promise(r=>setTimeout(r,delay));
    return fetchWithRetry(url,retries-1,delay*2);
  }
  return res;
};

const getBestCoverGlobal = async(bookId, bookData=null, lang='es')=>{
  const isbn=bookData?.volumeInfo?.industryIdentifiers?.find(id=>id.type==='ISBN_13'||id.type==='ISBN_10')?.identifier||bookData?.isbn;
  const title=bookData?.volumeInfo?.title||bookData?.title;
  const authors=bookData?.volumeInfo?.authors||bookData?.authors||[];
  try{
    if(isbn){
      const cleanIsbn=isbn.replace(/\D/g,'');
      const res=await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
      const data=await res.json();
      const ol=data[`ISBN:${cleanIsbn}`];
      if(ol?.cover?.large) return {url:ol.cover.large,source:'openlibrary'};
    }
    if(title){
      let searchUrl=`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=5`;
      if(authors.length>0) searchUrl+=`&author=${encodeURIComponent(authors[0])}`;
      const res=await fetch(searchUrl);
      const data=await res.json();
      if(data.docs?.length>0){
        for(const d of data.docs){
          if(d.cover_i) return {url:`https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,source:'openlibrary'};
        }
      }
    }
  }catch(e){console.error("OpenLibrary error:",e);}
  if(bookData?.volumeInfo?.imageLinks?.thumbnail)
    return {url:bookData.volumeInfo.imageLinks.thumbnail.replace('http:','https:'),source:'google'};
  return {url:'https://via.placeholder.com/150x200?text=NO+COVER',source:'default'};
};

// ─── COMPONENTES UI GOODREADS ─────────────────────────────────

// Estrellitas
const Stars = ({rating, interactive=false, onRate, size=14})=>{
  const [hover,setHover]=useState(0);
  return(
    <div style={{display:'flex',gap:2}}>
      {[1,2,3,4,5].map(s=>(
        <span key={s}
          onClick={()=>interactive&&onRate&&onRate(s)}
          onMouseEnter={()=>interactive&&setHover(s)}
          onMouseLeave={()=>interactive&&setHover(0)}
          style={{
            fontSize:interactive?18:size,
            color:s<=(hover||rating||0)?GR.gold:'#d1c9b8',
            cursor:interactive?'pointer':'default',
            transition:'color .1s', userSelect:'none'
          }}>★</span>
      ))}
    </div>
  );
};

// Barra de progreso
const ProgressBar = ({pct, color=GR.green})=>(
  <div style={{background:GR.creamDark,borderRadius:4,height:6,overflow:'hidden',margin:'4px 0'}}>
    <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:4,transition:'width .5s ease'}}/>
  </div>
);

// Botón primario verde Goodreads
const BtnGR = ({children, onClick, disabled, fullWidth, small, color=GR.green, darkColor=GR.greenDark})=>{
  const [hov,setHov]=useState(false);
  return(
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
        background:disabled?'#ccc':hov?darkColor:color,
        color:disabled?'#888':'#fff',
        border:`1px solid ${disabled?'#ccc':darkColor}`,
        borderRadius:4, padding:small?'5px 10px':'7px 14px',
        fontFamily:'inherit', fontSize:small?11:13, fontWeight:600,
        cursor:disabled?'not-allowed':'pointer',
        whiteSpace:'nowrap', transition:'background .15s',
        width:fullWidth?'100%':undefined,
        opacity:disabled?0.6:1,
      }}>
      {children}
    </button>
  );
};

// Botón de acción inline (like, comentar, etc)
const ActionBtn = ({icon, label, onClick, active, activeColor='#2d7a2d'})=>{
  const [hov,setHov]=useState(false);
  return(
    <button onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:5,
        background:hov?GR.creamDark:'none', border:'none', borderRadius:4,
        padding:'5px 10px', fontFamily:'inherit', fontSize:12, fontWeight:500,
        color:active?activeColor:hov?GR.brown:'#4a4a4a',
        cursor:'pointer', transition:'all .15s'
      }}>
      {icon}{label}
    </button>
  );
};

// Card sidebar
const SideCard = ({title, extra, onExtra, children})=>(
  <div style={{
    background:'#fff', border:`1px solid ${GR.border}`, borderRadius:8,
    overflow:'hidden', boxShadow:GR.shadow, marginBottom:16
  }}>
    <div style={{
      padding:'10px 16px', borderBottom:`1px solid ${GR.borderLight}`,
      background:GR.parchment, fontFamily:"'Playfair Display', Georgia, serif",
      fontSize:14, fontWeight:700, color:GR.brown,
      display:'flex', alignItems:'center', justifyContent:'space-between'
    }}>
      <span>{title}</span>
      {extra&&<a href="#" onClick={e=>{e.preventDefault();onExtra&&onExtra();}}
        style={{fontFamily:'inherit',fontWeight:400,fontSize:11,color:GR.greenDark,textDecoration:'none'}}>
        {extra}
      </a>}
    </div>
    {children}
  </div>
);

// Modal base
const Modal = ({onClose, title, titleBg=GR.brown, children, wide})=>(
  <div style={{
    position:'fixed',inset:0,zIndex:400,background:'rgba(0,0,0,.75)',
    backdropFilter:'blur(4px)',display:'flex',alignItems:'center',
    justifyContent:'center',padding:16
  }}>
    <div style={{
      background:'#fff', width:'100%', maxWidth:wide?640:480,
      maxHeight:'90vh', borderRadius:16, overflow:'hidden',
      display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.3)'
    }}>
      <div style={{
        background:titleBg, padding:'14px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0
      }}>
        <h2 style={{
          fontFamily:"'Playfair Display', Georgia, serif",
          fontSize:18, fontWeight:700, color:'#fff', margin:0
        }}>{title}</h2>
        <button onClick={onClose} style={{
          background:'rgba(255,255,255,.2)', border:'none', borderRadius:'50%',
          width:32, height:32, display:'flex', alignItems:'center',
          justifyContent:'center', cursor:'pointer', color:'#fff'
        }}><X size={18}/></button>
      </div>
      <div style={{flex:1, overflowY:'auto', padding:20}}>{children}</div>
    </div>
  </div>
);

// Pill de filtro
const FilterPill = ({label, active, onClick, color=GR.green})=>{
  const [hov,setHov]=useState(false);
  return(
    <button onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700,
        border:'none', cursor:'pointer', transition:'all .15s',
        background:active?color:hov?GR.creamDark:'#f0ede6',
        color:active?'#fff':'#4a4a4a',
        boxShadow:active?`0 2px 6px ${color}55`:'none'
      }}>{label}</button>
  );
};

// CoverZoomModal
const CoverZoomModal = ({imageUrl, title, onClose})=>{
  const [scale,setScale]=useState(1);
  const [pos,setPos]=useState({x:0,y:0});
  const [drag,setDrag]=useState(false);
  const [dragStart,setDragStart]=useState({x:0,y:0});
  const handleDownload=async()=>{
    try{
      const res=await fetch(imageUrl);
      const blob=await res.blob();
      const url=window.URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url; a.download=`portada-${title||'libro'}.jpg`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
    }catch(e){console.error(e);}
  };
  return(
    <div style={{
      position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.95)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'
    }}
      onMouseMove={e=>drag&&setPos({x:e.clientX-dragStart.x,y:e.clientY-dragStart.y})}
      onMouseUp={()=>setDrag(false)} onMouseLeave={()=>setDrag(false)}>
      <div style={{position:'absolute',top:16,right:16,display:'flex',gap:8}}>
        {[
          [()=>setScale(p=>Math.min(p+.5,3)),<ZoomIn size={20}/>],
          [()=>setScale(p=>Math.max(p-.5,1)),<ZoomOut size={20}/>],
          [handleDownload,<Download size={20}/>],
          [onClose,<X size={20}/>],
        ].map(([fn,icon],i)=>(
          <button key={i} onClick={fn} style={{
            padding:10,background:'rgba(255,255,255,.12)',border:'none',
            borderRadius:'50%',cursor:'pointer',color:'#fff',
            display:'flex',alignItems:'center',justifyContent:'center'
          }}>{icon}</button>
        ))}
      </div>
      <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',
        justifyContent:'center',overflow:'hidden',cursor:drag?'grabbing':'grab'}}
        onMouseDown={e=>{e.preventDefault();setDrag(true);setDragStart({x:e.clientX-pos.x,y:e.clientY-pos.y});}}>
        <img src={imageUrl} alt={title} draggable={false}
          style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',
            transform:`scale(${scale}) translate(${pos.x/scale}px,${pos.y/scale}px)`,
            transition:drag?'none':'transform .2s ease-out'}}/>
      </div>
      <p style={{position:'absolute',bottom:16,left:16,color:'rgba(255,255,255,.4)',fontSize:12}}>{title}</p>
    </div>
  );
};

// BookCover async
const BookCoverAsync = ({bookId, bookData, myBooks, lang, style, onClick, onZoom})=>{
  const [url,setUrl]=useState('https://via.placeholder.com/150x200?text=...');
  const [src,setSrc]=useState('default');
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      setLoading(true);
      const ub=myBooks?.find(b=>b.bookId===bookId);
      if(ub?.thumbnail?.startsWith('https://')){
        if(!cancelled){setUrl(ub.thumbnail);setSrc('user');setLoading(false);}
        return;
      }
      const cover=await getBestCoverGlobal(bookId,bookData,lang);
      if(!cancelled){setUrl(cover.url);setSrc(cover.source);setLoading(false);}
    };
    load();
    return()=>{cancelled=true;};
  },[bookId,bookData,lang]);
  return(
    <div style={{position:'relative',display:'inline-block'}}>
      <img src={url} alt="" draggable={false}
        style={{...style, filter:loading?'blur(4px)':'none', transition:'filter .3s',
          cursor:(onClick||onZoom)?'pointer':'default'}}
        onClick={()=>{
          if(onClick) onClick();
          else if(onZoom&&src!=='default') onZoom(url, bookData?.volumeInfo?.title||bookData?.title);
        }}
        onError={e=>{e.target.src='https://via.placeholder.com/150x200?text=NO+COVER';}}/>
      {src==='openlibrary'&&(
        <div style={{position:'absolute',top:-4,right:-4,background:'#1a73e8',
          color:'#fff',fontSize:8,fontWeight:700,borderRadius:'50%',
          width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',
          border:'2px solid #fff'}}>OL</div>
      )}
      {src==='google'&&(
        <div style={{position:'absolute',top:-4,right:-4,background:'#ea4335',
          color:'#fff',fontSize:8,fontWeight:700,borderRadius:'50%',
          width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',
          border:'2px solid #fff'}}>G</div>
      )}
    </div>
  );
};

// ReadingPlanDetail
const ReadingPlanDetail = ({book, onToggleCheckpoint, onSaveNote, onSavePage, t, checkpointNotes, currentPageInputs, expandedCheckpoints, onToggleExpand})=>{
  if(book.status!=='reading'||!book.checkpoints) return null;
  const sorted=[...book.checkpoints].sort((a,b)=>a.dayNumber-b.dayNumber);
  const done=sorted.filter(c=>c.completed).length;
  const total=sorted.length;
  let curIdx=0;
  if(book.planStartDate){
    const diff=Math.floor((new Date()-new Date(book.planStartDate))/(1000*60*60*24));
    curIdx=Math.min(Math.max(diff,0),total-1);
  }
  return(
    <div style={{marginTop:12}}>
      <div style={{background:GR.creamDark,borderRadius:8,padding:'10px 12px',marginBottom:8}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
          <span style={{fontSize:11,color:'#666'}}>{t.reading_plan_status}</span>
          <span style={{fontSize:12,fontWeight:700,color:GR.greenDark}}>{done}/{total}</span>
        </div>
        <ProgressBar pct={total>0?(done/total)*100:0}/>
        <p style={{fontSize:10,color:'#888',marginTop:2}}>{total-done} {t.days_left} • {book.pagesPerDay} págs/día</p>
      </div>
      <div style={{maxHeight:280,overflowY:'auto'}}>
        {sorted.map((cp,idx)=>{
          const key=`${book.bookId}-${cp.dayNumber}`;
          const isCur=idx===curIdx&&!cp.completed;
          const expanded=expandedCheckpoints?.[key]!==false;
          return(
            <div key={idx} style={{
              borderRadius:8, border:`1px solid ${cp.completed?'#b8ddb8':isCur?'#f0d080':GR.borderLight}`,
              background:cp.completed?'#f0f8f0':isCur?'#fffce8':'#fff',
              marginBottom:6, overflow:'hidden'
            }}>
              <button onClick={()=>onToggleExpand&&onToggleExpand(key)} style={{
                width:'100%',padding:'8px 10px',display:'flex',alignItems:'center',
                gap:8,background:'none',border:'none',cursor:'pointer',textAlign:'left'
              }}>
                <button onClick={e=>{e.stopPropagation();onToggleCheckpoint(book.bookId,idx);}} style={{
                  width:22,height:22,borderRadius:'50%',
                  background:cp.completed?GR.green:'#e0ddd8',
                  border:'none',cursor:'pointer',display:'flex',
                  alignItems:'center',justifyContent:'center',flexShrink:0
                }}>
                  {cp.completed&&<CheckCircle size={13} color="#fff"/>}
                </button>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:12,fontWeight:600,margin:0,
                    textDecoration:cp.completed?'line-through':'none',color:cp.completed?'#999':GR.brown}}>
                    {cp.title||`Día ${cp.dayNumber}`}
                  </p>
                  {cp.date&&<p style={{fontSize:10,color:'#999',margin:0}}>{new Date(cp.date).toLocaleDateString()}</p>}
                </div>
                {expanded?<ChevronUp size={14} color="#999"/>:<ChevronDown size={14} color="#999"/>}
              </button>
              {expanded&&(
                <div style={{padding:'0 10px 10px',borderTop:`1px solid ${GR.borderLight}`}}>
                  <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
                    <input type="number"
                      defaultValue={currentPageInputs?.[key]||cp.currentPage||''}
                      onBlur={e=>onSavePage&&onSavePage(book.bookId,cp.dayNumber,e.target.value,book.totalPages)}
                      placeholder={t.page_input_placeholder}
                      style={{width:80,padding:'4px 8px',fontSize:11,border:`1px solid ${GR.border}`,
                        borderRadius:6,fontFamily:'inherit'}}/>
                    <span style={{fontSize:10,color:'#999'}}>/ {book.totalPages}</span>
                  </div>
                  <textarea
                    defaultValue={checkpointNotes?.[key]||cp.note||''}
                    onBlur={e=>onSaveNote&&onSaveNote(book.bookId,cp.dayNumber,e.target.value)}
                    placeholder={t.checkpoint_notes_placeholder}
                    style={{width:'100%',marginTop:8,padding:'6px 8px',fontSize:11,
                      border:`1px solid ${GR.border}`,borderRadius:6,
                      fontFamily:'inherit',resize:'vertical',minHeight:48,boxSizing:'border-box'}}/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// UserReadingProgress (para perfiles externos)
const UserReadingProgress = ({book, t})=>{
  if(book.status!=='reading'||!book.checkpoints?.length) return null;
  const done=book.checkpoints.filter(c=>c.completed).length;
  const total=book.checkpoints.length;
  const pct=total>0?Math.round((done/total)*100):0;
  return(
    <div style={{marginTop:8,padding:'8px 10px',background:GR.creamDark,borderRadius:8}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
        <span style={{fontSize:10,color:'#666'}}>{t.reading_progress}</span>
        <span style={{fontSize:11,fontWeight:700,color:GR.greenDark}}>{pct}%</span>
      </div>
      <ProgressBar pct={pct}/>
      <p style={{fontSize:10,color:'#888',marginTop:2}}>{done}/{total} días • {total-done} {t.days_left}</p>
    </div>
  );
};

// BadgeIcon
const BadgeIcon = ({badgeId, unlocked=false, size=24})=>{
  const icons={
    1:<Trophy size={size}/>, 2:<Target size={size}/>, 3:<Star size={size}/>,
    4:<Flame size={size}/>, 5:<Clock size={size}/>, 6:<Calendar size={size}/>,
    7:<Award size={size}/>, 8:<CheckCircle size={size}/>, 9:<TrendingUp size={size}/>,
    10:<TrendingUp size={size}/>, 11:<Award size={size}/>, 12:<Award size={size}/>,
    13:<Sparkles size={size}/>,
  };
  const icon=icons[badgeId]||<Trophy size={size}/>;
  return(
    <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',
      opacity:unlocked?1:.4}}>
      <div style={{color:unlocked?GR.gold:'#aaa'}}>{icon}</div>
      {!unlocked&&<Lock size={size/3} style={{position:'absolute',bottom:-2,right:-2,color:'#888'}}/>}
    </div>
  );
};

// ─── APP PRINCIPAL ─────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);
  const [lang,setLang]=useState('es');
  const t=i18n[lang];
  const [isAuthLoading,setIsAuthLoading]=useState(true);
  const [libraryLoadingProgress,setLibraryLoadingProgress]=useState(0);
  const [isLibraryLoading,setIsLibraryLoading]=useState(false);
  const [activeTab,setActiveTab]=useState('library');
  const [myBooks,setMyBooks]=useState([]);
  const [publicData,setPublicData]=useState([]);
  const [userProfile,setUserProfile]=useState({
    name:'',profilePic:'',badges:[],scanCount:0,followersCount:0,
    following:[],dismissedUsers:[],readBooksList:[],readCount:0,
    planCount:0,libraryCount:0,email:'',theme:'light',likes:[],dislikes:[],
    favoriteBooks:[],friendRequests:[],sentRequests:[],
    isGoogleUser:false,isAnonymous:true,favoriteWriters:[],savedPosts:[]
  });
  const [searchQuery,setSearchQuery]=useState('');
  const [searchType,setSearchType]=useState('all');
  const [searchResults,setSearchResults]=useState([]);
  const [isSearching,setIsSearching]=useState(false);
  const [searchError,setSearchError]=useState(null);
  const [showScanner,setShowScanner]=useState(false);
  const [bookToDelete,setBookToDelete]=useState(null);
  const [planningBook,setPlanningBook]=useState(null);
  const [manualPages,setManualPages]=useState('');
  const [planDays,setPlanDays]=useState(7);
  const [planStartDate,setPlanStartDate]=useState(new Date().toISOString().split('T')[0]);
  const [showStartDateOptions,setShowStartDateOptions]=useState(false);
  const [bookComments,setBookComments]=useState({});
  const [filterType,setFilterType]=useState('all');
  const [viewingBook,setViewingBook]=useState(null);
  const [showRecommendList,setShowRecommendList]=useState(false);
  const [recommendMessage,setRecommendMessage]=useState('');
  const [userComment,setUserComment]=useState('');
  const [userRating,setUserRating]=useState(0);
  const [showNotifications,setShowNotifications]=useState(false);
  const [notifications,setNotifications]=useState([]);
  const [selectedUserProfile,setSelectedUserProfile]=useState(null);
  const [selectedUserBooks,setSelectedUserBooks]=useState([]);
  const [selectedUserFilter,setSelectedUserFilter]=useState('all');
  const [showWriters,setShowWriters]=useState(false);
  const [writerSearch,setWriterSearch]=useState('');
  const [writerResults,setWriterResults]=useState([]);
  const [selectedAuthor,setSelectedAuthor]=useState(null);
  const [authorBooks,setAuthorBooks]=useState([]);
  const [authorDetails,setAuthorDetails]=useState(null);
  const [wallPosts,setWallPosts]=useState([]);
  const [showPostModal,setShowPostModal]=useState(false);
  const [postContent,setPostContent]=useState('');
  const [selectedBookForPost,setSelectedBookForPost]=useState(null);
  const [booksForPost,setBooksForPost]=useState([]);
  const [postSearch,setPostSearch]=useState('');
  const [showBookSelector,setShowBookSelector]=useState(false);
  const [currentlyReadingCount,setCurrentlyReadingCount]=useState(0);
  const [booksThisMonth,setBooksThisMonth]=useState(0);
  const [authorSearchLoading,setAuthorSearchLoading]=useState(false);
  const [moreBooksLoading,setMoreBooksLoading]=useState(false);
  const [showFriendsSection,setShowFriendsSection]=useState(false);
  const [friendsSearch,setFriendsSearch]=useState('');
  const [friendsFilter,setFriendsFilter]=useState('all');
  const [friendRequests,setFriendRequests]=useState([]);
  const [sentFriendRequests,setSentFriendRequests]=useState([]);
  const [friendsList,setFriendsList]=useState([]);
  const [followersList,setFollowersList]=useState([]);
  const [followingList,setFollowingList]=useState([]);
  const [mutualFriendsList,setMutualFriendsList]=useState([]);
  const [showFollowingModal,setShowFollowingModal]=useState(false);
  const [showFollowersModal,setShowFollowersModal]=useState(false);
  const [showMutualFriendsModal,setShowMutualFriendsModal]=useState(false);
  const [wallPostComments,setWallPostComments]=useState({});
  const [commentInputs,setCommentInputs]=useState({});
  const [currentPageInputs,setCurrentPageInputs]=useState({});
  const [checkpointNotes,setCheckpointNotes]=useState({});
  const [showTutorial,setShowTutorial]=useState(false);
  const [tutorialStep,setTutorialStep]=useState(0);
  const [badgeProgress,setBadgeProgress]=useState({});
  const [showMessages,setShowMessages]=useState(false);
  const [selectedConversation,setSelectedConversation]=useState(null);
  const [conversations,setConversations]=useState([]);
  const [activeMessages,setActiveMessages]=useState([]);
  const [newMessage,setNewMessage]=useState('');
  const [showNewMessageModal,setShowNewMessageModal]=useState(false);
  const [selectedUserForMessage,setSelectedUserForMessage]=useState(null);
  const [messageSearch,setMessageSearch]=useState('');
  const [viewingReadBooks,setViewingReadBooks]=useState(false);
  const [readBooksList,setReadBooksList]=useState([]);
  const [showFavoriteWriters,setShowFavoriteWriters]=useState(false);
  const [favoriteWritersList,setFavoriteWritersList]=useState([]);
  const [showSavedPosts,setShowSavedPosts]=useState(false);
  const [savedPostsList,setSavedPostsList]=useState([]);
  const [globalLikes,setGlobalLikes]=useState({});
  const [showWelcomeVideo,setShowWelcomeVideo]=useState(true);
  const [requireGoogleLogin,setRequireGoogleLogin]=useState(false);
  const [librarySearch,setLibrarySearch]=useState('');
  const [borrowRequests,setBorrowRequests]=useState({});
  const [showBorrowModal,setShowBorrowModal]=useState(false);
  const [bookToBorrow,setBookToBorrow]=useState(null);
  const [zoomImage,setZoomImage]=useState(null);
  const [zoomTitle,setZoomTitle]=useState('');
  const [authorRecommendations,setAuthorRecommendations]=useState([]);
  const [genreRecommendations,setGenreRecommendations]=useState([]);
  const [similarBooks,setSimilarBooks]=useState([]);
  const [loadingRecommendations,setLoadingRecommendations]=useState(false);
  const [currentRecommendationPage,setCurrentRecommendationPage]=useState({author:0,genre:0,similar:0});
  const [editingPost,setEditingPost]=useState(null);
  const [editPostContent,setEditPostContent]=useState('');
  const [postToDelete,setPostToDelete]=useState(null);
  const [showPostOptions,setShowPostOptions]=useState(null);
  const [showUserProfileModal,setShowUserProfileModal]=useState(false);
  const [userProfileModalData,setUserProfileModalData]=useState(null);
  const [showBookDetailModal,setShowBookDetailModal]=useState(false);
  const [bookDetailData,setBookDetailData]=useState(null);
  const [expandedCheckpoints,setExpandedCheckpoints]=useState({});
  const [selectedBadge,setSelectedBadge]=useState(null);
  const [showBadgeModal,setShowBadgeModal]=useState(false);
  const [userStats,setUserStats]=useState({readCount:0,planCount:0,libraryCount:0,favoriteCount:0,likedCount:0,dislikedCount:0});
  const [usersWhoRead,setUsersWhoRead]=useState([]);
  const [usersWhoFavorited,setUsersWhoFavorited]=useState([]);
  const [usersWhoLiked,setUsersWhoLiked]=useState([]);
  const [usersWhoDisliked,setUsersWhoDisliked]=useState([]);
  const [usersWithBook,setUsersWithBook]=useState([]);
  const [showUserListModal,setShowUserListModal]=useState(false);
  const [userListTitle,setUserListTitle]=useState('');
  const [userListData,setUserListData]=useState([]);
  const [isEditingProfile,setIsEditingProfile]=useState(false);

  const victoryAudio=useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"));
  const videoRef=useRef(null);
  const notificationsRef=useRef(null);

  // ─── FUNCIONES FIREBASE ────────────────────────────────────

  const getBestCoverForBook=async(bookId,bookData=null,langParam=lang)=>{
    const ub=myBooks.find(b=>b.bookId===bookId);
    if(ub?.thumbnail?.startsWith('https://')) return {url:ub.thumbnail,source:'user'};
    return getBestCoverGlobal(bookId,bookData,langParam);
  };

  const createNotification=async(targetUserId,type,title,message,extra={})=>{
    try{
      await addDoc(collection(db,'notifications'),{
        userId:targetUserId,type,title,message,...extra,read:false,timestamp:serverTimestamp()
      });
    }catch(e){console.error(e);}
  };

  const loadNotifications=(userId)=>{
    return onSnapshot(collection(db,'notifications'),(snap)=>{
      setNotifications(snap.docs.map(d=>({id:d.id,...d.data()})).filter(n=>n.userId===userId&&!n.read));
    });
  };

  const loadWallPosts=()=>{
    if(!user) return;
    return onSnapshot(collection(db,'wallPosts'),(snap)=>{
      const posts=snap.docs.map(d=>({id:d.id,...d.data()}));
      posts.sort((a,b)=>(b.timestamp?.seconds||0)-(a.timestamp?.seconds||0));
      setWallPosts(posts.slice(0,50));
    });
  };

  const loadWallPostComments=()=>{
    if(!user) return;
    return onSnapshot(collection(db,'wallPostComments'),(snap)=>{
      const map={};
      snap.docs.forEach(d=>{
        const data={id:d.id,...d.data()};
        if(!map[data.postId]) map[data.postId]=[];
        map[data.postId].push(data);
      });
      setWallPostComments(map);
    });
  };

  const loadGlobalLikes=()=>{
    return onSnapshot(collection(db,'globalLikes'),(snap)=>{
      const map={};
      snap.docs.forEach(d=>{const data=d.data();map[data.bookId]={likes:data.likes||[],dislikes:data.dislikes||[]};});
      setGlobalLikes(map);
    });
  };

  const loadFavoriteWriters=()=>{
    if(!user) return;
    return onSnapshot(collection(db,'favoriteWriters'),(snap)=>{
      const writers=snap.docs.map(d=>d.data()).filter(d=>d.userId===user.uid).map(d=>d.authorName);
      setFavoriteWritersList(writers);
    });
  };

  const loadSavedPosts=()=>{
    if(!user) return;
    return onSnapshot(collection(db,'savedPosts'),(snap)=>{
      const ids=snap.docs.map(d=>d.data()).filter(d=>d.userId===user.uid).map(d=>d.postId);
      setSavedPostsList(ids);
    });
  };

  const loadConversations=()=>{
    if(!user) return;
    return onSnapshot(collection(db,'conversations'),(snap)=>{
      const convos=snap.docs.map(d=>({id:d.id,...d.data()})).filter(c=>c.participants?.includes(user.uid));
      convos.sort((a,b)=>(b.lastMessageAt?.seconds||0)-(a.lastMessageAt?.seconds||0));
      setConversations(convos);
    });
  };

  const loadMessages=(conversationId)=>{
    if(!user||!conversationId) return;
    return onSnapshot(
      query(collection(db,'messages'),where('conversationId','==',conversationId),orderBy('timestamp','asc'),limit(50)),
      snap=>setActiveMessages(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
  };

  const loadBorrowRequests=()=>{
    if(!user) return;
    return onSnapshot(collection(db,'borrowRequests'),(snap)=>{
      const req={};
      snap.docs.forEach(d=>{const data={id:d.id,...d.data()};if(data.bookId){if(!req[data.bookId])req[data.bookId]=[];req[data.bookId].push(data);}});
      setBorrowRequests(req);
    });
  };

  const loadFriendsData=(userId)=>{
    if(!userId) return;
    return onSnapshot(collection(db,'friendRequests'),(snap)=>{
      const reqs=[],sent=[];
      snap.docs.forEach(d=>{
        const data={id:d.id,...d.data()};
        if(data.receiverId===userId&&data.status==='pending') reqs.push(data);
        if(data.senderId===userId&&data.status==='pending') sent.push(data);
      });
      setFriendRequests(reqs);
      setSentFriendRequests(sent);
    });
  };

  const loadFollowLists=()=>{
    if(!user||!publicData.length) return;
    const followers=publicData.filter(p=>p.following?.includes(user.uid));
    const following=publicData.filter(p=>userProfile.following?.includes(p.userId));
    const mutual=publicData.filter(p=>p.following?.includes(user.uid)&&userProfile.following?.includes(p.userId));
    setFollowersList(followers);
    setFollowingList(following);
    setMutualFriendsList(mutual);
    setFriendsList(mutual);
  };

  const calculateUserStats=(books)=>({
    readCount:books.filter(b=>b.status==='read').length,
    planCount:books.filter(b=>b.status==='reading').length,
    libraryCount:books.filter(b=>b.status==='library'||b.inLibrary).length,
    favoriteCount:books.filter(b=>b.isFavorite).length,
    likedCount:books.filter(b=>userProfile.likes?.includes(b.bookId)).length,
    dislikedCount:books.filter(b=>userProfile.dislikes?.includes(b.bookId)).length,
  });

  const calculateBadgeProgress=()=>{
    const rc=userProfile.readCount||0,sc=userProfile.scanCount||0;
    const booksLastYear=myBooks.filter(b=>{
      if(b.status!=='read') return false;
      const fd=b.finishDate||b.addedAt;
      if(!fd) return false;
      const oneYearAgo=new Date();oneYearAgo.setFullYear(oneYearAgo.getFullYear()-1);
      return new Date(fd)>=oneYearAgo;
    }).length;
    return {
      1:rc>=1?100:0, 2:rc>=1?100:0, 3:rc>=1?100:0,
      4:myBooks.some(b=>b.status==='read'&&b.planDays===1)?100:0,
      5:myBooks.some(b=>b.status==='read'&&b.planDays<=7)?100:0,
      6:myBooks.some(b=>b.status==='read'&&b.planDays<=30)?100:0,
      7:Math.min((rc/10)*100,100), 8:myBooks.some(b=>b.status==='read'&&b.checkpoints?.length>0&&b.checkpoints.every(c=>c.completed))?100:0,
      9:Math.min((booksLastYear/20)*100,100), 10:Math.min((booksLastYear/30)*100,100),
      11:Math.min((rc/50)*100,100), 12:Math.min((rc/100)*100,100),
      13:Math.min((booksLastYear/50)*100,100),
      14:Math.min((sc/10)*100,100), 15:Math.min((sc/20)*100,100),
      16:Math.min((sc/30)*100,100), 17:Math.min((sc/40)*100,100),
      18:Math.min((sc/50)*100,100), 19:Math.min((sc/100)*100,100),
      20:Math.min(((userProfile.badges?.length||0)/19)*100,100),
    };
  };

  // ─── ACCIONES ──────────────────────────────────────────────

  const handleGoogleLogin=async()=>{
    try{await signInWithPopup(auth,googleProvider);setRequireGoogleLogin(false);}
    catch(e){alert(lang==='es'?'Error al iniciar sesión con Google':'Error signing in with Google');}
  };

  const handleLogout=async()=>{
    try{await auth.signOut();await signInAnonymously(auth);setRequireGoogleLogin(true);}
    catch(e){console.error(e);}
  };

  const handleAddBook=async(book,status,isFav=false,addToLibrary=false)=>{
    if(!user) return;
    const bookId=book.id||book.bookId;
    const bestCover=await getBestCoverForBook(bookId,book,lang);
    const info={
      bookId, title:book.volumeInfo?.title||book.title,
      authors:book.volumeInfo?.authors||book.authors||['Anónimo'],
      thumbnail:bestCover.url,
      description:book.volumeInfo?.description||book.description||'',
      status, isFavorite:isFav, inLibrary:addToLibrary||status==='library',
      checkpoints:[], rating:0, review:'', addedAt:new Date().toISOString(),
      likes:0, dislikes:0
    };
    await setDoc(doc(db,'users',user.uid,'myBooks',bookId),info);
    if(status==='read') await updateDoc(doc(db,'profiles',user.uid),{readCount:increment(1),readBooksList:arrayUnion(bookId)});
    else if(status==='reading') await updateDoc(doc(db,'profiles',user.uid),{planCount:increment(1)});
    else if(status==='library'||addToLibrary) await updateDoc(doc(db,'profiles',user.uid),{libraryCount:increment(1)});
    setActiveTab('library');
  };

  const toggleFavoriteBook=async(bookId)=>{
    if(!user) return;
    const book=myBooks.find(b=>b.bookId===bookId);
    const newFav=!book?.isFavorite;
    await updateDoc(doc(db,'users',user.uid,'myBooks',bookId),{isFavorite:newFav});
    await updateDoc(doc(db,'profiles',user.uid),{
      favoriteCount:increment(newFav?1:-1),
      favoriteBooks:newFav?arrayUnion(bookId):arrayRemove(bookId)
    });
  };

  const handleGlobalBookReaction=async(bookId,reaction)=>{
    if(!user) return;
    const wasLiked=globalLikes[bookId]?.likes?.includes(user.uid);
    const wasDisliked=globalLikes[bookId]?.dislikes?.includes(user.uid);
    let newLikes=[...(globalLikes[bookId]?.likes||[])];
    let newDislikes=[...(globalLikes[bookId]?.dislikes||[])];
    if(reaction==='like'){
      if(wasLiked){newLikes=newLikes.filter(id=>id!==user.uid);await updateDoc(doc(db,'profiles',user.uid),{likes:arrayRemove(bookId)});}
      else{newLikes.push(user.uid);await updateDoc(doc(db,'profiles',user.uid),{likes:arrayUnion(bookId)});if(wasDisliked){newDislikes=newDislikes.filter(id=>id!==user.uid);await updateDoc(doc(db,'profiles',user.uid),{dislikes:arrayRemove(bookId)});}}
    }else{
      if(wasDisliked){newDislikes=newDislikes.filter(id=>id!==user.uid);await updateDoc(doc(db,'profiles',user.uid),{dislikes:arrayRemove(bookId)});}
      else{newDislikes.push(user.uid);await updateDoc(doc(db,'profiles',user.uid),{dislikes:arrayUnion(bookId)});if(wasLiked){newLikes=newLikes.filter(id=>id!==user.uid);await updateDoc(doc(db,'profiles',user.uid),{likes:arrayRemove(bookId)});}}
    }
    await setDoc(doc(db,'globalLikes',bookId),{bookId,likes:newLikes,dislikes:newDislikes,updatedAt:serverTimestamp()},{merge:true});
  };

  const saveReadingPlan=async()=>{
    if(!user||!planningBook) return;
    const pages=parseInt(manualPages),days=parseInt(planDays);
    if(isNaN(pages)||isNaN(days)||pages<=0||days<=0) return;
    const pagesPerDay=Math.ceil(pages/days);
    const checkpoints=[];
    const startDate=new Date(planStartDate);
    for(let i=1;i<=days;i++){
      const startPage=(i-1)*pagesPerDay+1,endPage=Math.min(i*pagesPerDay,pages);
      const cpDate=new Date(startDate);cpDate.setDate(startDate.getDate()+i-1);
      checkpoints.push({title:`Día ${i}: Págs ${startPage}-${endPage}`,completed:false,note:'',dayNumber:i,pages:`${startPage}-${endPage}`,startPage,endPage,date:cpDate.toISOString()});
    }
    const bookId=planningBook.id||planningBook.bookId;
    if(!myBooks.find(b=>b.bookId===bookId)) await handleAddBook(planningBook,'reading',false,true);
    await updateDoc(doc(db,'users',user.uid,'myBooks',bookId),{
      checkpoints,status:'reading',totalPages:pages,
      planStartDate:startDate.toISOString(),planDays:days,pagesPerDay,
      planEndDate:new Date(startDate.getTime()+days*24*60*60*1000).toISOString(),currentPage:0
    });
    await updateDoc(doc(db,'profiles',user.uid),{planCount:increment(1)});
    await createNotification(user.uid,'reading_plan_started',
      lang==='es'?'¡Plan iniciado!':'Plan started!',
      lang==='es'?`Comenzaste "${planningBook.volumeInfo?.title||planningBook.title}" - ${pages} págs en ${days} días.`:`Started "${planningBook.volumeInfo?.title||planningBook.title}" - ${pages} pages in ${days} days.`,
      {bookId});
    setPlanningBook(null);setManualPages('');setPlanDays(7);
    setPlanStartDate(new Date().toISOString().split('T')[0]);
    setActiveTab('library');
  };

  const toggleCheckpoint=async(bookId,idx)=>{
    if(!user) return;
    const book=myBooks.find(b=>b.bookId===bookId);
    const nCP=[...book.checkpoints];
    nCP[idx].completed=!nCP[idx].completed;
    const allDone=nCP.every(c=>c.completed);
    if(allDone){
      await updateDoc(doc(db,'users',user.uid,'myBooks',bookId),{checkpoints:nCP,status:'read',finishDate:new Date().toISOString()});
      victoryAudio.current.play().catch(()=>{});
      await updateDoc(doc(db,'profiles',user.uid),{readCount:increment(1),planCount:increment(-1),readBooksList:arrayUnion(bookId)});
      await createNotification(user.uid,'book_completed',lang==='es'?'¡Libro completado!':'Book completed!',lang==='es'?`Completaste "${book.title}".`:`You completed "${book.title}".`,{bookId});
    }else{
      await updateDoc(doc(db,'users',user.uid,'myBooks',bookId),{checkpoints:nCP});
    }
  };

  const saveCheckpointNote=async(bookId,dayNumber,note)=>{
    if(!user) return;
    const book=myBooks.find(b=>b.bookId===bookId);
    if(!book) return;
    const updated=book.checkpoints.map(cp=>cp.dayNumber===dayNumber?{...cp,note}:cp);
    await updateDoc(doc(db,'users',user.uid,'myBooks',bookId),{checkpoints:updated});
    setCheckpointNotes(p=>({...p,[`${bookId}-${dayNumber}`]:note}));
  };

  const saveCheckpointPage=async(bookId,dayNumber,currentPage,totalPages)=>{
    if(!user||!currentPage) return;
    const book=myBooks.find(b=>b.bookId===bookId);
    if(!book) return;
    const updated=book.checkpoints.map(cp=>cp.dayNumber===dayNumber?{...cp,currentPage:parseInt(currentPage)}:cp);
    await updateDoc(doc(db,'users',user.uid,'myBooks',bookId),{checkpoints:updated,currentPage:parseInt(currentPage)});
    setCurrentPageInputs(p=>({...p,[`${bookId}-${dayNumber}`]:currentPage}));
  };

  const toggleCheckpointExpand=(key)=>{
    setExpandedCheckpoints(p=>({...p,[key]:p[key]===false?true:false}));
  };

  const toggleFollow=async(targetId)=>{
    if(!user||user.uid===targetId) return;
    const isF=userProfile.following?.includes(targetId);
    await updateDoc(doc(db,'profiles',user.uid),{following:isF?arrayRemove(targetId):arrayUnion(targetId)});
    await updateDoc(doc(db,'profiles',targetId),{followersCount:increment(isF?-1:1)});
    if(!isF) await createNotification(targetId,'new_follower',lang==='es'?'Nuevo seguidor':'New follower',lang==='es'?`${userProfile.name} empezó a seguirte`:`${userProfile.name} started following you`);
    loadFollowLists();
  };

  const sendFriendRequest=async(targetId,targetName)=>{
    if(!user||user.uid===targetId) return;
    if(sentFriendRequests.find(r=>r.receiverId===targetId)){alert(lang==='es'?'Ya enviaste solicitud':'Already sent');return;}
    await addDoc(collection(db,'friendRequests'),{senderId:user.uid,senderName:userProfile.name,senderPic:userProfile.profilePic,receiverId:targetId,receiverName:targetName,status:'pending',timestamp:serverTimestamp()});
    await createNotification(targetId,'friend_request',lang==='es'?'Nueva solicitud':'New friend request',lang==='es'?`${userProfile.name} te envió una solicitud`:`${userProfile.name} sent you a friend request`,{senderId:user.uid,senderName:userProfile.name});
    alert(lang==='es'?'Solicitud enviada':'Request sent');
  };

  const acceptFriendRequest=async(requestId,senderId,senderName)=>{
    if(!user) return;
    await updateDoc(doc(db,'friendRequests',requestId),{status:'accepted'});
    await updateDoc(doc(db,'profiles',user.uid),{following:arrayUnion(senderId)});
    await updateDoc(doc(db,'profiles',senderId),{followersCount:increment(1),following:arrayUnion(user.uid)});
    await createNotification(senderId,'friend_request_accepted',lang==='es'?'Solicitud aceptada':'Request accepted',lang==='es'?`${userProfile.name} aceptó tu solicitud`:`${userProfile.name} accepted your request`);
    alert(lang==='es'?'Amigo agregado':'Friend added');
  };

  const rejectFriendRequest=async(requestId)=>{
    await updateDoc(doc(db,'friendRequests',requestId),{status:'rejected'});
  };

  const removeFriend=async(friendId)=>{
    if(!user) return;
    await updateDoc(doc(db,'profiles',user.uid),{following:arrayRemove(friendId)});
    await updateDoc(doc(db,'profiles',friendId),{followersCount:increment(-1),following:arrayRemove(user.uid)});
  };

  const likeWallPost=async(postId,currentLikes,currentLikesBy=[])=>{
    if(!user) return;
    const post=wallPosts.find(p=>p.id===postId);
    if(!post) return;
    const already=currentLikesBy.includes(user.uid);
    const newLikes=already?currentLikes-1:currentLikes+1;
    const newLikesBy=already?currentLikesBy.filter(id=>id!==user.uid):[...currentLikesBy,user.uid];
    await updateDoc(doc(db,'wallPosts',postId),{likes:newLikes,likesBy:newLikesBy});
    if(!already&&post.userId!==user.uid)
      await createNotification(post.userId,'post_liked',lang==='es'?'Te dieron like':'Post liked',lang==='es'?`${userProfile.name} le dio like a tu publicación`:`${userProfile.name} liked your post`,{postId});
  };

  const addWallPostComment=async(postId,commentText)=>{
    if(!user||!commentText?.trim()) return;
    const post=wallPosts.find(p=>p.id===postId);
    if(!post) return;
    await addDoc(collection(db,'wallPostComments'),{postId,userId:user.uid,userName:userProfile.name,userPic:userProfile.profilePic,text:commentText,timestamp:serverTimestamp()});
    if(post.userId!==user.uid)
      await createNotification(post.userId,'post_comment',lang==='es'?'Nuevo comentario':'New comment',lang==='es'?`${userProfile.name} comentó: "${commentText.substring(0,50)}..."`:`${userProfile.name} commented: "${commentText.substring(0,50)}..."`,{postId});
    setCommentInputs(p=>({...p,[postId]:''}));
  };

  const submitWallPost=async()=>{
    if(!user||!postContent.trim()||postContent.length>2500) return;
    try{
      const postData={
        userId:user.uid,userName:userProfile.name,userPic:userProfile.profilePic,
        content:postContent,
        bookId:selectedBookForPost?.id||selectedBookForPost?.bookId,
        bookTitle:selectedBookForPost?.volumeInfo?.title||selectedBookForPost?.title,
        bookAuthors:selectedBookForPost?.volumeInfo?.authors||selectedBookForPost?.authors,
        bookThumbnail:selectedBookForPost?.volumeInfo?.imageLinks?.thumbnail?.replace('http:','https:')||selectedBookForPost?.thumbnail||'',
        timestamp:serverTimestamp(),likes:0,likesBy:[],comments:[],isPublic:true
      };
      const postRef=await addDoc(collection(db,'wallPosts'),postData);
      if(userProfile.following?.length>0){
        const batch=writeBatch(db);
        userProfile.following.forEach(fId=>{
          const nRef=doc(collection(db,'notifications'));
          batch.set(nRef,{userId:fId,type:'new_post',title:lang==='es'?'Nueva publicación':'New post',message:lang==='es'?`${userProfile.name} publicó una frase`:`${userProfile.name} posted a quote`,postId:postRef.id,senderId:user.uid,senderName:userProfile.name,read:false,timestamp:serverTimestamp()});
        });
        await batch.commit().catch(e=>console.error(e));
      }
      setPostContent('');setSelectedBookForPost(null);setShowPostModal(false);
      setShowBookSelector(false);setBooksForPost([]);setPostSearch('');
      alert(lang==='es'?'¡Publicación creada!':'Post created!');
    }catch(e){alert(lang==='es'?'Error al publicar':'Error posting');}
  };

  const editWallPost=async(postId,newContent)=>{
    if(!user||!newContent.trim()) return;
    await updateDoc(doc(db,'wallPosts',postId),{content:newContent,editedAt:serverTimestamp()});
    setEditingPost(null);setEditPostContent('');
  };

  const deleteWallPost=async(postId)=>{
    if(!user) return;
    await deleteDoc(doc(db,'wallPosts',postId));
    const snap=await getDocs(query(collection(db,'wallPostComments'),where('postId','==',postId)));
    if(!snap.empty){const batch=writeBatch(db);snap.docs.forEach(d=>batch.delete(d.ref));await batch.commit();}
    setPostToDelete(null);
  };

  const togglePostPrivacy=async(postId,currentIsPublic)=>{
    await updateDoc(doc(db,'wallPosts',postId),{isPublic:!currentIsPublic});
  };

  const submitGlobalReview=async()=>{
    if(!userRating||!viewingBook||!user) return;
    const bookId=viewingBook.id||viewingBook.bookId;
    await addDoc(collection(db,'comments'),{bookId,userId:user.uid,userName:userProfile.name,userPic:userProfile.profilePic,text:userComment,rating:userRating,timestamp:serverTimestamp()});
    setUserComment('');setUserRating(0);
  };

  const handleRecommendBook=async(targetId,targetName)=>{
    if(!viewingBook||!user) return;
    const bookId=viewingBook.id||viewingBook.bookId;
    const bestCover=await getBestCoverForBook(bookId,viewingBook,lang);
    const recData={bookId,title:viewingBook.volumeInfo?.title||viewingBook.title,authors:viewingBook.volumeInfo?.authors||viewingBook.authors||['Anónimo'],thumbnail:bestCover.url,status:'library',recommendedBy:userProfile.name,senderId:user.uid,recommendationMessage:recommendMessage,sentAt:new Date().toISOString(),inLibrary:true};
    await setDoc(doc(db,'users',targetId,'myBooks',bookId),recData);
    await createNotification(targetId,'book_recommendation',lang==='es'?'¡Te recomendaron un libro!':'Book recommended!',lang==='es'?`${userProfile.name} te recomendó "${recData.title}"`:`${userProfile.name} recommended "${recData.title}"`,{bookId,senderId:user.uid,senderName:userProfile.name});
    setShowRecommendList(false);setRecommendMessage('');
    alert(lang==='es'?'¡Recomendado!':'Recommended!');
  };

  const sendMessage=async(receiverId,receiverName,messageText)=>{
    if(!user||!receiverId||!messageText?.trim()) return;
    const existingConv=conversations.find(c=>c.participants.includes(user.uid)&&c.participants.includes(receiverId));
    const conversationId=existingConv?.id||doc(collection(db,'conversations')).id;
    await setDoc(doc(db,'conversations',conversationId),{participants:[user.uid,receiverId],participantNames:[userProfile.name,receiverName],lastMessage:messageText,lastMessageAt:serverTimestamp(),lastMessageSenderId:user.uid,lastMessageSenderName:userProfile.name,unreadCount:{[receiverId]:(existingConv?.unreadCount?.[receiverId]||0)+1}},{merge:true});
    await addDoc(collection(db,'messages'),{conversationId,senderId:user.uid,senderName:userProfile.name,senderPic:userProfile.profilePic,receiverId,receiverName,text:messageText,timestamp:serverTimestamp(),read:false});
    await createNotification(receiverId,'message',lang==='es'?'Nuevo mensaje':'New message',`${userProfile.name}: ${messageText.substring(0,50)}`,{senderId:user.uid,senderName:userProfile.name,conversationId});
    setNewMessage('');setShowNewMessageModal(false);setSelectedUserForMessage(null);
  };

  const markMessagesAsRead=async(conversationId)=>{
    if(!user||!conversationId) return;
    await updateDoc(doc(db,'conversations',conversationId),{[`unreadCount.${user.uid}`]:0});
  };

  const toggleFavoriteWriter=async(authorName)=>{
    if(!user) return;
    const isFav=favoriteWritersList.includes(authorName);
    if(isFav){
      const snap=await getDocs(query(collection(db,'favoriteWriters'),where('userId','==',user.uid),where('authorName','==',authorName)));
      snap.docs.forEach(d=>deleteDoc(d.ref));
    }else{
      await addDoc(collection(db,'favoriteWriters'),{userId:user.uid,authorName,addedAt:serverTimestamp()});
    }
  };

  const toggleSavedPost=async(postId)=>{
    if(!user) return;
    const isSaved=savedPostsList.includes(postId);
    if(isSaved){
      const snap=await getDocs(query(collection(db,'savedPosts'),where('userId','==',user.uid),where('postId','==',postId)));
      snap.docs.forEach(d=>deleteDoc(d.ref));
    }else{
      const post=wallPosts.find(p=>p.id===postId);
      if(post) await addDoc(collection(db,'savedPosts'),{userId:user.uid,postId,postData:post,savedAt:serverTimestamp()});
    }
  };

  const sendBorrowRequest=async(book,ownerId,ownerName)=>{
    if(!user||user.uid===ownerId) return;
    if(borrowRequests[book.bookId]?.find(r=>r.borrowerId===user.uid&&r.status==='pending')){alert(lang==='es'?'Ya enviaste solicitud':'Already sent');return;}
    await addDoc(collection(db,'borrowRequests'),{bookId:book.bookId,bookTitle:book.title,bookThumbnail:book.thumbnail,ownerId,ownerName,borrowerId:user.uid,borrowerName:userProfile.name,borrowerPic:userProfile.profilePic,status:'pending',message:'',timestamp:serverTimestamp()});
    await createNotification(ownerId,'borrow_request',lang==='es'?'Solicitud de préstamo':'Borrow request',lang==='es'?`${userProfile.name} quiere pedir prestado "${book.title}"`:`${userProfile.name} wants to borrow "${book.title}"`,{bookId:book.bookId,bookTitle:book.title,borrowerId:user.uid,borrowerName:userProfile.name});
    alert(lang==='es'?'Solicitud enviada':'Request sent');
    setShowBorrowModal(false);setBookToBorrow(null);
  };

  const syncReadBooksAfterDelete=async(deletedBookId)=>{
    if(!user) return;
    const deletedBook=myBooks.find(b=>b.bookId===deletedBookId);
    if(deletedBook?.status==='read') await updateDoc(doc(db,'profiles',user.uid),{readCount:increment(-1),readBooksList:arrayRemove(deletedBookId)});
  };

  const handleImageUpload=async(e)=>{
    const file=e.target.files[0];
    if(file&&user){
      const reader=new FileReader();
      reader.onloadend=async()=>{
        let imageDataUrl=reader.result;
        if(window.confirm(lang==='es'?'¿Convertir a blanco y negro?':'Convert to black and white?'))
          imageDataUrl=await convertToGrayscale(imageDataUrl);
        setUserProfile(p=>({...p,profilePic:imageDataUrl}));
        await updateDoc(doc(db,'profiles',user.uid),{profilePic:imageDataUrl});
      };
      reader.readAsDataURL(file);
    }
  };

  const performSearch=async(forcedQ=null)=>{
    const q=(forcedQ||searchQuery).trim();
    if(!q) return;
    setIsSearching(true);setSearchError(null);
    try{
      let queryParam=q;
      if(searchType==='isbn') queryParam=`isbn:${q.replace(/\D/g,'')}`;
      else if(searchType==='intitle') queryParam=`intitle:${q}`;
      else if(searchType==='inauthor') queryParam=`inauthor:"${q}"`;
      const maxResults=searchType==='inauthor'?30:15;
      let url=`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(queryParam)}&maxResults=${maxResults}`;
      if(GOOGLE_BOOKS_API_KEY) url+=`&key=${GOOGLE_BOOKS_API_KEY}`;
      const res=await fetchWithRetry(url);
      const data=await res.json();
      if(data.items) setSearchResults(data.items);
      else setSearchError(lang==='es'?'Sin resultados':'No results');
    }catch(e){setSearchError('Error en la búsqueda');}
    finally{setIsSearching(false);}
  };

  const searchAuthors=async()=>{
    if(!writerSearch.trim()) return;
    setAuthorSearchLoading(true);
    try{
      let url=`https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(writerSearch)}"&maxResults=10`;
      if(GOOGLE_BOOKS_API_KEY) url+=`&key=${GOOGLE_BOOKS_API_KEY}`;
      const res=await fetchWithRetry(url);const data=await res.json();
      if(data.items){
        const map=new Map();
        data.items.forEach(item=>{
          item.volumeInfo?.authors?.forEach(author=>{
            if(!map.has(author)&&author.toLowerCase().includes(writerSearch.toLowerCase()))
              map.set(author,{name:author,booksCount:1,thumbnail:item.volumeInfo.imageLinks?.thumbnail?.replace('http:','https:')||null});
            else if(map.has(author)){const e=map.get(author);map.set(author,{...e,booksCount:e.booksCount+1});}
          });
        });
        setWriterResults(Array.from(map.values()));
      }else setWriterResults([]);
    }catch(e){setWriterResults([]);}
    finally{setAuthorSearchLoading(false);}
  };

  const viewAuthorDetails=async(authorName)=>{
    setSelectedAuthor(authorName);setAuthorBooks([]);setAuthorDetails(null);
    try{
      const res=await fetchWithRetry(`https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&limit=10`);
      const data=await res.json();
      if(data.docs){
        setAuthorBooks(data.docs.map(b=>({id:b.key?.replace('/works/',''),volumeInfo:{title:b.title,authors:[authorName],description:b.first_sentence?.[0]||'',publishedDate:b.first_publish_year?.toString(),imageLinks:b.cover_i?{thumbnail:`https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`}:null}})));
      }
      try{
        const wikiRes=await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(authorName)}`);
        if(wikiRes.ok){const wikiData=await wikiRes.json();setAuthorDetails({name:authorName,biography:wikiData.extract||'',thumbnail:wikiData.thumbnail?.source||'',description:wikiData.description||''});}
        else setAuthorDetails({name:authorName,biography:`${authorName} es un autor reconocido.`,thumbnail:'',description:'Autor'});
      }catch(e){setAuthorDetails({name:authorName,biography:`${authorName} es un autor reconocido.`,thumbnail:'',description:'Autor'});}
    }catch(e){console.error(e);}
  };

  const loadBookRecommendations=async(book)=>{
    if(!book) return;
    setLoadingRecommendations(true);
    const bookTitle=book.volumeInfo?.title||book.title;
    const bookAuthors=book.volumeInfo?.authors||book.authors||[];
    try{
      if(bookAuthors.length>0){
        const res=await fetchWithRetry(`https://openlibrary.org/search.json?author=${encodeURIComponent(bookAuthors[0])}&limit=20`);
        const data=await res.json();
        const books=(data.docs||[]).filter(b=>b.title&&b.key&&b.title!==bookTitle).map(b=>({id:b.key.replace('/works/',''),title:b.title,authors:[bookAuthors[0]],thumbnail:b.cover_i?`https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`:null,firstPublishYear:b.first_publish_year}));
        setAuthorRecommendations(books);
      }
      const keywords=bookTitle.split(' ').filter(w=>w.length>3).slice(0,3).join(' ');
      const res2=await fetchWithRetry(`https://openlibrary.org/search.json?q=${encodeURIComponent(keywords)}&limit=15`);
      const data2=await res2.json();
      const sim=(data2.docs||[]).filter(b=>b.title&&b.key&&b.title!==bookTitle).map(b=>({id:b.key.replace('/works/',''),title:b.title,authors:b.author_name||['Desconocido'],thumbnail:b.cover_i?`https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`:null,firstPublishYear:b.first_publish_year}));
      setSimilarBooks(sim);
    }catch(e){console.error(e);}
    finally{setLoadingRecommendations(false);}
  };

  const searchMoreBooksByAuthor=async(authorName)=>{
    setMoreBooksLoading(true);
    try{
      const res=await fetchWithRetry(`https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&limit=20&page=2`);
      const data=await res.json();
      if(data.docs){
        const newBooks=data.docs.filter(b=>b.title&&b.key&&!authorBooks.some(e=>e.id===b.key.replace('/works/',''))).map(b=>({id:b.key.replace('/works/',''),volumeInfo:{title:b.title,authors:[authorName],description:'',publishedDate:b.first_publish_year?.toString(),imageLinks:b.cover_i?{thumbnail:`https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`}:null}}));
        setAuthorBooks(p=>[...p,...newBooks]);
      }
    }catch(e){console.error(e);}
    finally{setMoreBooksLoading(false);}
  };

  const searchBooksForPost=async()=>{
    if(!postSearch.trim()){setBooksForPost(myBooks.slice(0,10));return;}
    try{
      let url=`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(postSearch)}&maxResults=10`;
      if(GOOGLE_BOOKS_API_KEY) url+=`&key=${GOOGLE_BOOKS_API_KEY}`;
      const res=await fetchWithRetry(url);const data=await res.json();
      setBooksForPost(data.items||myBooks.filter(b=>b.title?.toLowerCase().includes(postSearch.toLowerCase())||b.authors?.some(a=>a.toLowerCase().includes(postSearch.toLowerCase()))).slice(0,10));
    }catch(e){setBooksForPost(myBooks.filter(b=>b.title?.toLowerCase().includes(postSearch.toLowerCase())).slice(0,10));}
  };

  const setQuickStartDate=(option)=>{
    const d=new Date();
    if(option==='tomorrow') d.setDate(d.getDate()+1);
    else if(option==='next_week') d.setDate(d.getDate()+7);
    else if(option==='custom'){document.getElementById('start-date-picker')?.focus();return;}
    setPlanStartDate(d.toISOString().split('T')[0]);
    setShowStartDateOptions(false);
  };

  const inviteWhatsApp=()=>{
    window.open(`https://wa.me/?text=${encodeURIComponent('¡Seamos amigos en Sandbook! '+window.location.href)},'_blank'`);
  };

  const getReadersCount=(bookId)=>publicData.filter(p=>p.readBooksList?.includes(bookId)).length;

  const openUserProfileModal=(userData)=>{setUserProfileModalData(userData);setShowUserProfileModal(true);};
  const openBookDetailModal=(bookData)=>{setBookDetailData(bookData);setShowBookDetailModal(true);loadBookRecommendations(bookData);};
  const openBadgeModal=(badgeId)=>{setSelectedBadge({id:badgeId,...BADGE_DEFS[badgeId]});setShowBadgeModal(true);};

  const filteredMyBooks=myBooks.filter(b=>{
    if(librarySearch){
      const sl=librarySearch.toLowerCase();
      if(!b.title?.toLowerCase().includes(sl)&&!b.authors?.some(a=>a.toLowerCase().includes(sl))) return false;
    }
    if(filterType==='favorite') return b.isFavorite;
    if(filterType==='read') return b.status==='read';
    if(filterType==='liked') return userProfile.likes?.includes(b.bookId);
    if(filterType==='disliked') return userProfile.dislikes?.includes(b.bookId);
    if(filterType==='in_plan') return b.status==='reading';
    if(filterType==='in_library') return b.inLibrary;
    return true;
  });

  const filteredExternalBooks=selectedUserBooks.filter(b=>{
    if(selectedUserFilter==='favorite') return b.isFavorite;
    if(selectedUserFilter==='read') return b.status==='read';
    if(selectedUserFilter==='liked') return selectedUserProfile?.likes?.includes(b.bookId);
    if(selectedUserFilter==='in_plan') return b.status==='reading';
    if(selectedUserFilter==='in_library') return b.inLibrary;
    return true;
  });

  const filteredUsers=publicData.filter(p=>{
    if(p.userId===user?.uid) return false;
    if(userProfile.dismissedUsers?.includes(p.userId)) return false;
    if(friendsSearch&&!p.name?.toLowerCase().includes(friendsSearch.toLowerCase())) return false;
    if(friendsFilter==='google'&&!p.isGoogleUser) return false;
    if(friendsFilter==='anonymous'&&!p.isAnonymous) return false;
    if(friendsFilter==='following'&&!userProfile.following?.includes(p.userId)) return false;
    if(friendsFilter==='followers'&&!p.following?.includes(user?.uid)) return false;
    return true;
  });

  const filteredSavedPosts=wallPosts.filter(p=>savedPostsList.includes(p.id));
  const filteredFavoriteWriters=favoriteWritersList.filter(w=>!writerSearch||w.toLowerCase().includes(writerSearch.toLowerCase()));

  // ─── EFFECTS ───────────────────────────────────────────────

  useEffect(()=>{
    const welcomeShown=localStorage.getItem('sandbook_welcome_video_shown');
    if(welcomeShown) setShowWelcomeVideo(false);
    const tutorialShown=localStorage.getItem('sandbook_tutorial_shown');
    if(!tutorialShown) setTimeout(()=>setShowTutorial(true),1000);
    const script=document.createElement('script');
    script.src="https://unpkg.com/html5-qrcode";script.async=true;
    document.body.appendChild(script);
    return()=>{if(document.body.contains(script)) document.body.removeChild(script);};
  },[]);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async(u)=>{
      setIsAuthLoading(true);
      if(u){
        setUser(u);
        setRequireGoogleLogin(u.isAnonymous);
        const profileDoc=await getDoc(doc(db,'profiles',u.uid));
        if(profileDoc.exists()){
          const data=profileDoc.data();
          setUserProfile(p=>({...p,...data,isGoogleUser:!u.isAnonymous&&u.providerData.some(pr=>pr.providerId==='google.com'),isAnonymous:u.isAnonymous}));
        }else{
          const newProfile={userId:u.uid,name:u.displayName||'Lector',email:u.email||'',profilePic:u.photoURL||'',badges:[],scanCount:0,readCount:0,planCount:0,libraryCount:0,favoriteCount:0,followersCount:0,following:[],dismissedUsers:[],readBooksList:[],favoriteBooks:[],theme:'light',likes:[],dislikes:[],friendRequests:[],sentRequests:[],isGoogleUser:!u.isAnonymous&&u.providerData.some(pr=>pr.providerId==='google.com'),isAnonymous:u.isAnonymous,favoriteWriters:[],savedPosts:[]};
          await setDoc(doc(db,'profiles',u.uid),newProfile);
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
      }else{
        try{await signInAnonymously(auth);}catch(e){console.error(e);}
      }
      setIsAuthLoading(false);
    });
    return()=>unsub();
  },[]);

  useEffect(()=>{loadFollowLists();},[publicData,userProfile.following,user?.uid]);

  useEffect(()=>{
    if(!user) return;
    setIsLibraryLoading(true);
    const interval=setInterval(()=>setLibraryLoadingProgress(p=>{if(p>=90){clearInterval(interval);return 90;}return p+10;}),100);
    const unsubBooks=onSnapshot(collection(db,'users',user.uid,'myBooks'),(s)=>{
      const books=s.docs.map(d=>d.data());
      setMyBooks(books);
      setCurrentlyReadingCount(books.filter(b=>b.status==='reading').length);
      const now=new Date(),som=new Date(now.getFullYear(),now.getMonth(),1);
      setBooksThisMonth(books.filter(b=>{if(b.status!=='read') return false;const fd=b.finishDate||b.addedAt;return fd&&new Date(fd)>=som;}).length);
      setUserStats({readCount:books.filter(b=>b.status==='read').length,planCount:books.filter(b=>b.status==='reading').length,libraryCount:books.filter(b=>b.status==='library'||b.inLibrary).length,favoriteCount:books.filter(b=>b.isFavorite).length,likedCount:books.filter(b=>userProfile.likes?.includes(b.bookId)).length,dislikedCount:books.filter(b=>userProfile.dislikes?.includes(b.bookId)).length});
      clearInterval(interval);setLibraryLoadingProgress(100);
      setTimeout(()=>{setIsLibraryLoading(false);setLibraryLoadingProgress(0);},500);
    });
    const unsubProfile=onSnapshot(doc(db,'profiles',user.uid),(d)=>{
      if(d.exists()){
        const data=d.data();
        setUserProfile(p=>({...p,...data,isGoogleUser:!user.isAnonymous&&user.providerData.some(pr=>pr.providerId==='google.com'),isAnonymous:user.isAnonymous}));
        setBadgeProgress(calculateBadgeProgress());
        loadFollowLists();
      }
    });
    const unsubPublic=onSnapshot(collection(db,'profiles'),(s)=>setPublicData(s.docs.map(d=>d.data())));
    const unsubComments=onSnapshot(collection(db,'comments'),(s)=>{
      const map={};
      s.docs.forEach(d=>{const data={id:d.id,...d.data()};if(!map[data.bookId])map[data.bookId]=[];map[data.bookId].push(data);});
      setBookComments(map);
    });
    const unsubPosts=loadWallPosts();
    const unsubFriends=loadFriendsData(user.uid);
    const unsubWallComments=loadWallPostComments();
    const unsubConversations=loadConversations();
    const unsubGlobalLikes=loadGlobalLikes();
    const unsubFavoriteWriters=loadFavoriteWriters();
    const unsubSavedPosts=loadSavedPosts();
    const unsubBorrowRequests=loadBorrowRequests();
    return()=>{
      unsubBooks();unsubProfile();unsubPublic();unsubComments();
      [unsubPosts,unsubFriends,unsubWallComments,unsubConversations,unsubGlobalLikes,unsubFavoriteWriters,unsubSavedPosts,unsubBorrowRequests].forEach(u=>u&&u());
    };
  },[user]);

  useEffect(()=>{
    if(!selectedUserProfile){setSelectedUserBooks([]);return;}
    const unsub=onSnapshot(collection(db,'users',selectedUserProfile.userId,'myBooks'),(s)=>setSelectedUserBooks(s.docs.map(d=>d.data())));
    return()=>unsub();
  },[selectedUserProfile]);

  useEffect(()=>{
    if(viewingBook) loadBookRecommendations(viewingBook);
    else{setAuthorRecommendations([]);setGenreRecommendations([]);setSimilarBooks([]);setCurrentRecommendationPage({author:0,genre:0,similar:0});}
  },[viewingBook]);

  useEffect(()=>{
    const handler=(e)=>{if(notificationsRef.current&&!notificationsRef.current.contains(e.target)) setShowNotifications(false);};
    document.addEventListener('mousedown',handler);
    return()=>document.removeEventListener('mousedown',handler);
  },[]);

  // ─── LOADER ────────────────────────────────────────────────
  if(isAuthLoading){
    return(
      <div style={{minHeight:'100vh',background:`linear-gradient(135deg, ${GR.brown} 0%, #3d2714 50%, #4a1f0a 100%)`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32}}>
        <div style={{animation:'bounce 1s infinite'}}>
          <BookOpen size={80} color="#fff" style={{opacity:.9}}/>
        </div>
        <h1 style={{marginTop:24,fontFamily:"'Playfair Display', Georgia, serif",fontSize:36,fontWeight:900,color:'#fff',letterSpacing:-1}}>
          sand<span style={{color:GR.gold}}>book</span>
        </h1>
        <div style={{marginTop:24,width:180,height:6,background:'rgba(255,255,255,.2)',borderRadius:3,overflow:'hidden'}}>
          <div style={{height:'100%',width:'50%',background:'rgba(255,255,255,.8)',borderRadius:3,animation:'loading 1.5s ease-in-out infinite'}}/>
        </div>
        <p style={{marginTop:12,color:'rgba(255,255,255,.6)',fontSize:13}}>
          {lang==='es'?'Cargando tu biblioteca...':'Loading your library...'}
        </p>
        <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
      </div>
    );
  }

  // ─── ESTILOS COMUNES ───────────────────────────────────────
  const pageStyle={minHeight:'100vh',background:GR.cream,fontFamily:"'Source Sans 3', 'Segoe UI', sans-serif",color:'#1a1a1a',paddingBottom:72};
  const inputStyle={width:'100%',padding:'8px 12px',border:`1px solid ${GR.border}`,borderRadius:6,fontFamily:'inherit',fontSize:13,outline:'none',background:'#fff',boxSizing:'border-box'};
  const pillActive={background:GR.green,color:'#fff',border:'none',borderRadius:20,padding:'5px 12px',fontSize:11,fontWeight:700,cursor:'pointer'};
  const pillInactive={background:'#f0ede6',color:'#4a4a4a',border:'none',borderRadius:20,padding:'5px 12px',fontSize:11,fontWeight:700,cursor:'pointer'};

  // Helper para reutilizar en render de libros externos y propios
  const BookCard=({book, isExternal=false, onBorrow})=>(
    <div style={{background:'#fff',border:`1px solid ${GR.border}`,borderRadius:8,padding:14,boxShadow:GR.shadow,display:'flex',gap:12}}>
      <BookCoverAsync bookId={book.bookId||book.id} bookData={book} myBooks={myBooks} lang={lang}
        style={{width:60,height:88,objectFit:'contain',borderRadius:6,background:'#f8f8f8',border:`1px solid ${GR.border}`,flexShrink:0}}
        onClick={()=>openBookDetailModal(book)}/>
      <div style={{flex:1,minWidth:0}}>
        <h3 onClick={()=>openBookDetailModal(book)} style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:GR.brown,margin:'0 0 2px',cursor:'pointer',lineHeight:1.3,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {book.title}
        </h3>
        <p onClick={()=>book.authors?.[0]&&viewAuthorDetails(book.authors[0])} style={{fontSize:11,color:'#888',margin:'0 0 6px',cursor:'pointer'}}>
          {book.authors?.join(', ')}
        </p>
        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          <span style={{...(book.status==='read'?{background:'#e6f4e6',color:'#1f7a1f'}:book.status==='reading'?{background:'#ddeeff',color:'#1a5fa8'}:{background:'#f0ede6',color:'#666'}),padding:'2px 8px',borderRadius:20,fontSize:9,fontWeight:700,textTransform:'uppercase'}}>
            {book.status==='read'?t.read:book.status==='reading'?t.in_plan:t.in_library}
          </span>
          {book.isFavorite&&<Star size={11} color={GR.gold} fill={GR.gold}/>}
        </div>
        {book.status==='reading'&&<UserReadingProgress book={book} t={t}/>}
        {isExternal&&onBorrow&&(book.status==='library'||book.status==='read')&&(
          <button onClick={onBorrow} style={{marginTop:6,...pillInactive,fontSize:10,padding:'3px 10px'}}>
            {t.borrow_book}
          </button>
        )}
        {!isExternal&&(
          <div style={{display:'flex',gap:6,marginTop:6}}>
            <button onClick={()=>openBookDetailModal(book)} style={{...pillInactive,fontSize:10,padding:'3px 10px'}}>{t.view_profile}</button>
            <button onClick={()=>setBookToDelete(book.bookId)} style={{background:'#fde8e8',color:'#c0392b',border:'none',borderRadius:20,padding:'3px 8px',fontSize:10,fontWeight:700,cursor:'pointer'}}>✕</button>
          </div>
        )}
      </div>
    </div>
  );

  // ─── RENDER PRINCIPAL ───────────────────────────────────────
  return(
    <div style={pageStyle}>
      {/* GOOGLE FONTS */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* ZOOM PORTADA */}
      {zoomImage&&<CoverZoomModal imageUrl={zoomImage} title={zoomTitle} onClose={()=>setZoomImage(null)}/>}

      {/* REQUIRE GOOGLE LOGIN */}
      {requireGoogleLogin&&(
        <div style={{position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,.9)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:400,width:'100%',textAlign:'center'}}>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:28,fontWeight:900,color:GR.brown,marginBottom:8}}>sand<span style={{color:GR.gold}}>book</span></div>
            <p style={{fontSize:14,color:'#666',marginBottom:24}}>{t.require_google_login}</p>
            <BtnGR onClick={handleGoogleLogin} fullWidth>
              <img src="https://www.google.com/favicon.ico" alt="" style={{width:16,height:16}}/>
              {t.register_with_google}
            </BtnGR>
            <button onClick={()=>setRequireGoogleLogin(false)} style={{marginTop:12,background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#999'}}>{t.continue_without_account}</button>
          </div>
        </div>
      )}

      {/* VIDEO BIENVENIDA */}
      {showWelcomeVideo&&(
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <video ref={videoRef} autoPlay muted style={{width:'100%',height:'100%',objectFit:'cover'}}
            onEnded={()=>{setShowWelcomeVideo(false);localStorage.setItem('sandbook_welcome_video_shown','true');}}>
            <source src="/sandbook.mp4" type="video/mp4"/>
          </video>
          <button onClick={()=>{setShowWelcomeVideo(false);localStorage.setItem('sandbook_welcome_video_shown','true');if(videoRef.current)videoRef.current.pause();}}
            style={{position:'absolute',bottom:80,background:'rgba(0,0,0,.5)',color:'#fff',border:'none',borderRadius:24,padding:'10px 24px',cursor:'pointer',fontSize:14}}>
            Saltar video
          </button>
        </div>
      )}

      {/* HEADER GOODREADS */}
      <header style={{background:GR.brown,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,.25)'}}>
        <div style={{maxWidth:1120,margin:'0 auto',display:'flex',alignItems:'center',gap:12,padding:'0 16px',height:52}}>
          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:900,color:'#fff',letterSpacing:-.5,flexShrink:0}}>
            sand<span style={{color:GR.gold}}>book</span>
          </div>
          <div style={{flex:1,position:'relative',maxWidth:420}}>
            <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'){performSearch();setActiveTab('plan');}}}
              placeholder={t.search_p}
              style={{width:'100%',height:34,padding:'0 38px 0 12px',border:'none',borderRadius:4,fontFamily:'inherit',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
            <button onClick={()=>{performSearch();setActiveTab('plan');}}
              style={{position:'absolute',right:0,top:0,bottom:0,width:36,background:GR.green,border:'none',borderRadius:'0 4px 4px 0',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
              <Search size={15}/>
            </button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:'auto',flexShrink:0}}>
            {/* Notificaciones */}
            <div ref={notificationsRef} style={{position:'relative'}}>
              <button onClick={()=>setShowNotifications(!showNotifications)}
                style={{width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,.12)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(255,255,255,.85)',position:'relative'}}>
                <Bell size={17}/>
                {notifications.length>0&&<span style={{position:'absolute',top:-2,right:-2,background:GR.rust,color:'#fff',fontSize:9,fontWeight:700,minWidth:16,height:16,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{notifications.length}</span>}
              </button>
              {showNotifications&&(
                <div style={{position:'absolute',right:0,top:40,width:300,maxHeight:400,overflowY:'auto',background:'#fff',borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,.2)',border:`1px solid ${GR.border}`,zIndex:200}}>
                  <div style={{padding:'10px 14px',borderBottom:`1px solid ${GR.borderLight}`,fontWeight:700,fontSize:13,color:GR.brown}}>Notificaciones</div>
                  {notifications.length===0?<p style={{padding:16,fontSize:12,color:'#999',textAlign:'center'}}>Sin notificaciones</p>:
                    notifications.map(n=>(
                      <button key={n.id} onClick={()=>updateDoc(doc(db,'notifications',n.id),{read:true})}
                        style={{width:'100%',padding:'10px 14px',textAlign:'left',background:'none',border:'none',borderBottom:`1px solid ${GR.borderLight}`,cursor:'pointer'}}>
                        <p style={{fontSize:12,fontWeight:700,margin:0,color:GR.brown}}>{n.title}</p>
                        <p style={{fontSize:11,color:'#666',margin:'2px 0 0'}}>{n.message}</p>
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
            {/* Mensajes */}
            <button onClick={()=>setShowMessages(true)}
              style={{width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,.12)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(255,255,255,.85)',position:'relative'}}>
              <MessageSquare size={17}/>
              {conversations.some(c=>(c.unreadCount?.[user?.uid]||0)>0)&&<span style={{position:'absolute',top:-2,right:-2,background:GR.rust,color:'#fff',fontSize:9,fontWeight:700,minWidth:16,height:16,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>{conversations.filter(c=>(c.unreadCount?.[user?.uid]||0)>0).length}</span>}
            </button>
            {/* Idioma */}
            <button onClick={()=>setLang(lang==='es'?'en':'es')}
              style={{background:'rgba(255,255,255,.15)',color:'#fff',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:4,border:'none',cursor:'pointer',letterSpacing:.5}}>
              {lang==='es'?'EN':'ES'}
            </button>
            {/* Avatar */}
            <div style={{width:34,height:34,borderRadius:'50%',overflow:'hidden',border:'2px solid rgba(255,255,255,.35)',flexShrink:0,cursor:'pointer'}} onClick={()=>setActiveTab('profile')}>
              <img src={userProfile.profilePic||'https://via.placeholder.com/40'} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
          </div>
        </div>
        {/* Sub-tabs */}
        <div style={{background:GR.brownMid,borderBottom:'1px solid rgba(0,0,0,.15)'}}>
          <div style={{maxWidth:1120,margin:'0 auto',display:'flex',padding:'0 16px',height:36,overflowX:'auto',alignItems:'center',gap:2}}>
            {[
              {id:'library',label:t.library},
              {id:'plan',label:t.plan},
              {id:'social',label:t.wall},
              {id:'writers',label:t.writers},
              {id:'friends',label:t.friends},
            ].map(tab=>(
              <button key={tab.id}
                onClick={()=>{
                  if(tab.id==='writers'){setShowWriters(true);}
                  else if(tab.id==='friends'){setShowFriendsSection(true);}
                  else setActiveTab(tab.id);
                }}
                style={{
                  color:activeTab===tab.id?'#fff':'rgba(255,255,255,.7)',
                  fontSize:12.5,fontWeight:activeTab===tab.id?700:500,
                  padding:'0 14px',height:'100%',background:'none',border:'none',
                  borderBottom:activeTab===tab.id?`3px solid ${GR.gold}`:'3px solid transparent',
                  cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'color .15s'
                }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div style={{maxWidth:1120,margin:'0 auto',padding:'20px 16px 80px',display:'grid',gridTemplateColumns:'1fr 300px',gap:20,alignItems:'start'}}>

        {/* COLUMNA PRINCIPAL */}
        <main style={{minWidth:0}}>

          {/* BIBLIOTECA */}
          {activeTab==='library'&&(
            <div>
              {isLibraryLoading&&(
                <div style={{background:'#fff',border:`1px solid ${GR.border}`,borderRadius:8,padding:'12px 16px',marginBottom:14,boxShadow:GR.shadow}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{fontSize:11,color:'#888'}}>{t.loading_library}</span>
                    <span style={{fontSize:12,fontWeight:700,color:GR.greenDark}}>{libraryLoadingProgress}%</span>
                  </div>
                  <ProgressBar pct={libraryLoadingProgress}/>
                </div>
              )}
              {/* Buscador en biblioteca */}
              <div style={{position:'relative',marginBottom:12}}>
                <Search size={16} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#aaa'}}/>
                <input type="text" value={librarySearch} onChange={e=>setLibrarySearch(e.target.value)}
                  placeholder={t.search_in_my_books}
                  style={{...inputStyle,paddingLeft:34,borderRadius:20,marginBottom:0}}/>
              </div>
              {/* Filtros */}
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
                {[['all',t.all],['read',t.read],['favorite',t.favorites],['liked',t.liked_books],['in_plan',t.in_plan],['in_library',t.in_library]].map(([type,label])=>(
                  <button key={type} onClick={()=>setFilterType(type)}
                    style={filterType===type?pillActive:pillInactive}>{label}</button>
                ))}
              </div>
              {/* Lista de libros */}
              {filteredMyBooks.length===0?(
                <div style={{background:'#fff',border:`1px solid ${GR.border}`,borderRadius:8,padding:48,textAlign:'center'}}>
                  <BookOpen size={48} color={GR.border} style={{margin:'0 auto 12px'}}/>
                  <p style={{color:'#aaa',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>
                    {lang==='es'?'Tu biblioteca está vacía':'Your library is empty'}
                  </p>
                  <BtnGR onClick={()=>setActiveTab('plan')} style={{marginTop:12}}>{t.search_now}</BtnGR>
                </div>
              ):(
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
                  {filteredMyBooks.map(book=>(
                    <div key={book.bookId}>
                      <BookCard book={book}/>
                      {book.status==='reading'&&book.checkpoints&&(
                        <div style={{background:'#fff',border:`1px solid ${GR.borderLight}`,borderRadius:'0 0 8px 8px',borderTop:'none',padding:'0 14px 12px'}}>
                          <ReadingPlanDetail
                            book={book}
                            onToggleCheckpoint={toggleCheckpoint}
                            onSaveNote={saveCheckpointNote}
                            onSavePage={saveCheckpointPage}
                            t={t}
                            checkpointNotes={checkpointNotes}
                            currentPageInputs={currentPageInputs}
                            expandedCheckpoints={expandedCheckpoints}
                            onToggleExpand={toggleCheckpointExpand}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BUSCAR */}
          {activeTab==='plan'&&(
            <div>
              <div style={{background:'#fff',border:`1px solid ${GR.border}`,borderRadius:8,padding:16,marginBottom:14,boxShadow:GR.shadow}}>
                <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                  {[['all',t.global_f],['intitle',t.title_f],['inauthor',t.author_f],['isbn',t.isbn_f]].map(([type,label])=>(
                    <button key={type} onClick={()=>setSearchType(type)} style={searchType===type?pillActive:pillInactive}>{label}</button>
                  ))}
                </div>
                <div style={{display:'flex',gap:8}}>
                  <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&performSearch()}
                    placeholder={t.search_p} style={{...inputStyle,borderRadius:4}}/>
                  <BtnGR onClick={performSearch} disabled={isSearching||!searchQuery.trim()}>
                    {isSearching?<Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/>:<Search size={16}/>}
                  </BtnGR>
                  <button onClick={()=>setShowScanner(true)} style={{padding:'7px 12px',background:GR.green,color:'#fff',border:'none',borderRadius:4,cursor:'pointer',display:'flex',alignItems:'center'}}>
                    <Barcode size={16}/>
                  </button>
                </div>
              </div>
              {searchError&&<p style={{color:GR.rust,fontSize:12,marginBottom:12}}>{searchError}</p>}
              {searchResults.length>0&&(
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
                  {searchResults.map(book=>{
                    const have=myBooks.find(b=>b.bookId===book.id);
                    return(
                      <div key={book.id} style={{background:'#fff',border:`1px solid ${GR.border}`,borderRadius:8,padding:14,boxShadow:GR.shadow,display:'flex',gap:12}}>
                        <BookCoverAsync bookId={book.id} bookData={book} myBooks={myBooks} lang={lang}
                          style={{width:64,height:96,objectFit:'contain',borderRadius:4,background:'#f8f8f8',border:`1px solid ${GR.border}`,flexShrink:0,cursor:'pointer'}}
                          onClick={()=>setViewingBook(book)}/>
                        <div style={{flex:1,minWidth:0}}>
                          <h3 onClick={()=>setViewingBook(book)} style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:GR.brown,margin:'0 0 2px',cursor:'pointer',lineHeight:1.3}}>
                            {book.volumeInfo?.title}
                          </h3>
                          <p onClick={()=>book.volumeInfo?.authors?.[0]&&viewAuthorDetails(book.volumeInfo.authors[0])} style={{fontSize:11,color:'#888',margin:'0 0 2px',cursor:'pointer'}}>
                            {book.volumeInfo?.authors?.join(', ')}
                          </p>
                          <p style={{fontSize:10,color:'#bbb',margin:'0 0 8px'}}>{book.volumeInfo?.pageCount} {t.pages}</p>
                          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                            <BtnGR small onClick={()=>handleAddBook(book,'library',false,true)} disabled={!!have}>{have?t.in_your_library:t.add_to_library}</BtnGR>
                            <BtnGR small onClick={()=>setPlanningBook(book)} color={GR.brownMid} darkColor={GR.brown}>{t.reading_plan}</BtnGR>
                          </div>
                          <div style={{display:'flex',gap:6,marginTop:6}}>
                            <button onClick={()=>handleGlobalBookReaction(book.id,'like')}
                              style={{display:'flex',alignItems:'center',gap:3,padding:'3px 8px',borderRadius:4,border:`1px solid ${GR.border}`,background:globalLikes[book.id]?.likes?.includes(user?.uid)?GR.greenLight:'#fff',cursor:'pointer',fontSize:11}}>
                              <ThumbsUp size={11} color={GR.greenDark}/> {globalLikes[book.id]?.likes?.length||0}
                            </button>
                            <button onClick={()=>handleGlobalBookReaction(book.id,'dislike')}
                              style={{display:'flex',alignItems:'center',gap:3,padding:'3px 8px',borderRadius:4,border:`1px solid ${GR.border}`,background:globalLikes[book.id]?.dislikes?.includes(user?.uid)?'#fde8e8':'#fff',cursor:'pointer',fontSize:11}}>
                              <ThumbsDown size={11} color={GR.rust}/> {globalLikes[book.id]?.dislikes?.length||0}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MURO SOCIAL */}
          {activeTab==='social'&&(
            <div>
              <button onClick={()=>{setBooksForPost(myBooks.slice(0,10));setShowPostModal(true);}}
                style={{width:'100%',padding:'11px 20px',background:GR.green,color:'#fff',border:`1px solid ${GR.greenDark}`,borderRadius:8,fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:16,boxShadow:GR.shadow}}>
                <PenLine size={16}/> {t.post_quote}
              </button>
              {wallPosts.length===0?(
                <div style={{background:'#fff',border:`1px solid ${GR.border}`,borderRadius:8,padding:48,textAlign:'center'}}>
                  <MessageSquare size={48} color={GR.border} style={{margin:'0 auto 12px'}}/>
                  <p style={{color:'#aaa',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>{t.no_posts}</p>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {wallPosts.map(post=>{
                    const isLiked=(post.likesBy||[]).includes(user?.uid);
                    const isSaved=savedPostsList.includes(post.id);
                    const isOwn=post.userId===user?.uid;
                    const postCmts=wallPostComments[post.id]||[];
                    return(
                      <article key={post.id} style={{background:'#fff',border:`1px solid ${GR.border}`,borderRadius:8,overflow:'hidden',boxShadow:GR.shadow}}>
                        {/* Header post */}
                        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px 8px'}}>
                          <img src={post.userPic||'https://via.placeholder.com/36'} alt=""
                            style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',border:`1px solid ${GR.border}`,cursor:'pointer'}}
                            onClick={()=>openUserProfileModal({name:post.userName,profilePic:post.userPic,userId:post.userId,...publicData.find(p=>p.userId===post.userId)})}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13.5}}>
                              <a href="#" onClick={e=>{e.preventDefault();openUserProfileModal({name:post.userName,profilePic:post.userPic,userId:post.userId,...publicData.find(p=>p.userId===post.userId)});}}
                                style={{fontWeight:700,color:GR.greenDark,textDecoration:'none'}}>{post.userName}</a>
                              <span style={{color:'#555'}}> {lang==='es'?'publicó una frase':'posted a quote'}</span>
                            </div>
                            <div style={{fontSize:11,color:'#999'}}>{post.timestamp?.seconds?new Date(post.timestamp.seconds*1000).toLocaleDateString():''}</div>
                          </div>
                          {isOwn&&(
                            <div style={{position:'relative'}}>
                              <button onClick={()=>setShowPostOptions(showPostOptions===post.id?null:post.id)}
                                style={{padding:6,background:'none',border:'none',cursor:'pointer',color:'#aaa',display:'flex'}}>
                                <MoreVertical size={16}/>
                              </button>
                              {showPostOptions===post.id&&(
                                <div style={{position:'absolute',right:0,top:28,width:180,background:'#fff',border:`1px solid ${GR.border}`,borderRadius:8,boxShadow:GR.shadowMd,zIndex:10}}>
                                  {[
                                    [()=>{setEditingPost(post.id);setEditPostContent(post.content);setShowPostOptions(null);},<Edit size={13}/>,lang==='es'?'Editar':'Edit'],
                                    [()=>{togglePostPrivacy(post.id,post.isPublic);setShowPostOptions(null);},post.isPublic?<EyeOff size={13}/>:<Eye size={13}/>,post.isPublic?(lang==='es'?'Hacer privada':'Make private'):(lang==='es'?'Hacer pública':'Make public')],
                                    [()=>{setPostToDelete(post.id);setShowPostOptions(null);},<Trash2 size={13}/>,lang==='es'?'Eliminar':'Delete',true],
                                  ].map(([fn,icon,label,danger],i)=>(
                                    <button key={i} onClick={fn} style={{width:'100%',padding:'9px 14px',textAlign:'left',background:'none',border:'none',borderBottom:i<2?`1px solid ${GR.borderLight}`:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:8,fontSize:12,color:danger?GR.rust:GR.brown,fontFamily:'inherit'}}>
                                      {icon}{label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Libro asociado */}
                        {post.bookTitle&&(
                          <div onClick={()=>openBookDetailModal({title:post.bookTitle,thumbnail:post.bookThumbnail,authors:post.bookAuthors,bookId:post.bookId})}
                            style={{display:'flex',alignItems:'center',gap:10,margin:'0 16px 10px',padding:'8px 12px',background:GR.parchment,borderRadius:6,cursor:'pointer',border:`1px solid ${GR.borderLight}`}}>
                            {post.bookThumbnail&&<img src={post.bookThumbnail} alt="" style={{width:32,height:48,objectFit:'contain',borderRadius:3,background:'#fff'}}/>}
                            <div>
                              <p style={{fontSize:12,fontWeight:700,color:GR.brown,margin:0}}>{post.bookTitle}</p>
                              <p style={{fontSize:10,color:'#888',margin:0}}>{post.bookAuthors?.join(', ')}</p>
                            </div>
                          </div>
                        )}
                        {/* Contenido */}
                        <div style={{padding:'0 16px 12px',fontFamily:"'Playfair Display',Georgia,serif",fontSize:13.5,fontStyle:'italic',color:'#333',lineHeight:1.75}}>
                          "{post.content}"
                        </div>
                        {/* Footer */}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px',borderTop:`1px solid ${GR.borderLight}`,background:GR.parchment,flexWrap:'wrap',gap:4}}>
                          <div style={{display:'flex',gap:2}}>
                            <ActionBtn icon={<Heart size={14} color={isLiked?GR.rust:'#aaa'} fill={isLiked?GR.rust:'none'}/>}
                              label={`${post.likes||0}`} onClick={()=>likeWallPost(post.id,post.likes||0,post.likesBy||[])} active={isLiked} activeColor={GR.rust}/>
                            <ActionBtn icon={<MessageCircle size={14}/>} label={`${postCmts.length}`}
                              onClick={()=>document.getElementById(`ci-${post.id}`)?.focus()}/>
                            <ActionBtn icon={<Bookmark size={14} color={isSaved?GR.gold:'#aaa'} fill={isSaved?GR.gold:'none'}/>}
                              label={isSaved?t.saved:t.save_post} onClick={()=>toggleSavedPost(post.id)} active={isSaved} activeColor={GR.gold}/>
                          </div>
                        </div>
                        {/* Comentarios */}
                        {postCmts.length>0&&(
                          <div style={{padding:'8px 16px',borderTop:`1px solid ${GR.borderLight}`}}>
                            {postCmts.slice(0,3).map(c=>(
                              <div key={c.id} style={{display:'flex',gap:8,marginBottom:6}}>
                                <img src={c.userPic||'https://via.placeholder.com/24'} alt=""
                                  style={{width:22,height:22,borderRadius:'50%',objectFit:'cover',cursor:'pointer'}}
                                  onClick={()=>openUserProfileModal({name:c.userName,profilePic:c.userPic,userId:c.userId})}/>
                                <div>
                                  <a href="#" onClick={e=>{e.preventDefault();openUserProfileModal({name:c.userName,profilePic:c.userPic,userId:c.userId});}}
                                    style={{fontSize:11,fontWeight:700,color:GR.greenDark,textDecoration:'none',marginRight:6}}>{c.userName}</a>
                                  <span style={{fontSize:11,color:'#555'}}>{c.text}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Input comentario */}
                        <div style={{padding:'8px 16px',display:'flex',gap:6,borderTop:`1px solid ${GR.borderLight}`}}>
                          <input id={`ci-${post.id}`} type="text"
                            value={commentInputs[post.id]||''}
                            onChange={e=>setCommentInputs(p=>({...p,[post.id]:e.target.value}))}
                            onKeyDown={e=>e.key==='Enter'&&addWallPostComment(post.id,commentInputs[post.id])}
                            placeholder={lang==='es'?'Escribe un comentario...':'Write a comment...'}
                            style={{...inputStyle,borderRadius:20,padding:'5px 12px',fontSize:12}}/>
                          <button onClick={()=>addWallPostComment(post.id,commentInputs[post.id])}
                            disabled={!commentInputs[post.id]?.trim()}
                            style={{padding:'5px 12px',background:GR.green,border:'none',borderRadius:20,cursor:'pointer',color:'#fff',display:'flex',alignItems:'center'}}>
                            <Send size={13}/>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PERFIL */}
          {activeTab==='profile'&&(
            <div>
              <div style={{background:'#fff',border:`1px solid ${GR.border}`,borderRadius:8,overflow:'hidden',boxShadow:GR.shadow,marginBottom:16}}>
                <div style={{height:120,background:`linear-gradient(135deg, ${GR.brown} 0%, #3d2714 100%)`}}/>
                <div style={{padding:'0 20px 20px'}}>
                  <div style={{display:'flex',alignItems:'flex-end',gap:16,marginTop:-48,marginBottom:16}}>
                    <div style={{position:'relative'}}>
                      <img src={userProfile.profilePic||'https://via.placeholder.com/100'} alt=""
                        style={{width:96,height:96,borderRadius:'50%',objectFit:'cover',border:'4px solid #fff',boxShadow:GR.shadowMd}}/>
                      <label style={{position:'absolute',bottom:0,right:0,width:28,height:28,background:GR.green,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'2px solid #fff'}}>
                        <Camera size={13} color="#fff"/>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}}/>
                      </label>
                    </div>
                    <div style={{flex:1,paddingTop:48}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        {isEditingProfile?(
                          <input type="text" value={userProfile.name}
                            onChange={e=>setUserProfile(p=>({...p,name:e.target.value}))}
                            style={{...inputStyle,width:'auto',flex:1,fontSize:18,fontWeight:700}}/>
                        ):(
                          <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:900,color:GR.brown,margin:0}}>{userProfile.name}</h2>
                        )}
                        <button onClick={()=>{
                          if(isEditingProfile&&user) updateDoc(doc(db,'profiles',user.uid),{name:userProfile.name});
                          setIsEditingProfile(!isEditingProfile);
                        }} style={{padding:6,background:GR.creamDark,border:'none',borderRadius:6,cursor:'pointer'}}>
                          <Edit3 size={14} color={GR.brown}/>
                        </button>
                      </div>
                      <p style={{fontSize:12,color:'#888',margin:'2px 0 0'}}>{getLevelTitle(userProfile.readCount||0,lang)} <VerificationCheck count={userProfile.readCount||0}/></p>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:0,borderTop:`1px solid ${GR.borderLight}`,paddingTop:12}}>
                    {[
                      [userProfile.readCount||0,t.read,()=>{}],
                      [userProfile.followersCount||0,t.followers,()=>setShowFollowersModal(true)],
                      [userProfile.following?.length||0,t.following,()=>setShowFollowingModal(true)],
                      [mutualFriendsList.length,t.friends,()=>setShowMutualFriendsModal(true)],
                    ].map(([num,label,fn],i)=>(
                      <button key={i} onClick={fn} style={{flex:1,textAlign:'center',padding:'8px 4px',background:'none',border:'none',cursor:'pointer',borderRight:i<3?`1px solid ${GR.borderLight}`:'none'}}>
                        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,fontWeight:700,color:GR.brown}}>{num}</div>
                        <div style={{fontSize:10,color:'#999',textTransform:'uppercase',letterSpacing:.3}}>{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
                {[
                  [userStats.readCount,t.read_count,'#1f7a1f'],
                  [userStats.planCount,t.plan_count,'#1a5fa8'],
                  [userStats.libraryCount,t.library_count,GR.brownMid],
                  [userStats.favoriteCount,t.favorite_count,GR.gold],
                  [currentlyReadingCount,t.currently_reading,GR.greenDark],
                  [booksThisMonth,t.books_this_month,GR.rust],
                ].map(([num,label,color],i)=>(
                  <div key={i} style={{background:'#fff',border:`1px solid ${GR.border}`,borderRadius:8,padding:'14px 12px',textAlign:'center',boxShadow:GR.shadow}}>
                    <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,fontWeight:700,color}}>{num}</div>
                    <div style={{fontSize:9,color:'#999',textTransform:'uppercase',letterSpacing:.3,marginTop:2}}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Insignias */}
              <SideCard title={`🏆 ${t.badges_title}`}>
                <div style={{padding:12,display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
                  {Object.entries(BADGE_DEFS).map(([id,def])=>{
                    const has=userProfile.badges?.includes(parseInt(id));
                    const prog=badgeProgress[id]||0;
                    return(
                      <button key={id} onClick={()=>openBadgeModal(id)}
                        style={{aspectRatio:'1',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:has?GR.goldLight:'#f5f3f0',border:`1px solid ${has?GR.gold:GR.border}`,cursor:'pointer',position:'relative',transition:'all .15s'}}>
                        <BadgeIcon badgeId={parseInt(id)} unlocked={has} size={22}/>
                        {!has&&prog>0&&(
                          <div style={{position:'absolute',bottom:-4,right:-4,background:GR.green,color:'#fff',fontSize:7,fontWeight:700,borderRadius:'50%',width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            {Math.round(prog)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </SideCard>

              {/* Acciones */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:16}}>
                {[
                  [()=>setShowFavoriteWriters(true),<PenTool size={20}/>,t.writers_section],
                  [()=>setShowSavedPosts(true),<Bookmark size={20}/>,t.saved_section],
                  [()=>setShowWriters(true),<Search size={20}/>,t.writers],
                  [()=>setShowFriendsSection(true),<Users size={20}/>,t.find_friends],
                  [inviteWhatsApp,<Share2 size={20}/>,t.invite,GR.green],
                  [handleLogout,<LogOut size={20}/>,t.logout,GR.rust],
                ].map(([fn,icon,label,color],i)=>(
                  <button key={i} onClick={fn} style={{
                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,
                    padding:'16px 12px',background:color?color:'#fff',
                    border:`1px solid ${color?'transparent':GR.border}`,borderRadius:8,
                    cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:700,
                    color:color?'#fff':GR.brown,boxShadow:GR.shadow,transition:'all .15s'
                  }}>{icon}{label}</button>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* SIDEBAR GOODREADS */}
        <aside style={{minWidth:0}}>
          <SideCard title="📚 Leyendo ahora" extra="Ver todos" onExtra={()=>setActiveTab('library')}>
            <div style={{display:'flex',borderBottom:`1px solid ${GR.borderLight}`}}>
              {[[currentlyReadingCount,lang==='es'?'Leyendo':'Reading'],[myBooks.filter(b=>b.status==='read').length,lang==='es'?'Leídos':'Read'],[myBooks.filter(b=>b.inLibrary).length,lang==='es'?'Biblioteca':'Library']].map((s,i)=>(
                <div key={i} style={{flex:1,textAlign:'center',padding:'8px 4px',borderRight:i<2?`1px solid ${GR.borderLight}`:'none'}}>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:GR.brown}}>{s[0]}</div>
                  <div style={{fontSize:9,color:'#aaa',textTransform:'uppercase',letterSpacing:.3}}>{s[1]}</div>
                </div>
              ))}
            </div>
            {myBooks.filter(b=>b.status==='reading').slice(0,2).map((b,i)=>(
              <div key={i} style={{display:'flex',gap:10,padding:'10px 14px',borderBottom:i===0?`1px solid ${GR.borderLight}`:'none'}}>
                <BookCoverAsync bookId={b.bookId} bookData={b} myBooks={myBooks} lang={lang}
                  style={{width:40,height:60,objectFit:'contain',borderRadius:3,background:'#f8f8f8',border:`1px solid ${GR.border}`,flexShrink:0,cursor:'pointer'}}
                  onClick={()=>openBookDetailModal(b)}/>
                <div style={{flex:1,minWidth:0}}>
                  <div onClick={()=>openBookDetailModal(b)} style={{fontSize:12,fontWeight:600,color:GR.brown,lineHeight:1.3,marginBottom:2,cursor:'pointer',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{b.title}</div>
                  <div style={{fontSize:11,color:'#aaa',marginBottom:6}}>{b.authors?.[0]}</div>
                  {b.checkpoints?.length>0&&<ProgressBar pct={(b.checkpoints.filter(c=>c.completed).length/b.checkpoints.length)*100}/>}
                  {b.checkpoints?.length>0&&<div style={{fontSize:9,color:'#aaa'}}>{b.checkpoints.filter(c=>c.completed).length}/{b.checkpoints.length} días · <a href="#" onClick={e=>{e.preventDefault();openBookDetailModal(b);}} style={{color:GR.greenDark}}>Actualizar</a></div>}
                </div>
              </div>
            ))}
          </SideCard>

          {/* Desafío lector */}
          <SideCard title={`🎯 ${lang==='es'?'Desafío lector':'Reading challenge'} ${new Date().getFullYear()}`}>
            <div style={{padding:14}}>
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <div style={{width:56,height:56,background:GR.green,borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:GR.shadowMd}}>
                  <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.8)',letterSpacing:1}}>{new Date().getFullYear()}</span>
                  <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:900,color:'#fff',lineHeight:1}}>{myBooks.filter(b=>b.status==='read').length}</span>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:GR.brown,marginBottom:2}}>
                    {lang==='es'?`¡Llevas ${myBooks.filter(b=>b.status==='read').length} libros!`:`You've read ${myBooks.filter(b=>b.status==='read').length} books!`}
                  </div>
                  <ProgressBar pct={Math.min((myBooks.filter(b=>b.status==='read').length/12)*100,100)}/>
                  <div style={{fontSize:11,color:'#888'}}>{lang==='es'?`Meta: 12 libros`:`Goal: 12 books`}</div>
                </div>
              </div>
            </div>
          </SideCard>

          {/* Escritores favoritos */}
          {favoriteWritersList.length>0&&(
            <SideCard title={`✍️ ${t.favorite_writers}`} extra={lang==='es'?'Ver todos':'See all'} onExtra={()=>setShowFavoriteWriters(true)}>
              {favoriteWritersList.slice(0,3).map((w,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:i<Math.min(favoriteWritersList.length,3)-1?`1px solid ${GR.borderLight}`:'none'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:GR.creamDark,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <PenTool size={14} color={GR.brownMid}/>
                  </div>
                  <button onClick={()=>viewAuthorDetails(w)} style={{fontWeight:600,fontSize:12,color:GR.greenDark,background:'none',border:'none',cursor:'pointer',textAlign:'left',padding:0}}>{w}</button>
                </div>
              ))}
            </SideCard>
          )}

          {/* Amigos */}
          <SideCard title={`👥 ${t.friends}`} extra={lang==='es'?'Encontrar amigos':'Find friends'} onExtra={()=>setShowFriendsSection(true)}>
            {mutualFriendsList.length===0?(
              <p style={{padding:'12px 14px',fontSize:11,color:'#aaa',textAlign:'center'}}>{t.no_friends_yet}</p>
            ):mutualFriendsList.slice(0,4).map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:i<Math.min(mutualFriendsList.length,4)-1?`1px solid ${GR.borderLight}`:'none'}}>
                <img src={f.profilePic||'https://via.placeholder.com/32'} alt="" onClick={()=>openUserProfileModal(f)}
                  style={{width:32,height:32,borderRadius:'50%',objectFit:'cover',cursor:'pointer'}}/>
                <div style={{fontWeight:600,fontSize:12,color:GR.greenDark,flex:1,cursor:'pointer'}} onClick={()=>openUserProfileModal(f)}>{f.name}</div>
                <div style={{fontSize:10,color:'#aaa'}}>{f.readCount||0} {t.read.toLowerCase()}</div>
              </div>
            ))}
          </SideCard>

          {/* Posts guardados recientes */}
          {savedPostsList.length>0&&(
            <SideCard title={`🔖 ${t.saved_section}`} extra={lang==='es'?'Ver todos':'See all'} onExtra={()=>setShowSavedPosts(true)}>
              {filteredSavedPosts.slice(0,2).map((post,i)=>(
                <div key={i} style={{padding:'10px 14px',borderBottom:i===0&&filteredSavedPosts.length>1?`1px solid ${GR.borderLight}`:'none'}}>
                  <p style={{fontSize:12,fontStyle:'italic',color:'#555',margin:0,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>"{post.content}"</p>
                  <p style={{fontSize:10,color:'#aaa',margin:'4px 0 0'}}>— {post.userName}</p>
                </div>
              ))}
            </SideCard>
          )}
        </aside>
      </div>

      {/* NAV INFERIOR */}
      <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:`1px solid ${GR.border}`,display:'flex',boxShadow:'0 -2px 12px rgba(90,62,43,.08)',zIndex:100}}>
        {[
          ['library',BookOpen,t.library],
          ['plan',Search,t.plan],
          ['social',MessageSquare,t.wall],
          ['profile',User,t.profile],
        ].map(([id,Icon,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{
            flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            padding:'8px 0 10px',gap:3,
            color:activeTab===id?GR.greenDark:'#aaa',
            fontSize:10,fontWeight:700,background:'none',border:'none',cursor:'pointer',
            fontFamily:'inherit',letterSpacing:.3,
            borderTop:activeTab===id?`2px solid ${GR.green}`:'2px solid transparent',
            transition:'all .15s'
          }}>
            <Icon size={20}/>
            {label}
          </button>
        ))}
      </nav>

      {/* ══ MODALES ══════════════════════════════════════════════ */}

      {/* DETALLE DE LIBRO */}
      {viewingBook&&(
        <Modal onClose={()=>{setViewingBook(null);setShowRecommendList(false);}} title={viewingBook.volumeInfo?.title||viewingBook.title} wide>
          <div style={{display:'flex',gap:16,marginBottom:16}}>
            <BookCoverAsync bookId={viewingBook.id||viewingBook.bookId} bookData={viewingBook} myBooks={myBooks} lang={lang}
              style={{width:100,height:148,objectFit:'contain',borderRadius:6,background:'#f8f8f8',border:`1px solid ${GR.border}`,flexShrink:0,cursor:'pointer'}}
              onZoom={(url,title)=>{setZoomImage(url);setZoomTitle(title);}}/>
            <div style={{flex:1}}>
              <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:GR.brown,margin:'0 0 4px'}}>{viewingBook.volumeInfo?.title||viewingBook.title}</h2>
              <p onClick={()=>{const a=(viewingBook.volumeInfo?.authors||viewingBook.authors)?.[0];if(a){setViewingBook(null);viewAuthorDetails(a);}}}
                style={{fontSize:13,color:GR.greenDark,margin:'0 0 12px',cursor:'pointer',fontStyle:'italic'}}>
                {viewingBook.volumeInfo?.authors?.join(', ')||viewingBook.authors?.join(', ')}
              </p>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                <BtnGR small onClick={()=>handleAddBook(viewingBook,'library',false,true)} disabled={!!myBooks.find(b=>b.bookId===(viewingBook.id||viewingBook.bookId))}>
                  {myBooks.find(b=>b.bookId===(viewingBook.id||viewingBook.bookId))?t.in_your_library:t.add_to_library}
                </BtnGR>
                <BtnGR small onClick={()=>{setPlanningBook(viewingBook);setViewingBook(null);}} color={GR.brownMid} darkColor={GR.brown}>{t.reading_plan}</BtnGR>
                <BtnGR small onClick={()=>setShowRecommendList(!showRecommendList)} color="#8e44ad" darkColor="#6c3483">{t.recommend}</BtnGR>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>handleGlobalBookReaction(viewingBook.id||viewingBook.bookId,'like')}
                  style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',border:`1px solid ${GR.border}`,borderRadius:4,background:globalLikes[viewingBook.id||viewingBook.bookId]?.likes?.includes(user?.uid)?GR.greenLight:'#fff',cursor:'pointer',fontSize:12}}>
                  <ThumbsUp size={13} color={GR.greenDark}/> {t.like} · {globalLikes[viewingBook.id||viewingBook.bookId]?.likes?.length||0}
                </button>
                <button onClick={()=>handleGlobalBookReaction(viewingBook.id||viewingBook.bookId,'dislike')}
                  style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',border:`1px solid ${GR.border}`,borderRadius:4,background:globalLikes[viewingBook.id||viewingBook.bookId]?.dislikes?.includes(user?.uid)?'#fde8e8':'#fff',cursor:'pointer',fontSize:12}}>
                  <ThumbsDown size={13} color={GR.rust}/> {t.dislike} · {globalLikes[viewingBook.id||viewingBook.bookId]?.dislikes?.length||0}
                </button>
              </div>
              <p style={{fontSize:11,color:'#aaa',marginTop:8}}>{getReadersCount(viewingBook.id||viewingBook.bookId)} {t.readers_count}</p>
            </div>
          </div>
          {/* Recomendar */}
          {showRecommendList&&(
            <div style={{background:GR.parchment,border:`1px solid ${GR.borderLight}`,borderRadius:8,padding:14,marginBottom:14}}>
              <p style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>{t.select_friend}</p>
              <textarea value={recommendMessage} onChange={e=>setRecommendMessage(e.target.value)}
                placeholder={t.message_placeholder}
                style={{...inputStyle,minHeight:60,resize:'vertical',marginBottom:8}}/>
              <div style={{maxHeight:160,overflowY:'auto'}}>
                {friendsList.length===0?<p style={{fontSize:11,color:'#aaa',textAlign:'center'}}>{t.no_friends}</p>:
                  friendsList.map(f=>(
                    <button key={f.userId} onClick={()=>handleRecommendBook(f.userId,f.name)}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'7px 10px',background:'#fff',border:`1px solid ${GR.borderLight}`,borderRadius:6,marginBottom:4,cursor:'pointer',fontFamily:'inherit'}}>
                      <img src={f.profilePic||'https://via.placeholder.com/28'} alt="" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover'}}/>
                      <span style={{fontSize:12,fontWeight:600,color:GR.brown}}>{f.name}</span>
                      <Send size={13} color={GR.green} style={{marginLeft:'auto'}}/>
                    </button>
                  ))
                }
              </div>
            </div>
          )}
          {/* Descripción */}
          <p style={{fontSize:13,color:'#555',lineHeight:1.7,marginBottom:16}}>{viewingBook.volumeInfo?.description?.replace(/<[^>]*>/g,'')||viewingBook.description||''}</p>
          {/* Plan activo */}
          {myBooks.find(b=>b.bookId===(viewingBook.id||viewingBook.bookId))?.status==='reading'&&(
            <ReadingPlanDetail
              book={myBooks.find(b=>b.bookId===(viewingBook.id||viewingBook.bookId))}
              onToggleCheckpoint={toggleCheckpoint} onSaveNote={saveCheckpointNote} onSavePage={saveCheckpointPage}
              t={t} checkpointNotes={checkpointNotes} currentPageInputs={currentPageInputs}
              expandedCheckpoints={expandedCheckpoints} onToggleExpand={toggleCheckpointExpand}/>
          )}
          {/* Reseñas */}
          <div style={{borderTop:`1px solid ${GR.borderLight}`,paddingTop:14,marginTop:14}}>
            <h4 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,fontWeight:700,color:GR.brown,margin:'0 0 12px'}}>{t.reviews}</h4>
            <div style={{marginBottom:12}}>
              <Stars rating={userRating} interactive onRate={setUserRating} size={20}/>
              <textarea value={userComment} onChange={e=>setUserComment(e.target.value)}
                placeholder={t.my_review} style={{...inputStyle,minHeight:60,resize:'vertical',marginTop:8}}/>
              <BtnGR small onClick={submitGlobalReview} disabled={!userRating} style={{marginTop:8}}>{t.save}</BtnGR>
            </div>
            {(bookComments[viewingBook.id||viewingBook.bookId]||[]).map(c=>(
              <div key={c.id} style={{background:GR.parchment,borderRadius:6,padding:'10px 12px',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <img src={c.userPic||'https://via.placeholder.com/24'} alt="" style={{width:24,height:24,borderRadius:'50%',objectFit:'cover'}}/>
                  <span style={{fontSize:12,fontWeight:700,color:GR.brown}}>{c.userName}</span>
                  <Stars rating={c.rating} size={11}/>
                </div>
                <p style={{fontSize:12,color:'#555',margin:0}}>{c.text}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* PLANIFICADOR */}
      {planningBook&&(
        <Modal onClose={()=>setPlanningBook(null)} title={t.reading_plan}>
          <div style={{textAlign:'center',marginBottom:16}}>
            <BookCoverAsync bookId={planningBook.id||planningBook.bookId} bookData={planningBook} myBooks={myBooks} lang={lang}
              style={{width:72,height:108,objectFit:'contain',borderRadius:6,background:'#f8f8f8',border:`1px solid ${GR.border}`,margin:'0 auto 8px'}}/>
            <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,fontWeight:700,color:GR.brown,margin:'0 0 2px'}}>{planningBook.volumeInfo?.title||planningBook.title}</h3>
            <p style={{fontSize:11,color:'#888',margin:0}}>{planningBook.volumeInfo?.authors?.join(', ')||planningBook.authors?.join(', ')}</p>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[[t.manual_p,'number',manualPages,e=>setManualPages(e.target.value),'300'],[t.days,'number',planDays,e=>setPlanDays(e.target.value),'7']].map(([label,type,val,fn,ph],i)=>(
              <div key={i}>
                <label style={{fontSize:10,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>{label}</label>
                <input type={type} value={val} onChange={fn} placeholder={ph} style={inputStyle}/>
              </div>
            ))}
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>{t.start_date}</label>
              <div style={{position:'relative'}}>
                <input id="start-date-picker" type="date" value={planStartDate} onChange={e=>setPlanStartDate(e.target.value)} style={inputStyle}/>
                <button onClick={()=>setShowStartDateOptions(!showStartDateOptions)} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer'}}>
                  <ChevronDown size={16} color="#aaa"/>
                </button>
              </div>
              {showStartDateOptions&&(
                <div style={{background:'#f9f9f9',border:`1px solid ${GR.border}`,borderRadius:6,marginTop:4,overflow:'hidden'}}>
                  {[[t.today,'today'],[t.tomorrow,'tomorrow'],[t.next_week,'next_week']].map(([label,opt])=>(
                    <button key={opt} onClick={()=>setQuickStartDate(opt)}
                      style={{width:'100%',padding:'8px 12px',textAlign:'left',background:'none',border:'none',borderBottom:`1px solid ${GR.borderLight}`,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>{label}</button>
                  ))}
                </div>
              )}
            </div>
            {manualPages&&planDays&&(
              <div style={{background:GR.greenLight,border:`1px solid ${GR.green}`,borderRadius:6,padding:'8px 12px',fontSize:12,color:GR.greenDark,textAlign:'center'}}>
                {Math.ceil(parseInt(manualPages)/parseInt(planDays))} {lang==='es'?'páginas por día':'pages per day'}
              </div>
            )}
            <BtnGR onClick={saveReadingPlan} disabled={!manualPages||!planDays} fullWidth>{t.start}</BtnGR>
          </div>
        </Modal>
      )}

      {/* CONFIRMAR ELIMINAR LIBRO */}
      {bookToDelete&&(
        <div style={{position:'fixed',inset:0,zIndex:400,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,maxWidth:320,width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
            <Trash2 size={36} color={GR.rust} style={{margin:'0 auto 12px'}}/>
            <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:GR.brown,margin:'0 0 6px'}}>{t.delete_q}</h3>
            <p style={{fontSize:12,color:'#aaa',margin:'0 0 20px'}}>{t.delete_desc}</p>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setBookToDelete(null)} style={{flex:1,padding:'9px 0',background:'#f0ede6',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit'}}>{t.cancel}</button>
              <button onClick={async()=>{await syncReadBooksAfterDelete(bookToDelete);await deleteDoc(doc(db,'users',user.uid,'myBooks',bookToDelete));setBookToDelete(null);}}
                style={{flex:1,padding:'9px 0',background:GR.rust,border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700,color:'#fff',fontFamily:'inherit'}}>{t.delete_btn}</button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLICAR EN MURO */}
      {showPostModal&&(
        <Modal onClose={()=>{setShowPostModal(false);setPostContent('');setSelectedBookForPost(null);setBooksForPost([]);setPostSearch('');}} title={t.post_quote}>
          <div style={{marginBottom:10}}>
            <button onClick={()=>setShowBookSelector(!showBookSelector)}
              style={{width:'100%',padding:'8px 12px',background:GR.parchment,border:`1px solid ${GR.borderLight}`,borderRadius:6,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:12,fontFamily:'inherit',color:GR.brown}}>
              {selectedBookForPost?`📖 ${selectedBookForPost.volumeInfo?.title||selectedBookForPost.title}`:t.select_book}
              {showBookSelector?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
            </button>
            {showBookSelector&&(
              <div style={{border:`1px solid ${GR.border}`,borderRadius:'0 0 6px 6px',padding:10,background:'#fff'}}>
                <div style={{display:'flex',gap:6,marginBottom:8}}>
                  <input type="text" value={postSearch} onChange={e=>setPostSearch(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&searchBooksForPost()}
                    placeholder={t.search} style={{...inputStyle,borderRadius:4}}/>
                  <BtnGR small onClick={searchBooksForPost}><Search size={13}/></BtnGR>
                </div>
                <div style={{maxHeight:150,overflowY:'auto'}}>
                  {booksForPost.map((b,i)=>(
                    <button key={i} onClick={()=>{setSelectedBookForPost(b);setShowBookSelector(false);}}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'5px 6px',background:'none',border:'none',borderRadius:4,cursor:'pointer',fontFamily:'inherit'}}>
                      <img src={b.volumeInfo?.imageLinks?.thumbnail?.replace('http:','https:')||b.thumbnail||'https://via.placeholder.com/30x45'} alt="" style={{width:24,height:36,objectFit:'contain',background:'#f8f8f8'}}/>
                      <div style={{textAlign:'left'}}>
                        <div style={{fontSize:11,fontWeight:600,color:GR.brown}}>{b.volumeInfo?.title||b.title}</div>
                        <div style={{fontSize:9,color:'#aaa'}}>{b.volumeInfo?.authors?.join(', ')||b.authors?.join(', ')}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <textarea value={postContent} onChange={e=>setPostContent(e.target.value)}
            placeholder={t.write_quote} maxLength={2500}
            style={{...inputStyle,minHeight:160,resize:'vertical',borderRadius:6}}/>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
            <span style={{fontSize:10,color:'#aaa'}}>{t.max_characters}</span>
            <span style={{fontSize:10,color:postContent.length>=2500?GR.rust:'#aaa'}}>{postContent.length}/2500</span>
          </div>
          <BtnGR onClick={submitWallPost} disabled={!postContent.trim()} fullWidth><Send size={15}/> {t.post_quote}</BtnGR>
        </Modal>
      )}

      {/* EDITAR POST */}
      {editingPost&&(
        <Modal onClose={()=>{setEditingPost(null);setEditPostContent('');}} title={t.edit_post}>
          <textarea value={editPostContent} onChange={e=>setEditPostContent(e.target.value)}
            maxLength={2500} style={{...inputStyle,minHeight:160,resize:'vertical',borderRadius:6,marginBottom:12}}/>
          <BtnGR onClick={()=>editWallPost(editingPost,editPostContent)} disabled={!editPostContent.trim()} fullWidth><Edit size={15}/> {t.save}</BtnGR>
        </Modal>
      )}

      {/* CONFIRMAR ELIMINAR POST */}
      {postToDelete&&(
        <div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:12,padding:24,maxWidth:300,width:'100%',textAlign:'center'}}>
            <Trash2 size={32} color={GR.rust} style={{margin:'0 auto 10px'}}/>
            <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:GR.brown,margin:'0 0 6px'}}>{t.confirm_delete_post}</h3>
            <p style={{fontSize:11,color:'#aaa',margin:'0 0 16px'}}>{t.confirm_delete_post_desc}</p>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setPostToDelete(null)} style={{flex:1,padding:'8px 0',background:'#f0ede6',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit'}}>{t.cancel}</button>
              <button onClick={()=>deleteWallPost(postToDelete)} style={{flex:1,padding:'8px 0',background:GR.rust,border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700,color:'#fff',fontFamily:'inherit'}}>{t.delete_btn}</button>
            </div>
          </div>
        </div>
      )}

      {/* AMIGOS */}
      {showFriendsSection&&(
        <Modal onClose={()=>setShowFriendsSection(false)} title={t.friends} titleBg={GR.brownMid} wide>
          <div style={{marginBottom:12}}>
            <div style={{position:'relative',marginBottom:8}}>
              <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#aaa'}}/>
              <input type="text" value={friendsSearch} onChange={e=>setFriendsSearch(e.target.value)}
                placeholder={t.search_people} style={{...inputStyle,paddingLeft:32}}/>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[['all',t.all_users],['google',t.google_users],['anonymous',t.anonymous_users],['following',t.following],['followers',t.followers_list]].map(([f,l])=>(
                <button key={f} onClick={()=>setFriendsFilter(f)} style={friendsFilter===f?pillActive:pillInactive}>{l}</button>
              ))}
            </div>
          </div>
          {/* Solicitudes pendientes */}
          {friendRequests.length>0&&(
            <div style={{marginBottom:14}}>
              <p style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:.5,margin:'0 0 8px'}}>{t.pending_requests}</p>
              {friendRequests.map(req=>(
                <div key={req.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#fffce8',border:`1px solid ${GR.gold}`,borderRadius:8,marginBottom:6}}>
                  <img src={req.senderPic||'https://via.placeholder.com/36'} alt="" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover'}}/>
                  <div style={{flex:1,fontSize:12}}><strong style={{color:GR.brown}}>{req.senderName}</strong></div>
                  <BtnGR small onClick={()=>acceptFriendRequest(req.id,req.senderId,req.senderName)} color={GR.green}>{t.accept}</BtnGR>
                  <BtnGR small onClick={()=>rejectFriendRequest(req.id)} color={GR.rust}>{t.reject}</BtnGR>
                </div>
              ))}
            </div>
          )}
          <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:400,overflowY:'auto'}}>
            {filteredUsers.map(p=>{
              const isFollowing=userProfile.following?.includes(p.userId);
              const hasSent=sentFriendRequests.some(r=>r.receiverId===p.userId);
              const isMutual=p.following?.includes(user?.uid)&&isFollowing;
              return(
                <div key={p.userId} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#faf9f6',border:`1px solid ${GR.border}`,borderRadius:8}}>
                  <img src={p.profilePic||'https://via.placeholder.com/36'} alt=""
                    style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',cursor:'pointer'}}
                    onClick={()=>openUserProfileModal(p)}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p onClick={()=>openUserProfileModal(p)} style={{fontSize:12,fontWeight:700,color:GR.brown,margin:0,cursor:'pointer'}}>{p.name}</p>
                    <p style={{fontSize:10,color:'#aaa',margin:0}}>{p.readCount||0} {t.read.toLowerCase()} · {getLevelTitle(p.readCount,lang)}</p>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    {isMutual?<BtnGR small onClick={()=>removeFriend(p.userId)} color={GR.rust}>{t.remove_friend}</BtnGR>:
                    isFollowing?<BtnGR small onClick={()=>toggleFollow(p.userId)} color={GR.brownMid}>{t.unfollow}</BtnGR>:
                    hasSent?<span style={{fontSize:11,color:'#aaa'}}>{t.request_sent}</span>:
                    <BtnGR small onClick={()=>sendFriendRequest(p.userId,p.name)}>{t.send_request}</BtnGR>}
                    <button onClick={()=>{setSelectedUserForMessage(p);setShowNewMessageModal(true);}}
                      style={{padding:'4px 8px',background:'#e8f0fe',border:'none',borderRadius:4,cursor:'pointer',display:'flex',alignItems:'center'}}>
                      <MessageSquare size={13} color="#1a73e8"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* ESCRITORES */}
      {showWriters&&(
        <Modal onClose={()=>{setShowWriters(false);setSelectedAuthor(null);setAuthorDetails(null);}} title={t.writers} titleBg={GR.brownMid} wide>
          {!selectedAuthor?(
            <div>
              <div style={{display:'flex',gap:8,marginBottom:14}}>
                <input type="text" value={writerSearch} onChange={e=>setWriterSearch(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&searchAuthors()}
                  placeholder={t.search_writers} style={inputStyle}/>
                <BtnGR onClick={searchAuthors} disabled={authorSearchLoading||!writerSearch.trim()}>
                  {authorSearchLoading?<Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/>:<Search size={15}/>}
                </BtnGR>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {writerResults.map((w,i)=>(
                  <button key={i} onClick={()=>viewAuthorDetails(w.name)}
                    style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#faf9f6',border:`1px solid ${GR.border}`,borderRadius:8,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
                    {w.thumbnail?<img src={w.thumbnail} alt="" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}}/>:
                      <div style={{width:40,height:40,borderRadius:'50%',background:GR.creamDark,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <PenTool size={18} color={GR.brownMid}/>
                      </div>}
                    <div style={{flex:1}}>
                      <p style={{fontSize:13,fontWeight:700,color:GR.brown,margin:0}}>{w.name}</p>
                      <p style={{fontSize:11,color:'#aaa',margin:0}}>{w.booksCount} libros</p>
                    </div>
                    <ChevronRight size={16} color="#ccc"/>
                  </button>
                ))}
                {writerResults.length===0&&writerSearch&&!authorSearchLoading&&(
                  <p style={{textAlign:'center',color:'#aaa',fontSize:12}}>{lang==='es'?'No se encontraron escritores':'No writers found'}</p>
                )}
              </div>
            </div>
          ):(
            <div>
              <button onClick={()=>{setSelectedAuthor(null);setAuthorBooks([]);setAuthorDetails(null);}}
                style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',background:'none',border:`1px solid ${GR.border}`,borderRadius:20,cursor:'pointer',marginBottom:14,fontSize:12,fontFamily:'inherit',color:GR.brown}}>
                <ChevronLeft size={14}/> {lang==='es'?'Volver':'Back'}
              </button>
              <div style={{display:'flex',gap:14,marginBottom:14}}>
                {authorDetails?.thumbnail?<img src={authorDetails.thumbnail} alt="" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',border:`2px solid ${GR.border}`}}/>:
                  <div style={{width:80,height:80,borderRadius:'50%',background:GR.creamDark,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <PenTool size={32} color={GR.brownMid}/>
                  </div>}
                <div style={{flex:1}}>
                  <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:GR.brown,margin:'0 0 4px'}}>{selectedAuthor}</h2>
                  {authorDetails?.description&&<p style={{fontSize:12,color:'#888',margin:'0 0 8px'}}>{authorDetails.description}</p>}
                  <BtnGR small onClick={()=>toggleFavoriteWriter(selectedAuthor)} color={favoriteWritersList.includes(selectedAuthor)?GR.gold:GR.brownMid} darkColor={GR.brown}>
                    <Star size={13} fill={favoriteWritersList.includes(selectedAuthor)?'#fff':'none'}/>
                    {favoriteWritersList.includes(selectedAuthor)?t.remove_favorite_writer:t.mark_as_favorite_writer}
                  </BtnGR>
                </div>
              </div>
              {authorDetails?.biography&&(
                <div style={{background:GR.parchment,border:`1px solid ${GR.borderLight}`,borderRadius:8,padding:14,marginBottom:14}}>
                  <h4 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:GR.brown,margin:'0 0 8px'}}>{t.biography}</h4>
                  <p style={{fontSize:12,color:'#555',lineHeight:1.7,margin:0}}>{authorDetails.biography}</p>
                </div>
              )}
              <h4 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,fontWeight:700,color:GR.brown,margin:'0 0 10px'}}>{t.books_by_author}</h4>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {authorBooks.map((book,i)=>(
                  <div key={i} onClick={()=>{setShowWriters(false);setViewingBook(book);}}
                    style={{cursor:'pointer',textAlign:'center'}}>
                    <img src={book.volumeInfo?.imageLinks?.thumbnail?.replace('http:','https:')||'https://via.placeholder.com/100x150?text=NO+COVER'} alt=""
                      style={{width:'100%',aspectRatio:'2/3',objectFit:'contain',borderRadius:4,background:'#f8f8f8',border:`1px solid ${GR.border}`}}/>
                    <p style={{fontSize:10,fontWeight:600,color:GR.brown,margin:'4px 0 0',lineHeight:1.3}}>{book.volumeInfo?.title}</p>
                  </div>
                ))}
              </div>
              {authorBooks.length>=10&&(
                <button onClick={()=>searchMoreBooksByAuthor(selectedAuthor)} disabled={moreBooksLoading}
                  style={{width:'100%',marginTop:12,padding:'8px 0',background:GR.creamDark,border:`1px solid ${GR.border}`,borderRadius:6,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
                  {moreBooksLoading?'...':`${t.load_more}`}
                </button>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* MENSAJES */}
      {showMessages&&(
        <Modal onClose={()=>{setShowMessages(false);setSelectedConversation(null);setActiveMessages([]);}} title={t.messages} titleBg={GR.brownMid} wide>
          {!selectedConversation?(
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                <span style={{fontSize:12,color:'#888'}}>{conversations.length} {lang==='es'?'conversaciones':'conversations'}</span>
                <BtnGR small onClick={()=>setShowNewMessageModal(true)}><MessageSquarePlus size={13}/> {t.new_message}</BtnGR>
              </div>
              {conversations.length===0?<p style={{textAlign:'center',color:'#aaa',fontSize:12,padding:24}}>{t.no_messages}</p>:
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {conversations.map(conv=>{
                    const otherIdx=conv.participants.findIndex(id=>id!==user?.uid);
                    const otherName=conv.participantNames?.[otherIdx];
                    const otherId=conv.participants[otherIdx];
                    const other=publicData.find(p=>p.userId===otherId);
                    const unread=conv.unreadCount?.[user?.uid]||0;
                    return(
                      <button key={conv.id} onClick={()=>{setSelectedConversation(conv);markMessagesAsRead(conv.id);loadMessages(conv.id);}}
                        style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#faf9f6',border:`1px solid ${GR.border}`,borderRadius:8,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
                        <img src={other?.profilePic||'https://via.placeholder.com/36'} alt="" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover'}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:12,fontWeight:700,color:GR.brown,margin:0}}>{otherName}</p>
                          <p style={{fontSize:11,color:'#aaa',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{conv.lastMessage}</p>
                        </div>
                        {unread>0&&<span style={{background:GR.rust,color:'#fff',fontSize:10,fontWeight:700,minWidth:18,height:18,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px'}}>{unread}</span>}
                      </button>
                    );
                  })}
                </div>
              }
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',height:'60vh'}}>
              <button onClick={()=>{setSelectedConversation(null);setActiveMessages([]);}}
                style={{display:'flex',alignItems:'center',gap:6,padding:'0 0 12px',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',color:GR.brown,fontSize:12}}>
                <ChevronLeft size={14}/> {lang==='es'?'Volver':'Back'}
              </button>
              <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
                {activeMessages.map(msg=>(
                  <div key={msg.id} style={{display:'flex',justifyContent:msg.senderId===user?.uid?'flex-end':'flex-start'}}>
                    <div style={{maxWidth:'80%',padding:'8px 12px',borderRadius:msg.senderId===user?.uid?'16px 16px 4px 16px':'16px 16px 16px 4px',background:msg.senderId===user?.uid?GR.green:'#f0ede6',color:msg.senderId===user?.uid?'#fff':GR.brown,fontSize:13}}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {activeMessages.length===0&&<p style={{textAlign:'center',color:'#aaa',fontSize:12,padding:'40px 0'}}>{t.no_messages}</p>}
              </div>
              <div style={{display:'flex',gap:8}}>
                <input type="text" value={newMessage} onChange={e=>setNewMessage(e.target.value)}
                  onKeyDown={e=>{
                    if(e.key==='Enter'&&newMessage.trim()){
                      const othIdx=selectedConversation.participants.findIndex(id=>id!==user?.uid);
                      sendMessage(selectedConversation.participants[othIdx],selectedConversation.participantNames?.[othIdx],newMessage);
                    }
                  }}
                  placeholder={t.type_message} style={inputStyle}/>
                <BtnGR onClick={()=>{
                  const othIdx=selectedConversation.participants.findIndex(id=>id!==user?.uid);
                  sendMessage(selectedConversation.participants[othIdx],selectedConversation.participantNames?.[othIdx],newMessage);
                }} disabled={!newMessage.trim()}><Send size={14}/></BtnGR>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* NUEVO MENSAJE */}
      {showNewMessageModal&&(
        <Modal onClose={()=>{setShowNewMessageModal(false);setSelectedUserForMessage(null);}} title={t.new_message}>
          <div style={{position:'relative',marginBottom:12}}>
            <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#aaa'}}/>
            <input type="text" value={messageSearch} onChange={e=>setMessageSearch(e.target.value)}
              placeholder={t.search_people} style={{...inputStyle,paddingLeft:32}}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:300,overflowY:'auto'}}>
            {friendsList.filter(f=>f.name?.toLowerCase().includes(messageSearch.toLowerCase())).map(f=>(
              <button key={f.userId} onClick={()=>{
                setSelectedUserForMessage(f);setShowNewMessageModal(false);setShowMessages(true);
                const ex=conversations.find(c=>c.participants.includes(user?.uid)&&c.participants.includes(f.userId));
                if(ex){setSelectedConversation(ex);markMessagesAsRead(ex.id);loadMessages(ex.id);}
              }} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#faf9f6',border:`1px solid ${GR.border}`,borderRadius:8,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
                <img src={f.profilePic||'https://via.placeholder.com/32'} alt="" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}}/>
                <span style={{fontSize:12,fontWeight:700,color:GR.brown}}>{f.name}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* PERFIL EXTERNO */}
      {selectedUserProfile&&(
        <Modal onClose={()=>setSelectedUserProfile(null)} title={selectedUserProfile.name} titleBg={GR.brownMid} wide>
          <div style={{textAlign:'center',marginBottom:16}}>
            <img src={selectedUserProfile.profilePic||'https://via.placeholder.com/80'} alt=""
              style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',border:'3px solid #fff',boxShadow:GR.shadowMd,marginBottom:8}}/>
            <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:GR.brown,margin:'0 0 2px'}}>{selectedUserProfile.name}</h3>
            <p style={{fontSize:12,color:'#888',margin:'0 0 12px'}}>{getLevelTitle(selectedUserProfile.readCount,lang)} <VerificationCheck count={selectedUserProfile.readCount}/></p>
            <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:14}}>
              <BtnGR small onClick={()=>toggleFollow(selectedUserProfile.userId)}
                color={userProfile.following?.includes(selectedUserProfile.userId)?GR.brownMid:GR.green}>
                {userProfile.following?.includes(selectedUserProfile.userId)?t.unfollow:t.add_friend}
              </BtnGR>
              <BtnGR small onClick={()=>{setSelectedUserForMessage(selectedUserProfile);setSelectedUserProfile(null);setShowNewMessageModal(true);}} color="#1a73e8">
                <MessageSquare size={13}/> {t.send_message}
              </BtnGR>
            </div>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
            {[['all',t.all],['read',t.read],['in_plan',t.in_plan],['in_library',t.in_library],['favorite',t.favorites]].map(([f,l])=>(
              <button key={f} onClick={()=>setSelectedUserFilter(f)} style={selectedUserFilter===f?pillActive:pillInactive}>{l}</button>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,maxHeight:400,overflowY:'auto'}}>
            {filteredExternalBooks.map(book=>(
              <BookCard key={book.bookId} book={book} isExternal
                onBorrow={()=>{setBookToBorrow({...book,ownerId:selectedUserProfile.userId,ownerName:selectedUserProfile.name});setShowBorrowModal(true);}}/>
            ))}
            {filteredExternalBooks.length===0&&<p style={{gridColumn:'1/-1',textAlign:'center',color:'#aaa',fontSize:12,padding:24}}>{lang==='es'?'No hay libros':'No books'}</p>}
          </div>
        </Modal>
      )}

      {/* PERFIL (modal inline) */}
      {showUserProfileModal&&userProfileModalData&&(
        <Modal onClose={()=>setShowUserProfileModal(false)} title={userProfileModalData.name} titleBg={GR.brownMid} wide>
          <div style={{textAlign:'center',marginBottom:16}}>
            <img src={userProfileModalData.profilePic||'https://via.placeholder.com/80'} alt=""
              style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',border:'3px solid #fff',boxShadow:GR.shadowMd,marginBottom:8}}/>
            <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:GR.brown,margin:'0 0 2px'}}>{userProfileModalData.name}</h3>
            <p style={{fontSize:12,color:'#888',margin:'0 0 12px'}}>{getLevelTitle(userProfileModalData.readCount,lang)}</p>
            <div style={{display:'flex',justifyContent:'center',gap:24,marginBottom:14}}>
              {[[userProfileModalData.readCount||0,t.read_count],[userProfileModalData.planCount||0,t.plan_count],[userProfileModalData.likes?.length||0,t.liked_books]].map(([n,l],i)=>(
                <div key={i} style={{textAlign:'center'}}>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:GR.brown}}>{n}</div>
                  <div style={{fontSize:9,color:'#aaa',textTransform:'uppercase'}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'center',gap:6}}>
              <BtnGR small onClick={()=>{toggleFollow(userProfileModalData.userId);setShowUserProfileModal(false);}}
                color={userProfile.following?.includes(userProfileModalData.userId)?GR.brownMid:GR.green}>
                {userProfile.following?.includes(userProfileModalData.userId)?t.unfollow:t.add_friend}
              </BtnGR>
              <BtnGR small onClick={()=>{setSelectedUserForMessage(userProfileModalData);setShowUserProfileModal(false);setShowNewMessageModal(true);}} color="#1a73e8">
                <MessageSquare size={13}/> {t.send_message}
              </BtnGR>
            </div>
          </div>
        </Modal>
      )}

      {/* PRÉSTAMO */}
      {showBorrowModal&&bookToBorrow&&(
        <Modal onClose={()=>{setShowBorrowModal(false);setBookToBorrow(null);}} title={t.borrow_book}>
          <div style={{textAlign:'center',marginBottom:20}}>
            <img src={bookToBorrow.thumbnail||'https://via.placeholder.com/100x150'} alt=""
              style={{width:80,height:120,objectFit:'contain',borderRadius:6,background:'#f8f8f8',margin:'0 auto 10px'}}/>
            <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:700,color:GR.brown,margin:'0 0 4px'}}>{bookToBorrow.title}</h3>
            <p style={{fontSize:12,color:'#888',margin:'0 0 16px'}}>{bookToBorrow.authors?.join(', ')}</p>
            <p style={{fontSize:13,color:'#555',marginBottom:20}}>{lang==='es'?`¿Pedir prestado a ${bookToBorrow.ownerName}?`:`Borrow from ${bookToBorrow.ownerName}?`}</p>
            <BtnGR onClick={()=>sendBorrowRequest(bookToBorrow,bookToBorrow.ownerId,bookToBorrow.ownerName)} fullWidth>{t.borrow_book}</BtnGR>
          </div>
        </Modal>
      )}

      {/* INSIGNIA */}
      {showBadgeModal&&selectedBadge&&(
        <Modal onClose={()=>setShowBadgeModal(false)} title={selectedBadge.name} titleBg={GR.gold}>
          <div style={{textAlign:'center',padding:'8px 0'}}>
            <div style={{width:80,height:80,borderRadius:'50%',background:userProfile.badges?.includes(parseInt(selectedBadge.id))?GR.goldLight:'#f0ede6',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
              <BadgeIcon badgeId={parseInt(selectedBadge.id)} unlocked={userProfile.badges?.includes(parseInt(selectedBadge.id))} size={40}/>
            </div>
            <p style={{fontSize:13,color:'#555',marginBottom:16}}>{selectedBadge.desc}</p>
            <div style={{background:GR.parchment,border:`1px solid ${GR.borderLight}`,borderRadius:8,padding:12,marginBottom:14,textAlign:'left'}}>
              <p style={{fontSize:10,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:.5,margin:'0 0 6px'}}>{t.badge_progress}</p>
              <ProgressBar pct={badgeProgress[selectedBadge.id]||0} color={GR.gold}/>
              <p style={{fontSize:13,fontWeight:700,color:GR.gold,margin:'4px 0 0',textAlign:'right'}}>{Math.round(badgeProgress[selectedBadge.id]||0)}%</p>
            </div>
            {userProfile.badges?.includes(parseInt(selectedBadge.id))?(
              <div style={{background:'#e6f4e6',border:`1px solid ${GR.green}`,borderRadius:8,padding:'10px 12px'}}>
                <p style={{fontSize:13,fontWeight:700,color:GR.greenDark,margin:0}}>✓ {t.badge_unlocked}</p>
              </div>
            ):(
              <div style={{background:'#f0ede6',border:`1px solid ${GR.border}`,borderRadius:8,padding:'10px 12px'}}>
                <p style={{fontSize:13,color:'#aaa',margin:0}}>🔒 {t.badge_locked}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ESCRITORES FAVORITOS */}
      {showFavoriteWriters&&(
        <Modal onClose={()=>setShowFavoriteWriters(false)} title={t.writers_section} titleBg={GR.brownMid}>
          <div style={{position:'relative',marginBottom:12}}>
            <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#aaa'}}/>
            <input type="text" value={writerSearch} onChange={e=>setWriterSearch(e.target.value)}
              placeholder={t.search_writers} style={{...inputStyle,paddingLeft:32}}/>
          </div>
          {filteredFavoriteWriters.length===0?<p style={{textAlign:'center',color:'#aaa',fontSize:12,padding:24}}>{lang==='es'?'Sin escritores favoritos':'No favorite writers'}</p>:
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {filteredFavoriteWriters.map((w,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#faf9f6',border:`1px solid ${GR.border}`,borderRadius:8}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:GR.creamDark,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <PenTool size={16} color={GR.brownMid}/>
                  </div>
                  <button onClick={()=>{setShowFavoriteWriters(false);viewAuthorDetails(w);setShowWriters(true);}}
                    style={{flex:1,textAlign:'left',background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:700,color:GR.brown,fontFamily:'inherit'}}>{w}</button>
                  <button onClick={()=>toggleFavoriteWriter(w)}
                    style={{padding:6,background:'#fde8e8',border:'none',borderRadius:'50%',cursor:'pointer',display:'flex'}}>
                    <Trash2 size={13} color={GR.rust}/>
                  </button>
                </div>
              ))}
            </div>
          }
        </Modal>
      )}

      {/* FRASES GUARDADAS */}
      {showSavedPosts&&(
        <Modal onClose={()=>setShowSavedPosts(false)} title={t.saved_section} titleBg={GR.brownMid} wide>
          {filteredSavedPosts.length===0?<p style={{textAlign:'center',color:'#aaa',fontSize:12,padding:24}}>{lang==='es'?'Sin frases guardadas':'No saved quotes'}</p>:
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {filteredSavedPosts.map(post=>(
                <div key={post.id} style={{background:'#faf9f6',border:`1px solid ${GR.border}`,borderRadius:8,padding:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <img src={post.userPic||'https://via.placeholder.com/28'} alt="" style={{width:28,height:28,borderRadius:'50%',objectFit:'cover'}}/>
                    <span style={{fontSize:12,fontWeight:700,color:GR.brown}}>{post.userName}</span>
                  </div>
                  <p style={{fontSize:13,fontStyle:'italic',color:'#555',lineHeight:1.7,margin:'0 0 8px'}}>"{post.content}"</p>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    {post.bookTitle&&<span style={{fontSize:10,color:'#aaa'}}>— {post.bookTitle}</span>}
                    <button onClick={()=>toggleSavedPost(post.id)}
                      style={{padding:4,background:'#fde8e8',border:'none',borderRadius:4,cursor:'pointer',display:'flex'}}>
                      <Trash2 size={12} color={GR.rust}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          }
        </Modal>
      )}

      {/* LIBROS LEÍDOS */}
      {viewingReadBooks&&(
        <Modal onClose={()=>setViewingReadBooks(false)} title={t.view_read_books} titleBg={GR.brownMid} wide>
          {readBooksList.length===0?<p style={{textAlign:'center',color:'#aaa',fontSize:12,padding:24}}>{lang==='es'?'Sin libros leídos':'No read books'}</p>:
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {readBooksList.map((book,i)=>(
                <div key={i} onClick={()=>openBookDetailModal(book)} style={{cursor:'pointer',textAlign:'center'}}>
                  <img src={book.thumbnail||'https://via.placeholder.com/100x150'} alt=""
                    style={{width:'100%',aspectRatio:'2/3',objectFit:'contain',borderRadius:6,background:'#f8f8f8',border:`1px solid ${GR.border}`}}/>
                  <p style={{fontSize:10,fontWeight:600,color:GR.brown,margin:'4px 0 0',lineHeight:1.3}}>{book.title}</p>
                </div>
              ))}
            </div>
          }
        </Modal>
      )}

      {/* SEGUIDORES / SIGUIENDO / AMIGOS MUTUOS */}
      {[
        [showFollowingModal,()=>setShowFollowingModal(false),followingList,lang==='es'?'Siguiendo':'Following'],
        [showFollowersModal,()=>setShowFollowersModal(false),followersList,lang==='es'?'Seguidores':'Followers'],
        [showMutualFriendsModal,()=>setShowMutualFriendsModal(false),mutualFriendsList,lang==='es'?'Amigos mutuos':'Mutual friends'],
      ].map(([show,close,list,title],i)=>show&&(
        <Modal key={i} onClose={close} title={title} titleBg={GR.brownMid}>
          {list.length===0?<p style={{textAlign:'center',color:'#aaa',fontSize:12,padding:24}}>{lang==='es'?'Sin usuarios':'No users'}</p>:
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {list.map(p=>(
                <div key={p.userId} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#faf9f6',border:`1px solid ${GR.border}`,borderRadius:8}}>
                  <img src={p.profilePic||'https://via.placeholder.com/36'} alt=""
                    style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',cursor:'pointer'}}
                    onClick={()=>{close();openUserProfileModal(p);}}/>
                  <div style={{flex:1}}>
                    <p style={{fontSize:12,fontWeight:700,color:GR.brown,margin:0,cursor:'pointer'}} onClick={()=>{close();openUserProfileModal(p);}}>{p.name}</p>
                    <p style={{fontSize:10,color:'#aaa',margin:0}}>{p.readCount||0} {t.read.toLowerCase()}</p>
                  </div>
                  <button onClick={()=>{close();setSelectedUserForMessage(p);setShowNewMessageModal(true);}}
                    style={{padding:6,background:'#e8f0fe',border:'none',borderRadius:4,cursor:'pointer',display:'flex'}}>
                    <MessageSquare size={13} color="#1a73e8"/>
                  </button>
                </div>
              ))}
            </div>
          }
        </Modal>
      ))}

      {/* ESCANER */}
      {showScanner&&(
        <div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,.95)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
          <button onClick={()=>setShowScanner(false)} style={{position:'absolute',top:16,right:16,width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <X size={18}/>
          </button>
          <div id="reader" style={{width:280,height:280,borderRadius:12,overflow:'hidden',background:'#000'}}/>
          <p style={{color:'rgba(255,255,255,.6)',fontSize:12,marginTop:16}}>{t.scan_msg}</p>
          <button onClick={()=>{
            if(!window.Html5Qrcode){alert('Scanner no disponible');setShowScanner(false);return;}
            const scanner=new window.Html5Qrcode("reader");
            scanner.start({facingMode:"environment"},{fps:10,qrbox:220},(res)=>{
              scanner.stop().then(()=>{setShowScanner(false);setSearchQuery(res);setSearchType('isbn');if(user)updateDoc(doc(db,'profiles',user.uid),{scanCount:increment(1)});performSearch(res);}).catch(()=>setShowScanner(false));
            },()=>{}).catch(()=>setShowScanner(false));
          }} style={{marginTop:8,padding:'10px 24px',background:GR.green,border:'none',borderRadius:20,cursor:'pointer',color:'#fff',fontSize:13,fontWeight:700,fontFamily:'inherit'}}>
            {lang==='es'?'Iniciar escáner':'Start scanner'}
          </button>
        </div>
      )}

      {/* TUTORIAL */}
      {showTutorial&&(
        <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.8)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'#fff',borderRadius:16,maxWidth:360,width:'100%',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
            <div style={{background:`linear-gradient(135deg, ${GR.brown} 0%, #3d2714 100%)`,padding:'24px 24px 16px',textAlign:'center'}}>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:900,color:'#fff',marginBottom:4}}>sand<span style={{color:GR.gold}}>book</span></div>
              <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:8}}>
                {[0,1,2,3,4].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:i===tutorialStep?GR.gold:'rgba(255,255,255,.3)'}}/>)}
              </div>
            </div>
            <div style={{padding:24,textAlign:'center'}}>
              {[<BookOpen size={48} color={GR.green}/>,<Calendar size={48} color="#1a73e8"/>,<Users size={48} color="#8e44ad"/>,<Trophy size={48} color={GR.gold}/>,<Sparkles size={48} color={GR.rust}/>][tutorialStep]}
              <p style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,fontWeight:700,color:GR.brown,margin:'16px 0 6px'}}>
                {[t.tutorial_welcome,t.library,t.plan,t.social,t.profile][tutorialStep]}
              </p>
              <p style={{fontSize:12,color:'#888',margin:'0 0 20px',lineHeight:1.6}}>
                {[t.tutorial_step1,t.tutorial_step2,t.tutorial_step3,t.tutorial_step4,lang==='es'?'¡Gana insignias y sube de nivel!':'Earn badges and level up!'][tutorialStep]}
              </p>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{setShowTutorial(false);localStorage.setItem('sandbook_tutorial_shown','true');}}
                  style={{flex:1,padding:'9px 0',background:'#f0ede6',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit'}}>{t.tutorial_skip}</button>
                <BtnGR fullWidth onClick={()=>{if(tutorialStep<4)setTutorialStep(p=>p+1);else{setShowTutorial(false);localStorage.setItem('sandbook_tutorial_shown','true');};}}>
                  {tutorialStep===4?(lang==='es'?'¡Comenzar!':'Get started!'):t.tutorial_next}
                </BtnGR>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#f0ede6}
        ::-webkit-scrollbar-thumb{background:#c4b49a;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:${GR.brown}}
        ::selection{background:${GR.greenLight};color:${GR.greenDark}}
      `}</style>
    </div>
  );
}
