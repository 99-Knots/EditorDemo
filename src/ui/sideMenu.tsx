import React from "react";

export const SideMenu = ( props: {
    buttonSize: number,
    children?: React.ReactNode,
}) => {
    return(
        <div className="side-menu" style={{fontSize: `${props.buttonSize*0.66}rem`}}>
            {props.children}
        </div>
    )
}

export const MenuOption = (props: {
    icon?: string,
    isSelected?: boolean,
    onClick?: () => void,
    children?: React.ReactNode
}) => {
    return (
        <div className={"icon align outline option gui round" + (props.isSelected? " selected": "")} onClick={props.onClick}>
            <span className={"bi" + (props.icon ? " bi-" + props.icon : "")}>
                {props.children}
            </span>
        </div>
    )
}