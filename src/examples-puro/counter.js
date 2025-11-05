import $ from '../jquery.reactive.es6.js';

// Módulo ES: sin contaminar window. Todo queda encapsulado aquí.
export function initCounter() {
  // 1) Enlazar el estado "contador" a la UI
  $('#contador-display').reactive('contador').text();
  $('#contador-estado').reactive('contador').text();

  // 2) Localizar los botones del card del contador (usando jQuery)
  const $display = $('#contador-display');
  if ($display.length === 0) return; // si no existe el display, no hacemos nada
  const $card = $display.closest('.card');
  if ($card.length === 0) return; // si no existe el card, no hacemos nada
  const $buttons = $card.find('.btn-group button');

  // 3) Acciones: modificar el estado de forma simple
  const inc = () => $.state('contador', $.state('contador') + 1);
  const dec = () => $.state('contador', $.state('contador') - 1);
  const reset = () => $.state('contador', 0);

  // 4) Quitar handlers inline y agregar listeners con jQuery (sin usar globals)
  $buttons.eq(0).removeAttr('onclick').on('click', inc);
  $buttons.eq(1).removeAttr('onclick').on('click', dec);
  $buttons.eq(2).removeAttr('onclick').on('click', reset);
}