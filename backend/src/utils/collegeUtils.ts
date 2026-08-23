/**
 * Utility to automatically detect College based on Roll Number prefix or sheet context.
 * All students are from MVSR Engineering College.
 */
export function detectCollege(studentId: string, sheetTitle?: string): string {
  return 'MVSR Engineering College';
}

export function getCollegeShortName(collegeName: string): string {
  if (collegeName.includes('MVSR')) return 'MVSR';
  return collegeName;
}
