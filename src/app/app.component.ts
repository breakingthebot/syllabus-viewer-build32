// src/app/app.component.ts
// Handles UI state, accordion toggles, search filtering, progress tracking, and JSON editor validation.
// Created: 2026-07-19

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SyllabusService } from './services/syllabus.service';
import { Syllabus, CheckedStates, WeeklyModule, CategoryGrades, GradeItem, StudySession } from './models/syllabus.model';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'syllabus-viewer';
  syllabus!: Syllabus;
  checkedStates!: CheckedStates;
  profiles: any[] = [];
  activeProfileCode: string = '';
  
  activeTab: 'schedule' | 'grading' | 'planner' | 'editor' = 'schedule';
  searchQuery: string = '';
  filterType: 'all' | 'readings' | 'assignments' = 'all';
  expandedWeek: number | null = 1;
  editorJson: string = '';
  jsonError: string | null = null;
  showResetToast: boolean = false;

  // New course modal properties
  showAddCourseModal: boolean = false;
  newCourseCode: string = '';
  newCourseTitle: string = '';
  newCourseDesc: string = '';
  newInstructorName: string = '';
  newInstructorEmail: string = '';

  progress = { total: 0, completed: 0, percentage: 0 };
  upcomingDeadlines: any[] = [];
  weeklyWorkload: any[] = [];
  analyticsMetrics = {
    totalReadings: 0,
    completedReadings: 0,
    readingsPercentage: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    assignmentsPercentage: 0,
    totalHoursEst: 0
  };
  showAnalytics: boolean = true;

  // Grade Tracker properties
  grades!: CategoryGrades;
  projectedScore: number | null = null;
  projectedLetter: string = 'N/A';
  targetFinalGrade: number = 90;
  requiredRemainingScore: number | null = null;
  targetWarningMessage: string | null = null;

  showAddGradeForm: { [category: string]: boolean } = {};
  newGradeLabel: string = '';
  newGradeScore: number = 100;

  // Study Planner properties
  studySessions: StudySession[] = [];
  selectedSchedAssignmentId: string = '';
  sessionSchedDate: string = '';
  sessionSchedStartTime: string = '14:00';
  sessionSchedEndTime: string = '16:00';
  sessionSchedNotes: string = '';

  private subs = new Subscription();

  constructor(private syllabusService: SyllabusService) {}

  ngOnInit(): void {
    // Subscribe to Syllabus updates
    this.subs.add(
      this.syllabusService.getSyllabus$().subscribe(syllabus => {
        this.syllabus = syllabus;
        this.editorJson = JSON.stringify(syllabus, null, 2);
        this.validateJson();
        this.updateProgress();
        this.updateUpcomingDeadlines();
        this.updateAnalytics();
      })
    );

    // Subscribe to Checked States updates
    this.subs.add(
      this.syllabusService.getCheckedStates$().subscribe(states => {
        this.checkedStates = states;
        this.updateProgress();
        this.updateUpcomingDeadlines();
        this.updateAnalytics();
      })
    );

    // Subscribe to Course Profiles
    this.subs.add(
      this.syllabusService.getProfiles$().subscribe(profiles => {
        this.profiles = profiles;
      })
    );

    // Subscribe to Active Profile Code
    this.subs.add(
      this.syllabusService.getActiveProfileCode$().subscribe(code => {
        this.activeProfileCode = code;
      })
    );

    // Subscribe to Grades updates
    this.subs.add(
      this.syllabusService.getGrades$().subscribe(grades => {
        this.grades = grades;
        this.calculateGradeProjections();
      })
    );

    // Subscribe to Study Sessions updates
    this.subs.add(
      this.syllabusService.getSessions$().subscribe(sessions => {
        this.studySessions = sessions;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  switchTab(tab: 'schedule' | 'grading' | 'planner' | 'editor'): void {
    this.activeTab = tab;
  }

  toggleWeek(weekNum: number): void {
    if (this.expandedWeek === weekNum) {
      this.expandedWeek = null;
    } else {
      this.expandedWeek = weekNum;
    }
  }

  toggleReading(weekNum: number, idx: number): void {
    this.syllabusService.toggleReading(weekNum, idx);
  }

  toggleAssignment(weekNum: number, id: string): void {
    this.syllabusService.toggleAssignment(weekNum, id);
  }

  resetAllProgress(): void {
    this.syllabusService.resetCheckedStates();
    this.showResetToast = true;
    setTimeout(() => {
      this.showResetToast = false;
    }, 3000);
  }

  printSyllabus(): void {
    window.print();
  }

  exportCalendarIcs(): void {
    if (!this.syllabus || !this.syllabus.schedule) return;

    const icsContent: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Academic Syllabus Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const now = new Date();
    const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    this.syllabus.schedule.forEach(module => {
      // 1. Add weekly topic event (Monday of that course week to Friday)
      const startBase = new Date('2026-09-07T00:00:00');
      const weekStart = new Date(startBase.getTime());
      weekStart.setDate(startBase.getDate() + (module.week - 1) * 7);
      
      const weekEnd = new Date(weekStart.getTime());
      weekEnd.setDate(weekStart.getDate() + 5);

      const yyyymmddStart = this.formatIcsDate(weekStart);
      const yyyymmddEnd = this.formatIcsDate(weekEnd);

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:week-${module.week}-${this.syllabus.courseCode}@syllabus-viewer.vercel.app`);
      icsContent.push(`DTSTAMP:${dtstamp}`);
      icsContent.push(`DTSTART;VALUE=DATE:${yyyymmddStart}`);
      icsContent.push(`DTEND;VALUE=DATE:${yyyymmddEnd}`);
      icsContent.push(`SUMMARY:[${this.syllabus.courseCode}] Week ${module.week}: ${module.title}`);
      icsContent.push(`DESCRIPTION:${module.description.replace(/,/g, '\\,')}`);
      icsContent.push('END:VEVENT');

      // 2. Add individual assignment due dates
      module.assignments.forEach((assign, index) => {
        const dueDateStr = assign.dueDate;
        if (!dueDateStr) return;

        const parsedDate = new Date(dueDateStr + 'T12:00:00');
        const nextDay = new Date(parsedDate.getTime());
        nextDay.setDate(parsedDate.getDate() + 1);

        const yyyymmddDue = this.formatIcsDate(parsedDate);
        const yyyymmddDueEnd = this.formatIcsDate(nextDay);

        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:assign-${assign.id || 'w' + module.week + '-a' + index}-${this.syllabus.courseCode}@syllabus-viewer.vercel.app`);
        icsContent.push(`DTSTAMP:${dtstamp}`);
        icsContent.push(`DTSTART;VALUE=DATE:${yyyymmddDue}`);
        icsContent.push(`DTEND;VALUE=DATE:${yyyymmddDueEnd}`);
        icsContent.push(`SUMMARY:[${this.syllabus.courseCode}] Due: ${assign.label}`);
        icsContent.push(`DESCRIPTION:Assignment deliverable from course syllabus week ${module.week}.`);
        icsContent.push('END:VEVENT');
      });
    });

    icsContent.push('END:VCALENDAR');

    const calendarData = icsContent.join('\r\n');
    
    try {
      const blob = new Blob([calendarData], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${this.syllabus.courseCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_schedule.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to generate calendar file download', e);
    }
  }

  private formatIcsDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  getDueDaysDiff(dueDateStr: string): number {
    if (!dueDateStr) return 999;
    const due = new Date(dueDateStr + 'T23:59:59');
    const today = new Date();
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getCountdownText(dueDateStr: string, isCompleted: boolean): string {
    if (isCompleted) return '✓ Done';
    const diff = this.getDueDaysDiff(dueDateStr);
    if (diff < 0) return `Overdue by ${Math.abs(diff)}d`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `Due in ${diff}d`;
  }

  getCountdownClass(dueDateStr: string, isCompleted: boolean): string {
    if (isCompleted) return 'completed';
    const diff = this.getDueDaysDiff(dueDateStr);
    if (diff < 0 || diff === 0) return 'danger';
    if (diff === 1) return 'warning';
    if (diff <= 7) return 'soon';
    return 'future';
  }

  updateUpcomingDeadlines(): void {
    if (!this.syllabus || !this.syllabus.schedule) {
      this.upcomingDeadlines = [];
      return;
    }
    
    const list: any[] = [];
    this.syllabus.schedule.forEach(module => {
      module.assignments.forEach(assign => {
        const isCompleted = this.checkedStates?.assignments[`w${module.week}-a-${assign.id}`] || false;
        if (!isCompleted) {
          const diff = this.getDueDaysDiff(assign.dueDate);
          // Alert if overdue or due in 60 days (supports demo seeding)
          if (diff <= 60) {
            list.push({
              ...assign,
              week: module.week,
              diff
            });
          }
        }
      });
    });

    // Sort by due date (soonest/most overdue first)
    list.sort((a, b) => a.diff - b.diff);
    this.upcomingDeadlines = list;
  }

  toggleAnalytics(): void {
    this.showAnalytics = !this.showAnalytics;
  }

  updateAnalytics(): void {
    if (!this.syllabus || !this.syllabus.schedule) {
      this.weeklyWorkload = [];
      return;
    }

    let totalR = 0;
    let compR = 0;
    let totalA = 0;
    let compA = 0;
    const workloadList: any[] = [];
    let maxHours = 0;

    this.syllabus.schedule.forEach(module => {
      const rCount = module.readings ? module.readings.length : 0;
      const aCount = module.assignments ? module.assignments.length : 0;

      totalR += rCount;
      totalA += aCount;

      module.readings?.forEach((_, idx) => {
        if (this.checkedStates?.readings[`w${module.week}-r${idx}`]) {
          compR++;
        }
      });

      module.assignments?.forEach(assign => {
        if (this.checkedStates?.assignments[`w${module.week}-a-${assign.id}`]) {
          compA++;
        }
      });

      const hours = (rCount * 0.5) + (aCount * 2.5);
      if (hours > maxHours) maxHours = hours;

      let complexity: 'light' | 'medium' | 'heavy' = 'light';
      if (hours > 6) complexity = 'heavy';
      else if (hours >= 3) complexity = 'medium';

      workloadList.push({
        week: module.week,
        title: module.title,
        readingsCount: rCount,
        assignmentsCount: aCount,
        hours,
        complexityLevel: complexity
      });
    });

    const maxVal = maxHours || 1;
    this.weeklyWorkload = workloadList.map(w => ({
      ...w,
      percentHeight: Math.max(15, (w.hours / maxVal) * 100)
    }));

    const totalHoursEst = (totalR * 0.5) + (totalA * 2.5);

    this.analyticsMetrics = {
      totalReadings: totalR,
      completedReadings: compR,
      readingsPercentage: totalR ? Math.round((compR / totalR) * 100) : 0,
      totalAssignments: totalA,
      completedAssignments: compA,
      assignmentsPercentage: totalA ? Math.round((compA / totalA) * 100) : 0,
      totalHoursEst: Math.round(totalHoursEst * 10) / 10
    };
  }

  calculateGradeProjections(): void {
    if (!this.syllabus || !this.syllabus.grading || !this.grades) return;

    let totalGradedWeight = 0;
    let totalWeightedScore = 0;

    this.syllabus.grading.forEach(item => {
      const catGrades = this.grades[item.label] || [];
      if (catGrades.length > 0) {
        const avg = catGrades.reduce((sum, g) => sum + g.score, 0) / catGrades.length;
        totalGradedWeight += item.weightPercentage;
        totalWeightedScore += avg * (item.weightPercentage / 100);
      }
    });

    if (totalGradedWeight > 0) {
      this.projectedScore = Math.round((totalWeightedScore / (totalGradedWeight / 100)) * 10) / 10;
      this.projectedLetter = this.getLetterGrade(this.projectedScore);
    } else {
      this.projectedScore = null;
      this.projectedLetter = 'N/A';
    }

    const remainingWeight = 100 - totalGradedWeight;
    if (remainingWeight > 0) {
      const needed = (this.targetFinalGrade - (totalWeightedScore * 100)) / (remainingWeight / 100);
      this.requiredRemainingScore = Math.round(needed * 10) / 10;
      if (needed > 100) {
        this.targetWarningMessage = `⚠️ Mathematically impossible (requires ${this.requiredRemainingScore}% average on ungraded items).`;
      } else if (needed < 0) {
        this.targetWarningMessage = `🎉 Secured! (You need a 0% average on remaining items to reach target).`;
      } else {
        this.targetWarningMessage = null;
      }
    } else {
      this.requiredRemainingScore = null;
      this.targetWarningMessage = this.projectedScore && this.projectedScore >= this.targetFinalGrade
        ? '🎉 Target Achieved!'
        : '❌ Class is finished. Target not met.';
    }
  }

  getLetterGrade(score: number): string {
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 60) return 'D';
    return 'F';
  }

  addGrade(category: string): void {
    if (!this.newGradeLabel.trim() || this.newGradeScore === null || this.newGradeScore === undefined) return;
    this.syllabusService.addGrade(category, this.newGradeLabel.trim(), this.newGradeScore);
    
    this.newGradeLabel = '';
    this.newGradeScore = 100;
    this.showAddGradeForm[category] = false;
  }

  deleteGrade(category: string, id: string): void {
    this.syllabusService.deleteGrade(category, id);
  }
  
  toggleAddGradeForm(category: string): void {
    this.showAddGradeForm[category] = !this.showAddGradeForm[category];
  }

  calculateCategoryAvg(category: string): number {
    if (!this.grades) return 0;
    const list = this.grades[category] || [];
    if (list.length === 0) return 0;
    const avg = list.reduce((sum, g) => sum + g.score, 0) / list.length;
    return Math.round(avg * 10) / 10;
  }

  getSchedulableAssignments(): any[] {
    if (!this.syllabus || !this.syllabus.schedule) return [];
    const list: any[] = [];
    this.syllabus.schedule.forEach(module => {
      module.assignments?.forEach(assign => {
        list.push({
          id: assign.id,
          label: `[W${module.week}] ${assign.label}`
        });
      });
    });
    return list;
  }

  scheduleSession(): void {
    if (!this.selectedSchedAssignmentId || !this.sessionSchedDate) return;
    
    const all = this.getSchedulableAssignments();
    const match = all.find(a => a.id === this.selectedSchedAssignmentId);
    const label = match ? match.label : 'Study Session';

    this.syllabusService.addStudySession(
      this.selectedSchedAssignmentId,
      label,
      this.sessionSchedDate,
      this.sessionSchedStartTime,
      this.sessionSchedEndTime,
      this.sessionSchedNotes
    );

    this.selectedSchedAssignmentId = '';
    this.sessionSchedDate = '';
    this.sessionSchedNotes = '';
  }

  deleteSession(id: string): void {
    this.syllabusService.deleteStudySession(id);
  }

  toggleSessionCompletion(id: string): void {
    this.syllabusService.toggleStudySessionCompletion(id);
  }

  getSessionStatus(session: StudySession): string {
    if (session.completed) return '✓ Completed';

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    if (session.date < todayStr) {
      return 'Expired';
    } else if (session.date === todayStr) {
      const timeNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (timeNow >= session.startTime && timeNow <= session.endTime) {
        return '⚡ Active Now';
      } else if (timeNow > session.endTime) {
        return 'Ended';
      } else {
        return 'Scheduled Today';
      }
    } else {
      const diffTime = Math.abs(new Date(session.date).getTime() - new Date(todayStr).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `Starts in ${diffDays}d`;
    }
  }

  switchProfile(code: string): void {
    this.syllabusService.switchProfile(code);
    this.expandedWeek = 1;
  }

  deleteActiveProfile(): void {
    if (this.profiles.length <= 1) return;
    const confirmDelete = confirm(`Are you sure you want to delete the course "${this.syllabus.title}" (${this.activeProfileCode})?`);
    if (confirmDelete) {
      this.syllabusService.deleteProfile(this.activeProfileCode);
      this.expandedWeek = 1;
    }
  }

  createNewCourse(): void {
    if (!this.newCourseCode.trim() || !this.newCourseTitle.trim()) return;
    
    const newSyllabus: Syllabus = {
      title: this.newCourseTitle.trim(),
      courseCode: this.newCourseCode.trim().toUpperCase(),
      description: this.newCourseDesc.trim() || 'No description provided.',
      instructor: {
        name: this.newInstructorName.trim() || 'TBD',
        email: this.newInstructorEmail.trim() || 'tbd@university.edu',
        office: 'TBD',
        officeHours: 'TBD',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
      },
      grading: [
        { label: 'Weekly Tasks & Quizzes', weightPercentage: 40 },
        { label: 'Final Examination', weightPercentage: 60 }
      ],
      schedule: [
        {
          week: 1,
          title: 'Introduction to Course Frameworks',
          description: 'Initial syllabus outline, study goals, and assignment timelines.',
          readings: ['Syllabus Guidelines Document'],
          assignments: [
            { id: 'w1-a1', label: 'Assignment 1: Student Welcome Checklist', dueDate: '2026-09-01' }
          ]
        }
      ],
      policies: [
        {
          title: 'Academic Performance Expectations',
          content: 'Students are expected to submit coursework on time. Late submissions will undergo scoring penalties.'
        }
      ]
    };

    this.syllabusService.createProfile(newSyllabus);
    
    this.newCourseCode = '';
    this.newCourseTitle = '';
    this.newCourseDesc = '';
    this.newInstructorName = '';
    this.newInstructorEmail = '';
    this.showAddCourseModal = false;
    this.expandedWeek = 1;
  }

  updateProgress(): void {
    if (this.syllabus && this.checkedStates) {
      this.progress = this.syllabusService.getProgressMetrics(this.syllabus, this.checkedStates);
    }
  }

  getWeekCompletion(module: WeeklyModule): number {
    let total = 0;
    let completed = 0;

    // Readings completed
    module.readings.forEach((_, idx) => {
      total++;
      const key = `w${module.week}-r${idx}`;
      if (this.checkedStates.readings[key]) {
        completed++;
      }
    });

    // Assignments completed
    module.assignments.forEach(assign => {
      total++;
      const key = `w${module.week}-a-${assign.id}`;
      if (this.checkedStates.assignments[key]) {
        completed++;
      }
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  validateJson(): void {
    try {
      const parsed = JSON.parse(this.editorJson);
      
      // Structural validations
      if (!parsed.title || !parsed.courseCode || !parsed.description) {
        this.jsonError = 'Required base properties missing: title, courseCode, and description are required.';
        return;
      }
      if (!parsed.instructor || !parsed.instructor.name || !parsed.instructor.email) {
        this.jsonError = 'Instructor profile is incomplete: name and email are required.';
        return;
      }
      if (!Array.isArray(parsed.grading)) {
        this.jsonError = 'Grading breakdown must be an array.';
        return;
      }
      if (!Array.isArray(parsed.schedule)) {
        this.jsonError = 'Schedule must be a weekly modules array.';
        return;
      }
      if (!Array.isArray(parsed.policies)) {
        this.jsonError = 'Policies must be an array.';
        return;
      }
      
      this.jsonError = null;
    } catch (e) {
      this.jsonError = e instanceof Error ? e.message : 'Invalid JSON format.';
    }
  }

  applySyllabusJson(): void {
    if (this.jsonError) return;
    try {
      const parsed = JSON.parse(this.editorJson);
      this.syllabusService.updateSyllabus(parsed);
      this.switchTab('schedule');
    } catch (e) {
      this.jsonError = e instanceof Error ? e.message : 'Failed to apply JSON syllabus.';
    }
  }

  resetSyllabusToDefault(): void {
    localStorage.removeItem('@syllabus_viewer/syllabus');
    // Re-seed default config by calling internal logic
    const defaultSyllabusVal = {
      title: 'Advanced Web Engineering',
      courseCode: 'CS-301',
      description: 'Deep dive into modern web application architectures, including single-page applications (Angular), state management, serverless compute, microservices, and web performance optimization patterns.',
      instructor: {
        name: 'Dr. Elena Vance',
        email: 'elena.vance@university.edu',
        office: 'Science Center, Room 402',
        officeHours: 'Tuesdays/Thursdays 2:00 PM - 4:00 PM',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
      },
      grading: [
        { label: 'Weekly Labs & Quizzes', weightPercentage: 30 },
        { label: 'Midterm Dashboard Project', weightPercentage: 25 },
        { label: 'Final Architecture Proposal', weightPercentage: 35 },
        { label: 'Class Participation', weightPercentage: 10 }
      ],
      schedule: [
        {
          week: 1,
          title: 'Client-Side Foundations & Components',
          description: 'Overview of Angular architecture, component lifecycles, inputs/outputs, standalone declarations, and styling systems.',
          readings: [
            'Angular Docs: Standalone Components Guide',
            'Clean Code: Chapter 2 - Meaningful Names'
          ],
          assignments: [
            { id: 'w1-a1', label: 'Lab 1: Design System Layout Setup', dueDate: '2026-09-10' },
            { id: 'w1-a2', label: 'Quiz 1: Component Lifecycle hooks', dueDate: '2026-09-12' }
          ]
        },
        {
          week: 2,
          title: 'Service Layers & Dependency Injection',
          description: 'Separation of concerns, HTTP clients, reactive data flows using RxJS observables, and dynamic local storage adapters.',
          readings: [
            'RxJS Docs: Introduction to Observables',
            'Angular Docs: Dependency Injection Architecture'
          ],
          assignments: [
            { id: 'w2-a1', label: 'Lab 2: Async Data Aggregator Pipeline', dueDate: '2026-09-17' }
          ]
        },
        {
          week: 3,
          title: 'State Management & Reactive Forms',
          description: 'Model-driven input forms, custom validation rules, loading overlays, error toast alerts, and state aggregation principles.',
          readings: [
            'Angular Docs: Reactive Forms Guide',
            'UX Design Principles: Client-Side Input Validations'
          ],
          assignments: [
            { id: 'w3-a1', label: 'Midterm: Interactive Syllabus App Build', dueDate: '2026-09-24' }
          ]
        },
        {
          week: 4,
          title: 'Routing, Guards & Micro-Frontends',
          description: 'Client-side route mappings, lazy loaded modules, authentication route guards, and multi-view layouts.',
          readings: [
            'Angular Docs: Routing & Navigation Guide',
            'Web Security: Token Bearer Storage & Expiry Handling'
          ],
          assignments: [
            { id: 'w4-a1', label: 'Lab 3: Guarded Route Scenarios Setup', dueDate: '2026-10-01' }
          ]
        },
        {
          week: 5,
          title: 'Serverless Deployments & Edge Cache Routing',
          description: 'Cloud architectures, edge functions, CDN cache validations, Vercel deployments, and production environment variables.',
          readings: [
            'Serverless Architectures: Section 4 Overview',
            'Vercel Docs: Edge Routing & Environment Configurations'
          ],
          assignments: [
            { id: 'w5-a1', label: 'Lab 4: Cloud Pipeline Vercel Deploy', dueDate: '2026-10-08' }
          ]
        },
        {
          week: 6,
          title: 'Testing & Code Quality Coverage Enforcements',
          description: 'Unit test setup, mocking external services, Jasmine spies, test runners, and coverage reports integration.',
          readings: [
            'Jasmine Docs: Spies & Custom Matchers',
            'Angular Docs: Component Testing Guides'
          ],
          assignments: [
            { id: 'w6-a1', label: 'Final Submission: Fully Tested Syllabus Application', dueDate: '2026-10-15' }
          ]
        }
      ],
      policies: [
        {
          title: 'Academic Integrity',
          content: 'All work submitted must be your own. Collaborations are permitted only when explicitly specified in writing. Plagiarism of code or text will result in an automatic grade of F for the course.'
        },
        {
          title: 'Late Submission Policy',
          content: 'Assignments submitted after the deadline will receive a 10% penalty per day. Submissions will not be accepted later than 3 days after the original due date.'
        },
        {
          title: 'Accessibility Services',
          content: 'If you require accommodations due to a verified disability, please contact the Student Services Office immediately to coordinate appropriate adjustments.'
        }
      ]
    };
    this.syllabusService.updateSyllabus(defaultSyllabusVal);
    this.syllabusService.resetCheckedStates();
  }

  // Reactive filters
  get filteredSchedule(): WeeklyModule[] {
    if (!this.syllabus) return [];
    const query = this.searchQuery.trim().toLowerCase();
    
    return this.syllabus.schedule.map(module => {
      if (!query) return module;
      
      const matchesTitle = module.title.toLowerCase().includes(query) ||
                           module.description.toLowerCase().includes(query);
                           
      const matchedReadings = module.readings.filter(r => r.toLowerCase().includes(query));
      const matchedAssignments = module.assignments.filter(a => a.label.toLowerCase().includes(query));
      
      if (matchesTitle || matchedReadings.length > 0 || matchedAssignments.length > 0) {
        return {
          ...module,
          readings: matchesTitle ? module.readings : matchedReadings,
          assignments: matchesTitle ? module.assignments : matchedAssignments
        };
      }
      return null;
    }).filter((m): m is WeeklyModule => m !== null);
  }

  get filteredAndTypeScheduled(): WeeklyModule[] {
    return this.filteredSchedule.map(module => {
      return {
        ...module,
        readings: this.filterType === 'assignments' ? [] : module.readings,
        assignments: this.filterType === 'readings' ? [] : module.assignments
      };
    }).filter(m => m.readings.length > 0 || m.assignments.length > 0 || !this.searchQuery);
  }
}
