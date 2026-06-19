/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Activity {
  id: string;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  title: string;
  variants?: string[]; // Optional additional titles for alternation
  alternationIndex?: number; // Currently selected variant index (0 for title, 1+ for variants)
  description?: string;
  icon?: string;
}

export type Category = string;

export interface CategoryDefinition {
  id: string;
  name: string;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  isBold?: boolean;
}

export interface Routine {
  id: string;
  title: string;
  description?: string;
  color: string;
  categories: string[]; // Changed from category: string
  activities: Record<string, Activity[]>; // dayOfWeek mapping: 1 (Mon) to 7 (Sun)
  createdAt: number;
  isPinned?: boolean;
  habits?: Habit[];
  vision?: Vision;
  complementaryRoutines?: ComplementaryRoutine[];
  deadlineDate?: string;
  deadlineDays?: number;
}

export interface VisionNote {
  id: string;
  text: string;
  timestamp: string;
}

export interface Vision {
  images: string[];
  successScript: string;
  failureScript: string;
  successNotes?: VisionNote[];
  failureNotes?: VisionNote[];
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: string;
  goal?: string;
}

export interface HabitGroup {
  id: string;
  title: string;
  habits: Habit[];
}

export interface CompletedRoutine {
  id: string;
  routineId: string;
  title: string;
  description?: string;
  color: string;
  categories: string[];
  activitiesAtCompletion: Record<string, Activity[]>;
  startedAt: number;
  completedAt: number;
  notes?: string;
  habitsAtCompletion?: Habit[];
  complementaryRoutinesAtCompletion?: ComplementaryRoutine[];
}

export interface CompBlock {
  id: string;
  type: 'title' | 'subtitle' | 'text' | 'image' | 'video' | 'audio' | 'link' | 'activity' | 'checklist' | 'schedule' | 'time_range' | 'table' | 'math' | 'drawing' | 'bullet';
  value: string; // Custom content (text, file link, base64 payload, title, etc)
  secondaryValue?: string; // Description or labels or secondary inputs
  extraValue?: string; // Extra field for range computations/durations
  size?: 'small' | 'medium' | 'large' | 'full'; 
  isCompleted?: boolean;
}

export interface CompNote {
  id: string;
  title: string;
  category: string; // Custom client category (e.g. 'Note', 'Tecniche')
  createdAt: number;
  updatedAt?: number;
  blocks: CompBlock[]; // Infinite custom blocks inside the Note!
  isPinned?: boolean;
  deletedAt?: number; // timestamp for recently deleted
}

export interface ComplementaryRoutine {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  linkUrl?: string;
  time?: string;      // schedule time (e.g. "17:00")
  duration?: string;  // duration (e.g. "20 Min")
  bullets?: string[]; // bullet points / milestones
  thoughts?: string;  // user notes / thoughts / custom reflections
  isCompleted?: boolean;
  blocks?: CompBlock[];
  notes?: CompNote[];
  recentlyDeletedNotes?: CompNote[];
  noteCategories?: string[];
}
