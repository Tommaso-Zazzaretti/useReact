import css from './Modal.module.css';
import React from "react";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
};


export const Modal = (props: ModalProps) => {

    const { isOpen, onClose } = props;

    const overlay   = React.useRef<HTMLDivElement>(null);
    const modalRef  = React.useRef<HTMLDivElement>(null);
    const outFocus  = React.useRef<HTMLElement|null>(null);
    const sentinel1 = React.useRef<HTMLDivElement|null>(null);
    const sentinel2 = React.useRef<HTMLDivElement|null>(null);

    const observeBackdropRemoval = React.useCallback(() => {
        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (mutation.type === 'childList') {
                mutation.removedNodes.forEach((removedNode) => {
                    // Se il backdrop è stato rimosso
                    if (removedNode === overlay.current) {
                        document.body.style.pointerEvents = 'none'; // Disabilita pointer events
                    }
                });
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    },[]);

    const tabKeyDownEventHandler = React.useCallback((e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        console.log(document.activeElement);
        
        const focusable = getFocusableElements(modalRef.current!);

        const focus1 = focusable[0] ?? sentinel1;
        const focusN = focusable[focusable.length - 1] ?? sentinel2;

        const isFirst = document.activeElement === focus1 || document.activeElement === sentinel1.current;
        const isLast  = document.activeElement === focusN || document.activeElement === sentinel2.current;

        if(document.activeElement===document.body || document.activeElement===null){
            e.preventDefault();
            const focus = e.shiftKey ? sentinel2 : sentinel1;
            focus.current?.focus(); 
            return; 
        }
        if ((e.shiftKey && isFirst)) {
            e.preventDefault();
            focusN?.focus(); // Vai all'ultimo elemento focusabile
            return;
        }
        if (!e.shiftKey && isLast) {
            e.preventDefault();
            focus1?.focus(); // Torna al primo elemento focusabile
            return;
        }
    }, []);
  
    // Restore out modal focus on unmount/close
    React.useEffect(() => {
        if(isOpen) {
            outFocus.current = document.activeElement as HTMLElement;
            sentinel1.current?.focus();
        } else {
            outFocus.current?.focus();
            document.body.style.pointerEvents = '';
        }

        // Osserva il backdrop solo se la modale è aperta
        if (isOpen) {
            const cleanupObserver = observeBackdropRemoval();
            return cleanupObserver;
        }
    }, [isOpen,observeBackdropRemoval]);

    // Restore out modal focus on unmount/close
    React.useEffect(() => {
        return () => {
            outFocus.current?.focus();
        };
    }, []);

    // Window Focus
    React.useEffect(() => {
        let isShiftPressed = false;
    
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Shift") { isShiftPressed = true; }
        };
        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === "Shift") { isShiftPressed = false; }
        };
        const restoreFocus = () => {
            (isShiftPressed ? sentinel2 : sentinel1)?.current?.focus();
        };
    
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("focus", restoreFocus);
    
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("focus", restoreFocus);
        };
    }, [isOpen]);

  
    // Event listeners
    React.useEffect(() => {
        document.addEventListener("keydown", tabKeyDownEventHandler);
        return () => {
            console.log('unmount')
            document.removeEventListener("keydown", tabKeyDownEventHandler);
        };
    }, [isOpen,tabKeyDownEventHandler]);

  
    if(!isOpen) {
        return <React.Fragment></React.Fragment>
    }
  
    return (
        <React.Fragment>
            <div ref={sentinel1} tabIndex={isOpen ? 0 : -1} className={css.tabFocusSentinel} />
                <div ref={overlay} className={css.modalOverlay} role="dialog" aria-modal="true" tabIndex={-1}>
                    <div ref={modalRef} className={css.modalContent} tabIndex={-1}>
                        <h2>Modale</h2>
                        <p>Questo è un esempio di modale con trap focus.</p>
                        <input type="text" placeholder="Campo di input" />
                        <button onClick={onClose}>Chiudi</button>
                    </div>
                </div>
            <div ref={sentinel2} tabIndex={isOpen ? 0 : -1} className={css.tabFocusSentinel} />
        </React.Fragment>
    );
  };


const isElementFocusable = (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element);

    // Verifica se l'elemento è visibile
    const isVisible = style.display !== "none" && style.visibility !== "hidden" && parseFloat(style.opacity) !== 0;
    
    // Verifica aria-hidden
    const isAriaHidden = element.hasAttribute("aria-hidden") && element.getAttribute("aria-hidden") === "true";
    
    // Verifica se l'elemento è disabilitato o readonly
    const isDisabled = element.hasAttribute("disabled") || element.hasAttribute("aria-disabled") || element.hasAttribute("readonly");
    
    // Verifica tabindex
    const hasNegativeTabIndex = element.hasAttribute("tabindex") && parseInt(element.getAttribute("tabindex")!) === -1;

    // Verifica display: contents o hidden
    const isHidden = style.display === "contents" || element.hasAttribute("hidden");

    // Verifica se l'elemento è un <details> chiuso
    const isDetailsClosed = element.tagName === "DETAILS" && !(element as HTMLDetailsElement).open;

    // Verifica visibilità collapse
    const isCollapse = style.visibility === "collapse";

    // Verifica la posizione absolute o fixed senza offsetParent
    const isPositionAbsoluteFixed = (style.position === "absolute" || style.position === "fixed") && !element.offsetParent;

    // Verifica contenteditable
    const isContentEditable = element.hasAttribute("contenteditable") && element.getAttribute("contenteditable") === "false";

    // Se una delle condizioni lo rende non focusabile, ritorna false
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

    // Verifica il tipo di elemento per determinare se può essere focusato
    const focusableElements = [
        "a[href]", "button", "input", "select", "textarea", "details", "summary",
        "iframe", "audio", "video", "canvas", "img", "object", "embed", "svg", 
        "[contenteditable='true']", "[role='link']", "[role='button']", "[role='checkbox']",
        "[role='combobox']", "[role='listbox']", "[role='menu']", "[role='menuitem']",
        "[role='dialog']", "[role='alert']", "[role='textbox']", "[role='treeitem']"
    ];

    // Se è uno degli elementi focusabili previsti, ritorna true
    return focusableElements.some(selector => element.matches(selector));
};

const isFocusable = (element: HTMLElement,ancestor:HTMLElement): boolean => {
    let e:HTMLElement|null = element;
    while (e!==null && e!==ancestor) {
        if (!isElementFocusable(e)) {
            return false;
        }
        e = e.parentElement;
    }

    return true;
};

// Usa la funzione per filtrare gli elementi focusabili
const getFocusableElements = (element: HTMLElement) => {
    const focusable = element.querySelectorAll("*") as NodeListOf<HTMLElement>;

    // Filtra gli elementi che sono effettivamente focusabili
    return Array.from(focusable).filter(el => isFocusable(el,element));
};