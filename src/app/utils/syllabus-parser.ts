// src/app/utils/syllabus-parser.ts
// Utility module to parse raw syllabus text and extract structured course metadata.
// Created: 2026-07-19

import { Syllabus, WeeklyModule } from '../models/syllabus.model';

/**
 * Parses raw syllabus text and extracts structured course metadata,
 * including course code, title, instructor details, grading weight breakdown,
 * and weekly schedules with required readings and assignments.
 */
export function parseSyllabusText(text: string): Syllabus {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let title = 'New Auto-Parsed Course';
  let courseCode = 'NEW-101';
  let description = 'Auto-parsed course description.';
  let instructorName = 'Professor TBD';
  let instructorEmail = 'tbd@university.edu';
  let office = 'Science Center, Room TBD';
  let officeHours = 'TBD';

  const grading: { label: string; weightPercentage: number }[] = [];
  const schedule: WeeklyModule[] = [];
  const policies: { title: string; content: string }[] = [];

  // 1. Parse Course Code & Title
  const codeRegex = /\b([A-Z]{2,4})[- ]?([0-9]{3,4})\b/i;
  for (const line of lines) {
    const match = line.match(codeRegex);
    if (match) {
      courseCode = `${match[1].toUpperCase()}-${match[2]}`;
      const titleCandidate = line.replace(codeRegex, '').replace(/[:-]/g, '').trim();
      if (titleCandidate.length > 4) {
        title = titleCandidate;
      }
      break;
    }
  }

  // 2. Parse Instructor Email & Name
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('instructor') || lowerLine.includes('professor') || lowerLine.includes('teacher') || lowerLine.includes('dr.')) {
      const emailMatch = line.match(emailRegex);
      if (emailMatch) {
        instructorEmail = emailMatch[0];
      }
      let cleanLine = line.replace(/instructor|professor|teacher|dr\./gi, '').replace(emailRegex, '').replace(/[:-]/g, '').trim();
      cleanLine = cleanLine.replace(/\([\s]*\)/g, '').replace(/\[[\s]*\]/g, '').trim();
      if (cleanLine.length > 2 && cleanLine.length < 50) {
        instructorName = cleanLine;
      }
    } else {
      const emailMatch = line.match(emailRegex);
      if (emailMatch && instructorEmail === 'tbd@university.edu') {
        instructorEmail = emailMatch[0];
      }
    }

    if (lowerLine.includes('office hours') || lowerLine.includes('officehour')) {
      const cleanLine = line.replace(/office hours|officehour/gi, '').replace(/[:-]/g, '').trim();
      if (cleanLine.length > 2) {
        officeHours = cleanLine;
      }
    } else if (lowerLine.includes('office:')) {
      const cleanLine = line.replace(/office/gi, '').replace(/[:-]/g, '').trim();
      if (cleanLine.length > 2) {
        office = cleanLine;
      }
    }
  }

  // 3. Parse Description
  const descLines: string[] = [];
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    if (
      !line.match(codeRegex) &&
      !line.match(emailRegex) &&
      !line.toLowerCase().includes('instructor') &&
      !line.toLowerCase().includes('professor') &&
      !line.toLowerCase().includes('syllabus') &&
      !line.toLowerCase().includes('office') &&
      !line.toLowerCase().includes('week') &&
      !line.toLowerCase().includes('module')
    ) {
      descLines.push(line);
      if (descLines.length >= 2) break;
    }
  }
  if (descLines.length > 0) {
    description = descLines.join(' ');
  }

  // 4. Parse Grading Weight Breakdown
  const gradeRegex = /([a-z0-9\s,&'()]+?)\s*[:\-]?\s*(\d{1,2})\s*%/i;
  for (const line of lines) {
    const match = line.match(gradeRegex);
    if (match) {
      const label = match[1].trim();
      const weight = parseInt(match[2], 10);
      if (weight > 0 && weight <= 100 && label.length > 3) {
        // Prevent duplicate grading items
        if (!grading.some(g => g.label.toLowerCase() === label.toLowerCase())) {
          grading.push({ label, weightPercentage: weight });
        }
      }
    }
  }

  // Fallback grading if none found
  if (grading.length === 0) {
    grading.push(
      { label: 'Weekly Tasks & Quizzes', weightPercentage: 40 },
      { label: 'Final Exam', weightPercentage: 60 }
    );
  }

  // 5. Parse Schedule (Week X or Module X)
  let currentWeekNum = 0;
  let currentWeekTitle = '';
  let currentWeekDesc = '';
  let currentReadings: string[] = [];
  let currentAssignments: { id: string; label: string; dueDate: string }[] = [];

  const weekRegex = /\b(?:week|module|unit|w)\s*(\d+)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const weekMatch = line.match(weekRegex);
    
    if (weekMatch) {
      if (currentWeekNum > 0) {
        schedule.push({
          week: currentWeekNum,
          title: currentWeekTitle || `Week ${currentWeekNum} Topics`,
          description: currentWeekDesc || 'Course lecture details.',
          readings: currentReadings,
          assignments: currentAssignments
        });
      }
      currentWeekNum = parseInt(weekMatch[1], 10);
      currentWeekTitle = line.replace(weekRegex, '').replace(/[:-]/g, '').trim();
      currentWeekDesc = '';
      currentReadings = [];
      currentAssignments = [];
    } else if (currentWeekNum > 0) {
      const lower = line.toLowerCase();
      const isAssignment = lower.includes('due') || lower.includes('assignment') || lower.includes('submit') || lower.includes('quiz') || lower.includes('lab') || lower.includes('project');
      const cleanText = line.replace(/^[\-•*+]\s*/, '').trim();

      if (cleanText.length > 3) {
        if (isAssignment) {
          const startBase = new Date('2026-09-07');
          const dueDate = new Date(startBase.getTime());
          dueDate.setDate(startBase.getDate() + (currentWeekNum - 1) * 7 + 4);
          const defaultDueStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;

          currentAssignments.push({
            id: `w${currentWeekNum}-a${currentAssignments.length + 1}`,
            label: cleanText,
            dueDate: defaultDueStr
          });
        } else {
          currentReadings.push(cleanText);
        }
      }
    }
  }

  if (currentWeekNum > 0) {
    schedule.push({
      week: currentWeekNum,
      title: currentWeekTitle || `Week ${currentWeekNum} Topics`,
      description: currentWeekDesc || 'Course lecture details.',
      readings: currentReadings,
      assignments: currentAssignments
    });
  }

  // Fallback schedule if none parsed
  if (schedule.length === 0) {
    schedule.push({
      week: 1,
      title: 'Introduction to Course Frameworks',
      description: 'Initial syllabus outline, study goals, and assignment timelines.',
      readings: ['Syllabus Guidelines Document'],
      assignments: [
        { id: 'w1-a1', label: 'Assignment 1: Student Welcome Checklist', dueDate: '2026-09-10' }
      ]
    });
  }

  // 6. Policies (Academic Integrity, etc.)
  policies.push({
    title: 'Academic Integrity Expectations',
    content: 'All submissions must reflect independent work. Plagiarism is strictly penalized.'
  });

  return {
    title,
    courseCode,
    description,
    instructor: {
      name: instructorName,
      email: instructorEmail,
      office,
      officeHours,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
    },
    grading,
    schedule,
    policies
  };
}
