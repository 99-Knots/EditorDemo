import React from "react";
import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'

import { Commands, CreateObjectCommand } from "../utilities/commands";

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
                <button className="create-btn bi bi-circle" onClick={()=>{
                    const mesh = MeshBuilder.CreateSphere('new_sphere', {diameter: 1}, props.scene);
                    Commands().execute(new CreateObjectCommand(mesh));
                    props.dialogHandle.current?.close();
                }}>
                </button>
                <button className="create-btn bi bi-square" onClick={()=>{
                    const mesh = MeshBuilder.CreateBox('new_box', {size: 1}, props.scene);
                    Commands().execute(new CreateObjectCommand(mesh));
                    props.dialogHandle.current?.close();
                }}>
                </button>
                <button className="create-btn" onClick={()=>{
                    const mesh = MeshBuilder.CreateGoldberg('new_ball', {m: 1, n: 1, size: 0.5}, props.scene);
                    Commands().execute(new CreateObjectCommand(mesh));
                    props.dialogHandle.current?.close();
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
                    <path fill="currentColor" d="
                        M10.1,14.6 10.9,12 13.6,12.1 A7 7 0 0 1 10.1,14.6
                        M15,8 12.8,6.5 13.6,3.8 A7 7 0 0 1 15,8 
                        M10.1,1.3 8,3 5.8,1.3 A7 7 0 0 1 10.1,1.3
                        M2.3,3.9 3.2,6.5 1,8 A7 7 0 0 1 2.3,3.9
                        M2.3,12.1 5,12 5.8,14.6 A7 7 0 0 1 2.3,12.1">
                    </path>
                    <path stroke="currentColor" strokeWidth={1} strokeLinecap="square" d="
                        M10.9,12 9.2,9.5
                        M12.8,6.5 10,7.1
                        M8,3 8,5.5
                        M3.2,6.5 6,7.2
                        M5,12 6.8,9.5"></path>
                    <polygon points="8,5.5 10,7.1 9.2,9.5 6.8,9.5 6,7.2" fill="currentColor" stroke="currentColor" strokeWidth={1}/>
                    <circle cx="8" cy="8" r="7.4" stroke="currentColor" fill="none"></circle>
                </svg>
                </button>
                <button className="create-btn bi bi-triangle" onClick={()=>{
                    const mesh = MeshBuilder.CreatePolyhedron('new_tetra', {type: 0, size: 0.33}, props.scene);
                    Commands().execute(new CreateObjectCommand(mesh));
                    props.dialogHandle.current?.close();
                }}></button>
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