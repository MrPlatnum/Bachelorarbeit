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
  selector: 'app-text-legibility-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './text-legibility-assessment.component.html',
  styleUrls: ['./text-legibility-assessment.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TextLegibilityAssessmentComponent implements AfterViewInit, OnDestroy {
  @ViewChild('modelViewer') modelViewerRef!: ElementRef<any>;
  @Output() testComplete = new EventEmitter<void>();
  @Output() redoTest = new EventEmitter<number>();

  private metricsService = inject(MetricsTrackerService);
  private zone = inject(NgZone);

  public isArActive = false;
  public isModelPlaced = false;
  public isDescriptionVisible = true;

  isModelLoading: boolean = true;
  minSize = 2;
  maxSize = 64;
  currentSize = 16;
  phase: 'min' | 'confirmedMin' | 'max' | 'confirmedMax' | 'comfortable' | 'confirmedComfort' = 'min';
  minSizeResult: number | null = null;
  maxSizeResult: number | null = null;
  comfortableSizeResult: number | null = null;

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
            this.isDescriptionVisible = true;
            this.metricsService.startTracking(mv, "text-legibility");
            break;
          case 'object-placed':
            if (this.isArActive && !this.isModelPlaced) {
              this.isModelPlaced = true;
            }
            break;
          case 'not-presenting':
            this.isArActive = false;
            this.isModelPlaced = false;
            this.resetComponentState();
            break;
        }
      });
    });
  }
  
  private resetComponentState() {
    this.phase = 'min';
    this.currentSize = 16;
    this.minSizeResult = null;
    this.maxSizeResult = null;
    this.comfortableSizeResult = null;
    this.isDescriptionVisible = true;
  }

  public logInteraction(event: Event) {
    this.metricsService.logInteraction(event);
  }
  
  toggleDescription() {
    this.isDescriptionVisible = !this.isDescriptionVisible;
  }

  decrease() {
    if (this.currentSize > this.minSize) this.currentSize--;
  }

  increase() {
    if (this.currentSize < this.maxSize) this.currentSize++;
  }

  nextPhase() {
    this.isDescriptionVisible = true;
    switch (this.phase) {
      case 'min':
        this.minSizeResult = this.currentSize;
        this.phase = 'confirmedMin';
        break;
      case 'confirmedMin':
        this.currentSize = this.maxSize;
        this.phase = 'max';
        break;
      case 'max':
        this.maxSizeResult = this.currentSize;
        this.phase = 'confirmedMax';
        break;
      case 'confirmedMax':
        this.currentSize = Math.floor((this.minSizeResult! + this.maxSizeResult!) / 2);
        this.phase = 'comfortable';
        break;
      case 'comfortable':
        this.comfortableSizeResult = this.currentSize;
        this.phase = 'confirmedComfort';
        break;
      case 'confirmedComfort':
        this.finishAssessment();
        break;
    }
  }

  resetToMid() {
    this.resetComponentState();
  }

  finishAssessment() {
    const finalResults = {
      minReadableSize: this.minSizeResult,
      maxReadableSize: this.maxSizeResult,
      comfortableReadableSize: this.comfortableSizeResult
    };
    this.metricsService.logInteraction(new CustomEvent('test-results', {
      detail: { testName: 'TextLegibility', results: finalResults }
    }));
    this.testComplete.emit();
  }

  ngOnDestroy() {
    this.metricsService.stopTracking();
  }

  onModelPreload() {
    this.isModelLoading = true;
  }

  onModelLoad() {
    this.isModelLoading = false;
  }
}
