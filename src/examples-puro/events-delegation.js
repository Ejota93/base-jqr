import $ from '../jquery.reactive.es6.js';

// Ejemplo 14: Delegación de eventos con $.events()
export function initEventsDelegation() {
  // Defaults de estado para el ejemplo

  const evDemo = $.namespace('evDemo');

  evDemo.ensure({
    'count': 0, 
    'highlight': false
  });

  const $root = $('#events-root');
  const $unit = $('#events-unit');

  // Salidas reactivas

  evDemo.count('#ev-count-display').text();
  evDemo.count('#ev-count-state').text();
  evDemo.highlight('.ev-item').toggleClass('highlight');

  // $('#ev-count-display').reactive('evDemo.count').text();
  // $('#ev-count-state').reactive('evDemo.count').text();
  // $('.ev-item').reactive('evDemo.highlight').toggleClass('highlight');

  // 1) Uso unitario: registrar un evento puntual
  if ($unit.length) {
    // Incrementar con prevent
    $.events($unit, 'click', '#ev-inc', (e) => {
      evDemo.count.set(c => (typeof c === 'number' ? c + 1 : 1));
    }, { prevent: true });

    // Decrementar con prevent
    $.events($unit, 'click', '#ev-dec', (e) => {
      evDemo.count.set(c => (typeof c === 'number' ? c - 1 : -1));
    }, { prevent: true });

    // Reset once
    $.events($unit, 'click #ev-reset', (e) => {
      evDemo.count.set(0);
    }, { prevent: true, once: false });
  }

  // 2) Uso con mapa: wiring declarativo con un único listener por tipo
  if ($root.length) {
    const cleanup = $.events($root, {
      'click #ev-toggle-hl': (e) => {
        evDemo.highlight.set(v => !v);
      },
      'click .ev-item': (e, $el) => {
        // Simular selección del item: resaltar momentáneo con throttle
        $el.addClass('highlight');
        setTimeout(() => $el.removeClass('highlight'), 300);
      }
    }, { prevent: true, throttle: 0 });

    // Guardar cleanup si quieres desmontar dinámicamente (no usado en la demo)
    window.__ev_cleanup = cleanup;
  }
}