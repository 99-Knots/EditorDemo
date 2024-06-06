import React from "react";

export const MovingButton = (props: {
    x: number, 
    y: number, 
    hidden: boolean,
    children?: React.ReactNode
}) => {

    return (
        <div className="gizmo-gui-center centered" style={{top: props.y, left: props.x, display: props.hidden?"none":"block"}}>
            {props.children}
        </div>
    )
}

export const RadialButton = (props: {
    //onClick: (val: any) => void,
}) => {
    return (
        <div className="test centered" style={{top: '2em'}}>Test</div>
    )
}