import { Injectable, signal } from '@angular/core';
import { Alignment } from '../models/alignment';
import { Bounds } from '../models/bounds';
import { ElementDirective } from '../../element/element.directive';

@Injectable()
export class BoundsService {
  readonly bounds = signal<Bounds>(new DOMRectReadOnly(0, 0, 0, 0));

  /** All jurElement directives registered inside this bounds container */
  readonly elements = new Set<ElementDirective>();

  /** Active alignment guide lines during drag */
  readonly alignments = signal<Alignment[]>([]);

  registerElement(el: ElementDirective): void {
    this.elements.add(el);
  }

  unregisterElement(el: ElementDirective): void {
    this.elements.delete(el);
  }
}
