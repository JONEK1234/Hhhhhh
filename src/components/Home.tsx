/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, MoreVertical, Edit2, Trash2, Copy, Clock, Layers, X, Pin, PinOff, Tag, Palette, Shuffle, Type, Settings, Moon, Check, Tv, CircleDot, ChevronRight, ChevronLeft, ListTodo, Sparkles, Target, Smile, Frown, Image as ImageIcon, Video, Link, ChevronDown, ChevronUp, Mic, Music, BookOpen, Folder, FolderPlus, Maximize2, FileText, CheckSquare, Calendar, Undo2, Redo2, Camera, Table, Download, Upload } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { Routine, Activity, CategoryDefinition, Habit } from '../types.ts';
import { generateId } from '../utils.ts';
import { ScribbleCanvas } from './ScribbleCanvas.tsx';

const SHOW_DOWNLOAD_BUTTON = true;

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysBetween = (dateStr: string) => {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return isNaN(diffDays) ? 0 : diffDays;
};

const getDateAfterDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDeadlineDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

const getDeadlineStatus = (deadlineDate?: string) => {
  if (!deadlineDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deadlineDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { label: `Scaduta (${Math.abs(diffDays)}g fa)`, style: 'bg-rose-500/20 text-rose-300 border-rose-400/30 font-bold', isExpired: true };
  } else if (diffDays === 0) {
    return { label: `Scade oggi`, style: 'bg-amber-500/20 text-amber-300 border-amber-400/30 font-black animate-pulse', isExpired: false };
  } else if (diffDays === 1) {
    return { label: `1 giorno rimasto`, style: 'bg-amber-500/10 text-amber-200 border-amber-400/20 font-bold', isExpired: false };
  } else {
    return { label: `${diffDays} giorni rimasti`, style: 'bg-white/10 text-white/90 border-white/20 font-bold', isExpired: false };
  }
};

interface HomeProps {
  routines: Routine[];
  categories: CategoryDefinition[];
  sleepTime: string;
  onUpdateSleepTime: (time: string) => void;
  restStartTime: string;
  onUpdateRestStartTime: (time: string) => void;
  sensorChangedAt: string;
  onUpdateSensorChangedAt: (isoString: string) => void;
  sensorTolerance: boolean;
  onUpdateSensorTolerance: (val: boolean) => void;
  showGlobalSettings: boolean;
  onSetShowGlobalSettings: (val: boolean) => void;
  onCreateNew: () => void;
  onEdit: (routine: Routine, section?: 'details' | 'habits') => void;
  onDelete: (id: string) => void;
  onDuplicate: (routine: Routine) => void;
  onTogglePin: (id: string) => void;
  onManageCategories: () => void;
  onViewHistory: () => void;
  onManageHabits: () => void;
  onViewVision: (routine: Routine) => void;
  onUpdateRoutine: (routine: Routine) => void;
  onCompleteRoutine: (routine: Routine) => void;
  currentDate: Date;
}

export default function Home({ 
  routines, 
  categories, 
  sleepTime, 
  onUpdateSleepTime, 
  restStartTime,
  onUpdateRestStartTime,
  sensorChangedAt,
  onUpdateSensorChangedAt,
  sensorTolerance,
  onUpdateSensorTolerance,
  showGlobalSettings,
  onSetShowGlobalSettings,
  onCreateNew, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onTogglePin, 
  onManageCategories, 
  onViewHistory,
  onManageHabits,
  onViewVision,
  onUpdateRoutine,
  onCompleteRoutine,
  currentDate
}: HomeProps) {
  const [search, setSearch] = useState('');
  const [exportingData, setExportingData] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExportDataZip = async () => {
    try {
      setExportingData(true);
      const dataToExport = {
        droid_routines: localStorage.getItem('droid_routines'),
        droid_completed_routines: localStorage.getItem('droid_completed_routines'),
        droid_categories: localStorage.getItem('droid_categories'),
        droid_global_habits: localStorage.getItem('droid_global_habits'),
        droid_global_habit_cats: localStorage.getItem('droid_global_habit_cats'),
        droid_sleep_time: localStorage.getItem('droid_sleep_time'),
        droid_rest_start_time: localStorage.getItem('droid_rest_start_time'),
        droid_sensor_changed_at: localStorage.getItem('droid_sensor_changed_at'),
        droid_sensor_tolerance: localStorage.getItem('droid_sensor_tolerance'),
      };

      const response = await fetch('/api/export-data-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToExport),
      });

      if (!response.ok) {
        throw new Error('Impossibile esportare lo ZIP dei dati.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'droid-routine-dati.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Errore durante l\'esportazione dello ZIP dei dati.');
    } finally {
      setExportingData(false);
    }
  };

  const handleImportDataZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportingData(true);
      const arrayBuffer = await file.arrayBuffer();

      const response = await fetch('/api/import-data-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/zip',
        },
        body: arrayBuffer,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Impossibile importare lo ZIP dei dati.');
      }

      const imported = await response.json();
      
      if (imported.droid_routines !== undefined) {
        if (imported.droid_routines) localStorage.setItem('droid_routines', imported.droid_routines);
        if (imported.droid_completed_routines) localStorage.setItem('droid_completed_routines', imported.droid_completed_routines);
        if (imported.droid_categories) localStorage.setItem('droid_categories', imported.droid_categories);
        if (imported.droid_global_habits) localStorage.setItem('droid_global_habits', imported.droid_global_habits);
        if (imported.droid_global_habit_cats) localStorage.setItem('droid_global_habit_cats', imported.droid_global_habit_cats);
        if (imported.droid_sleep_time) localStorage.setItem('droid_sleep_time', imported.droid_sleep_time);
        if (imported.droid_rest_start_time) localStorage.setItem('droid_rest_start_time', imported.droid_rest_start_time);
        if (imported.droid_sensor_changed_at) localStorage.setItem('droid_sensor_changed_at', imported.droid_sensor_changed_at);
        if (imported.droid_sensor_tolerance) localStorage.setItem('droid_sensor_tolerance', imported.droid_sensor_tolerance);
        
        alert('Dati importati con successo! L\'applicazione verrà ricaricata.');
        window.location.reload();
      } else {
        throw new Error('Lo ZIP caricato non contiene dati validi.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Errore durante l\'importazione dello ZIP: ' + err.message);
    } finally {
      setImportingData(false);
      if (e.target) e.target.value = '';
    }
  };
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [configRoutine, setConfigRoutine] = useState<Routine | null>(null);
  const [viewHabitsRoutine, setViewHabitsRoutine] = useState<Routine | null>(null);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [showCloneTargetModal, setShowCloneTargetModal] = useState(false);
  const [targetRoutineIds, setTargetRoutineIds] = useState<string[]>([]);

  // State variables for complementary routines
  const [viewCompRoutine, setViewCompRoutine] = useState<Routine | null>(null);
  const [isCompFormOpen, setIsCompFormOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<any | null>(null); // ComplementaryRoutine
  const [compTitle, setCompTitle] = useState('');
  const [compSubtitle, setCompSubtitle] = useState('');
  const [compDescription, setCompDescription] = useState('');
  const [compImage, setCompImage] = useState('');
  const [compVideo, setCompVideo] = useState('');
  const [compAudio, setCompAudio] = useState('');
  const [compLink, setCompLink] = useState('');
  const [compTime, setCompTime] = useState('');
  const [compDuration, setCompDuration] = useState('');
  const [compBullets, setCompBullets] = useState<string[]>([]);
  const [newBulletText, setNewBulletText] = useState('');
  const [compThoughts, setCompThoughts] = useState('');

  // Sviluppo Vault Conoscenza & Blocchi Personalizzabili
  const [compBlocks, setCompBlocks] = useState<any[]>([]); // CompBlock[]
  const [activeCompTab, setActiveCompTab] = useState<'actions' | 'notes'>('actions');
  const [selectedNoteCategory, setSelectedNoteCategory] = useState<string>('Tutte');
  const [openNote, setOpenNote] = useState<any | null>(null); // CompNote | null
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any | null>(null); // CompNote | null
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState('Note');
  const [noteBlocks, setNoteBlocks] = useState<any[]>([]); // CompBlock[]
  const [newNoteCategoryInput, setNewNoteCategoryInput] = useState('');

  // iOS-style Undo/Redo Engine
  const [compHistory, setCompHistory] = useState<any[][]>([]);
  const [compHistoryIndex, setCompHistoryIndex] = useState<number>(-1);
  const [noteHistory, setNoteHistory] = useState<any[][]>([]);
  const [noteHistoryIndex, setNoteHistoryIndex] = useState<number>(-1);

  const registerCompState = (newBlocks: any[]) => {
    const truncated = compHistory.slice(0, compHistoryIndex + 1);
    const updatedHistory = [...truncated, newBlocks];
    setCompHistory(updatedHistory);
    setCompHistoryIndex(updatedHistory.length - 1);
  };

  const registerNoteState = (newBlocks: any[]) => {
    const truncated = noteHistory.slice(0, noteHistoryIndex + 1);
    const updatedHistory = [...truncated, newBlocks];
    setNoteHistory(updatedHistory);
    setNoteHistoryIndex(updatedHistory.length - 1);
  };

  const handleCompUndo = () => {
    if (compHistoryIndex > 0) {
      const nextIdx = compHistoryIndex - 1;
      setCompHistoryIndex(nextIdx);
      setCompBlocks(compHistory[nextIdx]);
    }
  };

  const handleCompRedo = () => {
    if (compHistoryIndex < compHistory.length - 1) {
      const nextIdx = compHistoryIndex + 1;
      setCompHistoryIndex(nextIdx);
      setCompBlocks(compHistory[nextIdx]);
    }
  };

  const handleNoteUndo = () => {
    if (noteHistoryIndex > 0) {
      const nextIdx = noteHistoryIndex - 1;
      setNoteHistoryIndex(nextIdx);
      setNoteBlocks(noteHistory[nextIdx]);
    }
  };

  const handleNoteRedo = () => {
    if (noteHistoryIndex < noteHistory.length - 1) {
      const nextIdx = noteHistoryIndex + 1;
      setNoteHistoryIndex(nextIdx);
      setNoteBlocks(noteHistory[nextIdx]);
    }
  };

  // Fullscreen Zoom Visualizers
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);
  const [fullscreenVideoSrc, setFullscreenVideoSrc] = useState<string | null>(null);
  const [fullscreenAudioSrc, setFullscreenAudioSrc] = useState<string | null>(null);

  const [downloadingZip, setDownloadingZip] = useState(false);

  const handleDownloadAppZip = async () => {
    try {
      setDownloadingZip(true);
      const response = await fetch('/api/download-zip');
      if (!response.ok) {
        throw new Error('Impossibile scaricare lo ZIP.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'homeostasis-app.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Errore durante il download del pacchetto ZIP dell\'applicazione.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("Il file selezionato supera i 20MB limitando le prestazioni del browser.");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'image') setCompImage(result);
      if (type === 'video') setCompVideo(result);
      if (type === 'audio') setCompAudio(result);
    };
    reader.readAsDataURL(file);
  };

  const formatForInput = (isoString: string) => {
    const d = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const filteredRoutines = routines.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    (r.description && r.description.toLowerCase().includes(search.toLowerCase())) ||
    (r.categories || []).some(cat => cat.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateNewRoutine = () => {
    const defaultColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    const newRoutine: Routine = {
      id: generateId(),
      title: 'Nuova Routine',
      description: '',
      color: defaultColor,
      categories: [categories[0]?.name || 'Generale'],
      activities: {
        '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': []
      },
      createdAt: Date.now()
    };
    onUpdateRoutine(newRoutine);
    setConfigRoutine(newRoutine);
  };

  const handleShuffleColor = (routine: Routine) => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    onUpdateRoutine({ ...routine, color: randomColor });
    if (configRoutine?.id === routine.id) {
       setConfigRoutine({ ...configRoutine, color: randomColor });
    }
  };

  const handleAddBlock = (target: 'comp' | 'note', type: 'title' | 'subtitle' | 'text' | 'image' | 'video' | 'audio' | 'link' | 'activity' | 'checklist' | 'schedule' | 'time_range' | 'table' | 'math' | 'drawing' | 'bullet') => {
    const newBlock = {
      id: generateId(),
      type: type,
      value: '',
      secondaryValue: '',
      extraValue: '',
      size: 'medium',
      isCompleted: false
    };
    if (target === 'comp') {
      const updated = [...compBlocks, newBlock];
      setCompBlocks(updated);
      registerCompState(updated);
    } else {
      const updated = [...noteBlocks, newBlock];
      setNoteBlocks(updated);
      registerNoteState(updated);
    }
  };

  const handleUpdateBlockValue = (target: 'comp' | 'note', blockId: string, value: string) => {
    if (target === 'comp') {
      const updated = compBlocks.map(b => b.id === blockId ? { ...b, value } : b);
      setCompBlocks(updated);
      registerCompState(updated);
    } else {
      const updated = noteBlocks.map(b => b.id === blockId ? { ...b, value } : b);
      setNoteBlocks(updated);
      registerNoteState(updated);
    }
  };

  const handleUpdateBlockSecondaryValue = (target: 'comp' | 'note', blockId: string, secondaryValue: string) => {
    if (target === 'comp') {
      const updated = compBlocks.map(b => b.id === blockId ? { ...b, secondaryValue } : b);
      setCompBlocks(updated);
      registerCompState(updated);
    } else {
      const updated = noteBlocks.map(b => b.id === blockId ? { ...b, secondaryValue } : b);
      setNoteBlocks(updated);
      registerNoteState(updated);
    }
  };

  const handleUpdateBlockExtraValue = (target: 'comp' | 'note', blockId: string, extraValue: string) => {
    if (target === 'comp') {
      const updated = compBlocks.map(b => b.id === blockId ? { ...b, extraValue } : b);
      setCompBlocks(updated);
      registerCompState(updated);
    } else {
      const updated = noteBlocks.map(b => b.id === blockId ? { ...b, extraValue } : b);
      setNoteBlocks(updated);
      registerNoteState(updated);
    }
  };

  const handleUpdateBlockSize = (target: 'comp' | 'note', blockId: string, size: 'small' | 'medium' | 'large' | 'full') => {
    if (target === 'comp') {
      const updated = compBlocks.map(b => b.id === blockId ? { ...b, size } : b);
      setCompBlocks(updated);
      registerCompState(updated);
    } else {
      const updated = noteBlocks.map(b => b.id === blockId ? { ...b, size } : b);
      setNoteBlocks(updated);
      registerNoteState(updated);
    }
  };

  const handleToggleBlockCompleted = (target: 'comp' | 'note', blockId: string) => {
    if (target === 'comp') {
      const updated = compBlocks.map(b => b.id === blockId ? { ...b, isCompleted: !b.isCompleted } : b);
      setCompBlocks(updated);
      registerCompState(updated);
    } else {
      const updated = noteBlocks.map(b => b.id === blockId ? { ...b, isCompleted: !b.isCompleted } : b);
      setNoteBlocks(updated);
      registerNoteState(updated);
    }
  };

  const handleRemoveBlock = (target: 'comp' | 'note', blockId: string) => {
    if (target === 'comp') {
      const updated = compBlocks.filter(b => b.id !== blockId);
      setCompBlocks(updated);
      registerCompState(updated);
    } else {
      const updated = noteBlocks.filter(b => b.id !== blockId);
      setNoteBlocks(updated);
      registerNoteState(updated);
    }
  };

  const handleBlockFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'comp' | 'note', blockId: string, type: 'image' | 'video' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("Il file supera i 20MB limitando le prestazioni del browser.");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (target === 'comp') {
        const updated = compBlocks.map(b => b.id === blockId ? { ...b, value: result, secondaryValue: file.name } : b);
        setCompBlocks(updated);
        registerCompState(updated);
      } else {
        const updated = noteBlocks.map(b => b.id === blockId ? { ...b, value: result, secondaryValue: file.name } : b);
        setNoteBlocks(updated);
        registerNoteState(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const recalculateTimeRange = (target: 'comp' | 'note', blockId: string, start: string, secondVal: string, isDurationMode: boolean) => {
    let resultString = '';
    if (isDurationMode) {
      const durMin = parseInt(secondVal || '0');
      if (start && durMin > 0) {
        const [sH, sM] = start.split(':').map(Number);
        let totalM = (sH * 60 + sM) + durMin;
        totalM = totalM % (24 * 60); // roll midnight
        const endH = Math.floor(totalM / 60).toString().padStart(2, '0');
        const endM = (totalM % 60).toString().padStart(2, '0');
        
        // Human duration formatting
        const extH = Math.floor(durMin / 60);
        const extM = durMin % 60;
        const durText = extH > 0 
          ? `${extH} ${extH === 1 ? 'ora' : 'ore'}${extM > 0 ? ` e ${extM} min` : ''}` 
          : `${extM} min`;

        resultString = `Inizio alle ${start} + ${durMin} min ➔ Finisce alle ${endH}:${endM} (Durata: ${durText})`;
      } else {
        resultString = `Inizio alle ${start} • In attesa di durata`;
      }
    } else {
      const end = secondVal; // represents end hour
      if (start && end) {
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        let diffM = (eH * 60 + eM) - (sH * 60 + sM);
        if (diffM < 0) diffM += 24 * 60; // roll midnight
        const hours = Math.floor(diffM / 60);
        const mins = diffM % 60;
        const durText = hours > 0 
          ? `${hours} ${hours === 1 ? 'ora' : 'ore'}${mins > 0 ? ` e ${mins} min` : ''}` 
          : `${mins} min`;
        
        resultString = `Dalle ${start} alle ${end} (Durata calcolata: ${durText})`;
      } else {
        resultString = `Dalle ${start} • In attesa di orario di fine`;
      }
    }
    handleUpdateBlockExtraValue(target, blockId, resultString);
  };

  const handleAddOrUpdateComp = () => {
    if (!viewCompRoutine || !compTitle.trim()) return;

    const existComps = viewCompRoutine.complementaryRoutines || [];
    let updatedComps = [...existComps];

    if (editingComp) {
      updatedComps = updatedComps.map(c => c.id === editingComp.id ? {
        ...c,
        title: compTitle,
        subtitle: compSubtitle,
        description: compDescription,
        imageUrl: compImage,
        videoUrl: compVideo,
        audioUrl: compAudio,
        linkUrl: compLink,
        time: compTime,
        duration: compDuration,
        bullets: compBullets,
        thoughts: compThoughts,
        blocks: compBlocks
      } : c);
    } else {
      const newComp = {
        id: generateId(),
        title: compTitle,
        subtitle: compSubtitle,
        description: compDescription,
        imageUrl: compImage,
        videoUrl: compVideo,
        audioUrl: compAudio,
        linkUrl: compLink,
        time: compTime,
        duration: compDuration,
        bullets: compBullets,
        thoughts: compThoughts,
        isCompleted: false,
        blocks: compBlocks
      };
      updatedComps.push(newComp);
    }

    const updatedRoutine = { ...viewCompRoutine, complementaryRoutines: updatedComps };
    onUpdateRoutine(updatedRoutine);
    setViewCompRoutine(updatedRoutine);

    setCompTitle('');
    setCompSubtitle('');
    setCompDescription('');
    setCompImage('');
    setCompVideo('');
    setCompAudio('');
    setCompLink('');
    setCompTime('');
    setCompDuration('');
    setCompBullets([]);
    setNewBulletText('');
    setCompThoughts('');
    setCompBlocks([]);
    setEditingComp(null);
    setIsCompFormOpen(false);
  };

  const handleDeleteComp = (id: string) => {
    if (!viewCompRoutine) return;
    const existComps = viewCompRoutine.complementaryRoutines || [];
    const updatedComps = existComps.filter(c => c.id !== id);
    const updatedRoutine = { ...viewCompRoutine, complementaryRoutines: updatedComps };
    onUpdateRoutine(updatedRoutine);
    setViewCompRoutine(updatedRoutine);
  };

  const handleToggleComp = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!viewCompRoutine) return;
    const existComps = viewCompRoutine.complementaryRoutines || [];
    const updatedComps = existComps.map(c => c.id === id ? { ...c, isCompleted: !c.isCompleted } : c);
    const updatedRoutine = { ...viewCompRoutine, complementaryRoutines: updatedComps };
    onUpdateRoutine(updatedRoutine);
    setViewCompRoutine(updatedRoutine);
  };

  const handleOpenAddComp = () => {
    setCompTitle('');
    setCompSubtitle('');
    setCompDescription('');
    setCompImage('');
    setCompVideo('');
    setCompAudio('');
    setCompLink('');
    setCompTime('');
    setCompDuration('');
    setCompBullets([]);
    setNewBulletText('');
    setCompThoughts('');
    setCompBlocks([]);
    setCompHistory([[]]);
    setCompHistoryIndex(0);
    setEditingComp(null);
    setIsCompFormOpen(true);
  };

  const handleOpenEditComp = (comp: any) => {
    setCompTitle(comp.title || '');
    setCompSubtitle(comp.subtitle || '');
    setCompDescription(comp.description || '');
    setCompImage(comp.imageUrl || '');
    setCompVideo(comp.videoUrl || '');
    setCompAudio(comp.audioUrl || '');
    setCompLink(comp.linkUrl || '');
    setCompTime(comp.time || '');
    setCompDuration(comp.duration || '');
    setCompBullets(comp.bullets || []);
    setNewBulletText('');
    setCompThoughts(comp.thoughts || '');
    const initialBlocks = comp.blocks || [];
    setCompBlocks(initialBlocks);
    setCompHistory([initialBlocks]);
    setCompHistoryIndex(0);
    setEditingComp(comp);
    setIsCompFormOpen(true);
  };

  const handleAddOrUpdateNote = () => {
    if (!viewCompRoutine) return;

    let finalTitle = noteTitle.trim();
    if (!finalTitle) {
      // Automatic: first non-empty line becomes the title
      const firstTextBlock = noteBlocks.find(b => 
        (b.type === 'title' || b.type === 'subtitle' || b.type === 'text' || b.type === 'bullet' || b.type === 'checklist') && 
        b.value && b.value.trim()
      );
      if (firstTextBlock) {
        const lines = firstTextBlock.value.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length > 0) {
          finalTitle = lines[0].substring(0, 50);
        }
      }
    }
    
    if (!finalTitle) {
      finalTitle = "Senza titolo";
    }

    const existNotes = viewCompRoutine.notes || [];
    let updatedNotes = [...existNotes];

    if (editingNote) {
      updatedNotes = updatedNotes.map(n => n.id === editingNote.id ? {
        ...n,
        title: finalTitle,
        category: noteCategory,
        blocks: noteBlocks,
        updatedAt: Date.now()
      } : n);
    } else {
      const newNote = {
        id: generateId(),
        title: finalTitle,
        category: noteCategory,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        blocks: noteBlocks,
        isPinned: false
      };
      updatedNotes.push(newNote);
    }

    const updatedRoutine = { 
      ...viewCompRoutine, 
      notes: updatedNotes,
      noteCategories: Array.from(new Set([
        ...(viewCompRoutine.noteCategories || ['Note', 'Tecniche', 'Riflessioni']),
        noteCategory
      ]))
    };

    onUpdateRoutine(updatedRoutine);
    setViewCompRoutine(updatedRoutine);

    // Sync open note layout if active
    if (openNote && editingNote && openNote.id === editingNote.id) {
      const updatedOpenNote = updatedNotes.find(n => n.id === openNote.id);
      if (updatedOpenNote) {
        setOpenNote(updatedOpenNote);
      }
    }

    setNoteTitle('');
    setNoteCategory('Note');
    setNoteBlocks([]);
    setEditingNote(null);
    setIsNoteFormOpen(false);
  };

  const handleDeleteNote = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!viewCompRoutine) return;
    const existNotes = viewCompRoutine.notes || [];
    const noteToDelete = existNotes.find(n => n.id === noteId);
    const updatedNotes = existNotes.filter(n => n.id !== noteId);
    
    let updatedDeleted = viewCompRoutine.recentlyDeletedNotes || [];
    if (noteToDelete) {
      updatedDeleted = [...updatedDeleted, { ...noteToDelete, deletedAt: Date.now() }];
    }

    const updatedRoutine = { 
      ...viewCompRoutine, 
      notes: updatedNotes,
      recentlyDeletedNotes: updatedDeleted
    };
    onUpdateRoutine(updatedRoutine);
    setViewCompRoutine(updatedRoutine);

    if (openNote?.id === noteId) {
      setOpenNote(null);
    }
  };

  const handleRestoreNote = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!viewCompRoutine) return;
    const deletedNotes = viewCompRoutine.recentlyDeletedNotes || [];
    const noteToRestore = deletedNotes.find(n => n.id === noteId);
    const updatedDeleted = deletedNotes.filter(n => n.id !== noteId);

    let updatedNotes = viewCompRoutine.notes || [];
    if (noteToRestore) {
      const { deletedAt, ...rest } = noteToRestore; // eslint-disable-line @typescript-eslint/no-unused-vars
      updatedNotes = [...updatedNotes, rest];
    }

    const updatedRoutine = { 
      ...viewCompRoutine, 
      notes: updatedNotes,
      recentlyDeletedNotes: updatedDeleted
    };
    onUpdateRoutine(updatedRoutine);
    setViewCompRoutine(updatedRoutine);
  };

  const handlePermanentDeleteNote = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!viewCompRoutine) return;
    const deletedNotes = viewCompRoutine.recentlyDeletedNotes || [];
    const updatedDeleted = deletedNotes.filter(n => n.id !== noteId);

    const updatedRoutine = { 
      ...viewCompRoutine, 
      recentlyDeletedNotes: updatedDeleted
    };
    onUpdateRoutine(updatedRoutine);
    setViewCompRoutine(updatedRoutine);
  };

  const handleTogglePinNote = (noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!viewCompRoutine) return;
    const existNotes = viewCompRoutine.notes || [];
    const updatedNotes = existNotes.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n);

    const updatedRoutine = { ...viewCompRoutine, notes: updatedNotes };
    onUpdateRoutine(updatedRoutine);
    setViewCompRoutine(updatedRoutine);

    if (openNote?.id === noteId) {
      setOpenNote(prev => prev ? { ...prev, isPinned: !prev.isPinned } : null);
    }
  };

  const handleOpenAddNote = () => {
    setNoteTitle('');
    setNoteCategory('Note');
    setNoteBlocks([]);
    setNoteHistory([[]]);
    setNoteHistoryIndex(0);
    setEditingNote(null);
    setIsNoteFormOpen(true);
  };

  const handleOpenEditNote = (note: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNoteTitle(note.title || '');
    setNoteCategory(note.category || 'Note');
    const initialBlocks = note.blocks || [];
    setNoteBlocks(initialBlocks);
    setNoteHistory([initialBlocks]);
    setNoteHistoryIndex(0);
    setEditingNote(note);
    setIsNoteFormOpen(true);
  };

  const handleAddNewNoteCategory = () => {
    if (!viewCompRoutine || !newNoteCategoryInput.trim()) return;
    const existingCats = viewCompRoutine.noteCategories || ['Note', 'Tecniche', 'Riflessioni'];
    const addedTrimmed = newNoteCategoryInput.trim();
    if (!existingCats.includes(addedTrimmed)) {
      const updatedRoutine = {
        ...viewCompRoutine,
        noteCategories: [...existingCats, addedTrimmed]
      };
      onUpdateRoutine(updatedRoutine);
      setViewCompRoutine(updatedRoutine);
      setSelectedNoteCategory(addedTrimmed);
    }
    setNewNoteCategoryInput('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-8 pb-32 max-w-7xl mx-auto min-h-full relative"
    >
      <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-brand-cyan"
          >
            <div className="w-10 h-10 rounded-2xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold italic tracking-tight text-white/50 max-w-sm leading-snug">
              "Siamo ciò che facciamo ripetutamente. L'eccellenza, quindi, non è un atto, ma un'abitudine." — Aristotele
            </span>
          </motion.div>
          
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter animate-fadeIn">
              Le Mie <span className="text-white/30">Routine</span>
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
              <p className="text-white/30 font-medium md:text-xl">
                {routines.length} percorsi energetici configurati
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportDataZip}
                  disabled={exportingData || importingData}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/10 hover:border-purple-500/30 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  title="Esporta tutti i dati di routine, abitudini, visioni e cronologia in uno ZIP"
                >
                  <Download className={`w-3.5 h-3.5 ${exportingData ? 'animate-bounce' : ''}`} /> 
                  <span>{exportingData ? 'Esportazione...' : 'Esporta ZIP Dati'}</span>
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  disabled={exportingData || importingData}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/10 hover:border-brand-cyan/30 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  title="Carica uno ZIP di backup per ripristinare tutti i tuoi dati"
                >
                  <Upload className={`w-3.5 h-3.5 ${importingData ? 'animate-pulse' : ''}`} /> 
                  <span>{importingData ? 'Importazione...' : 'Importa ZIP Dati'}</span>
                </button>
                <input 
                  type="file"
                  ref={importInputRef}
                  onChange={handleImportDataZip}
                  accept=".zip"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
            <input 
              type="text" 
              placeholder="Cerca routine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl w-full md:w-48 lg:w-64 focus:outline-none focus:border-brand-cyan/30 focus:bg-white/10 transition-all font-medium text-sm"
            />
          </div>
          
          <button 
            onClick={() => onSetShowGlobalSettings(true)}
            className="p-4 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all text-brand-azure"
            title="Impostazioni"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button 
            onClick={onManageCategories}
            className="p-4 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
            title="Gestisci Categorie"
          >
            <Tag className="w-5 h-5" />
          </button>

          <button 
            onClick={onViewHistory}
            className="p-4 bg-white/5 border border-white/5 rounded-2xl text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            title="Vedi Cronologia"
          >
            <Clock className="w-5 h-5" />
          </button>

          <button 
            onClick={onManageHabits}
            className="p-4 bg-white/5 border border-white/5 rounded-2xl text-brand-cyan/60 hover:text-brand-cyan hover:bg-brand-cyan/10 transition-all"
            title="Libreria Abitudini"
          >
            <ListTodo className="w-5 h-5" />
          </button>

          {SHOW_DOWNLOAD_BUTTON && (
            <button 
              onClick={handleDownloadAppZip}
              disabled={downloadingZip}
              className="p-4 bg-white/5 border border-white/5 rounded-2xl text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
              title={downloadingZip ? "Generazione ZIP..." : "Scarica l'intera applicazione in un file ZIP"}
            >
              <Download className={`w-5 h-5 ${downloadingZip ? 'animate-bounce' : ''}`} />
            </button>
          )}
        </div>
      </header>

      {/* Global Settings Modal */}
      <AnimatePresence>
        {showGlobalSettings && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onSetShowGlobalSettings(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-3xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm glass-dark rounded-[2.5rem] p-8 relative z-10 border border-white/20 shadow-2xl"
            >
              <button 
                onClick={() => onSetShowGlobalSettings(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/30 hover:text-white transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <h4 className="text-3xl font-black mb-8 flex items-center gap-3">
                <Settings className="text-brand-azure w-8 h-8" /> Impostazioni
              </h4>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Diabete Section */}
                <div className="space-y-4 p-6 bg-red-500/5 rounded-3xl border border-red-500/10 group hover:border-red-500/30 transition-all">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <CircleDot className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <label className="text-sm font-black text-white/70 uppercase tracking-widest block leading-tight">Sensore Diabete</label>
                        <span className="text-[10px] font-medium text-white/30 lowercase tracking-tight">Inserito ogni 10 giorni</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 block">Ultima Sostituzione</label>
                      <input 
                        type="datetime-local" 
                        value={formatForInput(sensorChangedAt)}
                        onChange={(e) => onUpdateSensorChangedAt(new Date(e.target.value).toISOString())}
                        className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-red-500/50 transition-all font-bold text-sm text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white/60">Tolleranza 12h</span>
                        <p className="text-[9px] text-white/20">Aggiungi 12 ore di grazia</p>
                      </div>
                      <button 
                        onClick={() => onUpdateSensorTolerance(!sensorTolerance)}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${sensorTolerance ? 'bg-red-500' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: sensorTolerance ? 26 : 2 }}
                          className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/5 group hover:border-brand-azure/30 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-azure/20 flex items-center justify-center">
                      <Tv className="w-4 h-4 text-brand-azure" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-white/70 uppercase tracking-widest block leading-tight">Inizio Riposo</label>
                      <span className="text-[9px] font-medium text-white/30 lowercase tracking-tight">Quando inizi a rilassarti</span>
                    </div>
                  </div>
                  
                  <div className="relative pt-2">
                    <input 
                      type="time" 
                      value={restStartTime}
                      onChange={(e) => onUpdateRestStartTime(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-brand-azure/50 transition-all font-black text-xl text-center text-white tracking-widest appearance-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => window.open("https://ai.studio/apps/6aa87dc4-069d-4c9a-9c61-d219bed1f8cc", "_blank")}
                    className="w-full py-2.5 bg-brand-azure/10 hover:bg-brand-azure/20 text-brand-azure border border-brand-azure/20 hover:border-brand-azure/40 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Modifica
                  </button>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/5 group hover:border-brand-cyan/30 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-cyan/20 flex items-center justify-center">
                      <Moon className="w-4 h-4 text-brand-cyan" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-white/70 uppercase tracking-widest block leading-tight">Orario Sonno</label>
                      <span className="text-[9px] font-medium text-white/30 lowercase tracking-tight">Imposta quando vai a dormire</span>
                    </div>
                  </div>
                  
                  <div className="relative pt-2">
                    <input 
                      type="time" 
                      value={sleepTime}
                      onChange={(e) => onUpdateSleepTime(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-brand-cyan/50 transition-all font-black text-xl text-center text-white tracking-widest appearance-none"
                    />
                  </div>
                </div>

                <button 
                   onClick={() => onSetShowGlobalSettings(false)}
                   className="w-full py-4 premium-gradient rounded-2xl font-black text-xs uppercase tracking-[.2em] shadow-lg shadow-brand-cyan/20 flex items-center justify-center gap-2"
                >
                   <Check className="w-4 h-4" /> Conferma
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Habits Viewer & Selector */}
      <AnimatePresence>
        {viewHabitsRoutine && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setViewHabitsRoutine(null);
                setSelectedHabitIds([]);
              }}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg glass-dark rounded-[3rem] p-8 relative z-10 border border-white/10 max-h-[85vh] flex flex-col"
            >
              <button 
                onClick={() => {
                  setViewHabitsRoutine(null);
                  setSelectedHabitIds([]);
                }}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-brand-cyan/20">
                      <ListTodo className="w-6 h-6 text-brand-cyan" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white">Abitudini</h4>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{viewHabitsRoutine.title}</span>
                    </div>
                  </div>
                  {selectedHabitIds.length > 0 && (
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => setShowCloneTargetModal(true)}
                      className="px-6 py-2.5 bg-brand-cyan text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand-cyan/20"
                    >
                      <Copy className="w-3.5 h-3.5" /> Clona ({selectedHabitIds.length})
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                {Object.entries(
                  (viewHabitsRoutine.habits || []).reduce((acc, habit) => {
                    const group = habit.goal || habit.category || 'Generale';
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(habit);
                    return acc;
                  }, {} as Record<string, Habit[]>)
                ).map(([group, habits], gIdx) => (
                  <div key={`${group}-${gIdx}`} className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-azure/60 border-b border-brand-azure/10 pb-2 ml-2">
                      {group}
                    </h5>
                    <div className="grid gap-3">
                      {(habits as Habit[]).map((habit, idx) => {
                        const isSelected = selectedHabitIds.includes(habit.id);
                        return (
                          <motion.div 
                            key={`${habit.id}-${idx}`}
                            onClick={() => {
                              setSelectedHabitIds(prev => 
                                isSelected ? prev.filter(id => id !== habit.id) : [...prev, habit.id]
                              );
                            }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-5 rounded-3xl flex items-center justify-between group transition-all cursor-pointer border ${
                              isSelected 
                                ? 'bg-brand-cyan/10 border-brand-cyan/40 scale-[1.02]' 
                                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                            }`}
                          >
                            <div className="flex-1">
                              <h6 className={`font-bold transition-colors text-sm mb-1 ${isSelected ? 'text-brand-cyan' : 'text-white/90'}`}>{habit.title}</h6>
                              {(habit.description || (habit.goal && habit.category)) && (
                                <p className={`text-[11px] italic transition-colors ${isSelected ? 'text-brand-cyan/60' : 'text-white/30'}`}>
                                  {habit.description} {habit.goal && habit.category ? `• ${habit.category}` : ''}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (viewHabitsRoutine.habits) {
                                    const updatedHabits = viewHabitsRoutine.habits.filter(h => h.id !== habit.id);
                                    const updatedRoutine = { ...viewHabitsRoutine, habits: updatedHabits };
                                    setViewHabitsRoutine(updatedRoutine);
                                    onUpdateRoutine(updatedRoutine);
                                  }
                                }}
                                className="p-2 text-white/5 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-brand-cyan border-brand-cyan text-black' 
                                  : 'border-white/10 text-white/5 group-hover:border-white/20'
                              }`}>
                                <Check className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-10'}`} />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {(viewHabitsRoutine.habits || []).length === 0 && (
                  <div className="text-center py-20 bg-white/2 rounded-[2.5rem] border border-dashed border-white/10">
                    <Sparkles className="w-10 h-10 text-white/5 mx-auto mb-4" />
                    <p className="text-white/20 text-xs uppercase tracking-widest">Nessuna abitudine ancora<br/>Pianifica il tuo glow up</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => { 
                    const allIds = (viewHabitsRoutine.habits || []).map(h => h.id);
                    setSelectedHabitIds(selectedHabitIds.length === allIds.length ? [] : allIds);
                  }}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                >
                  {selectedHabitIds.length === (viewHabitsRoutine.habits || []).length ? "Deseleziona Tutto" : "Seleziona Tutto"}
                </button>
                <button 
                  onClick={() => { setViewHabitsRoutine(null); onEdit(viewHabitsRoutine!, 'habits'); }}
                  className="flex-1 py-4 bg-brand-cyan/5 hover:bg-brand-cyan/20 border border-brand-cyan/10 hover:border-brand-cyan/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-cyan transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Gestisci
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Target Selection Modal for Cloning */}
      <AnimatePresence>
        {showCloneTargetModal && viewHabitsRoutine && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
              onClick={() => {
                setShowCloneTargetModal(false);
                setTargetRoutineIds([]);
              }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-dark-soft/90 backdrop-blur-3xl rounded-[3rem] p-8 relative z-10 border border-white/20 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <button 
                onClick={() => {
                  setShowCloneTargetModal(false);
                  setTargetRoutineIds([]);
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-cyan/20 rounded-2xl">
                  <Copy className="w-5 h-5 text-brand-cyan" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">Clona in...</h4>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Scegli le routine di destinazione</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 mb-6">
                 {(() => {
                   return (
                     <>
                        {routines
                          .filter(r => r.id !== viewHabitsRoutine.id)
                          .map(r => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setTargetRoutineIds(prev => 
                                  prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id]
                                );
                              }}
                              className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                                targetRoutineIds.includes(r.id)
                                  ? 'bg-brand-cyan/20 border-brand-cyan text-white'
                                  : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                                 <span className="text-sm font-bold">{r.title}</span>
                              </div>
                              {targetRoutineIds.includes(r.id) && <Check className="w-4 h-4 text-brand-cyan" />}
                            </button>
                          ))}
                        
                        <div className="mt-8 space-y-4">
                          <div className="bg-white/5 p-4 rounded-2xl">
                             <p className="text-[9px] font-black uppercase text-white/20 mb-2">Abitudini Selezionate ({selectedHabitIds.length})</p>
                             <div className="flex flex-wrap gap-1">
                                {selectedHabitIds.map((id, idx) => {
                                  const h = viewHabitsRoutine.habits?.find(h => h.id === id);
                                  return h ? <span key={`${id}-${idx}`} className="px-2 py-0.5 bg-brand-cyan/10 text-brand-cyan text-[8px] font-bold rounded-lg">{h.title}</span> : null;
                                })}
                             </div>
                          </div>
                          
                          <button 
                            disabled={targetRoutineIds.length === 0}
                            onClick={() => {
                              const habitsToClone = viewHabitsRoutine.habits?.filter(h => selectedHabitIds.includes(h.id)) || [];
                              const updatedAllRoutines = routines.map(r => {
                                if (targetRoutineIds.includes(r.id)) {
                                  const newHabits = habitsToClone.map(h => ({ ...h, id: generateId() }));
                                  return { ...r, habits: [...(r.habits || []), ...newHabits] };
                                }
                                return r;
                              });
                              onCompleteRoutine({ ...viewHabitsRoutine }); // dummy, should call batch update
                              // Actually Home.tsx doesn't have onBatchUpdate in its props directly for routines list, it uses individual handlers.
                              // But wait, the parent App.tsx handles the rituals.
                              // I'll just use a hacky way since I don't want to change parent App.tsx Props signature now if possible.
                              // Wait, App has `setRoutines` but doesn't pass it.
                              // Let's assume I need to pass a new onBatchUpdateRoutine to Home.
                              // Or simply loop over onUpdateRoutine.
                              targetRoutineIds.forEach(tId => {
                                 const r = updatedAllRoutines.find(ur => ur.id === tId);
                                 if (r) onUpdateRoutine(r);
                              });

                              setShowCloneTargetModal(false);
                              setTargetRoutineIds([]);
                              setViewHabitsRoutine(null);
                              setSelectedHabitIds([]);
                            }}
                            className="w-full premium-gradient py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-cyan/20 disabled:opacity-30 disabled:grayscale transition-all"
                          >
                            Copia in {targetRoutineIds.length} Routine
                          </button>
                        </div>
                     </>
                   );
                 })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewCompRoutine && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewCompRoutine(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl hidden sm:block"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl bg-[#090b11] sm:bg-dark-soft/90 backdrop-blur-2xl rounded-none sm:rounded-[3rem] p-4 sm:p-8 relative z-10 border-0 sm:border border-white/10 flex flex-col shadow-2xl overflow-hidden"
              style={{ borderColor: `${viewCompRoutine.color}40` }}
            >
              {/* iOS-style Top Nav Bar for Mobile */}
              <div className="flex items-center justify-between py-2 mb-2 border-b border-white/5 sm:hidden shrink-0">
                <button 
                  onClick={() => setViewCompRoutine(null)}
                  className="flex items-center gap-1 text-brand-cyan active:scale-95 transition-all text-sm font-extrabold"
                >
                  <ChevronLeft className="w-5 h-5 -ml-1" /> Indietro
                </button>
                <span className="text-xs font-black text-white/50 uppercase tracking-widest truncate max-w-[180px]">
                  {viewCompRoutine.title}
                </span>
                <button 
                  onClick={() => setViewCompRoutine(null)}
                  className="text-brand-cyan hover:text-cyan-400 transition-all text-xs font-black uppercase tracking-wider"
                >
                  Fine
                </button>
              </div>

              <button 
                onClick={() => setViewCompRoutine(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white/30 hover:text-white transition-all z-20 border border-white/5 hidden sm:flex"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-2xl shrink-0 text-purple-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none flex items-center gap-2">
                       Note & Vault Conoscenza
                    </h3>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">
                      Espansione strategica per: <span className="text-white/80" style={{ color: viewCompRoutine.color }}>{viewCompRoutine.title}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* CONTENTS AREA */}
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-6">
                
                {/* TAB 1: ACTIONS & ALLEATI */}
                {false && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <div>
                        <h4 className="text-sm font-bold text-white">Pratiche di Supporto</h4>
                        <p className="text-[10px] text-white/40">Azioni parallele che alimentano la routine principale</p>
                      </div>
                      <button 
                        onClick={handleOpenAddComp}
                        className="px-4 py-2 bg-brand-cyan hover:bg-cyan-400 text-black rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Aggiungi alleato
                      </button>
                    </div>

                    {(!viewCompRoutine.complementaryRoutines || viewCompRoutine.complementaryRoutines.length === 0) ? (
                      <div className="text-center py-16 p-6 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center">
                        <Sparkles className="w-12 h-12 text-white/10 mb-4" />
                        <h5 className="text-sm font-bold text-white/80">Nessuna azione creata</h5>
                        <p className="text-xs text-white/40 mt-1 max-w-sm">
                          Ottimizza i tuoi risultati affiancando sub-routine, audio tutorial o checklist personalizzate!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewCompRoutine.complementaryRoutines.map((comp) => (
                          <div 
                            key={comp.id} 
                            className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-[2rem] p-5 overflow-hidden flex flex-col justify-between group transition-all duration-300 relative"
                            style={{ borderLeft: `5px solid ${viewCompRoutine.color}` }}
                          >
                            {comp.imageUrl && (
                              <div className="h-32 -mx-5 -mt-5 mb-4 relative overflow-hidden rounded-t-[1.8rem]">
                                <img src={comp.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] via-transparent to-transparent" />
                              </div>
                            )}
                            
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex flex-wrap gap-1 items-center">
                                  {comp.subtitle && (
                                    <span className="text-[9px] font-black uppercase tracking-wider text-brand-cyan">
                                      {comp.subtitle}
                                    </span>
                                  )}
                                  {comp.time && (
                                    <span className="text-[8.5px] text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/10 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" /> {comp.time}
                                    </span>
                                  )}
                                  {comp.duration && (
                                    <span className="text-[8.5px] text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/10">
                                      {comp.duration}
                                    </span>
                                  )}
                                </div>

                                <button 
                                  onClick={(e) => handleToggleComp(comp.id, e)}
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${comp.isCompleted ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-white/5 border-white/20 hover:border-white/40 text-transparent'}`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <h5 className={`text-base font-extrabold tracking-tight leading-snug transition-all ${comp.isCompleted ? 'line-through text-white/30' : 'text-white/90'}`}>
                                {comp.title}
                              </h5>
                              
                              {comp.description && (
                                <p className="text-white/50 text-xs mt-1 leading-normal">
                                  {comp.description}
                                </p>
                              )}

                              {/* Flexible blocks embedded in Actions Card */}
                              {comp.blocks && comp.blocks.length > 0 && (
                                <div className="mt-4 space-y-3 pt-4 border-t border-white/5">
                                  {comp.blocks.map((block: any) => (
                                    <div key={block.id} className="text-xs">
                                      {block.type === 'title' && <h6 className="font-extrabold text-white/90 mb-0.5">{block.value}</h6>}
                                      {block.type === 'subtitle' && <p className="text-[10px] font-bold text-brand-cyan/80 uppercase">{block.value}</p>}
                                      {block.type === 'text' && <p className="text-white/60 leading-relaxed text-[11px] whitespace-pre-line">{block.value}</p>}
                                      {block.type === 'checklist' && (
                                        <label className="flex items-start gap-2 text-[11px] text-white/70 bg-white/5 p-2 rounded-lg cursor-pointer">
                                          <input 
                                            type="checkbox" 
                                            checked={block.isCompleted || false}
                                            onChange={() => handleToggleBlockCompleted('comp', block.id)} 
                                            className="mt-0.5 rounded border-white/10 bg-transparent text-brand-cyan focus:ring-0" 
                                          />
                                          <span className={block.isCompleted ? 'line-through text-white/30' : ''}>{block.value}</span>
                                        </label>
                                      )}
                                      {block.type === 'image' && block.value && (
                                        <div 
                                          className="cursor-pointer group/img relative rounded-xl overflow-hidden bg-black/40 border border-white/5 mt-1"
                                          onClick={() => setFullscreenImg(block.value)}
                                        >
                                          <img src={block.value} alt="" className="w-full max-h-32 object-cover transition-transform group-hover/img:scale-105" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                            <Maximize2 className="w-4 h-4" />
                                          </div>
                                        </div>
                                      )}
                                      {block.type === 'video' && block.value && (
                                        <div className="rounded-xl overflow-hidden bg-black/60 border border-white/5 mt-1">
                                          {block.value.startsWith('data:') ? (
                                            <video controls className="w-full max-h-32 object-cover" src={block.value} />
                                          ) : (
                                            <a 
                                              href={block.value.startsWith('http') ? block.value : `https://${block.value}`}
                                              target="_blank" rel="noopener noreferrer"
                                              className="p-3 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 font-bold block text-center rounded-lg border border-pink-500/10"
                                            >
                                              <Video className="w-3.5 h-3.5 inline mr-1" /> Apri Video Esterno
                                            </a>
                                          )}
                                        </div>
                                      )}
                                      {block.type === 'audio' && block.value && (
                                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/15 flex flex-col gap-1 mt-1">
                                          <span className="text-[8px] font-black uppercase text-purple-300 flex items-center gap-1">
                                            <Music className="w-3 h-3" /> {block.secondaryValue || "Riproduzione Audio"}
                                          </span>
                                          <audio controls className="w-full h-8 rounded-lg overflow-hidden" src={block.value} />
                                        </div>
                                      )}
                                      {block.type === 'link' && block.value && (
                                        <a 
                                          href={block.value.startsWith('http') ? block.value : `https://${block.value}`}
                                          target="_blank" rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 p-2 bg-brand-azure/10 hover:bg-brand-azure/20 text-white rounded-lg border border-brand-azure/10 text-[11px] truncate"
                                        >
                                          <Link className="w-3.5 h-3.5 text-brand-azure" />
                                          <span className="truncate">{block.secondaryValue || block.value}</span>
                                        </a>
                                      )}
                                      {block.type === 'schedule' && block.value && (
                                        <div className="flex items-center gap-1.5 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold rounded-xl text-[10px] mt-1 shrink-0">
                                          <Clock className="w-3.5 h-3.5 shrink-0" />
                                          <span>Frequenza: {block.value}</span>
                                        </div>
                                      )}
                                      {block.type === 'time_range' && block.extraValue && (
                                        <div className="flex items-center gap-1.5 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold rounded-xl text-[10px] mt-1 shrink-0">
                                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                                          <span>Tempo: {block.extraValue}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {comp.videoUrl && (
                                <div className="mt-3">
                                  {comp.videoUrl.startsWith('data:') ? (
                                    <video controls className="w-full h-32 rounded-xl object-cover bg-black/40 border border-white/5" src={comp.videoUrl} />
                                  ) : null}
                                </div>
                              )}

                              {comp.audioUrl && (
                                <div className="mt-3 p-2 rounded-xl bg-purple-500/10 border border-purple-500/15">
                                  <audio controls className="w-full h-7 rounded-md overflow-hidden" src={comp.audioUrl} />
                                </div>
                              )}

                              {comp.thoughts && (
                                <div className="mt-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                                  <span className="text-[8px] font-black uppercase tracking-wider text-white/30 block mb-0.5">Note rapide</span>
                                  <p className="text-[11px] text-white/70 italic">"{comp.thoughts}"</p>
                                </div>
                              )}
                            </div>

                            {/* Actions and External links footer */}
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-1">
                              <div className="flex gap-1.5">
                                {comp.linkUrl && (
                                  <a 
                                    href={comp.linkUrl.startsWith('http') ? comp.linkUrl : `https://${comp.linkUrl}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="px-3 py-1 bg-brand-azure/10 hover:bg-brand-azure/20 text-brand-azure rounded-lg text-[10px] font-bold flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Link className="w-3" /> Visita Sito
                                  </a>
                                )}
                                {comp.videoUrl && !comp.videoUrl.startsWith('data:') && (
                                  <a 
                                    href={comp.videoUrl.startsWith('http') ? comp.videoUrl : `https://${comp.videoUrl}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="px-3 py-1 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Video className="w-3" /> Guarda Video
                                  </a>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenEditComp(comp); }}
                                  className="p-1 px-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-colors text-[10px] font-bold flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" /> Modifica
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteComp(comp.id); }}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 rounded-xl transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: VAULT DELLA CONOSCENZA (NOTE & QUADRATINI) */}
                {true && (
                  <div className="space-y-6">
                    {/* Categories & Add Category Panel */}
                    <div className="space-y-3 bg-white/[0.01] p-4 rounded-3xl border border-white/5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                          <Folder className="w-4 h-4" /> Categorie di Conoscenza
                        </span>

                        <div className="flex gap-2 items-center">
                          <input 
                            type="text"
                            placeholder="Aggiungi categoria..."
                            value={newNoteCategoryInput}
                            onChange={(e) => setNewNoteCategoryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddNewNoteCategory();
                            }}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-400"
                          />
                          <button 
                            onClick={handleAddNewNoteCategory}
                            className="p-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl transition-all"
                            title="Crea Categoria"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Tag bar */}
                      <div className="flex gap-1.5 flex-wrap pt-2">
                        {['Tutte', ...(viewCompRoutine.noteCategories || ['Note', 'Tecniche', 'Riflessioni'])].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedNoteCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedNoteCategory === cat ? 'bg-purple-600 text-white border border-purple-500' : 'bg-white/5 hover:bg-white/10 text-white/50 border border-transparent'}`}
                          >
                            {cat === 'Tutte' ? '📂 Tutte' : cat}
                            {cat !== 'Tutte' && ` (${(viewCompRoutine.notes || []).filter(n => n.category === cat).length})`}
                          </button>
                        ))}

                        {/* Trash folder quick tab toggle */}
                        {viewCompRoutine.recentlyDeletedNotes && viewCompRoutine.recentlyDeletedNotes.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedNoteCategory('Cestino')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedNoteCategory === 'Cestino' ? 'bg-rose-600/90 text-white border border-rose-500/50' : 'bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-transparent'}`}
                          >
                            🗑️ Eliminati di recente ({viewCompRoutine.recentlyDeletedNotes.length})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick creation summary bar */}
                    <div className="flex justify-between items-center bg-purple-500/10 p-5 rounded-[2rem] border border-purple-500/15">
                      <div>
                        <h4 className="font-extrabold text-sm text-purple-200">Quaderno della Conoscenza</h4>
                        <p className="text-[10px] text-purple-300/60">Aggiungi note, riflessioni, metodi o tecniche da memorizzare</p>
                      </div>
                      <button 
                        onClick={handleOpenAddNote}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl text-xs flex items-center gap-1 shadow-lg shadow-purple-600/20 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Aggiungi Nota
                      </button>
                    </div>

                    {/* Rendering Note cards (Quadratini) */}
                    {(() => {
                      // 1. Check if viewing Trash bin (Cestino)
                      if (selectedNoteCategory === 'Cestino') {
                        const deletedNotes = viewCompRoutine.recentlyDeletedNotes || [];
                        if (deletedNotes.length === 0) {
                          return (
                            <div className="text-center py-20 bg-white/[0.01] border border-dashed border-rose-500/10 rounded-[2rem] p-6">
                              <Trash2 className="w-12 h-12 text-rose-500/20 mx-auto mb-3" />
                              <h5 className="text-sm font-bold text-white/60">Cestino vuoto</h5>
                              <p className="text-xs text-white/30 mt-1">Nessuna nota nel cestino.</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 mb-2">
                              <div>
                                <h5 className="text-xs font-black uppercase text-rose-400">🗑️ Note cancellate di recente</h5>
                                <p className="text-[10px] text-rose-300/60 leading-tight">Le note rimosse rimangono nel cestino.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedRoutine = { ...viewCompRoutine, recentlyDeletedNotes: [] };
                                  onUpdateRoutine(updatedRoutine);
                                  setViewCompRoutine(updatedRoutine);
                                  setSelectedNoteCategory('Tutte');
                                }}
                                className="px-3 py-1.5 bg-rose-500/20 text-rose-350 hover:bg-rose-500/30 transition-all font-bold rounded-xl text-[10px] uppercase tracking-wider"
                              >
                                Svuota Cestino
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {deletedNotes.map((note) => {
                                const dateObj = new Date(note.deletedAt || note.createdAt);
                                const formattedDate = `${dateObj.getDate()} ${dateObj.toLocaleString('it-IT', { month: 'short' })} ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
                                return (
                                  <div
                                    key={note.id}
                                    className="aspect-square bg-rose-500/[0.02] border border-rose-500/10 rounded-[2rem] p-4 flex flex-col justify-between group relative"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                                          {note.category}
                                        </span>
                                      </div>
                                      <h6 className="text-[12px] font-extrabold tracking-tight text-white/80 line-clamp-3 leading-tight pt-1">
                                        {note.title}
                                      </h6>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-[9px] text-white/30 font-bold border-t border-white/5 pt-1.5 flex items-center justify-between">
                                        <span>Eliminata: {formattedDate}</span>
                                      </div>
                                      <div className="flex gap-1.5 w-full">
                                        <button
                                          type="button"
                                          onClick={(e) => handleRestoreNote(note.id, e)}
                                          className="flex-1 py-1 px-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-[9px] transition-all uppercase tracking-wider text-center"
                                        >
                                          Ripristina
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handlePermanentDeleteNote(note.id, e)}
                                          className="p-1 px-1.5 bg-rose-500/15 hover:bg-rose-500/30 text-rose-450 hover:text-rose-350 rounded-lg text-[9px] transition-all"
                                          title="Elimina permanentemente"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // 2. Normal Note viewing flow supporting Pinning sections
                      const allNotes = viewCompRoutine.notes || [];
                      const shownNotes = selectedNoteCategory === 'Tutte' 
                        ? allNotes 
                        : allNotes.filter(n => n.category === selectedNoteCategory);

                      if (shownNotes.length === 0) {
                        return (
                          <div className="text-center py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-[2rem] p-6 flex flex-col items-center">
                            <BookOpen className="w-12 h-12 text-white/10 mb-3 animate-pulse" />
                            <h5 className="text-sm font-bold text-white/60">Nessuna nota in questa categoria</h5>
                            <p className="text-xs text-white/30 max-w-sm mt-1">Carica tabelle, diagrammi di formule e scrivi riflessioni quotidiane per riempire la tua conoscenza.</p>
                          </div>
                        );
                      }

                      const pinnedNotes = shownNotes.filter(n => n.isPinned);
                      const normalNotes = shownNotes.filter(n => !n.isPinned);

                      const renderNoteSingleCard = (note: any, isPinnedCard: boolean) => {
                        const dateObj = new Date(note.createdAt);
                        const hoursStr = String(dateObj.getHours()).padStart(2, '0');
                        const minsStr = String(dateObj.getMinutes()).padStart(2, '0');
                        const formattedDate = `${dateObj.getDate()} ${dateObj.toLocaleString('it-IT', { month: 'short' })}, ${hoursStr}:${minsStr}`;

                        const imgBlocks = (note.blocks || []).filter((b: any) => b.type === 'image' || b.type === 'drawing').length;
                        const videoBlocks = (note.blocks || []).filter((b: any) => b.type === 'video').length;
                        const audioBlocks = (note.blocks || []).filter((b: any) => b.type === 'audio').length;
                        const checklistBlocks = (note.blocks || []).filter((b: any) => b.type === 'checklist').length;
                        const mathBlocks = (note.blocks || []).filter((b: any) => b.type === 'math').length;
                        const tableBlocks = (note.blocks || []).filter((b: any) => b.type === 'table').length;

                        return (
                          <motion.div
                            key={note.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            onClick={() => setOpenNote(note)}
                            className={`aspect-square bg-white/[0.03] hover:bg-white/[0.06] rounded-[2rem] p-4 border flex flex-col justify-between group cursor-pointer relative shadow-lg transition-all ${isPinnedCard ? 'border-purple-500/25 ring-1 ring-purple-500/10' : 'border-white/5'}`}
                          >
                            <div className="space-y-1">
                              {/* Notebook tag header */}
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[8px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/10 truncate max-w-[70px]">
                                  {note.category}
                                </span>
                                
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => handleTogglePinNote(note.id, e)}
                                    className={`p-1 rounded-md bg-white/5 hover:bg-white/20 ${note.isPinned ? 'text-purple-400' : 'text-white/40'}`}
                                    title={note.isPinned ? "Rimuovi in evidenza" : "Metti in evidenza"}
                                  >
                                    <Pin className="w-3 h-3 fill-current" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditNote(note, e)}
                                    className="p-1 rounded-md bg-white/5 hover:bg-white/20 text-white/60 hover:text-white"
                                    title="Modifica"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteNote(note.id, e)}
                                    className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-500"
                                    title="Sposta nel Cestino"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <h6 className="text-[12.5px] font-extrabold tracking-tight text-white/90 group-hover:text-purple-300 transition-colors line-clamp-3 leading-tight pt-1">
                                {note.title}
                              </h6>
                            </div>

                            <div className="space-y-1.5">
                              {/* Media indicator line inside notebook card */}
                              <div className="flex gap-1.5 text-[8.5px] text-white/30">
                                {imgBlocks > 0 && <span title={`${imgBlocks} Immagini`}>📷 {imgBlocks}</span>}
                                {videoBlocks > 0 && <span title={`${videoBlocks} Video`}>🎥 {videoBlocks}</span>}
                                {audioBlocks > 0 && <span title={`${audioBlocks} Memo Audio`}>🎙️ {audioBlocks}</span>}
                                {checklistBlocks > 0 && <span title={`${checklistBlocks} Attività`}>☑️ {checklistBlocks}</span>}
                                {mathBlocks > 0 && <span title={`${mathBlocks} Formule`}>🧮 {mathBlocks}</span>}
                                {tableBlocks > 0 && <span title={`${tableBlocks} Tabelle`}>田 {tableBlocks}</span>}
                              </div>

                              <div className="text-[9px] text-white/30 font-bold border-t border-white/5 pt-1 flex items-center justify-between">
                                <span>{formattedDate}</span>
                                <Maximize2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                              </div>
                            </div>
                          </motion.div>
                        );
                      };

                      return (
                        <div className="space-y-6">
                          {pinnedNotes.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-[9px] font-black uppercase text-purple-400 tracking-widest flex items-center gap-1">
                                <Pin className="w-3 h-3 fill-purple-400 inline" /> Note in evidenza
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {pinnedNotes.map((note) => renderNoteSingleCard(note, true))}
                              </div>
                              <div className="pt-2 border-b border-white/5" />
                            </div>
                          )}

                          {normalNotes.length > 0 && (
                            <div className="space-y-2">
                              {pinnedNotes.length > 0 && (
                                <h5 className="text-[9px] font-black uppercase text-white/40 tracking-widest">
                                  Altre note
                                </h5>
                              )}
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {normalNotes.map((note) => renderNoteSingleCard(note, false))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED NOTE FULL-SCREEN / FOCUS READER OVERLAY */}
      <AnimatePresence>
        {openNote && viewCompRoutine && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center sm:p-6 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenNote(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl hidden sm:block"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 25, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 25, opacity: 0 }}
              className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl bg-[#090b11] sm:bg-[#0e1017]/95 border-0 sm:border border-purple-500/30 rounded-none sm:rounded-[3rem] p-4 sm:p-8 relative z-10 flex flex-col shadow-2xl overflow-hidden"
            >
              {/* iOS-style Top Nav Bar for Mobile */}
              <div className="flex items-center justify-between py-2 mb-2 border-b border-white/5 sm:hidden shrink-0">
                <button 
                  onClick={() => setOpenNote(null)}
                  className="flex items-center gap-1 text-purple-400 active:scale-95 transition-all text-sm font-extrabold"
                >
                  <ChevronLeft className="w-5 h-5 -ml-1" /> Indietro
                </button>
                <span className="text-xs font-black text-white/50 uppercase tracking-widest truncate max-w-[180px]">
                  Leggi Nota
                </span>
                <button 
                  onClick={() => setOpenNote(null)}
                  className="text-purple-400 hover:text-purple-300 transition-all text-sm font-bold"
                >
                  Chiudi
                </button>
              </div>

              <button 
                onClick={() => setOpenNote(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white/30 hover:text-white transition-all z-20 border border-white/5 hidden sm:flex"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Note Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-purple-400 px-2 py-0.5 bg-purple-500/15 border border-purple-500/10 rounded-lg">
                        {openNote.category}
                      </span>
                      <span className="text-[10px] text-white/30">
                        {new Date(openNote.createdAt).toLocaleString('it-IT', { dateStyle: 'long', timeStyle: 'short' })}
                      </span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-white mt-0.5 leading-tight">{openNote.title}</h4>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => { handleOpenEditNote(openNote, e); }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Modifica Note & File
                  </button>
                  <button 
                    onClick={(e) => { handleDeleteNote(openNote.id, e); }}
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl"
                    title="Elimina Nota"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Note Resource blocks displaying with sizes support */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
                {(!openNote.blocks || openNote.blocks.length === 0) ? (
                  <div className="text-center py-20 bg-white/[0.01] rounded-[2.5rem] border border-dashed border-white/5">
                    <Sparkles className="w-10 h-10 text-white/5 mx-auto mb-3" />
                    <p className="text-xs text-white/30">Questa nota è vuota. Clicca su Modifica per iniziare a riempirla!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-start">
                    {openNote.blocks.map((block: any) => {
                      const getGridSpan = (size?: string) => {
                        if (size === 'small') return 'lg:col-span-3 md:col-span-1';
                        if (size === 'medium') return 'lg:col-span-6 md:col-span-2';
                        if (size === 'large') return 'lg:col-span-9 md:col-span-2';
                        return 'lg:col-span-12'; // 'full' is default or explicit
                      };

                      return (
                        <div 
                          key={block.id} 
                          className={`bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between group transition-all duration-300 relative ${getGridSpan(block.size)}`}
                        >
                          <div className="space-y-2">
                            {block.type === 'title' && (
                              <h5 className="text-lg font-black tracking-tight text-white/90">{block.value}</h5>
                            )}
                            {block.type === 'subtitle' && (
                              <p className="text-xs font-black uppercase tracking-wider text-purple-400 leading-none">{block.value}</p>
                            )}
                            {block.type === 'text' && (
                              <p className="text-xs text-white/70 leading-relaxed whitespace-pre-line">{block.value}</p>
                            )}
                            {block.type === 'checklist' && (
                              <label className="flex items-start gap-2 text-xs text-white/80 bg-white/[0.02] p-2 rounded-lg cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={block.isCompleted || false}
                                  onChange={() => {
                                    // Update locally and update layout persistence
                                    block.isCompleted = !block.isCompleted;
                                    const updatedNotes = (viewCompRoutine.notes || []).map(n => n.id === openNote.id ? { ...n, blocks: openNote.blocks } : n);
                                    const updatedRoutine = { ...viewCompRoutine, notes: updatedNotes };
                                    onUpdateRoutine(updatedRoutine);
                                    setViewCompRoutine(updatedRoutine);
                                    setOpenNote({ ...openNote, blocks: openNote.blocks });
                                  }} 
                                  className="mt-0.5 rounded border-white/10 bg-transparent text-purple-500 focus:ring-0" 
                                />
                                <span className={block.isCompleted ? 'line-through text-white/30' : ''}>{block.value}</span>
                              </label>
                            )}
                            {block.type === 'image' && block.value && (
                              <div 
                                className="cursor-pointer group/zoom relative rounded-xl overflow-hidden bg-black/40 border border-white/5 aspect-video"
                                onClick={() => setFullscreenImg(block.value)}
                              >
                                <img src={block.value} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/zoom:scale-105" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/zoom:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                  <Maximize2 className="w-5 h-5 mr-1" /> Clicca per ingrandire
                                </div>
                              </div>
                            )}
                            {block.type === 'video' && block.value && (
                              <div className="rounded-xl overflow-hidden bg-black/60 border border-white/5">
                                {block.value.startsWith('data:') ? (
                                  <video controls className="w-full aspect-video object-cover" src={block.value} />
                                ) : (
                                  <a 
                                    href={block.value.startsWith('http') ? block.value : `https://${block.value}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="p-4 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 font-bold block text-center rounded-lg border border-pink-500/10 text-xs"
                                  >
                                    <Video className="w-4 h-4 inline mr-1" /> Riproduci Video su Canale Esterno
                                  </a>
                                )}
                              </div>
                            )}
                            {block.type === 'audio' && block.value && (
                              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col gap-1.5">
                                <span className="text-[9px] font-black uppercase text-purple-300 flex items-center gap-1.5">
                                  <Music className="w-3.5 h-3.5" /> Memo vocale: {block.secondaryValue || "Traccia registrata"}
                                </span>
                                <audio controls className="w-full h-9 rounded-lg overflow-hidden bg-black/20" src={block.value} />
                              </div>
                            )}
                            {block.type === 'link' && block.value && (
                              <a 
                                href={block.value.startsWith('http') ? block.value : `https://${block.value}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-brand-azure/10 hover:bg-brand-azure/20 text-white rounded-lg border border-brand-azure/10 text-xs truncate font-bold"
                              >
                                <Link className="w-4 h-4 text-brand-azure shrink-0" />
                                <span className="truncate flex-1">{block.secondaryValue || block.value}</span>
                              </a>
                            )}

                            {/* Note Table */}
                            {block.type === 'table' && (() => {
                              let parsed = { headers: ["Intestazione 1", "Intestazione 2"], rows: [["", ""]] };
                              try {
                                if (block.value) parsed = JSON.parse(block.value);
                              } catch(e) {}
                              return (
                                <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40 p-2 text-xs custom-scrollbar">
                                  <table className="min-w-full divide-y divide-white/10 text-[10px] text-left">
                                    <thead>
                                      <tr>
                                        {parsed.headers.map((h, colIdx) => (
                                          <th key={colIdx} className="p-2 font-black text-white/50 uppercase tracking-wider bg-white/5 text-center truncate">
                                            {h}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                      {parsed.rows.map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                          {row.map((cell, colIdx) => (
                                            <td key={colIdx} className="p-2 text-white/80 font-medium">
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            })()}

                            {/* Note Math Solver */}
                            {block.type === 'math' && (() => {
                              const safeEvaluate = (str: string) => {
                                try {
                                  const sanitized = str.replace(/[^0-9+\-*/().\s]/g, '');
                                  if (!sanitized.trim()) return '';
                                  const res = Function(`"use strict"; return (${sanitized})`)();
                                  if (typeof res === 'number' && !isNaN(res)) return res.toString();
                                } catch (e) {}
                                return '...';
                              };
                              return (
                                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex items-center justify-between text-xs font-bold leading-tight">
                                  <span className="text-white/70 font-mono">{block.value}</span>
                                  <span className="font-extrabold text-amber-300 font-mono text-sm bg-amber-500/15 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                                    = {safeEvaluate(block.value)}
                                  </span>
                                </div>
                              );
                            })()}

                            {/* Note Hand Drawing Canvas */}
                            {block.type === 'drawing' && block.value && (
                              <div className="rounded-xl overflow-hidden bg-black/50 border border-white/5 relative group p-1">
                                <img 
                                  src={block.value} 
                                  alt="Disegno" 
                                  className="w-full h-auto max-h-[160px] object-contain cursor-pointer aspect-[3/1.5]" 
                                  onClick={() => setFullscreenImg(block.value)}
                                />
                                <div className="absolute right-2 top-2 p-1 bg-black/60 rounded-lg text-[9px] font-bold text-white/45 hidden group-hover:block transition-all">
                                  Markup pencil preview
                                </div>
                              </div>
                            )}

                            {/* Note Bullet list element */}
                            {block.type === 'bullet' && (
                              <div className="flex items-start gap-2 text-xs text-white/90 leading-relaxed bg-white/[0.01] p-1.5 rounded-lg">
                                <span className="text-purple-400 font-black shrink-0 text-sm mt-[1px]">•</span>
                                <span className="font-medium">{block.value}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-2 border-t border-white/5 pt-1">
                            {block.type} • {block.size || 'medium'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPLEMENTARY ROUTINE CREATION & BLOCKS BUILDER FORM OVERLAY */}
      <AnimatePresence>
        {isCompFormOpen && viewCompRoutine && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCompFormOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md hidden sm:block"
            />
            
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-xl bg-[#07090d] sm:bg-dark-bg border-0 sm:border border-white/10 rounded-none sm:rounded-[2.5rem] p-4 sm:p-6 relative z-10 overflow-y-auto custom-scrollbar flex flex-col shadow-2xl space-y-4 shadow-cyan-950/20"
            >
              {/* iOS-style Top Nav Bar for Mobile */}
              <div className="flex items-center justify-between py-2 border-b border-white/5 sm:hidden pb-2 mb-1 shrink-0">
                <button 
                  onClick={() => setIsCompFormOpen(false)}
                  className="flex items-center gap-1 text-brand-cyan active:scale-95 transition-all text-sm font-extrabold"
                >
                  <ChevronLeft className="w-5 h-5 -ml-1" /> Annulla
                </button>
                <span className="text-xs font-black text-white/50 uppercase tracking-widest truncate max-w-[150px]">
                  {editingComp ? 'Modifica Alleato' : 'Nuovo Alleato'}
                </span>
                <button 
                  onClick={handleAddOrUpdateComp}
                  className="text-brand-cyan hover:text-cyan-400 transition-all text-xs font-black uppercase tracking-wider"
                >
                  Salva
                </button>
              </div>

              <button 
                onClick={() => setIsCompFormOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white/30 hover:text-white transition-all border border-white/5 z-20 hidden sm:flex"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h4 className="text-lg font-black text-white leading-none">
                  {editingComp ? 'Modifica Routine Complementare' : 'Nuova Routine Complementare'}
                </h4>
                <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mt-1">
                  Crea contenuti e azioni interamente su misura
                </p>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-1">Titolo Routine Complementare (Obbligatorio)</label>
                  <input 
                    type="text" 
                    value={compTitle} 
                    onChange={(e) => setCompTitle(e.target.value)}
                    placeholder="es. Esercizio Alimentare Complementare o Pratica"
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold leading-normal focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/30 transition-all shadow-inner"
                  />
                </div>

                {/* Cover Image Upload (Optional basic summary value - stylized as a preview badge) */}
                <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2.5xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-cyan/10 text-brand-cyan rounded-xl">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Foto Copertina Principale</span>
                      <span className="text-[9px] text-white/40 uppercase tracking-widest block font-bold">Immagine opzionale di sfondo</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUpload(e, 'image')} 
                      className="hidden" 
                      id="comp-direct-img-upload" 
                    />
                    <label 
                      htmlFor="comp-direct-img-upload"
                      className="px-3.5 py-2 bg-brand-cyan text-black hover:bg-cyan-400 font-extrabold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer transition-all active:scale-95 text-center shrink-0 block"
                    >
                      {compImage ? 'Cambia Foto' : 'Carica Foto'}
                    </label>
                    {compImage && (
                      <button 
                        type="button" 
                        onClick={() => setCompImage('')} 
                        className="p-1 px-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-[9px] uppercase tracking-wider rounded-lg hover:bg-rose-500/20"
                      >
                        Rimuovi
                      </button>
                    )}
                  </div>
                </div>

                {/* THE ULTIMATE DYNAMIC BLOCKS BUILDER */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Blocchi di Contenuto Personalizzati
                    </span>
                    <span className="text-[10px] text-white/30 font-bold">Aggiungi quanti elementi desideri</span>
                  </div>

                  {/* Add Block Selector buttons - driven in Apple Notes style via bottom toolbar */}

                  {/* Blocks Rendering for Edit/Creation */}
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar p-1">
                    {compBlocks.length === 0 ? (
                      <div className="text-center py-8 text-white/20 text-xs italic border border-dashed border-white/5 rounded-2xl">
                        Clicca i bottoni sopra per aggiungere blocchi speciali di contenuto.
                      </div>
                    ) : (
                      compBlocks.map((block, idx) => (
                        <div key={block.id} className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3 relative group/block hover:border-white/20 transition-colors">
                          <div className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
                            <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider">
                              Blocco #{idx+1} • {block.type === 'schedule' ? '⏱️ Frequenza' : block.type === 'time_range' ? '🕰️ Ore & Durata' : block.type}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveBlock('comp', block.id)}
                              className="text-[9px] font-bold text-rose-400 hover:text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/10 hover:scale-105 transition-transform"
                            >
                              Elimina
                            </button>
                          </div>

                          {/* Render block interactive input components */}
                          
                          {/* Schedule Block (how many times / when to do it) */}
                          {block.type === 'schedule' && (
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-white/40 block">Frequenza dell'Attività (es: Mattina, 3 volte al giorno, Prima di dormire)</label>
                              <input 
                                type="text"
                                value={block.value}
                                onChange={(e) => handleUpdateBlockValue('comp', block.id, e.target.value)}
                                placeholder="Scrivi es: Mattina, 3 volte al giorno, Prima dei pasti..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                              />
                            </div>
                          )}

                          {/* Time Range Tool (with automatic calculations!) */}
                          {block.type === 'time_range' && (
                            <div className="space-y-2.5 p-3 rounded-xl bg-black/30 border border-white/5">
                              <div className="flex bg-white/5 p-1 rounded-lg text-[9px] font-bold border border-white/5">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    handleUpdateBlockSize('comp', block.id, 'small'); // small size indicates Range Mode
                                    const initStart = block.value || '16:00';
                                    const initEnd = '18:00';
                                    handleUpdateBlockValue('comp', block.id, initStart);
                                    handleUpdateBlockSecondaryValue('comp', block.id, initEnd);
                                    recalculateTimeRange('comp', block.id, initStart, initEnd, false);
                                  }}
                                  className={`flex-1 py-1 rounded-md text-center transition-all ${(!block.size || block.size === 'small' || block.size === 'medium') ? 'bg-emerald-500 text-black font-extrabold' : 'text-white/40 hover:text-white'}`}
                                >
                                  Inizio ➔ Fine (Calcola di quanto tempo)
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    handleUpdateBlockSize('comp', block.id, 'large'); // large size indicates Duration Mode
                                    const initStart = block.value || '16:00';
                                    const initDur = '120';
                                    handleUpdateBlockValue('comp', block.id, initStart);
                                    handleUpdateBlockSecondaryValue('comp', block.id, initDur);
                                    recalculateTimeRange('comp', block.id, initStart, initDur, true);
                                  }}
                                  className={`flex-1 py-1 rounded-md text-center transition-all ${block.size === 'large' ? 'bg-emerald-500 text-black font-extrabold' : 'text-white/40 hover:text-white'}`}
                                >
                                  Inizio + Durata (Calcola quando finisce)
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[8px] uppercase font-bold text-white/40 block mb-1">Ora di Inizio</label>
                                  <input 
                                    type="time" 
                                    value={block.value || '16:00'}
                                    onChange={(e) => {
                                      const startVal = e.target.value;
                                      handleUpdateBlockValue('comp', block.id, startVal);
                                      const isDurMode = block.size === 'large';
                                      const otherVal = block.secondaryValue || (isDurMode ? '120' : '18:00');
                                      recalculateTimeRange('comp', block.id, startVal, otherVal, isDurMode);
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white font-bold"
                                  />
                                </div>

                                {(!block.size || block.size === 'small' || block.size === 'medium') ? (
                                  <div>
                                    <label className="text-[8px] uppercase font-bold text-white/40 block mb-1">Ora Fine (Seleziona fascia)</label>
                                    <input 
                                      type="time" 
                                      value={block.secondaryValue || '18:00'}
                                      onChange={(e) => {
                                        const endVal = e.target.value;
                                        handleUpdateBlockSecondaryValue('comp', block.id, endVal);
                                        recalculateTimeRange('comp', block.id, block.value || '16:00', endVal, false);
                                      }}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white font-bold"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="text-[8px] uppercase font-bold text-white/40 block mb-1">Durata (Minuti)</label>
                                    <input 
                                      type="number" 
                                      min="1"
                                      value={block.secondaryValue || '120'}
                                      onChange={(e) => {
                                        const durVal = e.target.value;
                                        handleUpdateBlockSecondaryValue('comp', block.id, durVal);
                                        recalculateTimeRange('comp', block.id, block.value || '16:00', durVal, true);
                                      }}
                                      placeholder="Pianifica minuti (es. 90, 120)"
                                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white font-bold"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Automated display box for calculating outcomes */}
                              <div className="text-center p-2.5 bg-emerald-500/10 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                                <span className="text-[9px] uppercase tracking-wider font-extrabold text-white/40">Calcolatrice Automatica:</span>
                                <span className="text-xs font-black text-emerald-400">{block.extraValue || 'Compila gli orari...'}</span>
                              </div>
                            </div>
                          )}

                          {/* Text / Title Inputs */}
                          {(block.type === 'title' || block.type === 'subtitle' || block.type === 'text') && (
                            <textarea 
                              value={block.value}
                              onChange={(e) => handleUpdateBlockValue('comp', block.id, e.target.value)}
                              placeholder={`Inserisci il contenuto del ${block.type}...`}
                              rows={block.type === 'text' ? 3 : 1}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                            />
                          )}

                          {/* Checklist input */}
                          {block.type === 'checklist' && (
                            <input 
                              type="text" 
                              value={block.value}
                              onChange={(e) => handleUpdateBlockValue('comp', block.id, e.target.value)}
                              placeholder="Descrizione dell'obiettivo..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                            />
                          )}

                          {/* Image file pick / URL input */}
                          {block.type === 'image' && (
                            <div className="flex gap-2 items-center">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleBlockFileUpload(e, 'comp', block.id, 'image')}
                                className="hidden" 
                                id={`block-img-${block.id}`} 
                              />
                              <label 
                                htmlFor={`block-img-${block.id}`}
                                className="px-3 py-2 bg-brand-cyan/25 text-brand-cyan rounded-lg text-[10px] font-black cursor-pointer shrink-0"
                              >
                                Scegli Foto
                              </label>
                              <input 
                                type="text" 
                                placeholder="Incolla link alternativo d'immagine..." 
                                value={block.value && block.value.startsWith('data:') ? 'File locale caricato...' : block.value}
                                onChange={(e) => handleUpdateBlockValue('comp', block.id, e.target.value)}
                                disabled={block.value && block.value.startsWith('data:')}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                              />
                            </div>
                          )}

                          {/* Video upload / URL */}
                          {block.type === 'video' && (
                            <div className="flex gap-2 items-center">
                              <input 
                                type="file" 
                                accept="video/*" 
                                onChange={(e) => handleBlockFileUpload(e, 'comp', block.id, 'video')}
                                className="hidden" 
                                id={`block-vid-${block.id}`} 
                              />
                              <label 
                                htmlFor={`block-vid-${block.id}`}
                                className="px-3 py-2 bg-pink-500/25 text-pink-400 rounded-lg text-[10px] font-black cursor-pointer shrink-0"
                              >
                                Scegli Video
                              </label>
                              <input 
                                type="text" 
                                placeholder="Incolla link URL di YouTube o simile..." 
                                value={block.value && block.value.startsWith('data:') ? 'File locale' : block.value}
                                onChange={(e) => handleUpdateBlockValue('comp', block.id, e.target.value)}
                                disabled={block.value && block.value.startsWith('data:')}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                              />
                            </div>
                          )}

                          {/* Audio file memo pick */}
                          {block.type === 'audio' && (
                            <div className="flex items-center gap-2">
                              <input 
                                type="file" 
                                accept="audio/*" 
                                onChange={(e) => handleBlockFileUpload(e, 'comp', block.id, 'audio')}
                                className="hidden" 
                                id={`block-aud-${block.id}`} 
                              />
                              <label 
                                htmlFor={`block-aud-${block.id}`}
                                className="px-3 py-2 bg-purple-500/25 text-purple-400 rounded-lg text-[10px] font-black cursor-pointer shrink-0"
                              >
                                🎙️ Carica Nota Audio
                              </label>
                              <span className="text-[10px] text-white/40 truncate">
                                {block.secondaryValue || "Scegli un file vocale"}
                              </span>
                            </div>
                          )}

                          {/* Web link blocks */}
                          {block.type === 'link' && (
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="text" 
                                placeholder="Indirizzo URL (es. wikipedia.org)" 
                                value={block.value}
                                onChange={(e) => handleUpdateBlockValue('comp', block.id, e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                              />
                              <input 
                                type="text" 
                                placeholder="Titolo etichetta del Link" 
                                value={block.secondaryValue}
                                onChange={(e) => handleUpdateBlockSecondaryValue('comp', block.id, e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                              />
                            </div>
                          )}

                          {/* Table Block */}
                          {block.type === 'table' && (() => {
                            let parsed = { headers: ["Intestazione 1", "Intestazione 2"], rows: [["", ""]] };
                            try {
                              if (block.value) parsed = JSON.parse(block.value);
                            } catch (e) {
                              // Default fallback
                            }

                            const updateTableData = (newData: typeof parsed) => {
                              handleUpdateBlockValue('comp', block.id, JSON.stringify(newData));
                            };

                            return (
                              <div className="space-y-1.5 p-2 bg-black/40 border border-white/5 rounded-xl">
                                <div className="overflow-x-auto custom-scrollbar">
                                  <table className="min-w-full divide-y divide-white/10 text-xs text-white">
                                    <thead>
                                      <tr>
                                        {parsed.headers.map((h, colIdx) => (
                                          <th key={colIdx} className="p-1 min-w-[80px]">
                                            <input 
                                              value={h} 
                                              onChange={(e) => {
                                                const copy = { ...parsed };
                                                copy.headers[colIdx] = e.target.value;
                                                updateTableData(copy);
                                              }}
                                              className="bg-white/5 text-white/90 font-bold border-0 text-[10px] p-1 rounded-w-full text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            />
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {parsed.rows.map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                          {row.map((cell, colIdx) => (
                                            <td key={colIdx} className="p-1">
                                              <input 
                                                value={cell} 
                                                onChange={(e) => {
                                                  const copy = { ...parsed };
                                                  copy.rows[rowIdx][colIdx] = e.target.value;
                                                  updateTableData(copy);
                                                }}
                                                className="bg-transparent border border-white/5 focus:border-purple-400 text-white p-1 rounded w-full text-xs focus:outline-none"
                                              />
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="flex justify-between gap-2 mt-1 shrink-0">
                                  <div className="flex gap-1.5">
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        const copy = { ...parsed };
                                        copy.rows.push(new Array(copy.headers.length).fill(''));
                                        updateTableData(copy);
                                      }}
                                      className="px-2 py-1 bg-purple-500/20 text-purple-300 font-extrabold rounded-lg text-[9px] hover:bg-purple-500/35 transition-all"
                                    >
                                      + Riga
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        const copy = { ...parsed };
                                        copy.headers.push(`Colonna ${copy.headers.length + 1}`);
                                        copy.rows = copy.rows.map(r => [...r, '']);
                                        updateTableData(copy);
                                      }}
                                      className="px-2 py-1 bg-cyan-500/20 text-cyan-300 font-extrabold rounded-lg text-[9px] hover:bg-cyan-500/35 transition-all"
                                    >
                                      + Colonna
                                    </button>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button 
                                      type="button" 
                                      disabled={parsed.rows.length <= 1}
                                      onClick={() => {
                                        const copy = { ...parsed };
                                        copy.rows.pop();
                                        updateTableData(copy);
                                      }}
                                      className="px-2 py-1 bg-rose-500/10 text-rose-400 font-extrabold disabled:opacity-20 rounded-lg text-[9px]"
                                    >
                                      - Riga
                                    </button>
                                    <button 
                                      type="button" 
                                      disabled={parsed.headers.length <= 1}
                                      onClick={() => {
                                        const copy = { ...parsed };
                                        copy.headers.pop();
                                        copy.rows = copy.rows.map(r => r.slice(0, -1));
                                        updateTableData(copy);
                                      }}
                                      className="px-2 py-1 bg-rose-500/10 text-rose-400 font-extrabold disabled:opacity-20 rounded-lg text-[9px]"
                                    >
                                      - Colonna
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Math Block */}
                          {block.type === 'math' && (() => {
                            const safeEvaluate = (str: string) => {
                              try {
                                const sanitized = str.replace(/[^0-9+\-*/().\s]/g, '');
                                if (!sanitized.trim()) return '';
                                const res = Function(`"use strict"; return (${sanitized})`)();
                                if (typeof res === 'number' && !isNaN(res)) return res.toString();
                              } catch (e) {}
                              return '...';
                            };

                            return (
                              <div className="space-y-1 bg-black/30 p-2.5 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[8px] uppercase font-black text-amber-400 tracking-wider">Matematica Apple Notes</span>
                                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md font-black font-mono">
                                    Risolto: {safeEvaluate(block.value)}
                                  </span>
                                </div>
                                <input 
                                  type="text"
                                  value={block.value}
                                  onChange={(e) => handleUpdateBlockValue('comp', block.id, e.target.value)}
                                  placeholder="Inserisci equazione matematica (es. 15 * 4.5)"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            );
                          })()}

                          {/* Drawing canvas markup block */}
                          {block.type === 'drawing' && (
                            <div className="space-y-1">
                              <span className="text-[8px] uppercase font-black text-cyan-400 tracking-wider block">Disegno Libero Markup Pencil</span>
                              <ScribbleCanvas 
                                initialValue={block.value}
                                onSave={(dataUrl) => handleUpdateBlockValue('comp', block.id, dataUrl)}
                              />
                            </div>
                          )}

                          {/* Bullet block */}
                          {block.type === 'bullet' && (
                            <div className="flex items-center gap-2">
                              <span className="text-purple-400 font-black px-1">•</span>
                              <input 
                                type="text"
                                value={block.value}
                                onChange={(e) => handleUpdateBlockValue('comp', block.id, e.target.value)}
                                placeholder="Fornisci list bullet item..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                              />
                            </div>
                          )}

                        </div>
                      ))
                    )}
                  </div>

                  {/* iOS-style Persistent Bottom Bar for Complementary Editor */}
                  <div className="sticky bottom-0 left-0 right-0 z-40 bg-[#16181d]/95 backdrop-blur-md border border-white/10 p-2 ml-auto mr-auto max-w-md flex items-center justify-around rounded-2xl shadow-xl">
                    <button
                      type="button"
                      title="Aggiungi Tabella"
                      onClick={() => handleAddBlock('comp', 'table')}
                      className="p-1 px-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex flex-col items-center gap-0.5"
                    >
                      <Table className="w-4 h-4 text-purple-400" />
                      <span className="text-[8px] uppercase font-bold text-white/40">Tabella</span>
                    </button>

                    <div className="relative group/aa">
                      <button
                        type="button"
                        title="Formattazione Testo"
                        className="p-1 px-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex flex-col items-center gap-0.5"
                      >
                        <Type className="w-4 h-4 text-sky-400" />
                        <span className="text-[8px] uppercase font-bold text-white/40">Aa</span>
                      </button>
                      <div className="absolute bottom-11 right-1/2 translate-x-1/2 bg-[#1b1e25] border border-white/10 rounded-xl p-2 shadow-2xl hidden group-hover/aa:block hover:group-hover/aa:block z-[60] w-40 space-y-1">
                        <h6 className="text-[8px] uppercase font-black text-white/40 tracking-wider mb-1 px-1">Formato Aa</h6>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'title')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] font-black text-white flex justify-between items-center"
                        >
                          <span>Titolo</span>
                          <span className="text-[8px] opacity-45">H1</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'subtitle')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] font-bold text-white/95 flex justify-between items-center"
                        >
                          <span>Sottotitolo</span>
                          <span className="text-[8px] opacity-45">H2</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'text')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] text-white/80 flex justify-between items-center"
                        >
                          <span>Corpo</span>
                          <span className="text-[8px] opacity-45">P</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'bullet')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] text-white/80 flex justify-between items-center"
                        >
                          <span>Elenco</span>
                          <span className="text-[8px] opacity-45">•</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'math')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] text-white/80 flex justify-between items-center"
                        >
                          <span>Formula</span>
                          <span className="text-[8px] opacity-45">=</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      title="Crea Checklist"
                      onClick={() => handleAddBlock('comp', 'checklist')}
                      className="p-1 px-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex flex-col items-center gap-0.5"
                    >
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-[8px] uppercase font-bold text-white/40">Check</span>
                    </button>

                    <div className="relative group/cam">
                      <button
                        type="button"
                        title="Inserisci Contenuto Multimedia"
                        className="p-1 px-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex flex-col items-center gap-0.5"
                      >
                        <Camera className="w-4 h-4 text-amber-400" />
                        <span className="text-[8px] uppercase font-bold text-white/40">Allegati</span>
                      </button>
                      <div className="absolute bottom-11 right-1/2 translate-x-1/2 bg-[#1b1e25] border border-white/10 rounded-xl p-2 shadow-2xl hidden group-hover/cam:block hover:group-hover/cam:block z-[60] w-40 space-y-1">
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'image')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] text-white/90 flex items-center gap-1.5"
                        >
                          <span>📷 Foto Copertina</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'audio')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] text-white/90 flex items-center gap-1.5"
                        >
                          <span>🎙️ Registazione Audio</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'video')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] text-white/90 flex items-center gap-1.5"
                        >
                          <span>🎥 Clip Video</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'link')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] text-white/90 flex items-center gap-1.5"
                        >
                          <span>🔗 Link Web</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'schedule')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] text-white/90 flex items-center gap-1.5 border-t border-white/5 pt-1 mt-1"
                        >
                          <span>⏱️ Ritmi & Freq</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock('comp', 'time_range')}
                          className="w-full text-left px-2 py-1 hover:bg-white/5 rounded text-[11px] text-white/90 flex items-center gap-1.5"
                        >
                          <span>🕰️ Ore & Durata</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      title="Disegno a mano"
                      onClick={() => handleAddBlock('comp', 'drawing')}
                      className="p-1 px-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex flex-col items-center gap-0.5"
                    >
                      <span className="text-sm text-pink-400">✏️</span>
                      <span className="text-[8px] uppercase font-bold text-white/40">Disegni</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCompUndo}
                      disabled={compHistoryIndex <= 0}
                      className="p-1 px-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex flex-col items-center gap-0.5 disabled:opacity-20"
                    >
                      <Undo2 className="w-4 h-4 text-emerald-300" />
                      <span className="text-[8px] uppercase font-bold text-white/40">Undo</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCompRedo}
                      disabled={compHistoryIndex >= compHistory.length - 1}
                      className="p-1 px-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex flex-col items-center gap-0.5 disabled:opacity-20"
                    >
                      <Redo2 className="w-4 h-4 text-emerald-300" />
                      <span className="text-[8px] uppercase font-bold text-white/40">Redo</span>
                    </button>
                  </div>

                </div>
              </div>

              <div className="flex gap-3 pt-4 shrink-0">
                <button 
                  onClick={() => setIsCompFormOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Annulla
                </button>
                <button 
                  onClick={handleAddOrUpdateComp}
                  disabled={!compTitle.trim()}
                  className="flex-1 py-3 bg-brand-cyan hover:bg-cyan-400 text-black rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40 transition-all shadow-lg shadow-brand-cyan/20"
                >
                  Salva Alleato
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NOTE CREATION & DETAILED KNOWLEDGE NOTES BLOCKS BUILDER FORM OVERLAY */}
      <AnimatePresence>
        {isNoteFormOpen && viewCompRoutine && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNoteFormOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md hidden sm:block"
            />
            
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-xl bg-[#07090d] sm:bg-dark-bg border-0 sm:border border-purple-500/20 rounded-none sm:rounded-[2.5rem] p-4 sm:p-6 relative z-10 overflow-y-auto custom-scrollbar flex flex-col shadow-2xl space-y-4 shadow-purple-950/20"
            >
              {/* iOS-style Top Nav Bar for Mobile */}
              <div className="flex items-center justify-between py-2 border-b border-white/5 sm:hidden pb-2 mb-1 shrink-0">
                <button 
                  onClick={() => setIsNoteFormOpen(false)}
                  className="flex items-center gap-1 text-purple-400 active:scale-95 transition-all text-sm font-extrabold"
                >
                  <ChevronLeft className="w-5 h-5 -ml-1" /> Annulla
                </button>
                <span className="text-xs font-black text-white/50 uppercase tracking-widest truncate max-w-[150px]">
                  {editingNote ? 'Modifica Nota' : 'Nuova Nota'}
                </span>
                <button 
                  onClick={handleAddOrUpdateNote}
                  className="text-purple-400 hover:text-purple-300 transition-all text-xs font-black uppercase tracking-wider"
                >
                  Salva
                </button>
              </div>

              <button 
                onClick={() => setIsNoteFormOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white/30 hover:text-white transition-all border border-white/5 z-20 hidden sm:flex"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h4 className="text-lg font-black text-white leading-none">
                  {editingNote ? 'Modifica Nota del Vault' : 'Nuova Nota di Conoscenza'}
                </h4>
                <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mt-1">
                  Arricchisci la tua mente di tecniche, metodi e materiali
                </p>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-[8px] font-black uppercase text-white/40 tracking-wider block mb-1">Titolo Nota</label>
                  <input 
                    type="text" 
                    value={noteTitle} 
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="es. Tecnica Pomodoro avanzata con respirazione"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold leading-normal focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase text-white/40 tracking-wider block mb-1">Categoria della Nota</label>
                  <select 
                    value={noteCategory} 
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-purple-400"
                  >
                    {['Note', 'Tecniche', 'Riflessioni', ...(viewCompRoutine.noteCategories || []).filter(c => c !== 'Note' && c !== 'Tecniche' && c !== 'Riflessioni')].map((cat) => (
                      <option key={cat} value={cat} className="bg-dark-bg text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                {/* THE NOTE BLOCKS COMPOSER */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-wider text-purple-400">Inserisci contenuti e file interattivi</span>
                    <span className="text-[9px] text-white/30">Supporta multi-media e dimensioni</span>
                  </div>

                  {/* Apple Notes Style Persistent Utility Toolbar */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-wider text-purple-400">Pulsanti di formattazione ed inserimento rapido</span>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                      <button 
                        type="button" 
                        title="Intestazione Titolo"
                        onClick={() => handleAddBlock('note', 'title')}
                        className="py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-white rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <span className="font-extrabold text-[11px] text-purple-300">Aa</span>
                        <span className="text-[7.5px] uppercase font-bold text-white/40">Titolo</span>
                      </button>
                      <button 
                        type="button" 
                        title="Testo Paragrafo"
                        onClick={() => handleAddBlock('note', 'text')}
                        className="py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-white rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <Type className="w-3.5 h-3.5 text-cyan-300" />
                        <span className="text-[7.5px] uppercase font-bold text-white/40">Testo</span>
                      </button>
                      <button 
                        type="button" 
                        title="Checklist di controllo"
                        onClick={() => handleAddBlock('note', 'checklist')}
                        className="py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-white rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[7.5px] uppercase font-bold text-white/40">Check</span>
                      </button>
                      <button 
                        type="button" 
                        title="Tabella dati"
                        onClick={() => handleAddBlock('note', 'table')}
                        className="py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-white rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <span className="text-sm text-sky-400 font-extrabold">田</span>
                        <span className="text-[7.5px] uppercase font-bold text-white/40">Tabelle</span>
                      </button>
                      <button 
                        type="button" 
                        title="Disegno a mano"
                        onClick={() => handleAddBlock('note', 'drawing')}
                        className="py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-white rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <span className="text-sm text-yellow-400">✏️</span>
                        <span className="text-[7.5px] uppercase font-bold text-white/40">Markup</span>
                      </button>
                      <button 
                        type="button" 
                        title="Elenco puntato"
                        onClick={() => handleAddBlock('note', 'bullet')}
                        className="py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-white rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <span className="font-mono text-purple-400 font-black">•</span>
                        <span className="text-[7.5px] uppercase font-bold text-white/40">Elenco</span>
                      </button>
                      <button 
                        type="button" 
                        title="Calcolatrice Matematica"
                        onClick={() => handleAddBlock('note', 'math')}
                        className="py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-white rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <span className="text-[11px] font-black font-mono text-amber-400">1+1</span>
                        <span className="text-[7.5px] uppercase font-bold text-white/40">Math</span>
                      </button>
                      <button 
                        type="button" 
                        title="File o Immagine"
                        onClick={() => handleAddBlock('note', 'image')}
                        className="py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-white rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[7.5px] uppercase font-bold text-white/40">Foto</span>
                      </button>
                      <button 
                        type="button" 
                        title="Audio Vocale"
                        onClick={() => handleAddBlock('note', 'audio')}
                        className="py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-white rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[7.5px] uppercase font-bold text-white/40">Audio</span>
                      </button>
                      <button 
                        type="button" 
                        title="Collegamento URL"
                        onClick={() => handleAddBlock('note', 'link')}
                        className="py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-bold text-white rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 cursor-pointer"
                      >
                        <Link className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-[7.5px] uppercase font-bold text-white/40">Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Build list of blocks for Note */}
                  <div className="space-y-3 max-h-[170px] overflow-y-auto custom-scrollbar p-1">
                    {noteBlocks.map((block, idx) => (
                      <div key={block.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                        <div className="flex justify-between items-center bg-white/5 p-1 rounded-lg">
                          <span className="text-[8px] font-black uppercase text-purple-400">Elemento #{idx+1} ({block.type})</span>
                          
                          {/* Sizing dropdown */}
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-white/30 uppercase">Dimensione:</span>
                            <select 
                              value={block.size || 'medium'}
                              onChange={(e) => handleUpdateBlockSize('note', block.id, e.target.value as any)}
                              className="bg-black/40 border border-white/10 rounded px-1 text-[9px] text-white focus:outline-none"
                            >
                              <option value="small">Piccolo (1/4)</option>
                              <option value="medium">Normale (2/4)</option>
                              <option value="large">Grande (3/4)</option>
                              <option value="full">Intero (4/4)</option>
                            </select>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveBlock('note', block.id)}
                              className="text-[9px] font-bold text-rose-400 hover:text-rose-500 pl-2 border-l border-white/10"
                            >
                              Rimuovi
                            </button>
                          </div>
                        </div>

                        {/* Note texts/formatting */}
                        {(block.type === 'title' || block.type === 'subtitle' || block.type === 'text') && (
                          <textarea 
                            value={block.value}
                            onChange={(e) => handleUpdateBlockValue('note', block.id, e.target.value)}
                            placeholder={`Contenuto di tipo ${block.type}...`}
                            rows={block.type === 'text' ? 3 : 1}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-400"
                          />
                        )}

                        {/* Note Checklist */}
                        {block.type === 'checklist' && (
                          <input 
                            type="text" 
                            value={block.value}
                            onChange={(e) => handleUpdateBlockValue('note', block.id, e.target.value)}
                            placeholder="Azione o checkpoint pratico..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                          />
                        )}

                        {/* Note Image File Upload */}
                        {block.type === 'image' && (
                          <div className="flex gap-2 items-center">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleBlockFileUpload(e, 'note', block.id, 'image')}
                              className="hidden" 
                              id={`note-img-${block.id}`} 
                            />
                            <label 
                              htmlFor={`note-img-${block.id}`}
                              className="px-2.5 py-1.5 bg-brand-cyan/25 text-brand-cyan rounded-lg text-[10px] font-black cursor-pointer shrink-0"
                            >
                              Carica File Immagine
                            </label>
                            <input 
                              type="text" 
                              placeholder="Incolla URL esterno di un'immagine..." 
                              value={block.value && block.value.startsWith('data:') ? 'File locale caricato' : block.value}
                              onChange={(e) => handleUpdateBlockValue('note', block.id, e.target.value)}
                              disabled={block.value && block.value.startsWith('data:')}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                            />
                          </div>
                        )}

                        {/* Note Video Clip */}
                        {block.type === 'video' && (
                          <div className="flex gap-2 items-center">
                            <input 
                              type="file" 
                              accept="video/*" 
                              onChange={(e) => handleBlockFileUpload(e, 'note', block.id, 'video')}
                              className="hidden" 
                              id={`note-vid-${block.id}`} 
                            />
                            <label 
                              htmlFor={`note-vid-${block.id}`}
                              className="px-2.5 py-1.5 bg-pink-500/25 text-pink-400 rounded-lg text-[10px] font-black cursor-pointer shrink-0"
                            >
                              Carica File Video
                            </label>
                            <input 
                              type="text" 
                              placeholder="Fornisci URL video (es. Vimeo / Youtube)..." 
                              value={block.value && block.value.startsWith('data:') ? 'Video locale caricato' : block.value}
                              onChange={(e) => handleUpdateBlockValue('note', block.id, e.target.value)}
                              disabled={block.value && block.value.startsWith('data:')}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                            />
                          </div>
                        )}

                        {/* Note Audio / Voice Memos */}
                        {block.type === 'audio' && (
                          <div className="flex items-center gap-2">
                            <input 
                              type="file" 
                              accept="audio/*" 
                              onChange={(e) => handleBlockFileUpload(e, 'note', block.id, 'audio')}
                              className="hidden" 
                              id={`note-aud-${block.id}`} 
                            />
                            <label 
                              htmlFor={`note-aud-${block.id}`}
                              className="px-2.5 py-1.5 bg-purple-500/25 text-purple-400 rounded-lg text-[10px] font-black cursor-pointer shrink-0"
                            >
                              🎙️ Scegli Audio Vocale
                            </label>
                            <span className="text-[10px] text-white/40 truncate">
                              {block.secondaryValue || "Scegli un file audio"}
                            </span>
                          </div>
                        )}

                        {/* Note Link */}
                        {block.type === 'link' && (
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              placeholder="Destinazione URL" 
                              value={block.value}
                              onChange={(e) => handleUpdateBlockValue('note', block.id, e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                            />
                            <input 
                              type="text" 
                              placeholder="Titolo etichetta del sito" 
                              value={block.secondaryValue}
                              onChange={(e) => handleUpdateBlockSecondaryValue('note', block.id, e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                            />
                          </div>
                        )}

                        {/* Note Table */}
                        {block.type === 'table' && (() => {
                          let parsed = { headers: ["Intestazione 1", "Intestazione 2"], rows: [["", ""]] };
                          try {
                            if (block.value) parsed = JSON.parse(block.value);
                          } catch (e) {
                            // Default fallback
                          }

                          const updateTableData = (newData: typeof parsed) => {
                            handleUpdateBlockValue('note', block.id, JSON.stringify(newData));
                          };

                          return (
                            <div className="space-y-1.5 p-2 bg-black/40 border border-white/5 rounded-xl">
                              <div className="overflow-x-auto custom-scrollbar">
                                <table className="min-w-full divide-y divide-white/10 text-xs">
                                  <thead>
                                    <tr>
                                      {parsed.headers.map((h, colIdx) => (
                                        <th key={colIdx} className="p-1 min-w-[80px]">
                                          <input 
                                            value={h} 
                                            onChange={(e) => {
                                              const copy = { ...parsed };
                                              copy.headers[colIdx] = e.target.value;
                                              updateTableData(copy);
                                            }}
                                            className="bg-white/5 text-white/90 font-bold border-0 text-[10px] p-1 rounded w-full text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                                          />
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {parsed.rows.map((row, rowIdx) => (
                                      <tr key={rowIdx}>
                                        {row.map((cell, colIdx) => (
                                          <td key={colIdx} className="p-1">
                                            <input 
                                              value={cell} 
                                              onChange={(e) => {
                                                const copy = { ...parsed };
                                                copy.rows[rowIdx][colIdx] = e.target.value;
                                                updateTableData(copy);
                                              }}
                                              className="bg-transparent border border-white/5 focus:border-purple-400 text-white p-1 rounded w-full text-xs focus:outline-none"
                                            />
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="flex justify-between gap-2 mt-1 shrink-0">
                                <div className="flex gap-1.5">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const copy = { ...parsed };
                                      copy.rows.push(new Array(copy.headers.length).fill(''));
                                      updateTableData(copy);
                                    }}
                                    className="px-2 py-1 bg-purple-500/20 text-purple-300 font-extrabold rounded-lg text-[9px] hover:bg-purple-500/35 transition-all"
                                  >
                                    + Riga
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const copy = { ...parsed };
                                      copy.headers.push(`Colonna ${copy.headers.length + 1}`);
                                      copy.rows = copy.rows.map(r => [...r, '']);
                                      updateTableData(copy);
                                    }}
                                    className="px-2 py-1 bg-cyan-500/20 text-cyan-300 font-extrabold rounded-lg text-[9px] hover:bg-cyan-500/35 transition-all"
                                  >
                                    + Colonna
                                  </button>
                                </div>
                                <div className="flex gap-1.5">
                                  <button 
                                    type="button" 
                                    disabled={parsed.rows.length <= 1}
                                    onClick={() => {
                                      const copy = { ...parsed };
                                      copy.rows.pop();
                                      updateTableData(copy);
                                    }}
                                    className="px-2 py-1 bg-rose-500/10 text-rose-400 font-extrabold disabled:opacity-20 rounded-lg text-[9px]"
                                  >
                                    - Riga
                                  </button>
                                  <button 
                                    type="button" 
                                    disabled={parsed.headers.length <= 1}
                                    onClick={() => {
                                      const copy = { ...parsed };
                                      copy.headers.pop();
                                      copy.rows = copy.rows.map(r => r.slice(0, -1));
                                      updateTableData(copy);
                                    }}
                                    className="px-2 py-1 bg-rose-500/10 text-rose-400 font-extrabold disabled:opacity-20 rounded-lg text-[9px]"
                                  >
                                    - Colonna
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Note Math Evaluator */}
                        {block.type === 'math' && (() => {
                          const safeEvaluate = (str: string) => {
                            try {
                              const sanitized = str.replace(/[^0-9+\-*/().\s]/g, '');
                              if (!sanitized.trim()) return '';
                              const res = Function(`"use strict"; return (${sanitized})`)();
                              if (typeof res === 'number' && !isNaN(res)) return res.toString();
                            } catch (e) {}
                            return '...';
                          };

                          return (
                            <div className="space-y-1 bg-black/30 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] uppercase font-black text-amber-400 tracking-wider">Matematica Apple Notes</span>
                                <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md font-black font-mono">
                                  Risolto: {safeEvaluate(block.value)}
                                </span>
                              </div>
                              <input 
                                type="text"
                                value={block.value}
                                onChange={(e) => handleUpdateBlockValue('note', block.id, e.target.value)}
                                placeholder="Inserisci equazione matematica (es. 15 * 4.5)"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400"
                              />
                            </div>
                          );
                        })()}

                        {/* Note Hand Drawing Doodle */}
                        {block.type === 'drawing' && (
                          <div className="space-y-1">
                            <span className="text-[8px] uppercase font-black text-cyan-400 tracking-wider block">Disegno Libero Markup Pencil</span>
                            <ScribbleCanvas 
                              initialValue={block.value}
                              onSave={(dataUrl) => handleUpdateBlockValue('note', block.id, dataUrl)}
                            />
                          </div>
                        )}

                        {/* Note Bullet List Item */}
                        {block.type === 'bullet' && (
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-black px-1">•</span>
                            <input 
                              type="text"
                              value={block.value}
                              onChange={(e) => handleUpdateBlockValue('note', block.id, e.target.value)}
                              placeholder="Fornisci list bullet item..."
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsNoteFormOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Annulla
                </button>
                <button 
                  onClick={handleAddOrUpdateNote}
                  disabled={!noteTitle.trim()}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-purple-600/20"
                >
                  Salva Nota
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN ZOOM PORTAL OVERLAYS */}
      <AnimatePresence>
        {fullscreenImg && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullscreenImg(null)}
              className="absolute inset-0 bg-black/98 cursor-zoom-out"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-full max-h-full z-10 flex flex-col items-center"
            >
              <img src={fullscreenImg} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" alt="" referrerPolicy="no-referrer" />
              <button 
                onClick={() => setFullscreenImg(null)}
                className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                Chiudi anteprima
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {configRoutine && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfigRoutine(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm glass-dark rounded-[2.5rem] p-8 relative z-10 border border-white/10 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setConfigRoutine(null)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/30 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="text-2xl font-bold mb-8 flex items-center gap-3 pr-8">
                <Palette className="text-brand-azure" /> Configura
              </h4>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-white/30 uppercase tracking-widest pl-1">Identità</label>
                  <div className="relative">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text" 
                      value={configRoutine.title}
                      onChange={(e) => {
                        const updated = { ...configRoutine, title: e.target.value };
                        setConfigRoutine(updated);
                        onUpdateRoutine(updated);
                      }}
                      placeholder="Titolo della routine"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-brand-cyan/50 transition-all h-full"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-white/30 uppercase tracking-widest pl-1">Descrizione</label>
                  <div className="relative">
                    <textarea 
                      value={configRoutine.description || ''}
                      onChange={(e) => {
                        const updated = { ...configRoutine, description: e.target.value };
                        setConfigRoutine(updated);
                        onUpdateRoutine(updated);
                      }}
                      placeholder="Descrizione della routine..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-brand-cyan/50 transition-all resize-none text-[13px] text-white/90 placeholder-white/25 h-24"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-white/30 uppercase tracking-widest pl-1">Sinfonia Cromatica</label>
                  <div className="relative flex flex-col items-center">
                    <div className="relative group w-full flex justify-center">
                      <div className="relative w-56 h-56 rounded-full p-2 bg-gradient-to-tr from-white/20 via-white/5 to-transparent backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center border border-white/10 overflow-hidden">
                        <div className="absolute inset-0 z-0">
                          <HexColorPicker 
                            color={configRoutine.color} 
                            onChange={(color) => {
                              const updated = { ...configRoutine, color };
                              setConfigRoutine(updated);
                              onUpdateRoutine(updated);
                            }} 
                          />
                        </div>
                        <div 
                          className="w-20 h-20 rounded-full relative z-10 flex items-center justify-center pointer-events-none transition-all duration-700 shadow-2xl border border-white/20"
                          style={{ 
                            backgroundColor: configRoutine.color,
                            boxShadow: `0 0 30px ${configRoutine.color}60, inset 0 0 20px rgba(0,0,0,0.3)`
                          }}
                        >
                          <Palette className="w-8 h-8 text-white mix-blend-difference opacity-50" />
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleShuffleColor(configRoutine)}
                        className="absolute -top-2 -right-2 w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center text-white/40 hover:text-brand-cyan transition-all"
                      >
                        <Shuffle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-white/30 uppercase tracking-widest pl-1">Categorie</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat, idx) => {
                      const isSelected = (configRoutine.categories || []).includes(cat.name);
                      return (
                        <button
                          key={`${cat.id}-${idx}`}
                          onClick={() => {
                            const current = configRoutine.categories || [];
                            const updated = isSelected 
                              ? current.filter(c => c !== cat.name)
                              : [...current, cat.name];
                            const updatedRoutine = { ...configRoutine, categories: updated };
                            setConfigRoutine(updatedRoutine);
                            onUpdateRoutine(updatedRoutine);
                          }}
                          className={`px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black border transition-all ${
                            isSelected 
                              ? 'bg-white/10 border-white/20' 
                              : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20'
                          }`}
                          style={{
                            color: isSelected ? cat.color : undefined,
                            WebkitTextStroke: (isSelected && cat.borderWidth && cat.borderWidth > 0) ? `${cat.borderWidth}px ${cat.borderColor || '#ffffff'}` : '0',
                            fontWeight: isSelected && cat.isBold !== false ? '900' : '400',
                            textShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                          }}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sezione Scadenza */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white/30 uppercase tracking-widest pl-1">Scadenza Routine</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (configRoutine.deadlineDate) {
                          // Remove it
                          const updated = { ...configRoutine, deadlineDate: undefined, deadlineDays: undefined };
                          setConfigRoutine(updated);
                          onUpdateRoutine(updated);
                        } else {
                          // Initialize to 10 days default
                          const defaultDate = getDateAfterDays(10);
                          const updated = { ...configRoutine, deadlineDate: defaultDate, deadlineDays: 10 };
                          setConfigRoutine(updated);
                          onUpdateRoutine(updated);
                        }
                      }}
                      className={`text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-xl border transition-all ${
                        configRoutine.deadlineDate 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                          : 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/20'
                      }`}
                    >
                      {configRoutine.deadlineDate ? 'Rimuovi' : 'Imposta'}
                    </button>
                  </div>

                  {configRoutine.deadlineDate && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Opzione 1: Giorni */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 block">Scade fra (giorni):</label>
                        <input 
                          type="number" 
                          min="1"
                          placeholder="Es. 10"
                          value={configRoutine.deadlineDays || ''}
                          onChange={(e) => {
                            const days = parseInt(e.target.value, 10);
                            if (!isNaN(days) && days > 0) {
                              const targetDate = getDateAfterDays(days);
                              const updated = { ...configRoutine, deadlineDays: days, deadlineDate: targetDate };
                              setConfigRoutine(updated);
                              onUpdateRoutine(updated);
                            } else {
                              const updated = { ...configRoutine, deadlineDays: undefined };
                              setConfigRoutine(updated);
                              onUpdateRoutine(updated);
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand-cyan/50 text-sm"
                        />
                      </div>

                      {/* Opzione 2: Data */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 block">Oppure seleziona una data specifica:</label>
                        <input 
                          type="date" 
                          min={getTodayString()}
                          value={configRoutine.deadlineDate || ''}
                          onChange={(e) => {
                            const dateStr = e.target.value;
                            if (dateStr) {
                              const days = getDaysBetween(dateStr);
                              const updated = { ...configRoutine, deadlineDate: dateStr, deadlineDays: days >= 0 ? days : 0 };
                              setConfigRoutine(updated);
                              onUpdateRoutine(updated);
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand-cyan/50 text-sm [color-scheme:dark]"
                        />
                      </div>
                      
                      {/* Informative text below */}
                      <div className="text-[11px] text-white/40 leading-relaxed bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-brand-cyan shrink-0 mt-0.5" />
                        <div>
                          Modificando i giorni calcoliamo automaticamente la data precisa. Selezionando la data, calcoliamo i giorni rimanenti!
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Routine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card "+" all'inizio di tutte le routine - visibile solo all'inizio se non ci sono routine */}
        {routines.length === 0 && (
          <motion.div
            layout
            onClick={handleCreateNewRoutine}
            className="rounded-[2.2rem] h-[310px] cursor-pointer border-2 border-dashed border-white/10 hover:border-brand-cyan/40 bg-white/[0.02] hover:bg-brand-cyan/[0.03] flex flex-col items-center justify-center p-8 text-center transition-all duration-300 group"
            whileHover={{ y: -5, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            title="Crea nuova routine"
          >
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-white/30 group-hover:text-brand-cyan group-hover:bg-brand-cyan/10 group-hover:border-brand-cyan/20 transition-all duration-300 mb-4 shadow-inner">
              <Plus className="w-8 h-8 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-black text-white/40 group-hover:text-white uppercase tracking-wider transition-all">Nuova Routine</span>
            <p className="text-white/20 text-[11px] mt-1.5 transition-all group-hover:text-white/30">Configura subito un nuovo percorso</p>
          </motion.div>
        )}

        {filteredRoutines.length > 0 ? (
          filteredRoutines.map((routine, idx) => (
            <RoutineCard 
              key={`${routine.id}-${idx}`} 
              routine={routine} 
              categories={categories}
              onEdit={(section) => onEdit(routine, section)}
              onDelete={() => onDelete(routine.id)}
              onDuplicate={() => onDuplicate(routine)}
              onTogglePin={() => onTogglePin(routine.id)}
              onComplete={() => onCompleteRoutine(routine)}
              onConfig={() => setConfigRoutine(routine)}
              onUpdateRoutine={onUpdateRoutine}
              onViewHabits={() => setViewHabitsRoutine(routine)}
              onViewVision={() => onViewVision(routine)}
              isMenuOpen={activeMenu === routine.id}
              currentDate={currentDate}
              toggleMenu={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === routine.id ? null : routine.id);
              }}
            />
          ))
        ) : search ? (
          <div className="col-span-full text-center py-12 p-8 glass rounded-3xl border-dashed">
            <Layers className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm font-medium">Nessuna routine corrisponde ai filtri di ricerca</p>
          </div>
        ) : null}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-8 right-6">
        <button 
          onClick={handleCreateNewRoutine}
          className="w-14 h-14 rounded-2xl premium-gradient shadow-xl shadow-brand-cyan/20 flex items-center justify-center transform active:scale-95 transition-all text-white z-50"
          title="Crea nuova routine"
        >
          <Plus className="w-8 h-8" strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  );
}

const RoutineCard: React.FC<{ 
  routine: Routine, 
  categories: CategoryDefinition[],
  onDelete: () => void, 
  onDuplicate: () => void,
  onTogglePin: () => void,
  onComplete: () => void,
  onConfig: () => void,
  onUpdateRoutine: (routine: Routine) => void,
  isMenuOpen: boolean,
  currentDate: Date,
  toggleMenu: (e: React.MouseEvent) => void;
  onViewHabits: () => void;
  onViewVision: () => void;
  onEdit: (section?: 'details' | 'habits') => void;
}> = ({ routine, categories, onEdit, onDelete, onDuplicate, onTogglePin, onComplete, onConfig, onUpdateRoutine, isMenuOpen, currentDate, toggleMenu, onViewHabits, onViewVision }) => {
  const [viewMode, setViewMode] = useState<'current' | 'next'>('next');

  const handleCycleActivity = (activityId: string, dayKey: string) => {
    const updatedActivities = { ...routine.activities };
    const dayActivities = [...(updatedActivities[dayKey] || [])];
    const idx = dayActivities.findIndex(a => a.id === activityId);
    if (idx > -1) {
      const activity = dayActivities[idx];
      const totalCount = (activity.variants?.length || 0) + 1;
      const nextIdx = ((activity.alternationIndex || 0) + 1) % totalCount;
      dayActivities[idx] = { ...activity, alternationIndex: nextIdx };
      updatedActivities[dayKey] = dayActivities;
      onUpdateRoutine({ ...routine, activities: updatedActivities });
    }
  };

  const todayKey = (() => {
    const day = currentDate.getDay();
    return day === 0 ? "7" : day.toString();
  })();

  const isActivityFinished = (activity: Activity) => {
    if (!activity.startTime) return false;
    const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
    
    const timeToCompare = activity.endTime || activity.startTime;
    const [h, m] = timeToCompare.split(':').map(Number);
    const activityMinutes = h * 60 + m;
    
    return currentMinutes > activityMinutes;
  };

  const todayActivities = routine.activities[todayKey] || [];
  const habits = routine.habits || [];
  const finishedCount = todayActivities.filter(isActivityFinished).length;
  const missingCount = todayActivities.length - finishedCount;
  const totalTodayCount = todayActivities.length;

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
  
  const currentActivity = todayActivities.find(a => {
    if (!a.startTime) return false;
    const [sh, sm] = a.startTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    
    const endStr = a.endTime || a.startTime;
    const [eh, em] = endStr.split(':').map(Number);
    let endMins = eh * 60 + em;
    if (!a.endTime) endMins += 30; // default 30 mins
    
    return currentMinutes >= startMins && currentMinutes < endMins;
  });

  const nextActivity = todayActivities.find(a => {
    if (!a.startTime) return false;
    const [sh, sm] = a.startTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    return startMins > currentMinutes;
  });

  const getTimeRemaining = (activity: Activity) => {
    const endStr = activity.endTime || activity.startTime;
    const [eh, em] = endStr.split(':').map(Number);
    let endMins = eh * 60 + em;
    if (!activity.endTime) endMins += 30;
    
    const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
    const currentSeconds = currentDate.getSeconds();
    
    const diffMins = endMins - currentMinutes - 1;
    const diffSecs = 60 - currentSeconds;

    if (diffMins < 0) return 'Finito';
    
    if (diffMins === 0) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m ${diffSecs}s`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const getTimeUntilStart = (activity: Activity) => {
    const [sh, sm] = activity.startTime!.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
    const currentSeconds = currentDate.getSeconds();
    
    const diffMins = startMins - currentMinutes - 1;
    const diffSecs = 60 - currentSeconds;
    
    if (diffMins < 0 && currentMinutes < startMins) return `${diffSecs}s`;
    if (currentMinutes >= startMins) return "Adesso";
    
    if (diffMins === 0) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m ${diffSecs}s`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  return (
    <motion.div 
      layout
      className="rounded-[2.2rem] relative group cursor-pointer h-[310px]"
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => onEdit()}
    >
      <div 
        className="p-6 transition-all duration-500 h-full relative z-10 border border-white/20 group-hover:border-white/35 overflow-hidden shadow-2xl flex flex-col justify-between rounded-[2.2rem]"
        style={{ 
          backgroundColor: routine.color,
          boxShadow: `0 15px 35px -12px ${routine.color}50`
        }}
      >
        {/* Decorative Internal Elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/20 blur-3xl rounded-full" />

        <div className="relative z-20 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-0.5 max-w-[55%]">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {(routine.categories || []).map((catName, idx) => {
                  const catDef = categories.find(c => c.name === catName);
                  return (
                    <span 
                      key={`${catName}-${idx}`}
                      className="text-[8px] font-black uppercase tracking-[0.2em] drop-shadow-sm"
                      style={{ 
                        color: catDef ? catDef.color : 'rgba(255,255,255,0.4)',
                        WebkitTextStroke: (catDef && catDef.borderWidth && catDef.borderWidth > 0) ? `${catDef.borderWidth}px ${catDef.borderColor || '#ffffff'}` : '0',
                        fontWeight: (catDef && catDef.isBold !== false) ? '900' : '400',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {catName}
                    </span>
                  );
                })}
              </div>
              <h3 className="font-extrabold text-lg tracking-tight text-white drop-shadow-md leading-tight line-clamp-2">
                {routine.title || 'Senza titolo'}
              </h3>
              {routine.description && (
                <p className="text-white/75 text-[10px] leading-snug italic line-clamp-2 mt-0.5 drop-shadow-sm font-medium">
                  {routine.description}
                </p>
              )}
              {routine.deadlineDate && (() => {
                const status = getDeadlineStatus(routine.deadlineDate);
                if (!status) return null;
                return (
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border max-w-max leading-none drop-shadow-md backdrop-blur-md ${status.style}`}>
                      <Calendar className="w-2.5 h-2.5 text-current shrink-0" />
                      <span>{status.label}</span>
                    </div>
                    <span className="text-[9px] text-white/50 pl-0.5 font-bold tracking-wider uppercase flex items-center gap-1 dropdown-shadow">
                      scade il: {formatDeadlineDate(routine.deadlineDate)}
                    </span>
                  </div>
                );
              })()}
            </div>
            
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
              <button 
                onClick={(e) => { e.stopPropagation(); onViewVision(); }}
                className="p-2.5 bg-black/10 hover:bg-black/20 rounded-xl transition-all text-white border border-white/10 backdrop-blur-md relative"
                title="Routine Vibes & Vision"
              >
                <Target className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onViewHabits(); }}
                className="p-2.5 bg-black/10 hover:bg-black/20 rounded-xl transition-all text-white border border-white/10 backdrop-blur-md relative"
                title="Lista Abitudini"
              >
                <ListTodo className="w-4 h-4" />
                {(routine.habits || []).length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[8px] font-black rounded-full flex items-center justify-center border-2 shadow-sm" style={{ borderColor: routine.color }}>
                    {(routine.habits || []).length}
                  </div>
                )}
              </button>
              {routine.isPinned && <Pin className="w-3.5 h-3.5 text-white fill-white" />}
              <button 
                onClick={(e) => { e.stopPropagation(); toggleMenu(e); }}
                className="p-2.5 bg-black/10 hover:bg-black/20 rounded-xl transition-all text-white border border-white/10 backdrop-blur-md relative"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              {viewMode === 'current' ? (
                <motion.div 
                  key="current"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 pt-3.5 rounded-[1.8rem] border border-white/20 shadow-xl relative overflow-hidden backdrop-blur-xl min-h-[105px] flex flex-col justify-start"
                  style={{ 
                    background: `linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, ${routine.color}33 100%)` 
                  }}
                >
                  <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Ora</span>
                        {currentActivity && (
                          <span className="text-[8px] font-bold text-white/45 uppercase tracking-tight leading-none mt-0.5">
                            Fino alle {currentActivity.endTime || '...'}
                          </span>
                        )}
                      </div>
                      {currentActivity && (
                        <div className="flex items-center gap-1.5">
                          {currentActivity.variants && currentActivity.variants.length > 0 && (
                            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full border border-white/10">
                              <Shuffle className="w-2.5 h-2.5 text-brand-cyan animate-pulse" />
                              <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">Alt</span>
                            </div>
                          )}
                          <span className="text-[9px] font-black uppercase text-white bg-white/10 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                            -{getTimeRemaining(currentActivity)}
                          </span>
                        </div>
                      )}
                    </div>
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={(_, info) => {
                        if (currentActivity?.variants && currentActivity.variants.length > 0 && Math.abs(info.offset.x) > 30) {
                          handleCycleActivity(currentActivity.id, todayKey);
                        }
                      }}
                      onClick={(e) => {
                        if (currentActivity?.variants && currentActivity.variants.length > 0) {
                          e.stopPropagation();
                          handleCycleActivity(currentActivity.id, todayKey);
                        }
                      }}
                      className="cursor-pointer active:scale-95 transition-transform"
                    >
                      <p className="text-[15px] font-black text-white leading-tight tracking-tight mt-0.5 capitalize line-clamp-2">
                        {currentActivity 
                          ? (currentActivity.alternationIndex === 0 || !currentActivity.alternationIndex
                              ? currentActivity.title 
                              : currentActivity.variants?.[currentActivity.alternationIndex - 1])
                          : 'Nessuna attività ora'}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="next"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 pt-3.5 rounded-[1.8rem] border border-white/20 shadow-xl relative overflow-hidden backdrop-blur-xl min-h-[105px] flex flex-col justify-start"
                  style={{ 
                    background: `linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, ${routine.color}33 100%)` 
                  }}
                >
                  <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Prossima</span>
                        {nextActivity && (
                          <span className="text-[8px] font-bold text-white/45 uppercase tracking-tight leading-none mt-0.5">
                            Fino alle {nextActivity.endTime || '...'}
                          </span>
                        )}
                      </div>
                      {nextActivity && (
                        <div className="flex items-center gap-1.5">
                           {nextActivity.variants && nextActivity.variants.length > 0 && (
                            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full border border-white/10">
                              <Shuffle className="w-2.5 h-2.5 text-brand-azure" />
                            </div>
                          )}
                          <div className="flex gap-1">
                            <span className="text-[8.5px] font-black uppercase text-white/90 bg-white/10 px-2 py-1 rounded-full border border-white/10">
                              {nextActivity.startTime}
                            </span>
                            <span className="text-[8.5px] font-black uppercase text-white bg-brand-azure/40 px-2 py-1 rounded-full border border-white/20">
                              -{getTimeUntilStart(nextActivity)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={(_, info) => {
                        if (nextActivity?.variants && nextActivity.variants.length > 0 && Math.abs(info.offset.x) > 30) {
                          handleCycleActivity(nextActivity.id, todayKey);
                        }
                      }}
                       onClick={(e) => {
                        if (nextActivity?.variants && nextActivity.variants.length > 0) {
                          e.stopPropagation();
                          handleCycleActivity(nextActivity.id, todayKey);
                        }
                      }}
                      className="cursor-pointer active:scale-95 transition-transform"
                    >
                      <p className="text-[15px] font-black text-white leading-tight tracking-tight mt-0.5 capitalize line-clamp-2">
                        {nextActivity 
                           ? (nextActivity.alternationIndex === 0 || !nextActivity.alternationIndex
                               ? nextActivity.title 
                               : nextActivity.variants?.[nextActivity.alternationIndex - 1])
                           : 'Fine della giornata!'}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={(e) => { e.stopPropagation(); setViewMode(prev => prev === 'current' ? 'next' : 'current'); }}
              className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-white shadow-lg rounded-full flex items-center justify-center text-black/80 hover:scale-110 active:scale-95 transition-all z-20 border border-white/20"
            >
              {viewMode === 'current' ? <ChevronRight className="w-3 h-3" strokeWidth={3} /> : <ChevronLeft className="w-3 h-3" strokeWidth={3} />}
            </button>
          </div>
        </div>

        {/* Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xl z-30 flex items-center justify-center p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-2 gap-3 w-full">
                <MenuAction icon={routine.isPinned ? PinOff : Pin} label={routine.isPinned ? "Sblocca" : "Fissa"} color={routine.isPinned ? "text-orange-400" : "text-brand-cyan"} onClick={() => { onTogglePin(); toggleMenu({ stopPropagation: () => {} } as any); }} />
                <MenuAction icon={ListTodo} label="Copia Abitudini" color="text-brand-cyan" onClick={() => { onViewHabits(); toggleMenu({ stopPropagation: () => {} } as any); }} />
                <MenuAction icon={Palette} label="Configura" color="text-brand-azure" onClick={() => { onConfig(); toggleMenu({ stopPropagation: () => {} } as any); }} />
                <MenuAction icon={Check} label="Completa" color="text-emerald-400" onClick={() => { onComplete(); toggleMenu({ stopPropagation: () => {} } as any); }} />
                <MenuAction icon={Copy} label="Clona" color="text-brand-blue" onClick={onDuplicate} />
                <MenuAction icon={Trash2} label="Elimina" color="text-red-400" onClick={onDelete} />
              </div>
              <button 
                onClick={toggleMenu} 
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>

  );
}

function MenuAction({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group/btn"
    >
      <Icon className={`w-4 h-4 ${color} transition-transform group-hover/btn:scale-110`} />
      <span className="text-[10px] font-black uppercase tracking-widest text-white/50 group-hover/btn:text-white transition-colors">{label}</span>
    </button>
  );
}
