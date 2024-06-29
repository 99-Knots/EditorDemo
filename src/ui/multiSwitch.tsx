import React from "react";

const gizmoGuiContext = React.createContext(15);

export const MovingButton = (props: {
    x: number, 
    y: number, 
    hidden: boolean,
    buttonSize: number;
    children?: React.ReactElement<IRadialButton>[]
}) => {

    const radius = props.children.reduce((radius, child) => {
        return (child.props.radius) > radius ? child.props.radius : radius;
    }, 0)
    const {minAngle, maxAngle} = props.children.reduce((angles, child) => {
        if (child.props.radius == radius)
            return {
                minAngle: child.props.angle < angles.minAngle ? child.props.angle : angles.minAngle,
                maxAngle: child.props.angle > angles.maxAngle ? child.props.angle : angles.maxAngle,
            };
        else
            return angles;
    }, {minAngle: Infinity, maxAngle: -Infinity});
    
    return (
        <div className="gizmo-gui-center" style={{top: props.y??0, left: props.x??0, display: props.hidden?"none":"block", fontSize: `${props.buttonSize}rem`}}>
            <gizmoGuiContext.Provider value={props.buttonSize}>
                <CircleCut radius={radius} angle1={minAngle} angle2={maxAngle}/>
                {
                    props.children.map((child, index) => {
                        child.props.angle
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
    inactive?: boolean,
    isSelected?: boolean,
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
            className={"gizmo-mode-switch gui align outline centered round " + (props.inactive? "hidden" : "")}
            style={{
                top: -y +'rem', 
                left: x + 'rem', 
                color: props.color,
            }} 
            onClick={props.onClick}
        >
            <span 
                className={"icon align " + (props.icon ? "bi bi-" + props.icon : "")  + (props.isSelected? " selected" : "")} 
                style={{
                    transform: 'rotate(' + props.rotation + 'deg)',
                    height: buttonSize + 'rem',
                    minWidth: buttonSize + 'rem',
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


export const Label = (props: {
    text?: string,
    rotation?: number,
    children?: React.ReactNode,
}) => {
    
    const buttonSize = React.useContext(gizmoGuiContext);
    return (
        <span 
            className={"label align"}
            style={{ transform: 'rotate(' + props.rotation + 'deg)' ,
                minWidth: `${buttonSize}rem`,
                minHeight: `${buttonSize}rem`}}
        >
            {props.children}
        </span>
    )
}

export const Icon = (props:{
    bootstrap?: string,
    angle?: number,
    children?: React.ReactElement<SVGElement>
}) => {
    
    const buttonSize = React.useContext(gizmoGuiContext);
    return (
        <span 
            className={"icon align" + (props.bootstrap? ` bi bi- ${props.bootstrap}` : "")}
            style={{
                transform: `rotate(${props.angle}deg)`, 
                minWidth: `${buttonSize}rem`,
                minHeight: `${buttonSize}rem`}}
        >
            {props.children}
        </span>
    )
}

interface IButton {
    onClick: (v: any)=>void,
    index?: number,
    selectedIndex?: number,
    isInactive?: boolean,
    isHidden?: boolean,
    children?: React.ReactNode,
}

export const Button = (props: IButton) => {
    
    const buttonSize = React.useContext(gizmoGuiContext);
    const [isSelected, setIsSelected] = React.useState(props.index==props.selectedIndex);

    React.useEffect(() => {
        setIsSelected(props.index===props.selectedIndex);
    }, [props.selectedIndex, props.index])

    return (
        <>
            <button 
                className={"gui-button align outline" 
                    + ((props.isHidden&&!isSelected)? " width-hidden" : "") 
                    + (props.isInactive? " inactive" : "") 
                    + (isSelected? " selected" : "")}
                onClick={props.onClick}
                style={{height: `${buttonSize}rem`, maxWidth: (props.isHidden&&isSelected)? `${buttonSize}rem`: ""}}
            >
                {props.children}
            </button>
            <div className="tooltip" style={{left: `${buttonSize*0.2}rem`}}>Test tooltip</div>
        </>
    )
}

export const ButtonContainer = (props: {
    children: React.ReactElement<IButton>[],
}) => {
    
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    
    return (
        <>
        <div 
            className="button-container round outline"
            onPointerEnter={() => {setIsExpanded(true)}}
            onPointerLeave={() => {setIsExpanded(false)}}
        >
            {props.children.map((child, index) => {
                return React.cloneElement(
                    child, {
                        key: index, 
                        index: index,
                        selectedIndex: selectedIndex,
                        isHidden: !isExpanded,
                        onClick: () => {child.props.onClick(0); setSelectedIndex(index); setIsExpanded(false)}
                    }, 
                    child.props.children
                );
            })}
        </div>
        <div className="tooltip">Test tooltip</div>
        </>
    )
}

export const RadButton = (props: {angle: number, radius: number, children?: React.ReactNode}) => {

    let x = Math.sin(Math.PI/180 * props.angle)*props.radius;
    let y = Math.cos(Math.PI/180 * props.angle)*props.radius;

    return (
        <div 
            className={"gui-element align centered"}
            style={{
                position: "absolute",
                top: `${-y}rem`, 
                left: `${x}rem`,
            }} 
        >
            <ButtonContainer>
                <Button onClick={()=>{}}><Label>AAAbbb</Label></Button>
                <Button onClick={()=>{console.log('clack')}}><Icon><AxisMover/></Icon></Button>
                <Button onClick={()=>{}}><Icon><AxisMover/></Icon></Button>
            </ButtonContainer>
        </div>
    )
}

export const AxisMover = (props:{dashed?: boolean, color?: string}) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
            <g className="outline" strokeDasharray={props.dashed? "1, 2": ""} strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.7" stroke="currentColor" fillRule="evenodd" >
                <path  d="M8,14 v-10"/>
                <path d="M5,7 l3,-3 m3,3 l-3,-3"/>
                <path d="M1.5,2 h13"/>
            </g>
            <g strokeDasharray={props.dashed? "1, 2": ""} strokeLinejoin="round" strokeLinecap="round" strokeWidth="1" stroke={props.color} fillRule="evenodd" >
                <path  d="M8,14 v-10"/>
                <path d="M5,7 l3,-3 m3,3 l-3,-3"/>
                <path d="M1.5,2 h13"/>
            </g>
        </svg>
    )
}

const CircleCut = (props:{angle1: number, angle2: number, radius: number}) =>{

    const buttonSize = React.useContext(gizmoGuiContext);
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
        <div className={"setting-container align outline " + (isSelected? "selected" : "") + (!(isSelected||props.visible)? " width-hidden" : "")} onClick={props.onClick} style={{maxWidth: (props.visible? size*5: (isSelected)? size : 0)  + "rem" , minWidth: isSelected? size  + "rem"  : 0, fontSize: isSelected&&!props.visible? `${size*0.45}rem` : `${size*0.60}rem`}}>
            <div className="setting">{props.text}</div>
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
            className={"gizmo-mode-switch gui align outline centered round " + (props.inactive? "hidden" : "")}
            style={{
                top: -y +'rem', 
                left: x + 'rem',
                height: buttonSize  + "rem" ,
                color: props.color,
            }} 
            onMouseEnter={() => {setIsExpanded(true)}}
            onMouseLeave={() => {setIsExpanded(false)}}
        >
            
            <div className="settings-array">
                {props.options.map((option, index) => {
                    return <Option onClick={() => {props.onClick(option.value); setSelectedIndex(index); setIsExpanded(!isExpanded)}} key={index} index={index} visible={isExpanded} selectedIndex={selectedIndex} text={option.text}></Option>
                })}
            </div>
        </div>
    )
}