import { FC } from 'react';
import Scroller from './components/Scroller/Scroller';
import React from 'react';
import Splitter from './components/Splitter/Splitter';

const App:FC<{}> = () => {

  // const onScrollEventHandler = React.useCallback((top: number, left: number, scrollerRef: HTMLDivElement) => {
  //   scrollerRef.scrollTo({top,left});
  // }, []);

  // return <Scroller onScroll={onScrollEventHandler}>
  //   <div id="content" style={{width:'30000px', height: '30000px', backgroundColor:'red',  border:'2px solid blue', padding:'20px'}}/>
  // </Scroller>

  return <Splitter separatorSizePx={5} initialRatio={70} min1="20%" min2="10%" style={{margin:40, width:600,height:300}}>
    <div>Left content</div>

    <div>Right content</div>
  </Splitter>
}

export default App;
