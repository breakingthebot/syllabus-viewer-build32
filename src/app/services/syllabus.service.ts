// src/app/services/syllabus.service.ts
// Handles syllabus state, default data seeding, localStorage I/O, search filters, and progress metrics.
// Created: 2026-07-19

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Syllabus, CheckedStates } from '../models/syllabus.model';

const SYLLABUS_STORAGE_KEY = '@syllabus_viewer/syllabus';
const CHECKED_STORAGE_KEY = '@syllabus_viewer/checked_states';

const DEFAULT_SYLLABUS: Syllabus = {
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

@Injectable({
  providedIn: 'root'
})
export class SyllabusService {
  private syllabusSubject: BehaviorSubject<Syllabus>;
  private checkedSubject: BehaviorSubject<CheckedStates>;

  constructor() {
    // Load or seed Syllabus
    let storedSyllabus = DEFAULT_SYLLABUS;
    try {
      const raw = localStorage.getItem(SYLLABUS_STORAGE_KEY);
      if (raw) {
        storedSyllabus = JSON.parse(raw);
      } else {
        localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(DEFAULT_SYLLABUS));
      }
    } catch (e) {
      console.warn('LocalStorage not available, running in-memory.', e);
    }
    this.syllabusSubject = new BehaviorSubject<Syllabus>(storedSyllabus);

    // Load Checked States
    const initialChecked: CheckedStates = { readings: {}, assignments: {} };
    try {
      const rawChecked = localStorage.getItem(CHECKED_STORAGE_KEY);
      if (rawChecked) {
        const parsed = JSON.parse(rawChecked);
        initialChecked.readings = parsed.readings || {};
        initialChecked.assignments = parsed.assignments || {};
      } else {
        localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(initialChecked));
      }
    } catch (e) {
      console.warn('LocalStorage not available for checked states.', e);
    }
    this.checkedSubject = new BehaviorSubject<CheckedStates>(initialChecked);
  }

  getSyllabus$(): Observable<Syllabus> {
    return this.syllabusSubject.asObservable();
  }

  getSyllabusValue(): Syllabus {
    return this.syllabusSubject.getValue();
  }

  getCheckedStates$(): Observable<CheckedStates> {
    return this.checkedSubject.asObservable();
  }

  getCheckedStatesValue(): CheckedStates {
    return this.checkedSubject.getValue();
  }

  updateSyllabus(newSyllabus: Syllabus): void {
    try {
      localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(newSyllabus));
    } catch (e) {
      console.error('Failed to write syllabus to localStorage', e);
    }
    this.syllabusSubject.next(newSyllabus);
  }

  toggleReading(weekNum: number, readingIndex: number): void {
    const key = `w${weekNum}-r${readingIndex}`;
    const current = this.checkedSubject.getValue();
    const updatedReadings = { ...current.readings, [key]: !current.readings[key] };
    const updated = { ...current, readings: updatedReadings };

    this.saveCheckedStates(updated);
  }

  toggleAssignment(weekNum: number, assignmentId: string): void {
    const key = `w${weekNum}-a-${assignmentId}`;
    const current = this.checkedSubject.getValue();
    const updatedAssignments = { ...current.assignments, [key]: !current.assignments[key] };
    const updated = { ...current, assignments: updatedAssignments };

    this.saveCheckedStates(updated);
  }

  resetCheckedStates(): void {
    const cleared: CheckedStates = { readings: {}, assignments: {} };
    this.saveCheckedStates(cleared);
  }

  private saveCheckedStates(states: CheckedStates): void {
    try {
      localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(states));
    } catch (e) {
      console.error('Failed to save checked states to localStorage', e);
    }
    this.checkedSubject.next(states);
  }

  getProgressMetrics(syllabus: Syllabus, states: CheckedStates): { total: number; completed: number; percentage: number } {
    let total = 0;
    let completed = 0;

    syllabus.schedule.forEach(module => {
      // Readings count
      module.readings.forEach((_, idx) => {
        total++;
        const key = `w${module.week}-r${idx}`;
        if (states.readings[key]) {
          completed++;
        }
      });

      // Assignments count
      module.assignments.forEach(assign => {
        total++;
        const key = `w${module.week}-a-${assign.id}`;
        if (states.assignments[key]) {
          completed++;
        }
      });
    });

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }
}
