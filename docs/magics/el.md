# $el

`$el` is a magic property that can be used to retrieve the current DOM node.

```alpine
<button @click="$el.innerHTML = 'Hello World!'">Replace me with "Hello World!"</button>
```
