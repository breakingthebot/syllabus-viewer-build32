// src/app/app.component.spec.ts
// Unit tests for the AppComponent root view.
// Created: 2026-07-19

import { TestBed } from '@angular/core/testing';
import { AppComponent } from '../../src/app/app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
    localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'syllabus-viewer' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('syllabus-viewer');
  });

  it('should render course title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Advanced Web Engineering');
  });

  it('should format ICS calendar date correctly', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    
    const d = new Date('2026-09-07T12:00:00');
    // @ts-ignore
    const formatted = app.formatIcsDate(d);
    expect(formatted).toBe('20260907');
  });

  it('should generate ICS text data on calendar export', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
    const spyClick = spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(() => {});

    app.exportCalendarIcs();
    
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(spyClick).toHaveBeenCalled();
  });

  it('should calculate due date diff correctly', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    const target = new Date();
    target.setDate(target.getDate() + 5);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const targetStr = `${year}-${month}-${day}`;

    expect(app.getDueDaysDiff(targetStr)).toBe(5);
  });

  it('should return correct countdown text and classes', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    expect(app.getCountdownText('2026-09-10', true)).toBe('✓ Done');
    expect(app.getCountdownClass('2026-09-10', true)).toBe('completed');

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(app.getCountdownText(todayStr, false)).toBe('Due today');
    expect(app.getCountdownClass(todayStr, false)).toBe('danger');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    expect(app.getCountdownText(tomorrowStr, false)).toBe('Due tomorrow');
    expect(app.getCountdownClass(tomorrowStr, false)).toBe('warning');
  });
});
