import { FC } from 'react';
import Scroller from './components/Scroller/Scroller';

const App:FC<{}> = () => {
  return <Scroller style={{width: '100%', height: '100%'}} onCustomScroll={(scroll)=>{console.log(scroll)}}>
        <div id="ciao" style={{width:'3000px', height: '3000px', backgroundColor:'red',  border:'2px solid blue', padding:'20px'}}>ciao</div>
    </Scroller>
}

export default App;
