import React from "react";
import { Fragment } from "react/jsx-runtime";
import { Modal } from "../Modal";
import css from './Modal.module.css';

const Component:React.FC<{}> = () => {

    const [open,setOpen] = React.useState<boolean>(false);
    
    return (
    <Fragment>

        <button onClick={()=>setOpen(true)}></button>

        <Modal 
            open={open} 
            closeDelay={1000} 
            portalTo={document.body} 
            className={{
                init: `${css.modal}`,
                open: `${css.modalOpen}`,
                close:`${css.modalClose}`,
            }}
            overlayProps={{className: {
                init: `${css.overlay}`,
                open: `${css.overlayOpen}`,
                close:`${css.overlayClose}`,
            }}}
            onClose={(reason)=>{setOpen(false);}}
        >
            <h2>Modale</h2>
            <p>Questo è un esempio di modale con trap focus.</p>
            <input type="text" placeholder="Campo di input" />
            <button onClick={()=>{setOpen(false);}}>Chiudi</button> 
        </Modal>

    </Fragment>
)}
      