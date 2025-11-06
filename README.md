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
- `$.ensure(defaults, { silent })` → establece valores por defecto solo si la clave no existe. Por defecto es silencioso (`silent: true`).
- `$.ensureNS(prefix, defaults, { silent, sep })` → igual que `ensure` pero aplicando prefijo/namespace a cada clave. `sep` (separador) por defecto es `'.'`.
- `$.namespace(prefix, { sep })` → helper para trabajar cómodamente con claves namespaced. Devuelve utilidades: `k(key)`, `ensure(defs, { silent })`, `get(key)`, `set(key, value|fn)`, `watch(key, cb)`, `state(key, value|fn)`.
- `$.refs(root, opts)` → recoge elementos etiquetados con `data-ref` (por defecto) bajo `root` y devuelve un objeto `{ refName: $element }`. Opciones: `{ attr = 'data-ref', normalize = true, as = 'jquery', includeRoot = true }`.

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
- `$(el).reactive('key').on(events, handler, { prevent, stop, once })` → adjunta eventos al elemento con opciones ergonómicas. `events` puede ser string separado por espacios o un array.
- `$(el).reactive('key').map(fn)` → transforma el valor antes de aplicarlo al DOM en los métodos de salida (`text`, `html`, `css`, `attr`, `prop`, `data`, `show/hide`, `enabled/disabled`, `className`, `toggleClass`). Admite múltiples `map()` encadenados.

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

---

# Namespaces y valores por defecto (ensure/ensureNS/namespace)

La librería incluye utilidades para trabajar con nombres de clave con prefijo (namespaces) y para fijar valores por defecto sin sobrescribir claves ya existentes.

## $.ensure(defaults, { silent })

Establece valores por defecto solo si la clave aún no existe en el estado. Útil para inicializaciones idempotentes.

```javascript
// No sobrescribe si 'nombre' ya existe
$.ensure({ nombre: 'Invitado', email: '' });

// Si quieres que además dispare render/observadores, pasa silent: false
$.ensure({ nombre: 'Invitado' }, { silent: false });
```

## $.ensureNS(prefix, defaults, { silent, sep })

Igual que `ensure`, pero aplicando un prefijo a cada clave. Por defecto usa `.` como separador.

```javascript
$.ensureNS('perfil', { nombre: 'Invitado', edad: 0 });
$.ensureNS('ui', { tema: 'light' }, { sep: ':', silent: false });
```

## $.namespace(prefix, { sep })

Devuelve un objeto helper para trabajar con un namespace de forma cómoda y segura.

```javascript
const perfil = $.namespace('perfil');

// Genera la clave completa: 'perfil.nombre'
perfil.k('nombre'); // => 'perfil.nombre'

// Asegura defaults dentro del namespace (por defecto, silencioso)
perfil.ensure({ nombre: 'Invitado' });

// Leer y escribir dentro del namespace
const nombre = perfil.get('nombre');
perfil.set('nombre', prev => (prev || '').trim());

// Observar cambios de una clave del namespace
perfil.watch('nombre', (nuevo, anterior) => console.log('Perfil.nombre:', anterior, '→', nuevo));

// Alias directo: perfil.state('nombre', 'Juan')
```

### Mostrar valores por defecto en la UI

Ten en cuenta que `ensure` es silencioso por defecto, lo que significa que no dispara suscripciones ni programa un render del DOM. Si estás usando el estilo declarativo (atributos `st-*`), y quieres ver el valor por defecto en el primer render:

- Pasa `{ silent: false }` al `ensure`: `perfil.ensure({ nombre: 'Invitado' }, { silent: false });`, o
- Fuerza un render explícito: `$.render(perfil.k('nombre'));`, o
- Usa binding imperativo para el render inicial: `$('#span').reactive(perfil.k('nombre')).text();`

En el estilo imperativo, el método `.text()`/`.val()` lee el valor actual del estado y lo aplica inmediatamente, por lo que verás "Invitado" desde el primer render incluso si `ensure` fue silencioso.

### Atributos con claves que incluyen '.'

El selector corto `[st-<clave>="<directiva>"]` requiere que el nombre del atributo sea un identificador HTML válido. Si tu clave incluye un punto (por ejemplo `perfil.nombre`), evita el estilo corto `<span st-perfil.nombre="text">` y usa las directivas específicas, por ejemplo `st-text="perfil.nombre"`, o el binding imperativo desde JavaScript.

---

# API de eventos: binder.on(events, handler, opts)

Se incorporó `ReactiveBinder.on` para adjuntar eventos al elemento de forma encadenable y ergonómica.

Firma:

```javascript
$(el).reactive('clave').on(events, handler, opts)
// events: string separado por espacios ("click keyup") o array (["click", "keyup"])
// handler: function(e, ...args) { /* this === elemento DOM */ }
// opts: { prevent?: boolean, stop?: boolean, once?: boolean }
```

Características:
- Múltiples eventos por llamada (string o array).
- Opciones prácticas:
  - `prevent`: llama `e.preventDefault()` automáticamente.
  - `stop`: llama `e.stopPropagation()` automáticamente.
  - `once`: auto-desuscribe el handler después de la primera invocación.
- Limpieza automática: todos los eventos registrados mediante `.on()` se eliminan cuando invocas `.unbind()` del binder.
- Encadenable: puedes combinar `.on()` con `.text()`, `.val()`, etc.

### Ejemplo básico (contador)

```html
<div>
  <span id="on-out">0</span>
  <button id="on-inc">+</button>
  <button id="on-dec">-</button>
  <button id="on-reset">Reset</button>
  <span id="on-state"></span>
  
</div>

<script>
$.reactiveInit({ 'onDemo.contador': 0 });

$('#on-out').reactive('onDemo.contador').text();
$('#on-state').reactive('onDemo.contador').text();

// Incrementa con preventDefault
$('#on-inc')
  .reactive('onDemo.contador')
  .on('click', (e) => $.state('onDemo.contador', prev => prev + 1), { prevent: true });

// Decrementa con stopPropagation
$('#on-dec')
  .reactive('onDemo.contador')
  .on('click', () => $.state('onDemo.contador', prev => prev - 1), { stop: true });

// Reset solo una vez (once)
$('#on-reset')
  .reactive('onDemo.contador')
  .on('click', () => $.state('onDemo.contador', 0), { once: true });
</script>
```

### Varios eventos a la vez

```javascript
$('#input-buscar')
  .reactive('filtro')
  .val() // two-way binding
  .on('input keyup', (e) => {
    // Normaliza espacios y aplica al estado
    const texto = e.target.value.trim();
    $.state('filtro', texto);
  }, { prevent: true });
```

### Limpieza

Cuando ya no necesites el binding (por ejemplo, al destruir un componente), invoca:

```javascript
const binder = $('#btn').reactive('alguna.clave').on('click', handler);

// ...más tarde
binder.unbind(); // cancela suscripciones y quita los eventos registrados con .on()
```

---

## Ejemplo modular "8. Eventos con binder.on()"

La demo ES6 pura incluye un ejemplo modular que puedes consultar en:
- HTML: `demo-es6-puro.html` (tarjeta "Ejemplo 8")
- JS: `src/examples-puro/events-on.js`

Ahí verás un contador `onDemo.contador` con botones que usan `.on()` junto a `.text()` y `.val()` para reflejar el estado y manejar interacciones con `prevent` y `once`.

---

# Transformaciones: binder.map(fn)

Permite transformar el valor de estado antes de aplicarlo al DOM en los métodos de salida del binder. Útil para formatear etiquetas, porcentajes, clases, estilos, etc.

Firma:

```javascript
$(el).reactive('clave').map(fn).text();
// Puedes encadenar múltiples mapeos: .map(f1).map(f2).text()
```

Comportamiento:
- Se aplica en el render inicial y en cada actualización suscrita.
- Solo afecta la salida hacia el DOM. En `val()` el two-way update (de input → estado) no aplica la transformación inversa: el valor que ingresa al estado es el crudo del input.
- Funciona con todos los métodos de salida: `text`, `html`, `css`, `attr`, `prop`, `data`, `show/hide`, `enabled/disabled`, `className`, `toggleClass`.
- No afecta el helper de listas `$.fn.list` (usa suscripción propia). Para listas, aplica transformaciones en tu `render(item, index)`.

Ejemplos:

```html
<input type="range" id="nivel" min="0" max="100" step="5">
<div id="label"></div>
<div id="barra" style="height:12px;background:#667eea;width:0%"></div>

<script>
$.reactiveInit({ 'mapDemo.nivel': 25 });
$('#nivel').reactive('mapDemo.nivel').val();

$('#label').reactive('mapDemo.nivel')
  .map(n => `Nivel: ${Math.round(Number(n)||0)}`)
  .text();

$('#barra').reactive('mapDemo.nivel')
  .map(n => `${Math.max(0, Math.min(100, Number(n)||0))}%`)
  .css('width');
</script>
```

Notas:
- Si usas `map()` sobre `val()` (inputs), la transformación se aplica al valor mostrado en el input, pero la escritura al estado toma el valor crudo del input. Si necesitas una transformación inversa (ej. parsear o validar), hazlo en tu handler de evento o mediante `$.watch`.

## Ejemplo modular "9. Transformaciones con map()"

La demo ES6 pura incluye un ejemplo modular que puedes consultar en:
- HTML: `demo-es6-puro.html` (tarjeta "Ejemplo 9")
- JS: `src/examples-puro/map.js`

Demuestra etiqueta formateada, barra de progreso y color de fondo derivados del estado `mapDemo.nivel` mediante `map()`.

## Buenas prácticas de rendimiento con listas grandes

Si vas a manejar listas de miles de elementos (por ejemplo, 10.000 clientes):
- Usa `$(el).reactive('lista').list(templateFn, { key: 'id' })` para diff incremental.
- Carga inicial silenciosa (por ejemplo con `$.ensure`) y luego aplica bindings.
- Mantén claves estables (`key: 'id'`) para minimizar re-creaciones de nodos.
- Considera paginación o virtualización si la lista es interactiva.
- Agrupa cambios en lote con `$.state({ ... })`.
- Para claves con `.`, evita el estilo corto `[st-<clave>]` y usa `st-text="namespace.clave"` o el binding imperativo.

---

# Referencias de DOM: $.refs(root, opts)

Helper para recolectar elementos del DOM marcados con un atributo de referencia (por defecto `data-ref`) y devolver un objeto simple para acceso cómodo.

Firma y opciones:

```javascript
const refs = $.refs(root, { attr: 'data-ref', normalize: true, as: 'jquery', includeRoot: true });
// - attr: nombre del atributo (por defecto 'data-ref'). Puedes usar 'ref'.
// - normalize: convierte 'mi-ref' → 'miRef' para claves más ergonómicas.
// - as: 'jquery' (devuelve jQuery) o 'dom' (devuelve elementos DOM; duplicados como array).
// - includeRoot: incluye el root si también posee el atributo.
```

Uso típico:

```html
<div id="perfil">
  <input data-ref="nombre" placeholder="Nombre">
  <span data-ref="label"></span>
  <button data-ref="btnGuardar">Guardar</button>
</div>

<script>
const { nombre, label, btnGuardar } = $.refs('#perfil');
// Vincula de forma imperativa y legible
nombre.reactive('perfil.nombre').val();
label.reactive('perfil.nombre').map(n => `Nombre: ${n || 'Invitado'}`).text();
btnGuardar.reactive('perfil.nombre').on('click', () => console.log('Guardar', $.state('perfil.nombre')));
</script>
```

Duplicados:
- Si hay varios elementos con la misma referencia (por ejemplo, múltiples `data-ref="item"`), el valor será una selección jQuery con todos esos elementos, lo que permite aplicar métodos del binder a la colección completa.
  ```javascript
  const { item } = $.refs(document);
  item.reactive('ui.destacado').toggleClass('highlight');
  ```
- Si usas `{ as: 'dom' }`, recibirás un único elemento (si hay uno) o un array de elementos DOM si hay duplicados.

Notas:
- $.refs no añade suscripciones ni lógica reactiva; solo recolecta nodos.
- Ideal para mantener HTML limpio y hacer wiring desde JS sin depender de IDs, especialmente en bloques complejos.

---

# Observadores encadenables: binder.watch(handler, opts)

Observa cambios de la clave asociada al binder de forma encadenable, similar en ergonomía a binder.on.

Firma:
- binder.watch(handler, opts)
  - handler: función que recibe ($el, newVal, oldVal, key)
  - opts:
    - mapped: boolean (por defecto true). Si true, aplica las transformaciones definidas con .map() al valor antes de entregar al handler.
    - immediate: boolean (por defecto false). Si true, invoca el handler inmediatamente con el valor actual.
    - once: boolean (por defecto false). Si true, se desuscribe después de la primera notificación.

Ejemplo básico:
```js
$('#usuario-span').reactive('usuario.nombre')
  .text()
  .watch(($el, nuevo, viejo, key) => {
    console.log(`[watch] ${key}:`, viejo, '→', nuevo);
  }, { immediate: true });
```

Con transformaciones y una vez:
```js
$('#nivel-label').reactive('mapDemo.nivel')
  .map(n => Math.round(Number(n) || 0))
  .text()
  .watch(($el, n, prev) => {
    if (n >= 100) {
      $el.addClass('maximo');
    }
  }, { mapped: true, once: true });
```

Notas:
- binder.watch se limita a la clave del binder; para observar múltiples claves usa $.watch o $.namespace('x').watch('y', ...).
- Si necesitas que los watchers se disparen al fijar defaults, usa $.ensure(..., { silent: false }) o opts.immediate: true en el propio binder.watch.

---

# Actualización de estado encadenable: binder.set(value|fn, opts)

Permite actualizar el estado de la misma clave del binder sin tener que llamar a $.state explícitamente.

Firma:
- binder.set(valueOrFn, opts)
  - valueOrFn: valor directo o función updater (prev) => next
  - opts:
    - silent: boolean (por defecto false). Si true, actualiza sin disparar watchers ni render.

Ejemplos:
```js
// Actualización directa
$('#nivel-label').reactive('mapDemo.nivel').set(50);

// Usando updater fn (si allowUpdaterFn está habilitado)
const binder = $('#nivel-label').reactive('mapDemo.nivel');
binder.set(prev => Math.min(100, Math.max(0, Number(prev) || 0)));

// Dentro de un watch, usando closure para referenciar el binder
const b = $('#nivel-label').reactive('mapDemo.nivel').text();
b.watch(($el, raw) => {
  const clamped = Math.max(0, Math.min(100, Number(raw) || 0));
  if (clamped !== raw) b.set(clamped); // evita bucle gracias a la comparación
}, { mapped: false });
```

Evitar bucles por accidente:
- Compara antes de setear: sólo actualiza si next !== prev.
- Si normalizas una sola vez, usa { once: true } en watch.
- Para cálculos derivados, considera actualizar otra clave distinta para evitar recursión en la misma.
- Si necesitas actualizar sin disparar watchers ni render, usa opts.silent: true (y renderiza/observa manualmente si procede).