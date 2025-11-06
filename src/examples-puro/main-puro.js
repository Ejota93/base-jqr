import $ from '../jquery.reactive.es6.js';
import { initCounter } from './counter.js';
import { initForm } from './form.js';
import { initTodoList } from './todo-list.js';
import { initToggle } from './toggle.js';
import { initColors } from './colors.js';
import { initConsole } from './console.js';
import { initNamespaces } from './namespaces.js';
import { initEventsOn } from './events-on.js';
import { initMap } from './map.js';
import { initRefs } from './refs.js';

window.$ = $;

$(function() {
    console.log('🚀 Iniciando demo con sintaxis ES6 y módulos...');
    
    // Inicializar estados
    $.reactiveInit({
        contador: 0,
        nombre: 'Invitado',
        email: 'No proporcionado',
        edad: 'No especificada',
        tareas: [],
        totalTareas: 0,
        visible: true,
        modoOscuro: false,
        estadoVisible: 'Visible',
        colorFondo: '#3498db',
        colorNombre: 'Azul',
        consolaHtml: '<div class="console-line console-info">Consola iniciada - ¡Hola ES6 con módulos!</div>',
        'mapDemo.nivel': 25,
        // Estado inicial para demo de $.refs (los defaults se establecen dentro del módulo con $.ensure)
    });
    
    // Inicializar módulos de ejemplos
    initCounter();
    initForm();
    initTodoList();
    initToggle();
    initColors();
    initConsole();
    initNamespaces();
    initEventsOn();
    initMap();
    initRefs();

    // Watchers globales
    $.watch('tareas', function(tareas) {
        $.state('totalTareas', tareas ? tareas.length : 0);
    });

    $.watch(function(newVal, oldVal, key) {
        if (key === 'contador') {
            agregarMensajePura(`Contador: ${oldVal ?? 0} → ${newVal}`, 'info');
        }
    });
    
    console.log('✅ Demo inicializada con sintaxis ES6 y módulos');

    // Demo 7: Namespaces ahora modularizado en src/examples-puro/namespaces.js
});