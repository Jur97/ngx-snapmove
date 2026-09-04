import { Injectable, signal } from '@angular/core';
import { Alignment } from '../models/alignment';
import { Bounds } from '../models/bounds';

@Injectable()
export class SelectionService {
  readonly selectedElement = signal<
    import('../../element/element.directive').ElementDirective | null
  >(null);
}
