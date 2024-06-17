import React from "react";

export const SideMenu = ( props: {
    children?: React.ReactNode,
}) => {
    return(
        <div className="side-menu">
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
        <div className="icon option gui round" onClick={props.onClick}>
            <span className={"bi" + (props.icon ? " bi-" + props.icon : "")}>
                {props.children}
            </span>
        </div>
    )
}