import React, { CSSProperties } from "react";
import css from './Splitter.module.css';


export type ISplitterProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'> & { 
    children: [React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>,React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>]
    separatorSizePx: number
    initialRatio: number
    min1?:string|number
    min2?:string|number
}

const Splitter:React.ForwardRefExoticComponent<ISplitterProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null,ISplitterProps>((props:ISplitterProps,ref:React.ForwardedRef<HTMLDivElement|null>) => {
    
    const { separatorSizePx, initialRatio, min1, min2, children, ...divProps } = props;
    const wRef = React.useRef<HTMLDivElement|null>(null);
    const lRef = React.useRef<HTMLDivElement|null>(null);
    const rRef = React.useRef<HTMLDivElement|null>(null);
    const isDragging = React.useRef(false);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement|null,HTMLDivElement|null>(ref, () => { 
        return wRef.current; 
    });

    const onSeparatorMouseMoveEventHandler = React.useCallback((event: MouseEvent) => {
        event.preventDefault(); event.stopPropagation();
        if (isDragging.current===null || wRef.current===null || lRef.current===null || rRef.current===null) { 
            return; 
        }
        const DOMrect = wRef.current.getBoundingClientRect();
        const newLeftPixels  = Math.max(0, Math.min(event.clientX - DOMrect.left, DOMrect.width));
        const newLeftPercent = (newLeftPixels/DOMrect.width)*100;
        lRef.current.style.flexBasis = `calc(${newLeftPercent}% - ${separatorSizePx / 2}px)`;
        rRef.current.style.flexBasis = `calc(${100 - newLeftPercent}% - ${separatorSizePx / 2}px)`;
    },[separatorSizePx]);

    const onSeparatorMouseUpEventHandler = React.useCallback((event: MouseEvent) => {
        event.preventDefault(); event.stopPropagation();
        window.removeEventListener('mousemove',onSeparatorMouseMoveEventHandler);
        window.removeEventListener( 'mouseup' ,onSeparatorMouseUpEventHandler);
        isDragging.current = false;
    },[onSeparatorMouseMoveEventHandler]);

    const onSeparatorMouseDownEventHandler = React.useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.preventDefault(); event.stopPropagation();
        window.addEventListener('mousemove',onSeparatorMouseMoveEventHandler);
        window.addEventListener( 'mouseup' ,onSeparatorMouseUpEventHandler);
        isDragging.current = true;
    },[onSeparatorMouseMoveEventHandler,onSeparatorMouseUpEventHandler]);

    // On Unmount
    React.useEffect(() => {
        return () => {
            window.removeEventListener("mousemove", onSeparatorMouseMoveEventHandler);
            window.removeEventListener( "mouseup" , onSeparatorMouseUpEventHandler);
        };
    }, [onSeparatorMouseMoveEventHandler, onSeparatorMouseUpEventHandler]);

    // Dynamic Styles
    const separatorDynamicStyles:CSSProperties = React.useMemo(()=>{ 
        return {
            width   : `${separatorSizePx}px`,
            minWidth: `${separatorSizePx}px`, 
            maxWidth: `${separatorSizePx}px`
        } as CSSProperties
    },[separatorSizePx]);

    const leftDynamicStyles:CSSProperties = React.useMemo(()=>{ 
        return {
            flexBasis: `calc(${initialRatio}% - ${separatorSizePx / 2}px)`,
            minWidth: min1
        }
    },[separatorSizePx,initialRatio, min1]);

    const rightDynamicStyles:CSSProperties = React.useMemo(()=>{ 
        return {
            flexBasis: `calc(${100 - initialRatio}% - ${separatorSizePx / 2}px)`,
            minWidth: min2
        }
    },[separatorSizePx,initialRatio, min2]);

    return (
        <div ref={wRef} {...divProps} className={css.wrapper}>
            <div ref={lRef} className={css.section} style={leftDynamicStyles}>
                {children[0]}
            </div>

            <div className={css.separator} style={separatorDynamicStyles} onMouseDown={onSeparatorMouseDownEventHandler}/>

            <div ref={rRef} className={css.section} style={rightDynamicStyles}>
                {children[1]}
            </div>
        </div>
    );
});

export default Splitter;