import React from "react";
import { FC } from "react";
import Scroller from "../Scroller";

const Component:FC<object> = () => {

    const onCustomScrollHandler = React.useCallback((top: number, left: number, scrollerRef: HTMLDivElement) => {
      // [1] Logic before scroll
      // ...
      // [2] Trig content scroll
      scrollerRef.scrollTo({top,left});
    }, []);
  
    return <Scroller onScroll={onCustomScrollHandler}>
      <div id="content" style={{width:'30000px', height: '1000000px', backgroundColor:'red',  border:'2px solid blue', padding:'20px'}}/>
    </Scroller>
  }