import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useNotifications } from './hooks/useNotifications'
import { useConversations } from './hooks/useConversations'
import LoginScreen from './components/auth/LoginScreen'
import BottomNav from './components/layout/BottomNav'
import Loader from './components/ui/Loader'
import LibraryPage from './pages/LibraryPage'
import SearchPage from './pages/SearchPage'
import SocialPage from './pages/SocialPage'
import BookfreePage from './pages/BookfreePage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import InstallPrompt from './components/ui/InstallPrompt'
import TutorialOverlay, { useTutorial } from './components/ui/TutorialOverlay'
import OnboardingFlow from './components/ui/OnboardingFlow'
import { useWidgetAction } from './hooks/useWidgetAction'
import { CallProvider } from './contexts/CallContext'

function AppContent() {
  const { user, profile, loading } = useAuth()
  const { hasSeenTutorial } = useTutorial()
  const { widgetAction, clearWidgetAction } = useWidgetAction()
  const [activeTab, setActiveTab]   = useState('library')
  const [goToPlan, setGoToPlan]     = useState(false)
  // El onboarding (autor/libro favorito) sólo se muestra una vez que el tutorial general terminó,
  // para que nunca se abran las dos ventanas al mismo tiempo.
  const [tutorialDone, setTutorialDone] = useState(hasSeenTutorial)
  const { unreadCount: unreadNotifs } = useNotifications(user?.uid)
  const { totalUnread: unreadMsgs }   = useConversations(user?.uid)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if (window.swUpdateAvailable) {
      setUpdateAvailable(true)
    }
    const handleUpdate = () => {
      setUpdateAvailable(true)
    }
    window.addEventListener('sw-update-available', handleUpdate)
    return () => {
      window.removeEventListener('sw-update-available', handleUpdate)
    }
  }, [])

  function handleUpdateApp() {
    if (window.swWaitingWorker) {
      window.swWaitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  // Botón del widget de pantalla de inicio tocado: lleva directo a Buscar
  useEffect(() => {
    if (widgetAction) setActiveTab('search')
  }, [widgetAction])

  if (loading) return <Loader />
  if (!user)   return <LoginScreen />

  function navigateToPlan() {
    setGoToPlan(true)
    setActiveTab('library')
  }

  const pages = {
    library:  <LibraryPage  startOnPlan={goToPlan} onPlanConsumed={() => setGoToPlan(false)} />,
    search:   <SearchPage   onGoToPlan={navigateToPlan} widgetAction={widgetAction} onWidgetActionConsumed={clearWidgetAction} />,
    social:   <SocialPage />,
    bookfree: <BookfreePage />,
    messages: <MessagesPage />,
    profile:  <ProfilePage onGoToPlan={navigateToPlan} />,
  }

  return (
    <CallProvider user={user} profile={profile}>
    <div className={`min-h-screen bg-slate-50 pb-16 ${updateAvailable ? 'pt-14' : ''}`}>
      {updateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-900/95 backdrop-blur-md text-white py-3 px-4 flex items-center justify-between border-b border-slate-800 animate-slide-down shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="text-base flex-shrink-0 animate-bounce">✨</span>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-white leading-tight">¡Nueva versión disponible!</p>
              <p className="text-[10px] text-slate-300 truncate">Actualizá Sandbook para ver las últimas mejoras.</p>
            </div>
          </div>
          <button
            onClick={handleUpdateApp}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 whitespace-nowrap shadow-sm ml-2"
          >
            Actualizar ahora
          </button>
        </div>
      )}
      <main className="w-full">
        {pages[activeTab]}
      </main>
      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
        badges={{ profile: unreadNotifs, messages: unreadMsgs }}
      />
      {/* Tutorial única vez para todos los usuarios. El onboarding (paso 2) sólo
          se monta cuando este termina, para que no aparezcan las dos ventanas juntas. */}
      {!tutorialDone ? (
        <TutorialOverlay onDone={() => setTutorialDone(true)} />
      ) : (
        <OnboardingFlow />
      )}
      {/* Prompt de instalación PWA (opcional) */}
      <InstallPrompt />
    </div>
    </CallProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
