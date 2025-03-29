import React from "react";
import Splitter from "../Splitter";

const Component:React.FC<object> = () => {

  return (
    <Splitter dProps={{size:1}} flexDirection="row" ratio={70} min1="20%" min2="10%">
        <div>Left content</div>

        <Splitter dProps={{size:1}} flexDirection="column" ratio={10} min1="20%" min2="10%">
            <div>Right Top content</div>
            <div>Right Bottom content</div>
        </Splitter>
    </Splitter>
  )
}