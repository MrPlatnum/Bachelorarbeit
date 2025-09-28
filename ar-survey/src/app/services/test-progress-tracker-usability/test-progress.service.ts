import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TestProgressService {
  private totalTests = 2;
  private currentTestSubject = new BehaviorSubject<number>(1);
  private progressSubject = new BehaviorSubject<number>(50); // (1/totalTests) * 100

  currentTest$ = this.currentTestSubject.asObservable();
  progress$ = this.progressSubject.asObservable();

  constructor(private router: Router) {}

  getCurrentTest(): number {
    return this.currentTestSubject.value;
  }

  getTotalTests(): number {
    return this.totalTests;
  }

  nextTest(): void {
    const current = this.currentTestSubject.value;
    if (current < this.totalTests) {
      const nextTest = current + 1;
      this.currentTestSubject.next(nextTest);
      this.updateProgress(nextTest);
    } else {
      this.router.navigate(['/completion']);
    }
  }

  goToTest(testNumber: number): void {
    if (testNumber >= 1 && testNumber <= this.totalTests) {
      this.currentTestSubject.next(testNumber);
      this.updateProgress(testNumber);
    }
  }

  private updateProgress(testNumber: number): void {
    const progress = (testNumber / this.totalTests) * 100;
    this.progressSubject.next(progress);
  }

  resetProgress(): void {
    this.currentTestSubject.next(1);
    this.updateProgress(1);
  }
}