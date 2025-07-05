import { FocusUtils } from '../../../utils/Focus';
import css from './FocusTrap.module.css';
import React from "react";

export interface IFocusTrapProps {
    active: boolean,
    children: Array<React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>>|React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>
}
export const FocusTrap:React.FC<IFocusTrapProps> =(props:IFocusTrapProps) => {

    const { children, active } = props;

    const content    = React.useRef<HTMLDivElement|null>(null);
    const sentinel1  = React.useRef<HTMLDivElement|null>(null);
    const sentinel2  = React.useRef<HTMLDivElement|null>(null);
    const outerFocus = React.useRef<HTMLElement|null>(null);
    
    // OnUnmount => Restore previous focus 
    React.useEffect(() => {
        return () => {
            outerFocus.current?.focus?.();
            document.body.style.pointerEvents = ''; 
        };
    }, []);

    // Active change => Block the browser interactions
    React.useEffect(() => {
        if(active){
            document.body.style.pointerEvents = "none";
            content.current!.style.pointerEvents = "auto";
            outerFocus.current = document.activeElement as HTMLElement;
            sentinel1.current?.focus?.();
        } else {
            outerFocus.current?.focus?.();
            document.body.style.pointerEvents = ''; 
        }
    }, [active]);
  
    // Tab KeyDown event listener while the modal is opened
    React.useEffect(() => {

        if(!active){ return; }

        const tabKeyDownEventHandler = (event: KeyboardEvent) => {
            if (event.key !== "Tab") return;
            // console.log(document.activeElement);
            const focusable = FocusUtils.getFocusableByDFS(content.current!);
            const focus1 = focusable[0] ?? sentinel1.current;
            const focusN = focusable[focusable.length - 1] ?? sentinel2.current;

            const isFirst = document.activeElement === focus1 || document.activeElement === sentinel1.current;
            const isLast  = document.activeElement === focusN || document.activeElement === sentinel2.current;
    
            if(document.activeElement===document.body || document.activeElement===null){
                event.preventDefault();
                const focus = event.shiftKey ? focusN : focus1;
                focus?.focus?.(); 
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

    return (
        <div ref={content}>
            <div ref={sentinel1} tabIndex={active ? 0 : -1} className={css.tabFocusSentinel}/>
            {children}
            <div ref={sentinel2} tabIndex={active ? 0 : -1} className={css.tabFocusSentinel}/>
        </div>
    )
}

export default FocusTrap;