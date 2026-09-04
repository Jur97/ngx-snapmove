import {
  ApplicationRef,
  createComponent,
  Directive,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injector,
  OnDestroy,
  AfterViewInit,
  input,
} from '@angular/core';

import { GuideLines } from '../guide-lines/guide-lines';
import { BoundsService } from '../shared/services/bounds.service';
import { SelectionService } from '../shared/services/selection.service';
import { AlignmentService } from '../shared/services/alignment.service';

@Directive({
  selector: '[jurBounds]',
  exportAs: 'jurBounds',
  providers: [BoundsService, SelectionService, AlignmentService],
})
export class BoundsDirective implements AfterViewInit, OnDestroy {
  enableSnap = input<boolean>(true);
  readonly boundsService = inject(BoundsService);

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);

  private resizeObserver?: ResizeObserver;
  private guideLines?: ReturnType<typeof createComponent<GuideLines>>;

  ngAfterViewInit(): void {
    const element = this.elementRef.nativeElement;

    this.resizeObserver = new ResizeObserver(([entry]) => {
      this.boundsService.bounds.set(entry.contentRect);
    });

    this.resizeObserver.observe(element);

    if (this.enableSnap()) {
      // elementInjector gives GuideLines access to the directive-scoped BoundsService
      this.guideLines = createComponent(GuideLines, {
        environmentInjector: this.envInjector,
        elementInjector: this.injector,
      });
      element.appendChild(this.guideLines.location.nativeElement);
      // Attach to change detection tree so signals update the view reactively
      this.appRef.attachView(this.guideLines.hostView);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.guideLines) {
      this.appRef.detachView(this.guideLines.hostView);
      this.guideLines.destroy();
    }
  }
}
