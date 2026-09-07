import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoundsDirective } from '../../../ngx-snapmove/src/lib/bounds/bounds.directive';
import { ElementDirective } from '../../../ngx-snapmove/src/lib/element/element.directive';
import { DraggableDirective } from '../../../ngx-snapmove/src/lib/element/draggable.directive';
import { ResizableDirective } from '../../../ngx-snapmove/src/lib/element/resizable.directive';
import type { UiRect } from '../../../ngx-snapmove/src/lib/shared/models/ui-rect';
import type { PercentPoint } from '../../../ngx-snapmove/src/lib/shared/models/percent-point';
import {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
} from '../../../ngx-snapmove/src/lib/shared/models/drag-events';
import {
  ResizeEndEvent,
  ResizeStartEvent,
} from '../../../ngx-snapmove/src/lib/shared/models/resize-events';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    BoundsDirective,
    ElementDirective,
    DraggableDirective,
    ResizableDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  elementRect = signal<UiRect>({ x: 10, y: 10, width: 15, height: 10 });
  elementRect2 = signal<UiRect>({ x: 50, y: 10, width: 15, height: 10 });
  currentPos = signal<PercentPoint>({ x: 0, y: 0 });
  isDragging = signal(false);
  dragHistory = signal<string[]>([]);
  step = signal(10);

  constructor() {
    console.log('🎬 App initialized');
  }

  onRectChange(rect: UiRect): void {
    this.elementRect.set(rect);
    console.log('📍 rectChange emitted:', rect);
  }

  onDragStart(event: DragStartEvent): void {
    this.isDragging.set(true);
    this.currentPos.set(event.percentPoint);
    this.addEventHistory('🟢 Drag started', event.percentPoint);
    console.log('🟢 Drag started:', event.percentPoint);
  }

  onDragMove(event: DragMoveEvent): void {
    this.currentPos.set(event.percentPoint);
    console.log('🔵 Drag move:', event.percentPoint);
  }

  onDragEnd(event: DragEndEvent): void {
    this.isDragging.set(false);
    this.currentPos.set(event.percentPoint);
    this.addEventHistory('🔴 Drag ended', event.percentPoint);
    console.log('🔴 Drag ended:', event.percentPoint);
  }

  onResizeStart(event: ResizeStartEvent): void {
    const rect = event.rect;
    const historyEntry = `🟡 Resize started - x: ${rect.x.toFixed(2)}%, y: ${rect.y.toFixed(2)}%, w: ${rect.width.toFixed(2)}%, h: ${rect.height.toFixed(2)}%`;
    this.addHistory(historyEntry);
    console.log('🟡 Resize started:', event.rect);
  }

  onResizeEnd(event: ResizeEndEvent): void {
    const rect = event.rect;
    const historyEntry = `🟠 Resize ended - x: ${rect.x.toFixed(2)}%, y: ${rect.y.toFixed(2)}%, w: ${rect.width.toFixed(2)}%, h: ${rect.height.toFixed(2)}%`;
    this.addHistory(historyEntry);
    console.log('🟠 Resize ended:', event.rect);
  }

  private addEventHistory(action: string, pos: PercentPoint): void {
    const historyEntry = `${action} - x: ${pos.x.toFixed(2)}%, y: ${pos.y.toFixed(2)}%`;
    this.addHistory(historyEntry);
  }

  private addHistory(entry: string): void {
    const history = this.dragHistory();
    history.push(entry);
    if (history.length > 5) {
      history.shift();
    }
    this.dragHistory.set([...history]);
  }

  clearHistory(): void {
    this.dragHistory.set([]);
    console.log('🗑️ History cleared');
  }

  updateStep(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.step.set(value);
    console.log('📏 Step updated:', value);
  }
}
