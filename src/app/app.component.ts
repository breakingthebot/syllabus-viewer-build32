// src/app/app.component.ts
// Handles UI state, accordion toggles, search filtering, progress tracking, and JSON editor validation.
// Created: 2026-07-19

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SyllabusService } from './services/syllabus.service';
import { Syllabus, CheckedStates, WeeklyModule } from './models/syllabus.model';

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
  
  activeTab: 'schedule' | 'grading' | 'editor' = 'schedule';
  searchQuery: string = '';
  filterType: 'all' | 'readings' | 'assignments' = 'all';
  expandedWeek: number | null = 1;
  editorJson: string = '';
  jsonError: string | null = null;
  showResetToast: boolean = false;

  progress = { total: 0, completed: 0, percentage: 0 };

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
      })
    );

    // Subscribe to Checked States updates
    this.subs.add(
      this.syllabusService.getCheckedStates$().subscribe(states => {
        this.checkedStates = states;
        this.updateProgress();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  switchTab(tab: 'schedule' | 'grading' | 'editor'): void {
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
