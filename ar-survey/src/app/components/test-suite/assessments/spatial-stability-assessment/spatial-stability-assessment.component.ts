import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  CUSTOM_ELEMENTS_SCHEMA,
  NgZone,
  EventEmitter,
  Output,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetricsTrackerService } from '../../../../services/metrics-tracker.service';
import '../../../../../assets/scripts/model-viewer.min.js';

@Component({
  selector: 'app-spatial-stability-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spatial-stability-assessment.component.html',
  styleUrls: ['./spatial-stability-assessment.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SpatialStabilityAssessmentComponent implements AfterViewInit, OnDestroy {
  @ViewChild('modelViewer') modelViewerRef!: ElementRef<any>;
  @Output() testComplete = new EventEmitter<void>();
  @Output() redoTest = new EventEmitter<number>();

  private metricsService = inject(MetricsTrackerService);
  private zone = inject(NgZone);

  public isArActive = false;
  public isModelPlaced = false;
  
  public verticalOffset = 0;
  public currentPhase = 0;
  public remainingTime = 20;
  public progressPercentage = 0;

  private initialArAnchor: { x: number, y: number, z: number } | null = null;
  private lockedPosition: { verticalOffset: number } | null = null;
  private countdownInterval: any = null;

  constructor() {
    this.logInteraction = this.logInteraction.bind(this);
  }

  ngAfterViewInit() {
    const mv = this.modelViewerRef.nativeElement;

    mv.addEventListener('ar-status', (event: any) => {
      this.zone.run(() => {
        const status = event.detail.status;

        switch (status) {
          case 'session-started':
            this.isArActive = true;
            this.isModelPlaced = false;
            this.currentPhase = 1;
            this.metricsService.startTracking(mv, "stability");
            break;

          case 'object-placed':
            if (this.isArActive && !this.isModelPlaced) {
              this.isModelPlaced = true;
              this.getInitialAnchor();
            }
            break;
            
          case 'not-presenting':
            this.isArActive = false;
            this.isModelPlaced = false;
            this.currentPhase = 0;
            this.resetComponentState();
            break;
        }
      });
    });
  }
  
  private resetComponentState() {
    this.clearCountdown();
    this.initialArAnchor = null;
    this.lockedPosition = null;
    this.verticalOffset = 0;
  }

  private getInitialAnchor() {
    const mv = this.modelViewerRef.nativeElement;
    const anchorString = mv.getAnchor(); 

    if (anchorString && !anchorString.includes('not placed')) {
      const coords = anchorString.split(' ').map(parseFloat);
      if (coords.length === 3 && !coords.some(isNaN)) {
        this.initialArAnchor = { x: coords[0], y: coords[1], z: coords[2] };
      }
    } else {
        setTimeout(() => this.getInitialAnchor(), 100);
    }
  }

  onSliderInput() {
    if (this.initialArAnchor && this.currentPhase === 1) {
      const { x, z } = this.initialArAnchor;
      const newY = this.initialArAnchor.y + this.verticalOffset;
      this.modelViewerRef.nativeElement.setAttribute('ar-anchor', `${x} ${newY} ${z}`);
    }
  }


  public logInteraction(event: Event) {
    this.metricsService.logInteraction(event);
  }

  lockPosition() {
    this.lockedPosition = { verticalOffset: this.verticalOffset };
    this.currentPhase = 2;
  }

  adjustMore() {
    this.currentPhase = 1;
  }

  startCountdown() {
    this.currentPhase = 3;
    this.remainingTime = 20;
    this.progressPercentage = 0;

    this.countdownInterval = setInterval(() => {
      this.zone.run(() => {
        this.remainingTime--;
        this.progressPercentage = ((20 - this.remainingTime) / 20) * 100;
        if (this.remainingTime <= 0) {
          this.completeTest(true);
        }
      });
    }, 1000);
  }
  
  private clearCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  cancelTest() {
    this.clearCountdown();
    this.currentPhase = 2;
    this.metricsService.logInteraction(new CustomEvent('test-cancelled', { detail: { phase: 'countdown' } }));
  }

  private completeTest(wasCompleted: boolean) {
    this.clearCountdown();
    const finalResults = {
      testCompletedSuccessfully: wasCompleted,
      initialAnchor: this.initialArAnchor,
      lockedPosition: this.lockedPosition,
    };
    this.metricsService.logInteraction(new CustomEvent('test-results', {
      detail: { testName: 'SpatialStability', results: finalResults }
    }));
    if (wasCompleted) {
      this.currentPhase = 4;
      this.testComplete.emit();
    }
  }

  restartTest() {
    this.clearCountdown();
    this.currentPhase = 1;
    this.lockedPosition = null;
    this.verticalOffset = 0;
    this.onSliderInput();
  }

  finishAssessment() {
    this.testComplete.emit();
  }

  ngOnDestroy() {
    this.clearCountdown();
    this.metricsService.stopTracking();
  }
}
