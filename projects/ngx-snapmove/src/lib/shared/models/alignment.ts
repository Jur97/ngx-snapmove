import { ElementDirective } from '../../element/element.directive';

export type AlignAxis = 'x' | 'y';
export type AlignType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export interface Alignment {
  axis: AlignAxis;
  dragEdgeType: AlignType;
  position: number;
  elements: ElementDirective[];
  snapTo: number;
}
