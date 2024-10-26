import { FC } from 'react';
import Scroller from './components/Scroller/Scroller';

const App:FC<{}> = () => {
  return <Scroller style={{width: '100vw', height: '100vh'}} onCustomScroll={(scroll)=>{console.log(scroll)}}>
        <div id="ciao" style={{width:'30000px', height: '1000000px', backgroundColor:'red',  border:'2px solid blue', padding:'20px'}}>ciao</div>
    </Scroller>
}

export default App;
