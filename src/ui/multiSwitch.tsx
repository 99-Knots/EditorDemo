import React from "react";

export const MovingButton = (props: {
    x: number, 
    y: number, 
    hidden: boolean,
    children?: React.ReactNode
}) => {

    return (
        <div className="gizmo-gui-center centered" style={{top: props.y??0, left: props.x??0, display: props.hidden?"none":"block"}}>
            {props.children}
        </div>
    )
}

export const RadialButton = (props: {
    radius: number,
    angle: number,
    onClick: (val: any) => void,
    isExpandable?: boolean;
    icon?: string,
    children?: React.ReactNode,
    rotation?: number,
    color?: string,
}) => {

    const [isExpanded, setIsExpanded] = React.useState(false);
    const [width, setWidth] = React.useState('1.6em');

    React.useEffect(() => {
        if (isExpanded)
            setWidth('100em');
        else
            setWidth('1.6em');
    }, [isExpanded])

    // todo: more dependency on size of icon element

    let x = Math.sin(Math.PI/180 * props.angle)*props.radius;
    let y = Math.cos(Math.PI/180 * props.angle)*props.radius;
    
    return (
        <div 
            className="gizmo-mode-switch gui centered round" 
            style={{
                top: -y +'vmin', 
                left: x + 'vmin', 
                maxWidth: width,
                color: props.color,
            }} 
            onClick={props.onClick}
            onMouseEnter={() => {setIsExpanded(true && props.isExpandable)}}
            onMouseLeave={() => {setIsExpanded(false)}}
        >
            <span className={"icon bi" + (props.icon ? " bi-" + props.icon : "")} style={{alignSelf: 'center', transform: ' rotate(' + props.rotation + 'deg)'}}>
                {props.children}
            </span>
            {props.isExpandable? <OptionSelection/> : <></>}
        </div>
    )
}

export const AxisMover = (props:{dashed?: boolean}) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
            <g strokeDasharray={props.dashed? "1, 2": ""} strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.3" stroke="currentColor" fillRule="evenodd" >
                <path  d="M8,15 v-11"/>
                <path d="M5,7 l3,-3 m3,3 l-3,-3"/>
                <path d="M1,2 h14"/>
            </g>
        </svg>
    )

}

const OptionSelection = () => {
    return (
        <div className="options">
            <div className="test">Teeeeeeeeest</div>
            <div className="test">Testg</div>
        </div>
    )
}