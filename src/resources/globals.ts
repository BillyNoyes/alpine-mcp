export const globals = `# Alpine.js Global API

## Alpine.data

\`Alpine.data(...)\` provides a way to re-use \`x-data\` contexts within your application.

Here's a contrived \`dropdown\` component for example:

\`\`\`alpine
<div x-data="dropdown">
    <button @click="toggle">...</button>

    <div x-show="open">...</div>
</div>

<script>
    document.addEventListener('alpine:init', () => {
        Alpine.data('dropdown', () => ({
            open: false,

            toggle() {
                this.open = ! this.open
            }
        }))
    })
</script>
\`\`\`

As you can see we've extracted the properties and methods we would usually define directly inside \`x-data\` into a separate Alpine component object.

### Registering from a bundle

If you've chosen to use a build step for your Alpine code, you should register your components in the following way:

\`\`\`js
import Alpine from 'alpinejs'
import dropdown from './dropdown.js'

Alpine.data('dropdown', dropdown)

Alpine.start()
\`\`\`

This assumes you have a file called \`dropdown.js\` with the following contents:

\`\`\`js
export default () => ({
    open: false,

    toggle() {
        this.open = ! this.open
    }
})
\`\`\`

### Initial parameters

In addition to referencing \`Alpine.data\` providers by their name plainly (like \`x-data="dropdown"\`), you can also reference them as functions (\`x-data="dropdown()"\`). By calling them as functions directly, you can pass in additional parameters to be used when creating the initial data object like so:

\`\`\`alpine
<div x-data="dropdown(true)">
\`\`\`
\`\`\`js
Alpine.data('dropdown', (initialOpenState = false) => ({
    open: initialOpenState
}))
\`\`\`

Now, you can re-use the \`dropdown\` object, but provide it with different parameters as you need to.

### Init functions

If your component contains an \`init()\` method, Alpine will automatically execute it before it renders the component. For example:

\`\`\`js
Alpine.data('dropdown', () => ({
    init() {
        // This code will be executed before Alpine
        // initializes the rest of the component.
    }
}))
\`\`\`

### Destroy functions

If your component contains a \`destroy()\` method, Alpine will automatically execute it before cleaning up the component.

A primary example for this is when registering an event handler with another library or a browser API that isn't available through Alpine. See the following example code on how to use the \`destroy()\` method to clean up such a handler.

\`\`\`js
Alpine.data('timer', () => ({
    timer: null,
    counter: 0,
    init() {
      // Register an event handler that references the component instance
      this.timer = setInterval(() => {
        console.log('Increased counter to', ++this.counter);
      }, 1000);
    },
    destroy() {
        // Detach the handler, avoiding memory and side-effect leakage
        clearInterval(this.timer);
    },
}))
\`\`\`

An example where a component is destroyed is when using one inside an \`x-if\`:

\`\`\`html
<span x-data="{ enabled: false }">
    <button @click.prevent="enabled = !enabled">Toggle</button>

    <template x-if="enabled">
        <span x-data="timer" x-text="counter"></span>
    </template>
</span>
\`\`\`

### Using magic properties

If you want to access magic methods or properties from a component object, you can do so using the \`this\` context:

\`\`\`js
Alpine.data('dropdown', () => ({
    open: false,

    init() {
        this.$watch('open', () => {...})
    }
}))
\`\`\`

### Encapsulating directives with x-bind

If you wish to re-use more than just the data object of a component, you can encapsulate entire Alpine template directives using \`x-bind\`.

The following is an example of extracting the templating details of our previous dropdown component using \`x-bind\`:

\`\`\`alpine
<div x-data="dropdown">
    <button x-bind="trigger"></button>

    <div x-bind="dialogue"></div>
</div>
\`\`\`

\`\`\`js
Alpine.data('dropdown', () => ({
    open: false,

    trigger: {
        ['@click']() {
            this.open = ! this.open
        },
    },

    dialogue: {
        ['x-show']() {
            return this.open
        },
    },
}))
\`\`\`

---

## Alpine.store

Alpine offers global state management through the \`Alpine.store()\` API.

### Registering A Store

You can either define an Alpine store inside of an \`alpine:init\` listener (in the case of including Alpine via a \`<script>\` tag), OR you can define it before manually calling \`Alpine.start()\` (in the case of importing Alpine into a build):

**From a script tag:**
\`\`\`alpine
<script>
    document.addEventListener('alpine:init', () => {
        Alpine.store('darkMode', {
            on: false,

            toggle() {
                this.on = ! this.on
            }
        })
    })
</script>
\`\`\`

**From a bundle:**
\`\`\`js
import Alpine from 'alpinejs'

Alpine.store('darkMode', {
    on: false,

    toggle() {
        this.on = ! this.on
    }
})

Alpine.start()
\`\`\`

### Accessing stores

You can access data from any store within Alpine expressions using the \`$store\` magic property:

\`\`\`alpine
<div x-data :class="$store.darkMode.on && 'bg-black'">...</div>
\`\`\`

You can also modify properties within the store and everything that depends on those properties will automatically react. For example:

\`\`\`alpine
<button x-data @click="$store.darkMode.toggle()">Toggle Dark Mode</button>
\`\`\`

Additionally, you can access a store externally using \`Alpine.store()\` by omitting the second parameter like so:

\`\`\`alpine
<script>
    Alpine.store('darkMode').toggle()
</script>
\`\`\`

### Initializing stores

If you provide \`init()\` method in an Alpine store, it will be executed right after the store is registered. This is useful for initializing any state inside the store with sensible starting values.

\`\`\`alpine
<script>
    document.addEventListener('alpine:init', () => {
        Alpine.store('darkMode', {
            init() {
                this.on = window.matchMedia('(prefers-color-scheme: dark)').matches
            },

            on: false,

            toggle() {
                this.on = ! this.on
            }
        })
    })
</script>
\`\`\`

Notice the newly added \`init()\` method in the example above. With this addition, the \`on\` store variable will be set to the browser's color scheme preference before Alpine renders anything on the page.

### Single-value stores

If you don't need an entire object for a store, you can set and use any kind of data as a store.

\`\`\`alpine
<button x-data @click="$store.darkMode = ! $store.darkMode">Toggle Dark Mode</button>

...

<div x-data :class="$store.darkMode && 'bg-black'">
    ...
</div>

<script>
    document.addEventListener('alpine:init', () => {
        Alpine.store('darkMode', false)
    })
</script>
\`\`\`

---

## Alpine.bind

\`Alpine.bind(...)\` provides a way to re-use \`x-bind\` objects within your application.

Here's a simple example. Rather than binding attributes manually with Alpine:

\`\`\`alpine
<button type="button" @click="doSomething()" :disabled="shouldDisable"></button>
\`\`\`

You can bundle these attributes up into a reusable object and use \`x-bind\` to bind to that:

\`\`\`alpine
<button x-bind="SomeButton"></button>

<script>
    document.addEventListener('alpine:init', () => {
        Alpine.bind('SomeButton', () => ({
            type: 'button',

            '@click'() {
                this.doSomething()
            },

            ':disabled'() {
                return this.shouldDisable
            },
        }))
    })
</script>
\`\`\`
`;
