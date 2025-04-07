import ReactDOM from 'react-dom';
import css from './Modal.module.css';
import React from "react";
import FocusTrap from '../FocusTrap/FocusTrap';

export type IModalProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'|'className'> & { 
    children: Array<React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>>
    className?: {init: string, open: string, close: string}
    open: boolean; 
    portalTo?: Element|DocumentFragment,
    overlayProps?: IOverlayProps
    closeDelay?: number; // Transition duration 
    onClose: (reason:'escape'|'overlayClick') => void;
}

export type IOverlayProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'|'className'> & {
    className?: {init: string, open: string, close: string}
}

export const Modal:React.ForwardRefExoticComponent<IModalProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null,IModalProps>((props:IModalProps,ref:React.ForwardedRef<HTMLDivElement|null>) => {

    const { open, closeDelay, onClose, children, portalTo, overlayProps, ...modalBxProps } = props;

    // Active state to handle transient states during css transitions
    const [active, setActive] = React.useState<boolean>(open);

    const overlay = React.useRef<HTMLDivElement>(null);
    const content = React.useRef<HTMLDivElement>(null);
    

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement|null,HTMLDivElement|null>(ref, () => { 
        return content.current; 
    });

    // Stretch active time in case of transitions (close)
    const isAnimate = React.useRef<boolean>(false);
    React.useEffect(()=>{
        let timer:NodeJS.Timer|undefined = undefined;
        const MSEC = closeDelay === undefined ? 300 : Math.max(0,closeDelay);
        if (open) {
            setActive(true); // Overlay active before animationStart
            isAnimate.current=true;
            timer = setTimeout(() => {isAnimate.current=false;},MSEC);
            
        } else {
            isAnimate.current=true;
            timer = setTimeout(() => {isAnimate.current=false; setActive(false); },MSEC); // Overlay notActive after animationEnd
        }
        return () => {
            clearTimeout(timer);
            isAnimate.current=false;
        }; 
    },[open,closeDelay])

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

    const overlayClass = `${css.overlay} ${overlayProps?.className?.init ?? ''} ${(!active ? '' : open 
        ? `${css.overlayOpen} ${overlayProps?.className?.open ?? ''}` 
        : `${css.overlayClose} ${overlayProps?.className?.close ?? ''}`)
    }`;

    const modalClass = `${css.modal} ${modalBxProps?.className?.init ?? ''} ${(!active ? '' : open 
        ? `${css.modalOpen} ${modalBxProps?.className?.open ?? ''}` 
        : `${css.modalClose} ${modalBxProps?.className?.close ?? ''}`)
    }`;

    const modal = (
        <React.Fragment>
            {(active || open) &&
                <FocusTrap active={active}>
                    <div ref={overlay} {...overlayProps} className={overlayClass} tabIndex={-1} onClick={onOverlayClickEventHandler}>
                        <div ref={content} {...modalBxProps} className={modalClass} tabIndex={-1} role="dialog" aria-modal="true">
                            {props.children}
                        </div>
                    </div>
                </FocusTrap>
            }
        </React.Fragment>
    )

    return portalTo===undefined ? modal : ReactDOM.createPortal(modal,portalTo)
  });