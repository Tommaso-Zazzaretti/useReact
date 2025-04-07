export class FocusUtils {

    protected static isNodeVisible(element: HTMLElement): boolean {
        const style = window.getComputedStyle(element);
    
        if (style.display === "none") {
            return false;
        }
        if (style.visibility === "hidden" || style.visibility === "collapse") {
            return false;
        }
        if (parseFloat(style.opacity) === 0) {
            return false;
        }
        if (element.hasAttribute("hidden")) {
            return false;
        }
        if (element.getAttribute("aria-hidden") === "true") {
            return false;
        }
        return true;
    }

    protected static isFocusable(element: HTMLElement): boolean {
        if (element.hasAttribute("disabled")) {
            return false;
        }
        if (element.getAttribute("aria-disabled") === "true") {
            return false;
        }
        if (element.hasAttribute("readonly")) {
            return false;
        }
        if (element.hasAttribute("tabindex") && parseInt(element.getAttribute("tabindex")!) === -1) {
            return false;
        }
        if (element.tagName === "DETAILS" && !(element as HTMLDetailsElement).open) {
            return false;
        }
        if (element.getAttribute("contenteditable") === "false") {
            return false;
        }
        const focusableSelectors = [
            "a[href]", "button", "input", "select", "textarea", "details", "summary",
            "iframe", "audio", "video", "canvas", "img", "object", "embed", "svg", 
            "[contenteditable='true']", "[role='link']", "[role='button']", "[role='checkbox']",
            "[role='combobox']", "[role='listbox']", "[role='menu']", "[role='menuitem']",
            "[role='dialog']", "[role='alert']", "[role='textbox']", "[role='treeitem']"
        ];
        return focusableSelectors.some(sel => element.matches(sel));
    }

    public static getFocusableByDFS(root: HTMLElement): HTMLElement[] {
        const focusables: HTMLElement[] = [];
        const dfs = (node: HTMLElement) => {
            // [1] Pruning
            if (!FocusUtils.isNodeVisible(node)) { return; }
            // [2] Traverse adding
            if (FocusUtils.isFocusable(node)) { focusables.push(node); }
            // [3] Recursive step
            for (const child of Array.from(node.children)) {
                if (!(child instanceof HTMLElement)) { return; }
                dfs(child);           
            }
        };
        dfs(root);
        return focusables;
    }
}