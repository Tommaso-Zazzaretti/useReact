import React from 'react';
import css from './Scroller.module.css';
import { useResizeObserver } from '../../../hooks/useResizeObserver';


/*
* Modern Browsers control Scroll Events emissions, if we want to execute a callback during the onScroll event of an element, that callback
* will be always executed AFTER the content scrolling. In a virtualized scenario, we do not have the overflow elements rendered, this causes 
* the display of a white space between the loading of a scroll frame and the other.
* 
* This component allows the programmer to execute logic BEFORE scrolling the content (which can be triggered programmatically via the scrollTo API,
* see the example in the examples folder
*/

/* A children must be provided, onScroll event has a different function signature */
export type IScrollerProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'|'onScroll'> & { 
    children: React.ReactElement<unknown,string|React.JSXElementConstructor<unknown>>,
    onScroll?: (top:number,left:number,scrollerRef:HTMLDivElement,contentRef:HTMLDivElement,wrapperRef:HTMLDivElement) => void
}

export const Scroller:React.ForwardRefExoticComponent<IScrollerProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null,IScrollerProps>((props:IScrollerProps,ref:React.ForwardedRef<HTMLDivElement|null>) => {

    const { onScroll, children, ...divProps } = props;

    const wRef = React.useRef<HTMLDivElement|null>(null);
    const sRef = React.useRef<HTMLDivElement|null>(null);
    const [cRef,cSize,cNode] = useResizeObserver<HTMLDivElement>('offset', children);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement|null,HTMLDivElement|null>(ref, () => { 
      return sRef.current; 
    });

    const onWrapperScrollEventHandler = React.useCallback((event: React.UIEvent<HTMLDivElement,UIEvent>) => {
      if(sRef.current===null){ return; }
      if(cRef.current===null){ return; }
      if(wRef.current===null){ return; }
      const {scrollTop: top, scrollLeft: left } = event.currentTarget;
      // [1] Default scroll behavior
      if(onScroll===undefined){ sRef.current.scrollTo({top,left}); return; }
      // [2] Overrided scroll behavior
      onScroll(top,left,sRef.current,cRef.current,wRef.current);
      // eslint-disable-next-line
    },[onScroll]);

    return (
      <div ref={wRef} {...divProps} className={`${css.box} ${css.wrapper}`} onScroll={onWrapperScrollEventHandler}>
        <div className={`${css.box} ${css.overflowInvoker}`} style={{...cSize}}/>
        <div ref={sRef} className={`${css.box} ${css.contentWrapper}`}>
          {cNode}
        </div>
      </div>
    )
});

export default Scroller;