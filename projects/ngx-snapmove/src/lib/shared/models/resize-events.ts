import type { UiRect } from './ui-rect';

// Resize Events
export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface ResizeStartEvent {
  rect: UiRect;
  handle: ResizeHandle;
  pointerEvent: PointerEvent;
}

export interface ResizeMoveEvent {
  rect: UiRect;
  handle: ResizeHandle;
  pointerEvent: PointerEvent;
}

export interface ResizeEndEvent {
  rect: UiRect;
  handle: ResizeHandle;
  pointerEvent: PointerEvent;
}
