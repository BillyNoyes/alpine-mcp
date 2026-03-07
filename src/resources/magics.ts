export const magics = `# Alpine.js Magic Properties

Magic properties are prefixed with \`$\` and available inside any Alpine expression.

---

## $el

\`$el\` is a magic property that can be used to retrieve the current DOM node.

\`\`\`alpine
<button @click="$el.innerHTML = 'Hello World!'">Replace me with "Hello World!"</button>
\`\`\`

---

## $refs

\`$refs\` is a magic property that can be used to retrieve DOM elements marked with \`x-ref\` inside the component. This is useful when you need to manually manipulate DOM elements. It's often used as a more succinct, scoped, alternative to \`document.querySelector\`.

\`\`\`alpine
<button @click="$refs.text.remove()">Remove Text</button>

<span x-ref="text">Hello 👋</span>
\`\`\`

Now, when the \`<button>\` is pressed, the \`<span>\` will be removed.

### Limitations

In V2 it was possible to bind \`$refs\` to elements dynamically, like seen below:

\`\`\`alpine
<template x-for="item in items" :key="item.id" >
    <div :x-ref="item.name">
    some content ...
    </div>
</template>
\`\`\`

However, in V3, \`$refs\` can only be accessed for elements that are created statically. So for the example above: if you were expecting the value of \`item.name\` inside of \`$refs\` to be something like *Batteries*, you should be aware that \`$refs\` will actually contain the literal string \`'item.name'\` and not *Batteries*.

---

## $store

You can use \`$store\` to conveniently access global Alpine stores registered using \`Alpine.store(...)\`. For example:

\`\`\`alpine
<button x-data @click="$store.darkMode.toggle()">Toggle Dark Mode</button>

...

<div x-data :class="$store.darkMode.on && 'bg-black'">
    ...
</div>

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

Given that we've registered the \`darkMode\` store and set \`on\` to "false", when the \`<button>\` is pressed, \`on\` will be "true" and the background color of the page will change to black.

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

## $watch

You can "watch" a component property using the \`$watch\` magic method. For example:

\`\`\`alpine
<div x-data="{ open: false }" x-init="$watch('open', value => console.log(value))">
    <button @click="open = ! open">Toggle Open</button>
</div>
\`\`\`

In the above example, when the button is pressed and \`open\` is changed, the provided callback will fire and \`console.log\` the new value.

You can watch deeply nested properties using "dot" notation:

\`\`\`alpine
<div x-data="{ foo: { bar: 'baz' }}" x-init="$watch('foo.bar', value => console.log(value))">
    <button @click="foo.bar = 'bob'">Toggle Open</button>
</div>
\`\`\`

When the \`<button>\` is pressed, \`foo.bar\` will be set to "bob", and "bob" will be logged to the console.

### Getting the "old" value

\`$watch\` keeps track of the previous value of the property being watched. You can access it using the optional second argument to the callback like so:

\`\`\`alpine
<div x-data="{ open: false }" x-init="$watch('open', (value, oldValue) => console.log(value, oldValue))">
    <button @click="open = ! open">Toggle Open</button>
</div>
\`\`\`

### Deep watching

\`$watch\` automatically watches for changes at any level but you should keep in mind that, when a change is detected, the watcher will return the value of the observed property, not the value of the subproperty that has changed.

\`\`\`alpine
<div x-data="{ foo: { bar: 'baz' }}" x-init="$watch('foo', (value, oldValue) => console.log(value, oldValue))">
    <button @click="foo.bar = 'bob'">Update</button>
</div>
\`\`\`

When the \`<button>\` is pressed, \`foo.bar\` will be set to "bob", and \`{bar: 'bob'} {bar: 'baz'}\` will be logged to the console (new and old value).

> ⚠️ Changing a property of a "watched" object as a side effect of the \`$watch\` callback will generate an infinite loop and eventually error.

\`\`\`alpine
<!-- 🚫 Infinite loop -->
<div x-data="{ foo: { bar: 'baz', bob: 'lob' }}" x-init="$watch('foo', value => foo.bob = foo.bar)">
    <button @click="foo.bar = 'bob'">Update</button>
</div>
\`\`\`

---

## $dispatch

\`$dispatch\` is a helpful shortcut for dispatching browser events.

\`\`\`alpine
<div @notify="alert('Hello World!')">
    <button @click="$dispatch('notify')">
        Notify
    </button>
</div>
\`\`\`

You can also pass data along with the dispatched event. This data will be accessible as the \`.detail\` property of the event:

\`\`\`alpine
<div @notify="alert($event.detail.message)">
    <button @click="$dispatch('notify', { message: 'Hello World!' })">
        Notify
    </button>
</div>
\`\`\`

Under the hood, \`$dispatch\` is a wrapper for the more verbose API: \`element.dispatchEvent(new CustomEvent(...))\`

**Note on event propagation**

Notice that, because of event bubbling, when you need to capture events dispatched from nodes that are under the same nesting hierarchy, you'll need to use the \`.window\` modifier:

\`\`\`alpine
<!-- 🚫 Won't work -->
<div x-data>
    <span @notify="..."></span>
    <button @click="$dispatch('notify')">Notify</button>
</div>

<!-- ✅ Will work (because of .window) -->
<div x-data>
    <span @notify.window="..."></span>
    <button @click="$dispatch('notify')">Notify</button>
</div>
\`\`\`

### Dispatching to other components

\`\`\`alpine
<div
    x-data="{ title: 'Hello' }"
    @set-title.window="title = $event.detail"
>
    <h1 x-text="title"></h1>
</div>

<div x-data>
    <button @click="$dispatch('set-title', 'Hello World!')">Click me</button>
</div>
<!-- When clicked, the content of the h1 will set to "Hello World!". -->
\`\`\`

### Dispatching to x-model

You can also use \`$dispatch()\` to trigger data updates for \`x-model\` data bindings:

\`\`\`alpine
<div x-data="{ title: 'Hello' }">
    <span x-model="title">
        <button @click="$dispatch('input', 'Hello World!')">Click me</button>
        <!-- After the button is pressed, \`x-model\` will catch the bubbling "input" event, and update title. -->
    </span>
</div>
\`\`\`

### Cancelable events

You can use the returned value of \`$dispatch\` to check if the event was canceled or not:

\`\`\`alpine
<div x-data x-on:open="$event.preventDefault()">
    <div x-data="{ open: false }">
        <button @click="if($dispatch('open')){ open = true; }">Click me</button>
        <div x-show="open">
            <h1>Hello</h1>
        </div>
    </div>
</div>
\`\`\`

### Overwriting options

You can use the third parameter of \`$dispatch\` to overwrite the default options of the event:

\`\`\`alpine
<!-- 🚫 Won't work because the event is being listened on the parent element -->
<div x-data="{ title: 'Hello' }" x-on:update-title="title = $event.detail">
    <button @click="$dispatch('update-title', 'Hello World!', {bubbles: false})">Click me</button>
</div>

<!-- ✅ Will work because the event is being listened on the same element -->
<div x-data="{ title: 'Hello' }">
    <button x-on:update-title="title = $event.detail" @click="$dispatch('update-title', 'Hello World!', {bubbles: false})">Click me</button>
</div>
\`\`\`

---

## $nextTick

\`$nextTick\` is a magic property that allows you to only execute a given expression AFTER Alpine has made its reactive DOM updates. This is useful for times you want to interact with the DOM state AFTER it's reflected any data updates you've made.

\`\`\`alpine
<div x-data="{ title: 'Hello' }">
    <button
        @click="
            title = 'Hello World!';
            $nextTick(() => { console.log($el.innerText) });
        "
        x-text="title"
    ></button>
</div>
\`\`\`

In the above example, rather than logging "Hello" to the console, "Hello World!" will be logged because \`$nextTick\` was used to wait until Alpine was finished updating the DOM.

### Promises

\`$nextTick\` returns a promise, allowing the use of \`$nextTick\` to pause an async function until after pending DOM updates. When used like this, \`$nextTick\` also does not require an argument to be passed.

\`\`\`alpine
<div x-data="{ title: 'Hello' }">
    <button
        @click="
            title = 'Hello World!';
            await $nextTick();
            console.log($el.innerText);
        "
        x-text="title"
    ></button>
</div>
\`\`\`

---

## $root

\`$root\` is a magic property that can be used to retrieve the root element of any Alpine component. In other words the closest element up the DOM tree that contains \`x-data\`.

\`\`\`alpine
<div x-data data-message="Hello World!">
    <button @click="alert($root.dataset.message)">Say Hi</button>
</div>
\`\`\`

---

## $data

\`$data\` is a magic property that gives you access to the current Alpine data scope (generally provided by \`x-data\`).

Most of the time, you can just access Alpine data within expressions directly. For example \`x-data="{ message: 'Hello Caleb!' }"\` will allow you to do things like \`x-text="message"\`.

However, sometimes it is helpful to have an actual object that encapsulates all scope that you can pass around to other functions:

\`\`\`alpine
<div x-data="{ greeting: 'Hello' }">
    <div x-data="{ name: 'Caleb' }">
        <button @click="sayHello($data)">Say Hello</button>
    </div>
</div>

<script>
    function sayHello({ greeting, name }) {
        alert(greeting + ' ' + name + '!')
    }
</script>
\`\`\`

Now when the button is pressed, the browser will alert \`Hello Caleb!\` because it was passed a data object that contained all the Alpine scope of the expression that called it (\`@click="..."\`).

---

## $id

\`$id\` is a magic property that can be used to generate an element's ID and ensure that it won't conflict with other IDs of the same name on the same page.

This utility is extremely helpful when building re-usable components (presumably in a back-end template) that might occur multiple times on a page, and make use of ID attributes.

### Basic usage

\`\`\`alpine
<input type="text" :id="$id('text-input')">
<!-- id="text-input-1" -->

<input type="text" :id="$id('text-input')">
<!-- id="text-input-2" -->
\`\`\`

### Grouping with x-id

Now let's say you want to have those same two input elements, but this time you want \`<label>\` elements for each of them.

\`\`\`alpine
<div x-id="['text-input']">
    <label :for="$id('text-input')"> <!-- "text-input-1" -->
    <input type="text" :id="$id('text-input')"> <!-- "text-input-1" -->
</div>

<div x-id="['text-input']">
    <label :for="$id('text-input')"> <!-- "text-input-2" -->
    <input type="text" :id="$id('text-input')"> <!-- "text-input-2" -->
</div>
\`\`\`

\`x-id\` accepts an array of ID names. Any usages of \`$id()\` within that scope will all use the same ID. Think of them as "id groups".

### Nesting

You can freely nest \`x-id\` groups:

\`\`\`alpine
<div x-id="['text-input']">
    <label :for="$id('text-input')"> <!-- "text-input-1" -->
    <input type="text" :id="$id('text-input')"> <!-- "text-input-1" -->

    <div x-id="['text-input']">
        <label :for="$id('text-input')"> <!-- "text-input-2" -->
        <input type="text" :id="$id('text-input')"> <!-- "text-input-2" -->
    </div>
</div>
\`\`\`

### Keyed IDs (For Looping)

Sometimes, it is helpful to specify an additional suffix on the end of an ID for the purpose of identifying it within a loop. \`$id()\` accepts an optional second parameter that will be added as a suffix:

\`\`\`alpine
<ul
    x-id="['list-item']"
    :aria-activedescendant="$id('list-item', activeItem.id)"
>
    <template x-for="item in items" :key="item.id">
        <li :id="$id('list-item', item.id)">...</li>
    </template>
</ul>
\`\`\`
`;
