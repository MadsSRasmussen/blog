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

A _static getter `tag`_ is declared, followed by a _static initialization block_ in which the component is registered via the `register` method of the `Component` class.

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

#### The template.html

The `template.html` documents contains the actual html of the component. This will eventually be the html-contents of the _shadow DOM_ og our Web Component. The way I choose to implement it, the html-file will contain a root template tag - no metadata og DOCTYPE or anything of that nature. 

The following is an example of such a template.html file:

```html
<template>
    <div class="content-container">
        <slot></slot>
    </div>
</template>
```

The above snippit is perfectly valid html and can crucially be parsed by an instance of `DOMParser`. Notice the *slot* tag - this is a special tag that acts as a placeholder for any html content that will eventually be placed within the opening- and closing tags of the resulting component.

#### The styles.css

The `styles.css` file will house the css styles of the component. This will also live inside the Shadow DOM - so the component itself will be isolated from surrounding css.
In my opinion one needs to be able to import a reset and css variables into the `styles.css` file of the component for this not to be a disadvantage. _We will make sure we can import relative stylesheets into the component stylesheets at a later point._

An example stylesheet for the above component could be:

```css
.content-container {
    padding: 2rem;
    border: 1px solid black;
}
```

Defining styles on a class 'content-container' might seem like a bad idea, but the styles do not _bleed out_ of the Shadow DOM, so no other '.content-container' classes will be affected.

### Writing the attatch logic

Organizing our files as described above is all well and good, but how would we go about actually loading the content?

We will end up defining an `attatch` method on our `Component` class, but first we will need to define a few things. 

_Firstly_, we will need to insantiate the Shadow DOM with the 'open' mode. 

_Second_, our new attatch method will be asynchronus - this means that we might end up query the Shadow DOM for for elements that are not yet loaded, resulting in errors. 
To solve this, we will create a `ready` method that returns a promise, resolving if / when the contents are loaded and attatched.

To do this, we will add the following to `Component` class as well as implementing the constructor.

```js
class Component extends HTMLElement {
    // ...

    /** @type {Promise<void>} */
    readyPromise;
    
    /** @type {() => Promise<void>} */
    ready;

    #resolveReady = null;
    #rejectReady = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.readyPromise = new Promise((resolve, reject) => {
            this.#resolveReady = resolve;
            this.#rejectReady = reject;
        });
        this.ready = () => this.readyPromise;
    }
}
```

#### Writing the attatch method

Now we are ready to write our `attatch` method. The method ends up being the core method of the entire framework and _a little long_ but not very complex. 
The method does the following:

- It takes in the url of the js file in which the component is defined. 
- It then fetches the template.html and styles.css files relative to that location - **this crucially means that the framework is opinionated on the filestructure!**
- Parse the css and html files - replacing relative css imports with absolutes
- Creating a final `<template>` element housing both the styles and the inner-html of the template.html file.
- Finally the method must attatch this element to the Shadow DOM.

The resulting method can be written like so:

```js
class Component extends HTMLElement {
    // ...

    /**
     * Loads template.html and styles.css relative to baseUrl and attatches these to the component
     * @param {URL | string} baseUrl 
     */
    async attach(baseUrl) {
        baseUrl = new URL(baseUrl)
        const templateUrl = new URL('template.html', baseUrl);
        const stylesUrl = new URL('styles.css', baseUrl);
        
        try {
            const [templateResult, styleResult] = await Promise.allSettled([
                fetch(templateUrl).then(res => {
                    if (!res.ok) throw new Error(`Failed to load template: ${templateUrl}`);
                    return res.text();
                }),
                fetch(stylesUrl).then(res => {
                    if (!res.ok) throw new Error(`Failed to load styles: ${stylesUrl}`);
                    return res.text();
                }),
            ]);

            if (templateResult.status !== 'fulfilled') {
                console.warn(`Unable to load template at: ${templateUrl}`);
            }

            if (styleResult.status !== 'fulfilled') {
                console.warn(`Unable to load styles at: ${stylesUrl}`);
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(templateResult.value ?? '', 'text/html');
            const template = doc.querySelector('template');

            if (!template) throw new Error(`No <template> tag found in ${templateUrl}`);

            const replacedStyles = replaceRelativeCSSImports(styleResult.value ?? '', baseUrl);

            const element = document.createElement('template');
            element.innerHTML = `<style>${replacedStyles}</style>${template.innerHTML}`;
            this.shadowRoot.appendChild(element.content.cloneNode(true));

            this.#resolveReady();
        } catch (error) {
            this.#rejectReady(error);
        }

        return this.ready;
    }
}
```

You might notice that the method makes a call to a `replaceRelativeCSSImports` function. This function is not defined in the above method but is rather a utility function defined like so:

```js
/**
 * Replaces relative imports with absolute imports
 * @param {string} content 
 * @param {URL | string} absolutePath 
 * @returns 
 */
function replaceRelativeCSSImports(content, absolutePath) {
    absolutePath = new URL(absolutePath);

    const regex = /@import\s+["']([^"']+)["'];/g;

    return content.replace(regex, (_, importPath) => {
        if (/^(https?:)?\/\//.test(importPath)) {
            return `@import "${importPath}"`;
        }
        return `@import url("${(new URL(importPath, absolutePath))}");`
    });
}
```

Notice how the `attatch` method crucially either resolves or rejects the `readyPromise` in the end of the try- catch block.