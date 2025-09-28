import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-completion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-10 text-center">
      
      <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mb-3">
        Umfrage abgeschlossen
      </h2>
      
      <p class="text-gray-600 text-lg max-w-md mx-auto">
        Ihre Teilnahme war erfolgreich. Vielen Dank für Ihren Beitrag zu unserer Forschung.
      </p>

    </div>
  `,
  styles: []
})
export class CompletionComponent {
  constructor() { }
}
