
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // 0, 1, 2, 3 corresponding to A, B, C, D
  rationale: string;
}

export enum PaperType {
  PAPER_I = 'Paper I',
  PAPER_II = 'Paper II',
  PAPER_III = 'Paper III',
  PAPER_IV = 'Paper IV',
  PAPER_V = 'Paper V'
}

export interface PaperSession {
  questions: Question[];
  answers: Record<string, number>;
  timeRemaining: number;
  isCompleted: boolean;
}

export interface UserProgress {
  userEmail: string | null;
  lastActiveEmail: string | null;
  viewingPaper: PaperType | null; 
  sessions: Partial<Record<PaperType, PaperSession>>;
}
