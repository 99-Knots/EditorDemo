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
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/9b1562a6-67aa-49b5-a0e3-f23fc37dcc76">
        <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/89eb5c66-9ec0-4c57-8f77-83d7581df2cd">
        <img alt="bend arrow pointing left" src="https://github.com/user-attachments/assets/89eb5c66-9ec0-4c57-8f77-83d7581df2cd">
      </picture>
       -- <b>undo</b>: reverse the last action
       </br></br>
       
     <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/4ded2041-9dfc-402e-95d4-a6edf060143b">
        <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/3eedd281-3441-495c-9bf2-7a7c2af525b0">
        <img alt="bend arrow pointing right" src="https://github.com/user-attachments/assets/3eedd281-3441-495c-9bf2-7a7c2af525b0">
      </picture>
       -- <b>redo</b>: reverse the last undo action
       </br></br>
       
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/d7b010f2-0877-4109-859c-02efbbc506e8">
        <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/e6d15bbd-4f62-478e-990f-447464450033">
        <img alt="plus symbol" src="https://github.com/user-attachments/assets/e6d15bbd-4f62-478e-990f-447464450033">
      </picture>
       -- <b>add object</b>: select a new shape to add to the scene
       </br></br>
       
     <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/fa48ce72-1ef6-40ce-972a-2cc317a18aaa">
        <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/2e85a8ad-67d3-4cf1-82be-6db8aea7d26e">
        <img alt="dotted square with a plus inside" src="https://github.com/user-attachments/assets/2e85a8ad-67d3-4cf1-82be-6db8aea7d26e">
      </picture>
       -- <b>multi-select</b>: toggle to add object to the selection without deselecting others; alternatively, hold <i>shift</i>
       </br></br>
       
 - **gizmo menu**:

    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/7c5405cb-5389-4cfb-a3be-3dac0f42ed76">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/82e94262-4bea-4fcf-89cb-a226f457325d">
      <img alt="bidirectional arrows forming a cross" src="https://github.com/user-attachments/assets/82e94262-4bea-4fcf-89cb-a226f457325d">
    </picture>
     -- <b>translate mode</b>: move the selected objects within the scene by dragging on the gizmo arrows or planes
     </br></br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/c158b178-830b-4c95-95d9-d3cd29f8e470">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/9091449d-9627-41c9-a174-97116579204b">
      <img alt="two rounded arrows forming a circle" src="https://github.com/user-attachments/assets/9091449d-9627-41c9-a174-97116579204b">
    </picture>
     -- <b>rotate mode</b>: rotate the selected objects around the gizmo center by dragging the rings
     </br></br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/33785e1b-a73b-474b-a4e3-d027d290cb10">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/9731ec19-432f-4677-975f-23d63b89de4b">
      <img alt="square with small circles at the corners" src="https://github.com/user-attachments/assets/9731ec19-432f-4677-975f-23d63b89de4b">
    </picture>
     -- <b>scale mode</b>: scale the selected objects uniformly by dragging one of the corner boxes or non-uniformly with the face boxes
     </br></br>

    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/84142e73-10b4-47a8-b874-916566699306">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/5ef410c5-b50e-4852-9a1d-40ba08b93675">
      <img alt="a 3D box" src="https://github.com/user-attachments/assets/5ef410c5-b50e-4852-9a1d-40ba08b93675">
    </picture>
     -- <b>local space</b>: transformations are based on the first selected mesh's local object space
     </br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/ddfd26d6-8cb7-4081-95e2-eed3e7874631">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/53042c0c-ad60-44f8-902c-145f60221baf">
      <img alt="globe with meridians" src="https://github.com/user-attachments/assets/53042c0c-ad60-44f8-902c-145f60221baf">
    </picture>
     -- <b>global space</b>: transformations are applied in reference to the scenes world system
     </br></br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/35f2ed09-a42b-4de1-a79e-5e8e941bafe0">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/3d2db39e-4a2d-4b71-acc3-3e7076b63590">
      <img alt="copy symbol" src="https://github.com/user-attachments/assets/3d2db39e-4a2d-4b71-acc3-3e7076b63590">
    </picture>
     -- <b>copy</b>: duplicate the selected objects in place
     </br></br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/75ad1acb-1246-4a53-ade4-a0d65b6bfbc2">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/2657798e-c87b-4757-8564-eb3dbf4b3534">
      <img alt="a trash can" src="https://github.com/user-attachments/assets/2657798e-c87b-4757-8564-eb3dbf4b3534">
    </picture>
     -- <b>delete</b>: remove all selected objects from the scene
     </br></br>

    only available in translate mode:
   
   **free | 0.1m | 0.2m ...** -- **snap distance**: all movement happens in increments of the selected value or freely
   </br>

   <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/b6b56857-8f5e-44de-b7fb-7001b223efcc">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/f1e5ddc9-2388-489e-bc21-beed3282067c">
      <img alt="arrow pointing at bar" src="https://github.com/user-attachments/assets/f1e5ddc9-2388-489e-bc21-beed3282067c">
    </picture>
     -- <b>axis snap</b>: move the selection along the gizmo axis of the corresponding color until one of the selected objects hits an obstruction. The dashed version moves along the axis' negative direction. If no obstruction is found after a certain distance (50m by default) no movement takes place.
     </br></br>

    only available in rotate mode:
   
   **free | 15° | 30° ...** -- **snap angle**: all rotations happens in increments of the selected value or freely
   </br></br>

    only available in scale mode:
   
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/d5a53e17-69b5-43d9-ad7c-07f9898e61a7">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/ea0752d6-fbd2-478d-9ef5-3a72efd8d3c7">
      <img alt="rectangle with bar through the center" src="https://github.com/user-attachments/assets/ea0752d6-fbd2-478d-9ef5-3a72efd8d3c7">
    </picture>
     -- <b>centered scaling</b>: scaling is centered on the gizmo position and directed outwards from there
     </br>
     
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/34d1d604-603b-428c-9776-f362b50a3fce">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/0c9a25fa-edb8-4716-abfd-b27b4fe4647d">
      <img alt="rectangle with bar to its left" src="https://github.com/user-attachments/assets/0c9a25fa-edb8-4716-abfd-b27b4fe4647d">
    </picture>
     -- <b>directional scaling</b>: scaling factors are applied only in one direction causing the selection's opposite side to remain in place
     </br></br>

     
### Current Status

Most relevant features have been ported, but this demo should not be considered final in any form. If inspiration strikes the occasional bug might get fixed but as active developement on the main project has since concluded this showcase will remain mostly dormant.
