import $ from '../jquery.reactive.es6.js';

export function initColors() {
    // Bindeo reactivo
    $('#color-box-pura').reactive('colorFondo').css('background-color');
    $('#color-nombre-span').reactive('colorNombre').text();

    // Funciones de control
    window.cambiarColorPuro = function(color) {
        const colores = {
            rojo: '#e53e3e',
            azul: '#3182ce',
            verde: '#38a169',
            aleatorio: `#${Math.floor(Math.random()*16777215).toString(16)}`
        };
        
        const colorHex = colores[color] || colores.aleatorio;
        const nombreColor = color.charAt(0).toUpperCase() + color.slice(1);
        
        $.state({
            colorFondo: colorHex,
            colorNombre: nombreColor === 'Aleatorio' ? `Aleatorio: ${colorHex}` : nombreColor
        });
        
        agregarMensajePura(`Color cambiado a: ${nombreColor}`, 'info');
    }
}