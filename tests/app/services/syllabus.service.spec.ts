// tests/app/services/syllabus.service.spec.ts
// Jasmine unit tests for the SyllabusService.
// Mirrors: src/app/services/syllabus.service.ts
// Created: 2026-07-19

import { TestBed } from '@angular/core/testing';
import { SyllabusService } from '../../../src/app/services/syllabus.service';
import { Syllabus } from '../../../src/app/models/syllabus.model';

describe('SyllabusService', () => {
  let service: SyllabusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    service = TestBed.inject(SyllabusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should seed default syllabus when storage is empty', (done) => {
    service.getSyllabus$().subscribe((syllabus) => {
      expect(syllabus).toBeTruthy();
      expect(syllabus.title).toBe('Advanced Web Engineering');
      expect(syllabus.courseCode).toBe('CS-301');
      done();
    });
  });

  it('should toggle reading progress and calculate correct completion metrics', (done) => {
    const syllabus = service.getSyllabusValue();
    service.toggleReading(1, 0);

    service.getCheckedStates$().subscribe((states) => {
      expect(states.readings['w1-r0']).toBe(true);

      const metrics = service.getProgressMetrics(syllabus, states);
      expect(metrics.completed).toBe(1);
      expect(metrics.total).toBe(19);
      expect(metrics.percentage).toBe(Math.round((1 / 19) * 100)); // 5%
      done();
    });
  });

  it('should update syllabus data and persist changes', () => {
    const current = service.getSyllabusValue();
    const updated: Syllabus = {
      ...current,
      title: 'Intro to Python',
      courseCode: 'CS-101'
    };
    service.updateSyllabus(updated);
    expect(service.getSyllabusValue().title).toBe('Intro to Python');
    expect(service.getSyllabusValue().courseCode).toBe('CS-101');
  });

  it('should create a new course profile and switch to it', () => {
    const dummySyllabus: Syllabus = {
      title: 'Intro to Databases',
      courseCode: 'CS-202',
      description: 'SQL & NoSQL databases.',
      instructor: { name: 'Dr. Jones', email: 'jones@univ.edu', office: 'A-1', officeHours: 'None', avatarUrl: '' },
      grading: [{ label: 'Exam', weightPercentage: 100 }],
      schedule: [{ week: 1, title: 'Intro', description: 'Intro', readings: [], assignments: [] }],
      policies: []
    };
    
    service.createProfile(dummySyllabus);
    expect(service.getActiveProfileCodeValue()).toBe('CS-202');
    expect(service.getSyllabusValue().title).toBe('Intro to Databases');
    expect(service.getProfilesValue().some(p => p.code === 'CS-202')).toBe(true);
  });

  it('should switch between course profiles correctly', () => {
    const originalCode = service.getActiveProfileCodeValue();
    const dummySyllabus: Syllabus = {
      title: 'Intro to Databases',
      courseCode: 'CS-202',
      description: 'SQL & NoSQL databases.',
      instructor: { name: 'Dr. Jones', email: 'jones@univ.edu', office: 'A-1', officeHours: 'None', avatarUrl: '' },
      grading: [{ label: 'Exam', weightPercentage: 100 }],
      schedule: [{ week: 1, title: 'Intro', description: 'Intro', readings: [], assignments: [] }],
      policies: []
    };
    
    service.createProfile(dummySyllabus);
    expect(service.getActiveProfileCodeValue()).toBe('CS-202');
    
    service.switchProfile(originalCode);
    expect(service.getActiveProfileCodeValue()).toBe(originalCode);
  });

  it('should delete a profile and switch to another profile', () => {
    const originalCode = service.getActiveProfileCodeValue();
    const dummySyllabus: Syllabus = {
      title: 'Intro to Databases',
      courseCode: 'CS-202',
      description: 'SQL & NoSQL databases.',
      instructor: { name: 'Dr. Jones', email: 'jones@univ.edu', office: 'A-1', officeHours: 'None', avatarUrl: '' },
      grading: [{ label: 'Exam', weightPercentage: 100 }],
      schedule: [{ week: 1, title: 'Intro', description: 'Intro', readings: [], assignments: [] }],
      policies: []
    };
    
    service.createProfile(dummySyllabus);
    expect(service.getActiveProfileCodeValue()).toBe('CS-202');
    
    service.deleteProfile('CS-202');
    expect(service.getActiveProfileCodeValue()).toBe(originalCode);
    expect(service.getProfilesValue().some(p => p.code === 'CS-202')).toBe(false);
  });
});
