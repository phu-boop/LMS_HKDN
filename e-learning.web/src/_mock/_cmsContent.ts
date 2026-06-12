import type { CmsContent } from '../@types/cmsContent';

export type CurriculumOption = { id: string; name: string };

export const PROGRAM_OPTIONS: CurriculumOption[] = [
  { id: 'program-k12', name: 'K12 Core' },
  { id: 'program-stem', name: 'STEM Plus' },
  { id: 'program-english', name: 'English Learning Access' },
];

export const GRADE_OPTIONS: CurriculumOption[] = [
  { id: 'grade-6', name: 'Khối 6' },
  { id: 'grade-7', name: 'Khối 7' },
  { id: 'grade-8', name: 'Khối 8' },
  { id: 'grade-9', name: 'Khối 9' },
  { id: 'grade-10', name: 'Khối 10' },
];

export const SUBJECT_OPTIONS: CurriculumOption[] = [
  { id: 'subject-math', name: 'Toán học' },
  { id: 'subject-physics', name: 'Vật lý' },
  { id: 'subject-english', name: 'Tiếng Anh' },
];

export const LESSON_OPTIONS: CurriculumOption[] = [
  { id: 'lesson-function', name: 'Bài 1: Hàm số bậc nhất' },
  { id: 'lesson-electric', name: 'Bài 2: Mạch điện cơ bản' },
  { id: 'lesson-reading', name: 'Bài 3: Reading Comprehension' },
];

const now = new Date().toISOString();

export const CMS_CONTENTS_INITIAL: CmsContent[] = [
  {
    id: 'cnt-1',
    title: 'Toán 10 - Hàm số bậc nhất',
    description: 'Video bài giảng trọng tâm',
    type: 'VIDEO',
    fileName: 'toan10-ham-so.mp4',
    fileSizeBytes: 85 * 1024 * 1024,
    publishStatus: 'PUBLISHED',
    isDownloadable: false,
    watermarkEnabled: true,
    curriculumNodeId: 'node-1',
    visibilityFrom: null,
    visibilityTo: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cnt-2',
    title: 'Vật lý 9 - Điện học',
    description: 'PDF tóm tắt lý thuyết',
    type: 'PDF',
    fileName: 'vatly9-dienhoc.pdf',
    fileSizeBytes: 7 * 1024 * 1024,
    publishStatus: 'DRAFT',
    isDownloadable: true,
    watermarkEnabled: false,
    curriculumNodeId: 'node-2',
    visibilityFrom: null,
    visibilityTo: null,
    createdAt: now,
    updatedAt: now,
  },
];
