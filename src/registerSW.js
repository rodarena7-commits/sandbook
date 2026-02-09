// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration.scope);
        
        // Verificar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('Nueva versión de Service Worker encontrada:', newWorker);
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nueva versión disponible. Por favor, actualiza.');
              // Mostrar notificación para actualizar
              if (confirm('¡Hay una nueva versión disponible! ¿Actualizar ahora?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('Error registrando Service Worker:', error);
      });
  });

  // Verificar conexión
  window.addEventListener('online', () => {
    console.log('Estás en línea');
    document.dispatchEvent(new CustomEvent('appOnline'));
  });

  window.addEventListener('offline', () => {
    console.log('Estás offline');
    document.dispatchEvent(new CustomEvent('appOffline'));
  });
}

// Solicitar permisos para notificaciones
export const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Permiso de notificación:', permission);
    });
  }
};

// Instalar PWA
export const installPWA = () => {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Previene que Chrome muestre automáticamente el prompt
    e.preventDefault();
    deferredPrompt = e;
    
    // Muestra tu propio botón de instalación
    const installButton = document.getElementById('installButton');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        // Oculta el botón
        installButton.style.display = 'none';
        
        // Muestra el prompt de instalación
        deferredPrompt.prompt();
        
        // Espera a que el usuario responda
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('Usuario instaló la PWA');
          } else {
            console.log('Usuario rechazó la instalación');
          }
          deferredPrompt = null;
        });
      });
    }
  });
};
