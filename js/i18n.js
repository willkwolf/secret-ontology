/**
 * i18n.js — Lightweight internationalisation helper
 * Supports: es (default), en
 * Usage: import { t, setLang, getLang } from './i18n.js';
 */

let _strings = {};
let _lang = 'es';

/**
 * Load i18n strings from data/i18n.json.
 * @param {string} lang - 'es' | 'en'
 */
export async function loadStrings(lang = 'es') {
  const res = await fetch('data/i18n.json');
  const all = await res.json();
  _strings = all[lang] || all['es'];
  _lang = lang;
  document.documentElement.lang = lang;
}

/**
 * Get a nested translation key, e.g. t('nav.title')
 * @param {string} key - dot-separated path
 * @returns {string}
 */
export function t(key) {
  const parts = key.split('.');
  let val = _strings;
  for (const p of parts) {
    if (val == null) return key;
    val = val[p];
  }
  return val ?? key;
}

export function getLang() { return _lang; }

export function setLang(lang) { return loadStrings(lang); }
