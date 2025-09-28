import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemographicsFeedbackComponent } from './demographics-feedback.component';

describe('DemographicsFeedbackComponent', () => {
  let component: DemographicsFeedbackComponent;
  let fixture: ComponentFixture<DemographicsFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemographicsFeedbackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemographicsFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
