import React from "react";
import css from './AccordionTree.module.css';

       /*---------+
        | CONTEXT |
        +---------*/
type AccordionTreeContextType = {
    level: number;
    opened: Set<HTMLDivElement>,
    toggleAPI:(element:HTMLDivElement) => void,
    subscribeAPI:(element:HTMLDivElement) => void;
    unsubscribeAPI:(element:HTMLDivElement) => void;
}

const AccordionTreeContext = React.createContext<AccordionTreeContextType>({
    level: -1,
    opened: new Set<HTMLDivElement>(),
    toggleAPI:()=>{},
    subscribeAPI:()=>{return; },
    unsubscribeAPI:()=>{return; }
});


       /*-----------+
        | ACCORDION |
        +-----------*/
export type IAccordionTreeProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: 
    | React.ReactElement<IAccordionTreeItemProps, string | React.JSXElementConstructor<typeof AccordionTree.Item>> 
    | React.ReactElement<IAccordionTreeItemProps, string | React.JSXElementConstructor<typeof AccordionTree.Item>>[]
  singleOpen?: boolean
};

const AccordionTreeBase: React.ForwardRefExoticComponent<IAccordionTreeProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionTreeProps>((props: IAccordionTreeProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {
    // Props
    const {children,singleOpen, ...divProps } = props;
    // Context
    const parentRootContext = React.useContext(AccordionTreeContext);     // To Get Level+1
    // States 
    const [opened, setOpened] = React.useState<Set<HTMLDivElement>>(new Set());
    // Refs
    const level = React.useRef<number>(parentRootContext ? parentRootContext.level + 1 : 0);
    const iRef  = React.useRef<Set<HTMLDivElement>>(new Set());
    const wRef  = React.useRef<HTMLDivElement|null>(null);
      // Forward Ref
    React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => {
        return wRef.current;
    });

    const toggleAPI = React.useCallback((element: HTMLDivElement) => {
        setOpened(p => {
            if(p.has(element)){
                const c = new Set<HTMLDivElement>(p);
                c.delete(element);
                return c;
            } 
            if(singleOpen){
                return new Set<HTMLDivElement>([element]);
            }
            const c = new Set<HTMLDivElement>(p);
            c.add(element);
            return c;
        });
    },[singleOpen]);

    const subscribeAPI = React.useCallback((element:HTMLDivElement) => {
        iRef.current.add(element);
    },[]);

    const unsubscribeAPI = React.useCallback((element:HTMLDivElement) => {
        iRef.current.delete(element);
        setOpened(p=>{
            if(p.has(element)){ return p; }
            const c = new Set(p); c.delete(element); 
            return c; 
        })
    },[]);

    const ctx:AccordionTreeContextType = React.useMemo<AccordionTreeContextType>(()=>{
        return { 
            level:level.current,
            opened, 
            toggleAPI,
            subscribeAPI,
            unsubscribeAPI
        }
    },[opened,subscribeAPI,unsubscribeAPI,toggleAPI])

    return (
        <AccordionTreeContext.Provider value={ctx}>
            <div ref={wRef} {...divProps} className={`${divProps?.className ?? ''} ${css.accordionGroup}`}>
                {children}
            </div>
        </AccordionTreeContext.Provider>
    )
});


       /*---------+
        | CONTEXT |
        +---------*/
type AccordionTreeItemContextType = {
    notifyAPI:(delta:number,onlyParent?:boolean) => void
    isParentUnmounting: () => boolean
    isParentOpen: () => boolean
    parentCntBox: () => HTMLDivElement|null
}

const AccordionTreeItemContext = React.createContext<AccordionTreeItemContextType>({
    notifyAPI:(delta:number,onlyParent?:boolean) => {},
    isParentUnmounting: () => false,
    isParentOpen: () => false,
    parentCntBox: () => null
});

       /*----------------+
        | ACCORDION ITEM |
        +----------------*/
type IAccordionTreeItemInnerProps = Omit<React.HTMLAttributes<HTMLDivElement | null>, 'children'|'title'> & {
    children: React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>
    title:string,
    unmountOnClose?: boolean
    closeDelay?: number,
    arrowStyle?: 'chevron'|'cared'
};

const AccordionTreeItem: React.ForwardRefExoticComponent<IAccordionTreeItemInnerProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionTreeItemInnerProps>((props: IAccordionTreeItemInnerProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {
    // Props
    const { children,arrowStyle,closeDelay,unmountOnClose,title } = props;
    // Context
    const {subscribeAPI,unsubscribeAPI,toggleAPI,opened,level} = React.useContext<AccordionTreeContextType>(AccordionTreeContext);
    const {notifyAPI,isParentOpen,isParentUnmounting,parentCntBox} = React.useContext<AccordionTreeItemContextType>(AccordionTreeItemContext);
    // States
    const [height,setHeight] = React.useState(0);
    // Refs 
    const wRef = React.useRef<HTMLDivElement | null>(null);
    const subscribed = React.useRef<boolean>(false);
    const isOpenRef = React.useRef(false);
    // Derived States
    const isOpen=React.useMemo(()=>{ 
        const open = subscribed.current && wRef.current!==null && opened.has(wRef.current!);
        isOpenRef.current=open;
        return open;
    },[opened])
    
    
    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => {
        return wRef.current;
    });

    // Subscribe / UnSubscribe
    const subscribeRef = React.useRef<()=>void>(()=>{
        const ref = wRef.current;
        if (ref===null || subscribed.current) { return; }
        const h = ref.scrollHeight;
        if(ref.id==='Section2.1.1'){ 
            console.log('Section2.1.1',h);
        }
        if(isParentOpen() && level>0) { 
            if(parentCntBox()!==null){ 
                notifyAPI(h); // Mount inside a parent with contentBox Rendered (unmountOnClose=false) => notify subscribe height increasing
            }  
        }
        if(!isParentOpen() && level>0) { setHeight(p=>p+h); }
        subscribeAPI(ref);
        subscribed.current = true;
    })

    const unsubscribeRef = React.useRef<()=>void>(()=>{
        const ref = wRef.current;
        if (ref===null || !subscribed.current) { return; }
        const h = -(ref.scrollHeight);
        if(!isParentUnmounting() && isParentOpen() && level>0){ notifyAPI(h); }
        if(!isParentUnmounting() && !isParentOpen() && level>0){ 
            if(parentCntBox()!==null){ 
                setHeight(p=>p+h); // Unmount but parent is not open and will be alive (unmountOnClose=false) => just decrease height 
            }  
        }
        isOnUnmounting.current=true;
        unsubscribeAPI(ref);
        subscribed.current = false;
    })
    React.useLayoutEffect(() => {
        const [subscribe,unsubscribe] = [subscribeRef.current, unsubscribeRef.current];
        subscribe(); return () => { unsubscribe(); }
    }, []);
    
    const cRef = React.useRef<HTMLDivElement|null>(null);
    const onChildMountRef = React.useCallback((ref:HTMLDivElement|null) => {
        cRef.current = ref;
        if (ref!==null) {
            setHeight(ref.scrollHeight)
            return; 
        }
        if(unmountOnClose){
            setHeight(0);
        }
    },[unmountOnClose])

    const toggleChild = React.useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const isSubscribed = subscribed.current && wRef.current!==null;
        if(!isSubscribed){ return; } 
        if(isAnimate.current){ return; }
        toggleAPI(wRef.current!);
    },[toggleAPI])


    const [active, setActive] = React.useState<boolean>(isOpen);
    const isAnimate = React.useRef<boolean>(false);
    React.useEffect(()=>{
        let timer:NodeJS.Timer|undefined = undefined;
        const MSEC = closeDelay === undefined ? 300 : Math.max(0,closeDelay);
        if (isOpen) {
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
    },[isOpen,closeDelay])

    // When isOpen state change => notify height change to parent Item => notifyAPI height change to root
    const notifySyncRef = React.useRef<boolean>(isOpen);
    React.useEffect(()=>{
        if(notifySyncRef.current===isOpen){ return; }
        if(cRef.current===null){ return; }
        notifyAPI((isOpen?+1:-1)*(height)) 
        notifySyncRef.current = isOpen;
    },[height,notifyAPI,isOpen,parentCntBox])

    React.useEffect(()=>{
        if(wRef.current?.id==='Section2'){
            console.log('Section2',height)
        }
        if(wRef.current?.id==='Section2.1'){
            console.log('Section2.1',height)
        }
    },[height])
    // Context methods
    const notifyImplementation = React.useCallback((delta:number,onlyParent?:boolean)=>{
        setHeight(p=>{return p+delta});
        if(onlyParent){ return; }
        notifyAPI(delta) // RECURSIVE STEP
    },[notifyAPI])

    const isParentOpenImplementation = React.useCallback(()=>{
        return isOpenRef.current;
    },[])

     const parentCntBoxImplementation = React.useCallback(()=>{
        return cRef.current;
    },[])

    const isParentUnmountingImplementation = React.useCallback(()=>{
        return isOnUnmounting.current !;
    },[])
    const isOnUnmounting = React.useRef<boolean>(false);

    const ctx:AccordionTreeItemContextType = React.useMemo<AccordionTreeItemContextType>(()=>{
        return {
            notifyAPI: notifyImplementation,
            isParentOpen: isParentOpenImplementation,
            isParentUnmounting: isParentUnmountingImplementation,
            parentCntBox: parentCntBoxImplementation
        }
    },[notifyImplementation, isParentUnmountingImplementation, isParentOpenImplementation,parentCntBoxImplementation])

    return (
        //  style={{marginTop: index===0 ? 0 : undefined, marginBottom: index===ctx.length()-1 ? 0 : undefined}}
        <AccordionTreeItemContext.Provider value={ctx}>
            <div id={props.title} ref={wRef} className={`${css.accordion} ${isOpen ? css.accordionOpen : ''}`}>
                <button className={css.header} onClick={toggleChild}>
                    <span className={css.title}>{title}</span>
                    <span className={css.arrowWrapper}>
                        <span className={`${css.arrow} ${isOpen ? css.rotated : ''} ${css[arrowStyle ?? 'chevron']}`} />
                    </span>
                </button>
                <div className={`${css.content}`} style={{maxHeight: isOpen ? `${height}px` : '0px'}}>
                    {(!unmountOnClose || active) &&
                        <div ref={onChildMountRef} className={css.innerContent}>{children}</div>
                    }
                </div>
                <div style={{borderBottom:'1px solid #ddd'}}></div>
            </div>
        </AccordionTreeItemContext.Provider>
    );
});

export type IAccordionTreeItemProps = Omit<IAccordionTreeItemInnerProps, 'index'>

const AccordionTree = AccordionTreeBase as React.ForwardRefExoticComponent<IAccordionTreeProps & React.RefAttributes<HTMLDivElement>> & {
    Item: React.ForwardRefExoticComponent<IAccordionTreeItemProps & React.RefAttributes<HTMLDivElement | null>>;
};

AccordionTree.Item = AccordionTreeItem as React.ForwardRefExoticComponent<IAccordionTreeItemProps & React.RefAttributes<HTMLDivElement | null>>;

export default AccordionTree;