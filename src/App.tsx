import React from 'react';
import Scroller from './components/Scroller/Scroller';
import Splitter from './components/Splitter/Splitter';

const App:React.FC<{}> = () => {

  const onScrollEventHandler = React.useCallback((top: number, left: number, scrollerRef: HTMLDivElement) => {
    scrollerRef.scrollTo({top,left});
  }, []);

  return (
    <Splitter separatorSizePx={1} flexDirection="row" initialRatio={70} min1="20%" min2="10%">

      <Scroller onScroll={onScrollEventHandler}>
        <div id="content" style={{width:'30000px', height: '30000px', backgroundColor:'#EEEEFF',  border:'2px solid blue', padding:'20px'}}>
          Right content
        </div>
      </Scroller>

      <Splitter separatorSizePx={1} flexDirection="column" initialRatio={10} min1="20%" min2="10%">
        <div style={{backgroundColor:'#FFEEFF', width:'100%', height:'100%'}}>Left Top content</div>
        <div style={{backgroundColor:'#FFEEEE', width:'100%', height:'100%'}}>Left Bottom content</div>
      </Splitter>
    </Splitter>
  )
}

export default App;
