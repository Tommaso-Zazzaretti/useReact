import { FocusUtils } from '../../utils/Focus';
import css from './Modal.module.css';
import React from "react";

export type IModalProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'> & { 
    children: React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>
    open: boolean;
    onClose: () => void;
}

export const Modal:React.ForwardRefExoticComponent<IModalProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null,IModalProps>((props:IModalProps,ref:React.ForwardedRef<HTMLDivElement|null>) => {

    const { open, onClose, children, ...modalProps } = props;

    const overlay    = React.useRef<HTMLDivElement>(null);
    const content    = React.useRef<HTMLDivElement>(null);
    const sentinel1  = React.useRef<HTMLDivElement|null>(null);
    const sentinel2  = React.useRef<HTMLDivElement|null>(null);
    const outerFocus = React.useRef<HTMLElement|null>(null);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement|null,HTMLDivElement|null>(ref, () => { 
        return content.current; 
    });

    // UNMOUNT => RESTORE 
    React.useEffect(() => {
        return () => {
            outerFocus.current?.focus?.();
            document.body.style.pointerEvents = ''; 
        };
    }, []);

    // TRAP/UNTRAP FOCUS WHILE OPENING/CLOSING
    React.useEffect(() => {
        if(open) {
            outerFocus.current = document.activeElement as HTMLElement;
            sentinel1.current?.focus?.();
        } else {
            outerFocus.current?.focus?.();
        }
    }, [open]);

    // OVERLAY REMOVAL
    React.useEffect(()=>{
        if(!open){ 
            document.body.style.pointerEvents = ''; 
            return; 
        }
        const observeBackdropRemoval = () => {
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
            return observer;
        };

        const observer = observeBackdropRemoval();
        return () => {
            observer.disconnect();
        }
    },[open])

  
    // TAB HANDLER
    React.useEffect(() => {

        if(!open){ return; }

        const tabKeyDownEventHandler = (event: KeyboardEvent) => {
            if (event.key !== "Tab") return;
            console.log(document.activeElement);
            const focusable = FocusUtils.getFocusableElements(content.current!);
            const focus1 = focusable[0] ?? sentinel1;
            const focusN = focusable[focusable.length - 1] ?? sentinel2;

            const isFirst = document.activeElement === focus1 || document.activeElement === sentinel1.current;
            const isLast  = document.activeElement === focusN || document.activeElement === sentinel2.current;
    
            if(document.activeElement===document.body || document.activeElement===null){
                event.preventDefault();
                const focus = event.shiftKey ? sentinel2 : sentinel1;
                focus.current?.focus?.(); 
                return; 
            }
            if ((event.shiftKey && isFirst)) {
                event.preventDefault();
                focusN?.focus?.(); // Vai all'ultimo elemento focusabile
                return;
            }
            if (!event.shiftKey && isLast) {
                event.preventDefault();
                focus1?.focus?.(); // Torna al primo elemento focusabile
                return;
            }
        }

        document.addEventListener("keydown", tabKeyDownEventHandler);
        return () => {
            document.removeEventListener("keydown", tabKeyDownEventHandler);
        };
    }, [open]);

    // ESC HANDLER
    React.useEffect(() => {

        if(!open){ return; }

        const escapeKeyDownEventHandler = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            onClose();
        }

        document.addEventListener("keydown", escapeKeyDownEventHandler);
        return () => {
            document.removeEventListener("keydown", escapeKeyDownEventHandler);
        };
    }, [open,onClose]);

    // WINDOW FOCUS
    React.useEffect(() => {
        if(!open){ return; }
        let shift = false;
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Shift") { shift = true; }};
        const handleKeyUp   = (event: KeyboardEvent) => { if (event.key === "Shift") { shift = false; } };
        const restoreFocus  = () => { (shift ? sentinel2 : sentinel1)?.current?.focus?.(); };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("focus", restoreFocus);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("focus", restoreFocus);
        };
    }, [open]);

  
    if(!open) {
        return <React.Fragment></React.Fragment>
    }
  
    return (
        <React.Fragment>
            <div ref={sentinel1} tabIndex={open ? 0 : -1} className={css.tabFocusSentinel} />
                <div ref={overlay} className={css.modalOverlay} role="dialog" aria-modal="true" tabIndex={-1}>
                    <div ref={content} {...modalProps} className={`${modalProps?.className ?? ''} ${css.modalContent}`} tabIndex={-1}>
                        {props.children}
                    </div>
                </div>
            <div ref={sentinel2} tabIndex={open ? 0 : -1} className={css.tabFocusSentinel} />
        </React.Fragment>
    );
  });