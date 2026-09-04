import { Component, inject } from '@angular/core';
import { BoundsService } from '../shared/services/bounds.service';

@Component({
  selector: 'lib-guide-lines',
  imports: [],
  templateUrl: './guide-lines.html',
  styleUrl: './guide-lines.css',
})
export class GuideLines {
  protected readonly alignments = inject(BoundsService).alignments;
}
