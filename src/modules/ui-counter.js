// Usar jQuery puro con la API pública de jquery.reactive.js
$(function() {
  const $inc = $('#btn-inc');
  const $dec = $('#btn-dec');
  const $reset = $('#btn-reset');

  // Bind visual del contador con jQuery
  $('#counter-display').reactive('contador').text();

  $inc.on('click', function() {
    const current = $.state('contador') ?? 0;
    $.state('contador', Number(current) + 1);
  });

  $dec.on('click', function() {
    const current = $.state('contador') ?? 0;
    $.state('contador', Number(current) - 1);
  });

  $reset.on('click', function() {
    $.state('contador', 0);
  });
});