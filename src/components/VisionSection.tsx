import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Edit2, 
  Save, 
  X, 
  Plus, 
  Target, 
  Smile, 
  Frown, 
  Image as ImageIcon,
  Sparkles,
  Zap,
  Calendar,
  Clock,
  Trash2,
  Maximize2
} from 'lucide-react';
import { Routine, Vision, VisionNote } from '../types.ts';

interface VisionSectionProps {
  routine: Routine;
  onBack: () => void;
  onSave: (updatedRoutine: Routine) => void;
}

export default function VisionSection({ routine: initialRoutine, onBack, onSave }: VisionSectionProps) {
  const [routine, setRoutine] = useState<Routine>(initialRoutine);
  const [isEditing, setIsEditing] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newSuccessText, setNewSuccessText] = useState('');
  const [newFailureText, setNewFailureText] = useState('');
  const [selectedNote, setSelectedNote] = useState<{ type: 'success' | 'failure'; note: VisionNote } | null>(null);

  const formatTimestamp = (ts: string) => {
    if (!ts) return { date: '', time: '' };
    if (ts.includes(', ')) {
      const parts = ts.split(', ');
      return { date: parts[0], time: parts[1] };
    }
    const parts = ts.split(' ');
    if (parts.length >= 2) {
      return { date: parts[0], time: parts[1] };
    }
    return { date: ts, time: '' };
  };

  const updateVision = (field: keyof Vision, value: any) => {
    setRoutine(prev => ({
      ...prev,
      vision: {
        ...(prev.vision || { images: [], successScript: '', failureScript: '', successNotes: [], failureNotes: [] }),
        [field]: value
      }
    }));
  };

  const addNote = (type: 'success' | 'failure') => {
    const text = type === 'success' ? newSuccessText : newFailureText;
    if (!text.trim()) return;

    const now = new Date();
    const timestamp = now.toLocaleString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newNote: VisionNote = {
      id: crypto.randomUUID(),
      text: text.trim(),
      timestamp
    };

    const field = type === 'success' ? 'successNotes' : 'failureNotes';
    const currentNotes = routine.vision?.[field] || [];
    updateVision(field, [newNote, ...currentNotes]);

    if (type === 'success') setNewSuccessText('');
    else setNewFailureText('');
  };

  const deleteNote = (type: 'success' | 'failure', id: string) => {
    const field = type === 'success' ? 'successNotes' : 'failureNotes';
    const currentNotes = routine.vision?.[field] || [];
    updateVision(field, currentNotes.filter(n => n.id !== id));
  };

  const handleSave = () => {
    onSave(routine);
    setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative h-full flex flex-col overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img 
          src="https://www.image2url.com/r2/default/images/1779210383678-c12ce082-e4ef-4d42-9f0a-b5011ca2d411.jpg" 
          alt="" 
          className="w-full h-full object-cover opacity-35 scale-110"
          referrerPolicy="no-referrer"
        />
        <div 
          className="absolute inset-0 opacity-55 blur-[120px] scale-150"
          style={{ backgroundColor: routine.color }}
        />
        <div className="absolute inset-0 bg-[#05080c]/35 backdrop-blur-[2px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 sm:px-12 py-8 sm:py-12 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white/50 hover:text-white transition-all backdrop-blur-xl border border-white/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-widest uppercase mb-1">{routine.title}</h2>
          <p className="text-[9px] sm:text-[11px] text-brand-cyan font-black uppercase tracking-[0.4em]">Vibes & Vision Board</p>
        </div>

        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-6 sm:px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all backdrop-blur-xl border flex items-center gap-3 ${
            isEditing 
            ? 'bg-brand-cyan text-black border-brand-cyan shadow-[0_0_20px_rgba(34,211,238,0.4)]' 
            : 'bg-white/5 text-white/60 hover:text-white border-white/10'
          }`}
        >
          {isEditing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          <span className="hidden sm:inline">
            {isEditing ? 'Salva' : 'Modifica'}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-6 sm:px-16 md:px-24 pb-40">
        <div className="max-w-7xl mx-auto space-y-24 py-12">
          
          {/* SECTION 1: VISION BOARD */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-azure/20 flex items-center justify-center text-brand-azure shadow-lg border border-brand-azure/20">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-[0.3em]">Vision Board</h3>
              </div>
              
              {isEditing && (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="URL Immagine..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-azure/50 min-w-[200px]"
                  />
                  <button 
                    onClick={() => {
                      if (newImageUrl) {
                        updateVision('images', [...(routine.vision?.images || []), newImageUrl]);
                        setNewImageUrl('');
                      }
                    }}
                    className="bg-brand-azure text-black p-2 rounded-xl border border-brand-azure/20 transition-all shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {(routine.vision?.images || []).map((img, idx) => (
                <motion.div 
                  key={idx}
                  layoutId={`vision-img-${idx}`}
                  className="relative group aspect-[4/3] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-white/5 flex items-center justify-center cursor-pointer"
                  onClick={() => setSelectedImage(img)}
                >
                  <img 
                    src={img} 
                    alt="" 
                    className="max-w-[90%] max-h-[90%] object-contain transition-transform duration-700 group-hover:scale-110" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  {isEditing && (
                    <div className="absolute inset-x-0 bottom-0 p-4 flex justify-end items-center bg-gradient-to-t from-black/80 to-transparent">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateVision('images', (routine.vision?.images || []).filter((_, i) => i !== idx));
                        }}
                        className="p-3 bg-red-500/80 backdrop-blur-md rounded-2xl text-white border border-white/20 hover:bg-red-600 transition-all shadow-lg pointer-events-auto"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
              {(!routine.vision?.images || routine.vision.images.length === 0) && !isEditing && (
                <div className="col-span-full py-24 text-center glass rounded-[3rem] border-dashed border-white/10">
                  <Sparkles className="w-10 h-10 text-white/5 mx-auto mb-4" />
                  <p className="text-white/20 text-xs uppercase tracking-[0.3em] font-black italic">Inizia a costruire la tua Vision Board</p>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: SUCCESS NOTES */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan shadow-lg border border-brand-cyan/20">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-[0.3em]">Momenti di Successo</h3>
            </div>

            <div className="space-y-6">
              {isEditing && (
                <div className="glass p-8 rounded-[3rem] border border-brand-cyan/20 space-y-6">
                  <textarea
                    value={newSuccessText}
                    onChange={(e) => setNewSuccessText(e.target.value)}
                    placeholder="Visualizza il tuo successo futuro..."
                    className="w-full bg-transparent border-none text-white text-lg sm:text-xl leading-relaxed focus:outline-none min-h-[120px] resize-none font-medium placeholder:text-white/20 italic"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={() => addNote('success')}
                      className="bg-brand-cyan text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg"
                    >
                      <Plus className="w-4 h-4" /> Salva Momento
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-6 sm:gap-8 justify-start">
                <AnimatePresence mode="popLayout">
                  {(routine.vision?.successNotes || []).map((note) => {
                    const { date, time } = formatTimestamp(note.timestamp);
                    return (
                      <motion.div 
                        key={note.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center group relative cursor-pointer w-20 sm:w-24"
                        onClick={() => setSelectedNote({ type: 'success', note })}
                      >
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[1.8rem] bg-gradient-to-tr from-brand-cyan/20 to-brand-cyan/45 hover:from-brand-cyan/30 hover:to-brand-cyan/65 border border-brand-cyan/40 hover:border-brand-cyan/60 shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:shadow-[0_0_25px_rgba(34,211,238,0.45)] transition-all duration-300 flex items-center justify-center transform group-hover:scale-105">
                          <div className="absolute inset-2 bg-brand-cyan/15 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                          <Smile className="w-8 h-8 sm:w-10 sm:h-10 text-brand-cyan drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                          
                          <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan"></span>
                          </span>
                          
                          {isEditing && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote('success', note.id);
                              }}
                              className="absolute -top-1.5 -right-1.5 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 z-10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        
                        <div className="text-center mt-3 w-full">
                          <p className="text-[10px] sm:text-[11px] font-black tracking-wider text-brand-cyan uppercase leading-tight truncate px-1">
                            {date}
                          </p>
                          <p className="text-[8px] sm:text-[9px] font-medium text-white/40 tracking-wider mt-0.5">
                            {time}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {(!routine.vision?.successNotes || routine.vision.successNotes.length === 0) && !isEditing && (
                <div className="p-16 text-center border border-dashed border-white/10 rounded-[3rem]">
                  <p className="text-white/20 text-xs uppercase tracking-[0.3em] font-black italic">
                    Ancora nessun momento di successo registrato.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 3: FAILURE NOTES */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 shadow-lg border border-red-500/20">
                <Frown className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-[0.3em]">Costo dell'Inazione</h3>
            </div>

            <div className="space-y-6">
              {isEditing && (
                <div className="glass-dark p-8 rounded-[3rem] border border-red-500/20 space-y-6">
                  <textarea
                    value={newFailureText}
                    onChange={(e) => setNewFailureText(e.target.value)}
                    placeholder="Cosa perdi se non agisci oggi?..."
                    className="w-full bg-transparent border-none text-white text-lg sm:text-xl leading-relaxed focus:outline-none min-h-[120px] resize-none font-medium placeholder:text-white/20 italic"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={() => addNote('failure')}
                      className="bg-red-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg"
                    >
                      <Plus className="w-4 h-4" /> Aggiungi Nota
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-6 sm:gap-8 justify-start">
                <AnimatePresence mode="popLayout">
                  {(routine.vision?.failureNotes || []).map((note) => {
                    const { date, time } = formatTimestamp(note.timestamp);
                    return (
                      <motion.div 
                        key={note.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center group relative cursor-pointer w-20 sm:w-24"
                        onClick={() => setSelectedNote({ type: 'failure', note })}
                      >
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[1.8rem] bg-gradient-to-tr from-red-500/10 to-red-950/40 hover:from-red-500/20 hover:to-red-900/50 border border-red-500/30 hover:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_25px_rgba(239,68,68,0.25)] transition-all duration-300 flex items-center justify-center transform group-hover:scale-105">
                          <div className="absolute inset-2 bg-red-500/10 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                          <Frown className="w-8 h-8 sm:w-10 sm:h-10 text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.45)]" />
                          
                          <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500/60 font-sans"></span>
                          </span>

                          {isEditing && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote('failure', note.id);
                              }}
                              className="absolute -top-1.5 -right-1.5 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 z-10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        
                        <div className="text-center mt-3 w-full">
                          <p className="text-[10px] sm:text-[11px] font-black tracking-wider text-red-400/85 uppercase leading-tight truncate px-1">
                            {date}
                          </p>
                          <p className="text-[8px] sm:text-[9px] font-medium text-white/30 tracking-wider mt-0.5">
                            {time}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {(!routine.vision?.failureNotes || routine.vision.failureNotes.length === 0) && !isEditing && (
                <div className="p-16 text-center border border-dashed border-white/5 rounded-[3rem]">
                  <p className="text-white/20 text-xs uppercase tracking-[0.3em] font-black italic">
                    Nessun riflesso registrato sul fallimento.
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 md:p-12"
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage} 
              alt="Fullscreen vision" 
              className="max-w-full max-h-full object-contain rounded-3xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Detail Modal */}
      <AnimatePresence>
        {selectedNote && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 md:p-12"
            onClick={() => setSelectedNote(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`max-w-2xl w-full p-8 md:p-12 rounded-[3.5rem] border shadow-2xl relative ${
                selectedNote.type === 'success' 
                  ? 'glass border-brand-cyan/30 text-white' 
                  : 'glass-dark border-red-500/20 text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative Top Pill */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                  selectedNote.type === 'success'
                    ? 'bg-brand-cyan/25 text-brand-cyan border border-brand-cyan/30'
                    : 'bg-red-500/25 text-red-400 border border-red-500/30'
                }`}>
                  {selectedNote.type === 'success' ? 'Momento di Successo' : "Costo dell'Inazione"}
                </span>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setSelectedNote(null)}
                className="absolute top-6 right-6 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon Header */}
              <div className="flex justify-center mb-8 mt-4">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-lg ${
                  selectedNote.type === 'success' 
                  ? 'bg-brand-cyan/25 border-brand-cyan/40 text-brand-cyan shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                  : 'bg-red-500/25 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                }`}>
                  {selectedNote.type === 'success' ? <Smile className="w-8 h-8" /> : <Frown className="w-8 h-8" />}
                </div>
              </div>

              {/* Note Text */}
              <div className="text-center space-y-6">
                <p className="text-xl sm:text-2xl md:text-3xl leading-relaxed italic font-light whitespace-pre-wrap px-4">
                  "{selectedNote.note.text}"
                </p>
                
                {/* Timestamp Footer */}
                <div className="flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-widest text-white/40 pt-4">
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <Calendar className="w-4 h-4" />
                    {formatTimestamp(selectedNote.note.timestamp).date}
                  </div>
                  {formatTimestamp(selectedNote.note.timestamp).time && (
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                      <Clock className="w-4 h-4" />
                      {formatTimestamp(selectedNote.note.timestamp).time}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions inside Modal */}
              {isEditing && (
                <div className="flex justify-center mt-12 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => {
                      deleteNote(selectedNote.type, selectedNote.note.id);
                      setSelectedNote(null);
                    }}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 transition-all shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" /> Elimina questa nota
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
