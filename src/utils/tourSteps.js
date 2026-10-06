// Pasos del recorrido guiado de cada sección. `target` apunta a un elemento con data-tour="..."
// Si el elemento no está en pantalla en ese momento, el paso se omite solo.
const t = name => `[data-tour="${name}"]`

export const TOURS = {
  library: [
    {
      target: t('nav'),
      title: 'Menú principal',
      desc: 'Desde acá te movés por toda la app: Biblioteca, Buscar, Social, Bookfree (libros gratis), Mensajes y tu Perfil. El número rojo avisa si tenés algo nuevo.',
    },
    {
      target: t('lib-toggle'),
      title: 'Sincronizada o Local',
      desc: 'Sincronizada guarda tus libros en tu cuenta y los ves en cualquier dispositivo. Local es para tus PDF y ebooks, que quedan solo en este teléfono: ahí podés leerlos, enviarlos a un seguidor o sumarlos a tu biblioteca.',
    },
    {
      target: t('lib-status'),
      title: 'Filtrá por estado',
      desc: 'Mirá tus libros según cómo vayas con ellos: Total, Leyendo, Leídos, Favoritos (los que marcaste con ⭐) o Compartidos.',
    },
    {
      target: t('lib-shelves'),
      title: 'Tus estantes',
      desc: 'Organizá tus libros en estantes propios. Tocá "+ Crear" para armar uno nuevo; mantené apretado un estante para renombrarlo o borrarlo.',
    },
  ],

  search: [
    {
      target: t('search-type'),
      title: '¿Cómo querés buscar?',
      desc: 'Elegí buscar por Título, por Autor o por ISBN (el código de barras del libro).',
    },
    {
      target: t('search-bar'),
      title: 'Buscador',
      desc: 'Escribí y tocá "Buscar". Si elegiste ISBN, aparece un ícono de cámara 📷 para escanear el código de barras del libro con el celular.',
    },
    {
      target: t('search-plans'),
      title: 'Tus planes de lectura',
      desc: 'Acceso directo a tus planes: ahí ves cuántas páginas te tocan por día y marcás tu avance.',
    },
  ],

  social: [
    {
      target: t('soc-tabs'),
      title: 'Las secciones de Social',
      desc: 'Feed: lo que publican los lectores que seguís. Descubrir: encontrá lectores y escritores nuevos. Siguiendo: tu lista de seguidos. Marketplace: comprá y vendé libros usados.',
    },
    {
      target: t('soc-publish'),
      title: 'Publicá en el Feed',
      desc: 'Compartí una reseña, una frase o lo que estás leyendo, con el libro y su portada. Tus seguidores lo ven en su Feed.',
    },
  ],

  bookfree: [
    {
      target: t('free-sources'),
      title: 'Dónde buscar',
      desc: 'Elegí en qué bibliotecas gratuitas buscar. Podés activar varias a la vez; las apagadas quedan en gris.',
    },
    {
      target: t('free-kids'),
      title: 'Filtro Kids 🧒',
      desc: 'Muestra solo libros infantiles. Útil si lo va a usar un chico.',
    },
    {
      target: t('free-search'),
      title: 'Buscá y leé gratis',
      desc: 'Buscá por título o autor. Los resultados se abren para leer o descargar sin costo, y podés sumarlos a tu biblioteca.',
    },
  ],

  messages: [
    {
      title: 'Tus mensajes',
      desc: 'Acá aparecen tus conversaciones privadas con otros lectores. Tocá una para abrirla; el número naranja indica mensajes sin leer. Para empezar un chat nuevo, entrá al perfil de alguien desde Social y tocá "Mensaje".',
    },
  ],

  profile: [
    {
      target: t('prof-avatar'),
      title: 'Tu foto',
      desc: 'Tocá la cámara para cambiar tu foto de perfil. La cámara de arriba, sobre la portada, cambia la imagen de fondo.',
    },
    {
      target: t('prof-actions'),
      title: 'Avisos, ajustes y salir',
      desc: 'La campana muestra tus notificaciones (seguidores nuevos, pedidos de préstamo). El engranaje abre los ajustes: privacidad de mensajes, idioma y más. "Salir" cierra tu sesión.',
    },
    {
      target: t('prof-follow'),
      title: 'Tu comunidad',
      desc: 'Tocá "siguiendo" o "seguidores" para ver y administrar esas listas.',
    },
    {
      target: t('prof-quick'),
      title: 'Invitar y planes',
      desc: '"Invitar" comparte Sandbook por WhatsApp u otra app. "Planes" abre tus planes de lectura.',
    },
  ],

  // Se muestra la primera vez que se abre un chat
  chat: [
    {
      target: t('chat-link'),
      title: 'Enlace de videollamada',
      desc: 'Manda un enlace de Jitsi al chat. Sirve de respaldo: se abre en el navegador y no hace falta que el otro tenga Sandbook abierto.',
    },
    {
      target: t('chat-call'),
      title: 'Videollamada',
      desc: 'Llama al otro lector dentro de la app. Le suena una pantalla de "llamada entrante" para atender o rechazar. Necesita permiso de cámara y micrófono.',
    },
    {
      target: t('chat-input'),
      title: 'Mensaje de texto o de voz',
      desc: 'Escribí tu mensaje y tocá enviar. Con el campo vacío, el botón se convierte en micrófono 🎤: tocalo para grabar un audio de hasta 1 minuto y enviarlo.',
    },
  ],
}
