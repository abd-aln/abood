

export interface Subject {
  id: string;
  name: string;
  teacher: string;
  color: string;
  files?: {
    id:string;
    name: string;
    url: string;
    annotations?: NoteContent[];
  }[];
}

export type WorkStatus = 'pending' | 'completed' | 'postponed' | 'absent';

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  dueDate: Date;
  completed: boolean;
  status: WorkStatus;
}

export interface Exam {
  id: string;
  subjectId: string;
  date: Date;
  topic: string;
  status: WorkStatus;
  time?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  status: WorkStatus;
  time?: string;
}

export interface ClassSession {
  id: string;
  subjectId: string;
  days: number[]; // 0: Sunday, 1: Monday, ..., 6: Saturday
  time: string; // e.g., "09:00"
  duration?: number; // in minutes
  location?: string;
}

export type NoteType = 'blank' | 'lined';

export interface NoteLine {
    tool: 'pen' | 'eraser' | 'highlighter';
    color: string;
    strokeWidth: number;
    points: { x: number, y: number }[];
}

export interface NoteImage {
    id: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface NoteText {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    color: string;
}

export type NoteObject = NoteImage | NoteText;


export interface NoteContent {
    lines: NoteLine[];
    images: NoteImage[];
    texts: NoteText[];
}


export interface Note {
  id: string;
  title: string;
  content: NoteContent;
  date: string;
  type: NoteType;
  subjectId?: string;
  preview?: string; // a smaller base64 image for the card view
}

export type CalendarEvent = 
  | (Omit<Task, 'subjectId' | 'dueDate' | 'completed'> & { date: Date; type: 'task'; subject: Subject })
  | (Omit<Exam, 'subjectId'> & { type: 'exam'; subject: Subject })
  | (Holiday & { type: 'holiday' });


export interface AppNotification {
  id: string;
  title: string;
  description: string;
  date: string;
  href: string;
}
