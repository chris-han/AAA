# Developer Specification for 3D Cake-Making Game

## Overview
This document outlines the technical requirements, implementation details, and user interaction design for the 3D cake-making game using JavaScript and WebGL or Three.js.

## Core Features
- First-person perspective with mouse control.
- Scene centered on a table with a rotating turntable.
- Multiple game modes: Cake Base Mode, Cream Mode, Knife Mode, and Appreciation Mode.
- Save/load system with JSON files on disk, supporting multiple save slots and export/import.
- User guidance system with on-spot tips if the player stays too long in one mode or area.
- Simple 3D game with a slightly cartoonish style.
- Edge outlining (toon shading) applied to objects for visual clarity.

## General Principles
- There shall only be one instance of each type of object except cream.
- Objects should follow the physical laws, meaning different objects should be in the correct order of position and cannot enter into each other's collision box.

## Object Picking Up
- Left mouse button means select / pick up.
- Right mouse button means drop / deselect.

## Initial Interface - Save Slots Menu
- Display multiple save slots representing different "cake worlds" (completed cakes).
- Each save slot shows:
  - Save name or identifier.
  - Status indicator (new/unopened or last saved state).
- User can select a save slot to enter the corresponding world.
- If the save slot is new (never entered), the world loads in its initial state.
- If previously opened, the world loads the last saved state.
- World state persists between sessions via save slots.

## Player Controls and Modes

### Object Selecting
- Press keys to switch objects:
  - `1` - Cake Base Object
  - `2` - Cream Object
  - `3` - Knife Object
  ### Object Selecting
  - Press keys to switch objects:
    - `1` - Cake Base Object
    - `2` - Cream Object
    - `3` - Knife Object
  
  ### Cake Base Mode (Key 1)
- Mouse cursor shows cake base model following mouse position.
- Move cake base with mouse; right-click to drop.
- Right-click and hold on a placed cake base allows dragging to reposition; release to drop.
- Left mouse button click on cake base to select and move it.
- Cake base size and color can be adjusted before dropping.
- Multiple cake bases can be placed; when cut, each piece becomes an independent cake base.

### Cream Mode (Key 2)
- Mouse cursor shows cream with visible thickness and color.
- Cream thickness and color adjustable before applying.
- Left mouse button press starts extruding cream at cursor position.
- Cream extrusion continues while holding left mouse button; extrusion point follows mouse.
- If cream collision overlaps with other objects, outline the overlapping edges.
- Right-click on cream area removes cream in that region; removal size adjustable before action.

### Knife Mode (Key 3)
- Mouse cursor shows knife model following mouse position.
- 'A' and 'D' keys rotate knife left/right.
- Press '4' key to rotate the knife blade 90 degrees, making the blade parallel to the cake surface; this mode is used only for smoothing cream.
- Left mouse button press and hold starts cutting or smoothing.
- Knife affects both cake bases and cream.
- Knife cannot affect the turntable or table.

## Scene and Object State Management
- Track cake pieces as independent objects with position, size, and state.
- Track cream blobs with position, size, color, and extrusion data.
- Track turntable rotation and speed.
- Track current player mode and UI state.

## Core Gameplay Scene Layout
- Scene centered on a table with a turntable placed on top.
- The turntable and table are fixed objects; they cannot be affected by player tools.
- Player’s view is centered on the turntable.
- GUI elements:
  - Top-left corner: Trash bin icon for deleting cake bases.
  - Mode indicators and tool settings displayed near the cursor or screen edges.

## Turntable Controls
- 'W' key: Rotate turntable clockwise.
- 'S' key: Rotate turntable counterclockwise.
- Rotation speed depends on key press duration.
- Objects on the turntable rotate synchronously.
- Rotation speed is moderate to maintain control.

## Trash Bin Functionality
- Located at the top-left corner of the screen.
- Cake bases can be dragged into the trash bin to delete them.
- Deletion removes the cake base from the scene.

## Physics and Gravity
- Cake bases or cream that are dropped or extruded and not in contact with any collision object will fall due to gravity.
- Gravity applies during suspension until contact is made.

## Save/Load System
- Save full game state as JSON files on disk.
- Support multiple save slots with export/import functionality.
- Autosave on key events and manual save.
- Load restores full previous state including UI and player mode.

## UI and Mode Transitions
- Display mode indicators and cursor changes.
- Show on-spot guiding tips if player stays too long in one mode or area.
- Smooth transitions between modes and scenes.
- Settings accessible via GUI controls near the cursor or screen edges.

## Settings and Customization
- Before dropping or extruding:
  - Players can adjust cake base size and color.
  - Players can adjust cream thickness and color.
  - Players can adjust cream removal area size.

## Additional Gameplay Mechanics
- Cake pieces can be cut into multiple independent pieces.
- Collision detection for cream extrusion and knife cutting.

## Technical Requirements
- Use Three.js or similar for 3D rendering.
- Implement collision detection for cream extrusion and knife cutting.
- Optimize performance for smooth interaction.
- Modular code structure for easy maintenance and extension.



## Deliverables
- Fully functional JavaScript game codebase.
- Documentation for code structure and usage.
- Instructions for integrating art assets.

## Assets Used for Objects
- Cake Base Object: `assets/cake.glb`
- Cream Object: `assets/cream.glb`
- Knife Object: `assets/knife.glb`
- Trash Bin Icon: `assets/trash_bin.glb`
- Turntable: `assets/turn_table.glb`
- Table: `assets/wooden_table.glb`