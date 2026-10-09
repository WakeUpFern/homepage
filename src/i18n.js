import es from './i18n/es.json';
import en from './i18n/en.json';
import { LANGS, DEFAULT_LANG } from './config.js';

const DICTS = { es, en };
const STORAGE_KEY = 'lang';
const events = new EventTarget();

let lang = DEFAULT_LANG;

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* sin almacenamiento: el idioma solo dura la sesión */
  }
}

export const getLang = () => lang;

/** Busca una clave "a.b.c" en el idioma actual, con fallback a español y luego a la clave. */
export function t(key) {
  const find = (dict) => key.split('.').reduce((o, k) => o?.[k], dict);
  return find(DICTS[lang]) ?? find(DICTS[DEFAULT_LANG]) ?? key;
}

/** Resuelve un campo bilingüe `{ es, en }` de los JSON de datos. */
export function l(field) {
  if (typeof field === 'string') return field;
  return field?.[lang] ?? field?.[DEFAULT_LANG] ?? '';
}

/** Traduce los nodos estáticos del HTML (`data-i18n`, `data-i18n-aria`). */
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
}

export function initI18n() {
  const stored = readStored();
  lang = LANGS.includes(stored) ? stored : DEFAULT_LANG;
  document.documentElement.lang = lang;
  applyStatic();
}

/** @param {string} next */
export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  writeStored(next);
  document.documentElement.lang = next;
  applyStatic();
  events.dispatchEvent(new Event('change'));
}

/** @param {(lang: string) => void} cb @returns {() => void} */
export function onLangChange(cb) {
  const handler = () => cb(lang);
  events.addEventListener('change', handler);
  return () => events.removeEventListener('change', handler);
}
