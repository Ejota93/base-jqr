import $ from '../jquery.reactive.es6.js';

export function initColors() {

  const colorNS = $.namespace('color');
  // Defaults en el namespace
  colorNS.ensure({
    colorSeleccion: 'Verde',
    colorFondo: '#38a169',
    colorNombre: 'Verde',
  });

    const { cambiarColor } = $.refs('#refs-colors');

    // Bindeo reactivo
    $('#color-box-pura').reactive(colorNS.colorFondo).css('background-color');
    $('#color-nombre-span').reactive(colorNS.colorNombre).text();

    // Derivar el nombre mostrado a partir de la selección y el color calculado
    $.computed(colorNS.colorNombre, [colorNS.colorSeleccion, colorNS.colorFondo], (sel, hex) => {
        const nombre = (sel || '').charAt(0).toUpperCase() + (sel || '').slice(1);
        return sel === 'aleatorio' ? `Aleatorio: ${hex}` : (nombre || 'Desconocido');
    });

    cambiarColor.on('click', (e) => {
        const color = $(e.target).data('color');
        cambiarColorPuro(color);
    });

    // Funciones de control
    const cambiarColorPuro = function(color) {
        const colores = {
            rojo: '#e53e3e',
            azul: '#3182ce',
            verde: '#38a169',
            aleatorio: `#${Math.floor(Math.random()*16777215).toString(16)}`
        };
        
        const colorHex = colores[color] || colores.aleatorio;
        const nombreColor = color.charAt(0).toUpperCase() + color.slice(1);

        // Actualiza la clave seleccionada y el color de fondo; el nombre derivado se calcula con $.computed

        // colorNS.colorSeleccion.set(color);
        // colorNS.colorFondo.set(colorHex);

        $.state({
            [colorNS.colorSeleccion]: color,
            [colorNS.colorFondo]: colorHex
        });

        agregarMensajePura(
            `Color cambiado a: ${color === 'aleatorio' ? `Aleatorio (${colorHex})` : nombreColor}`,
            'info'
        );
    }
}