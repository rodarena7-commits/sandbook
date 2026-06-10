if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        // When new SW takes control, reload to use fresh assets
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          newWorker.addEventListener('statechange', () => {
            // If for some reason skipWaiting wasn't called from the SW itself, trigger it here
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })

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
