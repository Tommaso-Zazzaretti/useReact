import React from "react";
import css from './Accordion.module.css';

       /*---------+
        | CONTEXT |
        +---------*/
type AccordionContextType = {
    level: number;
    opened: Set<HTMLDivElement>,
    toggleAPI:(element:HTMLDivElement) => void,
    subscribeAPI:(element:HTMLDivElement) => void;
    unsubscribeAPI:(element:HTMLDivElement) => void;
}

const AccordionContext = React.createContext<AccordionContextType>({
    level: -1,
    opened: new Set<HTMLDivElement>(),
    toggleAPI:()=>{},
    subscribeAPI:()=>{return; },
    unsubscribeAPI:()=>{return; }
});


       /*-----------+
        | ACCORDION |
        +-----------*/
export type IAccordionProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: 
    | React.ReactElement<IAccordionItemProps, string | React.JSXElementConstructor<typeof Accordion.Item>> 
    | React.ReactElement<IAccordionItemProps, string | React.JSXElementConstructor<typeof Accordion.Item>>[]
  singleOpen?: boolean
};

const AccordionBase: React.ForwardRefExoticComponent<IAccordionProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionProps>((props: IAccordionProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {
    // Props
    const {children,singleOpen, ...divProps } = props;
    // Context
    const parentRootContext = React.useContext(AccordionContext);     // To Get Level+1
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

    const ctx:AccordionContextType = React.useMemo<AccordionContextType>(()=>{
        return { 
            level:level.current,
            opened, 
            toggleAPI,
            subscribeAPI,
            unsubscribeAPI
        }
    },[opened,subscribeAPI,unsubscribeAPI,toggleAPI])

    return (
        <AccordionContext.Provider value={ctx}>
            <div ref={wRef} {...divProps} className={`${divProps?.className ?? ''} ${css.accordionGroup}`}>
                {children}
            </div>
        </AccordionContext.Provider>
    )
});


       /*---------+
        | CONTEXT |
        +---------*/
type AccordionItemContextType = {
    notifyAPI:(delta:number) => void
}

const AccordionItemContext = React.createContext<AccordionItemContextType>({
    notifyAPI:(delta:number) => {}
});

       /*----------------+
        | ACCORDION ITEM |
        +----------------*/
type IAccordionItemInnerProps = Omit<React.HTMLAttributes<HTMLDivElement | null>, 'children'|'title'> & {
    children: React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>
    title:string,
    arrowStyle?: 'chevron'|'cared'
};

const AccordionItem: React.ForwardRefExoticComponent<IAccordionItemInnerProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionItemInnerProps>((props: IAccordionItemInnerProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {
    // Props
    const { children,arrowStyle,title } = props;
    // Context
    const {subscribeAPI,unsubscribeAPI,toggleAPI,opened} = React.useContext<AccordionContextType>(AccordionContext);
    const {notifyAPI} = React.useContext<AccordionItemContextType>(AccordionItemContext);
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
    },[])

    const toggleChild = React.useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const isSubscribed = subscribed.current && wRef.current!==null;
        if(!isSubscribed){ return; } 
        toggleAPI(wRef.current!);
        notifyAPI((isOpen?-1:+1)*(height+32)) // MARGIN
    },[toggleAPI,notifyAPI,isOpen,height])


    return (
        //  style={{marginTop: index===0 ? 0 : undefined, marginBottom: index===ctx.length()-1 ? 0 : undefined}}
        <AccordionItemContext.Provider value={{notifyAPI:onHeightChange}}>
            <div ref={wRef} className={`${css.accordion} ${isOpen ? css.accordionOpen : ''}`}>
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
        </AccordionItemContext.Provider>
    );
});

export type IAccordionItemProps = Omit<IAccordionItemInnerProps, 'index'>

const Accordion = AccordionBase as React.ForwardRefExoticComponent<IAccordionProps & React.RefAttributes<HTMLDivElement>> & {
    Item: React.ForwardRefExoticComponent<IAccordionItemProps & React.RefAttributes<HTMLDivElement | null>>;
};

Accordion.Item = AccordionItem as React.ForwardRefExoticComponent<IAccordionItemProps & React.RefAttributes<HTMLDivElement | null>>;

export default Accordion;