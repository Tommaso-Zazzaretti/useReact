import React from "react";
import css from './Splitter.module.css';

export type ISplitterProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'> & { 
    children: [React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>,React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>]
    dividerProps: ISplitterDividerProps
    ratio: number
    flexDirection:'row'|'column'
    min1?:string|number
    min2?:string|number
}

export interface ISplitterDividerProps { size: number,className?: string }

const Splitter:React.ForwardRefExoticComponent<ISplitterProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null,ISplitterProps>((props:ISplitterProps,ref:React.ForwardedRef<HTMLDivElement|null>) => {
    
    const { dividerProps, ratio, min1, min2, children, flexDirection, ...divProps } = props;
    const wRef  = React.useRef<HTMLDivElement|null>(null);
    const dRef  = React.useRef<HTMLDivElement|null>(null);
    const s1Ref = React.useRef<HTMLDivElement|null>(null);
    const s2Ref = React.useRef<HTMLDivElement|null>(null);
    const isDragging = React.useRef(false);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement|null,HTMLDivElement|null>(ref, () => { 
        return wRef.current; 
    });

    const refineRatio = React.useCallback((ratio:number)=>{ return Math.max(0,Math.min(100,ratio)); },[]);
    const refinePixel = React.useCallback((pixel:number)=>{ return Math.max(0,pixel); },[]);

    // Safe Divider flex size (in case of user !important class)
    React.useEffect(()=>{
        if (dRef.current===null || dividerProps.className===undefined) { return; }
        dRef.current.style.setProperty(flexDirection==='row'?'width':'height' , `${dividerProps.size}px`, 'important');
        dRef.current.style.setProperty(flexDirection==='row'?'min-width':'min-height', `${dividerProps.size}px`, 'important');
        dRef.current.style.setProperty(flexDirection==='row'?'max-width':'max-height', `${dividerProps.size}px`, 'important');
    },[flexDirection,dividerProps])

    // WINDOW DISABLE HOVER EVENTS 
    const onWindowMouseDownEventHandler = React.useCallback((event: MouseEvent) => {
        if (event.buttons === 1 && dRef.current!==event.target) {
            dRef.current?.classList.add(css.hoverDisabled); 
        }
    }, []);

    const onWindowMouseUpEventHandler2 = React.useCallback((event: MouseEvent)=>{
        dRef.current?.classList.remove(css.hoverDisabled); 
    },[]);

    // WINDOW UPDATE SPLITTER SIZES EVENTS

    const onWindowMouseMoveEventHandler = React.useCallback((event: MouseEvent) => {
        if (isDragging.current===null || !isDragging.current|| wRef.current===null || s1Ref.current===null || s2Ref.current===null) { return; }
        const DOMrect = wRef.current.getBoundingClientRect();
        const size    = flexDirection==='row' ? DOMrect.width : DOMrect.height;
        const current = flexDirection==='row' ? DOMrect.left  : DOMrect.top
        const mouse   = flexDirection==='row' ? event.clientX : event.clientY; 
        const newPixels  = Math.max(0, Math.min(mouse - current, size));
        const newPercent = (newPixels/size)*100;
        s1Ref.current.style.flexBasis = `calc(${newPercent}% - ${refinePixel(dividerProps.size)/2}px)`;
        s2Ref.current.style.flexBasis = `calc(${100 - newPercent}% - ${refinePixel(dividerProps.size)/2}px)`;
    },[dividerProps.size,flexDirection,refinePixel]);

    const onWindowMouseUpEventHandler = React.useCallback((event: MouseEvent) => {
        event.preventDefault(); event.stopPropagation();
        window.removeEventListener('mousemove',onWindowMouseMoveEventHandler);
        window.removeEventListener( 'mouseup' ,onWindowMouseUpEventHandler);
        dRef.current?.classList.remove("active");
        isDragging.current = false;
    },[onWindowMouseMoveEventHandler]);

    React.useEffect(() => {
        window.addEventListener("mousedown", onWindowMouseDownEventHandler);
        window.addEventListener( "mouseup", onWindowMouseUpEventHandler2);
        return () => {
            window.removeEventListener("mousedown", onWindowMouseDownEventHandler);
            window.removeEventListener("mousemove", onWindowMouseMoveEventHandler);
            window.removeEventListener( "mouseup" , onWindowMouseUpEventHandler);
            window.removeEventListener( "mouseup" , onWindowMouseUpEventHandler2);
        };
    }, [onWindowMouseDownEventHandler,onWindowMouseMoveEventHandler,onWindowMouseUpEventHandler,onWindowMouseUpEventHandler2]);

    // SEPARATOR EVENTS
    const onSeparatorMouseDownEventHandler = React.useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.preventDefault(); 
        window.addEventListener('mousemove',onWindowMouseMoveEventHandler);
        window.addEventListener( 'mouseup' ,onWindowMouseUpEventHandler);
        isDragging.current = true;
    },[onWindowMouseMoveEventHandler,onWindowMouseUpEventHandler]);

    // Dynamic Styles

    const wrapperStyle:React.CSSProperties = React.useMemo(():React.CSSProperties=>{ 
        return { ...divProps.style ?? {}, flexDirection }
    },[divProps.style,flexDirection]);

    const dsStyle:React.CSSProperties = React.useMemo(():React.CSSProperties=>{ 
        const size = `${refinePixel(dividerProps.size)}px`
        return flexDirection==='row' 
            ? { width : size, minWidth : size, maxWidth : size, cursor: 'col-resize' } 
            : { height: size, minHeight: size, maxHeight: size, cursor: 'row-resize' }
    },[dividerProps.size,flexDirection,refinePixel]);

    const s1Style:React.CSSProperties = React.useMemo(():React.CSSProperties=>{ 
        const flexBasis = `calc(${refineRatio(ratio)}% - ${refinePixel(dividerProps.size)/2}px)`;
        return flexDirection==='row' ? { flexBasis, minWidth : min1 }: { flexBasis, minHeight: min1 }
    },[dividerProps.size,ratio,min1,flexDirection,refineRatio,refinePixel]);

    const s2Style:React.CSSProperties = React.useMemo(():React.CSSProperties=>{ 
        const flexBasis = `calc(${100 - refineRatio(ratio)}% - ${refinePixel(dividerProps.size)/2}px)`;
        return flexDirection==='row' ? { flexBasis, minWidth : min2 } : { flexBasis, minHeight: min2 }
    },[dividerProps.size,ratio,min2,flexDirection,refineRatio,refinePixel]);

    return (
        <div ref={wRef} {...divProps} style={wrapperStyle} className={`${divProps?.className ?? ''} ${css.box} ${css.splitter}`}>

            <div ref={s1Ref} style={s1Style} className={`${css.box} ${css.section}`}>{children[0]}</div>

            <div ref={dRef}  style={dsStyle} className={`${css.divider} ${dividerProps.className ?? ''}`} onMouseDown={onSeparatorMouseDownEventHandler}/>

            <div ref={s2Ref} style={s2Style} className={`${css.box} ${css.section}`}>{children[1]}</div>
            
        </div>
    );
});

export default Splitter;