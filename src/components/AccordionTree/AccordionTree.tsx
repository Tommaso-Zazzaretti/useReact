import React from "react";
import css from './AccordionTree.module.css';

       /*---------+
        | CONTEXT |
        +---------*/
type AccordionTreeContextType = {
    // Per dire agli items a che livello siamo
    level: number; 
    // Per far capire ai figli se devono chiudersi
    openItems: Set<HTMLDivElement>, 

    heightMap: Map<HTMLDivElement,[number,number]>,
    // Metodo che i figli devono invocare per comunicare al parent l'inversione di stato
    onItemToggle:(element:HTMLDivElement) => void, 
    // Metodo che i figli devono chiamare per registrarsi negli elementi dell'aggregatore
    onItemMount:(element:HTMLDivElement,closeHeight:number,contentHeight:number) => void;
    // Metodo che i figli devono chiamare per dire 
    onItemUnmount:(element:HTMLDivElement) => void;
    // Metodo che i figli devono invocare per comunicare al parent che l'altezza interna di un item è cambiata
    onItemContentHeightChange:(element:HTMLDivElement,height:number) => void;
}

const AccordionTreeContext = React.createContext<AccordionTreeContextType>({
    level: -1,
    openItems: new Set<HTMLDivElement>(),
    heightMap: new Map<HTMLDivElement,[number,number]>(),
    onItemToggle:()=>{},
    onItemMount:()=>{ return; },
    onItemUnmount:()=>{ return; },
    onItemContentHeightChange:() => { return; }
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
    const {level:parentLevel} = React.useContext(AccordionTreeContext);       // To Get Level+1
    const {notifyHeightChange,parentInfo} = React.useContext(AccordionTreeItemContext);  // To get Notify Height Change (in case of nested accordions Tree)
    // States 
    const [openItems, setOpenItems] = React.useState<Set<HTMLDivElement>>(new Set());
    const [heightMap,setHeightMap]  = React.useState<Map<HTMLDivElement,[number,number]>>(new Map<HTMLDivElement,[number,number]>());
    // Refs
    const level = React.useRef<number>(parentLevel+1);
    const wRef  = React.useRef<HTMLDivElement|null>(null);
    const prevOpenItems = React.useRef<Set<HTMLDivElement>>(new Set())
    // Forward Ref
    React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => {
        return wRef.current;
    });

    const onItemToggle = React.useCallback((element: HTMLDivElement) => {
        setOpenItems(p => {
            prevOpenItems.current = new Set(p);
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

    // When HeightMap or opened element change, global height change => notify to parent nested AccordionTree
    const prevTotalHeight = React.useRef<number>(0);
    React.useLayoutEffect(()=>{
        if(level.current===0){ return; }
        const currentTotalHeight = Array.from(heightMap.entries()).reduce<number>((p,[ref,[closeHeight,contentHeight]])=>{
            const padding = computeSpacing(ref,openItems)
            return (openItems.has(ref) ? p+closeHeight+contentHeight : p+closeHeight) + padding;
        },0);
        const delta = currentTotalHeight-prevTotalHeight.current;
        prevTotalHeight.current = currentTotalHeight;

        const {open,itemBox,contentBox} = parentInfo();
        const isParentMounted = itemBox!==null;
        const isParentContentMounted = contentBox!==null;
        // If Parent is Opened and mounted => Notify 
        if(isParentMounted && isParentContentMounted){
            notifyHeightChange(delta,!open);
        } 

    },[openItems,heightMap,notifyHeightChange,parentInfo,computeSpacing])

    const onItemMount = React.useCallback((element:HTMLDivElement,closeHeight:number,contentHeight:number) => {
        setHeightMap((p)=>{ 
            if(p.has(element)){ return p; }
            return new Map(p).set(element,[closeHeight,contentHeight]); 
        })
        // if(initialOpen){ 
        //     setOpenItems((p)=>{
        //         prevOpenItems.current = new Set(p);
        //         return new Set(p).add(element); 
        //     }) 
        // }
    },[]);

    const onItemUnmount = React.useCallback((element:HTMLDivElement) => {
        setHeightMap((p)=>{ 
            if(!p.has(element)){ return p; }
            const c = new Map(p); p.delete(element); 
            return c; 
        })
        setOpenItems(p=>{
            prevOpenItems.current = new Set(p);
            const c = new Set(p); c.delete(element); return c; 
        })
    },[]);

    const onItemContentHeightChange = React.useCallback((element:HTMLDivElement,deltaContentHeight:number) => {
        setHeightMap((p)=>{ 
            const h = p.get(element);
            if(h===undefined){ return p; }
            return new Map(p).set(element,[h[0],h[1]+deltaContentHeight]); 
        })
    },[])

    const ctx:AccordionTreeContextType = React.useMemo<AccordionTreeContextType>(()=>{
        return { 
            level:level.current,
            openItems, 
            heightMap,
            onItemToggle,
            onItemMount,
            onItemUnmount,
            onItemContentHeightChange
        }
    },[openItems,heightMap,onItemMount,onItemUnmount,onItemToggle,onItemContentHeightChange])

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
    notifyHeightChange:(height:number,notRecursive?:boolean) => void;
    parentInfo(): IAccordionItemParentInfo
}

const AccordionTreeItemContext = React.createContext<AccordionTreeItemContextType>({
    notifyHeightChange:() => { return; },
    parentInfo:()=>{return { open: false, itemBox:null, contentBox: null }; }
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

type IAccordionItemParentInfo = {open: boolean, itemBox: HTMLDivElement|null, contentBox: HTMLDivElement|null}

const AccordionTreeItem: React.ForwardRefExoticComponent<IAccordionTreeItemInnerProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionTreeItemInnerProps>((props: IAccordionTreeItemInnerProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {
    // Props
    const {children,arrowStyle,closeDelay,unmountOnClose,title } = props;
    // Context
    const {onItemToggle,onItemMount,onItemUnmount,onItemContentHeightChange,openItems,heightMap} = React.useContext<AccordionTreeContextType>(AccordionTreeContext);
    // States
    const [maxHeight,setMaxHeight] = React.useState(0);
    // Refs 
    const wRef = React.useRef<HTMLDivElement | null>(null);
    const hRef = React.useRef<HTMLButtonElement|null>(null);
    const cRef = React.useRef<HTMLDivElement|null>(null);
    const dRef = React.useRef<HTMLDivElement|null>(null);
    const info = React.useRef<IAccordionItemParentInfo>({ open: false, itemBox: wRef.current, contentBox: cRef.current })
    // Derived States
    const isOpen=React.useMemo(()=>{ 
        const open = wRef.current!==null && openItems.has(wRef.current!);
        info.current.open = open;
        return open;
    },[openItems])
    
    
    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => {
        return wRef.current;
    });

    const getRuntimeHeight = React.useCallback((element:HTMLElement) => {     
        const style = window.getComputedStyle(element);
        return element.scrollHeight+parseFloat(style.marginTop)+parseFloat(style.marginBottom)+parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
    },[]);

    // MOUNT / UNMOUNT FULL COMPONENT
    const onMount = React.useRef<()=>void>(()=>{
        info.current.itemBox = wRef.current;
        if ([wRef,dRef,hRef].some(e=>e.current===null)) { return; } // cRef can be null (unmountOnClose=true)
        // const h = wRef.current.scrollHeight;
        const closeHeight   = getRuntimeHeight(hRef.current!)+getRuntimeHeight(dRef.current!)
        const contentHeight = cRef.current===null ? 0 : getRuntimeHeight(cRef.current!); // Cref is null in case of close element with unmountOnClose=true 
        onItemMount(wRef.current!,closeHeight,contentHeight);
    })

    const onUnmount = React.useRef<()=>void>(()=>{
        info.current.itemBox = wRef.current;
        if (wRef.current===null) { return; }
        onItemUnmount(wRef.current);
    })

    React.useLayoutEffect(() => {
        const mount = onMount.current; 
        const unmount = onUnmount.current;
        mount();
        return () => { unmount(); }
    }, []);


    // MOUNT / UNMOUNT OF CONTENT
    const onContentMount = React.useCallback((ref:HTMLDivElement|null) => {
        cRef.current = ref;
        info.current.contentBox = ref;
        if(!unmountOnClose){ return; }
        if(wRef.current===null){ return; }
        const contentHeight = ref!==null ? getRuntimeHeight(ref) : 0;
        onItemContentHeightChange(wRef.current,contentHeight)
    },[unmountOnClose,getRuntimeHeight,onItemContentHeightChange])



    React.useLayoutEffect(()=>{
        if(wRef.current===null){ return; }
        const h = heightMap.get(wRef.current);
        if(h===undefined){ return; }
        const [,contentHeight] = h;
        setMaxHeight(()=>isOpen?contentHeight:0)
    },[heightMap,isOpen])

    // DEBUG ! ! ! ! ! 
    React.useLayoutEffect(()=>{
        setTimeout(()=>{
            // if(!['Section2','Section2.1','Section2.1.3'].includes(wRef.current?.id ?? '')){return;}
            if(cRef.current!==null){
                const realH = parseFloat(window.getComputedStyle(cRef.current!).height.replace('px',''));
                const reahPT = parseFloat(window.getComputedStyle(cRef.current!).paddingTop.replace('px',''));
                const reahPB = parseFloat(window.getComputedStyle(cRef.current!).paddingBottom.replace('px',''));
                console.log(wRef.current?.id,info.current.open ?maxHeight:0,realH+reahPB+reahPT);
            } else {
                console.log(maxHeight,null)
            }
        },500)
    },[maxHeight])

    
    

    // Toggle Click
    const [active, setActive] = React.useState<boolean>(isOpen);
    const isAnimate = React.useRef<boolean>(false);

    const toggleChild = React.useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if(wRef.current===null){ return; } 
        if(isAnimate.current){ return; }
        onItemToggle(wRef.current);
    },[onItemToggle])

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


    // Context methods
    const notifyHeightChange = React.useCallback((delta:number,notRecursive?:boolean)=>{
        if(wRef.current===null){ return; }
        setMaxHeight(p=>{ return p+delta });
        if(notRecursive){ return; }
        onItemContentHeightChange(wRef.current,delta) // RECURSIVE STEP
    },[onItemContentHeightChange])

    const parentInfo = React.useCallback(()=>{
        return info.current;
    },[])

    const ctx:AccordionTreeItemContextType = React.useMemo<AccordionTreeItemContextType>(()=>{
        return {
            notifyHeightChange,
            parentInfo
        }
    },[notifyHeightChange,parentInfo])

    return (
        //  style={{marginTop: index===0 ? 0 : undefined, marginBottom: index===ctx.length()-1 ? 0 : undefined}}
        <AccordionTreeItemContext.Provider value={ctx}>
            <div id={props.title} ref={wRef} className={`${css.accordion} ${isOpen ? css.accordionOpen : ''}`}>
                <button ref={hRef} className={css.header} onClick={toggleChild}>
                    <span className={css.title}>{title}</span>
                    <span className={css.arrowWrapper}>
                        <span className={`${css.arrow} ${isOpen ? css.rotated : ''} ${css[arrowStyle ?? 'chevron']}`} />
                    </span>
                </button>
                <div className={`${css.content}`} style={{maxHeight}}>
                    {(!unmountOnClose || active) &&
                        <div ref={onContentMount} className={css.innerContent}>{children}</div>
                    }
                </div>
                <div ref={dRef} style={{borderBottom:'1px solid #ddd'}}></div>
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