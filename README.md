# EditorDemo

[Try the Demo](https://99-knots.github.io/EditorDemo/)

This is only a showcase of a university project — a small proof of concept for an editor that allows users to create and manage digital exhibitions and plan room layouts. Built in TypeScript with Babylon.js, React.js and Bootstrap Icons.

> [!NOTE]
> This project was initially built as a desktop app, navigation on mobile devices may not be fully optimized.

## Project Description

The editor allows users to position, orient, and scale objects within a 3D space through a gizmo interface.

### Key Features

- **Context-Sensitive GUI**
  - Adapting based on the selected gizmo mode
  - Anchored to the gizmo root's position on the screen
- **Transformation Modes**
  - Switching between moving, rotating, and scaling objects
- **Reference Space Options**
  - Changing reference space for transformations between world or local object space
- **Snap Distances/Angles**
  - Limit movements and rotations to predefined step size
- **Scaling Options**
  - Scaling an object around its center or in a given direction
- **Copy/Delete Objects**
  - Duplicate or remove selected objects
- **Axis Indicators**
  - Tracking the translation gizmo’s axis directions on the screen
  - Position objects on surfaces. Since Babylon.js does not support precise mesh collision, raycasting is used as a heuristic approach. This therefore can (very occasionally) result in small overlaps
- **Undo/Redo Functionality**
  - Change the flow of actions through a command stack
- **Multi-Select**
  - Manipulate multiple objects simultaneously
- **Spawning new Objects**
  - Place new meshes in the scene based on the camera position and orientation

### Controls
 - **side menu**:

     <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/9349e802-81df-4c9a-8b69-0c8b33962469">
        <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/56e4d6a9-a7a4-44e3-b7d1-9b279dbb52fb">
        <img alt="bend arrow pointing left" src="https://github.com/99-Knots/EditorDemo/assets/155378311/56e4d6a9-a7a4-44e3-b7d1-9b279dbb52fb">
      </picture>
       -- <b>undo</b>: reverse the last action
       </br></br>
       
     <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/29fe1948-d686-489c-b7f5-c1854e3715d6">
        <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/a157cd22-f324-4651-8eae-ec15a314514f">
        <img alt="bend arrow pointing right" src="https://github.com/99-Knots/EditorDemo/assets/155378311/a157cd22-f324-4651-8eae-ec15a314514f">
      </picture>
       -- <b>redo</b>: reverse the last undo action
       </br></br>
       
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/7076803f-5639-4eff-a061-64bc8a73676f">
        <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/f661fece-457d-4d3f-a32d-fe916d14b0dd">
        <img alt="plus symbol" src="https://github.com/99-Knots/EditorDemo/assets/155378311/f661fece-457d-4d3f-a32d-fe916d14b0dd">
      </picture>
       -- <b>add object</b>: select a new shape to add to the scene
       </br></br>
       
     <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/594cd218-ced3-4ba2-8eca-ae58c585eb23">
        <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/152903ce-112f-4850-9dc6-38d482e30c4e">
        <img alt="dotted square with a plus inside" src="https://github.com/99-Knots/EditorDemo/assets/155378311/152903ce-112f-4850-9dc6-38d482e30c4e">
      </picture>
       -- <b>multi-select</b>: toggle to add object to the selection without deselecting others; alternatively, hold <i>shift</i>
       </br></br>
       
 - **gizmo menu**:

    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/2d8a1387-904c-4914-ae52-0f3107581ee1">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/4cb8c0e8-b077-4fad-9722-998caa9c1b8b">
      <img alt="bidirectional arrows forming a cross" src="https://github.com/99-Knots/EditorDemo/assets/155378311/4cb8c0e8-b077-4fad-9722-998caa9c1b8b">
    </picture>
     -- <b>translate mode</b>: move the selected objects within the scene by dragging on the gizmo arrows or planes
     </br></br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/add548b3-fe3a-4ec1-ad54-94d91bdf008e">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/89258f81-9de4-487b-b321-2fb72f8aea0c">
      <img alt="two rounded arrows forming a circle" src="https://github.com/99-Knots/EditorDemo/assets/155378311/89258f81-9de4-487b-b321-2fb72f8aea0c">
    </picture>
     -- <b>rotate mode</b>: rotate the selected objects around the gizmo center by dragging the rings
     </br></br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/c95874e8-3c63-40c8-9a38-bb4b02cebb58">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/049c5cd6-ab69-4358-9761-1d148adbc6bc">
      <img alt="square with small circles at the corners" src="https://github.com/99-Knots/EditorDemo/assets/155378311/049c5cd6-ab69-4358-9761-1d148adbc6bc">
    </picture>
     -- <b>scale mode</b>: scale the selected objects uniformly by dragging one of the corner boxes or non-uniformly with the face boxes
     </br></br>

    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/f4ea83c3-1337-437c-8daa-c2cfb3caf66c">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/102df374-9651-43a0-ad39-d80ef71ff952">
      <img alt="a 3D box" src="https://github.com/99-Knots/EditorDemo/assets/155378311/102df374-9651-43a0-ad39-d80ef71ff952">
    </picture>
     -- <b>local space</b>: transformations are based on the first selected mesh's local object space
     </br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/1232cd95-f837-4408-9e5b-69a524938931">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/8f246ae8-169d-4e33-bc27-5a8980a05ccf">
      <img alt="globe with meridians" src="https://github.com/99-Knots/EditorDemo/assets/155378311/8f246ae8-169d-4e33-bc27-5a8980a05ccf">
    </picture>
     -- <b>global space</b>: transformations are applied in reference to the scenes world system
     </br></br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/f7e3fc2d-7b9a-4fc7-a166-ddc6a603d8bb">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/147c6286-e20b-4acb-be95-4091111004f2">
      <img alt="copy symbol" src="https://github.com/99-Knots/EditorDemo/assets/155378311/147c6286-e20b-4acb-be95-4091111004f2">
    </picture>
     -- <b>copy</b>: duplicate the selected objects in place
     </br></br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/ac49e1d1-6b51-4293-82af-44fa2b9682f3">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/dbc6aa11-3482-4755-96ea-2f0c70d1fdef">
      <img alt="trash can" src="https://github.com/99-Knots/EditorDemo/assets/155378311/dbc6aa11-3482-4755-96ea-2f0c70d1fdef">
    </picture>
     -- <b>delete</b>: remove all selected objects from the scene
     </br></br>

    only available in translate mode:
   
   **free | 0.1m | 0.2m ...** -- **snap distance**: all movement happens in increments of the selected value or freely
   </br>

   <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/f490b3c9-9817-4d74-8927-78f1b3f5100f">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/508ff4b3-19cd-4d72-9dc2-043e53d93b2d">
      <img alt="arrow pointing at bar" src="https://github.com/99-Knots/EditorDemo/assets/155378311/508ff4b3-19cd-4d72-9dc2-043e53d93b2d">
    </picture>
     -- <b>axis snap</b>: move the selection along the gizmo axis of the corresponding color until one of the selected objects hits an obstruction. The dashed version moves along the axis' negative direction. If no obstruction is found after a certain distance (50m by default) no movement takes place.
     </br></br>

    only available in rotate mode:
   
   **free | 15° | 30° ...** -- **snap angle**: all rotations happens in increments of the selected value or freely
   </br></br>

    only available in scale mode:
   
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/e7de852e-7d53-471a-8c85-8159f1cb9e19">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/1f665f58-16b2-4bd3-b387-c535aa71e6b8">
      <img alt="rectangle with bar through the center" src="https://github.com/99-Knots/EditorDemo/assets/155378311/1f665f58-16b2-4bd3-b387-c535aa71e6b8">
    </picture>
     -- <b>centered scaling</b>: scaling is centered on the gizmo position and directed outwards from there
     </br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/cb182309-a6d9-4255-8fca-c22f17423fbe">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/99-Knots/EditorDemo/assets/155378311/414fa69a-a6c3-4d49-a630-dcf21bad2db7">
      <img alt="rectangle with bar to its left" src="https://github.com/99-Knots/EditorDemo/assets/155378311/414fa69a-a6c3-4d49-a630-dcf21bad2db7">
    </picture>
     -- <b>directional scaling</b>: scaling factors are applied only in one direction causing the selection's opposite side to remain in place
     </br></br>

     
### Current Status

Most relevant features have been ported, but this demo should not be considered final in any form. If inspiration strikes the occasional bug might get fixed but as active developement on the main project has since concluded this showcase will remain mostly dormant.
