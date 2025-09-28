import { Component, EventEmitter, inject, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MetricsTrackerService } from '../../../../services/metrics-tracker.service';

@Component({
  selector: 'app-demographics-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './demographics-feedback.component.html',
  styleUrls: ['./demographics-feedback.component.css']
})
export class DemographicsFeedbackComponent implements OnInit {
  private metricsService = inject(MetricsTrackerService);
  private formBuilder = inject(FormBuilder);

  @Output() testComplete = new EventEmitter<void>();
  @Output() redoTest = new EventEmitter<number>();

  demographicsForm!: FormGroup;
  isSubmitting = false;
  isSubmitted = false;

  susItems = [
    { label: 'Ich denke, dass ich diese AR-Anwendung gerne regelmäßig nutzen würde. (zum Beipiel um Lampen vor dem Kauf anschauen zu können etc.)', controlName: 'sus1' },
    { label: 'Ich empfinde diese AR-Anwendung als unnötig komplex.', controlName: 'sus2' },
    { label: 'Ich empfinde diese AR-Anwendung als einfach zu nutzen.', controlName: 'sus3' },
    { label: 'Ich denke, dass ich technischen Support brauchen würde, um diese AR-Anwendung zu nutzen.', controlName: 'sus4' },
    { label: 'Ich finde, dass die verschiedenen Funktionen dieser AR-Anwendung gut integriert sind.', controlName: 'sus5' },
    { label: 'Ich finde, dass es in dieser AR-Anwendung zu viele Inkonsistenzen gibt.', controlName: 'sus6' },
    { label: 'Ich kann mir vorstellen, dass die meisten Leute diese AR-Anwendung schnell zu beherrschen lernen.', controlName: 'sus7' },
    { label: 'Ich empfinde die Bedienung dieser AR-Anwendung als sehr umständlich.', controlName: 'sus8' },
    { label: 'Ich habe mich bei der Nutzung dieser AR-Anwendung sehr sicher gefühlt.', controlName: 'sus9' },
    { label: 'Ich musste eine Menge Dinge lernen, bevor ich mit dieser AR-Anwendung arbeiten konnte.', controlName: 'sus10' }
  ];
  

  constructor() {
    this.logInteraction = this.logInteraction.bind(this);
  }

  ngOnInit() {
    this.createForm();
  }

  logInteraction(event: Event) {
    this.metricsService.logInteraction(event);
  }

  createForm() {
    this.demographicsForm = this.formBuilder.group({
      // Ergonomics and Physical Feedback
      comfortHold: [null, Validators.required],
      enduranceFiveMinutes: [null, Validators.required],
      physicalStrain: [null, Validators.required],
      physicalStrain5min: [null, Validators.required],
      userPosition: [null, Validators.required], // ++ ADDED THIS LINE ++

      // Demographics
      age: [null, [Validators.required, Validators.min(13), Validators.max(120)]],
      gender: [null, Validators.required],

      arExperience: [null, Validators.required],
      vrExperience: [null, Validators.required],

      visionCorrection: [null],
      dominantHand: [null],

      sus1: [null, Validators.required],
      sus2: [null, Validators.required],
      sus3: [null, Validators.required],
      sus4: [null, Validators.required],
      sus5: [null, Validators.required],
      sus6: [null, Validators.required],
      sus7: [null, Validators.required],
      sus8: [null, Validators.required],
      sus9: [null, Validators.required],
      sus10: [null, Validators.required],

      comments: [''],
    });
  }

  onSubmit() {
    if (this.demographicsForm.valid) {
      this.isSubmitting = true;

      const formData = {
        ...this.demographicsForm.value,
        susScore: this.calculateSusScore(this.demographicsForm.value),
        submittedAt: new Date().toISOString()
      };

      this.metricsService.sendMetricsToServer(formData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.isSubmitted = true;
          setTimeout(() => this.testComplete.emit(), 2000);
        },
        error: (err) => {
          console.error("FINAL SUBMISSION FAILED:", err);
          this.isSubmitting = false;
        }
      });

    } else {
      this.demographicsForm.markAllAsTouched();
      console.error("Form is invalid. Please fill out all required fields.");
    }
  }

  private calculateSusScore(formData: any): number {
    let score = 0;
    score += (formData.sus1 - 1);
    score += (formData.sus3 - 1);
    score += (formData.sus5 - 1);
    score += (formData.sus7 - 1);
    score += (formData.sus9 - 1);
    score += (5 - formData.sus2);
    score += (5 - formData.sus4);
    score += (5 - formData.sus6);
    score += (5 - formData.sus8);
    score += (5 - formData.sus10);
    return score * 2.5;
  }
}