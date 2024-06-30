import React from "react";
import { CircleCut } from "./icons";

export const buttonSizeContext = React.createContext(15);

export const Label = (props: {
    text?: string,
    rotation?: number,
    isHidden?: boolean,
    isSelected?: boolean,
    children?: String,
}) => {
    
    const buttonSize = React.useContext(buttonSizeContext);
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
    
    const buttonSize = React.useContext(buttonSizeContext);
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

export const RadialButton = (props: {angle: number, radius: number, invisible?: boolean, children?: React.ReactNode}) => {

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

export const SideMenu = ( props: {
    buttonSize: number,
    children?: React.ReactNode,
}) => {
    return(
        <div className="side-menu" style={{fontSize: `${props.buttonSize*0.66}rem`}}>
            <buttonSizeContext.Provider value={props.buttonSize}>
                {props.children}
            </buttonSizeContext.Provider>
        </div>
    )
}

export const Anchor = (props: {
    x: number, 
    y: number, 
    hidden: boolean,
    buttonSize: number;
    children?: React.ReactNode
}) => {

    const radius = React.Children.toArray(props.children).reduce((radius, child: React.ReactElement) => {
        return (child.props?.radius) > radius ? child.props?.radius : radius;
    }, 0)
    const {minAngle, maxAngle} = React.Children.toArray(props.children).reduce((angles, child: React.ReactElement) => {
        if (child.props.radius == radius)
            return {
                minAngle: child.props?.angle < angles.minAngle ? child.props?.angle : angles.minAngle,
                maxAngle: child.props?.angle > angles.maxAngle ? child.props?.angle : angles.maxAngle,
            };
        else
            return angles;
    }, {minAngle: Infinity, maxAngle: -Infinity});
    
    return (
        <div className="gizmo-gui-center" style={{top: props.y??0, left: props.x??0, display: props.hidden?"none":"block", fontSize: `${props.buttonSize}rem`}}>
            <buttonSizeContext.Provider value={props.buttonSize}>
                <CircleCut radius={radius} angle1={minAngle} angle2={maxAngle}/>
                {
                    React.Children.toArray(props.children).map((child: React.ReactElement, index) => {
                        child.props.angle
                        return child;}) 
                }
            </buttonSizeContext.Provider>
        </div>
    )
}

