// src/app/app.component.spec.ts
// Unit tests for the AppComponent root view.
// Created: 2026-07-19

import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

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
});
