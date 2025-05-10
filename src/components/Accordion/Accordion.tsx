import React from "react";
import css from './Accordion.module.css';

export type IAccordionProps = Omit<React.HTMLAttributes<HTMLDivElement | null>, 'children'> & {
  children: Array<React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>> | React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>,
  singleOpen?: boolean;
  arrowStyle?: 'chevron' | 'plus-minus' | 'caret'; // Prop per il tipo di freccia
};

export type AccordionItemProps = {
  title: React.ReactNode;
  children: React.ReactNode;
};

const Accordion: React.ForwardRefExoticComponent<IAccordionProps & React.RefAttributes<HTMLDivElement | null>> = React.forwardRef<HTMLDivElement | null, IAccordionProps>((props: IAccordionProps, ref: React.ForwardedRef<HTMLDivElement | null>) => {

    const { singleOpen, arrowStyle = 'chevron', children, ...divProps } = props;
    const wRef = React.useRef<HTMLDivElement | null>(null);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => {
        return wRef.current;
    });

    const [openIndexes, setOpenIndexes] = React.useState<number[]>([]);

    const contentHeights = React.useRef<Record<number, number>>({});

    const toggle = (index: number) => {
        setOpenIndexes(prev => {
            return prev.includes(index) ? prev.filter(i => i !== index) : singleOpen ? [index]: [...prev, index]
        });
  };

  const childrenArray = React.Children.toArray(children) as React.ReactElement<AccordionItemProps>[];

  return (
    <div ref={wRef} {...divProps} className={`${divProps?.className ?? ''} ${css.accordionGroup}`}>

      {childrenArray.map((child, index, children) => {
            const isOpen = openIndexes.includes(index);

            return (
                <div className={`${css.accordion} ${isOpen ? css.accordionOpen : ''}`} key={index} style={{marginTop: index===0 ? 0 : undefined, marginBottom: index===children.length-1 ? 0 : undefined}}>
                    <button className={css.header} onClick={() => toggle(index)}>
                        <span className={css.title}>{child.props.title}</span>
                        <span className={css.arrowWrapper}>
                            <span className={`${css.arrow} ${isOpen ? css.rotated : ''} ${css[arrowStyle]}`} />
                        </span>
                    </button>

                <div
                    className={`${css.content} ${isOpen ? css.expanded : ''}`}
                    style={{maxHeight: isOpen ? `${contentHeights.current[index] || 0}px` : '0px'}}
                    ref={el => {
                if (el && el.scrollHeight) {
                  contentHeights.current[index] = el.scrollHeight;
                }
              }}
            >
              <div className={css.innerContent}>{child.props.children}</div>
            </div>
          </div>
        );
      })}

    </div>
  );
});

export default Accordion;