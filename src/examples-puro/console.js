import $ from '../jquery.reactive.es6.js';

export function initConsole() {
    // Bindeo reactivo
    $('#consola-pura').reactive('consolaHtml').html();

    // Funciones de control
    window.limpiarConsolaPura = function() {
        $.state('consolaHtml', '<div class="console-line console-info">Consola limpiada</div>');
    }
    
    window.mostrarEstadoPuro = function() {
        const estado = $.state();
        agregarMensajePura('Estado completo:', 'info');
        agregarMensajePura(JSON.stringify(estado, null, 2), 'info');
    }

    window.agregarMensajePura = function(mensaje, tipo = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const clase = `console-${tipo}`;
        const linea = `<div class="console-line ${clase}">[${timestamp}] ${mensaje}</div>`;
        
        const consolaActual = $.state('consolaHtml');
        $.state('consolaHtml', consolaActual + linea);
        
        // Auto-scroll
        setTimeout(() => {
            $('#consola-pura').scrollTop($('#consola-pura')[0].scrollHeight);
        }, 100);
    }
}