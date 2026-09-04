import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuideLines } from './guide-lines';

describe('GuideLines', () => {
  let component: GuideLines;
  let fixture: ComponentFixture<GuideLines>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuideLines],
    }).compileComponents();

    fixture = TestBed.createComponent(GuideLines);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
