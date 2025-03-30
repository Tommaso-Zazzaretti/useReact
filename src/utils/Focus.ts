
export class FocusUtils {

    protected static isElementFocusable(element: HTMLElement): boolean {
        const style = window.getComputedStyle(element);
    
        // Visibiliy Check
        const isVisible = style.display !== "none" && style.visibility !== "hidden" && parseFloat(style.opacity) !== 0;
        
        // Aria-.. Check
        const isAriaHidden = element.hasAttribute("aria-hidden") && element.getAttribute("aria-hidden") === "true";
        
        // Disabled Check
        const isDisabled = element.hasAttribute("disabled") || element.hasAttribute("aria-disabled") || element.hasAttribute("readonly");
        
        // Tabindex Check
        const hasNegativeTabIndex = element.hasAttribute("tabindex") && parseInt(element.getAttribute("tabindex")!) === -1;
    
        // Display Check
        const isHidden = style.display === "contents" || element.hasAttribute("hidden");
    
        // Closed <details> Check
        const isDetailsClosed = element.tagName === "DETAILS" && !(element as HTMLDetailsElement).open;
    
        // Collapse Visibility Check
        const isCollapse = style.visibility === "collapse";
    
        // Position Check
        const isPositionAbsoluteFixed = (style.position === "absolute" || style.position === "fixed") && !element.offsetParent;
    
        // Contenteditable Check
        const isContentEditable = element.hasAttribute("contenteditable") && element.getAttribute("contenteditable") === "false";
    
        // If at least check is false, the element is not focusable via tab
        if (
            !isVisible ||
            isAriaHidden ||
            isDisabled ||
            hasNegativeTabIndex ||
            isHidden ||
            isDetailsClosed ||
            isCollapse ||
            isPositionAbsoluteFixed ||
            isContentEditable
        ) {
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
        const focusable = element.querySelectorAll("*") as NodeListOf<HTMLElement>;
        return Array.from(focusable).filter(el => FocusUtils.isFocusable(el,element));
    };
}