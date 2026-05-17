import { doc, setDoc, updateDoc, addDoc, deleteDoc, getDocs, collection, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const FAKE_UID = 'fake_user_maria_garcia_001'

const FAKE_PROFILE = {
  uid: FAKE_UID,
  displayName: 'María García',
  email: 'maria.garcia@sandbook.app',
  photoURL: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=f59e0b&color=fff&bold=true&size=200&rounded=true',
  coverURL: null,
  bio: 'Apasionada por la literatura latinoamericana 📚 Leer es vivir otras vidas.',
  following: [],
  followers: [],
  notificationsEnabled: true,
  messagingPrivacy: 'everyone',
  showLibrary: true,
  booksRead: 4,
}

const FAKE_BOOKS = [
  {
    bookId: 'fake_cien_anos_soledad',
    title: 'Cien años de soledad',
    authors: ['Gabriel García Márquez'],
    thumbnail: 'https://covers.openlibrary.org/b/isbn/9780307474728-M.jpg',
    description: 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.',
    publishedDate: '1967',
    pageCount: 432,
    categories: ['Ficción', 'Literatura latinoamericana'],
    status: 'read',
    rating: 5,
    review: 'Una obra maestra absoluta. Imprescindible para cualquier lector.',
    isFavorite: true,
    myReaction: 'like',
    shelfId: null,
    checkpoints: [],
    inLibrary: true,
    addedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    bookId: 'fake_rayuela',
    title: 'Rayuela',
    authors: ['Julio Cortázar'],
    thumbnail: null,
    description: 'Una novela experimental que puede leerse de múltiples maneras.',
    publishedDate: '1963',
    pageCount: 560,
    categories: ['Ficción', 'Literatura argentina'],
    status: 'reading',
    rating: 0,
    review: '',
    isFavorite: false,
    myReaction: null,
    shelfId: null,
    checkpoints: [],
    inLibrary: true,
    addedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    bookId: 'fake_principito',
    title: 'El Principito',
    authors: ['Antoine de Saint-Exupéry'],
    thumbnail: 'https://covers.openlibrary.org/b/isbn/9788498381498-M.jpg',
    description: 'Un clásico de la literatura universal sobre la amistad y el amor.',
    publishedDate: '1943',
    pageCount: 96,
    categories: ['Clásicos', 'Fábulas'],
    status: 'read',
    rating: 5,
    review: 'Lo vuelvo a leer cada año. Siempre encuentro algo nuevo.',
    isFavorite: true,
    myReaction: 'like',
    shelfId: null,
    checkpoints: [],
    inLibrary: true,
    addedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    bookId: 'fake_ficciones',
    title: 'Ficciones',
    authors: ['Jorge Luis Borges'],
    thumbnail: null,
    description: 'Colección de cuentos que mezclan filosofía, matemáticas y literatura fantástica.',
    publishedDate: '1944',
    pageCount: 208,
    categories: ['Cuentos', 'Literatura argentina'],
    status: 'read',
    rating: 4,
    review: '',
    isFavorite: true,
    myReaction: 'like',
    shelfId: null,
    checkpoints: [],
    inLibrary: true,
    addedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    bookId: 'fake_don_quijote',
    title: 'Don Quijote de la Mancha',
    authors: ['Miguel de Cervantes'],
    thumbnail: null,
    description: 'La primera novela moderna de la literatura occidental.',
    publishedDate: '1605',
    pageCount: 1024,
    categories: ['Clásicos'],
    status: 'pending',
    rating: 0,
    review: '',
    isFavorite: false,
    myReaction: null,
    shelfId: null,
    checkpoints: [],
    inLibrary: true,
    addedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
]

export async function seedFakeFollower(realUid, realProfile) {
  // 1. Create fake user profile (following the real user)
  await setDoc(doc(db, 'users', FAKE_UID), {
    ...FAKE_PROFILE,
    following: [realUid],
    createdAt: serverTimestamp(),
  })

  // 2. Add fake user to real user's followers
  await updateDoc(doc(db, 'users', realUid), {
    followers: arrayUnion(FAKE_UID),
  })

  // 3. Add books to fake user
  for (const book of FAKE_BOOKS) {
    await setDoc(doc(db, 'users', FAKE_UID, 'myBooks', book.bookId), book)
  }

  // 4. Add a fake post
  await addDoc(collection(db, 'posts'), {
    uid: FAKE_UID,
    displayName: FAKE_PROFILE.displayName,
    photoURL: FAKE_PROFILE.photoURL,
    text: '"Lo esencial es invisible a los ojos."\n\nEsta frase del Principito me cambió la manera de ver el mundo.',
    bookId: 'fake_principito',
    bookTitle: 'El Principito',
    bookAuthors: ['Antoine de Saint-Exupéry'],
    bookThumbnail: 'https://covers.openlibrary.org/b/isbn/9788498381498-M.jpg',
    likedBy: [],
    likeCount: 0,
    createdAt: serverTimestamp(),
  })

  // 5. Send a recommendation notification to real user
  await setDoc(
    doc(db, 'users', realUid, 'notifications', `rec_${FAKE_UID}_demo`),
    {
      type: 'recommendation',
      fromUid: FAKE_UID,
      fromName: FAKE_PROFILE.displayName,
      fromPhoto: FAKE_PROFILE.photoURL,
      message: '"Cien años de soledad" de García Márquez. ¡No te lo podés perder!',
      createdAt: serverTimestamp(),
      read: false,
    }
  )

  return FAKE_UID
}

export async function removeFakeFollower(realUid) {
  const booksSnap = await getDocs(collection(db, 'users', FAKE_UID, 'myBooks'))
  await Promise.all(booksSnap.docs.map(d => deleteDoc(d.ref)))
  await deleteDoc(doc(db, 'users', FAKE_UID))
  await updateDoc(doc(db, 'users', realUid), { followers: arrayRemove(FAKE_UID) })
}
