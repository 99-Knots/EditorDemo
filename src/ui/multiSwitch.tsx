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
}

interface IExRadial extends IRadialButton {
    options: [buttonOption]
}

export const RadialButton = (props: IRadialButton) => {

    const buttonSize = React.useContext(gizmoGuiContext);

    // todo: more dependency on size of icon element

    let x = Math.sin(Math.PI/180 * props.angle)*props.radius;
    let y = Math.cos(Math.PI/180 * props.angle)*props.radius;

    return (
        <div 
            className="gizmo-mode-switch gui centered round" 
            style={{
                top: -y +'vmin', 
                left: x + 'vmin', 
                color: props.color,
            }} 
            onClick={props.onClick}
        >
            <span 
                className={"icon " + (props.icon ? "bi bi-" + props.icon : "")} 
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

const OptionSelection = (props: {visible: boolean}) => {
    const onClick = () => {console.log('testing')};
    return (
        <div className="options">
            <div onClick={onClick} className="test">0.1m</div>
            <div onClick={onClick} className="test">0.5m</div>
            <div onClick={onClick} className="test">1m</div>
            <div onClick={onClick} className="test">Teeeeeeeeest</div>
            <div onClick={onClick} className="test">Testg</div>
        </div>
    )
}

export const ExpandableRadialButton = (props: IExRadial ) => {
    
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [width, setWidth] = React.useState('1.6em');
    const buttonSize = React.useContext(gizmoGuiContext);

    React.useEffect(() => {
        if (isExpanded)
            setWidth('100em');
        else
            setWidth(buttonSize + 'px');
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
                maxHeight: buttonSize,
                color: props.color,
            }} 
            onClick={props.onClick}
            onMouseEnter={() => {setIsExpanded(true)}}
            onMouseLeave={() => {setIsExpanded(false)}}
        >
            <span 
                className={"icon " + (props.icon ? "bi bi-" + props.icon : "") + (isExpanded? ' selected': '')} 
                style={{
                    transform: ' rotate(' + props.rotation + 'deg)',
                    height: buttonSize + 'px',
                    minWidth: buttonSize + 'px',
                    flexShrink: 0,
                    padding: isExpanded? '0.3em' : '',
                    fontSize: props.text&&!isExpanded ? buttonSize/(props.text.length-1) : undefined,
                }}
            >
                {props.text}
                {props.children}
            </span>
            <OptionSelection visible={isExpanded}/>
        </div>
    )
}