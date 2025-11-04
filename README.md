# jQuery Reactive State Library

Una mini biblioteca de estados reactivos para jQuery con dos estilos de uso:
- Atributos HTML tipo `st-*` (declarativo)
- API jQuery pura (imperativo, sin atributos mágicos)

Ambos comparten el mismo motor de estado y `$.watch()` para observar cambios.

## Instalación

### Vía CDN
```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="src/jquery.reactive.js"></script>
```

### Vía NPM (opcional en tu proyecto)
```bash
npm install jquery-reactive-state
```

## Conceptos Básicos

- `$.reactiveInit(initialState)`: inicializa el estado global.
- `$.state(key?)`: obtiene todo el estado o una clave.
- `$.state(key, value)` / `$.state(object)`: actualiza estado (uno o varios valores).
- Soporte de updater functions: `$.state('clave', prev => next)` y `$.state({ clave: prev => next })`.
- `$.watch(key, cb)` y `$.watch(cb)`: observa cambios de una clave o de todas.
- Render: el DOM se actualiza automáticamente con batch updates; puedes forzar con `$.render(key?)`.

---

## Updater functions (prev => next)

- Forma corta para calcular el nuevo valor a partir del anterior:
  - Una clave: `$.state('contador', prev => prev + 1)`.
  - Varias claves (mezcladas con valores directos): `$.state({ contador: p => p + 1, visible: true })`.
- Compatibilidad: activado por defecto. Si antes guardabas funciones como valor de estado, puedes desactivar esta característica con `$.reactiveConfig({ allowUpdaterFn: false })`.
- Nota importante: cuando uses `$.state({ ... })` con funciones en varias claves, cada función recibe el estado anterior de su propia clave. Si una clave depende del nuevo valor de otra dentro del mismo batch, calcula primero el valor externamente y pásalo como valor directo en el objeto.

Ejemplo seguro (dependencias cruzadas):
```javascript
const nextTareas = [...$.state('tareas'), nueva];
$.state({
  tareas: nextTareas,
  tareasHtml: nextTareas.map(x => `<li>${x}</li>`).join(''),
  totalTareas: nextTareas.length
});
```

---

## Estilo A: Atributos HTML `st-*` (Declarativo)

Permite vincular elementos directamente desde el HTML.

Atributos soportados:
- `st-text="clave"` → actualiza `textContent`
- `st-html="clave"` → actualiza `innerHTML`
- `st-value="clave"` → binding bidireccional en inputs
- `st-class="clave"` → clases dinámicas (string con clases separadas por espacio)
- `st-show="clave"` / `st-hide="clave"` → visibilidad condicional (boolean)
- `st-enabled="clave"` / `st-disabled="clave"` → habilitar/deshabilitar (boolean)
- `st-css-<prop>="clave"` → CSS dinámico (ej: `st-css-color`, `st-css-background-color`)

Ejemplo (Contador + Formulario):
```html
<!-- HTML -->
<div>
  <p>Contador: <span st-text="contador">0</span></p>
  <button onclick="$.state('contador', $.state('contador') - 1)">-</button>
  <button onclick="$.state('contador', $.state('contador') + 1)">+</button>
  <button onclick="$.state('contador', 0)">Reset</button>
</div>

<form style="margin-top:16px">
  <input type="text" st-value="nombre" placeholder="Nombre">
  <input type="email" st-value="email" placeholder="Email">
  <p>Hola <span st-text="nombre">Invitado</span>!</p>
  <p>Email: <span st-text="email">No proporcionado</span></p>
</form>

<script>
$.reactiveInit({ contador: 0, nombre: '', email: '' });
</script>
```

---

## Estilo B: API jQuery Pura (Imperativo)

Sin atributos en el HTML. Vinculas desde JavaScript usando métodos jQuery:
- `$().reactive('clave')` → inputs/textarea (bidireccional)
- `$().reactiveText('clave')` → texto
- `$().reactiveHtml('clave')` → HTML
- `$().reactiveCss(prop, 'clave')` → CSS
- `$().reactiveShow('clave')` / `$().reactiveHide('clave')` → visibilidad
- `$().reactive('clave').list(templateFn, options)` → renderizado eficiente de listas

Ejemplo (Contador + Formulario):
```html
<!-- HTML -->
<div>
  <div id="contador-display">0</div>
  <button onclick="$.state('contador', $.state('contador') - 1)">-</button>
  <button onclick="$.state('contador', $.state('contador') + 1)">+</button>
  <button onclick="$.state('contador', 0)">Reset</button>
</div>

<form style="margin-top:16px">
  <input id="input-nombre" type="text" placeholder="Nombre">
  <input id="input-email" type="email" placeholder="Email">
  <p>Hola <span id="nombre-span">Invitado</span>!</p>
  <p>Email: <span id="email-span">No proporcionado</span></p>
</form>

<script>
$.reactiveInit({ contador: 0, nombre: '', email: '' });

$('#contador-display').reactiveText('contador');
$('#input-nombre').reactive('nombre');
$('#nombre-span').reactiveText('nombre');
$('#input-email').reactive('email');
$('#email-span').reactiveText('email');
</script>
```

---

## Renderizado de Listas con `.list()`

El método `.list()` es la forma más eficiente y recomendada para renderizar listas o colecciones de datos. En lugar de reemplazar todo el `innerHTML` en cada cambio (lo que es lento y destruye el estado de los elementos), `.list()` utiliza un algoritmo de "diffing" para calcular las diferencias entre el array de datos anterior y el nuevo, y aplica solo los cambios necesarios al DOM.

**Sintaxis:**
```javascript
$('#container').reactive('myArray').list(templateFunction, { key: 'uniqueId' });
```

- `templateFunction`: una función que recibe un elemento del array y devuelve el string HTML para ese elemento.
- `options.key`: el nombre de la propiedad en tus objetos de datos que sirve como un identificador único. Esto es **crucial** para que el algoritmo de diffing funcione correctamente.

**Ejemplo (Lista de Tareas con `.list()`):**
```html
<!-- HTML -->
<ul id="task-list"></ul>

<!-- JavaScript -->
<script>
// 1. Inicializar el estado con un array vacío
$.reactiveInit({ 
  tareas: [
    { id: 1, texto: 'Aprender jQuery Reactive' },
    { id: 2, texto: 'Crear una demo increíble' }
  ]
});

// 2. Definir la función de plantilla
function renderTarea(tarea) {
  return `<li data-id="${tarea.id}">${tarea.texto}</li>`;
}

// 3. Vincular el contenedor a la lista
$('#task-list').reactive('tareas').list(renderTarea, { key: 'id' });

// 4. Para añadir un elemento, simplemente actualiza el array
function agregarTarea(texto) {
  const nuevaTarea = { id: Date.now(), texto: texto };
  $.state('tareas', prev => [...prev, nuevaTarea]);
}
</script>

**Beneficios de usar `.list()`:**
- **Rendimiento Óptimo:** Solo se tocan los elementos del DOM que realmente cambian.
- **Mantenimiento de Estado:** Los elementos que no cambian conservan su estado (por ejemplo, si tienen animaciones CSS o eventos adjuntos).
- **Código más Limpio:** No necesitas construir manualmente el HTML de la lista en un `watcher`.

---

## Ejemplos Comparativos por Caso de Uso

### 1) Contador
Atributos:
```html
<span st-text="contador">0</span>
<button onclick="$.state('contador', $.state('contador') + 1)">+</button>
```
jQuery Puro:
```javascript
$('#contador-display').reactiveText('contador');
// ...acciones con $.state('contador', ...)
```

### 2) Formulario Reactivo
Atributos:
```html
<input st-value="nombre">
<span st-text="nombre"></span>
```
jQuery Puro:
```javascript
$('#input-nombre').reactive('nombre');
$('#nombre-span').reactiveText('nombre');
```

### 3) Lista de Tareas (HTML dinámico)
Atributos:
```html
<ul st-html="tareasHtml"></ul>
<span st-text="totalTareas"></span>
```
jQuery Puro:
```javascript
$('#lista-tareas').reactiveHtml('tareasHtml');
$('#total-tareas-span').reactiveText('totalTareas');
```

### 4) Toggle de Visibilidad
Atributos:
```html
<div st-show="visible">Contenido</div>
```
jQuery Puro:
```javascript
$('#contenido').reactiveShow('visible');
```

### 5) Colores Dinámicos (CSS)
Atributos:
```html
<div class="box" st-css-background-color="colorFondo"></div>
<span st-text="colorNombre"></span>
```
jQuery Puro:
```javascript
$('#box').reactiveCss('background-color', 'colorFondo');
$('#color-nombre-span').reactiveText('colorNombre');
```

### 6) Observadores (watch)
Atributos o jQuery Puro (igual en ambos):
```javascript
$.watch('nivel', function(nuevo, anterior) {
  $.state('nivelLabel', 'Nivel: ' + nuevo);
  $.state('nivelPorcentaje', nuevo + '%');
  $.state('mensajeValidacion', nuevo >= 70 ? 'OK' : 'Revisar');
});

// Watch-all
$.watch(function(newVal, oldVal, key) {
  if (key === 'contador') console.log('Contador:', oldVal, '→', newVal);
});
```

---

### B) Ejemplos COMPLETOS con jQuery Puro

A continuación, 5 ejemplos completos (HTML + JavaScript) usando únicamente la API jQuery pura (`.reactive*`), sin atributos `st-*`.

#### 1) Contador completo (jQuery puro)
```html
<div>
  <div id="count">0</div>
  <button onclick="$.state('contador', $.state('contador') - 1)">-</button>
  <button onclick="$.state('contador', $.state('contador') + 1)">+</button>
  <button onclick="$.state('contador', 0)">Reset</button>
</div>

<script>
$.reactiveInit({ contador: 0 });
$('#count').reactiveText('contador');
</script>
```

#### 2) Formulario reactivo completo (jQuery puro)
```html
<form>
  <input id="nombre" type="text" placeholder="Nombre">
  <input id="email" type="email" placeholder="Email">
  <p>Hola <span id="nombre-out">Invitado</span>!</p>
  <p>Email: <span id="email-out">No proporcionado</span></p>
</form>

<script>
$.reactiveInit({ nombre: '', email: '' });
$('#nombre').reactive('nombre');
$('#email').reactive('email');
$('#nombre-out').reactiveText('nombre');
$('#email-out').reactiveText('email');
</script>
```

#### 3) Todo List completo (jQuery puro)
```html
<div>
  <input id="nueva" placeholder="Nueva tarea">
  <button onclick="agregar()">Agregar</button>
  <ul id="lista"></ul>
  <p>Total: <span id="total"></span></p>
</div>

<script>
$.reactiveInit({ tareas: [], tareasHtml: '', totalTareas: 0 });
$('#lista').reactiveHtml('tareasHtml');
$('#total').reactiveText('totalTareas');

function agregar() {
  const t = $('#nueva').val().trim();
  if (!t) return;
  const next = [...$.state('tareas'), t];
  $.state({
    tareas: next,
    tareasHtml: next.map(x => `<li>${x}</li>`).join(''),
    totalTareas: next.length
  });
  $('#nueva').val('');
}
</script>
```

#### 4) Toggle visibilidad completo (jQuery puro)
```html
<div>
  <button onclick="$.state('visible', !$.state('visible'))">Toggle</button>
  <div id="panel">Panel secreto</div>
</div>

<script>
$.reactiveInit({ visible: true });
$('#panel').reactiveShow('visible');
</script>
```

#### 5) Colores dinámicos completo (jQuery puro)
```html
<div>
  <input id="nivel" type="range" min="0" max="100" step="5">
  <div id="box" style="width:120px;height:60px;border-radius:8px;background:#eee"></div>
  <span id="label"></span>
</div>

<script>
$.reactiveInit({ porcentaje: 0, color: '#eeeeee', label: '0%' });
$('#nivel').reactive('porcentaje');
$('#label').reactiveText('label');
$('#box').reactiveCss('background-color', 'color');

$.watch('porcentaje', function(p) {
  const val = Math.round(p);
  const r = 255 - Math.floor((val / 100) * 200);
  const g = 240 - Math.floor((val / 100) * 200);
  const b = 240;
  const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  $.state({ color: hex, label: val + '%' });
});
</script>
```

---

## Ejemplos COMPLETOS y Copiables

### A) Todo List (Atributos `st-*`)
```html
<div>
  <input id="nuevaTarea" placeholder="Nueva tarea">
  <button onclick="agregarTarea()">Agregar</button>
  <ul id="lista" st-html="tareasHtml"></ul>
  <p>Total: <span st-text="totalTareas">0</span></p>
</div>

<script>
$.reactiveInit({ tareas: [], tareasHtml: '', totalTareas: 0 });

function agregarTarea() {
  const t = $('#nuevaTarea').val().trim();
  if (!t) return;
  const next = [...$.state('tareas'), t];
  $.state({
    tareas: next,
    tareasHtml: next.map(x => `<li>${x}</li>`).join(''),
    totalTareas: next.length
  });
  $('#nuevaTarea').val('');
}
</script>
```

### B) Todo List (jQuery Puro)
```html
<div>
  <input id="nuevaTarea" placeholder="Nueva tarea">
  <button onclick="agregarTarea()">Agregar</button>
  <ul id="lista"></ul>
  <p>Total: <span id="total"></span></p>
</div>

<script>
$.reactiveInit({ tareas: [], tareasHtml: '', totalTareas: 0 });
$('#lista').reactiveHtml('tareasHtml');
$('#total').reactiveText('totalTareas');

function agregarTarea() {
  const t = $('#nuevaTarea').val().trim();
  if (!t) return;
  const next = [...$.state('tareas'), t];
  $.state({
    tareas: next,
    tareasHtml: next.map(x => `<li>${x}</li>`).join(''),
    totalTareas: next.length
  });
  $('#nuevaTarea').val('');
}
</script>
```

### C) Watch + Progreso (jQuery Puro)
```html
<div>
  <input id="nivel" type="range" min="0" max="100" step="5">
  <div id="label"></div>
  <div style="background:#eee;height:12px;border-radius:8px;">
    <div id="barra" style="background:#667eea;height:12px;width:0%;border-radius:8px;"></div>
  </div>
  <div id="msg"></div>
</div>

<script>
$.reactiveInit({ nivel: 25, nivelLabel: 'Nivel: 25', nivelPorcentaje: '25%', mensajeValidacion: 'Nivel inicial' });
$('#nivel').reactive('nivel');
$('#label').reactiveText('nivelLabel');
$('#barra').reactiveCss('width', 'nivelPorcentaje');
$('#msg').reactiveHtml('mensajeValidacion');

$.watch('nivel', function(nuevo) {
  $.state('nivelLabel', 'Nivel: ' + nuevo);
  $.state('nivelPorcentaje', nuevo + '%');
  $.state('mensajeValidacion', nuevo >= 70 ? '<span style="color:#2f855a">Alto nivel</span>' : '<span style="color:#b7791f">Nivel medio/bajo</span>');
});
</script>
```

---

## Guía de Migración entre Estilos

- `st-text="clave"` ↔ `$(el).reactiveText('clave')`
- `st-html="clave"` ↔ `$(el).reactiveHtml('clave')`
- `st-value="clave"` ↔ `$(input).reactive('clave')`
- `st-show="clave"` ↔ `$(el).reactiveShow('clave')`
- `st-hide="clave"` ↔ `$(el).reactiveHide('clave')`
- `st-css-<prop>="clave"` ↔ `$(el).reactiveCss('<prop>', 'clave')`

Pasos:
1. Remueve atributos `st-*` del HTML.
2. Asigna IDs o selectores a los elementos que quieras vincular.
3. En `$(document).ready`, llama a los métodos `.reactive*` para cada clave/elemento.
4. Conserva tus `$.state(...)` y `$.watch(...)` sin cambios.

## Ventajas de cada Enfoque

- Atributos `st-*` (declarativo):
  - Muy rápido para prototipos y demos.
  - Binding visible y cercano al HTML.

- jQuery Puro (imperativo):
  - HTML limpio (sin atributos mágicos).
  - Mayor control en JS, fácil de testear y componer.
  - Facilita migraciones progresivas y refactors.

## API Completa

### Global (`$`)
- `$.reactiveInit(initialState)`
- `$.state()` / `$.state(key)` / `$.state(key, value)` / `$.state(object)`
- Updater functions: `$.state('key', prev => next)` y `$.state({ key: prev => next })`
- `$.watch(key, cb)` / `$.watch(cb)`
- `$.render(key?)`
- `$.reactiveConfig(options)` / `$.reactiveReset()`

### Elementos (`$.fn`)
- `$.fn.reactive(key)`
- `$.fn.reactiveText(key)`
- `$.fn.reactiveHtml(key)`
- `$.fn.reactiveCss(prop, key)`
- `$.fn.reactiveShow(key)` / `$.fn.reactiveHide(key)`
- `$.fn.reactive(key).list(templateFn, options)`

## Solución de Problemas

- El DOM no se actualiza:
  - Verifica que la clave exista en `$.reactiveInit({ ... })`.
  - Usa `console.log($.state())` para inspeccionar.
  - Forza render con `$.render('clave')`.
  - Si trabajas con arrays u objetos, recuerda usar una nueva referencia (por ejemplo, spread `[...]` o `{...}`); las mutaciones in-place no disparan renders.

- `$.watch` no reacciona:
  - Asegúrate de usar `$.state('clave', valor)` para actualizar.
  - Revisa que la suscripción sea correcta (`$.watch('clave', cb)` o `$.watch(cb)`).

## Compatibilidad
- jQuery 3.7+
- Navegadores modernos
- Updater functions activadas por defecto. Si necesitas guardar funciones como valor de estado, desactiva con `$.reactiveConfig({ allowUpdaterFn: false })`.

## Licencia
MIT