import React, { Fragment } from 'react';
import Scroller from './components/Scroller/Scroller';
import Splitter from './components/Splitter/Splitter';
import css from './App.module.css'
import BurgerButton from './components/BurgerButton/BurgerButton';
import Navbar from './components/Navbar/Navbar';
import { Modal } from './components/Modal/Modal';
import Accordion from './components/Accordion/Accordion';

const App:React.FC<{}> = () => {

  const [open,setOpen] = React.useState<boolean>(false);
  const onScrollEventHandler = React.useCallback((top: number, left: number, scrollerRef: HTMLDivElement) => {
    scrollerRef.scrollTo({top,left});
  }, []);

  return (<Fragment>
    <Navbar/>
    <Splitter dProps={{size:1, className: css.divider}} flexDirection="row" ratio={50} min1="30%" min2="10%" className={css.splitter}>

      <Scroller onScroll={onScrollEventHandler}>
        <div id="content" style={{width:'30000px', height: '30000px', backgroundColor:'#E1F2FB',  border:'2px solid blue', padding:'20px'}}>
          <BurgerButton rotation={0} className={css.burgerButton} toggle={open} onToggle={(toggle)=>setOpen(toggle)}/>
        </div>
      </Scroller>

      <Splitter dProps={{size:0}} flexDirection="column" ratio={10} min1="20%" min2="10%">
        <div style={{backgroundColor:'#F1F9F9', width:'100%', height:'100%'}}>Left Top content</div>
        <div style={{backgroundColor:'#EEEEFF', width:'100%', height:'100%'}}>
          <br></br>
          <br></br>
          <Accordion singleOpen>
            <Accordion.Item title="Section1" ref={(ref)=>{console.log(ref)}}>
              <div>Contenuto 1</div>
            </Accordion.Item>
            <Accordion.Item title="Section2">
              <Accordion singleOpen>
                <Accordion.Item title="Section1" ref={(ref)=>{console.log(ref)}}>
                  <div>Contenuto 1</div>
                </Accordion.Item>
                <Accordion.Item title="Section2">
                  <div>Contenuto 1</div>
                </Accordion.Item>
                <Accordion.Item title="Section3">
                  <div>Contenuto 1</div>
                </Accordion.Item>
                <Accordion.Item title="Section4">
                  <div>Contenuto 1</div>
                </Accordion.Item>
              </Accordion>
            </Accordion.Item>
            <Accordion.Item title="Section3">
              <div>Contenuto 1</div>
            </Accordion.Item>
             <Accordion.Item title="Section4">
              <div>Contenuto 1</div>
            </Accordion.Item>
            
          </Accordion>

          <Accordion.Item title="Section5">
            <div>Contenuto 1</div>
          </Accordion.Item>
        </div>
      </Splitter>

    </Splitter>

    <Modal 
      open={open} 
      // className={{
      //   init: `${css.modal}`,
      //   open: `${css.modalOpen}`,
      //   close:`${css.modalClose}`,
      // }}
      closeDelay={300} 
      portalTo={document.body} 
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
  )
}

export default App;
