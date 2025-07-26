# 3D Cake Game - User Interaction and GUI Design Document

## 1. Overview and Visual Style
- Simple 3D game with a slightly cartoonish style.
- Edge outlining (toon shading) applied to objects for visual clarity.
- First-person perspective gameplay.

## 2. Initial Interface - Save Slots Menu
- Display multiple save slots representing different "cake worlds" (completed cakes).
- Each save slot shows:
  - Save name or identifier.
  - Status indicator (new/unopened or last saved state).
- User can select a save slot to enter the corresponding world.
- If the save slot is new (never entered), the world loads in its initial state.
- If previously opened, the world loads the last saved state.

## 3. World Entry and State Persistence
- Upon selecting a save slot, transition to the game world scene.
- All subsequent operations affect only the selected world.
- World state persists between sessions via save slots.

## 4. Core Gameplay Scene Layout
- Scene centered on a table with a turntable placed on top.
- The turntable and table are fixed objects; they cannot be affected by player tools.
- Player’s view is centered on the turntable.
- GUI elements:
  - Top-left corner: Trash bin icon for deleting cake bases.
  - Mode indicators and tool settings displayed near the cursor or screen edges.

## 5. Interaction Modes and Controls
### Mode Switching
- Press keys to switch modes:
  - `1` - Cake Base Mode
  - `2` - Cream Mode
  - `3` or `1+3` or `2+3` - Knife Mode
  - `Enter` - Appreciation Mode
- Pressing `Enter` once enters appreciation mode.
- Long pressing `Enter` saves the current world as a completed cake and returns to the save slots menu.

### Cake Base Mode (`1`)
- Cursor shows a cake base model following mouse position.
- Left-click (spacebar) drops the cake base onto the table.
- Right-click and hold on a placed cake base allows dragging to reposition.
- Cake base size and color can be adjusted before dropping.
- Multiple cake bases can be placed; when cut, each piece becomes an independent cake base.

### Cream Mode (`2`)
- Cursor shows cream with visible thickness and color.
- Cream thickness and color adjustable before applying.
- Left mouse button press starts extruding cream at cursor position.
- Cream extrusion continues while holding left mouse button; extrusion point follows mouse.
- If cream collision overlaps with other objects, outline the overlapping edges.
- Right-click on cream area removes cream in that region; removal size adjustable before action.

### Knife Mode (`3`, `1+3`, `2+3`)
- Cursor shows a knife model following mouse position.
- Knife can be rotated left (`a`) or right (`d`).
- Left mouse button press and hold starts cutting or smoothing:
  - `1+3`: Knife affects only cake bases (cutting).
  - `2+3`: Knife affects only cream (smoothing).
  - `3` alone: Knife affects both cake bases and cream.
- Knife cannot affect the turntable or table.

## 6. Turntable Controls
- `w` key: Rotate turntable clockwise.
- `s` key: Rotate turntable counterclockwise.
- Rotation speed depends on key press duration.
- Objects on the turntable rotate synchronously.
- Rotation speed is moderate to maintain control.

## 7. Trash Bin Functionality
- Located at the top-left corner of the screen.
- Cake bases can be dragged into the trash bin to delete them.
- Deletion removes the cake base from the scene.

## 8. Physics and Gravity
- Cake bases or cream that are dropped or extruded and not in contact with any collision object will fall due to gravity.
- Gravity applies during suspension until contact is made.

## 9. Appreciation Mode (`Enter`)
- Player exits other modes and enters a non-interactive appreciation mode.
- Long pressing `Enter` saves the current world as a completed cake save slot and returns to the initial save slots menu.

## 10. Settings and Customization
- Before dropping or extruding:
  - Players can adjust cake base size and color.
  - Players can adjust cream thickness and color.
  - Players can adjust cream removal area size.
- Settings are accessible via GUI controls near the cursor or screen edges.