/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function calculateDuration(start?: string, end?: string): string {
  if (!start || !end) return "";
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  
  if (diffMinutes < 0) diffMinutes += 1440; // Next day
  
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  
  const hDisplay = hours > 0 ? `${hours} ${hours === 1 ? 'ora' : 'ore'}` : "";
  const mDisplay = mins > 0 ? `${mins} min` : "";
  
  if (hours > 0 && mins > 0) return `${hDisplay} e ${mDisplay}`;
  return hDisplay || mDisplay || "0 min";
}

export function getSeason(date: Date): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Primavera';
  if (month >= 5 && month <= 7) return 'Estate';
  if (month >= 8 && month <= 10) return 'Autunno';
  return 'Inverno';
}

export function getDayName(dayIndex: number): string {
  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  return days[dayIndex - 1];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
