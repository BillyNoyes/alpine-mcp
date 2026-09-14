# x-model

`x-model` allows you to bind the value of an input element to Alpine data.

Here's a simple example of using `x-model` to bind the value of a text field to a piece of data in Alpine.

```alpine
<div x-data="{ message: '' }">
    <input type="text" x-model="message">

    <span x-text="message"></span>
</div>
```

Now as the user types into the text field, the `message` will be reflected in the `<span>` tag.

`x-model` is two-way bound, meaning it both "sets" and "gets". In addition to changing data, if the data itself changes, the element will reflect the change.


We can use the same example as above but this time, we'll add a button to change the value of the `message` property.

```alpine
<div x-data="{ message: '' }">
    <input type="text" x-model="message">

    <button x-on:click="message = 'changed'">Change Message</button>
</div>
```

Now when the `<button>` is clicked, the input element's value will instantly be updated to "changed".

`x-model` works with the following input elements:

* `<input type="text">`
* `<textarea>`
* `<input type="checkbox">`
* `<input type="radio">`
* `<select>`
* `<input type="range">`

## Text inputs

```alpine
<input type="text" x-model="message">

<span x-text="message"></span>
```

> Despite not being included in the above snippet, `x-model` cannot be used if no parent element has `x-data` defined. [→ Read more about `x-data`](/directives/data)

## Textarea inputs

```alpine
<textarea x-model="message"></textarea>

<span x-text="message"></span>
```

## Checkbox inputs

### Single checkbox with boolean

```alpine
<input type="checkbox" id="checkbox" x-model="show">

<label for="checkbox" x-text="show"></label>
```

### Multiple checkboxes bound to array

```alpine
<input type="checkbox" value="red" x-model="colors">
<input type="checkbox" value="orange" x-model="colors">
<input type="checkbox" value="yellow" x-model="colors">

Colors: <span x-text="colors"></span>
```

## Radio inputs

```alpine
<input type="radio" value="yes" x-model="answer">
<input type="radio" value="no" x-model="answer">

Answer: <span x-text="answer"></span>
```

## Select inputs


### Single select

```alpine
<select x-model="color">
    <option>Red</option>
    <option>Orange</option>
    <option>Yellow</option>
</select>

Color: <span x-text="color"></span>
```

### Single select with placeholder

```alpine
<select x-model="color">
    <option value="" disabled>Select A Color</option>
    <option>Red</option>
    <option>Orange</option>
    <option>Yellow</option>
</select>

Color: <span x-text="color"></span>
```


### Multiple select

```alpine
<select x-model="color" multiple>
    <option>Red</option>
    <option>Orange</option>
    <option>Yellow</option>
</select>

Colors: <span x-text="color"></span>
```

### Dynamically populated Select Options

```alpine
<select x-model="color">
    <template x-for="color in ['Red', 'Orange', 'Yellow']">
        <option x-text="color"></option>
    </template>
</select>

Color: <span x-text="color"></span>
```

## Range inputs

```alpine
<input type="range" x-model="range" min="0" max="1" step="0.1">

<span x-text="range"></span>
```

## Modifiers

### `.lazy`

On text inputs, by default, `x-model` updates the property on every keystroke. By adding the `.lazy` modifier, you can force an `x-model` input to only update the property when user focuses away from the input element.

This is handy for things like real-time form-validation where you might not want to show an input validation error until the user "tabs" away from a field.

```alpine
<input type="text" x-model.lazy="username">
<span x-show="username.length > 20">The username is too long.</span>
```

### `.change`

`.change` syncs the data only when the input loses focus and its value has changed (the native `change` event). This is functionally equivalent to `.lazy`.

```alpine
<input type="text" x-model.change="username">
```

### `.blur`

`.blur` syncs the data when the input loses focus, regardless of whether the value has changed.

```alpine
<input type="text" x-model.blur="email">
```

### `.enter`

`.enter` syncs the data when the user presses the Enter key. This is useful for search fields where you want to trigger an action only when the user explicitly submits.

```alpine
<input type="text" x-model.enter="search">
```

> Note: `.enter` does not prevent the default behavior. If the input is inside a form, the form will still submit.

### Combining Event Modifiers

The `.change`, `.blur`, and `.enter` modifiers can be combined to sync on multiple events. This is useful when you want to give users flexibility in how they submit data.

```alpine
<!-- Sync on blur OR enter -->
<input type="text" x-model.blur.enter="search" placeholder="Press Enter or click away">

<!-- Sync on change, blur, OR enter -->
<input type="text" x-model.change.blur.enter="message">
```

### `.number`

By default, any data stored in a property via `x-model` is stored as a string. To force Alpine to store the value as a JavaScript number, add the `.number` modifier.

```alpine
<input type="text" x-model.number="age">
<span x-text="typeof age"></span>
```

### `.boolean`

By default, any data stored in a property via `x-model` is stored as a string. To force Alpine to store the value as a JavaScript boolean, add the `.boolean` modifier. Both integers (1/0) and strings (true/false) are valid boolean values.

```alpine
<select x-model.boolean="isActive">
    <option value="true">Yes</option>
    <option value="false">No</option>
</select>
<span x-text="typeof isActive"></span>
```

### `.debounce`

By adding `.debounce` to `x-model`, you can easily debounce the updating of bound input.

This is useful for things like real-time search inputs that fetch new data from the server every time the search property changes.

```alpine
<input type="text" x-model.debounce="search">
```

The default debounce time is 250 milliseconds, you can easily customize this by adding a time modifier like so.

```alpine
<input type="text" x-model.debounce.500ms="search">
```

### `.throttle`

Similar to `.debounce` you can limit the property update triggered by `x-model` to only updating on a specified interval.

<input type="text" x-model.throttle="search">

The default throttle interval is 250 milliseconds, you can easily customize this by adding a time modifier like so.

```alpine
<input type="text" x-model.throttle.500ms="search">
```

### `.fill`

By default, if an input has a value attribute, it is ignored by Alpine and instead, the value of the input is set to the value of the property bound using `x-model`.

But if a bound property is empty, then you can use an input's value attribute to populate the property by adding the `.fill` modifier.

<div x-data="{ message: null }">
  <input type="text" x-model.fill="message" value="This is the default message.">
</div>

## Programmatic access

Alpine exposes under-the-hood utilities for getting and setting properties bound with `x-model`. This is useful for complex Alpine utilities that may want to override the default x-model behavior, or instances where you want to allow `x-model` on a non-input element.

You can access these utilities through a property called `_x_model` on the `x-model`ed element. `_x_model` has two methods to get and set the bound property:

* `el._x_model.get()` (returns the value of the bound property)
* `el._x_model.set()` (sets the value of the bound property)

```alpine
<div x-data="{ username: 'calebporzio' }">
    <div x-ref="div" x-model="username"></div>

    <button @click="$refs.div._x_model.set('phantomatrix')">
        Change username to: 'phantomatrix'
    </button>

    <span x-text="$refs.div._x_model.get()"></span>
</div>
```
