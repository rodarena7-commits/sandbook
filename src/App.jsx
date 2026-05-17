import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useNotifications } from './hooks/useNotifications'
import { useConversations } from './hooks/useConversations'
import LoginScreen from './components/auth/LoginScreen'
import BottomNav from './components/layout/BottomNav'
import Loader from './components/ui/Loader'
import LibraryPage from './pages/LibraryPage'
import SearchPage from './pages/SearchPage'
import SocialPage from './pages/SocialPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'

function AppContent() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('library')
  const { unreadCount: unreadNotifs } = useNotifications(user?.uid)
  const { totalUnread: unreadMsgs }   = useConversations(user?.uid)

  if (loading) return <Loader />
  if (!user)   return <LoginScreen />

  const pages = {
    library:  <LibraryPage />,
    search:   <SearchPage />,
    social:   <SocialPage />,
    messages: <MessagesPage />,
    profile:  <ProfilePage />,
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <main className="max-w-lg mx-auto">
        {pages[activeTab]}
      </main>
      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
        badges={{ profile: unreadNotifs, messages: unreadMsgs }}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
