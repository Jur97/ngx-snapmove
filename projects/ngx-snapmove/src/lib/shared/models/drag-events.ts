import { PercentPoint } from './percent-point';

// Drag Events
export interface DragStartEvent {
  percentPoint: PercentPoint;
  pointerEvent: PointerEvent;
}

export interface DragMoveEvent {
  percentPoint: PercentPoint;
  pointerEvent: PointerEvent;
}

export interface DragEndEvent {
  percentPoint: PercentPoint;
  pointerEvent: PointerEvent;
}
