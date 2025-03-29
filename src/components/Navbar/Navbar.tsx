import React from "react";
import css from './Navbar.module.css';

export type INavbarProps = Omit<React.HTMLAttributes<HTMLDivElement|null>,'children'> & { 
    
}

const Navbar:React.ForwardRefExoticComponent<INavbarProps & React.RefAttributes<HTMLDivElement|null>> = React.forwardRef<HTMLDivElement|null,INavbarProps>((props:INavbarProps,ref:React.ForwardedRef<HTMLDivElement|null>) => {

    const { ...divProps } = props;
    const nRef = React.useRef<HTMLDivElement|null>(null);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLDivElement|null,HTMLDivElement|null>(ref, () => { 
        return nRef.current; 
    });

    return (
        <div ref={nRef} {...divProps} className={`${divProps?.className ?? ''} ${css.navbar}`}>

        </div>
    )
});

export default Navbar;
    