import React from "react";
import css from './Splitter.module.css';

export type ISplitterProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'> & { 
    children: [React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>,React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>]
    separatorSizePx: number
    initialRatio: number
    flexDirection:'row'|'column'
    min1?:string|number
    min2?:string|number
}

const Splitter:React.ForwardRefExoticComponent<ISplitterProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null,ISplitterProps>((props:ISplitterProps,ref:React.ForwardedRef<HTMLDivElement|null>) => {
    
    const { separatorSizePx, initialRatio, min1, min2, children,flexDirection, ...divProps } = props;
    const wRef = React.useRef<HTMLDivElement|null>(null);
    const s1Ref = React.useRef<HTMLDivElement|null>(null);
    const s2Ref = React.useRef<HTMLDivElement|null>(null);
    const isDragging = React.useRef(false);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement|null,HTMLDivElement|null>(ref, () => { 
        return wRef.current; 
    });

    const onSeparatorMouseMoveEventHandler = React.useCallback((event: MouseEvent) => {
        event.preventDefault(); event.stopPropagation();
        if (isDragging.current===null || wRef.current===null || s1Ref.current===null || s2Ref.current===null) { 
            return; 
        }
        const DOMrect = wRef.current.getBoundingClientRect();
        const size  = flexDirection==='row' ? DOMrect.width : DOMrect.height;
        const delta = flexDirection==='row' ? DOMrect.left  : DOMrect.top
        const pos   = flexDirection==='row' ? event.clientX : event.clientY; 
        const newPixels  = Math.max(0, Math.min(pos - delta, size));
        const newPercent = (newPixels/size)*100;
        s1Ref.current.style.flexBasis = `calc(${newPercent}% - ${separatorSizePx / 2}px)`;
        s2Ref.current.style.flexBasis = `calc(${100 - newPercent}% - ${separatorSizePx / 2}px)`;
    },[separatorSizePx,flexDirection]);

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

    const wrapperStyle:React.CSSProperties = React.useMemo(():React.CSSProperties=>{ 
        return { ...divProps.style ?? {}, flexDirection }
    },[divProps.style,flexDirection]);

    const separatorStyle:React.CSSProperties = React.useMemo(():React.CSSProperties=>{ 
        const size = `${separatorSizePx}px`
        return flexDirection==='row' 
            ? { width : size, minWidth : size, maxWidth : size, cursor: 'col-resize' } 
            : { height: size, minHeight: size, maxHeight: size, cursor: 'row-resize' }
    },[separatorSizePx,flexDirection]);

    const s1Style:React.CSSProperties = React.useMemo(():React.CSSProperties=>{ 
        const flexBasis = `calc(${initialRatio}% - ${separatorSizePx / 2}px)`;
        return flexDirection==='row' ? { flexBasis, minWidth : min1 }: { flexBasis, minHeight: min1 }
    },[separatorSizePx,initialRatio,min1,flexDirection]);

    const s2Style:React.CSSProperties = React.useMemo(():React.CSSProperties=>{ 
        const flexBasis = `calc(${100 - initialRatio}% - ${separatorSizePx / 2}px)`;
        return flexDirection==='row' ? { flexBasis, minWidth : min2 } : { flexBasis, minHeight: min2 }
    },[separatorSizePx,initialRatio,min2,flexDirection]);

    return (
        <div ref={wRef} {...divProps} style={wrapperStyle} className={`${divProps?.className ?? ''} ${css.wrapper}`}>
            <div ref={s1Ref} className={css.section} style={s1Style}>
                {children[0]}
            </div>

            <div className={css.separator} style={separatorStyle} onMouseDown={onSeparatorMouseDownEventHandler}/>

            <div ref={s2Ref} className={css.section} style={s2Style}>
                {children[1]}
            </div>
        </div>
    );
});

export default Splitter;