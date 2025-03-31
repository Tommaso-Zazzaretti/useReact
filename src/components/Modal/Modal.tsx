import { FocusUtils } from '../../utils/Focus';
import css from './Modal.module.css';
import React from "react";

export type IModalProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'> & { 
    children: Array<React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>>
    open: boolean;
    msec?: number;
    onClose: () => void;
}

export const Modal:React.ForwardRefExoticComponent<IModalProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null,IModalProps>((props:IModalProps,ref:React.ForwardedRef<HTMLDivElement|null>) => {

    const { open, msec, onClose, children, ...modalProps } = props;

    // Active state to handle transient states during css transitions
    const [active, setActive] = React.useState<boolean>(open);

    const overlay    = React.useRef<HTMLDivElement>(null);
    const content    = React.useRef<HTMLDivElement>(null);
    const sentinel1  = React.useRef<HTMLDivElement|null>(null);
    const sentinel2  = React.useRef<HTMLDivElement|null>(null);
    const outerFocus = React.useRef<HTMLElement|null>(null);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement|null,HTMLDivElement|null>(ref, () => { 
        return content.current; 
    });

    // Stretch active time in case of transitions (close)
    React.useEffect(()=>{
        let timeout: NodeJS.Timeout;
        if (open) {
            setActive(true);
        } else {
            timeout = setTimeout(() => setActive(false), msec ?? 0);
        }
        return () => clearTimeout(timeout); 
    },[open,msec])
    

    // UNMOUNT => RESTORE 
    React.useEffect(() => {
        return () => {
            outerFocus.current?.focus?.();
            document.body.style.pointerEvents = ''; 
        };
    }, []);

    // TRAP/UNTRAP FOCUS WHILE OPENING/CLOSING
    React.useEffect(() => {
        if(active) {
            outerFocus.current = document.activeElement as HTMLElement;
            sentinel1.current?.focus?.();
        } else {
            outerFocus.current?.focus?.();
        }
    }, [active]);

    // OVERLAY REMOVAL
    React.useEffect(()=>{
        if(!active){ 
            document.body.style.pointerEvents = ''; 
            return; 
        }
        const observeBackdropRemoval = () => {
            const observer = new MutationObserver((mutationsList) => {
                mutationsList.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((removedNode) => {
                        // Il backdrop is removed while modal is open, disable body pointer events
                        if (removedNode === overlay.current) {
                            document.body.style.pointerEvents = 'none'; 
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
    },[active])

  
    // TAB HANDLER
    React.useEffect(() => {

        if(!active){ return; }

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
                focusN?.focus?.(); // Go to Last
                return;
            }
            if (!event.shiftKey && isLast) {
                event.preventDefault();
                focus1?.focus?.(); // Go to First
                return;
            }
        }

        document.addEventListener("keydown", tabKeyDownEventHandler);
        return () => {
            document.removeEventListener("keydown", tabKeyDownEventHandler);
        };
    }, [active]);

    // ESC HANDLER
    React.useEffect(() => {

        if(!active){ return; }

        const escapeKeyDownEventHandler = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            onClose();
        }

        document.addEventListener("keydown", escapeKeyDownEventHandler);
        return () => {
            document.removeEventListener("keydown", escapeKeyDownEventHandler);
        };
    }, [active,onClose]);

    // WINDOW FOCUS
    React.useEffect(() => {
        if(!active){ return; }
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
    }, [active]);

    const transitionStyles = React.useMemo<React.CSSProperties>(()=>{
        return {
            animationDuration: `${msec ?? 0}ms`
        }
    },[msec]);

    if(!active) {
        return <React.Fragment></React.Fragment>
    }

  
    return (
        <React.Fragment>
            <div ref={sentinel1} tabIndex={active ? 0 : -1} className={css.tabFocusSentinel} />
                <div ref={overlay} className={`${css.modalOverlay} ${open ? css.show : css.hide}`} style={transitionStyles} role="dialog" aria-modal="true" tabIndex={-1}>
                    <div ref={content} {...modalProps} className={`${modalProps?.className ?? ''} ${css.modalContent} ${open ? css.show : css.hide}`} style={{...modalProps.style, ...transitionStyles}} tabIndex={-1}>
                        {props.children}
                    </div>
                </div>
            <div ref={sentinel2} tabIndex={active ? 0 : -1} className={css.tabFocusSentinel} />
        </React.Fragment>
    );
  });