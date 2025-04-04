import ReactDOM from 'react-dom';
import { FocusUtils } from '../../utils/Focus';
import css from './Modal.module.css';
import React from "react";

export type IModalProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'> & { 
    children: Array<React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>>
    open: boolean; 
    portalTo?: Element|DocumentFragment,
    overlayProps?: IOverlayProps
    closeDelay?: number; // Transition duration 
    onClose: (reason:'escape'|'overlayClick') => void;
}

export type IOverlayProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'> & {

}

export const Modal:React.ForwardRefExoticComponent<IModalProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null,IModalProps>((props:IModalProps,ref:React.ForwardedRef<HTMLDivElement|null>) => {

    const { open, closeDelay, onClose, children, portalTo, overlayProps, ...contentProps } = props;

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
    const isAnimate = React.useRef<boolean>(false);
    React.useEffect(()=>{
        let timer:NodeJS.Timer|undefined = undefined;
        const MSEC = closeDelay === undefined ? 0 : Math.max(0,closeDelay);
        if (open) {
            setActive(true); // Overlay active before animationStart
            isAnimate.current=true;
            timer = setTimeout(() => {isAnimate.current=false;},MSEC ?? 0);
            
        } else {
            isAnimate.current=true;
            timer = setTimeout(() => {isAnimate.current=false; setActive(false); },MSEC ?? 0); // Overlay notActive after animationEnd
        }
        return () => {
            clearTimeout(timer);
            isAnimate.current=false;
        }; 
    },[open,closeDelay])
    

    // OnUnmount => Restore previous focus 
    React.useEffect(() => {
        return () => {
            outerFocus.current?.focus?.();
            document.body.style.pointerEvents = ''; 
        };
    }, []);

    // When the modal is opened, force the focus to the first sentinel 
    React.useEffect(() => {
        if(active) {
            outerFocus.current = document.activeElement as HTMLElement;
            sentinel1.current?.focus?.();
        } else {
            outerFocus.current?.focus?.();
        }
    }, [active]);

    // Observe overlay Removal => in that case disable pointer events
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

  
    // Tab KeyDown event listener while the modal is opened
    React.useEffect(() => {

        if(!active){ return; }

        const tabKeyDownEventHandler = (event: KeyboardEvent) => {
            if (event.key !== "Tab") return;
            // console.log(document.activeElement);
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

    // Window Focus => Force the focus to first sentinel
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


    // Emit onClose event when Escape key is pressed
    React.useEffect(() => {

        if(!active){ return; }

        const escapeKeyDownEventHandler = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            if(isAnimate.current){ return; }
            onClose('escape');
        }

        document.addEventListener("keydown", escapeKeyDownEventHandler);
        return () => {
            document.removeEventListener("keydown", escapeKeyDownEventHandler);
        };
    }, [active,onClose]);

    // Emit onClose event when user click the overlay
    const onOverlayClickEventHandler = React.useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>)=>{
        overlayProps?.onClick?.(event);
        if(event.target!==event.currentTarget){ return; }
        if(isAnimate.current){ return; }
        event.stopPropagation();
        event.preventDefault();
        onClose('overlayClick');
    },[onClose,overlayProps])

    // Controlled Styles
    const controlledStyles = React.useMemo<React.CSSProperties>(()=>{
        return (closeDelay===undefined || closeDelay<=0) ? {} :{ animationDuration: `${closeDelay ?? 0}ms`, transitionDuration: `${closeDelay ?? 0}ms`}
    },[closeDelay]);
  
    const overlayClass = `${css.overlay} ${css.modalOverlay} ${open ? css.open : css.close} ${overlayProps?.className ?? ''}` 
    const contentClass = `${css.content} ${css.modalContent} ${open ? css.open : css.close} ${contentProps?.className ?? ''}`

    const modal = (
        <React.Fragment>
            {active &&
                <React.Fragment>
                    <div ref={sentinel1} tabIndex={active ? 0 : -1} className={css.tabFocusSentinel} />
                        <div ref={overlay} {...overlayProps} className={overlayClass} style={{...overlayProps?.style, ...controlledStyles}} role="dialog" aria-modal="true" tabIndex={-1} onClick={onOverlayClickEventHandler}>
                            <div ref={content} {...contentProps} className={contentClass} style={{...contentProps?.style, ...controlledStyles}} tabIndex={-1}>
                                {props.children}
                            </div>
                        </div>
                    <div ref={sentinel2} tabIndex={active ? 0 : -1} className={css.tabFocusSentinel} />
                </React.Fragment>
            }
        </React.Fragment>
    )

    return portalTo===undefined ? modal : ReactDOM.createPortal(modal,portalTo)
  });