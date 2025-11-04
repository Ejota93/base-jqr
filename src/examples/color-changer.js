import $ from '../jquery.reactive.es6.js';

export function initColorChanger() {
  setInterval(() => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    $.state('color', randomColor);
  }, 2000);

  $.watch('color', (newValue) => {
    console.log(`[Color Changer Module] El color ahora es: ${newValue}`);
  });
}