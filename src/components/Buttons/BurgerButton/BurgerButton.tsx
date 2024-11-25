import React from "react";
import css from "./BurgerButton.module.css";

export interface IBurgerButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement|null>,'children'> {
    rotation:number,
    toggle?:boolean
    onToggle?:(toggle:boolean)=>void;
}

interface IBurgerButtonToggleParameters {
    angle: number;
    translateY: number;
}
export const BurgerButton:React.ForwardRefExoticComponent<IBurgerButtonProps & React.RefAttributes<HTMLButtonElement|null>> = React.forwardRef<HTMLButtonElement|null,IBurgerButtonProps>((props:IBurgerButtonProps,ref:React.ForwardedRef<HTMLButtonElement|null>) => {
    const {toggle, onToggle,rotation, ...buttonProps } = props;

    const bRef  = React.useRef<HTMLButtonElement|null>(null);
    const s1Ref = React.useRef<HTMLSpanElement|null>(null);
    const s2Ref = React.useRef<HTMLSpanElement|null>(null);
    const s3Ref = React.useRef<HTMLSpanElement|null>(null);

    const [checked,setChecked] = React.useState<boolean>(false);

    // Link Forwarded div Ref with real div Ref
    React.useImperativeHandle<HTMLButtonElement|null,HTMLButtonElement|null>(ref, () => { 
      return bRef.current; 
    });

    React.useEffect(()=>{
        setChecked(toggle ?? false);
    },[toggle])


    const onBurgerButtonCheckboxChangeEventHandler = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setChecked(checked);  
        onToggle?.(checked);      
    },[onToggle])

    const rotationOverhead = React.useMemo(()=>{ return rotation; },[rotation])
    

    const toggleParameters = React.useMemo<IBurgerButtonToggleParameters|undefined>(()=>{
        if(!checked || s2Ref.current===null || bRef.current===null){ return undefined; }
        const { offsetWidth: W, offsetHeight: H } = bRef.current;
        const center = {x:W/2, y: H/2 }
        const angle = Math.atan(H/W)*(180/Math.PI); // radiant => degrees
        const translateY = center.y - (H/4) + (s2Ref.current.offsetHeight/4); // 3 div with space-evenly => H/4 (flex direction is column)
        return { angle,translateY };
    },[checked]);

    const span1Style = React.useMemo<React.CSSProperties>(()=>{
        return { transform: toggleParameters!==undefined ? `translateY(${toggleParameters.translateY}px) rotate(${toggleParameters.angle + rotationOverhead}deg)`: "none",}
    },[toggleParameters,rotationOverhead]);

    const span2Style = React.useMemo<React.CSSProperties>(()=>{
        return { opacity: toggleParameters!==undefined ? 0 : 1, transform: toggleParameters!==undefined ? `rotate(-${rotationOverhead}deg)`: "none",width: toggleParameters!==undefined ? '0%' : undefined}
    },[toggleParameters,rotationOverhead]);

    const span3Style = React.useMemo<React.CSSProperties>(()=>{
        return { transform: toggleParameters!==undefined ? `translateY(-${toggleParameters.translateY}px) rotate(-${toggleParameters.angle + rotationOverhead}deg)`: "none",}
    },[toggleParameters,rotationOverhead]);
    
    return <button ref={bRef} {...buttonProps} className={`${buttonProps.className ?? ''} ${css.burgerButton}`}>
        <input type="checkbox" disabled={props.disabled} onChange={onBurgerButtonCheckboxChangeEventHandler}/>
        <span ref={s1Ref} style={span1Style}></span>
        <span ref={s2Ref} style={span2Style}></span>
        <span ref={s3Ref} style={span3Style}></span>
    </button>
})

export default BurgerButton;