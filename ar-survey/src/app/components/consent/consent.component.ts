import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-consent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consent.component.html',
  styleUrls: ['./consent.component.css']
})
export class ConsentComponent implements OnInit {
  consentGiven = false;
  isIosDevice = false;

  constructor(
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isIosDevice = this.isIOS();
    
    if (this.isIosDevice) {
      console.log("iOS device detected. Study will be disabled.");
    }
    this.preloadTestSuite();
  }

  preloadTestSuite(): void {
    import('../test-suite/test-suit-usability/test-suite.component')
      .then(() => {
      })
      .catch(err => {
      });
  }


  isIOS(): boolean {
    const win = window as any;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !win.MSStream;
  }


  onConsentChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.consentGiven = target.checked;
  }

  startTestSuite(): void {
    if (this.consentGiven && !this.isIosDevice) {
      this.router.navigate(['/test-suite']);
    }
  }
}
