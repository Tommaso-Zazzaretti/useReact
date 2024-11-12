import React from 'react';
import Scroller from './components/Scroller/Scroller';
import Splitter from './components/Splitter/Splitter';

const App:React.FC<{}> = () => {

  const onScrollEventHandler = React.useCallback((top: number, left: number, scrollerRef: HTMLDivElement) => {
    scrollerRef.scrollTo({top,left});
  }, []);

  return (
    <Splitter separatorSizePx={3} flexDirection="row" initialRatio={70} min1="20%" min2="10%">
      <Scroller onScroll={onScrollEventHandler}>
        <div id="content" style={{width:'30000px', height: '30000px', backgroundColor:'red',  border:'2px solid blue', padding:'20px'}}/>
      </Scroller>

      <Splitter separatorSizePx={3} flexDirection="column" initialRatio={10} min1="20%" min2="10%">
        <div>Right Top content</div>
        <div>Right Bottom content</div>
      </Splitter>
    </Splitter>
  )
}

export default App;
