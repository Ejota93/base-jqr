// ES Module facade over the jQuery ReactiveState singleton
// This module exports a stable interface that forwards to the single
// instance provided by jquery.reactive.js, ensuring shared state across imports.

// Assumes jQuery and jquery.reactive.js are loaded globally before this module.
// If not, it will throw a descriptive error.

function ensureReady() {
  if (typeof window === 'undefined') {
    throw new Error('[reactive-singleton] Must run in a browser environment');
  }
  const $ = window.jQuery || window.$;
  if (!$) {
    throw new Error('[reactive-singleton] jQuery is not available on window');
  }
  // La librería expone API global vía $.state, $.watch, $.render, $.reactiveInit
  if (typeof $.state !== 'function' || typeof $.reactiveInit !== 'function') {
    throw new Error('[reactive-singleton] jquery.reactive.js API not loaded');
  }
  return $;
}

// Lightweight facade functions that forward to the singleton
export function init(initialState = {}) {
  const $ = ensureReady();
  $.reactiveInit(initialState);
}

export function state(key, value) {
  const $ = ensureReady();
  return $.state(key, value);
}

export function watch(key, callback) {
  const $ = ensureReady();
  return $.watch(key, callback);
}

export function render(key) {
  const $ = ensureReady();
  $.render(key);
}

export function configure(options) {
  const $ = ensureReady();
  // jquery.reactive.js define $.reactiveConfig
  if (typeof $.reactiveConfig === 'function') {
    $.reactiveConfig(options);
  } else {
    console.warn('[reactive-singleton] $.reactiveConfig no está disponible');
  }
}

export function reset() {
  const $ = ensureReady();
  // jquery.reactive.js define $.reactiveReset
  if (typeof $.reactiveReset === 'function') {
    $.reactiveReset();
  } else {
    console.warn('[reactive-singleton] $.reactiveReset no está disponible');
  }
}

// Lower-level accessors from the underlying singleton (fallback a la API pública)
export function get(key) {
  const $ = ensureReady();
  return $.state(key);
}

export function set(key, value, silent = false) {
  const $ = ensureReady();
  if (silent) {
    // No hay API pública para silent; aplicamos set directo sin render adicional
    $.state(key, value);
  } else {
    $.state(key, value);
  }
}

export function setMany(obj, silent = false) {
  const $ = ensureReady();
  // La API pública permite pasar objeto a $.state
  $.state(obj);
}

export function subscribe(key, cb) {
  const $ = ensureReady();
  // No hay $.subscribe público; usamos $.watch para clave específica
  if (typeof key === 'string' && typeof cb === 'function') {
    $.watch(key, cb);
    // Devolver un no-op unsubscribe para compatibilidad
    return () => {};
  }
  return () => {};
}

export function renderAll() {
  const $ = ensureReady();
  $.render();
}

export function configurePrefix(prefix = 'st-') {
  configure({ prefix });
}

// Default export: grouped API for convenience
const Reactive = {
  init,
  state,
  watch,
  render,
  renderAll,
  configure,
  configurePrefix,
  reset,
  get,
  set,
  setMany,
  subscribe,
};

export default Reactive;