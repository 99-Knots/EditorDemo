import React from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, CanvasHandle } from './components/canvas';
import './style.css'


function App() {
    const canvasHandle = React.useRef<CanvasHandle>();
    React.useEffect(() => {
        canvasHandle.current.loadScene();
    })
    return (
        <Canvas ref={canvasHandle}/>
    )
}

const rootElement = document.getElementById('react-root');
if (!!rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
}