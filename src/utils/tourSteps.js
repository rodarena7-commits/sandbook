// Pasos del recorrido guiado de cada sección. `target` apunta a un elemento con data-tour="..."
// Si el elemento no está en pantalla en ese momento, el paso se omite solo.
// title / desc son claves de traducción (los textos están en utils/i18n/groups/tour.js).
const t = name => `[data-tour="${name}"]`
const step = (key, target) => ({ ...(target ? { target: t(target) } : {}), title: `tour_${key}_t`, desc: `tour_${key}_d` })

export const TOURS = {
  library: [
    step('lib_nav', 'nav'),
    step('lib_toggle', 'lib-toggle'),
    step('lib_status', 'lib-status'),
    step('lib_shelves', 'lib-shelves'),
  ],

  search: [
    step('search_type', 'search-type'),
    step('search_bar', 'search-bar'),
    step('search_plans', 'search-plans'),
  ],

  social: [
    step('soc_status', 'soc-status'),
    step('soc_tabs', 'soc-tabs'),
    step('soc_publish', 'soc-publish'),
  ],

  bookfree: [
    step('free_sources', 'free-sources'),
    step('free_kids', 'free-kids'),
    step('free_search', 'free-search'),
  ],

  messages: [
    step('msg'),
  ],

  profile: [
    step('prof_avatar', 'prof-avatar'),
    step('prof_actions', 'prof-actions'),
    step('prof_follow', 'prof-follow'),
    step('prof_quick', 'prof-quick'),
  ],

  // Se muestra la primera vez que se abre un chat
  chat: [
    step('chat_link', 'chat-link'),
    step('chat_call', 'chat-call'),
    step('chat_input', 'chat-input'),
  ],
}
