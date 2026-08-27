import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

const DISMISSED_KEY = 'sandbook_update_dismissed_version'

// Compara el versionCode instalado (nativo) contra el "latestVersionCode"
// publicado en appConfig/settings (Firestore) para avisar cuando hay una
// versión más nueva en Play Store que la que tiene instalada el usuario.
export function useAppUpdateCheck(appConfig) {
  const [available, setAvailable] = useState(false)
  const latestVersionCode = Number(appConfig?.latestVersionCode) || 0

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (!latestVersionCode) return
    let cancelled = false
    App.getInfo().then(info => {
      if (cancelled) return
      const current = Number(info.build) || 0
      const dismissed = Number(localStorage.getItem(DISMISSED_KEY)) || 0
      if (current > 0 && current < latestVersionCode && dismissed < latestVersionCode) {
        setAvailable(true)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [latestVersionCode])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(latestVersionCode))
    setAvailable(false)
  }

  return { available, dismiss }
}
