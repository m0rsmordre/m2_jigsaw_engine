/* Shared TR/EN for static HTML pages — flags match Play page */
(function () {
  var KEY = 'fj-lang'

  var FLAG_TR =
    '<svg viewBox="0 0 30 20" class="flag" role="img" aria-label="Türkçe" preserveAspectRatio="xMidYMid meet">' +
    '<title>Türkçe</title>' +
    '<rect width="30" height="20" fill="#E30A17"/>' +
    '<circle cx="10" cy="10" r="5" fill="#fff"/>' +
    '<circle cx="12.25" cy="10" r="4" fill="#E30A17"/>' +
    '<polygon fill="#fff" transform="translate(16.833,10) scale(0.22222)" ' +
    'points="0,-15 4.635,-6.345 14.265,-6.345 6.315,-0.945 9.405,7.845 0,2.745 -9.405,7.845 -6.315,-0.945 -14.265,-6.345 -4.635,-6.345"/>' +
    '</svg>'

  var FLAG_EN =
    '<svg viewBox="0 0 60 30" class="flag flag-en" role="img" aria-label="English" preserveAspectRatio="xMidYMid meet">' +
    '<title>English</title>' +
    '<rect width="60" height="30" fill="#012169"/>' +
    '<path d="M0,0 60,30 M60,0 0,30" stroke="#fff" stroke-width="6"/>' +
    '<path d="M0,0 60,30 M60,0 0,30" stroke="#C8102E" stroke-width="2"/>' +
    '<path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/>' +
    '<path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6"/>' +
    '</svg>'

  var dict = {
    tr: {
      brand: 'Balık Yapboz Yardımcısı',
      navPlay: 'Oyna',
      navHowTo: 'Nasıl oynanır?',
      navRules: 'Kurallar',
      navCalendar: 'Takvim',
      navAbout: 'Hakkımızda',
      navContact: 'İletişim',
      footerNote: 'Bağımsız hayran projesi. Metin2 / Gameforge ile resmi bağlantısı yoktur.',
      terms: 'Terms',
      privacy: 'Privacy',
      cookies: 'Cookie Policy',
      contact: 'Contact',
      calendar: 'Calendar',
    },
    en: {
      brand: 'Fish Jigsaw Helper',
      navPlay: 'Play',
      navHowTo: 'How to',
      navRules: 'Rules',
      navCalendar: 'Calendar',
      navAbout: 'About',
      navContact: 'Contact',
      footerNote: 'Independent fan project. Not affiliated with Metin2 or Gameforge.',
      terms: 'Terms',
      privacy: 'Privacy',
      cookies: 'Cookie Policy',
      contact: 'Contact',
      calendar: 'Calendar',
    },
  }

  function lookup(lang, key) {
    if (window.PAGE_I18N && window.PAGE_I18N[lang] && window.PAGE_I18N[lang][key] != null) {
      return window.PAGE_I18N[lang][key]
    }
    if (dict[lang] && dict[lang][key] != null) return dict[lang][key]
    return null
  }

  function getLang() {
    var q = new URLSearchParams(location.search).get('lang')
    if (q === 'tr' || q === 'en') {
      localStorage.setItem(KEY, q)
      return q
    }
    var s = localStorage.getItem(KEY)
    return s === 'en' ? 'en' : 'tr'
  }

  function paintFlags() {
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      var which = btn.getAttribute('data-lang-btn')
      btn.innerHTML = which === 'en' ? FLAG_EN : FLAG_TR
      btn.setAttribute('aria-label', which === 'en' ? 'English' : 'Türkçe')
      btn.setAttribute('title', which === 'en' ? 'English' : 'Türkçe')
    })
  }

  function apply(lang) {
    document.documentElement.lang = lang
    document.title = lookup(lang, 'docTitle') || document.title
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n')
      var val = lookup(lang, k)
      if (val == null) return
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = val
      else el.textContent = val
    })
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === lang)
    })
    window.dispatchEvent(new CustomEvent('fj-lang', { detail: lang }))
  }

  function setLang(lang) {
    localStorage.setItem(KEY, lang)
    apply(lang)
  }

  window.FJLang = { get: getLang, set: setLang, apply: apply }

  document.addEventListener('DOMContentLoaded', function () {
    paintFlags()
    apply(getLang())
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-lang-btn'))
      })
    })
  })
})()
