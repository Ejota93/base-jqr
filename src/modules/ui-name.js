import Reactive, { state } from '../reactive-singleton.js';

// Módulo UI: input de nombre con binding bidireccional
window.addEventListener('DOMContentLoaded', () => {
  const $ = window.jQuery || window.$;
  if (!$) {
    console.error('[ui-name] jQuery no está disponible');
    return;
  }

  // Usar jQuery puro con la API pública de jquery.reactive.js
  $(function() {
    const $input = $('#name-input');
    const $output = $('#name-output');
    const $clear = $('#btn-clear-name');
  
    // Bind visual y two-way binding con jQuery
    $input.reactive('nombre').val();
    $output.reactive('nombre').text();
  
    // Botón limpiar
    $clear.on('click', function() {
      $.state('nombre', '');
    });
  });
});