# Propuesta de Mejora: Estados Reactivos Locales con `ensureState`

## 1. Introducción: El Problema a Resolver

Actualmente, nuestra biblioteca `jquery.reactive.js` utiliza un **único estado global**. Esto significa que toda la información de la aplicación (el nombre de usuario, el contenido de un carrito de compras, si un menú está abierto, etc.) vive en un solo lugar.

Esto es simple al principio, pero presenta dos problemas a medida que la aplicación crece:

1.  **Colisión de Nombres:** Si tenemos dos componentes "contador" en la misma página, ambos intentarían usar la misma clave de estado, por ejemplo, `count`. Un contador interferiría con el otro.
2.  **Falta de Encapsulación:** Un componente no puede ser verdaderamente independiente si su lógica interna (su estado) está expuesta y mezclada con la de toda la aplicación. Esto hace que el código sea más difícil de mantener y reutilizar.

La solución es introducir **estados reactivos locales**: cada componente gestionará su propio estado de forma aislada.

## 2. La Solución: `ensureState`

La idea central es crear una nueva función, `ensureState`, que nos permita asociar una instancia de estado reactivo a un elemento específico del DOM (nuestro "componente").

Así, en lugar de que todo el estado viva en un "gran cerebro" global, cada componente tendrá su "pequeño cerebro" privado.

### ¿Cómo funcionaría?

1.  **Seleccionas tu componente:** `const $miContador = $('#mi-contador');`
2.  **Le asignas un estado local:** `$miContador.ensureState({ count: 0 });`
    *   **`ensure` (asegurar):** Si el componente no tiene un estado, se lo crea. Si ya lo tiene, simplemente lo devuelve. Esto evita crear estados nuevos accidentalmente.
3.  **Interactúas con ese estado local:** `$miContador.state('count', 1);`

Esto nos permite tener múltiples componentes independientes en la misma página:

```html
\u003cdiv id="contador-1"\u003e
  \u003cspan st-text="count"\u003e\u003c/span\u003e
  \u003cbutton class="incrementar"\u003eIncrementar\u003c/button\u003e
\u003c/div\u003e

\u003cdiv id="contador-2"\u003e
  \u003cspan st-text="count"\u003e\u003c/span\u003e
  \u003cbutton class="incrementar"\u003eIncrementar\u003c/button\u003e
\u003c/div\u003e
```

```javascript
// Componente 1
const $contador1 = $('#contador-1');
$contador1.ensureState({ count: 0 });
$contador1.find('.incrementar').on('click', () =\u003e {
  $contador1.state('count', prev =\u003e prev + 1); // Modifica solo el estado de contador-1
});

// Componente 2 (totalmente independiente)
const $contador2 = $('#contador-2');
$contador2.ensureState({ count: 100 });
$contador2.find('.incrementar').on('click', () =\u003e {
  $contador2.state('count', prev =\u003e prev + 1); // Modifica solo el estado de contador-2
});
```

El estado global (`$.state`) seguirá existiendo y será útil para datos que realmente toda la aplicación necesita, como la información del usuario logueado.

## 3. Plan de Implementación por Fases

Propongo implementar esta mejora en tres fases claras y manejables. Cada fase es un paso lógico que nos permite probar el progreso de forma incremental.

---

### **Fase 1: Refactorización del Núcleo (Sin romper nada)**

**Objetivo:** Convertir el objeto `ReactiveState` en una `class` de JavaScript.

**¿Por qué?**
Actualmente, `ReactiveState` es un objeto único (singleton). No podemos crear más de uno. Al convertirlo en una clase, sentamos las bases para poder crear múltiples instancias de estado (`new ReactiveState()`), una para cada componente.

**Pasos Técnicos:**
1.  Modificar la declaración de `const ReactiveState = { ... }` a `class ReactiveState { constructor() { ... } ... }`.
2.  Al final de la declaración de la clase, crear la instancia global que usará la API actual: `const globalState = new ReactiveState();`.
3.  Asegurarse de que todas las funciones existentes (`$.state`, `$.watch`, etc.) usen `globalState` en lugar del antiguo objeto.

**Resultado de la Fase 1:**
La biblioteca funcionará exactamente igual que antes. Este cambio es puramente interno y no afectará a la API pública. Tendremos un código más robusto y preparado para la siguiente fase.

---

### **Fase 2: Creación de la Nueva API Local**

**Objetivo:** Implementar las funciones `$.fn.ensureState` y `$.fn.state`.

**Pasos Técnicos:**
1.  **`$.fn.ensureState(initialState)`:**
    *   Crear un nuevo plugin de jQuery para elementos (`$.fn`).
    *   Usará `$(this).data('reactive-instance', ...)` para guardar o leer la instancia de estado del elemento.
    *   Si no existe una instancia, creará una (`new ReactiveState(initialState)`) y la guardará.
    *   Si ya existe, la devolverá.

2.  **`$.fn.state(key, value)`:**
    *   Crear otro plugin que actuará sobre un elemento.
    *   Recuperará la instancia de estado local desde `$(this).data('reactive-instance')`.
    *   Llamará a los métodos `.getState()` o `.setState()` de esa instancia local.

**Resultado de la Fase 2:**
Podremos crear y manipular estados locales como en el ejemplo de los contadores. Sin embargo, las actualizaciones del DOM aún no funcionarán correctamente, ya que el sistema de renderizado solo conoce el estado global.

---

### **Fase 3: Adaptación del Renderizado del DOM**

**Objetivo:** Hacer que las actualizaciones del DOM sean conscientes del contexto (local vs. global).

**¿Por qué?**
Cuando un estado local cambie, solo queremos que se actualicen los elementos HTML **dentro** del componente al que pertenece ese estado, no toda la página.

**Pasos Técnicos:**
1.  Modificar la función `_updateDOM(key)` para que acepte un segundo argumento opcional: el elemento raíz del componente (`$contextElement`).
2.  Dentro de `_updateDOM`, todas las búsquedas de jQuery (`$('[st-text="key"]')`) se limitarán a ese contexto: `$('[st-text="key"]', $contextElement)`.
3.  Cuando se dispare una actualización desde un estado local, se pasará su elemento asociado como contexto. Si la actualización es global, no se pasará contexto y funcionará como hasta ahora (buscando en toda la página).

**Resultado de la Fase 3:**
¡Funcionalidad completa! Los cambios en un estado local solo re-renderizarán su componente correspondiente, haciendo el sistema mucho más eficiente y modular.

## 4. Beneficios Finales

*   **Componentes Reutilizables:** Podrás crear widgets (contadores, selectores, etc.) y usarlos múltiples veces en la misma página sin conflictos.
*   **Código más Limpio y Mantenible:** El estado estará organizado lógicamente, encapsulado donde se usa.
*   **Mejor Rendimiento:** Al limitar las actualizaciones del DOM solo al componente afectado, la aplicación será más rápida.
*   **Escalabilidad:** La aplicación podrá crecer de forma ordenada sin que el estado global se convierta en un caos.