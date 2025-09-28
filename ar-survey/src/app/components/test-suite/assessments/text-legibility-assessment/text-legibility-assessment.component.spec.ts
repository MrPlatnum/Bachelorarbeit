import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextLegibilityAssessmentComponent } from './text-legibility-assessment.component';

describe('TextLegibilityAssessmentComponent', () => {
  let component: TextLegibilityAssessmentComponent;
  let fixture: ComponentFixture<TextLegibilityAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextLegibilityAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextLegibilityAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
