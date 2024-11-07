import { FC } from 'react';
import Scroller from './components/Scroller/Scroller';
import React from 'react';

const App:FC<{}> = () => {

  const onScrollEventHandler = React.useCallback((top: number, left: number, scrollerRef: HTMLDivElement) => {
    scrollerRef.scrollTo({top,left});
  }, []);

  return <Scroller onScroll={onScrollEventHandler}>
    <div id="content" style={{width:'30000px', height: '30000px', backgroundColor:'red',  border:'2px solid blue', padding:'20px'}}/>
  </Scroller>
}

export default App;
