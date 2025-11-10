import $ from '../jquery.reactive.es6.js';

// Módulo de demostración: Montaje condicional con binder.mount(renderFn)
export function initMount() {
  const mountNS = $.namespace('mountDemo');
  // Asegurar defaults sólo si no existen
  mountNS.ensure(
    { 
      visible: true, 
      title: 'Panel montado', 
      count: 0 
    });

  const $slot = $('#mount-slot');

  if ($slot.length) {
    mountNS.visible($slot).mount(() => {
      const $panel = $('<div class="reactive-element fade-in"></div>');
      $('<div class="card-title" style="font-size:1.1rem;margin-bottom:10px;"></div>')
        .text(mountNS.get('title'))
        .appendTo($panel);

      const $name = $('<div class="reactive-element" style="margin:8px 0;"></div>').appendTo($panel);
      mountNS.title($name).text();

      const $countBox = $('<div class="state-display"><span id="mount-count-span">0</span></div>').appendTo($panel);
      const $countSpan = $countBox.find('#mount-count-span');
      mountNS.count($countSpan)
      .map((e)=> `Counts: ${e}`)
      .text();

      const $btnInc = $('<button class="btn" style="margin-top:10px;">Incrementar</button>').appendTo($panel);
      mountNS.count($btnInc).on('click', () => mountNS.count.set(c => (c || 0) + 1), { prevent: true });

      return $panel;
    });
  }

  const $btnShow = $('#btn-mount-show');
  const $btnHide = $('#btn-mount-hide');
  const $btnToggle = $('#btn-mount-toggle');
  if ($btnShow.length) {
    mountNS.visible($btnShow).on('click', () => mountNS.visible.set(true), { prevent: true });
  }
  if ($btnHide.length) {
    mountNS.visible($btnHide).on('click', () => mountNS.visible.set(false), { prevent: true });
  }
  if ($btnToggle.length) {
    mountNS.visible($btnToggle).on('click', () => mountNS.visible.set(v => !v), { prevent: true });
  }

  const $state = $('#mount-state');
  if ($state.length) {
    mountNS.visible($state).map(v => v ? 'true' : 'false').text();
  }
}