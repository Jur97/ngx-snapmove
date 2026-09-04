// Resize Events
export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface ResizeStartEvent {
  position: any; // Will be UiRect, but avoiding circular import
  handle: ResizeHandle;
  pointerEvent: PointerEvent;
}

export interface ResizeMoveEvent {
  position: any; // Will be UiRect
  handle: ResizeHandle;
  pointerEvent: PointerEvent;
}

export interface ResizeEndEvent {
  position: any; // Will be UiRect
  handle: ResizeHandle;
  pointerEvent: PointerEvent;
}
