import $ from '../jquery.reactive.es6.js';

// Ejemplo 8: Uso de binder.on(event, handler, opts)
export function initEventsOn() {
  // Inicializar estado local del ejemplo
  $.ensure({ 'onDemo.contador': 0 });

  // Wiring de UI
  const $display = $('#on-demo-display');
  const $state = $('#on-demo-state');
  const $inc = $('#on-demo-inc');
  const $dec = $('#on-demo-dec');
  const $reset = $('#on-demo-reset');

  // Mostrar el valor inicial y suscribirse a futuros cambios
  if ($display.length) {
    $display.reactive('onDemo.contador').text();
  }
  if ($state.length) {
    $state.reactive('onDemo.contador').text();
  }

  // Botones con ergonomía: prevent y once
  if ($inc.length) {
    $inc.reactive('onDemo.contador').on('click', () => {
      $.state('onDemo.contador', c => (typeof c === 'number' ? c + 1 : 1));
    }, { prevent: true });
  }

  if ($dec.length) {
    $dec.reactive('onDemo.contador').on('click', () => {
      $.state('onDemo.contador', c => (typeof c === 'number' ? c - 1 : -1));
    }, { prevent: true });
  }

  if ($reset.length) {
    // Ejemplo de once: se ejecuta solo la primera vez
    $reset.reactive('onDemo.contador').on('click', () => {
      $.state('onDemo.contador', 0);
    }, { prevent: true});
  }
}