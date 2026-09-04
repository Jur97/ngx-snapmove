import { Directive, ElementRef, inject, output, AfterViewInit, effect, input } from '@angular/core';
import { AlignmentService } from '../shared/services/alignment.service';
import { ElementDirective } from './element.directive';
import { BoundsService } from '../shared/services/bounds.service';
import { SelectionService } from '../shared/services/selection.service';
import type { UiRect } from '../shared/models/ui-rect';
import type { Alignment } from '../shared/models/alignment';
import type {
  ResizeHandle,
  ResizeStartEvent,
  ResizeMoveEvent,
  ResizeEndEvent,
} from '../shared/models/resize-events';

@Directive({
  selector: '[jurResizable]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class ResizableDirective implements AfterViewInit {
  resizeHandles = input<ResizeHandle[]>(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']);
  keepRatio = input<boolean>(false);
  step = input<number | undefined>(undefined);

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly element = inject(ElementDirective);
  private readonly boundsService = inject(BoundsService);
  private readonly alignmentService = inject(AlignmentService);
  private readonly selectionService = inject(SelectionService);

  readonly onResizeStart = output<ResizeStartEvent>();
  readonly resizeMove = output<ResizeMoveEvent>();
  readonly onResizeEnd = output<ResizeEndEvent>();

  private isResizing = false;
  private initialPointerX = 0;
  private initialPointerY = 0;
  private pointerId: number | null = null;
  private initialElementRect: UiRect | null = null;
  private initialAspectRatio: number | null = null; // Add this line
  private activeHandle: ResizeHandle | null = null;
  private handleContainer: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const isSelected = this.selectionService.selectedElement() === this.element;
      if (this.handleContainer) {
        this.handleContainer.style.display = isSelected ? 'block' : 'none';
      }
    });
  }

  ngAfterViewInit(): void {
    this.createResizeHandles();
  }

  private createResizeHandles(): void {
    const handles: ResizeHandle[] = this.resizeHandles();
    const host = this.elementRef.nativeElement;

    // Create container for handles with border
    const handleContainer = document.createElement('div');
    handleContainer.setAttribute('data-resize-border', '');
    handleContainer.style.cssText = `
      position: absolute;
      top: -6px;
      left: -6px;
      right: -6px;
      bottom: -6px;
      border: 2px solid rgba(0, 123, 255, 0.3);
      border-radius: 6px;
      pointer-events: none;
      display: none;
    `;

    handles.forEach((handle) => {
      const handleEl = document.createElement('div');
      handleEl.setAttribute('data-resize-handle', handle);
      handleEl.style.cssText = this.getHandleStyles(handle);
      handleContainer.appendChild(handleEl);
    });

    host.appendChild(handleContainer);
    this.handleContainer = handleContainer;
  }

  private getHandleStyles(handle: ResizeHandle): string {
    const baseStyles = `
      position: absolute;
      width: 6px;
      height: 6px;
      background: #007bff;
      border: 2px solid white;
      border-radius: 2px;
      pointer-events: all;
      cursor: ${this.getCursorForHandle(handle)};
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    `;

    const positionStyles: Record<ResizeHandle, string> = {
      n: 'left: 50%; top: -6px; transform: translateX(-50%);',
      ne: 'right: -6px; top: -6px;',
      e: 'right: -6px; top: 50%; transform: translateY(-50%);',
      se: 'right: -6px; bottom: -6px;',
      s: 'left: 50%; bottom: -6px; transform: translateX(-50%);',
      sw: 'left: -6px; bottom: -6px;',
      w: 'left: -6px; top: 50%; transform: translateY(-50%);',
      nw: 'left: -6px; top: -6px;',
    };

    return baseStyles + positionStyles[handle];
  }

  private getCursorForHandle(handle: ResizeHandle): string {
    const cursors: Record<ResizeHandle, string> = {
      n: 'ns-resize',
      ne: 'nesw-resize',
      e: 'ew-resize',
      se: 'nwse-resize',
      s: 'ns-resize',
      sw: 'nesw-resize',
      w: 'ew-resize',
      nw: 'nwse-resize',
    };
    return cursors[handle];
  }

  onPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    const handle = target.getAttribute('data-resize-handle') as ResizeHandle | null;

    // Only start resize if clicking on a handle
    if (!handle) return;

    event.preventDefault();
    event.stopPropagation();

    this.activeHandle = handle;
    this.startResize(event);
  }

  startResize(event: PointerEvent): void {
    if (event.button !== 0) return;

    this.isResizing = true;
    this.pointerId = event.pointerId;
    this.initialPointerX = event.clientX;
    this.initialPointerY = event.clientY;

    // Capture pointer to receive all events during resize
    this.elementRef.nativeElement.setPointerCapture(event.pointerId);

    // Attach document-level listeners for smooth resizing
    document.addEventListener('pointermove', this.onPointerMove, { passive: true });
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerUp);

    const currentRect = this.element.getCurrentRect();
    if (currentRect) {
      this.initialElementRect = { ...currentRect };
      this.initialAspectRatio = currentRect.width / currentRect.height;
    }

    if (currentRect && this.activeHandle) {
      this.onResizeStart.emit({
        position: currentRect,
        handle: this.activeHandle,
        pointerEvent: event,
      });
    }
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (
      this.isResizing &&
      event.pointerId === this.pointerId &&
      this.initialElementRect &&
      this.activeHandle
    ) {
      const newRect = this.calculateConstrainedSize(event, this.activeHandle);
      // Update element first so detectAlignments reads the proposed rect
      this.element.updateRect(newRect);

      const others = [...this.boundsService.elements].filter((e) => e !== this.element);
      const alignments = this.alignmentService.detectAlignments(
        this.element,
        others,
        8,
        this.boundsService.bounds(),
      );
      this.boundsService.alignments.set(alignments);

      const snappedRect = this.applyResizeSnap(newRect, alignments, this.activeHandle);
      if (snappedRect !== newRect) this.element.updateRect(snappedRect);

      if (this.activeHandle) {
        this.resizeMove.emit({
          position: snappedRect,
          handle: this.activeHandle,
          pointerEvent: event,
        });
      }
    }
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.isResizing && event.pointerId === this.pointerId && this.activeHandle) {
      this.isResizing = false;
      const newRect = this.calculateConstrainedSize(event, this.activeHandle);
      this.onResizeEnd.emit({ position: newRect, handle: this.activeHandle, pointerEvent: event });

      // Release pointer capture and clean up listeners
      try {
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
      } catch (e) {
        // Ignore if already released
      }

      document.removeEventListener('pointermove', this.onPointerMove);
      document.removeEventListener('pointerup', this.onPointerUp);
      document.removeEventListener('pointercancel', this.onPointerUp);
      this.activeHandle = null;
      this.boundsService.alignments.set([]);
    }
  };

  private applyResizeSnap(rect: UiRect, alignments: Alignment[], handle: ResizeHandle): UiRect {
    let { x, y, width, height } = rect;

    for (const a of alignments) {
      if (a.axis === 'x') {
        if (handle.includes('e') && a.dragEdgeType === 'right') {
          width = a.position - x;
        } else if (handle.includes('w') && a.dragEdgeType === 'left') {
          const rightEdge = x + width;
          x = a.position;
          width = rightEdge - a.position;
        }
      } else {
        if (handle.includes('s') && a.dragEdgeType === 'bottom') {
          height = a.position - y;
        } else if (handle.includes('n') && a.dragEdgeType === 'top') {
          const bottomEdge = y + height;
          y = a.position;
          height = bottomEdge - a.position;
        }
      }
    }

    if (x === rect.x && y === rect.y && width === rect.width && height === rect.height) {
      return rect;
    }
    return { x, y, width, height };
  }

  private calculateConstrainedSize(event: PointerEvent, handle: ResizeHandle): UiRect {
    const bounds = this.boundsService.bounds();
    const currentRect = this.element.getCurrentRect();

    if (!bounds || !currentRect || !this.initialElementRect) {
      return currentRect;
    }

    // Calculate pointer delta in pixels
    const deltaX = event.clientX - this.initialPointerX;
    const deltaY = event.clientY - this.initialPointerY;

    // Convert pixel delta to percentage based on bounds
    const deltaPercentX = (deltaX / bounds.width) * 100;
    const deltaPercentY = (deltaY / bounds.height) * 100;

    let newX = this.initialElementRect.x;
    let newY = this.initialElementRect.y;
    let newWidth = this.initialElementRect.width;
    let newHeight = this.initialElementRect.height;

    // Handle horizontal resizing
    if (handle.includes('w')) {
      // Left side: move x and decrease width
      newX = this.initialElementRect.x + deltaPercentX;
      newWidth = this.initialElementRect.width - deltaPercentX;
    } else if (handle.includes('e')) {
      // Right side: increase width
      newWidth = this.initialElementRect.width + deltaPercentX;
    }

    // Handle vertical resizing
    if (handle.includes('n')) {
      // Top side: move y and decrease height
      newY = this.initialElementRect.y + deltaPercentY;
      newHeight = this.initialElementRect.height - deltaPercentY;
    } else if (handle.includes('s')) {
      // Bottom side: increase height
      newHeight = this.initialElementRect.height + deltaPercentY;
    }

    // 3. ASPECT RATIO CONSTRAINT - GOES HERE
    // Now you have newWidth/newHeight from the pointer delta
    // Apply aspect ratio to maintain proportions
    if (this.keepRatio() && this.initialAspectRatio) {
      if (handle === 'n' || handle === 's') {
        // Vertical only: width follows height
        newWidth = newHeight * this.initialAspectRatio;
      } else if (handle === 'e' || handle === 'w') {
        // Horizontal only: height follows width
        newHeight = newWidth / this.initialAspectRatio;
      } else {
        // Corners: prioritize horizontal, height follows
        newHeight = newWidth / this.initialAspectRatio;
      }
    }

    // Minimum size constraints (10% of bounds)
    const minWidth = 10;
    const minHeight = 10;
    // newWidth = Math.max(minWidth, newWidth);
    // newHeight = Math.max(minHeight, newHeight);

    // Maximum constraints: position must be >= 0 and element must stay within bounds
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    newWidth = Math.min(newWidth, 100 - newX);
    newHeight = Math.min(newHeight, 100 - newY);

    // if (this.keepRatio() && this.initialAspectRatio) {
    //   if (handle === 'n' || handle === 's') {
    //     // For vertical-only: height is primary, width follows
    //     newWidth = newHeight * this.initialAspectRatio;
    //     // But newWidth might now exceed bounds, so constrain it
    //     if (newWidth > 100 - newX) {
    //       newWidth = 100 - newX;
    //       newHeight = newWidth / this.initialAspectRatio;
    //     }
    //   } else if (handle === 'e' || handle === 'w') {
    //     // For horizontal-only: width is primary, height follows
    //     newHeight = newWidth / this.initialAspectRatio;
    //     // But newHeight might now exceed bounds, so constrain it
    //     if (newHeight > 100 - newY) {
    //       newHeight = 100 - newY;
    //       newWidth = newHeight * this.initialAspectRatio;
    //     }
    //   } else {
    //     // For corners: width is primary
    //     newHeight = newWidth / this.initialAspectRatio;
    //     if (newHeight > 100 - newY) {
    //       newHeight = 100 - newY;
    //       newWidth = newHeight * this.initialAspectRatio;
    //     }
    //   }
    // }

    const stepSize = this.step();
    if (stepSize) {
      // Snap position (if left/top edges are being resized)
      if (handle.includes('w')) {
        newX = this.snapAxis(newX, 100, stepSize, bounds.width);
      }
      if (handle.includes('n')) {
        newY = this.snapAxis(newY, 100, stepSize, bounds.height);
      }

      // Snap dimensions
      const maxWidth = 100 - newX;
      const maxHeight = 100 - newY;
      newWidth = this.snapAxis(newWidth, maxWidth, stepSize, bounds.width);
      newHeight = this.snapAxis(newHeight, maxHeight, stepSize, bounds.height);
    }

    return {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };
  }

  private snapAxis(constrained: number, max: number, step: number, boundsSize: number): number {
    if (constrained === max) return max;
    const snappedPixels = Math.round(((constrained / 100) * boundsSize) / step) * step;
    return Math.max(0, Math.min((snappedPixels / boundsSize) * 100, max));
  }
}

@Directive({
  selector: '[jurResizeHandle]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class ResizeHandleDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly resizable = inject(ResizableDirective);

  onPointerDown(event: PointerEvent): void {
    event.stopPropagation();
    this.resizable.startResize(event);
  }
}
