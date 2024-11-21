import React from 'react';
import Scroller from './components/Wrappers/Scroller/Scroller';
import Splitter from './components/Wrappers/Splitter/Splitter';
import css from './App.module.css'
import BurgerButton from './components/Buttons/BurgerButton/BurgerButton';

const App:React.FC<{}> = () => {

  const onScrollEventHandler = React.useCallback((top: number, left: number, scrollerRef: HTMLDivElement) => {
    scrollerRef.scrollTo({top,left});
  }, []);


  return (
    <Splitter dProps={{size:1, className: css.divider}} flexDirection="row" ratio={50} min1="30%" min2="10%">

      <Scroller onScroll={onScrollEventHandler}>
        <div id="content" style={{width:'30000px', height: '30000px', backgroundColor:'#E1F2FB',  border:'2px solid blue', padding:'20px'}}>
          <BurgerButton onToggle={(toggle)=>console.log(toggle)} className={css.burgerButton}/>
        </div>
      </Scroller>

      <Splitter dProps={{size:0}} flexDirection="column" ratio={10} min1="20%" min2="10%">
        <div style={{backgroundColor:'#F1F9F9', width:'100%', height:'100%'}}>Left Top content</div>
        <div style={{backgroundColor:'#EEEEFF', width:'100%', height:'100%'}}>Left Bottom content</div>
      </Splitter>

    </Splitter>
  )
}

export default App;
