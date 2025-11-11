import $ from '../jquery.reactive.es6.js';

// Ejemplo 16: Alias $.fn.reactiveList()
export function initAliasReactiveList() {
  const $container = $('#alias-list');
  if (!$container.length) return;

  // Estado inicial para la demo
  $.ensure({ 'aliasList.items': [
    { id: 1, text: 'Manzana' },
    { id: 2, text: 'Banana' },
    { id: 3, text: 'Naranja' },
  ]});

  // Render simple: cada item como tarjeta pequeña
  function renderItem(item) {
    return `<div class="task-item" data-id="${item.id}">
      <span>${item.text}</span>
      <button class="btn-eliminar" data-ref="del">❌</button>
    </div>`;
  }

  // Usar el alias sobre la clave
  $container.reactiveList('aliasList.items', renderItem, {
    key: 'id',
    placeholder: '<p style="text-align:center;color:#718096;">Lista vacía</p>'
  });

  // Wiring de acciones
  const $add = $('#alias-add');
  const $shuffle = $('#alias-shuffle');
  const $clear = $('#alias-clear');

  $add.on('click', (e) => {
    e.preventDefault();
    const items = $.state('aliasList.items') || [];
    const id = Date.now();
    const nombre = `Item ${items.length + 1}`;
    $.state('aliasList.items', (prev) => [...(prev || []), { id, text: nombre }]);
  });

  $shuffle.on('click', (e) => {
    e.preventDefault();
    const items = [...($.state('aliasList.items') || [])];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    $.state('aliasList.items', items);
  });

  $clear.on('click', (e) => {
    e.preventDefault();
    $.state('aliasList.items', []);
  });

  // Delegación para eliminar items (click en ❌)
  $.events($container, 'click', '.btn-eliminar', (e) => {
    e.preventDefault();
    const $item = $(e.target).closest('.task-item');
    const id = Number($item.data('id'));
    $.state('aliasList.items', (prev) => (prev || []).filter(it => it.id !== id));
  });
}