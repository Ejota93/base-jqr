import $ from '../jquery.reactive.es6.js';

// Ejemplo 15: Emisión de eventos con $.dispatch y escucha cross-módulo
export function initDispatch() {
  const $root = $('#dispatch-root');
  if (!$root.length) return;

  const $inc = $('#dispatch-inc');
  const $dec = $('#dispatch-dec');
  const $reset = $('#dispatch-reset');

  if ($inc.length) {
    $inc.on('click', (e) => {
      e.preventDefault();
      $.dispatch(document, 'contador-inc', { step: 1, source: 'dispatch-card' });
      if (typeof window.agregarMensajePura === 'function') {
        window.agregarMensajePura('Emitido evento contador-inc desde Dispatch', 'info');
      }
    });
  }

  if ($dec.length) {
    $dec.on('click', (e) => {
      e.preventDefault();
      $.dispatch(document, 'contador-dec', { step: 1, source: 'dispatch-card' });
      if (typeof window.agregarMensajePura === 'function') {
        window.agregarMensajePura('Emitido evento contador-dec desde Dispatch', 'info');
      }
    });
  }

  if ($reset.length) {
    $reset.on('click', (e) => {
      e.preventDefault();
      $.dispatch(document, 'contador-reset');
      if (typeof window.agregarMensajePura === 'function') {
        window.agregarMensajePura('Emitido evento contador-reset desde Dispatch', 'warn');
      }
    });
  }
}