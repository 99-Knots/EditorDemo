import React from "react";
import { buttonSizeContext } from "./buttons";


export const Icon = (props:{
    bootstrap?: string,
    angle?: number,
    children?: React.ReactElement<SVGElement>
}) => {
    
    const buttonSize = React.useContext(buttonSizeContext);
    return (
        <span 
            className={"icon align" + (props.bootstrap? ` bi bi-${props.bootstrap}` : "")}
            style={{
                transform: `rotate(${props.angle}deg)`, 
                minWidth: `${buttonSize}rem`,
                minHeight: `${buttonSize}rem`}}
        >
            {props.children}
        </span>
    )
}

export const AxisMover = (props:{angle?: number, dashed?: boolean, color?: string}) => {
    return (
        <Icon angle={props.angle}>
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
                <g className="outline" strokeDasharray={props.dashed? "1, 2": ""} strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.7" stroke="currentColor" fillRule="evenodd" >
                    <path  d="M8,14 v-10"/>
                    <path d="M5,7 l3,-3 m3,3 l-3,-3"/>
                    <path d="M1.5,2 h13"/>
                </g>
                <g strokeDasharray={props.dashed? "1, 2": ""} strokeLinejoin="round" strokeLinecap="round" strokeWidth="1" stroke={props.color??"currentColor"} fillRule="evenodd" >
                    <path  d="M8,14 v-10"/>
                    <path d="M5,7 l3,-3 m3,3 l-3,-3"/>
                    <path d="M1.5,2 h13"/>
                </g>
            </svg>
        </Icon>
    )
}


export const CircleCut = (props:{angle1: number, angle2: number, radius: number}) =>{

    const buttonSize = React.useContext(buttonSizeContext);

    const width = buttonSize/6
    const x1 = Math.sin(Math.PI/180 * props.angle1)*props.radius;
    const y1 = -Math.cos(Math.PI/180 * props.angle1)*props.radius;  // negative because y-axis is top to bottom
    const x2 = Math.sin(Math.PI/180 * props.angle2)*props.radius;
    const y2 = -Math.cos(Math.PI/180 * props.angle2)*props.radius;
    const offset = props.radius + buttonSize/2

    return (
        <svg style={{transform: `translate(-${props.radius+buttonSize/2}rem, -${props.radius+buttonSize/2}rem)`}} xmlns="http://www.w3.org/2000/svg" width={`${2*props.radius+buttonSize}rem`} height={`${2*props.radius+buttonSize}rem`} viewBox={`0 0 ${props.radius*2+buttonSize} ${props.radius*2+buttonSize}`}>
            <g strokeLinecap="round" stroke="currentColor" fill="none">
                <path 
                    strokeWidth={width+0.1} 
                    className="outline" 
                    d={`M${offset} ${offset} m${x1} ${y1} a${props.radius} ${props.radius} 0 0 1 ${x2-x1} ${y2-y1}`}
                />
                <path 
                    strokeWidth={width} 
                    d={`M${offset} ${offset} m${x1} ${y1} a${props.radius} ${props.radius} 0 0 1 ${x2-x1} ${y2-y1}`}
                />
            </g>
        </svg>
    );

}