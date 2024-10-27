import React from 'react';
import css from './Scroller.module.css';
import { IViewport, useSize } from '../../hooks/useSize';
import { useThrottle } from '../../hooks/useThrottle';

export type IScrollerProps = Omit<React.HTMLAttributes<HTMLDivElement|null>, 'children'> & { 
    children: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    onCustomScroll?: (scroll:IScrollPosition) => void
    onScrollbarSizeChange?: (topSize:IViewport, leftSize:IViewport) => void
}

export interface IScrollPosition { top: number, left: number, ratioT: number, ratioL: number }

export const Scroller:React.ForwardRefExoticComponent<IScrollerProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null, IScrollerProps>((props:IScrollerProps, ref:React.ForwardedRef<HTMLDivElement | null>) => {

    const { onCustomScroll, onScrollbarSizeChange, children, ...divProps } = props;

    const [wRef, wSize]        = useSize<HTMLDivElement>('client',[]);
    const [cRef, cSize, cNode] = useSize<HTMLDivElement>('offset',[], children);
    const [tRef, tSize]        = useSize<HTMLDivElement>('offset',[cSize.height, wSize.height]);
    const [lRef, lSize]        = useSize<HTMLDivElement>('offset',[cSize.width, wSize.width]);
    const [scroll, setScroll]  = React.useState<IScrollPosition>({ top: 0, left: 0, ratioT:0, ratioL:0 });
    const pRef                 = React.useRef<HTMLDivElement|null>(null);

    // Compute Scrollbars dynamic Css
    const showL = cSize.width  > wSize.width  && props.style?.overflow!=='hidden' && props.style?.overflowX!=='hidden';
    const showT = cSize.height > wSize.height && props.style?.overflow!=='hidden' && props.style?.overflowY!=='hidden';

    const paddingBottom = showL ? lSize.height : 0;
    const paddingRight  = showT ? tSize.width  : 0;

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement|null,HTMLDivElement|null>(ref, () => wRef.current);

    const emitScroll = React.useCallback(useThrottle<(s:IScrollPosition)=>void,void>((scroll:IScrollPosition)=>{
        onCustomScroll?.(scroll);
    },1),[onCustomScroll])

     // On Scroll Update => Emit Scroll Event
     React.useEffect(() => {
        if(cRef.current===null || wRef.current===null){ return; }
        wRef.current.scrollTo({top : scroll.top, left: scroll.left });
        emitScroll(scroll);
    }, [scroll,emitScroll]);

    // On Scrollbars hide/visible => Emit notification Event
    React.useEffect(()=>{
        onScrollbarSizeChange?.(tSize,lSize)
    },[tSize,lSize,onScrollbarSizeChange])

    // On Wrapper/Content Resizing => Recalculate topPosition respect Ratio
    React.useEffect(() => {
        setScroll((prev) => {
            const left = prev.ratioL*(cSize.width  - wSize.width);
            const top  = prev.ratioT *(cSize.height - wSize.height);
            if(prev.top===top && prev.left===left){ return prev; }
            return { top,left, ratioT:prev.ratioT, ratioL: prev.ratioL }
        });
    }, [wSize, cSize]);

    // In case of Content re-Rendering prevent default wheel event
    React.useEffect(() => {
        wRef.current?.addEventListener('wheel', onWheelEventHandler,{passive:false});
        return () => {
            wRef.current?.removeEventListener('wheel', onWheelEventHandler);
        };
    }, [scroll,cSize,children]);

    const updateTop = React.useCallback((deltaY: number) => {
        if(cSize.height<=wSize.height || !showT){ return; }
        const newTop = Math.min(Math.max(0, scroll.top + deltaY), (cSize.height - wSize.height));
        const topPercent = newTop/(cSize.height - wSize.height);
        const top = topPercent*(cSize.height - wSize.height);
        setScroll((p) => { return top===p.top ? p : { ...p, top, ratioT: topPercent }});
    },[showT,cSize.height,wSize.height,scroll.top])

    const updateLeft = React.useCallback((deltaX: number) => {
        if(cSize.width<=wSize.width || !showL){ return; }
        const newLeft = Math.min(Math.max(0, scroll.left + deltaX),(cSize.width - wSize.width));
        const leftPercent = (newLeft/(cSize.width - wSize.width));
        const left = leftPercent*(cSize.width - wSize.width);
        setScroll((p) => { return left===p.left ? p : { ...p, left, ratioL: leftPercent }});
    },[showL,cSize.width,wSize.width,scroll.left]);



                    /*      EVENT HANDLERS      */

    const handleMouseDown = React.useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>, direction:'vertical'|'horizontal') => {
        event.preventDefault()
        const start = direction === 'vertical' ? event.clientY : event.clientX;
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        const onMouseMove = (moveEvent: MouseEvent) => {
            const delta = (direction === 'vertical' ? moveEvent.clientY : moveEvent.clientX) - start;
            if (direction === 'vertical') {
                updateTop((delta*cSize.height)/(wSize.height-paddingBottom));
            } else {
                updateLeft((delta*cSize.width)/wSize.width-paddingRight);
            }
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    },[updateTop,updateLeft,cSize,wSize,paddingBottom,paddingRight]);

    const onTopScrollbarMouseDownEventHandler = React.useCallback((event:React.MouseEvent<HTMLDivElement, MouseEvent>)=>{
        event.preventDefault()
        handleMouseDown(event, 'vertical');
    },[handleMouseDown]);

    const onLeftScrollbarMouseDownEventHandler = React.useCallback((event:React.MouseEvent<HTMLDivElement, MouseEvent>)=>{
        event.preventDefault()
        handleMouseDown(event, 'horizontal');
    },[handleMouseDown]);

    const onWheelEventHandler = React.useCallback((event: WheelEvent) => {
        event.preventDefault(); 
        if(Math.abs(event.deltaX)<2 &&  Math.abs(event.deltaY)<2){ return; }
        if(Math.abs(event.deltaX) < Math.abs(event.deltaY)){ updateTop(event.deltaY); } else { updateLeft(event.deltaX); }
    },[updateTop,updateLeft]);

    // Top Scrollbar
    const MIN_TOP_LENGTH  = 20;
    const height = Math.max(MIN_TOP_LENGTH,(wSize.height)/Math.max(1,(cSize.height/Math.max(1,(wSize.height)))));
    const top  = Math.min((cSize.height-(wSize.height)), (scroll.top/Math.max(1,(cSize.height - (wSize.height)))) * (wSize.height - height));
    // Left Scrollbar
    const MIN_LEFT_LENGTH = 20;
    const width = Math.max(MIN_LEFT_LENGTH,(wSize.width)/Math.max(1,(cSize.width/Math.max(1,(wSize.width)))));
    const left = Math.min((cSize.width-(wSize.width)) , (scroll.left/Math.max(1,(cSize.width  - (wSize.width)))) * (wSize.width  - width));

    return <div ref={pRef} {...divProps} onScroll={undefined} style={{...props.style}}>

        <div ref={wRef} className={`${css.body} ${css.hideScrollbar}`} style={{width:`calc(100% - ${paddingRight}px)`,height:`calc(100% - ${paddingBottom}px)`}}>
            {cNode}
        </div>

        {showT && (
            <div ref={tRef}
                className={`${css.customScrollbar} ${css.verticalScrollbar}`} 
                style={{ height, top, left: wSize.width }}
                onMouseDown={onTopScrollbarMouseDownEventHandler}
            />
        )}

        {showL && (
            <div ref={lRef}
                className={`${css.customScrollbar} ${css.horizontalScrollbar}`}
                style={{ width, left, top: wSize.height }}
                onMouseDown={onLeftScrollbarMouseDownEventHandler}
            />
        )}
    </div>
});

export default Scroller;