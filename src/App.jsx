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
import InstallPrompt from './components/ui/InstallPrompt'
import TutorialOverlay from './components/ui/TutorialOverlay'

function AppContent() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab]   = useState('library')
  const [goToPlan, setGoToPlan]     = useState(false)
  const { unreadCount: unreadNotifs } = useNotifications(user?.uid)
  const { totalUnread: unreadMsgs }   = useConversations(user?.uid)

  if (loading) return <Loader />
  if (!user)   return <LoginScreen />

  function navigateToPlan() {
    setGoToPlan(true)
    setActiveTab('library')
  }

  const pages = {
    library:  <LibraryPage  startOnPlan={goToPlan} onPlanConsumed={() => setGoToPlan(false)} />,
    search:   <SearchPage   onGoToPlan={navigateToPlan} />,
    social:   <SocialPage />,
    messages: <MessagesPage />,
    profile:  <ProfilePage />,
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <main className="w-full">
        {pages[activeTab]}
      </main>
      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
        badges={{ profile: unreadNotifs, messages: unreadMsgs }}
      />
      {/* Tutorial única vez para todos los usuarios */}
      <TutorialOverlay />
      {/* Prompt de instalación PWA (opcional) */}
      <InstallPrompt />
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
