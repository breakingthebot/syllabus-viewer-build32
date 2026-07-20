// tests/app/utils/syllabus-parser.spec.ts
// Unit tests for the syllabus parser utility module.
// Created: 2026-07-19

import { parseSyllabusText } from '../../../src/app/utils/syllabus-parser';

describe('SyllabusParser', () => {
  it('should parse course code, titles, and instructors correctly', () => {
    const sampleSyllabusText = `
      CS 450: Machine Learning Fundamentals
      Instructor: Professor Marcus Thorne (marcus.thorne@university.edu)
      Office: Tech Building, Room 204
      Office Hours: Mondays 3pm-5pm

      Course description goes here. Deep learning is awesome.

      Grading Criteria:
      Assignments - 40%
      Final Examination: 60%

      Schedule outline:
      Week 1: Introduction to Vectors & Matrices
      - Read linear algebra vectors guidelines
      - Lab 1: Vector Space implementation due

      Week 2: Linear Regression
      - Read chapters 2 and 3 regression
      - Homework 2: Gradient Descent due
    `;

    const result = parseSyllabusText(sampleSyllabusText);

    expect(result.courseCode).toBe('CS-450');
    expect(result.title).toBe('Machine Learning Fundamentals');
    expect(result.instructor.name).toBe('Marcus Thorne');
    expect(result.instructor.email).toBe('marcus.thorne@university.edu');
    expect(result.instructor.officeHours).toBe('Mondays 3pm-5pm');
    expect(result.instructor.office).toBe('Tech Building, Room 204');
    
    expect(result.grading.length).toBe(2);
    expect(result.grading[0].label).toBe('Assignments');
    expect(result.grading[0].weightPercentage).toBe(40);

    expect(result.schedule.length).toBe(2);
    expect(result.schedule[0].week).toBe(1);
    expect(result.schedule[0].title).toBe('Introduction to Vectors & Matrices');
    expect(result.schedule[0].readings.length).toBe(1);
    expect(result.schedule[0].readings[0]).toBe('Read linear algebra vectors guidelines');
    
    expect(result.schedule[0].assignments.length).toBe(1);
    expect(result.schedule[0].assignments[0].label).toBe('Lab 1: Vector Space implementation due');
  });
});
