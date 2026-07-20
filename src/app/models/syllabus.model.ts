// src/app/models/syllabus.model.ts
// Defines the data models for the syllabus structure and task-completion tracking.
// Created: 2026-07-19

export interface Instructor {
  name: string;
  email: string;
  office: string;
  officeHours: string;
  avatarUrl: string;
}

export interface GradingItem {
  label: string;
  weightPercentage: number;
}

export interface Assignment {
  id: string;
  label: string;
  dueDate: string;
}

export interface WeeklyModule {
  week: number;
  title: string;
  description: string;
  readings: string[];
  assignments: Assignment[];
}

export interface Policy {
  title: string;
  content: string;
}

export interface Syllabus {
  title: string;
  courseCode: string;
  description: string;
  instructor: Instructor;
  grading: GradingItem[];
  schedule: WeeklyModule[];
  policies: Policy[];
}

export interface CheckedStates {
  readings: { [key: string]: boolean };
  assignments: { [key: string]: boolean };
}

export interface GradeItem {
  id: string;
  label: string;
  score: number;
}

export interface CategoryGrades {
  [categoryLabel: string]: GradeItem[];
}
