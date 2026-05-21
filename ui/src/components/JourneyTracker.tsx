import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Lock, Map, Star } from 'lucide-react';
import { LESSON_CATEGORIES, LessonCategory } from '../types';

interface JourneyTrackerProps {
  currentCategoryId: string;
  completedIds: string[];
  onSelectCategory: (id: string) => void;
}

export const JourneyTracker: React.FC<JourneyTrackerProps> = ({ 
  currentCategoryId, 
  completedIds,
  onSelectCategory
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-3 bg-olive-100 rounded-2xl text-olive-700">
          <Map size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-serif text-ink-900">Tu Camino</h3>
          <p className="text-sm text-ink-500 uppercase tracking-widest font-mono">El Viaje a la Fluidez</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LESSON_CATEGORIES.map((cat, index) => {
          const isCompleted = completedIds.includes(cat.id);
          const isActive = currentCategoryId === cat.id;
          const isLocked = index > 0 && !completedIds.includes(LESSON_CATEGORIES[index - 1].id);

          return (
            <motion.button
              key={cat.id}
              whileHover={isLocked ? {} : { y: -5 }}
              whileTap={isLocked ? {} : { scale: 0.98 }}
              onClick={() => !isLocked && onSelectCategory(cat.id)}
              disabled={isLocked}
              className={`p-6 rounded-[2rem] text-left border-2 transition-all duration-300 relative overflow-hidden ${
                isActive 
                  ? 'bg-olive-900 border-olive-900 text-white shadow-xl ring-4 ring-olive-900/10' 
                  : isLocked
                  ? 'bg-ink-50 border-ink-100 text-ink-400 cursor-not-allowed opacity-60'
                  : 'bg-white border-ink-100 text-ink-900 hover:border-olive-200 hover:shadow-lg'
              }`}
            >
              {/* Background accent */}
              <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10 flex items-center justify-center ${
                isActive ? 'bg-white' : 'bg-olive-500'
              }`}>
                <Star size={32} />
              </div>

              <div className="flex flex-col h-full space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                    isActive ? 'text-olive-300' : 'text-ink-400'
                  }`}>
                    Nivel {cat.level}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-orange-500" />
                  ) : isLocked ? (
                    <Lock size={18} />
                  ) : null}
                </div>

                <div>
                  <h4 className="text-xl font-serif mb-1 leading-tight">{cat.name}</h4>
                  <p className={`text-xs leading-relaxed opacity-70 ${
                    isActive ? 'text-olive-100' : 'text-ink-500 font-sans'
                  }`}>
                    {cat.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                  {isActive ? (
                    <motion.span 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      Practicando Ahora
                    </motion.span>
                  ) : isLocked ? (
                    <span>Bloqueado</span>
                  ) : (
                    <span>Iniciar Lección</span>
                  )}
                  {!isLocked && <ChevronRight size={12} />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
