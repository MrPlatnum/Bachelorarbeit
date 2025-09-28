import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Output,
  inject,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetricsTrackerService } from '../../../../services/metrics-tracker.service';
import '../../../../../assets/scripts/model-viewer.min.js';

@Component({
  selector: 'app-spatial-position-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spatial-position-assessment.component.html',
  styleUrls: ['./spatial-position-assessment.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SpatialPositionAssessmentComponent implements AfterViewInit, OnDestroy { 

  @ViewChild('modelViewer') modelViewerRef!: ElementRef<any>;
  @Output() testComplete = new EventEmitter<void>();
  @Output() redoTest = new EventEmitter<number>();

  private metricsService = inject(MetricsTrackerService);
  private zone = inject(NgZone);
  public scale = 1;
  public verticalOffset = 0;
  protected isModelPlaced = false;
  private initialArAnchor: { x: number; y: number; z: number } | null = null;
  private hasStartedTracking = false;

  constructor() {
    this.logInteraction = this.logInteraction.bind(this);
  }

  ngOnDestroy() {
    this.metricsService.stopTracking();
  }

  ngAfterViewInit() {
    const mv = this.modelViewerRef.nativeElement;
    mv.addEventListener('ar-status', (e: any) => {
      this.zone.run(() => {
        const status = e.detail.status;
        console.log(status)
        if (status === 'session-started' && !this.hasStartedTracking) {
          this.hasStartedTracking = true;
          this.metricsService.startTracking(mv, "position");
        }

        if (status === 'object-placed' && !this.isModelPlaced) {
          console.log("placed")
          this.captureAnchor();
        }
      });
    });
  }

  public logInteraction(event: Event) {
    this.metricsService.logInteraction(event);
  }

  private captureAnchor() {
    const mv = this.modelViewerRef.nativeElement;
    const anchor = mv.getAnchor();
    if (anchor && !anchor.includes('not placed')) {
      const [x, y, z] = anchor.split(' ').map(parseFloat);
      this.initialArAnchor = { x, y, z };
      this.isModelPlaced = true;
      console.log('Anchor captured successfully:', this.initialArAnchor);
    } else {
      console.warn('Object placed, but anchor not ready. Retrying once.');
      setTimeout(() => this.captureAnchor(), 100);
    }
  }

  onSliderInput() {
    if (!this.initialArAnchor) return;
    const { x, y, z } = this.initialArAnchor;
    const newY = y + this.verticalOffset;
    this.modelViewerRef.nativeElement.setAttribute('ar-anchor', `${x} ${newY} ${z}`);
    this.modelViewerRef.nativeElement.scale = `${this.scale} ${this.scale} ${this.scale}`;
  }

  resetPosition() {
    this.scale = 1;
    this.verticalOffset = 0;
    this.onSliderInput();
  }

  confirmPlacement() {
    const finalPlacement = {
      finalScale: this.scale,
      finalVerticalOffset: this.verticalOffset,
      initialAnchor: this.initialArAnchor,
      finalAnchor: this.modelViewerRef.nativeElement.getAttribute('ar-anchor')
    };

    this.metricsService.logInteraction(new CustomEvent('test-results', {
      detail: {
        testName: 'SpatialPositionAssessment',
        results: finalPlacement
      }
    }));

    console.log('Spatial position results captured locally.');
    this.testComplete.emit();
  }

  retryCurrent() {
    this.redoTest.emit(1);
  }
}
