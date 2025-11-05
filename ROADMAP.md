# jQuery Reactive State — Roadmap Imperativo

Filosofía: mantener el HTML limpio y que todo el wiring sea imperativo en JS, con una API encadenable al estilo jQuery ("jQuery con esteroides"). Evitamos parsers de expresiones y ciclos de vida complejos; priorizamos pequeñas utilidades ergonómicas que compongan bien con el núcleo existente.

## Principios
- HTML sin atributos mágicos; bindings desde JS con `$(el).reactive('key').…`.
- Estado global simple, suscripciones por clave y render batched.
- Azúcar sintáctico que suma ergonomía sin sobrecargar el core.
- Compatibilidad hacia atrás con la API actual.

## Fase 1 — Ergonomía básica del binder

Objetivo: añadir utilidades mínimas que cubren el 80% de casos comunes.

- API: `on(event, handler, opts)`
  - Uso: `$('#btn').reactive('contador').on('click', () => $.state('contador', c => c + 1), { prevent: true, stop: true, once: true })`
  - Implementación: envolver `this.$el.on`, aplicando `preventDefault`, `stopPropagation` y `once` si están en `opts`.
  - Criterios: funciona con múltiples eventos, limpia en `unbind()`.

- API: `map(fn)`
  - Uso: `$('#label').reactive('nivel').map(n => 'Nivel: ' + n).text()`
  - Implementación: almacenar transform en el binder; todos los métodos de render (`text`, `html`, `css`, etc.) aplican `fn(valor)` antes.
  - Criterios: cadena de llamadas estable, no rompe métodos existentes.

- API: `$.nextTick(cb)`
  - Uso: `$.state('open', true); $.nextTick(() => medirLayout())`
  - Implementación: `Promise.resolve().then(cb)` o enganchar al scheduler de render.
  - Criterios: se ejecuta después del batch actual de render.

- API: `$.refs(root)`
  - Uso: `const { nombre, email } = $.refs(document)`
  - Implementación: devolver objeto con `[data-ref]` → elemento.
  - Criterios: rápido, sin dependencias externas.

## Fase 2 — Montaje condicional y estructura ligera

- API: `mount(renderFn)`
  - Uso: `$('#slot').reactive('visible').mount(() => $('<div class="panel">Panel</div>'))`
  - Implementación: suscribirse a una clave booleana; cuando `true`, insertar el nodo; cuando `false`, limpiar el contenedor. Mantener idempotencia y limpieza en `unbind()`.
  - Criterios: sin memory leaks, compatible con eventos.

- API: `$.controller(root, setup)`
  - Uso: `$.controller($('#perfil'), ({ $, refs, state, watch }) => { /* wiring imperativo */ })`
  - Implementación: helper que provee utilidades (`$`, `refs`, `state`, `watch`), ejecuta `setup` y opcionalmente devuelve `cleanup`.
  - Criterios: no crea componentes ni estados locales; solo organiza wiring.

- API: `dispatch(eventName, detail)` (azúcar)
  - Uso: `$('#btn').reactive('contador').dispatch('ui:clicked', { id: 1 })`
  - Implementación: envolver `this.$el.trigger(eventName, detail)`.
  - Criterios: interoperable con `$(document).on(...)`.

## Fase 3 — Utilidades de datos

- API: `$.computed(key, deps, computeFn)`
  - Uso: `$.computed('label', ['nivel'], (n) => 'Nivel: ' + n)`
  - Implementación: sobre `$.watch`, recalcular y setear `key` cuando cambien `deps`.
  - Criterios: soporta 1..N dependencias, evita bucles (documentar mejores prácticas).

- Alias: `$.fn.reactiveList(key, render, options)`
  - Uso: `$('#lista').reactiveList('items', (it) => $('<li>').text(it), { key: 'id' })`
  - Implementación: alias fino sobre `.list()` para permitir uso sin binder.
  - Criterios: sin duplicar lógica, solo azúcar.

## Fase 4 — Puentes opcionales (declarativo mínimo, vía JS)

- Meta: no añadir nuevas directivas HTML; proporcionar equivalentes JS para casos típicos.
- Ejemplos: helpers complementarios para quienes migran desde atributos, sin imponerlos.

## No‑Objetivos (para mantener la ligereza)
- Sin evaluador de expresiones inline (tipo `count++` en atributos).
- Sin sistema de componentes con estado local y contexto anidado.
- Sin transiciones JS multi‑fase; usar CSS/JS plain si se necesita.
- Sin template engine ni interpolación `{{ ... }}`.
- Sin `x-for` declarativo; listas via render functions.

## Sketch de APIs (referencia rápida)

```js
// Fase 1
$(el).reactive('key')
  .map(v => transform(v))
  .text();

$(btn).reactive('contador').on('click', () => $.state('contador', c => c + 1), { prevent: true });

$.nextTick(() => consola.log('render completado'));
const refs = $.refs(document); refs.nombre.focus();

// Fase 2
$(slot).reactive('visible').mount(() => $('<div class="panel">Panel</div>'));
$(btn).reactive('contador').dispatch('ui:clicked', { id: 1 });

$.controller($('#perfil'), ({ $, refs, state, watch }) => {
  $(refs.nombre).reactive('nombre').val();
  watch('nombre', (n) => consola.log(n));
});

// Fase 3
$.computed('label', ['nivel'], (n) => `Nivel: ${n}`);
$('#lista').reactiveList('items', (it) => $('<li>').text(it), { key: 'id' });
```

## Criterios de Aceptación por Fase
- Tests manuales con los ejemplos anteriores funcionan en los demos existentes.
- `unbind()` limpia suscripciones/eventos asociados a nuevas APIs.
- Sin romper firma de métodos existentes; cambios son aditivos.
- Documentación extendida en README con sección “Imperativo Avanzado”.

## Compatibilidad y Migración
- Todo es opcional y compatible hacia atrás.
- No se requieren atributos `st-*`; se mantiene como estilo alternativo.
- Migración sugerida: extraer wiring al JS con el binder y utilidades.

## Estimación y Orden
- Fase 1: corta (0.5–1 día)
- Fase 2: corta/media (1–2 días)
- Fase 3: corta (0.5–1 día)
- Fase 4: opcional, sólo documentación y helpers mínimos

## Notas
- Mantener ejemplos en `README.md` y demos en `demo-jquery-puro.html` para validar.
- Añadir una sección “Best Practices” para computed/transformaciones evitando bucles.