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
    radius: number,
    angle: number,
    onClick: (val: any) => void,
    children?: React.ReactNode
}) => {
    let x = Math.sin(Math.PI/180 * props.angle)*props.radius;
    let y = Math.cos(Math.PI/180 * props.angle)*props.radius;
    
    return (
        <div className="gizmo-mode-switch centered round" style={{top: -y, left: x}} onClick={props.onClick}>
            {props.children}
        </div>
    )
}