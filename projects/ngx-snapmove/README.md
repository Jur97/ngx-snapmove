# ngx-snapmove

A modern Angular library for interactive element positioning with pixel-perfect grid snapping, automatic alignment detection, and visual guide lines. Built with Angular signals and standalone components for maximum flexibility.

## Features

✨ **Pixel-Based Grid Snapping** — Snap draggable and resizable elements to a configurable grid step  
🎯 **Automatic Alignment Detection** — Visually align edges (left/center/right for X-axis, top/middle/bottom for Y-axis) during drag and resize  
📏 **Visual Guide Lines** — Real-time feedback showing active alignments  
🔄 **Resize Handles** — 8-point resize with directional edge snapping  
📍 **Percentage-Based Coordinates** — All positioning relative to container bounds for responsive layouts  
🎛️ **Service Hub Architecture** — Clean, composable API via BoundsService for element coordination  
⚡ **Signals-First** — Built on Angular signals and computed for reactive, efficient updates

## Installation

```bash
npm install ngx-snapmove
```

**Peer Dependencies:**

- `@angular/core` ≥ 21.2.0
- `@angular/common` ≥ 21.2.0

## Quick Start

### 1. Set Up a Bounds Container

Wrap your draggable/resizable elements with the `jurBounds` directive:

```html
<div class="bounds-container" jurBounds [enableSnap]="true">
  <!-- Your elements go here -->
</div>
```

### 2. Add Elements

Use `jurElement` with granular positioning inputs:

```html
<div jurElement [x]="10" [y]="20" [width]="30" [height]="40">Content</div>
```

### 3. Make Elements Draggable

Add the `jurDraggable` directive:

```html
<div jurElement [x]="10" [y]="20" [width]="30" [height]="40" jurDraggable [step]="10">Drag me</div>
```

### 4. Make Elements Resizable

Add the `jurResizable` directive:

```html
<div jurElement [x]="10" [y]="20" [width]="30" [height]="40" jurDraggable jurResizable [step]="10">
  Drag & resize me
</div>
```

### 5. Listen to Drag Events (Optional)

```html
<div
  jurElement
  [x]="10"
  [y]="20"
  [width]="30"
  [height]="40"
  jurDraggable
  (onDragStart)="onStart($event)"
  (dragMove)="onMove($event)"
  (onDragEnd)="onEnd($event)"
>
  Drag me
</div>
```

```typescript
export class MyComponent {
  onStart(event: DragStartEvent) {
    console.log('Drag started at:', event.percentPoint);
  }

  onMove(event: DragMoveEvent) {
    console.log('Dragging to:', event.percentPoint);
  }

  onEnd(event: DragEndEvent) {
    console.log('Drag ended at:', event.percentPoint);
  }
}
```

## API Reference

### Directives

#### `jurBounds`

Container directive that establishes a coordinate system and manages alignment state for child elements.

**Selector:** `[jurBounds]`

**Inputs:**

- `enableSnap: boolean` (default: `true`) — Enable grid snapping for child elements

**Behavior:**

- Automatically mounts alignment guide lines component
- Tracks all registered elements within the container
- Manages active alignment state during drag/resize

#### `jurElement`

Base directive for any positionable element. Establishes absolute positioning within a bounds container.

**Selector:** `[jurElement]`

**Inputs:**

- `x: number` (default: `0`) — Horizontal position as % of container width
- `y: number` (default: `0`) — Vertical position as % of container height
- `width: number` (default: `0`) — Element width as % of container width
- `height: number` (default: `0`) — Element height as % of container height

**Methods:**

- `getCurrentRect(): UiRect` — Get current position and size
- `updateRect(rect: UiRect): void` — Update position and size

#### `jurDraggable`

Adds drag capability with pointer events, grid snapping, and alignment detection.

**Selector:** `[jurDraggable]`

**Inputs:**

- `step: number` (default: `1`) — Grid step in pixels. Position snaps to multiples of this value.

**Outputs:**

- `onDragStart: OutputEmitterRef<DragStartEvent>` — Emitted when drag begins
- `dragMove: OutputEmitterRef<DragMoveEvent>` — Emitted on each pointer move during drag
- `onDragEnd: OutputEmitterRef<DragEndEvent>` — Emitted when drag completes

#### `jurResizable`

Adds resize capability with 8 handles and directional edge snapping.

**Selector:** `[jurResizable]`

**Inputs:**

- `step: number` (default: `1`) — Grid step in pixels. Size/position snaps to multiples of this value.

**Outputs:**

- `onResizeStart: OutputEmitterRef<ResizeStartEvent>` — Emitted when resize begins
- `resizeMove: OutputEmitterRef<ResizeMoveEvent>` — Emitted on each pointer move during resize
- `onResizeEnd: OutputEmitterRef<ResizeEndEvent>` — Emitted when resize completes

**Behavior:**

- Renders 8 resize handles (n, ne, e, se, s, sw, w, nw)
- Each handle has directional snapping logic
- Detects and displays alignment guide lines during resize
- Respects container bounds and minimum element size (2% of container)

### Services

#### `BoundsService`

Central coordination hub for element registration, tracking, and alignment state management.

**Scope:** Directive-scoped (injected at the `jurBounds` container level)

**Properties:**

- `elements: Set<ElementDirective>` — All registered child elements
- `alignments: Signal<Alignment[]>` — Active alignment state during drag/resize

**Methods:**

- `registerElement(element: ElementDirective): void` — Called by jurElement on init
- `unregisterElement(element: ElementDirective): void` — Called by jurElement on destroy

### Types

#### `UiRect`

Represents position and size of an element.

```typescript
interface UiRect {
  x: number; // Horizontal position (%)
  y: number; // Vertical position (%)
  width: number; // Width (%)
  height: number; // Height (%)
}
```

#### `PercentPoint`

Represents a point coordinate as a percentage of container dimensions.

```typescript
interface PercentPoint {
  x: number; // Horizontal position (%)
  y: number; // Vertical position (%)
}
```

#### `Alignment`

Represents a detected edge-to-edge alignment between elements.

```typescript
interface Alignment {
  axis: 'x' | 'y';
  dragEdgeType: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
  position: number; // Guide line position (%)
  elements: ElementDirective[];
  snapTo: number; // Recommended draggable position (%)
}
```

#### `DragStartEvent`, `DragMoveEvent`, `DragEndEvent`

Emitted during drag operations.

```typescript
interface DragStartEvent {
  percentPoint: PercentPoint;
  pointerEvent: PointerEvent;
}

interface DragMoveEvent {
  percentPoint: PercentPoint;
  pointerEvent: PointerEvent;
}

interface DragEndEvent {
  percentPoint: PercentPoint;
  pointerEvent: PointerEvent;
}
```

#### `ResizeStartEvent`, `ResizeMoveEvent`, `ResizeEndEvent`

Emitted during resize operations.

```typescript
interface ResizeStartEvent {
  position: UiRect;
  handle: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
  pointerEvent: PointerEvent;
}

interface ResizeMoveEvent {
  position: UiRect;
  handle: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
  pointerEvent: PointerEvent;
}

interface ResizeEndEvent {
  position: UiRect;
  handle: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
  pointerEvent: PointerEvent;
}
```

## Coordinate System

All positioning uses **percentage-based coordinates** relative to the bounds container:

- **X-axis**: 0% (left edge) to 100% (right edge)
- **Y-axis**: 0% (top edge) to 100% (bottom edge)
- **Width/Height**: Percentage of container dimensions

This approach ensures **responsive layouts** — elements scale with container size automatically.

## Grid Snapping

Grid snapping aligns drag/resize operations to a pixel-based step:

```html
<div jurDraggable [step]="10">
  <!-- Snaps in 10px increments -->
</div>
```

**How it works:**

1. Pointer move position is converted to pixels
2. Position is rounded to nearest multiple of `step`
3. Result is snapped to container bounds
4. Final position is converted back to percentage

## Alignment Detection

During drag/resize, the library automatically detects edge-to-edge alignments:

- **X-axis**: Left, center, and right edges
- **Y-axis**: Top, middle, and bottom edges

Alignments appear as guide lines and suggest snap positions.

## Architecture

The library uses a **service hub pattern**:

1. **BoundsService** — Central coordinator injected at `jurBounds` level
2. **ElementDirective** — Registers itself on init, tracks position/size
3. **DraggableDirective** — Responds to pointer events, calls AlignmentService
4. **ResizableDirective** — Provides resize handles with directional snapping
5. **GuideLines component** — Reactive component showing active alignments

All communication flows through BoundsService's `alignments` signal.

## Building & Publishing

### Build the library

```bash
ng build space
```

Build artifacts go to `dist/jur/space`.

### Publish to npm

```bash
cd dist/jur/space
npm publish
```

## Testing

```bash
ng test
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT
