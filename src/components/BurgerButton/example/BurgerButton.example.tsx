import React from "react";
import BurgerButton from "../BurgerButton";
import css from './BurgerButton.module.css';

const Component:React.FC<object> = () => {

  const [open,setOpen] = React.useState<boolean>(false);

  return <React.Fragment>
        <BurgerButton rotation={0} className={css.burgerButton} toggle={open} onToggle={(toggle)=>setOpen(toggle)}/>
    </React.Fragment>
}