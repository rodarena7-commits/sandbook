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
  // 1. Portada de la comunidad
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

// --- COMPONENTE PARA MOSTRAR ESCRITOR FAVORITO CON IMAGEN ---
const FavoriteWriterCard = ({ writerName, onClick, onRemove, t, theme }) => {
  const [writerInfo, setWriterInfo] = useState(null);
  
  useEffect(() => {
    const fetchWriterInfo = async () => {
      try {
        // Buscar información del autor en Open Library
        const searchUrl = `https://openlibrary.org/search.json?author=${encodeURIComponent(writerName)}&limit=1`;
        const res = await fetch(searchUrl);
        const data = await res.json();
        
        if (data.docs && data.docs.length > 0) {
          const doc = data.docs[0];
          setWriterInfo({
            name: writerName,
            photo: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
            works: doc.author_name ? doc.author_name.length : 0
          });
        } else {
          setWriterInfo({ name: writerName, photo: null, works: 0 });
        }
      } catch (error) {
        console.error("Error fetching writer info:", error);
        setWriterInfo({ name: writerName, photo: null, works: 0 });
      }
    };
    
    fetchWriterInfo();
  }, [writerName]);
  
  return (
    <div 
      className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-4 rounded-2xl border ${theme === 'dark' ? 'border-gray-700' : theme === 'sunset' ? 'border-amber-200' : 'border-slate-200'} flex items-center gap-3 cursor-pointer hover:scale-105 transition-all`}
      onClick={onClick}
    >
      {writerInfo?.photo ? (
        <img 
          src={writerInfo.photo} 
          className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md"
          alt={writerName}
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-300 border-2 border-white dark:border-gray-700 shadow-md">
          {writerName.charAt(0)}
        </div>
      )}
      <div className="flex-1">
        <h4 className="font-bold text-sm">{writerName}</h4>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          {t.writers}
        </p>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
        title={t.remove_favorite_writer}
      >
        <X size={14} />
      </button>
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
  const [isRelaxMode, setIsRelaxMode] = useState(false);
  const [relaxCurrentDay, setRelaxCurrentDay] = useState(1);
  
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
  const [postImage, setPostImage] = useState(null);
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
  const [showPostLikes, setShowPostLikes] = useState(null);
  const [showPostDislikes, setShowPostDislikes] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

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

  const victoryAudio = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"));
  const videoRef = useRef(null);
  const notificationsModalRef = useRef(null);
  const postImageInputRef = useRef(null);

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

  // --- NUEVA FUNCIÓN: Mostrar quién dio like/dislike ---
  const showPostReactions = (postId, type) => {
    if (type === 'likes') {
      setShowPostLikes(postId);
    } else {
      setShowPostDislikes(postId);
    }
  };

  // --- NUEVA FUNCIÓN: Editar publicación ---
  const editWallPost = async (postId, newContent, newImage, isPublic) => {
    if (!user) return;
    try {
      const updateData = {
        content: newContent,
        isPublic: isPublic !== undefined ? isPublic : true,
        editedAt: serverTimestamp()
      };
      
      if (newImage !== undefined) {
        updateData.image = newImage;
      }
      
      await updateDoc(doc(db, 'wallPosts', postId), updateData);
      setEditingPost(null);
      alert(lang === 'es' ? 'Publicación actualizada' : 'Post updated');
    } catch (error) {
      console.error("Error editando publicación:", error);
      alert(lang === 'es' ? 'Error al actualizar' : 'Error updating');
    }
  };

  // --- NUEVA FUNCIÓN: Eliminar publicación ---
  const deleteWallPost = async (postId) => {
    if (!user) return;
    if (!window.confirm(lang === 'es' ? '¿Eliminar esta publicación?' : 'Delete this post?')) return;
    
    try {
      await deleteDoc(doc(db, 'wallPosts', postId));
      alert(lang === 'es' ? 'Publicación eliminada' : 'Post deleted');
    } catch (error) {
      console.error("Error eliminando publicación:", error);
      alert(lang === 'es' ? 'Error al eliminar' : 'Error deleting');
    }
  };

  // --- NUEVA FUNCIÓN: Subir imagen de publicación ---
  const handlePostImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result);
      };
      reader.readAsDataURL(file);
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
        image: postImage,
        bookId: selectedBookForPost?.id || selectedBookForPost?.bookId,
        bookTitle: selectedBookForPost?.volumeInfo?.title || selectedBookForPost?.title,
        bookAuthors: selectedBookForPost?.volumeInfo?.authors || selectedBookForPost?.authors,
        bookThumbnail: selectedBookForPost?.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || 
                     selectedBookForPost?.thumbnail || '',
        timestamp: serverTimestamp(),
        likes: 0,
        likesBy: [],
        dislikes: 0,
        dislikesBy: [],
        comments: [],
        isPublic: true
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
      setPostImage(null);
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

  // --- CORREGIDO: Calcular libros leídos exactamente como en el perfil ---
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

  // --- NUEVA FUNCIÓN: Guardar plan Relax ---
  const saveRelaxPlan = async () => {
    if (!user || !planningBook) return;
    const pages = parseInt(manualPages);
    if (isNaN(pages) || pages <= 0) return;
    
    const bookId = planningBook.id || planningBook.bookId;
    const bookExists = myBooks.find(b => b.bookId === bookId);
    if (!bookExists) {
      await handleAddBook(planningBook, 'reading', false, true);
    }
    
    await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), { 
      status: 'reading',
      totalPages: pages,
      isRelaxMode: true,
      relaxCurrentDay: relaxCurrentDay,
      relaxStartDate: new Date().toISOString(),
      checkpoints: [] // No hay checkpoints fijos en modo relax
    });
    
    setPlanningBook(null);
    setManualPages("");
    setIsRelaxMode(false);
    setRelaxCurrentDay(1);
    setActiveTab('library');
  };

  const saveReadingPlan = async () => {
    if (!user || !planningBook) return;
    
    // Si es modo relax, usar la función específica
    if (isRelaxMode) {
      await saveRelaxPlan();
      return;
    }
    
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
      planEndDate: new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
      isRelaxMode: false
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

  const dislikeWallPost = async (postId, currentDislikes, currentDislikesBy = []) => {
    if (!user) return;
    const post = wallPosts.find(p => p.id === postId);
    if (!post) return;
    const alreadyDisliked = currentDislikesBy.includes(user.uid);
    const newDislikes = alreadyDisliked ? currentDislikes - 1 : currentDislikes + 1;
    const newDislikesBy = alreadyDisliked 
      ? currentDislikesBy.filter(id => id !== user.uid)
      : [...currentDislikesBy, user.uid];
    await updateDoc(doc(db, 'wallPosts', postId), {
      dislikes: newDislikes,
      dislikesBy: newDislikesBy
    });
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
                        onClick={() => handleViewUserProfile(user)}
                      />
                      <div>
                        <p className="text-sm font-bold cursor-pointer" onClick={() => handleViewUserProfile(user)}>
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
                        onClick={() => handleViewUserProfile(user)}
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

      {/* MODAL DE PRÉSTAMO */}
      {showBorrowModal && bookToBorrow && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.borrow_book}</h2>
              <button onClick={() => {setShowBorrowModal(false); setBookToBorrow(null);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={bookToBorrow.thumbnail} 
                  className="w-20 h-28 object-contain rounded-xl bg-white" 
                />
                <div>
                  <h3 className="font-bold text-lg">{bookToBorrow.title}</h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    {bookToBorrow.authors?.[0] || 'Autor desconocido'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-gray-300">
                  {lang === 'es' 
                    ? `¿Quieres pedir prestado este libro a ${selectedUserProfile?.name}?`
                    : `Do you want to borrow this book from ${selectedUserProfile?.name}?`
                  }
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => sendBorrowRequest(bookToBorrow, selectedUserProfile.userId, selectedUserProfile.name)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    {t.borrow_book}
                  </button>
                  <button 
                    onClick={() => {setShowBorrowModal(false); setBookToBorrow(null);}}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALES DE SEGUIDORES/SIGUIENDO/AMIGOS MUTUOS */}
      {showFollowingModal && renderFollowModal(t.following_list, followingList, 'following')}
      {showFollowersModal && renderFollowModal(t.followers_list_full, followersList, 'followers')}
      {showMutualFriendsModal && renderFollowModal(t.mutual_friends, mutualFriendsList, 'mutual')}

      {/* MODAL: QUIÉN DIO LIKE/DISLIKE */}
      {(showPostLikes || showPostDislikes) && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[80vh]`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">
                {showPostLikes ? t.who_liked : t.who_disliked}
              </h2>
              <button onClick={() => {setShowPostLikes(null); setShowPostDislikes(null);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const post = wallPosts.find(p => p.id === (showPostLikes || showPostDislikes));
                if (!post) return null;
                const userIds = showPostLikes ? (post.likesBy || []) : (post.dislikesBy || []);
                const users = publicData.filter(p => userIds.includes(p.userId));
                
                if (users.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-slate-500 dark:text-gray-400">
                        {lang === 'es' ? 'Nadie aún' : 'No one yet'}
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {users.map(u => (
                      <div key={u.userId} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800 rounded-2xl">
                        <img 
                          src={u.profilePic || 'https://via.placeholder.com/40'} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-sm">{u.name}</p>
                          <p className="text-xs text-slate-500">{getLevelTitle(u.readCount, lang)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PUBLICACIÓN */}
      {editingPost && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[90vh]`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.edit_post}</h2>
              <button onClick={() => setEditingPost(null)} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <textarea 
                value={editingPost.content}
                onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                className={`w-full rounded-2xl p-4 text-sm outline-none min-h-[150px] ${theme === 'dark' ? 'bg-gray-700 text-gray-100 border-gray-600' : theme === 'sunset' ? 'bg-amber-100 text-gray-800 border-amber-300' : 'bg-white text-slate-900 border-slate-200'} border mb-4`}
                maxLength={2500}
              />
              
              {editingPost.image && (
                <div className="relative mb-4">
                  <img src={editingPost.image} className="w-full h-40 object-cover rounded-2xl" />
                  <button 
                    onClick={() => setEditingPost({...editingPost, image: null})}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => postImageInputRef.current?.click()}
                  className="flex-1 py-3 bg-indigo-100 text-indigo-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  <ImageIcon size={16} />
                  {editingPost.image ? t.change_image : t.add_image}
                </button>
                <input 
                  type="file" 
                  ref={postImageInputRef}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditingPost({...editingPost, image: reader.result});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => setEditingPost({...editingPost, isPublic: !editingPost.isPublic})}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${editingPost.isPublic ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  {editingPost.isPublic ? <Unlock size={16} /> : <LockIcon size={16} />}
                  {editingPost.isPublic ? t.public : t.private}
                </button>
              </div>
              
              <button 
                onClick={() => editWallPost(editingPost.id, editingPost.content, editingPost.image, editingPost.isPublic)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm"
              >
                {t.save}
              </button>
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
          
          <div className="relative" ref={notificationsModalRef}>
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
              <img 
                src={userProfile.profilePic} 
                className="w-8 h-8 rounded-full object-cover border-2 border-white cursor-pointer" 
                onClick={() => setActiveTab('profile')}
              />
            ) : (
              <div className={`w-8 h-8 ${theme === 'dark' ? 'bg-indigo-700' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-500'} rounded-full flex items-center justify-center text-white text-[10px] font-bold cursor-pointer`} onClick={() => setActiveTab('profile')}>
                {userProfile.name?.charAt(0) || 'U'}
              </div>
            )}
            <VerificationCheck count={userProfile.followersCount} />
          </button>
        </div>
      </header>

      {/* MODAL DETALLE DE LIBRO - CON CLIC EN PORTADA Y TÍTULO */}
      {viewingBook && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-lg h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95`}>
            <div className={`relative h-48 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <BookCoverDisplay 
                bookId={viewingBook.id || viewingBook.bookId} 
                bookData={viewingBook} 
                theme={theme}
                myBooks={myBooks}
                lang={lang}
                onZoom={handleZoomImage}
                onClick={() => handleViewBookDetails(viewingBook)}
              />
              <button onClick={() => {setViewingBook(null); setShowRecommendList(false);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 pt-16 scrollbar-hide">
              <h2 
                className="font-black text-2xl leading-tight cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                onClick={() => handleViewBookDetails(viewingBook)}
              >
                {viewingBook.volumeInfo?.title || viewingBook.title}
              </h2>
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
              
              <div className="flex gap-3 mb-8">
                <button onClick={() => setShowRecommendList(!showRecommendList)} className="flex-1 flex items-center justify-center gap-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest border border-pink-100 dark:border-pink-800 shadow-sm active:scale-95 transition-all">
                  <Heart size={18}/> {t.recommend}
                </button>
                
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

              {showRecommendList && (
                <div className={`${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-6 rounded-[2rem] border ${theme === 'dark' ? 'border-gray-700' : theme === 'sunset' ? 'border-amber-200' : 'border-slate-200'} mb-8 animate-in slide-in-from-top-4`}>
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400 mb-4">{t.select_friend}</p>
                  
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

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-3 rounded-2xl flex-1`}>
                    <Users size={16} className="text-indigo-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.readers_count}</p>
                      <p className="text-lg font-black">{getReadersCount(viewingBook.id || viewingBook.bookId)}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} p-3 rounded-2xl flex-1`}>
                    <Star size={16} className="text-yellow-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-400">{t.global_rating}</p>
                      <p className="text-lg font-black">
                        {(bookComments[viewingBook.id || viewingBook.bookId]?.reduce((a,b)=>a+b.rating,0) / (bookComments[viewingBook.id || viewingBook.bookId]?.length || 1) || 0).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed italic">
                  {viewingBook.volumeInfo?.description?.replace(/<[^>]*>?/gm, '') || viewingBook.description || (lang === 'es' ? "Sin descripción." : "No description available.")}
                </p>
              </div>

              {/* CARRUSEL DE RECOMENDACIONES */}
              {loadingRecommendations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-indigo-600" size={24} />
                </div>
              ) : (
                <>
                  {/* Libros del mismo autor */}
                  {authorRecommendations.length > 0 && (
                    <RecommendationCarousel 
                      title={t.more_by_author}
                      books={authorRecommendations}
                      onBookClick={(book) => {
                        setViewingBook(null);
                        setTimeout(() => {
                          setViewingBook({
                            id: book.id,
                            title: book.title,
                            authors: book.authors,
                            thumbnail: book.thumbnail,
                            isbn: book.isbn
                          });
                        }, 100);
                      }}
                      currentPage={currentRecommendationPage.author}
                      setCurrentPage={(page) => setCurrentRecommendationPage(prev => ({ ...prev, author: page }))}
                    />
                  )}

                  {/* Libros similares */}
                  {similarBooks.length > 0 && (
                    <RecommendationCarousel 
                      title={t.similar_books}
                      books={similarBooks}
                      onBookClick={(book) => {
                        setViewingBook(null);
                        setTimeout(() => {
                          setViewingBook({
                            id: book.id,
                            title: book.title,
                            authors: book.authors,
                            thumbnail: book.thumbnail,
                            isbn: book.isbn
                          });
                        }, 100);
                      }}
                      currentPage={currentRecommendationPage.similar}
                      setCurrentPage={(page) => setCurrentRecommendationPage(prev => ({ ...prev, similar: page }))}
                    />
                  )}

                  {/* Recomendaciones por género */}
                  {genreRecommendations.length > 0 && (
                    <RecommendationCarousel 
                      title={t.recommended_books}
                      books={genreRecommendations}
                      onBookClick={(book) => {
                        setViewingBook(null);
                        setTimeout(() => {
                          setViewingBook({
                            id: book.id,
                            title: book.title,
                            authors: book.authors,
                            thumbnail: book.thumbnail,
                            isbn: book.isbn
                          });
                        }, 100);
                      }}
                      currentPage={currentRecommendationPage.genre}
                      setCurrentPage={(page) => setCurrentRecommendationPage(prev => ({ ...prev, genre: page }))}
                    />
                  )}
                </>
              )}

              {/* Reseñas y comentarios */}
              <div className="space-y-6 mt-8">
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

      {/* MODAL PUBLICAR EN MURO - CON IMAGEN */}
      {showPostModal && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 max-h-[90vh]`}>
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-indigo-800' : theme === 'sunset' ? 'bg-orange-500' : 'bg-indigo-600'} flex-shrink-0`}>
              <h2 className="text-xl font-black text-white text-center">{t.post_quote}</h2>
              <button onClick={() => {setShowPostModal(false); setShowBookSelector(false); setBooksForPost([]); setPostSearch(''); setPostImage(null);}} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full">
                <X size={24}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Selector de imagen */}
              <div className="mb-4">
                {postImage ? (
                  <div className="relative">
                    <img src={postImage} className="w-full h-40 object-cover rounded-2xl" />
                    <button 
                      onClick={() => setPostImage(null)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => postImageInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-2xl flex items-center justify-center gap-2 text-slate-500 dark:text-gray-400"
                  >
                    <ImageIcon size={20} />
                    {t.add_image}
                  </button>
                )}
                <input 
                  type="file" 
                  ref={postImageInputRef}
                  onChange={handlePostImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

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
                    <img src={selectedBookForPost.thumbnail || selectedBookForPost.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/150'} className="w-12 h-16 object-contain rounded-lg bg-white" />
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
                          <img src={book.thumbnail || book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/150'} className="w-10 h-14 object-contain rounded bg-white" />
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
            <div className={`sticky top-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} z-10 border-b ${themeClasses.border} px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setShowMessages(false);
                    setSelectedConversation(null);
                    setActiveMessages([]);
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
                              loadMessages(conv.id);
                            }}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl border ${themeClasses.border} text-left hover:border-indigo-300 dark:hover:border-indigo-500 transition-all ${
                              conv.unreadCount && conv.unreadCount[user?.uid] > 0
                                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                : theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                            }`}
                          >
                            <img 
                              src={otherParticipant?.profilePic || 'https://via.placeholder.com/40'} 
                              className="w-12 h-12 rounded-full object-cover cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (otherParticipant) handleViewUserProfile(otherParticipant);
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 
                                  className="font-bold text-sm cursor-pointer hover:text-indigo-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (otherParticipant) handleViewUserProfile(otherParticipant);
                                  }}
                                >
                                  {otherParticipantName}
                                </h4>
                                <span className="text-xs text-slate-500 dark:text-gray-400">
                                  {conv.lastMessageAt?.seconds ? new Date(conv.lastMessageAt.seconds * 1000).toLocaleDateString() : ''}
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
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setSelectedConversation(null);
                        setActiveMessages([]);
                      }}
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
                            className="w-10 h-10 rounded-full object-cover cursor-pointer"
                            onClick={() => otherParticipant && handleViewUserProfile(otherParticipant)}
                          />
                          <div>
                            <h3 
                              className="font-bold text-sm cursor-pointer hover:text-indigo-600"
                              onClick={() => otherParticipant && handleViewUserProfile(otherParticipant)}
                            >
                              {otherParticipantName}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {otherParticipant?.readCount || 0} {t.read.toLowerCase()} • {getLevelTitle(otherParticipant?.readCount, lang)}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className={`h-96 overflow-y-auto p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-50'} space-y-4`}>
                    {activeMessages.length === 0 ? (
                      <p className="text-center text-sm text-slate-400 dark:text-gray-400 py-8">
                        {lang === 'es' ? 'No hay mensajes aún' : 'No messages yet'}
                      </p>
                    ) : (
                      activeMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            msg.senderId === user.uid 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100'
                          }`}>
                            <p>{msg.text}</p>
                            <p className="text-[8px] opacity-70 mt-1">
                              {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString() : ''}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
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
                          <img 
                            src={p.profilePic || 'https://via.placeholder.com/30'} 
                            className="w-10 h-10 rounded-full object-cover cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewUserProfile(p);
                            }}
                          />
                          <div className="flex-1 text-left">
                            <p 
                              className="text-sm font-bold cursor-pointer hover:text-indigo-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewUserProfile(p);
                              }}
                            >
                              {p.name}
                            </p>
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
                        onClick={() => handleViewBookDetails(book)} 
                        className="w-14 h-20 object-contain rounded-xl shadow-sm cursor-pointer bg-white hover:scale-105 transition-transform" 
                      />
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 
                          className="font-bold text-sm line-clamp-1 cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => handleViewBookDetails(book)}
                        >
                          {book.title}
                        </h4>
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

      {/* MODAL PLANIFICADOR CON FECHA DE INICIO Y MODO RELAX */}
      {planningBook && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${themeClasses.card} w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 border ${themeClasses.border}`}>
            <h3 className="font-black text-xl mb-6 text-indigo-600 dark:text-indigo-400 flex items-center gap-2 uppercase tracking-tighter">
              <Calendar /> {isRelaxMode ? t.relax_plan : t.reading_plan}
            </h3>
            
            {/* Toggle modo relax */}
            <div className="flex items-center justify-between mb-6 p-3 bg-slate-50 dark:bg-gray-800 rounded-2xl">
              <span className="text-sm font-bold">{t.relax_mode}</span>
              <button 
                onClick={() => setIsRelaxMode(!isRelaxMode)}
                className={`relative w-14 h-7 rounded-full transition-all ${isRelaxMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-1 bottom-1 w-5 bg-white rounded-full shadow transition-all ${isRelaxMode ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
            
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
              
              {!isRelaxMode && (
                <>
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
                </>
              )}
              
              {isRelaxMode && manualPages && parseInt(manualPages) > 0 && (
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : theme === 'sunset' ? 'bg-amber-50' : 'bg-slate-50'} border ${theme === 'dark' ? 'border-gray-700' : theme === 'sunset' ? 'border-amber-200' : 'border-slate-200'}`}>
                  <p className="text-sm font-bold mb-2">{t.relax_plan}:</p>
                  <p className="text-xs text-slate-600 dark:text-gray-300">
                    {t.no_days_needed}
                  </p>
                  <p className="text-xs mt-2">
                    {lang === 'es' 
                      ? `Total: ${parseInt(manualPages)} páginas`
                      : `Total: ${parseInt(manualPages)} pages`
                    }
                  </p>
                  <div className="mt-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase">{t.set_current_day}</label>
                    <input 
                      type="number" 
                      value={relaxCurrentDay}
                      onChange={(e) => setRelaxCurrentDay(parseInt(e.target.value) || 1)}
                      className={`w-full mt-1 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : theme === 'sunset' ? 'bg-amber-100 border-amber-300 text-gray-800' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-xl p-2 font-bold text-sm`}
                      min="1"
                    />
                  </div>
                </div>
              )}
              
              {!isRelaxMode && manualPages && planDays && parseInt(manualPages) > 0 && parseInt(planDays) > 0 && (
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
                disabled={!manualPages || parseInt(manualPages) <= 0 || (!isRelaxMode && (!planDays || parseInt(planDays) <= 0))}
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
                  setIsRelaxMode(false);
                  setRelaxCurrentDay(1);
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
                            setTimeout(() => handleViewBookDetails(book), 100);
                          }}
                        >
                          <img 
                            src={book.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://via.placeholder.com/150'} 
                            className="w-16 h-20 object-contain rounded-lg bg-white cursor-pointer hover:scale-105 transition-transform" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewBookDetails(book);
                            }}
                          />
                          <div className="flex-1">
                            <h4 
                              className="font-bold text-sm line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewBookDetails(book);
                              }}
                            >
                              {book.volumeInfo?.title}
                            </h4>
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

      {/* MODAL ESCRITORES FAVORITOS - CON IMÁGENES */}
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
                 
