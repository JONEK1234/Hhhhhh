/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Settings, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  Box,
  Layout as LayoutIcon,
  Moon,
  Sun,
  Bell,
  Tv,
  CircleDot
} from 'lucide-react';
import { Routine, Activity, Category, CategoryDefinition, CompletedRoutine, HabitGroup, Habit } from './types.ts';
import { generateId, calculateDuration, getSeason, getDayName } from './utils.ts';

// Components
import Home from './components/Home.tsx';
import RoutineEditor from './components/RoutineEditor.tsx';
import Notification from './components/Notification.tsx';
import CategoryManager from './components/CategoryManager.tsx';
import History from './components/History.tsx';
import HabitLibrary from './components/HabitLibrary.tsx';
import VisionSection from './components/VisionSection.tsx';

export default function App() {
  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem('droid_routines');
    return saved ? JSON.parse(saved) : [];
  });

  const [completedRoutines, setCompletedRoutines] = useState<CompletedRoutine[]>(() => {
    const saved = localStorage.getItem('droid_completed_routines');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<CategoryDefinition[]>(() => {
    const saved = localStorage.getItem('droid_categories');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Lavoro', color: '#a855f7', borderColor: '#a855f7', borderWidth: 0 },
      { id: '2', name: 'Personale', color: '#0ea5e9', borderColor: '#0ea5e9', borderWidth: 0 },
      { id: '3', name: 'Studio', color: '#f59e0b', borderColor: '#f59e0b', borderWidth: 0 },
      { id: '4', name: 'Sport', color: '#22c55e', borderColor: '#22c55e', borderWidth: 0 }
    ];
  });
  
  const [view, setView] = useState<'home' | 'edit' | 'categories' | 'history' | 'habits' | 'vision'>('home');
  const [globalHabits, setGlobalHabits] = useState<HabitGroup[]>(() => {
    const saved = localStorage.getItem('droid_global_habits');
    return saved ? JSON.parse(saved) : [];
  });
  const [globalHabitCategories, setGlobalHabitCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('droid_global_habit_cats');
    return saved ? JSON.parse(saved) : ['Mente', 'Corpo', 'Anima', 'Studio', 'Riposo'];
  });
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [editorInitialSection, setEditorInitialSection] = useState<'details' | 'habits' | 'vision'>('details');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [sleepTime, setSleepTime] = useState<string>(() => {
    return localStorage.getItem('droid_sleep_time') || '23:30';
  });
  const [restStartTime, setRestStartTime] = useState<string>(() => {
    return localStorage.getItem('droid_rest_start_time') || '22:30';
  });
  const [sensorChangedAt, setSensorChangedAt] = useState<string>(() => {
    return localStorage.getItem('droid_sensor_changed_at') || new Date().toISOString();
  });
  const [sensorTolerance, setSensorTolerance] = useState<boolean>(() => {
    return localStorage.getItem('droid_sensor_tolerance') === 'true';
  });

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTime = currentDate.getHours().toString().padStart(2, '0') + ":" + currentDate.getMinutes().toString().padStart(2, '0');

  const getTargetDate = (timeStr: string, referenceDate: Date) => {
    const [h, m] = timeStr.split(':').map(Number);
    const target = new Date(referenceDate);
    target.setHours(h, m, 0, 0);
    return target;
  };

  const restTimer = useMemo(() => {
    const now = new Date(currentDate);
    let restStart = getTargetDate(restStartTime, currentDate);
    let sleepEnd = getTargetDate(sleepTime, currentDate);
    
    // Normalize sleepEnd if it's past midnight
    if (sleepEnd < restStart) sleepEnd.setDate(sleepEnd.getDate() + 1);

    const formatDiff = (diff: number) => {
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    };

    if (now >= restStart && now < sleepEnd) {
      // During Rest - show time remaining
      return {
        label: 'Rest End',
        time: formatDiff(sleepEnd.getTime() - now.getTime()),
        isActive: true
      };
    } else {
      // Waiting for rest - show time until start
      if (restStart < now) restStart.setDate(restStart.getDate() + 1);
      return {
        label: 'Rest Start',
        time: formatDiff(restStart.getTime() - now.getTime()),
        isActive: false
      };
    }
  }, [currentDate, restStartTime, sleepTime]);

  const sleepTimer = useMemo(() => {
    const now = new Date(currentDate);
    let sleep = getTargetDate(sleepTime, currentDate);
    if (sleep < now) sleep.setDate(sleep.getDate() + 1);
    
    const diff = sleep.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    
    return {
      time: `${h}:${m}:${s}`
    };
  }, [currentDate, sleepTime]);

  const sensorTimer = useMemo(() => {
    const changedDate = new Date(sensorChangedAt);
    const durationDays = 10;
    const toleranceHours = sensorTolerance ? 12 : 0;
    
    const expiryDate = new Date(changedDate.getTime());
    expiryDate.setDate(expiryDate.getDate() + durationDays);
    expiryDate.setHours(expiryDate.getHours() + toleranceHours);

    const now = new Date(currentDate);
    const diff = expiryDate.getTime() - now.getTime();

    if (diff <= 0) {
      return { 
        time: 'SCADUTO', 
        expiry: expiryDate.toLocaleString('it-IT', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
        isExpired: true 
      };
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    let timeStr = "";
    if (d > 0) {
      timeStr = `${d}g ${h}h ${m}m`;
    } else {
      timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return { 
      time: timeStr, 
      expiry: expiryDate.toLocaleString('it-IT', { weekday: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      isExpired: false 
    };
  }, [currentDate, sensorChangedAt, sensorTolerance]);

  useEffect(() => {
    // Check for pinned routine on launch
    const saved = localStorage.getItem('droid_routines');
    if (saved) {
      const parsed = JSON.parse(saved) as Routine[];
      const pinned = parsed.find(r => r.isPinned);
      if (pinned) {
        setEditingRoutine(JSON.parse(JSON.stringify(pinned)));
        setView('edit');
      }
    }
  }, []); // Run once explicitly on mount with local storage check

  useEffect(() => {
    localStorage.setItem('droid_routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('droid_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('droid_sleep_time', sleepTime);
  }, [sleepTime]);

  useEffect(() => {
    localStorage.setItem('droid_rest_start_time', restStartTime);
  }, [restStartTime]);

  useEffect(() => {
    localStorage.setItem('droid_sensor_changed_at', sensorChangedAt);
  }, [sensorChangedAt]);

  useEffect(() => {
    localStorage.setItem('droid_sensor_tolerance', sensorTolerance.toString());
  }, [sensorTolerance]);

  useEffect(() => {
    localStorage.setItem('droid_completed_routines', JSON.stringify(completedRoutines));
  }, [completedRoutines]);

  useEffect(() => {
    localStorage.setItem('droid_global_habits', JSON.stringify(globalHabits));
  }, [globalHabits]);

  useEffect(() => {
    localStorage.setItem('droid_global_habit_cats', JSON.stringify(globalHabitCategories));
  }, [globalHabitCategories]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateNew = () => {
    const newRoutine: Routine = {
      id: generateId(),
      title: '',
      description: '',
      color: '#0ea5e9',
      categories: [categories[0]?.name || 'Generale'],
      activities: {
        '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': []
      },
      createdAt: Date.now()
    };
    setEditingRoutine(newRoutine);
    setView('edit');
  };
  
  const handleTogglePin = (id: string) => {
    setRoutines(prev => prev.map(r => {
      if (r.id === id) {
        const newState = !r.isPinned;
        if (newState) {
          // Only one routine can be pinned at a time
          return { ...r, isPinned: true };
        }
        return { ...r, isPinned: false };
      }
      return { ...r, isPinned: false }; // Unpin others
    }));
    showNotification('Configurazione pin aggiornata');
  };

  const handleEdit = (routine: Routine, section: 'details' | 'habits' = 'details') => {
    setEditingRoutine(JSON.parse(JSON.stringify(routine))); // Deep copy
    setEditorInitialSection(section);
    setView('edit');
  };

  const handleViewVision = (routine: Routine) => {
    setEditingRoutine(JSON.parse(JSON.stringify(routine)));
    setView('vision');
  };

  const handleSave = (routine: Routine, shouldClose: boolean = true) => {
    if (!routine.title) {
      showNotification('Inserisci un titolo per la routine', 'error');
      return;
    }
    
    setRoutines(prev => {
      const index = prev.findIndex(r => r.id === routine.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = routine;
        return updated;
      }
      return [routine, ...prev];
    });
    
    if (shouldClose) {
      setView('home');
      setEditingRoutine(null);
    } else {
      setEditingRoutine(routine);
    }
    showNotification('Routine salvata con successo!');
  };

  const handleDelete = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
    showNotification('Routine eliminata');
  };

  const handleDuplicate = (routine: Routine) => {
    // Deep clone the routine structure
    const duplicated: Routine = JSON.parse(JSON.stringify(routine));
    
    // Assign new IDs to everything
    duplicated.id = generateId();
    duplicated.title = `${routine.title} (Copia)`;
    duplicated.createdAt = Date.now();
    
    // Update IDs for all activities
    if (duplicated.activities) {
      Object.keys(duplicated.activities).forEach(day => {
        duplicated.activities[day] = duplicated.activities[day].map(a => ({
          ...a,
          id: generateId()
        }));
      });
    }
    
    // Update IDs for all habits
    if (duplicated.habits) {
      duplicated.habits = duplicated.habits.map(h => ({
        ...h,
        id: generateId()
      }));
    }

    // Update IDs for all complementary routines
    if (duplicated.complementaryRoutines) {
      duplicated.complementaryRoutines = duplicated.complementaryRoutines.map(cr => ({
        ...cr,
        id: generateId()
      }));
    }

    setRoutines(prev => [duplicated, ...prev]);
    showNotification('Routine duplicata');
  };

  const handleComplete = (routine: Routine) => {
    const completed: CompletedRoutine = {
      id: generateId(),
      routineId: routine.id,
      title: routine.title,
      description: routine.description,
      color: routine.color,
      categories: routine.categories,
      activitiesAtCompletion: JSON.parse(JSON.stringify(routine.activities)),
      startedAt: routine.createdAt,
      completedAt: Date.now(),
      habitsAtCompletion: routine.habits ? JSON.parse(JSON.stringify(routine.habits)) : undefined,
      complementaryRoutinesAtCompletion: routine.complementaryRoutines ? JSON.parse(JSON.stringify(routine.complementaryRoutines)) : undefined
    };
    setCompletedRoutines(prev => [completed, ...prev]);
    setRoutines(prev => prev.filter(r => r.id !== routine.id));
    showNotification('Obiettivo raggiunto! Spostata in cronologia.');
  };

  const handleRestoreCompleted = (completed: CompletedRoutine) => {
    const restored: Routine = {
      id: completed.routineId || generateId(),
      title: completed.title,
      description: completed.description,
      color: completed.color,
      categories: completed.categories,
      activities: completed.activitiesAtCompletion,
      createdAt: Date.now(),
      habits: completed.habitsAtCompletion,
      complementaryRoutines: completed.complementaryRoutinesAtCompletion
    };
    setRoutines(prev => [restored, ...prev]);
    setCompletedRoutines(prev => prev.filter(r => r.id !== completed.id));
    showNotification('Routine ripristinata correttamente');
  };

  const handleUpdateCompleted = (updated: CompletedRoutine) => {
    setCompletedRoutines(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleDeleteCompleted = (id: string) => {
    setCompletedRoutines(prev => prev.filter(r => r.id !== id));
    showNotification('Cronologia rimossa');
  };

  const handleSaveCategories = (newCategories: CategoryDefinition[]) => {
    setCategories(newCategories);
    setView('home');
    showNotification('Categorie aggiornate');
  };

  return (
    <div className="min-h-screen immersive-bg flex items-center justify-center p-0 md:p-8 selection:bg-brand-cyan/30 relative overflow-hidden">
      {/* Outer Glows */}
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] -top-20 -left-20 animate-pulse pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -bottom-20 -right-20 pointer-events-none"></div>

      {/* Container stile Smartphone */}
      <div 
        id="phone-container"
        className="relative w-full h-full md:w-[360px] md:h-[720px] bg-dark-surface md:rounded-[3.5rem] md:border-[8px] border-dark-soft shadow-2xl overflow-hidden flex flex-col android-shadow"
      >
        {/* Notch / Status Bar */}
        {view !== 'vision' && (
          <div className="h-8 px-8 flex justify-between items-center text-[10px] font-medium opacity-80 mt-1">
            <span className="text-white/60">{currentTime}</span>
            <div className="flex gap-2 items-center">
              {/* Rest Timer */}
              <div 
                onClick={() => setShowGlobalSettings(true)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors cursor-pointer hover:bg-white/5 active:scale-95 ${
                restTimer.isActive 
                  ? 'bg-brand-cyan/10 border-brand-cyan/20' 
                  : 'bg-brand-azure/10 border-brand-azure/20'
              }`}>
                <Tv className={`w-2.5 h-2.5 ${restTimer.isActive ? 'text-brand-cyan' : 'text-brand-azure'}`} />
                <span className={`font-bold tracking-tight text-[9px] ${
                  restTimer.isActive ? 'text-brand-cyan' : 'text-brand-azure'
                }`}>{restTimer.time}</span>
              </div>
              
              {/* Sleep Timer */}
              <div 
                onClick={() => setShowGlobalSettings(true)}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full cursor-pointer hover:bg-brand-cyan/20 active:scale-95"
              >
                <Moon className="w-2.5 h-2.5 text-brand-cyan" />
                <span className="text-brand-cyan font-bold tracking-tight text-[9px]">{sleepTimer.time}</span>
              </div>
   
              {/* Sensor Timer */}
              <div 
                onClick={() => setShowGlobalSettings(true)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all cursor-pointer hover:opacity-80 active:scale-95 ${
                sensorTimer.isExpired ? 'bg-red-500/20 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <CircleDot className={`w-2.5 h-2.5 ${sensorTimer.isExpired ? 'text-red-400' : 'text-emerald-400'}`} />
                <span className={`font-bold tracking-tight text-[9px] ${sensorTimer.isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                  {sensorTimer.time}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 relative overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <Home 
                  routines={routines} 
                  categories={categories}
                  sleepTime={sleepTime}
                  onUpdateSleepTime={setSleepTime}
                  restStartTime={restStartTime}
                  onUpdateRestStartTime={setRestStartTime}
                  sensorChangedAt={sensorChangedAt}
                  onUpdateSensorChangedAt={setSensorChangedAt}
                  sensorTolerance={sensorTolerance}
                  onUpdateSensorTolerance={setSensorTolerance}
                  showGlobalSettings={showGlobalSettings}
                  onSetShowGlobalSettings={setShowGlobalSettings}
                  onCreateNew={handleCreateNew}
                  onEdit={(routine, section) => handleEdit(routine, section)}
                  onViewVision={(routine) => handleViewVision(routine)}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onTogglePin={handleTogglePin}
                  onManageCategories={() => setView('categories')}
                  onUpdateRoutine={(updated) => {
                    setRoutines(prev => {
                      const exists = prev.some(r => r.id === updated.id);
                      if (exists) {
                        return prev.map(r => r.id === updated.id ? updated : r);
                      } else {
                        return [...prev, updated];
                      }
                    });
                  }}
                  onViewHistory={() => setView('history')}
                  onManageHabits={() => setView('habits')}
                  onCompleteRoutine={handleComplete}
                  currentDate={currentDate}
                />
              </motion.div>
            )}
            {view === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <History 
                  completedRoutines={completedRoutines}
                  onDelete={handleDeleteCompleted}
                  onRestore={handleRestoreCompleted}
                  onUpdate={handleUpdateCompleted}
                  onBack={() => setView('home')}
                />
              </motion.div>
            )}
            {view === 'habits' && (
              <motion.div 
                key="habits"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <HabitLibrary 
                  globalHabits={globalHabits}
                  routines={routines}
                  categories={globalHabitCategories}
                  onUpdateGlobalHabits={setGlobalHabits}
                  onUpdateCategories={setGlobalHabitCategories}
                  onUpdateRoutines={setRoutines}
                  onBack={() => setView('home')}
                />
              </motion.div>
            )}
            {view === 'edit' && (
              <motion.div 
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <RoutineEditor 
                  routine={editingRoutine!}
                  allRoutines={routines}
                  categories={categories}
                  globalHabits={globalHabits}
                  habitCategories={globalHabitCategories}
                  initialSection={editorInitialSection}
                  onSave={handleSave}
                  onBatchUpdate={setRoutines}
                  onCancel={() => {
                    setView('home');
                    setEditingRoutine(null);
                  }}
                />
              </motion.div>
            )}
            {view === 'vision' && (
              <motion.div 
                key="vision"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <VisionSection 
                  routine={editingRoutine!}
                  onBack={() => {
                    setView('home');
                    setEditingRoutine(null);
                  }}
                  onSave={(updated) => {
                    handleSave(updated, false);
                  }}
                />
              </motion.div>
            )}
            {view === 'categories' && (
              <motion.div 
                key="categories"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <CategoryManager 
                  categories={categories}
                  onSave={handleSaveCategories}
                  onCancel={() => setView('home')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Popup */}
        <AnimatePresence>
          {notification && (
            <Notification 
              message={notification.message} 
              type={notification.type} 
              onClose={() => setNotification(null)}
            />
          )}
        </AnimatePresence>

        {/* Home Indicator */}
        {view !== 'vision' && <div className="h-1.5 w-32 bg-white/20 rounded-full mx-auto mb-2 mt-1"></div>}
      </div>

      {/* Desktop Info Cards (Optional, hidden on mobile) */}
      <div className="absolute right-20 space-y-4 hidden lg:block pointer-events-none">
        <div className="w-64 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
          <h4 className="text-brand-cyan text-xs font-bold uppercase tracking-widest mb-2">DroidRoutine Pro</h4>
          <p className="text-lg font-medium">Gestione Immersiva</p>
          <p className="text-xs text-white/50">Ottimizzato per Android</p>
        </div>
        <div className="w-64 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
          <h4 className="text-brand-cyan text-xs font-bold uppercase tracking-widest mb-2">Salvataggio Cloud</h4>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-full bg-brand-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
            </div>
            <span className="text-sm font-bold">ATTIVO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
