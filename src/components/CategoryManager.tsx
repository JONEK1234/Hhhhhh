/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft, 
  Trash2, 
  Check, 
  X,
  Tag
} from 'lucide-react';
import { CategoryDefinition } from '../types.ts';
import { generateId } from '../utils.ts';

interface CategoryManagerProps {
  categories: CategoryDefinition[];
  onSave: (categories: CategoryDefinition[]) => void;
  onCancel: () => void;
}

export default function CategoryManager({ categories: initialCategories, onSave, onCancel }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryDefinition[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#ffffff');
  const [editBorderColor, setEditBorderColor] = useState('#ffffff');
  const [editBorderWidth, setEditBorderWidth] = useState(0);
  const [editIsBold, setEditIsBold] = useState(true);

  const handleAdd = () => {
    const newCat: CategoryDefinition = {
      id: generateId(),
      name: 'Nuova Categoria',
      color: '#ffffff',
      borderColor: '#ffffff',
      borderWidth: 0,
      isBold: true,
    };
    setCategories([...categories, newCat]);
    setEditingId(newCat.id);
    setEditName(newCat.name);
    setEditColor(newCat.color || '#ffffff');
    setEditBorderColor(newCat.borderColor || '#ffffff');
    setEditBorderWidth(newCat.borderWidth || 0);
    setEditIsBold(true);
  };

  const handleDelete = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleStartEdit = (cat: CategoryDefinition) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color || '#ffffff');
    setEditBorderColor(cat.borderColor || '#ffffff');
    setEditBorderWidth(cat.borderWidth || 0);
    setEditIsBold(cat.isBold !== undefined ? cat.isBold : true);
  };

  const handleFinishEdit = () => {
    if (!editName.trim()) return;
    setCategories(prev => prev.map(c => c.id === editingId ? { 
      ...c, 
      name: editName.trim(),
      color: editColor,
      borderColor: editBorderColor,
      borderWidth: editBorderWidth,
      isBold: editIsBold
    } : c));
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-dark-surface">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-dark-surface/80 backdrop-blur-lg sticky top-0 z-20">
        <button onClick={onCancel} className="p-2 -ml-2 text-white/30 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black bg-white bg-clip-text text-transparent uppercase tracking-widest">
            Gestione Categorie
          </h2>
          <p className="text-[8px] text-white/30 uppercase tracking-tighter">Organizza il tuo tempo</p>
        </div>
        <button 
          onClick={() => onSave(categories)}
          className="p-2 -mr-2 text-emerald-400 hover:scale-110 active:scale-95 transition-all"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest">Le tue etichette</h3>
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest"
          >
            <Plus className="w-3 h-3" /> Aggiungi
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {categories.map((cat) => (
              <motion.div 
                layout
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass rounded-2xl p-4 flex flex-col gap-4 border border-white/5 group"
              >
                {editingId === cat.id ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 items-center justify-center min-h-[60px]">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 self-start">Anteprima</span>
                          <div 
                          className="px-3 py-1.5 text-[10px] uppercase tracking-widest drop-shadow-sm transition-all"
                          style={{ 
                            color: editColor,
                            WebkitTextStroke: editBorderWidth > 0 ? `${editBorderWidth}px ${editBorderColor}` : '0',
                            fontWeight: editIsBold ? '900' : '400',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                          }}
                        >
                          {editName || 'Anteprima'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input 
                          autoFocus
                          type="text" 
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                          placeholder="Nome categoria"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Grassetto</span>
                        <button 
                          onClick={() => setEditIsBold(!editIsBold)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                            editIsBold ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/40 border border-white/10'
                          }`}
                        >
                          {editIsBold ? 'B' : 'b'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Colore Testo</span>
                        <input 
                          type="color"
                          value={editColor}
                          onChange={e => setEditColor(e.target.value)}
                          className="w-8 h-8 rounded-full border-none cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Colore Bordo</span>
                        <input 
                          type="color"
                          value={editBorderColor || '#ffffff'}
                          onChange={e => setEditBorderColor(e.target.value)}
                          className="w-8 h-8 rounded-full border-none cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
                        />
                      </div>

                      <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Spessore Bordo Testo</span>
                          <span className="text-[10px] font-bold text-white/60">{editBorderWidth}px</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={editBorderWidth}
                          onChange={e => setEditBorderWidth(parseFloat(e.target.value))}
                          className="w-full accent-emerald-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={handleFinishEdit}
                        className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-500/30 transition-colors"
                      >
                        Conferma
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-3 bg-white/5 text-white/40 rounded-xl hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => handleStartEdit(cat)}>
                    <div 
                      className="px-3 py-1.5 text-[10px] uppercase tracking-widest drop-shadow-sm"
                      style={{ 
                        color: cat.color || '#ffffff',
                        WebkitTextStroke: (cat.borderWidth && cat.borderWidth > 0) ? `${cat.borderWidth}px ${cat.borderColor || '#ffffff'}` : '0',
                        fontWeight: cat.isBold !== false ? '900' : '400',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {cat.name}
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }} 
                        className="text-white/20 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {categories.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <Tag className="w-12 h-12 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[.3em]">Nessuna categoria</p>
          </div>
        )}
      </div>

      <div className="p-6">
        <p className="text-[10px] text-white/20 text-center leading-relaxed">
          Personalizza ogni categoria con colori unici per distinguere facilmente le tue attività.
        </p>
      </div>
    </div>
  );
}
