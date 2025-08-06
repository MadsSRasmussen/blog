/**
 * Replaces relative imports with absolute imports
 * @param {string} content 
 * @param {URL | string} absolutePath 
 * @returns 
 */
export function replaceRelativeCSSImports(content, absolutePath) {
    absolutePath = new URL(absolutePath);

    const regex = /@import\s+["']([^"']+)["'];/g;

    return content.replace(regex, (_, importPath) => {
        if (/^(https?:)?\/\//.test(importPath)) {
            return `@import "${importPath}"`;
        }
        return `@import url("${(new URL(importPath, absolutePath))}");`
    });
}