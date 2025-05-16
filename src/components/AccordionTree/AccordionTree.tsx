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
            const c = new Set(p); 
            c.delete(element); 
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
    notifyAPI:(delta:number) => void
}

const AccordionTreeItemContext = React.createContext<AccordionTreeItemContextType>({
    notifyAPI:(delta:number) => {}
});

       /*----------------+
        | ACCORDION ITEM |
        +----------------*/
type IAccordionTreeItemInnerProps = Omit<React.HTMLAttributes<HTMLDivElement | null>, 'children'|'title'> & {
    children: React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>
    title:string,
    arrowStyle?: 'chevron'|'cared'
};

const AccordionTreeItem: React.ForwardRefExoticComponent<IAccordionTreeItemInnerProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionTreeItemInnerProps>((props: IAccordionTreeItemInnerProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {
    // Props
    const { children,arrowStyle,title } = props;
    // Context
    const {subscribeAPI,unsubscribeAPI,toggleAPI,opened} = React.useContext<AccordionTreeContextType>(AccordionTreeContext);
    const {notifyAPI} = React.useContext<AccordionTreeItemContextType>(AccordionTreeItemContext);
    // States
    const [height,setHeight] = React.useState(0);
    // Refs 
    const wRef = React.useRef<HTMLDivElement | null>(null);
    const subscribed = React.useRef<boolean>(false);
    // Derived States
    const isOpen=React.useMemo(()=>{ return subscribed.current && wRef.current!==null && opened.has(wRef.current!);},[opened])
    
    
    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => {
        return wRef.current;
    });

    // Subscribe / UnSubscribe
    React.useLayoutEffect(() => {
        const ref = wRef.current;
        if (ref===null || subscribed.current) { return; }
        subscribeAPI(ref);
        subscribed.current = true;
        return () => {
            if (ref===null || !subscribed.current) { return; }
            unsubscribeAPI(ref);
            subscribed.current = false;
        }
    }, [subscribeAPI,unsubscribeAPI]);
    
    const onChildMountRef = React.useCallback((ref:HTMLDivElement|null) => {
        if (ref===null || ref.scrollHeight===undefined) { return; }
        setHeight(ref.scrollHeight)
    },[])

    const onHeightChange = React.useCallback((delta:number)=>{
        setHeight(p=>p+delta);
        notifyAPI(delta) // RECURSIVE STEP
    },[notifyAPI])

    const toggleChild = React.useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const isSubscribed = subscribed.current && wRef.current!==null;
        if(!isSubscribed){ return; } 
        toggleAPI(wRef.current!);
    },[toggleAPI])

    // When isOpen state change => notify height change to parent Item
    const notifyRef = React.useRef<boolean>(isOpen);
    React.useEffect(()=>{
        if(notifyRef.current===isOpen){ return; }
        notifyAPI((isOpen?+1:-1)*(height+32)) // MARGIN
        notifyRef.current = isOpen;
    },[height,notifyAPI,isOpen])


    return (
        //  style={{marginTop: index===0 ? 0 : undefined, marginBottom: index===ctx.length()-1 ? 0 : undefined}}
        <AccordionTreeItemContext.Provider value={{notifyAPI:onHeightChange}}>
            <div id={props.title} ref={wRef} className={`${css.accordion} ${isOpen ? css.accordionOpen : ''}`}>
                <button className={css.header} onClick={toggleChild}>
                    <span className={css.title}>{title}</span>
                    <span className={css.arrowWrapper}>
                        <span className={`${css.arrow} ${isOpen ? css.rotated : ''} ${css[arrowStyle ?? 'chevron']}`} />
                    </span>
                </button>

                <div ref={onChildMountRef} className={`${css.content} ${isOpen ? css.expanded : ''}`} style={{maxHeight: isOpen ? `${height}px` : '0px'}}>
                    <div className={css.innerContent}>{children}</div>
                </div>
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