import React from "react";
import Splitter from "../Splitter";

const Component:React.FC<object> = () => {

  return (
    <Splitter separatorSizePx={3} flexDirection="row" initialRatio={70} min1="20%" min2="10%">
        <div>Left content</div>

        <Splitter separatorSizePx={3} flexDirection="column" initialRatio={10} min1="20%" min2="10%">
            <div>Right Top content</div>
            <div>Right Bottom content</div>
        </Splitter>
    </Splitter>
  )
}