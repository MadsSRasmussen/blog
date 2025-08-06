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

In order to do so we will start by creating our _tiny Web Components framework_, which is just a single class we will call `Component`. To handle registering components, we will give it a static register method like so:

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

### Attatching html, css and js

In order for our components to have any content we will need to specify some _html_, possibly som _css_ and some additional _JavaScript_ functionality.

The _JavaScript_ part is easy - since we extended the `HTMLElement` class in our original `Component` class, we have access to the necessary api's directly in our subclass.

The _html_ and _css_ parts are a bit more tricky to implement in a neat fashion...

There are a lot of different approaches to this - the most common of which is having both the _css_ and _html_ in the _JavaScript_ file. There are definetly advantages to having all the component code in a single file, but one will miss out on syntax highlighting and creating complex components can be cluttered in a single file - this will not cut it for our cutting edge little framework!

Instead we will use an approach where each component is represented via 3 different files:

- A `template.html` file containing the actual html of the component
- A `styles.css` file containg the css styles of the component
- And an `index.js` file containing the `Component` class

These are intended to live in a folder structure like the following:

```
components/
└── button/
    ├── index.js
    ├── template.html
    └── styles.css
```