import { Injectable } from '@angular/core';
import { Bounds } from '../models/bounds';
import { ElementDirective } from '../../element/element.directive';
import { UiRect } from '../models/ui-rect';
import { Alignment, AlignAxis, AlignType } from '../models/alignment';

@Injectable()
export class AlignmentService {
  detectAlignments(
    draggable: ElementDirective,
    others: ElementDirective[],
    snapDistancePx: number,
    bounds: Bounds,
  ): Alignment[] {
    const snapThresholdX = (snapDistancePx / bounds.width) * 100;
    const snapThresholdY = (snapDistancePx / bounds.height) * 100;

    const draggableRect = draggable.getCurrentRect();
    const drag = this.edges(draggableRect);

    const alignmentMap = new Map<string, Alignment>();

    for (const other of others) {
      const otherRect = other.getCurrentRect();
      const otherEdges = this.edges(otherRect);

      const xPairs: [number, AlignType, number][] = [
        [drag.left, 'left', otherEdges.left],
        [drag.center, 'center', otherEdges.center],
        [drag.right, 'right', otherEdges.right],
        [drag.left, 'left', otherEdges.right],
        [drag.right, 'right', otherEdges.left],
      ];

      const yPairs: [number, AlignType, number][] = [
        [drag.top, 'top', otherEdges.top],
        [drag.middle, 'middle', otherEdges.middle],
        [drag.bottom, 'bottom', otherEdges.bottom],
        [drag.top, 'top', otherEdges.bottom],
        [drag.bottom, 'bottom', otherEdges.top],
      ];

      this.checkPairs(xPairs, 'x', snapThresholdX, other, alignmentMap, draggableRect);
      this.checkPairs(yPairs, 'y', snapThresholdY, other, alignmentMap, draggableRect);
    }
    console.log('AlignmentService.detectAlignments:', Array.from(alignmentMap.values()));
    return Array.from(alignmentMap.values());
  }

  private checkPairs(
    pairs: [number, AlignType, number][],
    axis: AlignAxis,
    threshold: number,
    other: ElementDirective,
    map: Map<string, Alignment>,
    draggableRect: UiRect,
  ): void {
    for (const [dragEdge, dragEdgeType, otherEdge] of pairs) {
      if (Math.abs(dragEdge - otherEdge) > threshold) continue;

      // Convert alignment line position back to draggable x/y
      const snapTo =
        axis === 'x'
          ? this.edgeToX(dragEdgeType, otherEdge, draggableRect.width)
          : this.edgeToY(dragEdgeType, otherEdge, draggableRect.height);

      const key = `${axis}-${dragEdgeType}-${otherEdge.toFixed(3)}`;
      const existing = map.get(key);
      if (existing) {
        existing.elements.push(other);
      } else {
        map.set(key, { axis, dragEdgeType, position: otherEdge, elements: [other], snapTo });
      }
    }
  }

  private edges(rect: UiRect) {
    return {
      left: rect.x,
      center: rect.x + rect.width / 2,
      right: rect.x + rect.width,
      top: rect.y,
      middle: rect.y + rect.height / 2,
      bottom: rect.y + rect.height,
    };
  }

  // Convert edge type + position to draggable x
  private edgeToX(type: AlignType, pos: number, width: number): number {
    if (type === 'left') return pos;
    if (type === 'center') return pos - width / 2;
    if (type === 'right') return pos - width;
    return pos;
  }

  // Convert edge type + position to draggable y
  private edgeToY(type: AlignType, pos: number, height: number): number {
    if (type === 'top') return pos;
    if (type === 'middle') return pos - height / 2;
    if (type === 'bottom') return pos - height;
    return pos;
  }

  private elementToPercent(el: HTMLElement, bounds: Bounds): UiRect | null {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return {
      x: ((r.left - bounds.left) / bounds.width) * 100,
      y: ((r.top - bounds.top) / bounds.height) * 100,
      width: (r.width / bounds.width) * 100,
      height: (r.height / bounds.height) * 100,
    };
  }
}
