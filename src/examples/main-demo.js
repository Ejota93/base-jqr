import $ from '../jquery.reactive.es6.js';
import { initCounter } from './counter.js';
import { initTextInput } from './text-input.js';
import { initColorChanger } from './color-changer.js';

$(function() {
  console.log('DOM listo y jQuery reactivo funcionando en la demo ES6!');

  // 1. Inicializar el estado global
  $.reactiveInit({
    count: 100,
    text: 'Demo ES6',
    visible: true,
    color: '#ff0000'
  });

  // 2. Inicializar los módulos de ejemplo
  initCounter();
  initTextInput();
  initColorChanger();
});