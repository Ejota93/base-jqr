import $ from '../jquery.reactive.es6.js';

export function initMap() {
  // Input two-way para nivel
  const $nivel = $('#map-nivel');
  const $label = $('#map-label');
  const $barra = $('#map-bar');
  const $colorBox = $('#map-color-box');
  const $state = $('#map-state');

  // Two-way binding del input range
  $nivel.reactive('mapDemo.nivel').val();

  // Mapea número -> string "Nivel: X" para mostrar
  $label.reactive('mapDemo.nivel')
    .map(n => `Nivel: ${Math.round(Number(n) || 0)}`)
    .text();

  // Mapea número -> porcentaje de ancho
  $barra.reactive('mapDemo.nivel')
    .map(n => `${Math.max(0, Math.min(100, Number(n) || 0))}%`)
    .css('width');

  // Mapea número -> color de fondo
  $colorBox.reactive('mapDemo.nivel')
    .map(n => {
      const val = Math.max(0, Math.min(100, Number(n) || 0));
      const r = 255 - Math.floor((val / 100) * 200);
      const g = 240 - Math.floor((val / 100) * 200);
      const b = 240;
      return `rgb(${r}, ${g}, ${b})`;
    })
    .css('background-color');

  // Mostrar estado crudo (sin map) para comparar
  $state.reactive('mapDemo.nivel').text();
}