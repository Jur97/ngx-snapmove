import { Directive, ElementRef, inject, output, input } from '@angular/core';
import { AlignmentService } from '../shared/services/alignment.service';
import { BoundsService } from '../shared/services/bounds.service';
import type { PercentPoint } from '../shared/models/percent-point';
import { ElementDirective } from './element.directive';
import { DragEndEvent, DragMoveEvent, DragStartEvent } from '../shared/models/drag-events';

@Directive({
  selector: '[jurDraggable]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class DraggableDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly element = inject(ElementDirective);
  private readonly boundsService = inject(BoundsService);
  private readonly alignmentService = inject(AlignmentService);

  readonly onDragStart = output<DragStartEvent>();
  readonly dragMove = output<DragMoveEvent>();
  readonly onDragEnd = output<DragEndEvent>();

  readonly step = input<number | undefined>(undefined);

  private isDragging = false;
  private initialPointerX = 0;
  private initialPointerY = 0;
  private pointerId: number | null = null;
  private initialElementRect: DOMRect | null = null;

  onPointerDown(event: PointerEvent): void {
    // Skip drag if clicking on a resize handle
    const target = event.target as HTMLElement;
    if (target.hasAttribute('data-resize-handle')) {
      return;
    }

    this.isDragging = true;
    this.pointerId = event.pointerId;
    this.initialPointerX = event.clientX;
    this.initialPointerY = event.clientY;

    // Capture pointer to receive all events during drag
    this.elementRef.nativeElement.setPointerCapture(event.pointerId);

    // Attach document-level listeners for smooth dragging
    document.addEventListener('pointermove', this.onPointerMove, { passive: true });
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerUp);

    const elementRect = this.element.getCurrentRect();
    if (elementRect) {
      this.initialElementRect = new DOMRect(
        elementRect.x,
        elementRect.y,
        elementRect.width,
        elementRect.height,
      );
    }

    const position = this.calculateConstrainedPosition(event);
    this.onDragStart.emit({ percentPoint: position, pointerEvent: event });
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (this.isDragging && event.pointerId === this.pointerId) {
      const position = this.calculateConstrainedPosition(event);
      const elementRect = this.element.getCurrentRect();

      if (elementRect) {
        const newRect = {
          x: position.x,
          y: position.y,
          width: elementRect.width,
          height: elementRect.height,
        };
        this.element.updateRect(newRect);

        // Detect alignments against all other registered elements
        const others = [...this.boundsService.elements].filter((e) => e !== this.element);
        const alignments = this.alignmentService.detectAlignments(
          this.element,
          others,
          2,
          this.boundsService.bounds(),
        );
        this.boundsService.alignments.set(alignments);
      }

      this.dragMove.emit({ percentPoint: position, pointerEvent: event });
    }
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.isDragging && event.pointerId === this.pointerId) {
      this.isDragging = false;
      const position = this.calculateConstrainedPosition(event);
      this.onDragEnd.emit({ percentPoint: position, pointerEvent: event });

      // Release pointer capture and clean up listeners
      try {
        this.elementRef.nativeElement.releasePointerCapture(event.pointerId);
      } catch (e) {
        // Ignore if already released
      }

      document.removeEventListener('pointermove', this.onPointerMove);
      document.removeEventListener('pointerup', this.onPointerUp);
      document.removeEventListener('pointercancel', this.onPointerUp);

      this.boundsService.alignments.set([]);
    }
  };

  private calculateConstrainedPosition(event: PointerEvent): PercentPoint {
    const bounds = this.boundsService.bounds();
    const elementRect = this.element.getCurrentRect();

    if (!bounds || !elementRect || !this.initialElementRect) {
      return { x: 0, y: 0 };
    }

    // Calculate pointer delta in pixels
    const deltaX = event.clientX - this.initialPointerX;
    const deltaY = event.clientY - this.initialPointerY;

    // Convert pixel delta to percentage based on bounds
    const deltaPercentX = (deltaX / bounds.width) * 100;
    const deltaPercentY = (deltaY / bounds.height) * 100;

    // Apply delta to initial element position
    const newPercentX = this.initialElementRect.x + deltaPercentX;
    const newPercentY = this.initialElementRect.y + deltaPercentY;

    const elementWidthPercent = elementRect.width;
    const elementHeightPercent = elementRect.height;

    // Constrain the position: x and y must be >= 0, and x + width <= 100, y + height <= 100
    const constrainedX = Math.max(0, Math.min(newPercentX, 100 - elementWidthPercent));
    const constrainedY = Math.max(0, Math.min(newPercentY, 100 - elementHeightPercent));

    // Apply step snapping if step is defined (step is in pixels)
    const stepSize = this.step();
    let finalX = constrainedX;
    let finalY = constrainedY;

    if (stepSize) {
      const maxX = 100 - elementWidthPercent;
      const maxY = 100 - elementHeightPercent;
      finalX = this.snapAxis(constrainedX, maxX, stepSize, bounds.width);
      finalY = this.snapAxis(constrainedY, maxY, stepSize, bounds.height);
    }

    return { x: finalX, y: finalY };
  }

  private snapAxis(constrained: number, max: number, step: number, boundsSize: number): number {
    if (constrained === max) return max;
    const snappedPixels = Math.round(((constrained / 100) * boundsSize) / step) * step;
    return Math.max(0, Math.min((snappedPixels / boundsSize) * 100, max));
  }
}
