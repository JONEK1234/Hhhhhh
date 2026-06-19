import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Sparkles, 
  ListTodo, 
  Copy, 
  Check, 
  X,
  PlusCircle,
  FolderPlus
} from 'lucide-react';
import { HabitGroup, Habit, Routine } from '../types.ts';
import { generateId } from '../utils.ts';

interface HabitLibraryProps {
  globalHabits: HabitGroup[];
  routines: Routine[];
  categories: string[];
  onUpdateGlobalHabits: (groups: HabitGroup[]) => void;
  onUpdateCategories: (cats: string[]) => void;
  onUpdateRoutines: (routines: Routine[]) => void;
  onBack: () => void;
}

export default function HabitLibrary({ globalHabits, routines, categories, onUpdateGlobalHabits, onUpdateCategories, onUpdateRoutines, onBack }: HabitLibraryProps) {
  const [showAddGroup, setShowAddGroup] = React.useState(false);
  const [newGroupTitle, setNewGroupTitle] = React.useState('');
  
  const [showAddHabitToGroup, setShowAddHabitToGroup] = React.useState<string | null>(null);
  const [newHabit, setNewHabit] = React.useState({
    title: '',
    category: categories[0] || 'Mente',
    description: ''
  });

  const [showAddCat, setShowAddCat] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState('');

  const [selectedForClone, setSelectedForClone] = React.useState<{groupId: string, habitId?: string} | null>(null);
  const [selectedRoutineIds, setSelectedRoutineIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (showAddGroup || showAddHabitToGroup || showAddCat || selectedForClone) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddGroup, showAddHabitToGroup, showAddCat, selectedForClone]);

  const handleAddGroup = () => {
    if (!newGroupTitle) return;
    const group: HabitGroup = {
      id: generateId(),
      title: newGroupTitle,
      habits: []
    };
    onUpdateGlobalHabits([...globalHabits, group]);
    setNewGroupTitle('');
    setShowAddGroup(false);
  };

  const handleAddHabit = (groupId: string) => {
    if (!newHabit.title) return;
    const habit: Habit = {
      ...newHabit,
      id: generateId(),
      goal: globalHabits.find(g => g.id === groupId)?.title
    };
    onUpdateGlobalHabits(globalHabits.map(g => 
      g.id === groupId ? { ...g, habits: [...g.habits, habit] } : g
    ));
    setNewHabit({ title: '', category: categories[0] || 'Mente', description: '' });
    setShowAddHabitToGroup(null);
  };

  const deleteGroup = (id: string) => {
    onUpdateGlobalHabits(globalHabits.filter(g => g.id !== id));
  };

  const deleteHabit = (groupId: string, habitId: string) => {
    onUpdateGlobalHabits(globalHabits.map(g => 
      g.id === groupId ? { ...g, habits: g.habits.filter(h => h.id !== habitId) } : g
    ));
  };

  const executeClone = () => {
    if (!selectedForClone || selectedRoutineIds.length === 0) return;

    const group = globalHabits.find(g => g.id === selectedForClone.groupId);
    if (!group) return;

    let habitsToClone: Habit[] = [];
    if (selectedForClone.habitId) {
      const habit = group.habits.find(h => h.id === selectedForClone.habitId);
      if (habit) habitsToClone = [habit];
    } else {
      habitsToClone = group.habits;
    }

    const updatedRoutines = routines.map(r => {
      if (selectedRoutineIds.includes(r.id)) {
        const clonedHabits = habitsToClone.map(h => ({ ...h, id: generateId() }));
        return { ...r, habits: [...(r.habits || []), ...clonedHabits] };
      }
      return r;
    });

    onUpdateRoutines(updatedRoutines);
    setSelectedForClone(null);
    setSelectedRoutineIds([]);
  };

  return (
    <div className="flex flex-col h-full bg-dark-surface p-6 pb-24 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-black uppercase tracking-widest text-brand-cyan">Libreria Abitudini</h2>
        <button 
          onClick={() => setShowAddGroup(true)}
          className="w-10 h-10 rounded-2xl premium-gradient flex items-center justify-center text-white"
        >
          <FolderPlus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {globalHabits.map((group, gIdx) => (
          <div key={`${group.id}-${gIdx}`} className="bg-white/5 rounded-[2.5rem] p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-white">{group.title}</h3>
                <span className="text-[10px] uppercase font-black text-white/20 tracking-widest">{group.habits.length} abitudini</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedForClone({ groupId: group.id })}
                  className="w-8 h-8 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan"
                  title="Clona intero gruppo"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteGroup(group.id)}
                  className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {group.habits.map((habit, hIdx) => (
                <div key={`${habit.id}-${hIdx}`} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group">
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 rounded-full bg-white/10 text-[8px] font-black uppercase text-white/40">{habit.category}</span>
                       <h4 className="text-sm font-bold">{habit.title}</h4>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setSelectedForClone({ groupId: group.id, habitId: habit.id })}
                      className="p-2 text-white/20 hover:text-brand-cyan"
                      title="Clona singola"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteHabit(group.id, habit.id)}
                      className="p-2 text-white/20 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowAddHabitToGroup(group.id)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-dashed border-white/10 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-brand-cyan transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Aggiungi Abitudine
            </button>
          </div>
        ))}

        {globalHabits.length === 0 && (
          <div className="text-center py-20 opacity-20">
             <ListTodo className="w-12 h-12 mx-auto mb-4" />
             <p className="text-xs font-black uppercase">Nessun gruppo ancora<br/>Crea il tuo primo set di obiettivi</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddGroup && (
          <div key="modal-add-group" className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowAddGroup(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="w-full max-w-sm max-h-[90vh] overflow-y-auto custom-scrollbar glass-dark p-8 rounded-[2.5rem] relative z-10 border border-white/10">
               <h4 className="text-xl font-bold mb-6">Nuovo Gruppo</h4>
               <input 
                 type="text" 
                 placeholder="Esempio: Glow Up, Studio..."
                 value={newGroupTitle}
                 onChange={e => setNewGroupTitle(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-cyan/50 mb-6"
               />
               <button onClick={handleAddGroup} className="w-full premium-gradient py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Crea</button>
            </motion.div>
          </div>
        )}

        {showAddHabitToGroup && (
          <div key="modal-add-habit" className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowAddHabitToGroup(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="w-full max-w-sm max-h-[90vh] overflow-y-auto custom-scrollbar glass-dark p-8 rounded-[2.5rem] relative z-10 border border-white/10">
               <h4 className="text-xl font-bold mb-6">Aggiungi Abitudine</h4>
               <div className="space-y-4">
                 <input 
                   type="text" 
                   placeholder="Titolo..."
                   value={newHabit.title}
                   onChange={e => setNewHabit({...newHabit, title: e.target.value})}
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-cyan/50"
                 />
                 <div className="flex flex-wrap gap-2 items-center">
                   {categories.map((cat, idx) => (
                     <div key={`cat-${cat}-${idx}`} className="group relative">
                       <button 
                         onClick={() => setNewHabit({...newHabit, category: cat})}
                         className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${newHabit.category === cat ? 'bg-brand-cyan text-black' : 'bg-white/5 text-white/40'}`}
                       >
                         {cat}
                       </button>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           onUpdateCategories(categories.filter(c => c !== cat));
                         }}
                         className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <X className="w-2.5 h-2.5 text-white" />
                       </button>
                     </div>
                   ))}
                   <button 
                    onClick={() => setShowAddCat(true)}
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-cyan/20 hover:text-brand-cyan transition-all"
                   >
                     <Plus className="w-3.5 h-3.5" />
                   </button>
                 </div>
                 <button onClick={() => handleAddHabit(showAddHabitToGroup)} className="w-full premium-gradient py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Conferma</button>
               </div>
            </motion.div>
          </div>
        )}

        {showAddCat && (
          <div key="modal-add-cat" className="fixed inset-0 z-[210] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowAddCat(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="w-full max-w-[280px] glass-dark p-6 rounded-3xl relative z-10 border border-white/20">
               <h5 className="text-sm font-bold mb-4 uppercase tracking-widest text-white/40">Nuova Categoria</h5>
               <input 
                 autoFocus
                 type="text" 
                 placeholder="Esempio: Viso, Studio..."
                 value={newCatName}
                 onChange={e => setNewCatName(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-brand-cyan/50 mb-4"
               />
               <button 
                onClick={() => {
                  if (newCatName && !categories.includes(newCatName)) {
                    onUpdateCategories([...categories, newCatName]);
                    setNewHabit({...newHabit, category: newCatName});
                  }
                  setNewCatName('');
                  setShowAddCat(false);
                }}
                className="w-full bg-brand-cyan text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
               >
                 Aggiungi
               </button>
            </motion.div>
          </div>
        )}

        {selectedForClone && (
          <div key="modal-clone" className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedForClone(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="w-full max-w-sm glass-dark p-8 rounded-[2.5rem] relative z-10 border border-white/10 flex flex-col max-h-[70vh]">
               <h4 className="text-xl font-bold mb-2">Clona in...</h4>
               <p className="text-[10px] uppercase font-black text-white/20 mb-6">Seleziona le routine</p>
               <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar">
                 {routines.map((r, rIdx) => (
                   <button 
                     key={`${r.id}-${rIdx}`}
                     onClick={() => setSelectedRoutineIds(prev => prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id])}
                     className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${selectedRoutineIds.includes(r.id) ? 'bg-brand-cyan/20 border-brand-cyan text-white' : 'bg-white/5 border-white/5 text-white/30'}`}
                   >
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: r.color}} />
                        <span className="font-bold text-sm">{r.title}</span>
                     </div>
                     {selectedRoutineIds.includes(r.id) && <Check className="w-4 h-4" />}
                   </button>
                 ))}
               </div>
               <button onClick={executeClone} className="w-full premium-gradient py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30" disabled={selectedRoutineIds.length === 0}>
                  Copia in {selectedRoutineIds.length} Routine
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
