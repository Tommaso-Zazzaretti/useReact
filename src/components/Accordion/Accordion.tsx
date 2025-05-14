import React from "react";
import css from './Accordion.module.css';

// CONTEXT
type AccordionContextType = {
  openIndexes: Array<number>,
  arrowStyle?: 'chevron' | 'caret'
  toggle:(index:number) => void,
  subscribe:() => number;
  length:() => number;
}
const AccordionContext = React.createContext<AccordionContextType>({
  openIndexes:[],
  arrowStyle:undefined,
  toggle:()=>{},
  length:()=>{return 0; },
  subscribe:()=>{return 0; },
});

// ACCORDION
export type IAccordionProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: 
    | React.ReactElement<IAccordionItemProps, string | React.JSXElementConstructor<typeof Accordion.Item>> 
    | React.ReactElement<IAccordionItemProps, string | React.JSXElementConstructor<typeof Accordion.Item>>[]
  singleOpen?: boolean
  arrowStyle?: 'chevron' | 'caret'
};

const AccordionBase: React.ForwardRefExoticComponent<IAccordionProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionProps>((props: IAccordionProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {

  const {children,singleOpen,arrowStyle, ...divProps } = props;
  const wRef = React.useRef<HTMLDivElement | null>(null);

  // Link Forwarded div Ref with real div Ref
  React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => {
    return wRef.current;
  });

  const [openIndexes, setOpenIndexes] = React.useState<number[]>([]);
  const itemCounter = React.useRef<number>(0);

  const toggle = (index: number) => {
    setOpenIndexes(prev => {
      return prev.includes(index) ? prev.filter(i => i !== index) : singleOpen ? [index]: [...prev, index]
    });
  }
  const subscribe = ():number => {
    const index = itemCounter.current;
    itemCounter.current += 1;
    return index;
  };

  const length = ():number => {
    return Array.isArray(children) ? children.length : 1;
  }

  return (
    <AccordionContext.Provider value={{ openIndexes,arrowStyle, toggle,subscribe, length }}>
      <div ref={wRef} {...divProps} className={`${divProps?.className ?? ''} ${css.accordionGroup}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
});


// ITEM

type IAccordionItemInnerProps = Omit<React.HTMLAttributes<HTMLDivElement | null>, 'children'> & {
  children: React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>
  title:string,
};

const AccordionItem: React.ForwardRefExoticComponent<IAccordionItemInnerProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionItemInnerProps>((props: IAccordionItemInnerProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {

  const { children, } = props;
  const wRef = React.useRef<HTMLDivElement | null>(null);

  // Link Forwarded div Ref with real div Ref
  React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => {
    return wRef.current;
  });

  const onChildMount = React.useCallback((ref:HTMLDivElement|null) => {
    if (ref===null || ref.scrollHeight===undefined) { return; }
    setChildrenHeight(ref.scrollHeight)
  },[])

  const [childrenHeight,setChildrenHeight] = React.useState(0);

  const ctx = React.useContext<AccordionContextType>(AccordionContext);

  const [index, setIndex] = React.useState<number | null>(null);

  const isOpen=index!==null && ctx.openIndexes.includes(index);
  React.useEffect(() => {
    if(index!==null){ return }
    const newIndex = ctx.subscribe();
    setIndex(newIndex);
  }, [ctx,index]);

  React.useEffect(()=>{
    return () => console.log('UNMOUNT')
  },[])

  return (
    <div ref={wRef} className={`${css.accordion} ${isOpen ? css.accordionOpen : ''}`} key={index} style={{marginTop: index===0 ? 0 : undefined, marginBottom: index===ctx.length()-1 ? 0 : undefined}}
    >
      <button className={css.header} onClick={() => { if(index===null){ return; } ctx.toggle(index); }}>
        <span className={css.title}>{props.title}</span>
        <span className={css.arrowWrapper}>
          <span className={`${css.arrow} ${isOpen ? css.rotated : ''} ${css[ctx.arrowStyle ?? 'chevron']}`} />
        </span>
      </button>

      <div
        className={`${css.content} ${isOpen ? css.expanded : ''}`}
        style={{maxHeight: isOpen ? `${childrenHeight || 0}px` : '0px'}}
        ref={onChildMount}
      >
        <div className={css.innerContent}>{children}</div>
      </div>
    </div>
  );
});




export type IAccordionItemProps = Omit<IAccordionItemInnerProps, 'index'>

const Accordion = AccordionBase as React.ForwardRefExoticComponent<IAccordionProps & React.RefAttributes<HTMLDivElement>> & {
  Item: React.ForwardRefExoticComponent<IAccordionItemProps & React.RefAttributes<HTMLDivElement | null>>;
};

Accordion.Item = AccordionItem as React.ForwardRefExoticComponent<IAccordionItemProps & React.RefAttributes<HTMLDivElement | null>>;

export default Accordion;
