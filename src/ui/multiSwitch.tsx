import React from "react";

export const gizmoGuiContext = React.createContext(15);

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
    isHidden?: boolean,
    isSelected?: boolean,
    children?: String,
}) => {
    
    const buttonSize = React.useContext(gizmoGuiContext);
    return (
        <span 
            className={"label align" + (props.isHidden&&props.isSelected? " small-font" : "")}
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

export const Tooltip = (props: {children: String}) => {
    
    return (<div className="tooltip">{props.children}</div>)
}

interface IButton {
    onClick: (v: any)=>void,
    index?: number,
    selectedIndex?: number,
    selectable?: boolean,
    isInactive?: boolean,
    isHidden?: boolean,
    isSelectedLink?: boolean,
    tooltipText?: String,
    children?: React.ReactNode,
}

export const Button = (props: IButton) => {
    
    const buttonSize = React.useContext(gizmoGuiContext);
    const [isSelected, setIsSelected] = React.useState((props.index==props.selectedIndex) || props.isSelectedLink);

    React.useEffect(() => {
        setIsSelected((props.index===props.selectedIndex) || props.isSelectedLink);
    }, [props.selectedIndex, props.index, props.isSelectedLink])

    return (
        <button 
            className={"gui-button align outline" 
                + ((props.isHidden&&!isSelected)? " width-hidden" : "") 
                + (props.isInactive? " inactive" : "") 
                + (isSelected&&(props.selectable||props.isSelectedLink)? " selected" : "")}
            onClick={props.onClick}
            style={{height: `${buttonSize}rem`, maxWidth: (props.isHidden&&isSelected)? `${buttonSize}rem`: ""}}
        >
            {React.Children.toArray(props.children).map((child: React.ReactElement, index) => {
                return React.cloneElement(
                    child, {
                        key: index, 
                        index: index,
                        isHidden: props.isHidden,
                        isSelected: isSelected,
                    }, 
                    child.props.children
                );
            })}
            { props.tooltipText?
                <Tooltip>{props.tooltipText}</Tooltip> 
                :
                <></>
            }
        </button>
    )
}

export const ButtonContainer = (props: {
    fixedIndex?: number,
    children: React.ReactNode,
}) => {
    
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    
    return (
        <>
        <div 
            className="button-container round outline"
            onMouseEnter={() => {setIsExpanded(true)}} /* use mouseEnter for desktop usage, onClick handles mobile touches*/
            onMouseLeave={() => {setIsExpanded(false)}}
        >
            {React.Children.toArray(props.children).map((child: React.ReactElement, index) => {
                return React.cloneElement(
                    child, {
                        key: index, 
                        index: index,
                        selectedIndex: props.fixedIndex??selectedIndex,
                        isHidden: !isExpanded,
                        onClick: () => {child.props.onClick(0); setSelectedIndex(index); setIsExpanded(!isExpanded)}
                    }, 
                    child.props.children
                );
            })}
        </div>
        {/*<div className="tooltip">Test tooltip</div>*/}
        </>
    )
}

export const RadButton = (props: {angle: number, radius: number, invisible?: boolean, children?: React.ReactNode}) => {

    let x = Math.sin(Math.PI/180 * props.angle)*props.radius;
    let y = Math.cos(Math.PI/180 * props.angle)*props.radius;
    if (props.children)

    return (
        <div 
            className={"gui-element align centered"}
            style={{
                position: "absolute",
                top: `${-y}rem`, 
                left: `${x}rem`,
                display: props.invisible? "none" : "",
            }} 
        >
            <ButtonContainer>
                {React.Children.toArray(props.children).map((child: React.ReactElement, index)=>{
                    return child;
                })}
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
            <g strokeDasharray={props.dashed? "1, 2": ""} strokeLinejoin="round" strokeLinecap="round" strokeWidth="1" stroke={props.color??"currentColor"} fillRule="evenodd" >
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