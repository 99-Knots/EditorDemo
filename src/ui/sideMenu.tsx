import React from "react";
import { gizmoGuiContext } from "./multiSwitch";

export const SideMenu = ( props: {
    buttonSize: number,
    children?: React.ReactNode,
}) => {
    return(
        <div className="side-menu" style={{fontSize: `${props.buttonSize*0.66}rem`}}>
            <gizmoGuiContext.Provider value={props.buttonSize}>
                {props.children}
            </gizmoGuiContext.Provider>
        </div>
    )
}

export const MenuOption = (props: {
    id?: string,
    icon?: string,
    isSelected?: boolean,
    isInactive?: boolean,
    onClick?: () => void,
    children?: React.ReactNode
}) => {
    return (
        <div id={props.id} className={"icon align outline option gui round" + (props.isSelected? " selected": "") + (props.isInactive? " inactive" : "")} onClick={props.onClick}>
            <span className={"bi" + (props.icon ? " bi-" + props.icon : "")}>
                {props.children}
            </span>
        </div>
    )
}