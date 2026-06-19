/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Clock, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  Box,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit2,
  ListTodo,
  CheckSquare
} from 'lucide-react';
import { useState } from 'react';
import { CompletedRoutine, Activity, Habit } from '../types.ts';
import { calculateDuration } from '../utils.ts';

interface HistoryProps {
  completedRoutines: CompletedRoutine[];
  onDelete: (id: string) => void;
  onRestore: (routine: CompletedRoutine) => void;
  onUpdate: (routine: CompletedRoutine) => void;
  onBack: () => void;
}

export default function History({ completedRoutines, onDelete, onRestore, onUpdate, onBack }: HistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toInputDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const getDayLabel = (day: string) => {
    const days = ['', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    return days[parseInt(day)] || day;
  };

  return (
    <div className="h-full flex flex-col pt-12">
      {/* Header */}
      <div className="px-6 mb-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Cronologia
            </h2>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Obiettivi Raggiunti</p>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
        {completedRoutines.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center opacity-40">
            <Box className="w-12 h-12 mb-4" />
            <p className="text-sm font-medium">Nessuna routine completata</p>
            <p className="text-[10px] uppercase tracking-widest mt-1">I tuoi progressi appariranno qui</p>
          </div>
        ) : (
          <div className="space-y-4">
            {completedRoutines.map((routine) => (
              <motion.div 
                layout
                key={routine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3"
                        style={{ backgroundColor: routine.color }}
                      >
                        <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white leading-tight">{routine.title}</h3>
                        <div className="flex gap-1.5 mt-1">
                          {routine.categories.map((cat, idx) => (
                            <span key={`hist-cat-${cat}-${idx}`} className="text-[8px] font-black uppercase tracking-wider text-white/40">{cat}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => onRestore(routine)}
                        className="p-2 text-emerald-400/40 hover:text-emerald-400 transition-colors"
                        title="Ripristina Routine"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(routine.id)}
                        className="p-2 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-black/20 border border-white/5 relative group">
                      <div className="flex items-center justify-between mb-1 opacity-40">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase tracking-wider">Inizio</span>
                        </div>
                        <button 
                          onClick={() => setEditingDateId(editingDateId === routine.id ? null : routine.id)}
                          className="hover:text-white transition-colors"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      
                      {editingDateId === routine.id ? (
                        <input 
                          type="datetime-local"
                          defaultValue={toInputDateTime(routine.startedAt)}
                          onChange={(e) => {
                            const newDate = new Date(e.target.value).getTime();
                            if (!isNaN(newDate)) {
                              onUpdate({ ...routine, startedAt: newDate });
                            }
                          }}
                          onBlur={() => setEditingDateId(null)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white p-1 focus:outline-none focus:border-emerald-500/50"
                        />
                      ) : (
                        <p className="text-[10px] font-bold text-white/60">{formatDate(routine.startedAt)}</p>
                      )}
                    </div>
                    <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
                      <div className="flex items-center gap-2 mb-1 opacity-40">
                        <Clock className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-wider">Fine</span>
                      </div>
                      <p className="text-[10px] font-bold text-emerald-400">{formatDate(routine.completedAt)}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setExpandedId(expandedId === routine.id ? null : routine.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60">Dettagli attività</span>
                    {expandedId === routine.id ? (
                      <ChevronUp className="w-4 h-4 text-white/20" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/20" />
                    )}
                  </button>

                  {expandedId === routine.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-4 space-y-4 pt-4 border-t border-white/5"
                    >
                      {Object.entries(routine.activitiesAtCompletion).map(([day, activities]) => (
                        activities.length > 0 && (
                          <div key={day} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-white/5" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{getDayLabel(day)}</span>
                              <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <div className="space-y-2">
                              {activities.map((act, idx) => (
                                <div key={`${act.id}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-white/90">{act.title}</span>
                                    <span className="text-[9px] font-black tracking-widest text-emerald-400/60 uppercase">
                                      Durata: {calculateDuration(act.startTime, act.endTime)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                                    <span>{act.startTime}</span>
                                    <span>-</span>
                                    <span>{act.endTime}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}

                      {/* Sezione Abitudini Utilizzate */}
                      {routine.habitsAtCompletion && routine.habitsAtCompletion.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-white/5" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#00E5FF] flex items-center gap-1.5">
                              <ListTodo className="w-3.5 h-3.5" /> Abitudini Utilizzate ({(routine.habitsAtCompletion || []).length})
                            </span>
                            <div className="h-px flex-1 bg-white/5" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {routine.habitsAtCompletion.map((habit, idx) => (
                              <div 
                                key={`${habit.id}-${idx}`} 
                                className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#00E5FF]/5 border border-[#00E5FF]/15 group hover:bg-[#00E5FF]/10 transition-colors duration-300"
                              >
                                <div className="p-1.5 bg-[#00E5FF]/10 rounded-xl text-[#00E5FF] shrink-0 mt-0.5">
                                  <CheckSquare className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col min-w-0 pr-1">
                                  <span className="text-xs font-bold text-white/95 truncate">
                                    {habit.title}
                                  </span>
                                  {habit.description && (
                                    <span className="text-[10px] text-white/50 leading-relaxed italic mt-0.5 line-clamp-2">
                                      {habit.description}
                                    </span>
                                  )}
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    <span className="text-[8px] font-black uppercase text-[#00E5FF]/80 tracking-wider">
                                      {habit.category}
                                    </span>
                                    {habit.goal && (
                                      <>
                                        <span className="text-white/20 text-[8px]">•</span>
                                        <span className="text-[8px] font-black uppercase tracking-wider text-amber-400/80">
                                          Target: {habit.goal}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
