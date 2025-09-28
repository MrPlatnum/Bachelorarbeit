import {
    Component,
    AfterViewInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    CUSTOM_ELEMENTS_SCHEMA,
    NgZone,
    inject,
    Output,
    EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
    
import '../../../../../assets/scripts/model-viewer.min.js';
import { MetricsTrackerService } from '../../../../services/metrics-tracker.service.js';

interface ModelViewerElement extends HTMLElement {
    arVerticalOffset?: number;
    setAttribute(name: string, value: string): void;
    getAttribute(name: string): string | null;
    removeAttribute(name: string): void;
    getAnchor: () => Promise<string | null>;
    activateAR: () => Promise<void>;
    deactivateAR?: () => void;
}


@Component({
    selector: 'app-ceiling-placement-demonstrator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: 'ceiling-placement-demonstrator.component.html',
    styleUrl: 'ceiling-placement-demonstrator.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CeilingPlacementDemonstratorComponent implements AfterViewInit, OnDestroy {
    
    @ViewChild('modelViewer') modelViewerRef!: ElementRef<ModelViewerElement>;
    @Output() testComplete = new EventEmitter<void>();

    private metricsService = inject(MetricsTrackerService);
    private zone = inject(NgZone);
    
    public isArActive = false;
    public isModelPlaced = false;
    public isCeilingAimed = false;
    public arHasBeenActive = false;
    public isInfoBoxVisible = true;
    private hasStartedTracking = false;
    public verticalOffset = 0;
    
    private modelViewerElement!: ModelViewerElement;
    
    constructor() {
      this.logInteraction = this.logInteraction.bind(this);
    }

    ngAfterViewInit() {
        this.modelViewerElement = this.modelViewerRef.nativeElement;
        this.modelViewerElement.addEventListener('ar-status', this.handleArStatus);
        
        this.modelViewerElement.addEventListener('ar-tracking', (ev: any) => {
            this.zone.run(() => {
                this.isCeilingAimed = ev?.detail?.status === 'tracking';
            });
        });
    }

    public logInteraction(event: Event) {
      this.metricsService.logInteraction(event);
    }

    public async activateAr(event: MouseEvent) {
        this.logInteraction(event);
        try {
            await this.modelViewerElement.activateAR();
        } catch (error) {
            console.error("Failed to activate AR:", error);
        }
    }
    
    public dismissInfoBox(event: MouseEvent) {
        this.isInfoBoxVisible = false;
        this.logInteraction(event);
    }

    private pushVerticalOffset(value: number) {
        if (!this.modelViewerElement) return;
        (this.modelViewerElement as any).arVerticalOffset = value;
        this.modelViewerElement.setAttribute('ar-vertical-offset', String(value));
    }
      
    public onOffsetChange(value: number) {
        this.verticalOffset = value;
        this.pushVerticalOffset(value);
    }
      
    public finishExperience() {
        const finalPlacement = {
          finalVerticalOffset: this.verticalOffset,
        };

        this.metricsService.logInteraction(new CustomEvent('test-results', {
          detail: {
            testName: 'CeilingPlacementDemonstrator',
            results: finalPlacement
          }
        }));
        
        this.testComplete.emit();
    }
    
    public resetOffset(event: Event) {
        this.verticalOffset = 0;
        this.pushVerticalOffset(0);
        this.logInteraction(event);
    }

    private handleArStatus = (event: any) => {
        this.zone.run(() => {
          const status = event.detail?.status;
          switch (status) {
            case 'session-started':
              this.isArActive = true;
              this.arHasBeenActive = true;
              this.isModelPlaced = false;
              this.isInfoBoxVisible = true;
              
              if (!this.hasStartedTracking) {
                  this.hasStartedTracking = true;
                  this.metricsService.startTracking(this.modelViewerElement, "ceiling_placement");
              }
              this.pushVerticalOffset(this.verticalOffset);
              break;
    
            case 'object-placed':
              this.isModelPlaced = true;
              this.isInfoBoxVisible = false;
              this.pushVerticalOffset(this.verticalOffset);
              break;
    
            case 'not-presenting':
            case 'failed':
              this.isArActive = false;
              break;
          }
        });
    };
      
    private resetArState() {
        this.isArActive = false;
        this.isModelPlaced = false;
        this.isCeilingAimed = false;
        this.isInfoBoxVisible = true;
        this.verticalOffset = 0;
    }

    ngOnDestroy() {
        if (this.modelViewerElement) {
            this.modelViewerElement.removeEventListener('ar-status', this.handleArStatus);
        }
        if(this.hasStartedTracking) {
          this.metricsService.stopTracking();
        }
        this.resetArState();
    }
}
