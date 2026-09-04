import {
  Directive,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  HostListener,
} from '@angular/core';
import { BoundsService } from '../shared/services/bounds.service';
import { SelectionService } from '../shared/services/selection.service';
import { UiRect } from '../shared/models/ui-rect';

@Directive({
  selector: '[jurElement]',
  exportAs: 'jurElement',
  host: {
    '(click)': 'onElementClick()',
  },
})
export class ElementDirective implements OnInit, OnDestroy {
  private readonly boundsService = inject(BoundsService);
  private readonly selectionService = inject(SelectionService);
  readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly x = input<number>(0);
  readonly y = input<number>(0);
  readonly width = input<number>(0);
  readonly height = input<number>(0);

  readonly uiRect = computed(() => ({
    x: this.x(),
    y: this.y(),
    width: this.width(),
    height: this.height(),
  }));

  private internalRect = signal<UiRect>({ x: 0, y: 0, width: 0, height: 0 });

  constructor() {
    effect(() => {
      const rect = this.uiRect();
      this.internalRect.set(rect);
      this.applyRect(rect);
    });
  }

  private applyRect(rect: UiRect): void {
    this.elementRef.nativeElement.style.position = 'absolute';
    this.elementRef.nativeElement.style.left = `${rect.x}%`;
    this.elementRef.nativeElement.style.top = `${rect.y}%`;
    this.elementRef.nativeElement.style.width = `${rect.width}%`;
    this.elementRef.nativeElement.style.height = `${rect.height}%`;
  }

  updateRect(rect: UiRect): void {
    this.internalRect.set(rect); // Track internal state
    this.applyRect(rect); // Update DOM
  }

  getCurrentRect(): UiRect {
    return this.internalRect();
  }

  ngOnInit(): void {
    this.boundsService.registerElement(this);
  }

  ngOnDestroy(): void {
    this.boundsService.unregisterElement(this);
  }

  onElementClick(): void {
    this.selectionService.selectedElement.set(this);
  }
}
