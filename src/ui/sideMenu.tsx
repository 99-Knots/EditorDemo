import React from "react";

export const SideMenu = ( props: {
    buttonSize: number,
    children?: React.ReactNode,
}) => {
    return(
        <div className="side-menu" style={{fontSize: `${props.buttonSize*0.66}vmax`}}>
            {props.children}
        </div>
    )
}

export const MenuOption = (props: {
    icon?: string,
    onClick?: () => void,
    children?: React.ReactNode
}) => {
    return (
        <div className="icon align outline option gui round" onClick={props.onClick}>
            <span className={"bi" + (props.icon ? " bi-" + props.icon : "")}>
                {props.children}
            </span>
        </div>
    )
}