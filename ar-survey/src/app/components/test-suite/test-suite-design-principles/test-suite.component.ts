import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TestProgressService } from '../../../services/test-progress-tracker-usability/test-progress.service';

import { SpatialStabilityAssessmentComponent } from '../assessments/spatial-stability-assessment/spatial-stability-assessment.component';
import { TextLegibilityAssessmentComponent } from '../assessments/text-legibility-assessment/text-legibility-assessment.component';
import { SpatialPositionAssessmentComponent } from '../assessments/spatial-position-assessment/spatial-position-assessment.component';
import { DemographicsFeedbackComponent } from '../assessments/demographics-feedback/demographics-feedback.component';
import { FeedbackComponent } from '../assessments/feedback-component/feedback.component';
import { CeilingPlacementDemonstratorComponent } from "../assessments/preivew/ceiling-placement-demonstrator.component";

@Component({
  selector: 'app-test-suite',
  standalone: true,
  imports: [
    CommonModule,
    SpatialStabilityAssessmentComponent,
    TextLegibilityAssessmentComponent,
    SpatialPositionAssessmentComponent,
    CeilingPlacementDemonstratorComponent,
    FeedbackComponent
],
  templateUrl: './test-suite.component.html',
  styleUrls: ['./test-suite.component.css']
})
export class TestSuiteComponent implements OnInit, OnDestroy {
  currentTest = 1;
  totalTests = 4;
  progress = 25;
  
  private destroy$ = new Subject<void>();

  constructor(
    private progressService: TestProgressService,
  ) {}

  ngOnInit(): void {
    this.progressService.currentTest$
      .pipe(takeUntil(this.destroy$))
      .subscribe(test => {
        this.currentTest = test;
      });

    this.progressService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.progress = progress;
      });

    this.totalTests = this.progressService.getTotalTests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTestComplete(): void {
    this.progressService.nextTest();
  }

  redoTest(testNumber: number): void {
    this.progressService.goToTest(testNumber);
  }

  forceNextTest(): void {
    this.progressService.nextTest();
  }
}