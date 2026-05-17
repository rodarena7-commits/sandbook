import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export async function sendLoanRequest(fromUid, fromProfile, toUid, book, message) {
  const reqId = `${fromUid}_${book.bookId}_${Date.now()}`

  await setDoc(doc(db, 'users', toUid, 'loanRequests', reqId), {
    id: reqId,
    fromUid,
    fromName:  fromProfile?.displayName || 'Lector',
    fromPhoto: fromProfile?.photoURL    || null,
    bookId:        book.bookId,
    bookTitle:     book.title,
    bookThumbnail: book.customThumbnail || book.thumbnail || null,
    bookAuthors:   book.authors || [],
    status:  'pending',
    message: message.trim(),
    createdAt: serverTimestamp(),
  })

  await setDoc(doc(db, 'users', toUid, 'notifications', `loan_${reqId}`), {
    type:     'loan_request',
    fromUid,
    fromName:     fromProfile?.displayName || 'Lector',
    fromPhoto:    fromProfile?.photoURL    || null,
    bookTitle:    book.title,
    bookThumbnail: book.customThumbnail || book.thumbnail || null,
    loanRequestId: reqId,
    message:  message.trim(),
    createdAt: serverTimestamp(),
    read: false,
  })
}

export async function respondToLoan(toUid, requestId, accepted) {
  await updateDoc(doc(db, 'users', toUid, 'loanRequests', requestId), {
    status: accepted ? 'accepted' : 'declined',
  })
}
