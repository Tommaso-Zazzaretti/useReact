import React from "react";
import css from './AccordionTree.module.css';
import RotatingIcon, { IRotatingIconProps } from "../../icons/RotatingIcon/RotatingIcon";

       /*-------------------+
        | CONTEXT ACCORDION |
        +-------------------*/
type AccordionTreeContextType = {
    // Per dire agli items a che livello siamo
    level: number; 
    // Per far capire ai figli se devono chidersi
    openItems: Set<HTMLDivElement>, 
    // Padding tra figli aperti
    spacing: number,
    // Mappa altezze
    heightMap: Map<HTMLDivElement,[number,number]>,
    // Metodo che i figli devono invocare per comunicare al parent l'inversione di stato
    onItemToggle:(element:HTMLDivElement) => void, 
    // Metodo che i figli devono chiamare per registrarsi negli elementi dell'aggregatore
    onItemMount:(element:HTMLDivElement,closeHeight:number,contentHeight:number) => void;
    // Metodo che i figli devono chiamare per dire 
    onItemUnmount:(element:HTMLDivElement) => void;
    // Metodo per ascoltare notifiche di height update
    onItemHeightChange: (element:HTMLDivElement,contentHeight:number) => void;
}

const AccordionTreeContext = React.createContext<AccordionTreeContextType>({
    level: -1,
    spacing: -1,
    openItems: new Set<HTMLDivElement>(),
    heightMap: new Map<HTMLDivElement,[number,number]>(),
    onItemToggle:()=>{},
    onItemMount:()=>{ return; },
    onItemUnmount:()=>{ return; },
    onItemHeightChange:()=>{ return; }
});

       /*---------+
        | CONTEXT |
        +---------*/
type AccordionTreeItemContextType = {
    parentTreeItem: () => HTMLDivElement | null;
    parentTreeItemContent: () => HTMLDivElement | null;
    parentTreeItemOpen: boolean
}

const AccordionTreeItemContext = React.createContext<AccordionTreeItemContextType>({
    parentTreeItem: () => null,
    parentTreeItemContent: () => null,
    parentTreeItemOpen: false,

});

       /*------------------+
        | UTILITY FUNCTIONS |
        +------------------*/
const computeSpacing = (el: HTMLDivElement | null,opened: Set<HTMLDivElement>,openPaddingPx:number): number => {
        
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
}

const openPaddingPx = (className:string): number => {
    const el = document.createElement('div');
    el.className = className;
    el.style.position = 'absolute';
    el.style.visibility = 'hidden';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    const pt = parseFloat(window.getComputedStyle(el).paddingTop.replace('px',''));
    const pb = parseFloat(window.getComputedStyle(el).paddingBottom.replace('px',''));            
    document.body.removeChild(el);
    return pt+pb;
}

const getRuntimeBlockHeight = (element:HTMLElement) => {     
    const style = window.getComputedStyle(element);

    const height = parseFloat(style.height);
    const marginTop = parseFloat(style.marginTop);
    const marginBottom = parseFloat(style.marginBottom);

    const borderTop = parseFloat(style.borderTopWidth);
    const borderBottom = parseFloat(style.borderBottomWidth);
    const paddingTop = parseFloat(style.paddingTop);
    const paddingBottom = parseFloat(style.paddingBottom);

    const isBorderBox = style.boxSizing === 'border-box';

    const totalHeight = height
        + marginTop + marginBottom
        + (isBorderBox ? 0 : paddingTop + paddingBottom + borderTop + borderBottom);

    return totalHeight;
};

       /*-----------+
        | ACCORDION |
        +-----------*/
type BaseAccordionTreeProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  children:
    | React.ReactElement<IAccordionTreeItemProps, string | React.JSXElementConstructor<typeof AccordionTree.Item>>
    | React.ReactElement<IAccordionTreeItemProps, string | React.JSXElementConstructor<typeof AccordionTree.Item>>[];
  spacing?: number;
};
type IAccordionTreeUncontrolledProps = { singleOpen: boolean; openedItems?: never; };
type IAccordionTreeControlledProps   = { singleOpen?: never ; openedItems: Array<HTMLDivElement>; };
export type IAccordionTreeProps = BaseAccordionTreeProps & (IAccordionTreeUncontrolledProps | IAccordionTreeControlledProps);

const AccordionTreeBase: React.ForwardRefExoticComponent<IAccordionTreeProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionTreeProps>((props: IAccordionTreeProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {
    // Props
    const {children,singleOpen,spacing,openedItems, ...divProps } = props;
    // Context
    const {level:parentLevel,onItemHeightChange:updateParent} = React.useContext(AccordionTreeContext); // To Get Level+1
    const {parentTreeItem,parentTreeItemContent} = React.useContext(AccordionTreeItemContext); // To Get Parent Item
    // States 
    const [openItems, setOpenItems]  = React.useState<Set<HTMLDivElement>>(new Set());
    const [heightMap,setHeightMap]   = React.useState<Map<HTMLDivElement,[number,number]>>(new Map<HTMLDivElement,[number,number]>());
    const [level, setLevel]  = React.useState<number>(parentLevel+1);
    // Refs
    const wRef  = React.useRef<HTMLDivElement|null>(null);
    const openPadPx = React.useRef<number>(openPaddingPx(css.accordionOpen));

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => {
        return wRef.current;
    });

    React.useEffect(()=>{
        setLevel(parentLevel+1);
    },[parentLevel])

    React.useLayoutEffect(()=>{
        const parentNode = parentTreeItem();
        const parentNodeContent = parentTreeItemContent();
        if(level===0 || parentNode===null || parentNodeContent===null){ return; }
        // Update spacingMap and total height
        const currentSpacingMap = new Map<HTMLDivElement,number>();
        const currentTotalHeight = Array.from(heightMap.entries()).reduce<number>((p,[ref,[closeHeight,contentHeight]])=>{
            const padding = computeSpacing(ref,openItems, spacing!==undefined ? spacing*2 : openPadPx.current);
            currentSpacingMap.set(ref,padding);
            return (openItems.has(ref) ? p+closeHeight+contentHeight : p+closeHeight) + padding;
        },0);
        const parentOffset = 
            parseFloat(window.getComputedStyle(parentNodeContent).paddingTop.replace('px','')) + 
            parseFloat(window.getComputedStyle(parentNodeContent).paddingBottom.replace('px',''));
        updateParent(parentNode,currentTotalHeight+parentOffset);
    },[level,spacing,openItems,heightMap,updateParent,parentTreeItem,parentTreeItemContent]);

    React.useEffect(()=>{
        if(openedItems===undefined){ return; } 
        // CONTROLLED
        setOpenItems(p => {
            return new Set<HTMLDivElement>(openedItems?.filter(e=>heightMap.has(e)));
        })
    },[openedItems,heightMap])


    const onItemToggle = React.useCallback((element: HTMLDivElement) => {
        if(openedItems!==undefined){ return; }
        // NOT CONTROLLED
        setOpenItems(p => {
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
    },[singleOpen,openedItems]);

    const onItemMount = React.useCallback((element:HTMLDivElement,closeHeight:number,contentHeight:number) => {
        setHeightMap(p=>new Map(p.set(element,[closeHeight,contentHeight])));
    },[]);
    
    const onItemUnmount = React.useCallback((element:HTMLDivElement) => {
        setHeightMap(p=>{
            const c = new Map(p);
            c.delete(element);
            return c;
        });
        setOpenItems(p=>{
            const c = new Set(p); c.delete(element); return c; 
        })
        
    },[]);

    const onItemHeightChange = React.useCallback((element:HTMLDivElement,contentHeight:number) => {
        setHeightMap(p=>{
            if(p.has(element)){
                const c = new Map(p);
                const [closeHeight] = c.get(element)!;
                c.set(element,[closeHeight,contentHeight]);
                return c;
            } else {
                return p
            }
        })
    },[]);

    const ctx:AccordionTreeContextType = React.useMemo<AccordionTreeContextType>(()=>{
        return { onItemToggle, onItemMount, onItemUnmount, onItemHeightChange, level: level, openItems, heightMap, spacing: spacing ?? openPadPx.current/2 };
    },[onItemToggle, onItemMount, onItemUnmount, onItemHeightChange, openItems, heightMap, spacing, level])

    return (
        <AccordionTreeContext.Provider value={ctx}>
            <div ref={wRef} {...divProps} className={`${divProps?.className ?? ''} ${css.accordionGroup}`}>
                {children}
            </div>
        </AccordionTreeContext.Provider>
    )
});

       /*----------------+
        | ACCORDION ITEM |
        +----------------*/
type IAccordionTreeItemInnerProps = Omit<React.HTMLAttributes<HTMLDivElement | null>, 'children'|'title'> & {
    children: React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>,
    title:string,
    disabled?: boolean
    headerProps?: IHeaderProps
    headerContentProps?: IHeaderContentRenderProps | IHeaderContentProps
    contentProps?: IContentProps
    innerContentProps?: IInnerContentProps
    unmountOnClose?: boolean
    closeDelay?: number
    onItemCreate?: (ref:HTMLDivElement) => void
    onItemDestroy?: (ref:HTMLDivElement) => void
    onToggleItem?: (open:boolean, ref:HTMLDivElement) => void
};

// Header Props
export type IHeaderProps = Omit<React.HTMLAttributes<HTMLButtonElement | null>, 'children'|'title'|'ref'|'disabled'|'className'|'tabIndex'> & {className: {init: string, open: string }};;
export type IHeaderContentProps        = { renderHeaderContent?:    never   , iconProps: Omit<IRotatingIconProps,'isOpen'> & {position:'start'|'end'} }
export type IHeaderContentRenderProps  = { renderHeaderContent: (open:boolean) => JSX.Element , iconProps?: never }
// Content Props
export type IContentProps      = Omit<React.HTMLAttributes<HTMLDivElement | null>, 'children'>;
export type IInnerContentProps = Omit<React.HTMLAttributes<HTMLDivElement | null>, 'children'|'ref'|'className'> & {className: {init: string, open: string }};


const AccordionTreeItem: React.ForwardRefExoticComponent<IAccordionTreeItemInnerProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionTreeItemInnerProps>((props: IAccordionTreeItemInnerProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {
    // Props
    const {children,disabled,headerProps,headerContentProps,contentProps,innerContentProps,closeDelay,unmountOnClose,onItemCreate,onItemDestroy,onToggleItem:onToggleItemEventHandler, ...divProps } = props;
    // Context
    const {onItemToggle,onItemMount,onItemUnmount,onItemHeightChange,spacing,openItems,heightMap,level} = React.useContext<AccordionTreeContextType>(AccordionTreeContext);
    const {parentTreeItemOpen} = React.useContext<AccordionTreeItemContextType>(AccordionTreeItemContext);
    // States
    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    const [active, setActive] = React.useState<boolean>(false);
    const [contentHeight, setContentHeight] = React.useState<number>(0);
    // Refs
    const wRef = React.useRef<HTMLDivElement | null>(null);
    const cRef = React.useRef<HTMLDivElement | null>(null);
    const bRef = React.useRef<HTMLButtonElement | null>(null);
    const dRef = React.useRef<HTMLDivElement | null>(null);
    const isAnimate = React.useRef<boolean>(false);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => {
        return wRef.current;
    });

    // ANIMATION SPAM AVOIDANCE
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

    // OPEN && HEIGHT CHANGES
    React.useEffect(()=>{
        const isOpen = wRef.current!==null && openItems.has(wRef.current!);
        const contentHeight = heightMap.get(wRef.current!)?.[1] ?? 0;
        setIsOpen(isOpen);
        setContentHeight(contentHeight);
    },[openItems,heightMap])

    // ON COMPONENT MOUNT / UNMOUNT
    const onCreateRef = React.useRef<((ref:HTMLDivElement) => void)|undefined>((ref)=>onItemCreate?.(ref))
    const oDestroyRef = React.useRef<((ref:HTMLDivElement) => void)|undefined>((ref)=>onItemDestroy?.(ref))
    const onInitOrDestroyEventHandler = React.useCallback((ref:HTMLDivElement)=>{
        if(ref!==null){ // Mount case
            const closeHeight   = getRuntimeBlockHeight(bRef.current!)+getRuntimeBlockHeight(dRef.current!)
            const contentHeight = cRef.current===null ? 0 : getRuntimeBlockHeight(cRef.current!);
            onItemMount(ref,closeHeight,contentHeight);
            onCreateRef.current?.(ref)
        } else { // Unmount case
            oDestroyRef.current?.(wRef.current!)
            onItemUnmount(wRef.current!);
        }
        wRef.current = ref;
    },[onItemMount,onItemUnmount])

    // ON COMPONENT CONTENT MOUNT / UNMOUNT
    const onContentInitOrDestroyEventHandler = React.useCallback((ref:HTMLDivElement)=>{
        if(ref!==null){ // Mount case
            if(wRef.current!==null){ 
                onItemHeightChange(wRef.current!,getRuntimeBlockHeight(ref)); 
            }
        } else { // Unmount case
            if(wRef.current!==null){ onItemHeightChange(wRef.current!,0); }
        }
        cRef.current = ref;
    },[onItemHeightChange])

    const onToggleButtonClickEventHandler = React.useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        headerProps?.onClick?.(event);
        if(wRef.current===null){ return; } 
        if(isAnimate.current){ return; }
        onItemToggle(wRef.current); // Parent Accordion context method
        onToggleItemEventHandler?.(isOpen,wRef.current) // User external props for controlled behavior
    },[onToggleItemEventHandler,onItemToggle,headerProps,isOpen])

    const ctx:AccordionTreeItemContextType = React.useMemo<AccordionTreeItemContextType>(()=>{
        return {
            parentTreeItem: () => wRef.current,
            parentTreeItemContent: () => cRef.current,
            parentTreeItemOpen: isOpen && (parentTreeItemOpen || level===0),
        }
    },[isOpen,parentTreeItemOpen,level])

    // DEBUG
    // React.useLayoutEffect(()=>{
    //     setTimeout(()=>{
    //         if(!['Section2','Section2.1','Section2.1.3'].includes(props.title ?? '')){return;}
    //         if(cRef.current!==null){
    //             const realH = parseFloat(window.getComputedStyle(cRef.current!).height.replace('px',''));
    //             const reahPT = parseFloat(window.getComputedStyle(cRef.current!).paddingTop.replace('px',''));
    //             const reahPB = parseFloat(window.getComputedStyle(cRef.current!).paddingBottom.replace('px',''));
    //             console.log(props.title?contentHeight:0,realH+reahPB+reahPT);
    //         } else {
    //             console.log(contentHeight,null)
    //         }
    //     },500)
    // },[contentHeight,props.title])

    const icon = React.useMemo(()=>{
        return <RotatingIcon 
            direction={headerContentProps?.iconProps?.direction ?? "top-bottom"} 
            type={headerContentProps?.iconProps?.type ?? "chevron"}
            isOpen={isOpen}
            className={css.icon}
        />
    },[isOpen,headerContentProps])

    return (
        <AccordionTreeItemContext.Provider value={ctx}>
            <div {...divProps} ref={onInitOrDestroyEventHandler} className={`${css.accordion} ${divProps.className ?? ''} ${isOpen ? `${css.accordionOpen}` : ''}`} style={{...divProps.style ?? {}, padding:isOpen ? `${spacing}px 0px` : 0}}>

                <button {...headerProps ?? {}} tabIndex={parentTreeItemOpen||level===0?0:-1} disabled={disabled} ref={bRef} className={`${css.header} ${headerProps?.className?.init ?? ''} ${isOpen ? `${headerProps?.className?.open}` : ''}`} onClick={onToggleButtonClickEventHandler}>
                    {
                        headerContentProps?.renderHeaderContent===undefined
                            ?  
                                <React.Fragment>
                                    {(headerContentProps?.iconProps?.position==='start') && icon}
                                    <span className={css.text}>{props.title}</span>
                                    {(headerContentProps?.iconProps?.position==='end' || headerContentProps?.iconProps?.position===undefined) && icon}
                                </React.Fragment>
                            :
                                headerContentProps.renderHeaderContent(isOpen)
                    }
                </button>

                <div {...contentProps ?? {}} className={`${css.content} ${contentProps?.className ?? ''}`} style={{...contentProps?.style ?? {}, maxHeight: isOpen ? contentHeight+'px' : '0px'}}>
                    {(!unmountOnClose || active) &&
                        <div {...innerContentProps} ref={onContentInitOrDestroyEventHandler} className={`${css.innerContent} ${innerContentProps?.className.init ?? ''} ${isOpen && active ? `${css.innerContentOpen} ${innerContentProps?.className.open ?? ''}` : ''}`}>
                            {children}
                        </div>
                    }
                </div>

                <div ref={dRef} className={css.divider}></div>
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