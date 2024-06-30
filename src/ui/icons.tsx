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
                minHeight: `${buttonSize}rem`,
            }}
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

export const SoccerBall = (props:{angle?: number}) => {

    return (
        <Icon angle={props.angle}>
            <svg xmlns="http://www.w3.org/2000/svg" width="1.1em" height="1.1em" fill="currentColor" viewBox="0 0 16 16">
                <path fill="currentColor" d="
                    M10.1,14.6 10.9,12 13.6,12.1 A7 7 0 0 1 10.1,14.6
                    M15,8 12.8,6.5 13.6,3.8 A7 7 0 0 1 15,8 
                    M10.1,1.3 8,3 5.8,1.3 A7 7 0 0 1 10.1,1.3
                    M2.3,3.9 3.2,6.5 1,8 A7 7 0 0 1 2.3,3.9
                    M2.3,12.1 5,12 5.8,14.6 A7 7 0 0 1 2.3,12.1">
                </path>
                <path stroke="currentColor" strokeWidth={1} strokeLinecap="square" d="
                    M10.9,12 9.2,9.5
                    M12.8,6.5 10,7.1
                    M8,3 8,5.5
                    M3.2,6.5 6,7.2
                    M5,12 6.8,9.5"></path>
                <polygon points="8,5.5 10,7.1 9.2,9.5 6.8,9.5 6,7.2" fill="currentColor" stroke="currentColor" strokeWidth={1}/>
                <circle cx="8" cy="8" r="7.4" stroke="currentColor" fill="none"></circle>
            </svg>
        </Icon>
    )
}


export const CircleCut = (props:{angle1: number, angle2: number, radius: number}) => {

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