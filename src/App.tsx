import React from 'react';
import Scroller from './components/Scroller/Scroller';
import Splitter from './components/Splitter/Splitter';
import css from './App.module.css'

const App:React.FC<{}> = () => {

  const onScrollEventHandler = React.useCallback((top: number, left: number, scrollerRef: HTMLDivElement) => {
    scrollerRef.scrollTo({top,left});
  }, []);

  return (
    <Splitter dividerProps={{size:1, className: css.divider}} flexDirection="row" ratio={50} min1="30%" min2="10%">

      <Scroller onScroll={onScrollEventHandler}>
        <div id="content" style={{width:'30000px', height: '30000px', backgroundColor:'#E1F2FB',  border:'2px solid blue', padding:'20px'}}>
          Right content
        </div>
      </Scroller>

      <Splitter dividerProps={{size:0}} flexDirection="column" ratio={10} min1="20%" min2="10%">
        <div style={{backgroundColor:'#F1F9F9', width:'100%', height:'100%'}}>Left Top content</div>
        <div style={{backgroundColor:'#EEEEFF', width:'100%', height:'100%'}}>Left Bottom content</div>
      </Splitter>
    </Splitter>
  )
}

export default App;
