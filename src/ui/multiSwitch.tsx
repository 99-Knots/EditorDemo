import React from "react";

const gizmoGuiContext = React.createContext(15);

export const MovingButton = (props: {
    x: number, 
    y: number, 
    hidden: boolean,
    buttonSize?: number;
    children?: React.ReactElement<IRadialButton>[]
}) => {

    return (
        <div className="gizmo-gui-center" style={{top: props.y??0, left: props.x??0, display: props.hidden?"none":"block", fontSize: (props.buttonSize + 'px')?? undefined}}>
            <gizmoGuiContext.Provider value={props.buttonSize}>
            {
                props.children.map((child, index) => {
                    return child;}) 
            }
            </gizmoGuiContext.Provider>
        </div>
    )
}

type buttonOption = {
    text: string,
    value: any,
}

interface IRadialButton {
    radius: number,
    angle: number,
    onClick: (val: any) => void,
    icon?: string,
    text?: string,
    children?: React.ReactNode,
    rotation?: number,
    color?: string,
    inactive?: boolean
}

interface IExRadial extends IRadialButton {
    options: buttonOption[]
}

export const RadialButton = (props: IRadialButton) => {

    const buttonSize = React.useContext(gizmoGuiContext);

    // todo: more dependency on size of icon element

    let x = Math.sin(Math.PI/180 * props.angle)*props.radius;
    let y = Math.cos(Math.PI/180 * props.angle)*props.radius;

    return (
        <div 
            className={"gizmo-mode-switch gui centered round " + (props.inactive? "hidden" : "")}
            style={{
                top: -y +'vmin', 
                left: x + 'vmin', 
                color: props.color,
            }} 
            onClick={props.onClick}
        >
            <span 
                className={"icon align " + (props.icon ? "bi bi-" + props.icon : "")} 
                style={{
                    transform: ' rotate(' + props.rotation + 'deg)',
                    height: buttonSize + 'px',
                    minWidth: buttonSize + 'px',
                    flexShrink: 0,
                    fontSize: props.text? buttonSize/(props.text.length-1) : undefined,
                }}
            >
                {props.text}
                {props.children}
            </span>
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

const Option = (props: {
    onClick: (v: any)=>void, 
    text: string,
    visible: boolean,
    selectedIndex: number,
    index: number
}) => {
    const [isSelected, setIsSelected] = React.useState(false);
    const size = React.useContext(gizmoGuiContext);

    React.useEffect(() => {
        setIsSelected(props.selectedIndex===props.index);
    }, [props.selectedIndex, props.index])

    return (
        <div className="test2 align" onClick={props.onClick} style={{maxWidth: props.visible? size*5 : (isSelected)? size : 0, minWidth: isSelected? size : 0, fontSize: isSelected&&!props.visible? size*0.45 : undefined}}>
            <div className="test">{props.text}</div>
        </div>
    )
}

export const ExpandableRadialButton = (props: IExRadial ) => {
    
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const buttonSize = React.useContext(gizmoGuiContext);

    // todo: more dependency on size of icon element

    let x = Math.sin(Math.PI/180 * props.angle)*props.radius;
    let y = Math.cos(Math.PI/180 * props.angle)*props.radius;

    return (
        <div 
            className={"gizmo-mode-switch gui centered round " + (props.inactive? "hidden" : "")}
            style={{
                top: -y +'vmin', 
                left: x + 'vmin',
                height: buttonSize,
                color: props.color,
            }} 
            onMouseEnter={() => {setIsExpanded(true)}}
            onMouseLeave={() => {setIsExpanded(false)}}
        >
            
            <div className="options">
                {props.options.map((option, index) => {
                    return <Option onClick={() => {props.onClick(option.value); setSelectedIndex(index)}} key={index} index={index} visible={isExpanded} selectedIndex={selectedIndex} text={option.text}></Option>
                })}
            </div>
        </div>
    )
}