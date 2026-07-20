// src/app/services/syllabus.service.ts
// Handles syllabus state, default data seeding, localStorage I/O, search filters, and progress metrics.
// Updated to support multiple course profiles.
// Created: 2026-07-19

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Syllabus, CheckedStates, CategoryGrades, GradeItem, StudySession } from '../models/syllabus.model';

export interface CourseProfile {
  code: string;
  title: string;
}

const PROFILES_LIST_KEY = '@syllabus_viewer/profiles';
const ACTIVE_PROFILE_KEY = '@syllabus_viewer/active_profile';

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
  private gradesSubject!: BehaviorSubject<CategoryGrades>;
  private sessionsSubject!: BehaviorSubject<StudySession[]>;
  private profilesSubject = new BehaviorSubject<CourseProfile[]>([]);
  private activeProfileCodeSubject = new BehaviorSubject<string>('');

  constructor() {
    // 1. Load profiles list
    let profiles: CourseProfile[] = [];
    try {
      const rawProfiles = localStorage.getItem(PROFILES_LIST_KEY);
      if (rawProfiles) {
        profiles = JSON.parse(rawProfiles);
      }
    } catch (e) {
      console.warn('Failed to load profiles from localStorage', e);
    }

    // 2. Load active profile code
    let activeCode = '';
    try {
      const rawActive = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (rawActive) {
        activeCode = rawActive;
      }
    } catch (e) {
      console.warn('Failed to load active profile code', e);
    }

    // Seed default if no profiles exist
    if (profiles.length === 0) {
      profiles = [{ code: DEFAULT_SYLLABUS.courseCode, title: DEFAULT_SYLLABUS.title }];
      activeCode = DEFAULT_SYLLABUS.courseCode;
      
      try {
        localStorage.setItem(PROFILES_LIST_KEY, JSON.stringify(profiles));
        localStorage.setItem(ACTIVE_PROFILE_KEY, activeCode);
        localStorage.setItem(this.getSyllabusKey(activeCode), JSON.stringify(DEFAULT_SYLLABUS));
        localStorage.setItem(this.getCheckedKey(activeCode), JSON.stringify({ readings: {}, assignments: {} }));
      } catch (e) {
        console.warn('Failed to seed default profile data', e);
      }
    } else if (!activeCode || !profiles.some(p => p.code === activeCode)) {
      activeCode = profiles[0].code;
      try {
        localStorage.setItem(ACTIVE_PROFILE_KEY, activeCode);
      } catch (e) {
        console.warn('Failed to save fallback active profile code', e);
      }
    }

    this.profilesSubject.next(profiles);
    this.activeProfileCodeSubject.next(activeCode);

    // 3. Load active profile's syllabus
    let activeSyllabus = DEFAULT_SYLLABUS;
    try {
      const rawSyllabus = localStorage.getItem(this.getSyllabusKey(activeCode));
      if (rawSyllabus) {
        activeSyllabus = JSON.parse(rawSyllabus);
      } else {
        localStorage.setItem(this.getSyllabusKey(activeCode), JSON.stringify(DEFAULT_SYLLABUS));
      }
    } catch (e) {
      console.warn('Failed to load active syllabus data', e);
    }
    this.syllabusSubject = new BehaviorSubject<Syllabus>(activeSyllabus);

    // 4. Load active profile's checked states
    let activeChecked: CheckedStates = { readings: {}, assignments: {} };
    try {
      const rawChecked = localStorage.getItem(this.getCheckedKey(activeCode));
      if (rawChecked) {
        const parsed = JSON.parse(rawChecked);
        activeChecked.readings = parsed.readings || {};
        activeChecked.assignments = parsed.assignments || {};
      } else {
        localStorage.setItem(this.getCheckedKey(activeCode), JSON.stringify(activeChecked));
      }
    } catch (e) {
      console.warn('Failed to load active checked states', e);
    }
    this.checkedSubject = new BehaviorSubject<CheckedStates>(activeChecked);

    // 5. Load active profile's grades
    let activeGrades: CategoryGrades = {};
    try {
      const rawGrades = localStorage.getItem(this.getGradesKey(activeCode));
      if (rawGrades) {
        activeGrades = JSON.parse(rawGrades);
      } else {
        localStorage.setItem(this.getGradesKey(activeCode), JSON.stringify(activeGrades));
      }
    } catch (e) {
      console.warn('Failed to load active grades', e);
    }
    this.gradesSubject = new BehaviorSubject<CategoryGrades>(activeGrades);

    // 6. Load active profile's study sessions
    let activeSessions: StudySession[] = [];
    try {
      const rawSessions = localStorage.getItem(this.getSessionsKey(activeCode));
      if (rawSessions) {
        activeSessions = JSON.parse(rawSessions);
      } else {
        localStorage.setItem(this.getSessionsKey(activeCode), JSON.stringify(activeSessions));
      }
    } catch (e) {
      console.warn('Failed to load active study sessions', e);
    }
    this.sessionsSubject = new BehaviorSubject<StudySession[]>(activeSessions);
  }

  // Key generators
  private getSyllabusKey(code: string): string {
    return `@syllabus_viewer/syllabus_${code}`;
  }

  private getCheckedKey(code: string): string {
    return `@syllabus_viewer/checked_states_${code}`;
  }

  private getGradesKey(code: string): string {
    return `@syllabus_viewer/grades_${code}`;
  }

  private getSessionsKey(code: string): string {
    return `@syllabus_viewer/study_sessions_${code}`;
  }

  // Core getters
  getSyllabus$(): Observable<Syllabus> {
    return this.syllabusSubject.asObservable();
  }

  getSyllabusValue(): Syllabus {
    return this.syllabusSubject.getValue();
  }

  getCheckedStates$(): Observable<CheckedStates> {
    return this.checkedSubject.asObservable();
  }

  getGrades$(): Observable<CategoryGrades> {
    return this.gradesSubject.asObservable();
  }

  getSessions$(): Observable<StudySession[]> {
    return this.sessionsSubject.asObservable();
  }

  getCheckedStatesValue(): CheckedStates {
    return this.checkedSubject.getValue();
  }

  getProfiles$(): Observable<CourseProfile[]> {
    return this.profilesSubject.asObservable();
  }

  getProfilesValue(): CourseProfile[] {
    return this.profilesSubject.getValue();
  }

  getActiveProfileCode$(): Observable<string> {
    return this.activeProfileCodeSubject.asObservable();
  }

  getActiveProfileCodeValue(): string {
    return this.activeProfileCodeSubject.getValue();
  }

  // Switch profiles
  switchProfile(code: string): void {
    const profiles = this.profilesSubject.getValue();
    if (!profiles.some(p => p.code === code)) return;

    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, code);
    } catch (e) {
      console.error('Failed to set active profile key', e);
    }
    this.activeProfileCodeSubject.next(code);

    // Load active syllabus
    let loadedSyllabus = DEFAULT_SYLLABUS;
    try {
      const rawSyllabus = localStorage.getItem(this.getSyllabusKey(code));
      if (rawSyllabus) {
        loadedSyllabus = JSON.parse(rawSyllabus);
      }
    } catch (e) {
      console.error('Failed to load syllabus for profile ' + code, e);
    }
    this.syllabusSubject.next(loadedSyllabus);

    // Load active checked states
    let loadedChecked: CheckedStates = { readings: {}, assignments: {} };
    try {
      const rawChecked = localStorage.getItem(this.getCheckedKey(code));
      if (rawChecked) {
        const parsed = JSON.parse(rawChecked);
        loadedChecked.readings = parsed.readings || {};
        loadedChecked.assignments = parsed.assignments || {};
      }
    } catch (e) {
      console.error('Failed to load checked states for profile ' + code, e);
    }
    this.checkedSubject.next(loadedChecked);

    // Load active grades
    let loadedGrades: CategoryGrades = {};
    try {
      const rawGrades = localStorage.getItem(this.getGradesKey(code));
      if (rawGrades) {
        loadedGrades = JSON.parse(rawGrades);
      }
    } catch (e) {
      console.error('Failed to load grades for profile ' + code, e);
    }
    this.gradesSubject.next(loadedGrades);

    // Load active study sessions
    let loadedSessions: StudySession[] = [];
    try {
      const rawSessions = localStorage.getItem(this.getSessionsKey(code));
      if (rawSessions) {
        loadedSessions = JSON.parse(rawSessions);
      }
    } catch (e) {
      console.error('Failed to load study sessions for profile ' + code, e);
    }
    this.sessionsSubject.next(loadedSessions);
  }

  // Update current active syllabus
  updateActiveSyllabus(syllabus: Syllabus): void {
    const code = this.activeProfileCodeSubject.getValue();
    try {
      localStorage.setItem(this.getSyllabusKey(code), JSON.stringify(syllabus));
    } catch (e) {
      console.error('Failed to write syllabus data', e);
    }
    this.syllabusSubject.next(syllabus);

    // Update course code mapping if name/code updated
    const profiles = this.profilesSubject.getValue();
    const updatedProfiles = profiles.map(p => {
      if (p.code === code) {
        return { code: syllabus.courseCode, title: syllabus.title };
      }
      return p;
    });

    // If courseCode was modified in JSON editor, swap storage keys
    if (syllabus.courseCode !== code) {
      try {
        localStorage.setItem(this.getSyllabusKey(syllabus.courseCode), JSON.stringify(syllabus));
        const checked = this.checkedSubject.getValue();
        localStorage.setItem(this.getCheckedKey(syllabus.courseCode), JSON.stringify(checked));
        
        const grades = this.gradesSubject.getValue();
        localStorage.setItem(this.getGradesKey(syllabus.courseCode), JSON.stringify(grades));

        const sessions = this.sessionsSubject.getValue();
        localStorage.setItem(this.getSessionsKey(syllabus.courseCode), JSON.stringify(sessions));

        localStorage.removeItem(this.getSyllabusKey(code));
        localStorage.removeItem(this.getCheckedKey(code));
        localStorage.removeItem(this.getGradesKey(code));
        localStorage.removeItem(this.getSessionsKey(code));
        localStorage.setItem(ACTIVE_PROFILE_KEY, syllabus.courseCode);
      } catch (e) {
        console.error('Failed to rename storage keys for modified courseCode', e);
      }
      this.activeProfileCodeSubject.next(syllabus.courseCode);
    }

    this.saveProfilesList(updatedProfiles);
  }

  updateSyllabus(newSyllabus: Syllabus): void {
    this.updateActiveSyllabus(newSyllabus);
  }

  // Create new profile
  createProfile(syllabus: Syllabus): void {
    const code = syllabus.courseCode;
    const profiles = this.profilesSubject.getValue();

    const filtered = profiles.filter(p => p.code !== code);
    const updatedProfiles = [...filtered, { code, title: syllabus.title }];
    
    try {
      localStorage.setItem(this.getSyllabusKey(code), JSON.stringify(syllabus));
      localStorage.setItem(this.getCheckedKey(code), JSON.stringify({ readings: {}, assignments: {} }));
      localStorage.setItem(this.getGradesKey(code), JSON.stringify({}));
      localStorage.setItem(this.getSessionsKey(code), JSON.stringify([]));
    } catch (e) {
      console.error('Failed to create storage slot for profile ' + code, e);
    }

    this.saveProfilesList(updatedProfiles);
    this.switchProfile(code);
  }

  // Delete profile
  deleteProfile(code: string): void {
    const profiles = this.profilesSubject.getValue();
    if (profiles.length <= 1) return;

    const updatedProfiles = profiles.filter(p => p.code !== code);
    
    try {
      localStorage.removeItem(this.getSyllabusKey(code));
      localStorage.removeItem(this.getCheckedKey(code));
      localStorage.removeItem(this.getGradesKey(code));
      localStorage.removeItem(this.getSessionsKey(code));
    } catch (e) {
      console.error('Failed to delete storage slots for profile ' + code, e);
    }

    this.saveProfilesList(updatedProfiles);

    const activeCode = this.activeProfileCodeSubject.getValue();
    if (activeCode === code) {
      this.switchProfile(updatedProfiles[0].code);
    }
  }

  private saveProfilesList(list: CourseProfile[]): void {
    try {
      localStorage.setItem(PROFILES_LIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save profiles list', e);
    }
    this.profilesSubject.next(list);
  }

  // Check state togglers
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
    const code = this.activeProfileCodeSubject.getValue();
    try {
      localStorage.setItem(this.getCheckedKey(code), JSON.stringify(states));
    } catch (e) {
      console.error('Failed to save checked states to localStorage', e);
    }
    this.checkedSubject.next(states);
  }

  getProgressMetrics(syllabus: Syllabus, states: CheckedStates): { total: number; completed: number; percentage: number } {
    let total = 0;
    let completed = 0;

    syllabus.schedule.forEach(module => {
      module.readings.forEach((_, idx) => {
        total++;
        const key = `w${module.week}-r${idx}`;
        if (states.readings[key]) {
          completed++;
        }
      });

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

  addGrade(category: string, label: string, score: number): void {
    const current = this.gradesSubject.getValue();
    const list = current[category] ? [...current[category]] : [];
    
    const newGrade: GradeItem = {
      id: 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      label: label.trim(),
      score
    };
    list.push(newGrade);

    const updated = {
      ...current,
      [category]: list
    };

    this.saveGrades(updated);
  }

  deleteGrade(category: string, id: string): void {
    const current = this.gradesSubject.getValue();
    if (!current[category]) return;

    const list = current[category].filter((g: GradeItem) => g.id !== id);
    const updated = {
      ...current,
      [category]: list
    };

    this.saveGrades(updated);
  }

  private saveGrades(grades: CategoryGrades): void {
    const code = this.activeProfileCodeSubject.getValue();
    try {
      localStorage.setItem(this.getGradesKey(code), JSON.stringify(grades));
    } catch (e) {
      console.error('Failed to save grades to localStorage', e);
    }
    this.gradesSubject.next(grades);
  }

  addStudySession(assignmentId: string, assignmentLabel: string, date: string, startTime: string, endTime: string, notes: string): void {
    const current = this.sessionsSubject.getValue();
    const newSession: StudySession = {
      id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      assignmentId,
      assignmentLabel,
      date,
      startTime,
      endTime,
      notes: notes.trim(),
      completed: false
    };
    const updated = [...current, newSession];
    this.saveSessions(updated);
  }

  toggleStudySessionCompletion(id: string): void {
    const current = this.sessionsSubject.getValue();
    const updated = current.map(s => {
      if (s.id === id) {
        return { ...s, completed: !s.completed };
      }
      return s;
    });
    this.saveSessions(updated);
  }

  deleteStudySession(id: string): void {
    const current = this.sessionsSubject.getValue();
    const updated = current.filter(s => s.id !== id);
    this.saveSessions(updated);
  }

  private saveSessions(sessions: StudySession[]): void {
    const code = this.activeProfileCodeSubject.getValue();
    try {
      localStorage.setItem(this.getSessionsKey(code), JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save study sessions to localStorage', e);
    }
    this.sessionsSubject.next(sessions);
  }
}
