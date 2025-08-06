### Table of contents

- [Introduction to Web Components](#introduction-to-web-components)
- [Problems to solve](#problems-to-solve)
- [Registering components](#registering-components)

### Introduction to Web Components

Lorem ipsum.

### Problems to solve

- Project independence
- Syntax highlighting in modern editors
- Efficiancy

### Registering components

Firstly we will handle registering the actual HTMLElement - this is achieved via a call to the `customElements.define()` function. 

In order to do so we will start by creating our _tiny Web Components framework_. The framework is just a single `Component` class. In order for the `Component` class to handle registering components, we will give it a `static register`method like so:

```js
class Component extends HTMLElement {
    /**
     * Registers a component
     * @param {Component} component 
     */
    static register(component) {
        if (!component.tag) throw new Error('Cannot register component without tag');
        if (!customElements.get(component.tag)) {
            customElements.define(component.tag, component);
        }
    }
}
```

The `register` method expects a `Component` class as a parameter and for that `Component`class to have a `static tag` property. 

Now, to register a component with the tag 'some-component', the following will suffice:

```js
class SomeComponent extends Component {
    static get tag() { return 'some-component' };
    static {
        Component.register(ButtonComponent);
    }
}
```

Firstly a _static getter `tag`_ is declared, followed by a _static initialization block_ in which the component is registered via the `register` method of the `Component` class.