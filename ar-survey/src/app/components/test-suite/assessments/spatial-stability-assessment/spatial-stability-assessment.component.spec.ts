import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpatialStabilityAssessmentComponent } from './spatial-stability-assessment.component';

describe('RotationSpeedAssessmentComponent', () => {
  let component: SpatialStabilityAssessmentComponent;
  let fixture: ComponentFixture<SpatialStabilityAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpatialStabilityAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpatialStabilityAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
