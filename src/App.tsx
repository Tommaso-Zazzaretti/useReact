import { FC } from 'react';
import Scroller from './components/Scroller/Scroller';

const App:FC<{}> = () => {
  return <Scroller onCustomScroll={(scroll)=>{console.log('SCROLL',scroll)}} onScrollbarsPaddingChange={(t,l)=>console.log('PADDING',t,l)}>
        <div id="ciao" style={{width:'30000px', height: '1000000px', backgroundColor:'red',  border:'2px solid blue', padding:'20px'}}>
          <div style={{width:'400px',height:'200px',backgroundColor:'green',overflow:'auto',marginTop:'200px',marginLeft:'200px'}}>
            <div style={{width:'2900px',height:'2400px',backgroundColor:'yellow'}}/>
          </div>
        </div>
    </Scroller>
}

export default App;
