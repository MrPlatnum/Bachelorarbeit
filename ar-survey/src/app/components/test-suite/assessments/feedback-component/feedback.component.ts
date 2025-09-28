import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MetricsTrackerService } from '../../../../services/metrics-tracker.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './feedback.component.html',
})
export class FeedbackComponent implements OnInit {
  private metricsService = inject(MetricsTrackerService);
  private formBuilder = inject(FormBuilder);

  @Output() testComplete = new EventEmitter<void>();

  feedbackForm!: FormGroup;
  isSubmitting = false;
  isSubmitted = false;

  usabilityItems = [
    { label: 'Ich denke, dass ich diese AR-Anwendung gerne regelmäßig nutzen würde.', controlName: 'usability1' },
    { label: 'Ich empfinde diese AR-Anwendung als unnötig komplex.', controlName: 'usability2' },
    { label: 'Ich empfinde diese AR-Anwendung als einfach zu nutzen.', controlName: 'usability3' },
    { label: 'Ich denke, dass ich technischen Support brauchen würde, um diese AR-Anwendung zu nutzen.', controlName: 'usability4' },
    { label: 'Ich finde, dass die verschiedenen Funktionen dieser AR-Anwendung gut integriert sind.', controlName: 'usability5' },
    { label: 'Ich finde, dass es in dieser AR-Anwendung zu viele Inkonsistenzen gibt.', controlName: 'usability6' },
    { label: 'Ich kann mir vorstellen, dass die meisten Leute diese AR-Anwendung schnell zu beherrschen lernen.', controlName: 'usability7' },
    { label: 'Ich empfinde die Bedienung dieser AR-Anwendung als sehr umständlich.', controlName: 'usability8' },
    { label: 'Ich habe mich bei der Nutzung dieser AR-Anwendung sehr sicher gefühlt.', controlName: 'usability9' },
    { label: 'Ich musste eine Menge Dinge lernen, bevor ich mit dieser AR-Anwendung arbeiten konnte.', controlName: 'usability10' }
  ];

  harItems = [
    { label: 'Ich finde, dass die Interaktion mit dieser Anwendung eine hohe körperliche Muskelanstrengung erfordert.', controlName: 'har1' },
    { label: 'Ich empfand die Nutzung der Anwendung als angenehm für meine Arme und Hände.', controlName: 'har2' },
    { label: 'Ich fand es schwierig, das Gerät während der Bedienung der Anwendung zu halten.', controlName: 'har3' },
    { label: 'Ich fand es einfach, Informationen über die Anwendung einzugeben.', controlName: 'har4' },
    { label: 'Ich hatte das Gefühl, dass mein Arm oder meine Hand nach der Nutzung der Anwendung müde wurde.', controlName: 'har5' },
    { label: 'Ich denke, die Anwendung ist einfach zu steuern.', controlName: 'har6' },
    { label: 'Ich hatte das Gefühl, dass ich irgendwann den Halt verlor und das Gerät fallen ließ.', controlName: 'har7' },
    { label: 'Ich denke, die Bedienung dieser Anwendung ist einfach und unkompliziert.', controlName: 'har8' },
    { label: 'Ich denke, dass die Interaktion mit dieser Anwendung eine hohe geistige Anstrengung erfordert.', controlName: 'har9' },
    { label: 'Ich fand die Menge der auf dem Bildschirm angezeigten Informationen angemessen.', controlName: 'har10' },
    { label: 'Ich fand die auf dem Bildschirm angezeigten Informationen schwer lesbar.', controlName: 'har11' },
    { label: 'Ich hatte das Gefühl, dass die Informationsanzeige schnell genug reagierte.', controlName: 'har12' },
    { label: 'Ich fand die auf dem Bildschirm angezeigten Informationen verwirrend.', controlName: 'har13' },
    { label: 'Ich fand die Wörter und Symbole auf dem Bildschirm leicht lesbar.', controlName: 'har14' },
    { label: 'Ich hatte das Gefühl, dass das Display zu stark flimmerte.', controlName: 'har15' },
    { label: 'Ich fand die auf dem Bildschirm angezeigten Informationen konsistent.', controlName: 'har16' }
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
    const formControls: { [key: string]: any } = {
      age: [null, [Validators.required, Validators.min(13), Validators.max(120)]],
      gender: [null, Validators.required],
      arExperience: [null, Validators.required],
      vrExperience: [null, Validators.required],
      comments: [''],
    };
    this.usabilityItems.forEach(item => { formControls[item.controlName] = [null, Validators.required]; });
    this.harItems.forEach(item => { formControls[item.controlName] = [null, Validators.required]; });
    this.feedbackForm = this.formBuilder.group(formControls);
  }

  onSubmit() {
    if (this.feedbackForm.valid) {
      this.isSubmitting = true;
      const formData = {
        ...this.feedbackForm.value,
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
      this.feedbackForm.markAllAsTouched();
      console.error("Form is invalid. Please fill out all required fields.");
    }
  }
}
