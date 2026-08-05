// Bootstrap ships no TypeScript types for its JS components (no `types` field
// in its package.json, and @types/bootstrap is not installed). This ambient
// module covers the shape `bootstrap-offcanvas.tsx` actually uses: `new
// Offcanvas(el)` plus show/hide/dispose. Extend with more components (Modal,
// Collapse, ...) as the dynamic-import pattern gets reused for them.
declare module "bootstrap/js/dist/offcanvas" {
  export default class Offcanvas {
    constructor(element: Element, options?: Record<string, unknown>);
    show(relatedTarget?: Element): void;
    hide(): void;
    toggle(relatedTarget?: Element): void;
    dispose(): void;
    static getInstance(element: Element): Offcanvas | null;
    static getOrCreateInstance(element: Element, options?: Record<string, unknown>): Offcanvas;
  }
}
