/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft, 
  Trash2, 
  Clock, 
  Calendar as CalendarIcon, 
  Check,
  X,
  ListTodo,
  Sparkles,
  Copy,
  ArrowDown,
  Image as ImageIcon,
  Target,
  Smile,
  Frown,
  ExternalLink
} from 'lucide-react';
import { Routine, Activity, CategoryDefinition, Habit, HabitGroup, Vision } from '../types.ts';
import { getSeason, getDayName, calculateDuration, generateId } from '../utils.ts';
import { HexColorPicker } from 'react-colorful';

interface RoutineEditorProps {
  routine: Routine;
  allRoutines: Routine[];
  categories: CategoryDefinition[];
  globalHabits: HabitGroup[];
  habitCategories: string[];
  initialSection?: 'details' | 'habits';
  onSave: (routine: Routine) => void;
  onBatchUpdate: (routines: Routine[]) => void;
  onCancel: () => void;
}

export default function RoutineEditor({ routine: initialRoutine, allRoutines, categories, globalHabits, habitCategories, initialSection = 'details', onSave, onBatchUpdate, onCancel }: RoutineEditorProps) {
  const [routine, setRoutine] = useState<Routine>(initialRoutine);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 7);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const habitsRef = useRef<HTMLDivElement>(null);

  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  const scrollToHabits = () => {
    setTimeout(() => {
      habitsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (initialSection === 'habits') {
      scrollToHabits();
    }
  }, [initialSection]);

  const toggleCategory = (catName: string) => {
    setRoutine(prev => {
      const current = prev.categories || [];
      const updated = current.includes(catName)
        ? current.filter(c => c !== catName)
        : [...current, catName];
      return { ...prev, categories: updated };
    });
  };

  const [copySourceDay, setCopySourceDay] = useState<number | null>(null);
  const [copyTargetDays, setCopyTargetDays] = useState<number[]>([]);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [copyDays, setCopyDays] = useState<number[]>([]);

  // New Activity State
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    startTime: '',
    endTime: '',
    title: '',
    variants: [],
    alternationIndex: 0,
    description: ''
  });
  
  const [newHabit, setNewHabit] = useState({
    title: '',
    description: '',
    category: '',
    goal: ''
  });
  const [showAddHabit, setShowAddHabit] = useState(false);

  const handleAddHabit = () => {
    if (!newHabit.title) return;
    setRoutine(prev => ({
      ...prev,
      habits: [...(prev.habits || []), { ...newHabit, id: generateId() }]
    }));
    setNewHabit({ title: '', description: '', category: habitCategories[0] || '', goal: '' });
    setShowAddHabit(false);
  };

  const removeHabit = (id: string) => {
    setRoutine(prev => ({
      ...prev,
      habits: (prev.habits || []).filter(h => h.id !== id)
    }));
  };

  const now = new Date();
  const currentDayOfWeek = now.getDay() || 7;
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (showAddActivity || showAddHabit || showImportModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddActivity, showAddHabit, showImportModal]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTime = currentDate.getHours().toString().padStart(2, '0') + ":" + currentDate.getMinutes().toString().padStart(2, '0');

  const toggleCopyDay = (day: number) => {
    setCopyDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSaveActivity = () => {
    if (!newActivity.title) return;
    
    const activityId = editingActivityId || generateId();
    const targetDays = copyDays;
    
    setRoutine(prev => {
      const updatedActivities = { ...prev.activities };
      
      // We process all days to ensure sync (add/update in target days, remove from others if it was there)
      [1, 2, 3, 4, 5, 6, 7].forEach(day => {
        const isTarget = targetDays.includes(day);
        const dayActivities = [...(updatedActivities[day] || [])];
        const existingIndex = dayActivities.findIndex(a => a.id === activityId);

        if (isTarget) {
          const activityData: Activity = {
            id: activityId,
            title: newActivity.title!,
            variants: newActivity.variants,
            alternationIndex: newActivity.alternationIndex || 0,
            startTime: newActivity.startTime || undefined,
            endTime: newActivity.endTime || undefined,
            description: newActivity.description
          };

          if (existingIndex > -1) {
            dayActivities[existingIndex] = activityData;
          } else {
            dayActivities.push(activityData);
          }
          
          dayActivities.sort((a, b) => {
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            return a.startTime.localeCompare(b.startTime);
          });
          updatedActivities[day] = dayActivities;
        } else if (existingIndex > -1) {
          // Activity was here but is no longer in target days (unselected during edit)
          updatedActivities[day] = dayActivities.filter(a => a.id !== activityId);
        }
      });
      
      return { ...prev, activities: updatedActivities };
    });

    setNewActivity({ startTime: '', endTime: '', title: '', variants: [], alternationIndex: 0, description: '' });
    setCopyDays([]);
    setEditingActivityId(null);
    setShowAddActivity(false);
  };

  const startEditingActivity = (activity: Activity) => {
    setNewActivity({
      title: activity.title,
      variants: activity.variants || [],
      alternationIndex: activity.alternationIndex || 0,
      startTime: activity.startTime || '',
      endTime: activity.endTime || '',
      description: activity.description || ''
    });

    // Find which other days already have this activity ID
    const initialCopyDays: number[] = [];
    Object.entries(routine.activities).forEach(([day, activities]) => {
      const dayNum = parseInt(day);
      if ((activities as Activity[]).some(a => a.id === activity.id)) {
        initialCopyDays.push(dayNum);
      }
    });

    setEditingActivityId(activity.id);
    setCopyDays(initialCopyDays);
    setShowAddActivity(true);
  };

  const removeActivity = (id: string) => {
    setRoutine(prev => ({
      ...prev,
      activities: {
        ...prev.activities,
        [selectedDay]: (prev.activities[selectedDay] || []).filter(a => a.id !== id)
      }
    }));
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearDayActivities = () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      return;
    }
    
    setRoutine(prev => ({
      ...prev,
      activities: {
        ...prev.activities,
        [selectedDay]: []
      }
    }));
    setShowClearConfirm(false);
  };

  const copyAllActivities = (sourceDay: number, targetDays: number[]) => {
    if (targetDays.length === 0) return;
    
    setRoutine(prev => {
      const sourceActivities = prev.activities[sourceDay] || [];
      const updatedActivities = { ...prev.activities };
      
      targetDays.forEach(targetDay => {
        if (sourceDay !== targetDay) {
          // Regenerate IDs when copying to different days to avoid collisions
          updatedActivities[targetDay] = sourceActivities.map(a => ({
            ...a,
            id: generateId()
          }));
        }
      });
      
      return { ...prev, activities: updatedActivities };
    });
    
    setCopySourceDay(null);
    setCopyTargetDays([]);
  };

  const setStartAtPreviousEnd = () => {
    const dayActivities = routine.activities[selectedDay] || [];
    if (dayActivities.length === 0) return;
    
    // Sort to find the last one by time
    const sorted = [...dayActivities].sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });
    
    const last = sorted[sorted.length - 1];
    const lastEndTime = last.endTime || last.startTime;
    if (lastEndTime) {
      setNewActivity(prev => ({ ...prev, startTime: lastEndTime }));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col min-h-full"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-dark-surface/80 backdrop-blur-lg sticky top-0 z-20">
        <button onClick={onCancel} className="p-2 -ml-2 text-white/30 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <motion.div 
            layout
            className="px-6 py-2.5 rounded-2xl flex flex-col items-center shadow-2xl border border-white/20 transition-all duration-500"
            style={{ 
              backgroundColor: routine.color,
              boxShadow: `0 10px 20px -5px ${routine.color}40`
            }}
          >
            <h2 className="text-xs font-black text-white uppercase tracking-[.2em] leading-none mb-1 drop-shadow-sm">
              {routine.title || 'Nuova Routine'}
            </h2>
            {routine.description && (
              <p className="text-[9px] text-white/80 italic mb-1.5 opacity-90 font-medium max-w-[200px] truncate text-center">
                {routine.description}
              </p>
            )}
            <p className="text-[7px] text-white/80 uppercase tracking-widest font-bold">
              {(routine.categories || []).length > 0 ? (routine.categories || []).join(' • ') : 'Pianificazione Intelligente'}
            </p>
          </motion.div>
        </div>
        <button 
          onClick={() => onSave(routine)}
          className="p-2 -mr-2 text-brand-cyan hover:scale-110 active:scale-95 transition-all"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>


      {/* Intelligent Calendar Strip */}
      <CalendarStrip 
        selectedDay={selectedDay} 
        onSelect={(d) => {
          if (copySourceDay) {
            if (d === copySourceDay) {
              setCopySourceDay(null);
              setCopyTargetDays([]);
            } else {
              copyAllActivities(copySourceDay, [...copyTargetDays, d]);
            }
          } else {
            setSelectedDay(d);
          }
        }} 
        onLongPress={(d) => {
          if (d === null) {
            setCopySourceDay(null);
            setCopyTargetDays([]);
            return;
          }
          
          if (!copySourceDay) {
            setCopySourceDay(d);
          } else if (d !== copySourceDay) {
            setCopyTargetDays(prev => 
              prev.includes(d) ? prev.filter(td => td !== d) : [...prev, d]
            );
          }
        }}
        copySourceDay={copySourceDay}
        copyTargetDays={copyTargetDays}
      />

      {/* Visual Timeline / Agenda */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xs font-black text-white/40 tracking-widest uppercase">Timeline Giornaliera</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={scrollToHabits}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors text-white/40 hover:text-brand-azure border border-white/5"
              title="Vai alle abitudini"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button 
              onClick={clearDayActivities}
              onMouseLeave={() => setShowClearConfirm(false)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                showClearConfirm 
                  ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-110' 
                  : 'bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-400 border-white/5 hover:border-red-500/20'
              }`}
              title={showClearConfirm ? "Clicca di nuovo per confermare" : "Cancella tutto"}
            >
              {showClearConfirm ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => {
                setNewActivity({ startTime: '', endTime: '', title: '', variants: [], alternationIndex: 0, description: '' });
                setEditingActivityId(null);
                setCopyDays([selectedDay]);
                setShowAddActivity(true);
              }}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors text-brand-cyan border border-white/5 shadow-lg shadow-brand-cyan/5"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative border-l-2 border-white/5 ml-2 mt-4">
          {(routine.activities[selectedDay] || []).length > 0 ? (
            (routine.activities[selectedDay] || []).map((activity, index, array) => {
              const nextActivity = array[index + 1];
              const isToday = selectedDay === currentDayOfWeek;
              const isFirst = index === 0;
              
              return (
                <React.Fragment key={activity.id}>
                  {/* Countdown before the very first activity of the day */}
                  {isToday && isFirst && activity.startTime && currentTime < activity.startTime && (
                    <GapTimer 
                      nextTime={activity.startTime} 
                      currentDate={currentDate} 
                      label="Inizio Routine tra"
                      isFirst
                    />
                  )}

                  {(() => {
                    return (
                      <TimelineItem 
                        activity={activity} 
                        nextActivity={nextActivity}
                        color={routine.color} 
                        onDelete={() => removeActivity(activity.id)}
                        onEdit={() => startEditingActivity(activity)}
                        isToday={isToday}
                        currentTime={currentTime}
                        currentDate={currentDate}
                      />
                    );
                  })()}

                  {/* Gap Indicator between activities */}
                  {(() => {
                    if (!isToday || !nextActivity || !nextActivity.startTime) return null;
                    const prevEnd = activity.endTime || activity.startTime;
                    if (!prevEnd) return null;
                    
                    if (currentTime >= prevEnd && currentTime < nextActivity.startTime) {
                      return (
                        <GapTimer 
                          nextTime={nextActivity.startTime} 
                          currentDate={currentDate} 
                        />
                      );
                    }
                    return null;
                  })()}
                </React.Fragment>
              );
            })
          ) : (
            <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10 mx-4">
              <Clock className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/20 text-[10px] uppercase tracking-widest">Nessuna attività</p>
            </div>
          )}
        </div>
      </div>

      {/* Habits Section */}
      <div ref={habitsRef} className="p-6 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-black text-white/40 tracking-widest uppercase flex items-center gap-2">
              <ListTodo className="w-3 h-3" /> Abitudini Giornaliere
            </h3>
            <p className="text-[9px] text-white/20 uppercase font-medium mt-1">Checklist per obiettivi ricorrenti</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowImportModal(true)}
              className="w-10 h-10 bg-brand-azure/10 hover:bg-brand-azure/20 rounded-xl flex items-center justify-center transition-colors text-brand-azure border border-brand-azure/20"
              title="Importa dalla libreria"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowAddHabit(true)}
              className="w-10 h-10 bg-brand-cyan/10 hover:bg-brand-cyan/20 rounded-xl flex items-center justify-center transition-colors text-brand-cyan border border-brand-cyan/20"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {(routine.habits || []).length > 0 ? (
            (routine.habits || []).map((habit, idx) => {
              const isSelected = selectedHabitIds.includes(habit.id);
              return (
                <motion.div 
                  key={`${habit.id}-${idx}`}
                  layout
                  onClick={() => {
                     setSelectedHabitIds(prev => 
                       isSelected ? prev.filter(id => id !== habit.id) : [...prev, habit.id]
                     );
                  }}
                  className={`border rounded-2xl p-4 flex items-center justify-between group transition-all cursor-pointer ${
                    isSelected ? 'bg-brand-cyan/10 border-brand-cyan/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase transition-colors ${
                        isSelected ? 'bg-brand-cyan/20 border-brand-cyan/30 text-brand-cyan' : 'bg-white/10 border-white/10 text-white/40'
                      }`}>
                        {habit.goal ? `Obiettivo: ${habit.goal}` : (habit.category || 'Generale')}
                      </div>
                      <h4 className={`text-[13px] font-bold transition-colors ${isSelected ? 'text-brand-cyan' : 'text-white/90'}`}>{habit.title}</h4>
                    </div>
                    {(habit.description || (habit.goal && habit.category)) && (
                      <p className={`text-[10px] italic transition-colors ${isSelected ? 'text-brand-cyan/60' : 'text-white/30'}`}>
                        {habit.description} {habit.goal && habit.category ? `• ${habit.category}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeHabit(habit.id); }}
                      className="p-2 text-white/10 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-8 bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
              <p className="text-white/10 text-[9px] uppercase tracking-widest">Nessuna abitudine impostata</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
              onClick={() => {
                setShowAddActivity(false);
                setEditingActivityId(null);
                setCopyDays([]);
                setNewActivity({ startTime: '', endTime: '', title: '', variants: [], description: '' });
              }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[400px] max-h-[90vh] overflow-y-auto bg-dark-soft/90 backdrop-blur-xl rounded-[2.5rem] p-8 pointer-events-auto relative z-10 border border-white/10 shadow-2xl"
            >
              <button 
                onClick={() => {
                  setShowAddActivity(false);
                  setEditingActivityId(null);
                  setCopyDays([]);
                  setNewActivity({ startTime: '', endTime: '', title: '', variants: [], alternationIndex: 0, description: '' });
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="text-xl font-bold mb-6 pr-8">
                {editingActivityId ? 'Modifica Attività' : 'Aggiungi Attività'}
              </h4>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/30 block">Titolo</label>
                    <button 
                      onClick={() => setNewActivity(prev => ({ ...prev, variants: [...(prev.variants || []), ''] }))}
                      className="p-1 px-2 rounded-lg bg-white/5 hover:bg-brand-cyan/20 text-brand-cyan text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Alternanza
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Esempio: Allenamento"
                    value={newActivity.title}
                    onChange={e => setNewActivity({...newActivity, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-azure/50 mb-3"
                  />
                  
                  <AnimatePresence>
                    {newActivity.variants?.map((variant, index) => (
                      <motion.div 
                        key={`variant-${index}-${variant}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex gap-2 mb-3 items-center"
                      >
                        <div className="flex-1 relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <div className="w-[1.5px] h-3 bg-brand-cyan/40 rounded-full rotate-[15deg]" />
                            <span className="text-[9px] font-black text-brand-cyan/60 uppercase tracking-tighter">O</span>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Altra opzione..."
                            value={variant}
                            onChange={e => {
                              const newVariants = [...(newActivity.variants || [])];
                              newVariants[index] = e.target.value;
                              setNewActivity({ ...newActivity, variants: newVariants });
                            }}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:bg-white/[0.07] focus:border-brand-cyan/30 text-[13px] transition-all"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const newVariants = (newActivity.variants || []).filter((_, i) => i !== index);
                            setNewActivity({ ...newActivity, variants: newVariants });
                          }}
                          className="p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl transition-colors border border-red-500/5 hover:border-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-xs font-bold uppercase tracking-wider text-white/30 block">Inizio</label>
                       {(routine.activities[selectedDay] || []).length > 0 && (
                         <button 
                           onClick={setStartAtPreviousEnd}
                           className="text-[8px] font-black uppercase text-brand-cyan hover:text-white transition-colors"
                         >
                           Fine prec.
                         </button>
                       )}
                    </div>
                    <input 
                      type="time" 
                      value={newActivity.startTime}
                      onChange={e => setNewActivity({...newActivity, startTime: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-azure/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2 block">Fine</label>
                    <input 
                      type="time" 
                      value={newActivity.endTime}
                      onChange={e => setNewActivity({...newActivity, endTime: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-azure/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2 block">Note (Opzionale)</label>
                  <textarea 
                    placeholder="Dettagli aggiuntivi..."
                    value={newActivity.description}
                    onChange={e => setNewActivity({...newActivity, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-azure/50 resize-none text-[13px]"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3 block">
                    {editingActivityId ? 'Presente in questi giorni' : 'Copia in altri giorni'}
                  </label>
                  <div className="flex justify-between gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map(d => {
                      const isCurrentDay = d === selectedDay;
                      const isDaySelected = copyDays.includes(d);
                      const existsOnOtherDay = editingActivityId && routine.activities[d]?.some((a: Activity) => a.id === editingActivityId);

                      return (
                        <button
                          key={d}
                          onClick={() => toggleCopyDay(d)}
                          className={`w-9 h-9 rounded-xl text-[10px] font-bold transition-all border ${
                            isDaySelected && isCurrentDay ? 'bg-gradient-to-br from-emerald-400 to-cyan-400 text-black border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.4)]' :
                            isDaySelected ? 'bg-brand-cyan text-black border-brand-cyan shadow-[0_0_10px_rgba(6,182,212,0.4)]' :
                            'bg-white/5 border-white/5 text-white/30 hover:border-white/10'
                          } ${existsOnOtherDay && !isDaySelected ? 'opacity-60 border-brand-cyan/30' : ''}`}
                        >
                          {getDayName(d).substring(0, 1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={handleSaveActivity}
                  className="w-full premium-gradient py-4 rounded-2xl font-bold shadow-lg shadow-brand-azure/20 active:scale-[0.98] transition-all"
                >
                  {editingActivityId ? 'Aggiorna' : 'Conferma'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showAddHabit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
              onClick={() => setShowAddHabit(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[400px] max-h-[90vh] overflow-y-auto bg-dark-soft/90 backdrop-blur-xl rounded-[2.5rem] p-8 pointer-events-auto relative z-10 border border-white/10 shadow-2xl custom-scrollbar"
            >
              <button 
                onClick={() => setShowAddHabit(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-cyan/20 rounded-2xl">
                  <Sparkles className="w-5 h-5 text-brand-cyan" />
                </div>
                <h4 className="text-xl font-bold">Nuova Abitudine</h4>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2 block">Titolo</label>
                  <input 
                    type="text" 
                    placeholder="Esempio: Leggere 10 pagine"
                    value={newHabit.title}
                    onChange={e => setNewHabit({...newHabit, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-cyan/50 mb-3"
                  />
                </div>

                <div>
                   <label className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2 block">Obiettivo / Gruppo (Opzionale)</label>
                   <input 
                    type="text" 
                    placeholder="Esempio: Glow Up, Studio, Benessere..."
                    value={newHabit.goal}
                    onChange={e => setNewHabit({...newHabit, goal: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-cyan/50 mb-3"
                  />
                </div>

                <div>
                   <label className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2 block">Categoria</label>
                   <div className="flex flex-wrap gap-2 mb-3">
                     {habitCategories.map((cat, idx) => (
                       <button
                         key={`hcat-${cat}-${idx}`}
                         onClick={() => setNewHabit({...newHabit, category: cat})}
                         className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                           newHabit.category === cat 
                             ? 'bg-brand-cyan text-black border-brand-cyan' 
                             : 'bg-white/5 text-white/40 border border-white/5 hover:border-white/10'
                         }`}
                       >
                         {cat}
                       </button>
                     ))}
                   </div>
                   <input 
                    type="text" 
                    placeholder="O scrivi una personalizzata..."
                    value={newHabit.category}
                    onChange={e => setNewHabit({...newHabit, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-cyan/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2 block">Descrizione (Opzionale)</label>
                  <textarea 
                    placeholder="Dettagli per il tuo glow up..."
                    value={newHabit.description}
                    onChange={e => setNewHabit({...newHabit, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-cyan/50 resize-none text-[13px]"
                    rows={2}
                  />
                </div>

                <button 
                  onClick={handleAddHabit}
                  className="w-full premium-gradient py-4 rounded-2xl font-bold shadow-lg shadow-brand-azure/20 active:scale-[0.98] transition-all"
                >
                  Crea Abitudine
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
              onClick={() => setShowImportModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[400px] bg-dark-soft/90 backdrop-blur-xl rounded-[2.5rem] p-8 pointer-events-auto relative z-10 border border-white/10 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <button 
                onClick={() => setShowImportModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-brand-azure/20 rounded-2xl">
                  <Sparkles className="w-5 h-5 text-brand-azure" />
                </div>
                <h4 className="text-xl font-bold">Importa dalla Libreria</h4>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {globalHabits.map((group, gIdx) => (
                  <div key={`${group.id}-${gIdx}`} className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-white/20 px-2">{group.title}</h5>
                    {group.habits.map((habit, hIdx) => {
                      const isAlreadyPresent = (routine.habits || []).some(h => h.title === habit.title);
                      return (
                        <button
                          key={`${habit.id}-${hIdx}`}
                          disabled={isAlreadyPresent}
                          onClick={() => {
                            setRoutine(prev => ({
                              ...prev,
                              habits: [...(prev.habits || []), { ...habit, id: generateId() }]
                            }));
                            setShowImportModal(false);
                          }}
                          className={`w-full p-4 rounded-3xl flex items-center justify-between border transition-all ${
                            isAlreadyPresent 
                              ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed' 
                              : 'bg-white/5 border-white/5 hover:border-brand-azure/30 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-brand-azure/60 block mb-0.5">{habit.category}</span>
                            <span className="text-sm font-bold">{habit.title}</span>
                          </div>
                          {isAlreadyPresent ? <Check className="w-4 h-4 text-emerald-500" /> : <Plus className="w-4 h-4 text-brand-azure" />}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {globalHabits.length === 0 && (
                  <div className="text-center py-10 opacity-20">
                     <p className="text-xs font-black uppercase">Libreria vuota</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function CalendarStrip({ 
  selectedDay, 
  onSelect, 
  onLongPress,
  copySourceDay,
  copyTargetDays
}: { 
  selectedDay: number, 
  onSelect: (d: number) => void,
  onLongPress: (d: number | null) => void,
  copySourceDay: number | null,
  copyTargetDays: number[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);
  const now = new Date();
  const currentDayOfWeek = now.getDay() || 7;
  
  const handleMouseDown = (day: number) => {
    isLongPressActive.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      onLongPress(day);
      // Haptic feedback if available (only on some mobile devices)
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 600);
  };

  const handleMouseUp = (day: number) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!isLongPressActive.current) {
      // If was just a click (not a long press)
      onSelect(day);
    }
  };

  // Calculate relative dates for the strip
  const getDayInfo = (dOfWeek: number) => {
    const diff = dOfWeek - currentDayOfWeek;
    const date = new Date(now);
    date.setDate(now.getDate() + diff);
    return {
      day: date.getDate(),
      name: getDayName(dOfWeek).substring(0, 3),
      fullDate: date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  };

  return (
    <div className="py-6 border-b border-white/5 bg-white/2 cursor-default select-none relative">
      <AnimatePresence>
        {copySourceDay && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-[8px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg z-30 flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {copyTargetDays.length > 0 ? `Copia in ${copyTargetDays.length + 1} giorni (Click per confermare)` : 'Scegli giorno di destinazione'}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLongPress(null);
              }}
              className="ml-1 p-0.5 hover:bg-white/20 rounded-full"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 mb-4 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-bold text-brand-azure uppercase tracking-widest">{getSeason(now)} {now.getFullYear()}</span>
          <h3 className="text-sm font-medium text-white/80">{getDayInfo(selectedDay).fullDate}</h3>
        </div>
      </div>
      
      <div className="flex justify-between px-6 gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const info = getDayInfo(d);
          const isToday = d === currentDayOfWeek;
          const isSelected = d === selectedDay;
          const isSource = d === copySourceDay;
          const isTarget = copyTargetDays.includes(d);
          const isCopyMode = copySourceDay !== null;

          return (
            <button
              key={d}
              onMouseDown={() => handleMouseDown(d)}
              onMouseUp={() => handleMouseUp(d)}
              onTouchStart={() => handleMouseDown(d)}
              onTouchEnd={() => handleMouseUp(d)}
              onContextMenu={(e) => e.preventDefault()}
              className={`flex-1 flex flex-col items-center py-3 rounded-2xl transition-all relative ${
                isSource ? 'bg-emerald-500 text-white scale-110 shadow-[0_0_20px_rgba(16,185,129,0.4)] z-20' :
                isTarget ? 'bg-brand-cyan text-black scale-110 shadow-[0_0_15px_rgba(6,182,212,0.5)] z-10' :
                isSelected && !isCopyMode ? 'bg-brand-cyan text-black scale-110 cyan-glow-intense z-10' : 
                isCopyMode && !isSource ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                isToday ? 'text-white' : 'bg-white/5 text-white/40'
              } ${isToday && !isSelected && !isSource && !isTarget ? 'today-marker marker-anim' : ''} ${isSource ? 'animate-pulse' : ''}`}
            >
              <span className={`text-[9px] uppercase font-black mb-1 ${isSource || isTarget || (isSelected && !isCopyMode) ? 'opacity-60' : 'text-white/30'}`}>{info.name}</span>
              <span className={`text-sm font-black`}>{info.day}</span>
              {isToday && isSelected && !isCopyMode && (
                <div className="absolute -inset-1 border-2 border-red-500 rounded-full opacity-50 pointer-events-none transform rotate-3"></div>
              )}
              {isTarget && (
                <div className="absolute -top-1 -right-1 bg-brand-cyan border-2 border-dark rounded-full p-0.5 z-30">
                  <Plus className="w-2 h-2 text-black" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const TimelineItem: React.FC<{ 
  activity: Activity, 
  nextActivity?: Activity,
  color: string, 
  onDelete: () => void,
  onEdit: () => void,
  isToday: boolean,
  currentTime: string,
  currentDate: Date
}> = ({ activity, nextActivity, color, onDelete, onEdit, isToday, currentTime, currentDate }) => {
  const duration = calculateDuration(activity.startTime, activity.endTime);
  const isActive = isToday && activity.startTime && activity.endTime && 
                   currentTime >= activity.startTime && currentTime < activity.endTime;
  
  const isFinished = isToday && activity.startTime && (
    activity.endTime ? currentTime >= activity.endTime : currentTime > activity.startTime
  );

  const getActiveCountdown = () => {
    if (!activity.endTime) return null;
    const [h, m] = activity.endTime.split(':').map(Number);
    const target = new Date(currentDate);
    target.setHours(h, m, 0, 0);
    const diff = target.getTime() - currentDate.getTime();
    if (diff <= 0) return null;

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getNextActivityCountdown = () => {
    if (!nextActivity || !nextActivity.startTime) return null;
    
    // Check if there is a gap (next doesn't start exactly when this ends)
    if (activity.endTime && activity.endTime === nextActivity.startTime) return null;

    const [h, m] = nextActivity.startTime.split(':').map(Number);
    const target = new Date(currentDate);
    target.setHours(h, m, 0, 0);
    const diff = target.getTime() - currentDate.getTime();
    if (diff <= 0) return null;

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Connector Line */}
      <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-white/5 last:hidden" />
      
      {/* Time Dot */}
      <div 
        className={`absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full border border-dark-surface z-10 transition-all duration-500 flex items-center justify-center ${isActive ? 'scale-125' : ''}`} 
        style={{ 
          backgroundColor: isFinished ? '#22c55e' : (isActive ? '#fff' : color),
          boxShadow: isActive ? `0 0 15px #fff` : (isFinished ? '0 0 10px rgba(34, 197, 94, 0.4)' : 'none'),
          borderColor: isFinished ? '#22c55e' : (isActive ? '#fff' : 'rgba(255,255,255,0.2)')
        }}
      >
        {isFinished ? (
          <Check className="w-3 h-3 text-white" />
        ) : isActive && (
          <div className="absolute inset-0 rounded-full bg-white blur-[4px] animate-pulse"></div>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, x: 10 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          borderColor: isActive ? `${color}60` : (isFinished ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)'),
          backgroundColor: isActive ? `${color}15` : (isFinished ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.05)')
        }}
        onClick={onEdit}
        className={`rounded-3xl p-4 relative overflow-hidden group border backdrop-blur-sm transition-all duration-500 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${isActive ? 'cyan-glow' : ''}`}
      >
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            {isActive && (
              <div className="px-1.5 py-0.5 bg-red-500 rounded text-[7px] font-black text-white animate-pulse mr-1">
                LIVE
              </div>
            )}
            {isFinished && (
              <div className="px-1.5 py-0.5 bg-green-500 rounded text-[7px] font-black text-white mr-1 uppercase">
                Completato
              </div>
            )}
            {(activity.startTime || activity.endTime) ? (
              <>
                <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-white' : (isFinished ? 'text-green-400' : 'text-brand-cyan')}`}>
                  {activity.startTime || '--:--'} — {activity.endTime || '--:--'}
                </span>
                {duration && (
                  <>
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="text-[9px] font-bold text-white/30 uppercase">{duration}</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">Orario non specificato</span>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 -mr-1 text-white/10 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <h4 className={`text-sm font-bold mb-0.5 tracking-tight ${isActive ? 'text-white' : (isFinished ? 'text-white/60 line-through decoration-white/20' : 'text-white/90')}`}>
          <div className="flex items-center flex-wrap gap-x-2">
            <span>{activity.title}</span>
            {activity.variants && activity.variants.length > 0 && (
              activity.variants.map((v, i) => {
                const isLast = i === activity.variants!.length - 1;
                return (
                  <React.Fragment key={`v-fragment-${v}-${i}`}>
                    <div className="flex items-center">
                      {!isLast && <div className="w-[1.5px] h-3 bg-white/20 rounded-full rotate-[15deg] mx-1" />}
                      <span className="text-white/40 font-normal text-[10px] lowercase mx-1">o</span>
                    </div>
                    <span className="text-white">{v}</span>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </h4>
        
        {isActive && (
          <div className="mt-2 space-y-2">
            {activity.endTime && (
              <div className="flex items-center gap-2">
                 <div className="text-[9px] font-black uppercase tracking-[.2em] text-white/40">Tempo rimanente:</div>
                 <div className="text-[11px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                   {getActiveCountdown()}
                 </div>
              </div>
            )}
            {getNextActivityCountdown() && (
              <div className="flex items-center gap-2">
                 <div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-400/40">Prossima tra:</div>
                 <div className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-lg border border-cyan-400/10">
                   {getNextActivityCountdown()}
                 </div>
              </div>
            )}
          </div>
        )}

        {activity.description && (
          <p className="text-[10px] text-white/30 leading-relaxed italic line-clamp-1 mt-2">{activity.description}</p>
        )}
      </motion.div>
    </div>
  );
}

function GapTimer({ nextTime, currentDate, label = "Prossima attività tra", isFirst = false }: { nextTime: string, currentDate: Date, label?: string, isFirst?: boolean }) {
  const [h, m] = nextTime.split(':').map(Number);
  const target = new Date(currentDate);
  target.setHours(h, m, 0, 0);
  
  const diff = target.getTime() - currentDate.getTime();
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return (
    <div className={`relative pl-8 mb-8 ${isFirst ? 'mt-4' : 'mt-[-16px]'}`}>
      <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-white/5" />
      <div className="flex items-center gap-3">
        <div className="w-6 h-[2px] bg-white/10" />
        <div className="glass px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-3 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_cyan]" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{label}</span>
            <span className="text-[10px] font-mono font-bold text-brand-cyan">
              {hours}h {minutes}m {seconds}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
