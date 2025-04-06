
export class FocusUtils {

    protected static isElementFocusable(element: HTMLElement): boolean {
        const style = window.getComputedStyle(element);
    
        // Visibiliy Check
        if(style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || parseFloat(style.opacity) === 0){
            return false;
        }
        // Aria-.. Check
        if(element.hasAttribute("aria-hidden") && element.getAttribute("aria-hidden") === "true"){
            return false;
        }
        // Disabled Check
        if(element.hasAttribute("disabled") || element.hasAttribute("aria-disabled") || element.hasAttribute("readonly")){
            return false;
        };
        // Tabindex Check
        if(element.hasAttribute("tabindex") && parseInt(element.getAttribute("tabindex")!) === -1){
            return false;
        }
        // Display Check
        if(style.display === "contents" || element.hasAttribute("hidden")){
            return false;
        }
        // Closed <details> Check
        if(element.tagName === "DETAILS" && !(element as HTMLDetailsElement).open){
            return false;
        }
        // Position Check
        if((style.position === "absolute" || style.position === "fixed") && !element.offsetParent){
            return false;
        }
        // Contenteditable Check
        if(element.hasAttribute("contenteditable") && element.getAttribute("contenteditable") === "false"){
            return false;
        }
        // Role and type check
        const focusableElements = [
            "a[href]", "button", "input", "select", "textarea", "details", "summary",
            "iframe", "audio", "video", "canvas", "img", "object", "embed", "svg", 
            "[contenteditable='true']", "[role='link']", "[role='button']", "[role='checkbox']",
            "[role='combobox']", "[role='listbox']", "[role='menu']", "[role='menuitem']",
            "[role='dialog']", "[role='alert']", "[role='textbox']", "[role='treeitem']"
        ];
        return focusableElements.some(selector => element.matches(selector));
    };
    
    public static isFocusable (element: HTMLElement,ancestor:HTMLElement): boolean {
        let e:HTMLElement|null = element;
        while (e!==null && e!==ancestor) {
            if (!FocusUtils.isElementFocusable(e)) {
                return false;
            }
            e = e.parentElement;
        }
        return true;
    };
    
    public static getFocusableElements(element: HTMLElement) {
        if (!element) { return []; }
        const focusable = element.querySelectorAll("*") as NodeListOf<HTMLElement>;
        return Array.from(focusable).filter(el => FocusUtils.isFocusable(el,element));
    };
}