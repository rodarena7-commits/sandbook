if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        // When new SW takes control, reload to use fresh assets
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })

        const onUpdateFound = (worker) => {
          window.swUpdateAvailable = true
          window.swWaitingWorker = worker
          window.dispatchEvent(new CustomEvent('sw-update-available'))
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              onUpdateFound(newWorker)
            }
          })
        })

        if (registration.waiting) {
          onUpdateFound(registration.waiting)
        }

        // Poll for updates every 60 seconds
        setInterval(() => {
          registration.update().catch(err => console.log('Error updating SW:', err))
        }, 60000)

        // Check for updates immediately when the app becomes visible
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(err => console.log('Error updating SW:', err))
          }
        })
      })
      .catch(err => console.error('Service Worker registration failed:', err))
  })
}

export const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}
