import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpatialPositionAssessmentComponent } from './spatial-position-assessment.component';

describe('SpatialPositionAssessmentComponent', () => {
  let component: SpatialPositionAssessmentComponent;
  let fixture: ComponentFixture<SpatialPositionAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpatialPositionAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpatialPositionAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
