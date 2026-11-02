import { ElementDirective } from '../../element/element.directive';
import { UiRect } from '../models/ui-rect';
import { AlignmentService } from './alignment.service';

const el = (rect: UiRect) => ({ getCurrentRect: () => rect }) as unknown as ElementDirective;
const bounds = new DOMRectReadOnly(0, 0, 1000, 1000);

describe('AlignmentService bounds center', () => {
  const service = new AlignmentService();

  it('aligns horizontal center (x) to bounds center', () => {
    const result = service.detectAlignments(
      el({ x: 35, y: 0, width: 30, height: 10 }),
      [],
      2,
      bounds,
    );
    expect(result.find((a) => a.axis === 'x' && a.dragEdgeType === 'center')).toEqual(
      expect.objectContaining({ position: 50, snapTo: 35, elements: [] }),
    );
  });

  it('aligns vertical middle (y) to bounds center', () => {
    const result = service.detectAlignments(
      el({ x: 0, y: 45, width: 10, height: 10 }),
      [],
      2,
      bounds,
    );
    expect(result.find((a) => a.axis === 'y' && a.dragEdgeType === 'middle')).toBeTruthy();
  });

  it('does not align when outside the threshold', () => {
    const result = service.detectAlignments(
      el({ x: 10, y: 10, width: 10, height: 10 }),
      [],
      2,
      bounds,
    );
    expect(result).toEqual([]);
  });
});
