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

### ES6 / Bundlers
Si usas módulos ES6, importa la versión ES6 y deja que tu bundler resuelva jQuery:
```javascript
import $ from 'jquery';
import './src/jquery.reactive.es6.js';

$.reactiveInit({ contador: 0 });
$("#out").reactive('contador').text();
```
En este modo, la librería auto-inicializa bindings declarativos en `document.ready`.

## Conceptos Básicos

- `$.reactiveInit(initialState)`: inicializa el estado global.
- `$.state(key?)`: obtiene todo el estado o una clave.
- `$.state(key, value)` / `$.state(object)`: actualiza estado (uno o varios valores).
- `$.watch(key, cb)` y `$.watch(cb)`: observa cambios de una clave o de todas.
- Render: el DOM se actualiza automáticamente con batch updates; puedes forzar con `$.render(key?)`.

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
- `[st-<clave>]="<directiva>"` → estilo corto equivalente (ej: `<span st-contador="text">`)

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

Sin atributos en el HTML. Vinculas desde JavaScript usando un binder encadenable:
- `$(el).reactive('clave').val()` → inputs/textarea/select (bidireccional)
- `$(el).reactive('clave').text()` → texto
- `$(el).reactive('clave').html()` → HTML
- `$(el).reactive('clave').css('<prop>')` → CSS
- `$(el).reactive('clave').show()` / `.hide()` → visibilidad
- `$(el).reactive('clave').enabled()` / `.disabled()` → habilitar/deshabilitar
- `$(el).reactive('clave').attr('<name>')` / `.prop('<name>')` / `.data('<key>')`
- `$(el).reactive('lista').list(templateFn, { key: 'id' })` → listas eficientes

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

$('#contador-display').reactive('contador').text();
$('#input-nombre').reactive('nombre').val();
$('#nombre-span').reactive('nombre').text();
$('#input-email').reactive('email').val();
$('#email-span').reactive('email').text();
</script>
```

---

## Funciones Actualizadoras (Updater Functions)

Permiten calcular el nuevo valor en función del anterior de forma segura y declarativa.

- Un solo valor:
```javascript
$.state('contador', prev => prev + 1);
$.state('nombre', prev => prev.trim());
```
- Múltiples valores en batch:
```javascript
$.state({
  contador: c => c + 1,
  nivelPorcentaje: n => Math.min(100, Math.max(0, n)),
  nombre: n => n.trim()
});
```
- Manejo de errores: si el updater lanza una excepción, se captura y registra en consola sin romper la app.

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
$('#contador-display').reactive('contador').text();
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
$('#input-nombre').reactive('nombre').val();
$('#nombre-span').reactive('nombre').text();
```

### 3) Lista de Tareas (HTML dinámico)
Atributos:
```html
<ul st-html="tareasHtml"></ul>
<span st-text="totalTareas"></span>
```
jQuery Puro:
```javascript
$('#lista-tareas').reactive('tareasHtml').html();
$('#total-tareas-span').reactive('totalTareas').text();
```

### 4) Toggle de Visibilidad
Atributos:
```html
<div st-show="visible">Contenido</div>
```
jQuery Puro:
```javascript
$('#contenido').reactive('visible').show();
```

### 5) Colores Dinámicos (CSS)
Atributos:
```html
<div class="box" st-css-background-color="colorFondo"></div>
<span st-text="colorNombre"></span>
```
jQuery Puro:
```javascript
$('#box').reactive('colorFondo').css('background-color');
$('#color-nombre-span').reactive('colorNombre').text();
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
  <button onclick="$.state('contador', prev => prev - 1)">-</button>
  <button onclick="$.state('contador', prev => prev + 1)">+</button>
  <button onclick="$.state('contador', 0)">Reset</button>
</div>

<script>
$.reactiveInit({ contador: 0 });
$('#count').reactive('contador').text();
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
$('#nombre').reactive('nombre').val();
$('#email').reactive('email').val();
$('#nombre-out').reactive('nombre').text();
$('#email-out').reactive('email').text();
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
$('#lista').reactive('tareasHtml').html();
$('#total').reactive('totalTareas').text();

function agregar() {
  const t = $('#nueva').val().trim();
  if (!t) return;
  const arr = $.state('tareas');
  arr.push(t);
  $.state({
    tareas: arr,
    tareasHtml: arr.map(x => `<li>${x}</li>`).join(''),
    totalTareas: arr.length
  });
  $('#nueva').val('');
}
</script>
```

#### 4) Toggle visibilidad completo (jQuery puro)
```html
<div>
  <button onclick="$.state('visible', prev => !prev)">Toggle</button>
  <div id="panel">Panel secreto</div>
</div>

<script>
$.reactiveInit({ visible: true });
$('#panel').reactive('visible').show();
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
$('#nivel').reactive('porcentaje').val();
$('#label').reactive('label').text();
$('#box').reactive('color').css('background-color');

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
  const arr = $.state('tareas');
  arr.push(t);
  $.state({
    tareas: arr,
    tareasHtml: arr.map(x => `<li>${x}</li>`).join(''),
    totalTareas: arr.length
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
$('#lista').reactive('tareasHtml').html();
$('#total').reactive('totalTareas').text();

function agregarTarea() {
  const t = $('#nuevaTarea').val().trim();
  if (!t) return;
  const arr = $.state('tareas');
  arr.push(t);
  $.state({
    tareas: arr,
    tareasHtml: arr.map(x => `<li>${x}</li>`).join(''),
    totalTareas: arr.length
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
$('#nivel').reactive('nivel').val();
$('#label').reactive('nivelLabel').text();
$('#barra').reactive('nivelPorcentaje').css('width');
$('#msg').reactive('mensajeValidacion').html();

$.watch('nivel', function(nuevo) {
  $.state('nivelLabel', 'Nivel: ' + nuevo);
  $.state('nivelPorcentaje', nuevo + '%');
  $.state('mensajeValidacion', nuevo >= 70 ? '<span style="color:#2f855a">Alto nivel</span>' : '<span style="color:#b7791f">Nivel medio/bajo</span>');
});
</script>
```

---

## Guía de Migración entre Estilos

- `st-text="clave"` ↔ `$(el).reactive('clave').text()`
- `st-html="clave"` ↔ `$(el).reactive('clave').html()`
- `st-value="clave"` ↔ `$(input).reactive('clave').val()`
- `st-show="clave"` ↔ `$(el).reactive('clave').show()`
- `st-hide="clave"` ↔ `$(el).reactive('clave').hide()`
- `st-css-<prop>="clave"` ↔ `$(el).reactive('clave').css('<prop>')`

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
- `$.watch(key, cb)` / `$.watch(cb)`
- `$.render(key?)`
- `$.reactiveConfig(options)` / `$.reactiveReset()`

#### Configuración (`$.reactiveConfig`)
- `prefix` (string, por defecto `st-`): prefijo de atributos declarativos.
- `debug` (boolean): log de diagnóstico en consola.
- `batchTimeout` (ms): pequeño retraso para agrupar renders.
- `maxUpdateDepth` (número): límite defensivo para evitar bucles.
- `allowUpdaterFn` (boolean): permite funciones actualizadoras en `$.state()`.

#### Eventos
- `state:update` (global): emitido en cada cambio de estado (valor y clave).
- `state:changed:<clave>` (por elemento): emitido al aplicar una clave a un elemento.

### Elementos (`$.fn`)
- `$(el).reactive('key').text()`
- `$(el).reactive('key').html()`
- `$(input).reactive('key').val()`
- `$(el).reactive('key').css('<prop>')`
- `$(el).reactive('key').show()` / `$(el).reactive('key').hide()`
- `$(el).reactive('key').enabled()` / `$(el).reactive('key').disabled()`
- `$(el).reactive('key').attr('<name>')` / `$(el).reactive('key').prop('<name>')` / `$(el).reactive('key').data('<key>')`
- `$(el).reactive('lista').list(templateFn, options)`

Nota: Los métodos legacy `reactiveText/reactiveHtml/reactiveCss/reactiveShow/reactiveHide` siguen disponibles pero están obsoletos. Usa el binder encadenable `$(el).reactive(key).…` para todas las vinculaciones.

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

### Nota ES6
La versión ES6 expone el singleton como `$.ReactiveState` para inspección avanzada y auto-inicializa bindings declarativos en `$(document).ready`. Los inputs con `st-value` tienen binding bidireccional automático.

## Licencia
MIT