// src/AppSelector.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { X, Sparkles, Languages } from 'lucide-react';

// Importar las versiones con los nombres CORREGIDOS
import AppV4 from './versions/version4';  // Sin extensión, Vite la encuentra automáticamente
import AppV2 from './versions/version2';

// O si prefieres lazy loading:
// const AppV4 = lazy(() => import('./versions/version4'));
// const AppV2 = lazy(() => import('./versions/version2'));

// Traducciones para el selector
const selectorI18n = {
  es: {
    title: "Selector de Versiones",
    version4: "Versión 4 (Clásica)",
    version2: "Versión 2 (Modernizada)",
    currentVersion: "Versión actual:",
    switchToV4: "Cambiar a Versión 4",
    switchToV2: "Cambiar a Versión 2",
    closeSelector: "Cerrar Selector",
    showSelector: "Mostrar Selector",
    rememberChoice: "Recordar mi elección",
    feedback: "¿Qué versión prefieres?",
    sendFeedback: "Enviar feedback",
    thankYou: "¡Gracias por tu feedback!"
  },
  en: {
    title: "Version Selector",
    version4: "Version 4 (Classic)",
    version2: "Version 2 (Modernized)",
    currentVersion: "Current version:",
    switchToV4: "Switch to Version 4",
    switchToV2: "Switch to Version 2",
    closeSelector: "Close Selector",
    showSelector: "Show Selector",
    rememberChoice: "Remember my choice",
    feedback: "Which version do you prefer?",
    sendFeedback: "Send feedback",
    thankYou: "Thank you for your feedback!"
  }
};

// Componente del selector flotante
const VersionSelector = ({ currentVersion, onVersionChange, onClose, lang }) => {
  const t = selectorI18n[lang];
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleFeedbackSubmit = () => {
    if (feedback.trim()) {
      console.log('Feedback enviado:', { version: currentVersion, feedback });
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 3000);
      setFeedback('');
    }
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[10000] bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-3xl shadow-2xl border-2 border-white/20 backdrop-blur-lg animate-in slide-in-from-bottom-4">
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
      >
        <X size={18} />
      </button>
      
      <h3 className="font-black text-lg mb-4 flex items-center gap-2">
        <Sparkles size={20} />
        {t.title}
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white/10 p-3 rounded-2xl">
          <span className="text-sm font-bold">{t.currentVersion}</span>
          <span className="text-sm font-black bg-white/20 px-3 py-1 rounded-full">
            {currentVersion === 'v4' ? t.version4 : t.version2}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onVersionChange('v4')}
            className={`p-4 rounded-2xl font-bold text-sm transition-all ${
              currentVersion === 'v4' 
                ? 'bg-white text-indigo-600 scale-105 shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {t.version4}
          </button>
          <button
            onClick={() => onVersionChange('v2')}
            className={`p-4 rounded-2xl font-bold text-sm transition-all ${
              currentVersion === 'v2' 
                ? 'bg-white text-indigo-600 scale-105 shadow-lg' 
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {t.version2}
          </button>
        </div>
        
        <div className="flex items-center gap-2 bg-white/10 p-3 rounded-2xl">
          <input 
            type="checkbox" 
            id="rememberChoice"
            className="w-4 h-4 accent-white"
            onChange={(e) => {
              if (e.target.checked) {
                localStorage.setItem('sandbook_preferred_version', currentVersion);
              } else {
                localStorage.removeItem('sandbook_preferred_version');
              }
            }}
          />
          <label htmlFor="rememberChoice" className="text-xs font-medium">
            {t.rememberChoice}
          </label>
        </div>
        
        <div className="bg-white/10 p-3 rounded-2xl">
          <p className="text-xs font-bold mb-2">{t.feedback}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Escribe tu opinión..."
              className="flex-1 px-3 py-2 rounded-xl text-sm text-gray-900 bg-white/90 outline-none"
            />
            <button
              onClick={handleFeedbackSubmit}
              disabled={!feedback.trim()}
              className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.sendFeedback}
            </button>
          </div>
          {feedbackSent && (
            <p className="text-xs text-green-300 mt-2 animate-pulse">{t.thankYou}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function AppSelector() {
  const [lang, setLang] = useState('es');
  const [version, setVersion] = useState(() => {
    const saved = localStorage.getItem('sandbook_preferred_version');
    return saved || 'v4';
  });
  const [showSelector, setShowSelector] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const t = selectorI18n[lang];

  const handleVersionChange = (newVersion) => {
    setVersion(newVersion);
    setShowSelector(false);
    
    const remember = localStorage.getItem('sandbook_preferred_version') !== null;
    if (remember) {
      localStorage.setItem('sandbook_preferred_version', newVersion);
    }
    
    window.location.reload();
  };

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const renderCurrentVersion = () => {
    if (!isInitialized) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-white font-bold">Cargando Sandbook...</p>
          </div>
        </div>
      );
    }

    const VersionComponent = version === 'v4' ? AppV4 : AppV2;
    return <VersionComponent />;
  };

  return (
    <>
      {renderCurrentVersion()}
      
      <button
        onClick={() => setShowSelector(!showSelector)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border-2 border-white/30"
      >
        <Sparkles size={24} />
      </button>
      
      {showSelector && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[9999]"
            onClick={() => setShowSelector(false)}
          />
          
          <VersionSelector
            currentVersion={version}
            onVersionChange={handleVersionChange}
            onClose={() => setShowSelector(false)}
            lang={lang}
          />
        </>
      )}
      
      <button
        onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
        className="fixed bottom-6 left-6 z-[9999] w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Languages size={20} className="text-indigo-600" />
      </button>
    </>
  );
}
