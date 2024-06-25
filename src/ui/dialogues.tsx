import React from "react";
import { Scene } from "@babylonjs/core/scene";

type dialogProps = {
    spawnPos?: {x: number, y: number},
    children?: React.ReactNode,
}

export type dialogHandle = {
    open: ()=>void,
    close: ()=>void,
}

export const CreateDialog  = (props: {
    dialogHandle: React.RefObject<dialogHandle>,
    scene: Scene, 
    linkedBtnId: string
}) => {
    
    let el = document.getElementById(props.linkedBtnId)?.getBoundingClientRect();
    let x = el?.left + el?.width/2;
    let y = el?.top + el?.height/2;

    return (
        <Dialog ref={props.dialogHandle} spawnPos={{x: x, y: y}}>
            <div className="dialog" onClick={(e)=>{e.stopPropagation()}}>
                add Objects to Scene
                <button className="close-btn round outline" onClick={()=>{props.dialogHandle.current?.close()}}>
                    X
                </button>
            </div>
        </Dialog>
    )
}

const DialogRenderer: React.ForwardRefRenderFunction<dialogHandle, dialogProps> = (props: dialogProps, env) => {
    
    const [isHidden, setIsHidden] = React.useState(true);

    const handle = {
        open() {
            setIsHidden(false);
        },
        close() {
            setIsHidden(true);
        }
    };

    React.useImperativeHandle(env, () => (handle))

    return (
        <div 
            className={"dialog-backdrop"} 
            onClick={()=>{handle.close()}} 
            style={{visibility: isHidden?"hidden":"visible",clipPath: isHidden ? `circle(0 at ${props.spawnPos.x}px ${props.spawnPos.y}px)` : `circle(142vmax at ${props.spawnPos.x}px ${props.spawnPos.y}px)`}}
        >
            {props.children}
        </div>
    )
}

export const Dialog = React.forwardRef(DialogRenderer);