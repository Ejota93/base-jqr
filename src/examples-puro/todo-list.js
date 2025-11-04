import $ from '../jquery.reactive.es6.js';

function renderTarea(tarea) {
    return `
        <div class="task-item fade-in" data-id="${tarea.id}">
            <span>${tarea.texto}</span>
            <button onclick="eliminarTareaPura(${tarea.id})" class="btn-eliminar">❌</button>
        </div>
    `;
}

export function initTodoList() {
    // Bindeo reactivo
    $('#contenedor-tareas').reactive('tareas').list(renderTarea, { 
        key: 'id',
        placeholder: '<p style="text-align: center; color: #718096;">No hay tareas</p>'
    });
    $('#total-tareas-span').reactive('totalTareas').text();

    // Funciones de control
    window.agregarTareaPura = function() {
        const tareaTexto = $('#input-nueva-tarea').val().trim();
        if (tareaTexto) {
            const nueva = { id: Date.now(), texto: tareaTexto };
            $.state('tareas', prev => [...(prev || []), nueva]);
            
            $('#input-nueva-tarea').val('');
            agregarMensajePura(`Tarea agregada: "${tareaTexto}"`, 'info');
        }
    }
    
    window.eliminarTareaPura = function(id) {
        const tareas = $.state('tareas');
        const tarea = tareas.find(t => t.id === id);
        
        if (tarea) {
            $.state('tareas', prev => prev.filter(t => t.id !== id));
            agregarMensajePura(`Tarea eliminada: "${tarea.texto}"`, 'warn');
        }
    }
}