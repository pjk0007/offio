// 세션 상세 페이지에서 공유하는 타입 정의

export interface ActivityData {
  id: number;
  time: string;
  hour: number;
  minute: number;
  keyboardCount: number;
  mouseClickCount: number;
  mouseDistance: number;
  keyboardActiveSeconds: number;
  mouseActiveSeconds: number;
  totalActiveSeconds: number;
  isExcluded?: boolean;
}

export interface TimelineSlot {
  hour: number;
  activeMinutes: number;
  programs: { name: string; minutes: number }[];
  excluded?: boolean;
  excludeReason?: string | null;
}

export interface Screenshot {
  id: string;
  time: string;
  url: string;
  isDeleted: boolean;
}

export interface ExcludedRange {
  id: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface ProgramUsage {
  name: string;
  minutes: number;
  seconds: number;
}

export interface SessionData {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  status: "recording" | "editing" | "submitted" | "approved" | "rejected";
  totalWorkSeconds: number;
  totalActiveSeconds: number;
  memo: string | null;
  adminComment?: string | null;
  submittedAt?: string | null;
  user: {
    id: string;
    name: string;
    department: string | null;
  };
}

export type TimeInterval = "1" | "5" | "10" | "30" | "60";
