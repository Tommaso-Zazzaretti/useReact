import React from "react";
import css from './Navbar.module.css';

export type INavbarProps = Omit<React.HTMLAttributes<HTMLElement|null>,'children'> & { 
    
}

const Navbar:React.ForwardRefExoticComponent<INavbarProps & React.RefAttributes<HTMLElement|null>> = React.forwardRef<HTMLElement|null,INavbarProps>((props:INavbarProps,ref:React.ForwardedRef<HTMLElement|null>) => {

    const { ...divProps } = props;
    const nRef = React.useRef<HTMLElement|null>(null);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLElement|null,HTMLElement|null>(ref, () => { 
        return nRef.current; 
    });

    return (
        <nav ref={nRef} {...divProps} className={`${divProps?.className ?? ''} ${css.navbar}`}>

        </nav>
    )
});

export default Navbar;
    