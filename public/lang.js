/* Shared TR/EN for static HTML pages */
(function () {
  var KEY = 'fj-lang'
  var dict = {
    tr: {
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

  function getLang() {
    var q = new URLSearchParams(location.search).get('lang')
    if (q === 'tr' || q === 'en') {
      localStorage.setItem(KEY, q)
      return q
    }
    var s = localStorage.getItem(KEY)
    return s === 'en' ? 'en' : 'tr'
  }

  function apply(lang) {
    document.documentElement.lang = lang
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n')
      var t = (dict[lang] && dict[lang][k]) || (window.PAGE_I18N && window.PAGE_I18N[lang] && window.PAGE_I18N[lang][k])
      if (t != null) el.textContent = t
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
    apply(getLang())
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-lang-btn'))
      })
    })
  })
})()
