### Table of contents

- [Introduction to Web Components](#introduction-to-web-components)
- [Problems to solve](#problems-to-solve)
- [Creating the Component class](#creating-the-component-class)

### Introduction to Web Components

Lorem ipsum.

### Problems to solve

- Project independence
- Syntax highlighting in modern editors
- Efficiancy

### Creating the Component class

#### Registering the component

Firstly, we will extend the standard `HTMLElement` class when creating our own _minimal framework_. Personally i do not like the `customElements.define()` call to live outside the class, so let's give our Component class a static `register` method to handle component registration:

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

The register method checks if the tag-name is allready defined, returning the constructor of the element if it is or `undefined` if it is not.

There are perhaps two things to notice allready:

- **_First_**, the register method takes in a `Component` as the only parameter - this is beacuse any components we create will be extending this very `Component` class.

- **_Second_**, the method checks for a static tag property on the constructor passed to the method. This tag is crucially defined on the actual component.

Registering a component would then require the following:

```js
class ButtonComponent extends Component {
    static get tag() { return 'some-component' };
    static {
        Component.register(ButtonComponent);
    }
}
```

Here, the tag is set as a _readonly_, static property on the component class. Futhermore the component is registered in a static initialization block.

#### Attatching the component