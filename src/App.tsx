import React, { Fragment } from 'react';
import Scroller from './components/layout/Scroller/Scroller';
import Splitter from './components/layout/Splitter/Splitter';
import css from './App.module.css'
import BurgerButton from './components/ui/BurgerButton/BurgerButton';
import Navbar from './components/layout/Navbar/Navbar';
import { Modal } from './components/overlays/Modal/Modal';
import AccordionTree from './components/layout/AccordionTree/AccordionTree';

const App:React.FC<{}> = () => {

  const [open,setOpen] = React.useState<boolean>(false);
  const [openedItems,setOpenedItems] = React.useState<Array<HTMLDivElement>>([])
  const onScrollEventHandler = React.useCallback((top: number, left: number, scrollerRef: HTMLDivElement) => {
    scrollerRef.scrollTo({top,left});
  }, []);

  const onToggleAccordionItem = (isOpen:boolean,ref:HTMLDivElement)=>{
    // setOpenedItems(p=>{
    //   return !isOpen ? [...p, ref] : p.filter(e=>e!==ref)
    // })
    setOpenedItems(p=>{
      return !isOpen ? [ref] : []
    })
  }

  const openOnMount = (ref:HTMLDivElement) => {
    onToggleAccordionItem(false,ref);
  }

  const closeOnUnmount =(ref:HTMLDivElement) => {
    onToggleAccordionItem(true,ref);
  }

  React.useEffect(()=>{
    console.log(openedItems)
  },[openedItems])
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
        <div style={{backgroundColor:'#EEEEFF', width:'100%', height:'100%',overflow:'auto'}}>
          <br></br>
          <br></br>
          <AccordionTree singleOpen={false}>
            <AccordionTree.Item title="Section1" headerProps={{className: {init: css.accordionHeader, open: css.accordionHeaderOpen}}} headerContentProps={{renderHeaderContent:(open)=> <p>Section 1</p>}}>
              <div>Contenuto 1</div>
            </AccordionTree.Item>

            <AccordionTree.Item title="Section2" unmountOnClose={true} headerProps={{className: {init: css.accordionHeader, open: css.accordionHeaderOpen}}} headerContentProps={{renderHeaderContent: (open)=><p>{'Section 2'+(open?' aperto':'')}</p> }} innerContentProps={{className:{init: css.innerContent, open: css.innerContentOpen}}}>
                <AccordionTree openedItems={openedItems} >

                  <AccordionTree.Item title="Section2.1" unmountOnClose={false} onItemCreate={openOnMount} onItemDestroy={closeOnUnmount} onToggleItem={onToggleAccordionItem} headerContentProps={{iconProps: {position:"start",direction:'right-bottom', type:'chevron'}}}>
                      <AccordionTree singleOpen={false}>

                        <AccordionTree.Item title="Section2.1.1">
                          <div>Contenuto 2.1.1</div>
                        </AccordionTree.Item>
                          <AccordionTree.Item title="Section2.1.2">
                            <div>Contenuto 2.1.2</div>
                          </AccordionTree.Item> 

                          <AccordionTree.Item title="Section2.1.3">
                            <AccordionTree singleOpen={true}>

                              <AccordionTree.Item title="Section2.1.3.1">
                                <div>Contenuto 2.1.3.1</div>
                              </AccordionTree.Item>

                              <AccordionTree.Item title="Section2.1.3.2">
                                <div>Contenuto 2.1.3.2</div>
                              </AccordionTree.Item> 

                              <AccordionTree.Item title="Section2.1.3.3">
                                <div>Contenuto 2.1.3.3</div>
                              </AccordionTree.Item> 

                              <AccordionTree.Item title="Section2.1.3.4">
                                <div>Contenuto 2.1.3.4</div>
                              </AccordionTree.Item>

                              <AccordionTree.Item title="Section2.1.3.5">
                                <div>Contenuto 2.1.3.5</div>
                              </AccordionTree.Item>

                              <AccordionTree.Item title="Section2.1.3.6">
                                <div>Contenuto 2.1.3.6</div>
                              </AccordionTree.Item> 

                              <AccordionTree.Item title="Section2.1.3.7">
                                <div>Contenuto 2.1.3.7</div>
                              </AccordionTree.Item> 

                              <AccordionTree.Item title="Section2.1.3.8">
                                <div>Contenuto 2.1.3.8</div>
                              </AccordionTree.Item>
                              
                            </AccordionTree>
                          </AccordionTree.Item> 

                        <AccordionTree.Item title="Section2.1.4">
                          <div>Contenuto 2.1.4</div>
                        </AccordionTree.Item>

                      </AccordionTree>
                  </AccordionTree.Item>

                  <AccordionTree.Item title="Section2.2" onItemCreate={openOnMount} onItemDestroy={closeOnUnmount} onToggleItem={onToggleAccordionItem}>
                    <div>Contenuto 2.2</div>
                  </AccordionTree.Item> 

                  <AccordionTree.Item title="Section2.3" onItemCreate={openOnMount} onItemDestroy={closeOnUnmount} onToggleItem={onToggleAccordionItem}>
                    <div>Contenuto 2.3</div>
                  </AccordionTree.Item> 
                  
                  <AccordionTree.Item title="Section2.4" onItemCreate={openOnMount} onItemDestroy={closeOnUnmount} onToggleItem={onToggleAccordionItem}>
                    <div>Contenuto 2.4</div>
                  </AccordionTree.Item>

                </AccordionTree>
            </AccordionTree.Item>
            
            <AccordionTree.Item title="Section3"  headerProps={{className: {init: css.accordionHeader, open: css.accordionHeaderOpen}}} headerContentProps={{renderHeaderContent:(open)=> <p>Section 3</p>}}>
              <div>Contenuto 3</div>
            </AccordionTree.Item>

             <AccordionTree.Item title="Section4" headerProps={{className: {init: css.accordionHeader, open: css.accordionHeaderOpen}}} headerContentProps={{renderHeaderContent: (open)=><p>Section 4</p>}}>
              <div>Contenuto 4</div>
            </AccordionTree.Item>
            
          </AccordionTree>
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
