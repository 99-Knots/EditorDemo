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
            className="gizmo-mode-switch centered round" 
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
            <span className={"icon " + (props.icon ? " bi bi-" + props.icon : "")} style={{transform: ' rotate(' + props.rotation + 'deg)'}}>
                {props.children}
            </span>
            <OptionSelection/>
        </div>
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