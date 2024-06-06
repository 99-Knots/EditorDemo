import React from "react";

export const MovingButton = (props: {x: number, y: number, hidden: boolean}) => {

    return (
        <div className="test" style={{top: props.y, left: props.x, display: props.hidden?"none":"block"}}>Test</div>
    )
}