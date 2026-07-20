// src/app/app.component.spec.ts
// Unit tests for the AppComponent root view.
// Created: 2026-07-19

import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { StudySession } from './models/syllabus.model';

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

  it('should calculate analytics metrics and workload correctly', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    expect(app.analyticsMetrics.totalReadings).toBeGreaterThan(0);
    expect(app.analyticsMetrics.totalAssignments).toBeGreaterThan(0);
    expect(app.analyticsMetrics.totalHoursEst).toBeGreaterThan(0);
    expect(app.weeklyWorkload.length).toBe(6);
  });

  it('should toggle analytics view state', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    expect(app.showAnalytics).toBeTrue();
    app.toggleAnalytics();
    expect(app.showAnalytics).toBeFalse();
  });

  it('should calculate grade projections correctly', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    expect(app.projectedScore).toBeNull();
    expect(app.projectedLetter).toBe('N/A');

    app.grades = {
      'Weekly Labs & Quizzes': [
        { id: 'g1', label: 'Quiz 1', score: 90 },
        { id: 'g2', label: 'Quiz 2', score: 100 }
      ]
    };
    app.calculateGradeProjections();

    expect(app.projectedScore).toBe(95);
    expect(app.projectedLetter).toBe('A');

    app.grades['Final Architecture Proposal'] = [
      { id: 'g3', label: 'Final Proposal', score: 80 }
    ];
    app.calculateGradeProjections();

    // Graded weights: Weekly Labs & Quizzes (30%), Final Architecture Proposal (35%)
    // (95 * 30 + 80 * 35) / 65 = 86.92%
    expect(app.projectedScore).toBe(86.9);
    expect(app.projectedLetter).toBe('B');
  });

  it('should compute letter grade ranges correctly', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    expect(app.getLetterGrade(95)).toBe('A');
    expect(app.getLetterGrade(91)).toBe('A-');
    expect(app.getLetterGrade(88)).toBe('B+');
    expect(app.getLetterGrade(85)).toBe('B');
    expect(app.getLetterGrade(81)).toBe('B-');
    expect(app.getLetterGrade(78)).toBe('C+');
    expect(app.getLetterGrade(75)).toBe('C');
    expect(app.getLetterGrade(71)).toBe('C-');
    expect(app.getLetterGrade(65)).toBe('D');
    expect(app.getLetterGrade(50)).toBe('F');
  });

  it('should compile flat schedulable assignments list', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    const list = app.getSchedulableAssignments();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBeDefined();
    expect(list[0].label).toContain('[W1]');
  });

  it('should correctly determine study session statuses', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const completedSession: StudySession = {
      id: 's1',
      assignmentId: 'a1',
      assignmentLabel: 'Task 1',
      date: todayStr,
      startTime: '10:00',
      endTime: '12:00',
      notes: '',
      completed: true
    };
    expect(app.getSessionStatus(completedSession)).toBe('✓ Completed');

    const expiredSession: StudySession = {
      id: 's2',
      assignmentId: 'a1',
      assignmentLabel: 'Task 1',
      date: '2020-01-01',
      startTime: '10:00',
      endTime: '12:00',
      notes: '',
      completed: false
    };
    expect(app.getSessionStatus(expiredSession)).toBe('Expired');
  });
});
