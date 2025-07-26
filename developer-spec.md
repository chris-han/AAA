# Developer Specification for 3D Cake-Making Game

## Overview
This document outlines the technical requirements and implementation details for the 3D cake-making game using JavaScript and WebGL or Three.js.

## Core Features
- First-person perspective with mouse control.
- Scene centered on a table with a rotating turntable.
- Multiple game modes: Cake Base Mode, Cream Mode, Knife Mode, and Appreciation Mode.
- Save/load system with JSON files on disk, supporting multiple save slots and export/import.
- User guidance system with on-spot tips if the player stays too long in one mode or area.

## Player Controls and Modes
- **Cake Base Mode (Key 1):**
  - Mouse cursor shows cake base.
  - Move cake base with mouse; spacebar to drop.
  - Right-click and hold to drag placed cake base; release to drop.
- **Cream Mode (Key 2):**
  - Mouse cursor shows cream with visible thickness and color.
  - Left mouse button to extrude cream; extrusion duration depends on press length.
  - Right mouse button to erase cream in targeted area.
- **Knife Mode (Keys 1+3, 2+3, or 3):**
  - Mouse cursor shows knife.
  - 'A' and 'D' keys rotate knife left/right.
  - Left mouse button to cut or smooth cake base or cream depending on mode.
- **Appreciation Mode (Enter key):**
  - Exit other modes and enter appreciation mode.
  - Long press Enter to save current world as a save slot and return to main menu.

## Scene and Object State Management
- Track cake pieces as independent objects with position, size, and state.
- Track cream blobs with position, size, color, and extrusion data.
- Track turntable rotation and speed.
- Track current player mode and UI state.

## Save/Load System
- Save full game state as JSON files on disk.
- Support multiple save slots with export/import functionality.
- Autosave on key events and manual save.
- Load restores full previous state including UI and player mode.

## UI and Mode Transitions
- Display mode indicators and cursor changes.
- Show on-spot guiding tips if player stays too long in one mode or area.
- Smooth transitions between modes and scenes.

## Additional Gameplay Mechanics
- Turntable rotation controlled by 'W' (clockwise) and 'S' (counterclockwise) keys.
- Rotation speed depends on key press duration.
- Cake pieces can be cut into multiple independent pieces.
- Trash bin at top-left corner to delete cake pieces by dragging.
- Gravity applied to cake bases and cream when suspended.

## Technical Requirements
- Use Three.js or similar for 3D rendering.
- Implement collision detection for cream extrusion and knife cutting.
- Optimize performance for smooth interaction.
- Modular code structure for easy maintenance and extension.

## Deliverables
- Fully functional JavaScript game codebase.
- Documentation for code structure and usage.
- Instructions for integrating art assets.