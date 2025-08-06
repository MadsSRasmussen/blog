import { replaceRelativeCSSImports } from "./utils.js";

export class Component extends HTMLElement {
    /**
     * Registers a component
     * @param {Component} component 
     */
    static register(component) {
        if (!component.tag) throw new Error('Cannot register component without a tag');
        if (!customElements.get(component.tag)) {
            customElements.define(component.tag, component);
        }
    }

    /** @type {Promise<void>} */
    readyPromise;

    /** @type {() => Promise<void>} */
    ready;

    /** @type {(value: void | PromiseLike<void>) => void | null} */
    #resolveReady = null;

    /** @type {(reason?: any) => void | null} */
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

    /**
     * Shorthand for shadowRoot?.querySelector
     * @template {keyof HTMLElementTagNameMap} K
     * @param {K} selector
     * @returns {HTMLElementTagNameMap[K] | null}
     */
    query(selector) {
        return this.shadowRoot?.querySelector(selector);
    }

    /**
     * Emit a custom event
     * @param {string} type 
     * @param {Object} detail 
     */
    emit(type, detail = {}) {
        const tag = this.constructor.tag;
        if (!tag) throw Error('No elemnt tag');

        const event = new CustomEvent(`${tag}:${type}`, {
            bubbles: true,
            cancelable: true,
            detail: detail,
        });

        return this.dispatchEvent(event);
    }
}