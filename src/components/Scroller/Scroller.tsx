import React from 'react';
import css from './Scroller.module.css';
import { useSize } from '../../hooks/useSize';
import { useThrottle } from '../../hooks/useThrottle';

export type IScrollerProps = Omit<React.HTMLAttributes<HTMLDivElement|null>, 'children'> & { 
    children: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    onCustomScroll?: (scroll:IScrollPosition) => void
    onScrollbarsPaddingChange?: (right:number,bottom:number) => void
}

export interface IScrollPosition { top: number, left: number, ratioT: number, ratioL: number }

export const Scroller:React.ForwardRefExoticComponent<IScrollerProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null, IScrollerProps>((props:IScrollerProps, ref:React.ForwardedRef<HTMLDivElement | null>) => {

    const { onCustomScroll, onScrollbarsPaddingChange, children, ...divProps } = props;

    const [wRef, wSize]        = useSize<HTMLDivElement>('client');
    const [cRef, cSize, cNode] = useSize<HTMLDivElement>('offset', children);
    const [scroll,setScroll]   = React.useState<IScrollPosition>({ top: 0, left: 0, ratioT:0, ratioL:0 });
    const [show  , setShow]    = React.useState<{top:boolean, left: boolean}>({top: false, left: false});
    const tRef = React.useRef<HTMLDivElement|null>(null);
    const lRef = React.useRef<HTMLDivElement|null>(null);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement|null,HTMLDivElement|null>(ref, () => wRef.current);

    // eslint-disable-next-line 
    const emitScroll = React.useCallback(useThrottle<(s:IScrollPosition)=>void,void>((scroll:IScrollPosition)=>{
        onCustomScroll?.(scroll);
    },1),[onCustomScroll])

     // On Scroll Update => Emit Scroll Event
     React.useEffect(() => {
        if(cRef.current===null || wRef.current===null){ return; }
        wRef.current.scrollTo({top : scroll.top, left: scroll.left });
        emitScroll(scroll);
        // eslint-disable-next-line 
    }, [scroll,emitScroll]);

    // On Scrollbars hide/visible => Emit notification Event
    React.useEffect(()=>{
        const right = show.top && tRef.current!==null   ? tRef.current.offsetWidth : 0;
        const bottom = show.left && lRef.current!==null ? lRef.current.offsetHeight : 0
        onScrollbarsPaddingChange?.(right,bottom);
    },[onScrollbarsPaddingChange,show.top,show.left])

    // On Wrapper/Content Resizing => Recalculate topPosition respect Ratio
    React.useEffect(() => {
        setScroll((prev) => {
            const left = Math.max(0,prev.ratioL*(cSize.width  - wSize.width));
            const top  = Math.max(0,prev.ratioT *(cSize.height - wSize.height));
            if(prev.top===top && prev.left===left){ return prev; }
            return { top,left, ratioT:prev.ratioT, ratioL: prev.ratioL }
        });
    }, [wSize, cSize]);

    React.useEffect(()=>{
        setShow((p)=>{
            const top  = cSize.height > wSize.height && props.style?.overflow!=='hidden' && props.style?.overflowY!=='hidden';
            const left = cSize.width  > wSize.width  && props.style?.overflow!=='hidden' && props.style?.overflowX!=='hidden';
            if(p.left===left && p.top===top){ return p; }
            return {top,left};
        })   
    },[wSize,cSize,props.style])

    const updateTop = React.useCallback((deltaY: number) => {
        if(cSize.height<=wSize.height || !show.top){ return; }
        const newTop = Math.min(Math.max(0, scroll.top + deltaY), (cSize.height - wSize.height));
        const topPercent = newTop/(cSize.height - wSize.height);
        const top = topPercent*(cSize.height - wSize.height);
        setScroll((p) => { return top===p.top ? p : { ...p, top, ratioT: topPercent }});
    },[cSize.height, wSize.height ,scroll.top, show.top])

    const updateLeft = React.useCallback((deltaX: number) => {
        if(cSize.width<=wSize.width || !show.left){ return; }
        const newLeft = Math.min(Math.max(0, scroll.left + deltaX),(cSize.width - wSize.width));
        const leftPercent = (newLeft/(cSize.width - wSize.width));
        const left = leftPercent*(cSize.width - wSize.width);
        setScroll((p) => { return left===p.left ? p : { ...p, left, ratioL: leftPercent }});
    },[cSize.width, wSize.width, scroll.left, show.left]);



                    /*      EVENT HANDLERS      */

    const handleMouseDown = React.useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>, direction:'vertical'|'horizontal') => {
        event.preventDefault()
        event.stopPropagation();
        const start = direction === 'vertical' ? event.clientY : event.clientX;
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        const onMouseMove = (moveEvent: MouseEvent) => {
            const delta = (direction === 'vertical' ? moveEvent.clientY : moveEvent.clientX) - start;
            if (direction === 'vertical') {
                updateTop((delta*cSize.height)/(wSize.height));
            } else {
                updateLeft((delta*cSize.width)/wSize.width);
            }
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    },[updateTop,updateLeft,cSize,wSize]);

    const onTopScrollbarMouseDownEventHandler = React.useCallback((event:React.MouseEvent<HTMLDivElement, MouseEvent>)=>{
        event.preventDefault();
        event.stopPropagation();
        handleMouseDown(event, 'vertical');
    },[handleMouseDown]);

    const onLeftScrollbarMouseDownEventHandler = React.useCallback((event:React.MouseEvent<HTMLDivElement, MouseEvent>)=>{
        event.preventDefault();
        event.stopPropagation();
        handleMouseDown(event, 'horizontal');
    },[handleMouseDown]);

    const onWheelEventHandler = React.useCallback((event: WheelEvent) => {
        event.preventDefault(); 
        event.stopImmediatePropagation();
        event.stopPropagation();
        if(Math.abs(event.deltaX)<2 &&  Math.abs(event.deltaY)<2){ return; }
        if(Math.abs(event.deltaX) < Math.abs(event.deltaY)){ updateTop(event.deltaY); } else { updateLeft(event.deltaX); }
    },[updateTop,updateLeft]);

    // In case of Content re-Rendering prevent default wheel event
    React.useEffect(() => {
        const elementRef = wRef.current;
        elementRef?.addEventListener('wheel', onWheelEventHandler,{passive:false});
        return () => {
            elementRef?.removeEventListener('wheel', onWheelEventHandler);
        };
        // eslint-disable-next-line 
    }, [scroll,cSize,children,onWheelEventHandler]);


    // Top Scrollbar
    const MIN_TOP_LENGTH  = 20;
    const height = React.useMemo(()=>{
        return Math.max(MIN_TOP_LENGTH,(wSize.height)/Math.max(1,(cSize.height/Math.max(1,(wSize.height)))));
    },[wSize.height,cSize.height,MIN_TOP_LENGTH]);
    const marginTop  = React.useMemo(()=>{
        return Math.min((cSize.height-(wSize.height)), (scroll.top/Math.max(1,(cSize.height - (wSize.height)))) * (wSize.height - height));
    },[wSize.height, cSize.height,scroll.top,height]);
    // Left Scrollbar
    const MIN_LEFT_LENGTH = 20;
    const width = React.useMemo(()=>{
        return Math.max(MIN_LEFT_LENGTH,(wSize.width)/Math.max(1,(cSize.width/Math.max(1,(wSize.width)))))
    },[wSize.width,cSize.width,MIN_LEFT_LENGTH]);
    const marginLeft = React.useMemo(()=>{
        return Math.min((cSize.width-(wSize.width)) , (scroll.left/Math.max(1,(cSize.width  - (wSize.width)))) * (wSize.width  - width))
    },[cSize.width,wSize.width,scroll.left,width]);

    const gridCss = show.top ? show.left ? 'wrapperTLS' : 'wrapperTS' : show.left ? 'wrapperLS' : 'wrapper';

    return <div {...divProps} className={gridCss===null ? css.wrapper : `${css.wrapper} ${css[gridCss]}`} style={{...props.style}}>

        <div ref={wRef} className={`${css.body} ${css.hideScrollbar}`}>
            {cNode}
        </div>

        {show.top && <div ref={tRef}
            className={`${css.customScrollbar}`} 
            style={{ height,marginTop }}
            onMouseDown={onTopScrollbarMouseDownEventHandler}/>
        }

        {show.left && (
            <div ref={lRef}
                className={`${css.customScrollbar}`}
                style={{ width, marginLeft }}
                onMouseDown={onLeftScrollbarMouseDownEventHandler}
            />
        )}
    </div>
});

export default Scroller;