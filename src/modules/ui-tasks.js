// Módulo de lista de tareas usando jQuery y la API reactiva
$(function() {
  const $input = $('#task-input');
  const $add = $('#task-add');
  const $list = $('#task-list');

  // Renderizar la lista reactiva basada en el estado 'tasks'
  // Cada tarea tiene un id único, texto y estado de completado
  $list.reactive('tasks').list(function(task) {
    const checked = task.completed ? 'checked' : '';
    const safeText = String(task.text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `
      <div class="task-item" data-id="${task.id}" style="display:flex; align-items:center; gap:8px; padding:8px; border:1px solid #e2e8f0; border-radius:8px; margin:6px 0;">
        <input type="checkbox" class="task-check" ${checked} />
        <span class="task-text${task.completed ? ' completed' : ''}" style="flex:1; ${task.completed ? 'text-decoration: line-through; color:#718096;' : ''}">${safeText}</span>
        <button class="btn btn-del" style="padding:6px 10px; border:1px solid #cbd5e0; background:#fff; border-radius:6px; cursor:pointer;">Eliminar</button>
      </div>`;
  }, { 
    key: 'id', 
    placeholder: '<p style="text-align:center; color:#718096;">No hay tareas aún</p>'
  });

  // Observa cambios para mantener un contador de tareas
  $.watch('tasks', function(tasks) {
    $.state('totalTareas', (tasks || []).length);
  });

  // Agregar nueva tarea
  function addTask() {
    const text = $input.val().trim();
    if (!text) return;
    const id = Date.now();
    $.state('tasks', function(tasks) {
      tasks = tasks || [];
      return [...tasks, { id, text, completed: false }];
    });
    $input.val('');
  }

  $add.on('click', addTask);
  $input.on('keypress', function(e) {
    if (e.which === 13) addTask();
  });

  // Delegación para eliminar tarea
  $list.on('click', '.btn-del', function() {
    const id = $(this).closest('.task-item').data('id');
    $.state('tasks', function(tasks) {
      tasks = tasks || [];
      return tasks.filter(t => t.id !== id);
    });
  });

  // Delegación para marcar como completada
  $list.on('change', '.task-check', function() {
    const id = $(this).closest('.task-item').data('id');
    const completed = $(this).is(':checked');
    $.state('tasks', function(tasks) {
      tasks = tasks || [];
      return tasks.map(t => t.id === id ? { ...t, completed } : t);
    });
  });
});