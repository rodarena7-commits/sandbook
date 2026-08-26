import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

// Lee la acción pendiente que dejó el widget de pantalla de inicio
// (botón "Escanear ISBN" o "Buscar libro") vía el plugin nativo WidgetAction.
export function useWidgetAction() {
  const [widgetAction, setWidgetAction] = useState(null)

  const checkPendingAction = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return
    const plugin = Capacitor.Plugins.WidgetAction
    if (!plugin) return
    try {
      const { action } = await plugin.getPendingAction()
      if (action) setWidgetAction(action)
    } catch {}
  }, [])

  useEffect(() => {
    checkPendingAction()
    if (!Capacitor.isNativePlatform()) return
    let handle
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) checkPendingAction()
    }).then(h => { handle = h })
    return () => { handle?.remove() }
  }, [checkPendingAction])

  function clearWidgetAction() {
    setWidgetAction(null)
  }

  return { widgetAction, clearWidgetAction }
}
