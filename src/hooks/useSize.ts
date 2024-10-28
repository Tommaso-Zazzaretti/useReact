import React from "react";

export interface IViewport { width: number, height: number }

export const useSize = <T extends HTMLElement>(type:'offset'|'client',deps: React.DependencyList,children?:React.ReactElement<any, string | React.JSXElementConstructor<T>>) => {
    
    const ref = React.useRef<T|null>(null);
    const childrenWithRef = children===undefined ? undefined : React.cloneElement(children, {ref: ref})
    const [size,setSize]  = React.useState<IViewport>({width:0,height:0})
    
    const updateSize = React.useCallback(()=>{
        if (ref.current===null) { return; }
        const height = type==='client' ? ref.current.clientHeight : ref.current.offsetHeight; 
        const width  = type==='client' ? ref.current.clientWidth  : ref.current.offsetWidth;
        setSize((prev) => {
            if(prev.height===height && prev.width===width){ return prev; }
            return { height, width }
        });
    },[type]);


    // After first rendering, setup current size and setup resize event handler
    React.useLayoutEffect(() => {
        const elementRef = ref.current;
        if(elementRef===null){ return; }
        updateSize();
        const resizeObserver = new ResizeObserver((entries:Array<ResizeObserverEntry>) => {
            updateSize();
        });
        resizeObserver.observe(elementRef);
        return () => {
            if(elementRef===null){ return; }
           resizeObserver.unobserve(elementRef)
        }
        // eslint-disable-next-line
    }, [updateSize]);

    return [ref,size,childrenWithRef] as const;
}