import React from "react";
import css from './AccordionTree.module.css';

       /*---------+
        | CONTEXT |
        +---------*/
type AccordionTreeContextType = {
    level: number;
    opened: Set<HTMLDivElement>,
    prevOpened: Set<HTMLDivElement>,
    toggleAPI:(element:HTMLDivElement) => void,
    subscribeAPI:(element:HTMLDivElement) => void;
    unsubscribeAPI:(element:HTMLDivElement) => void;
}

const AccordionTreeContext = React.createContext<AccordionTreeContextType>({
    level: -1,
    opened: new Set<HTMLDivElement>(),
    prevOpened: new Set<HTMLDivElement>(),
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
    const previousOpened = React.useRef<Set<HTMLDivElement>>(new Set())
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
            previousOpened.current = new Set(p);
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
        if(wRef.current===null){ return; }
        iRef.current.delete(element);
        setOpened(p=>{
            previousOpened.current = new Set(p);
            if(!p.has(element)){ return new Set(p); }
            const c = new Set(p); c.delete(element); 
            return c; 
        })
    },[]);

    const ctx:AccordionTreeContextType = React.useMemo<AccordionTreeContextType>(()=>{
        return { 
            level:level.current,
            opened, 
            prevOpened: previousOpened.current,
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
    notifyAPI:(delta:number,notRecursive?:boolean) => void
    isParentUnmounting: () => boolean
    isParentMounted: () => boolean,
    isParentOpen: () => boolean
    parentCntBox: () => HTMLDivElement|null
}

const AccordionTreeItemContext = React.createContext<AccordionTreeItemContextType>({
    notifyAPI:(delta:number,notRecursive?:boolean) => {},
    isParentUnmounting: () => false,
    isParentMounted: () => false,
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
    const {subscribeAPI,unsubscribeAPI,toggleAPI,prevOpened,opened,level} = React.useContext<AccordionTreeContextType>(AccordionTreeContext);
    const {notifyAPI,isParentOpen,isParentUnmounting,isParentMounted, parentCntBox} = React.useContext<AccordionTreeItemContextType>(AccordionTreeItemContext);
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
    const onMount = React.useRef<()=>void>(()=>{
        const ref = wRef.current;
        if (ref===null || subscribed.current) { return; }
        const h = ref.scrollHeight;
        if(isParentMounted() && isParentOpen() && level>0) { 
            if(parentCntBox()!==null){ 
                notifyAPI(h); // Mount inside a parent with contentBox Rendered (unmountOnClose=false) => notify subscribe height increasing
            }  
        }
        if(isParentMounted() && !isParentOpen() && level>0) { 
            notifyAPI(h,true);
        }
        subscribeAPI(ref);
        subscribed.current = true;
    })

    const onUnmount = React.useRef<()=>void>(()=>{
        const ref = wRef.current;
        if (ref===null || !subscribed.current) { return; }
        const h = -(ref.scrollHeight);
        if(!isParentUnmounting() && isParentOpen() && level>0){ 
            notifyAPI(h); 
        }
        if(!isParentUnmounting() && !isParentOpen() && level>0){ 
            if(parentCntBox()!==null){ // Unmount but parent is not open and will be alive (unmountOnClose=false) => just decrease height 
                notifyAPI(h,true); 
            }  
        }
        isOnUnmounting.current=true;
        unsubscribeAPI(ref);
        subscribed.current = false;
    })

    const cRef = React.useRef<HTMLDivElement|null>(null);
    const onContentMount = React.useCallback((ref:HTMLDivElement|null) => {
        cRef.current = ref;
        if (ref!==null) {
            setHeight(()=>ref.scrollHeight)
            return; 
        }
        if(unmountOnClose){
            setHeight(()=>0);
        }
    },[unmountOnClose])

    // DEBUG ! ! ! ! ! 
    React.useLayoutEffect(()=>{
        setTimeout(()=>{
            if(wRef.current?.id!=='Section2'){return;}
            if(cRef.current!==null){
                const realH = parseFloat(window.getComputedStyle(cRef.current!).height.replace('px',''));
                const reahPT = parseFloat(window.getComputedStyle(cRef.current!).paddingTop.replace('px',''));
                const reahPB = parseFloat(window.getComputedStyle(cRef.current!).paddingBottom.replace('px',''));
                console.log('Section2',height,realH+reahPB+reahPT);
            } else {
                console.log(height,null)
            }
        },500)
    },[height])

    React.useLayoutEffect(() => {
        const [mount,unmount] = [onMount.current, onUnmount.current];
        mount(); return () => { unmount(); }
    }, []);
    

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

    const openPaddingPx = React.useMemo((): number => {
        const el = document.createElement('div');
        el.className = css.accordionOpen;
        el.style.position = 'absolute';
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
        document.body.appendChild(el);
        const pt = parseFloat(window.getComputedStyle(el).paddingTop.replace('px',''));
        const pb = parseFloat(window.getComputedStyle(el).paddingBottom.replace('px',''));            
        document.body.removeChild(el);
        return pt+pb;
    },[])

    const computeSpacing = React.useCallback((el: HTMLDivElement | null,opened: Set<HTMLDivElement>): number => {
        
        // NOT OPEN CASES 

        // Null => padding contribute 0 always
        if (!el) return 0;
        // Close => padding contribute 0 always
        const isOpen = opened.has(el);
        if (!isOpen) return 0;

        // OPEN CASES 

        // Get previout and next element
        const prev = el.previousElementSibling as HTMLDivElement|null;
        const next = el.nextElementSibling as HTMLDivElement|null;
        // Unique Child => 0 => no padding
        if (!prev && !next) { return 0; }

        // First Child => ha margin Bottom 16 solo se il secondo è chiuso, altrimenti 0
        if(!prev && next) { return openPaddingPx/2; }

        // Last Child => ha margin top 16 solo se il penultimo è chiuso, altrimenti 0
        if(prev && !next) { return opened.has(prev) ? 0 : openPaddingPx/2; }

        // Middle child => Ha tutti e 2 i padding se quello sopra è chiuso, altrimenti ne ha 1
        if(prev && next) {
            return opened.has(prev) ? openPaddingPx/2 : openPaddingPx;
        }
        return -1;
    }, [openPaddingPx]);

    const isSame = React.useCallback((a: Set<Element>, b: Set<Element>, el: Element | null): boolean => {
        if (!el) return true;
        return a.has(el) === b.has(el);
    },[]);

    const computeTotalSpacingDelta = React.useCallback((self: HTMLDivElement,prev: Set<HTMLDivElement>,next: Set<HTMLDivElement>): number => {
        const pred = self.previousElementSibling as HTMLDivElement | null;
        const succ = self.nextElementSibling as HTMLDivElement | null;

        const shouldCheckPrev = (!isSame(prev, next, pred) || !isSame(prev, next, self));
        const shouldCheckNext = (!isSame(prev, next, succ) || !isSame(prev, next, self));
        const spacingBeforeSelf = computeSpacing(self, prev);
        const spacingAfterSelf  = computeSpacing(self, next);

        const spacingBeforePrev = shouldCheckPrev && pred ? computeSpacing(pred, prev) : 0;
        const spacingAfterPrev  = shouldCheckPrev && pred ? computeSpacing(pred, next) : 0;

        const spacingBeforeNext = shouldCheckNext && succ ? computeSpacing(succ, prev) : 0;
        const spacingAfterNext  = shouldCheckNext && succ ? computeSpacing(succ, next) : 0;

        // console.log(self.id,Array.from(prev).map(e=>e.id),Array.from(next).map(e=>e.id))
        // console.log(self.id,[spacingBeforePrev,spacingBeforeSelf,spacingBeforeNext],[spacingAfterPrev,spacingAfterSelf,spacingAfterNext])

        let totalBefore = spacingBeforeSelf + spacingBeforePrev + spacingBeforeNext;
        let totalAfter  = spacingAfterSelf + spacingAfterPrev + spacingAfterNext;

        const isFirst = pred===null;
        const isLast  = succ===null;
        // Casi speciali, il primo o l'ultimo cambiano con i secondo/penultimo => si perdono padding
        if(isFirst && succ && !isSame(prev,next,self) && !isSame(prev,next,succ)){ totalAfter = totalBefore; }
        if(isLast  && pred && !isSame(prev,next,self) && !isSame(prev,next,pred)){ totalAfter = totalBefore; }

        return Math.abs(totalAfter - totalBefore);
    },[isSame,computeSpacing]);

    // When isOpen state change => notify height change to parent Item => notifyAPI height change to root
    const notifySyncRef = React.useRef<boolean>(isOpen);
    React.useLayoutEffect(()=>{
        if(notifySyncRef.current===isOpen){ return; }
        if(cRef.current===null){ return; }
        if(wRef.current===null){ return; }
        // Height includes user content padding. We must include our accordion padding:
        const delta = computeTotalSpacingDelta(wRef.current,prevOpened,opened);
        notifyAPI((isOpen?+1:-1)*(height+delta))
        notifySyncRef.current = isOpen;
    },[isOpen,opened,prevOpened,height,notifyAPI,computeTotalSpacingDelta])

    // Context methods
    const notifyImplementation = React.useCallback((delta:number,notRecursive?:boolean)=>{
        setHeight(p=>{ return p+delta });
        if(notRecursive){ return; }
        notifyAPI(delta) // RECURSIVE STEP
    },[notifyAPI])

    const isParentOpenImplementation = React.useCallback(()=>{
        return isOpenRef.current;
    },[])

     const parentCntBoxImplementation = React.useCallback(()=>{
        return cRef.current;
    },[])

    const isParentUnmountingImplementation = React.useCallback(()=>{
        return isOnUnmounting.current;
    },[])
    const isOnUnmounting = React.useRef<boolean>(false);

    const isParentMountedImplementation = React.useCallback(()=>{
        return wRef.current!==null;
    },[])

    const ctx:AccordionTreeItemContextType = React.useMemo<AccordionTreeItemContextType>(()=>{
        return {
            notifyAPI: notifyImplementation,
            isParentOpen: isParentOpenImplementation,
            isParentUnmounting: isParentUnmountingImplementation,
            parentCntBox: parentCntBoxImplementation,
            isParentMounted: isParentMountedImplementation
        }
    },[notifyImplementation, isParentUnmountingImplementation, isParentOpenImplementation,parentCntBoxImplementation,isParentMountedImplementation])

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
                        <div ref={onContentMount} className={css.innerContent}>{children}</div>
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