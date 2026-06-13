export type SchoolSubject = {
  id: string;
  name: string;
  category: "键盘" | "声乐" | "理论" | "弦乐" | "民乐" | "打击乐" | "综合";
  enabled: boolean;
};

export const SCHOOL_SUBJECTS_STORAGE_KEY = "music_school_subjects";

export const DEFAULT_SCHOOL_SUBJECTS: SchoolSubject[] = [
  { id: "subject-piano", name: "钢琴", category: "键盘", enabled: true },
  { id: "subject-vocal", name: "声乐", category: "声乐", enabled: true },
  { id: "subject-music-theory", name: "乐理", category: "理论", enabled: true },
  { id: "subject-ear-training", name: "视唱练耳", category: "理论", enabled: true },
  { id: "subject-violin", name: "小提琴", category: "弦乐", enabled: true },
  { id: "subject-guzheng", name: "古筝", category: "民乐", enabled: true },
  { id: "subject-drum", name: "架子鼓", category: "打击乐", enabled: true },
  { id: "subject-guitar", name: "吉他", category: "弦乐", enabled: true },
  { id: "subject-literacy", name: "音乐素养", category: "综合", enabled: true },
  { id: "subject-chorus", name: "合唱", category: "综合", enabled: true },
];

export function readSchoolSubjects() {
  if (typeof window === "undefined") return DEFAULT_SCHOOL_SUBJECTS;

  try {
    const raw = window.localStorage.getItem(SCHOOL_SUBJECTS_STORAGE_KEY);
    if (!raw) return DEFAULT_SCHOOL_SUBJECTS;
    const parsed = JSON.parse(raw) as SchoolSubject[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_SCHOOL_SUBJECTS;
  } catch {
    return DEFAULT_SCHOOL_SUBJECTS;
  }
}

export function writeSchoolSubjects(subjects: SchoolSubject[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SCHOOL_SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
  window.dispatchEvent(new CustomEvent("school-subjects-change", { detail: subjects }));
}
