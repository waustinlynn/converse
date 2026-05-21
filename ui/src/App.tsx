import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, BookOpen, User, Settings, Info, Map } from 'lucide-react';
import { ConversationalUI } from './components/ConversationalUI';
import { JourneyTracker } from './components/JourneyTracker';
import { LESSON_CATEGORIES } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'converse' | 'journey'>('converse');
  const [currentCategoryId, setCurrentCategoryId] = useState(LESSON_CATEGORIES[0].id);
  const [completedIds, setCompletedIds] = useState<string[]>([]); // Start fresh

  const currentCategory = LESSON_CATEGORIES.find(c => c.id === currentCategoryId) || LESSON_CATEGORIES[0];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Immersive Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-olive-100 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Globe size={24} />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-ink-900 leading-none">Habla Local</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-olive-600 font-bold mt-1">Énfasis en la Voz</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-1 p-1 bg-olive-100/50 rounded-full border border-olive-100">
          <button 
            onClick={() => setCurrentTab('converse')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
              currentTab === 'converse' ? 'bg-white text-ink-900 shadow-sm' : 'text-olive-700 hover:text-ink-900'
            }`}
          >
            Conversar
          </button>
          <button 
            onClick={() => setCurrentTab('journey')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
              currentTab === 'journey' ? 'bg-white text-ink-900 shadow-sm' : 'text-olive-700 hover:text-ink-900'
            }`}
          >
            Mi Camino
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 text-olive-600 hover:text-ink-900 transition-colors">
            <BookOpen size={20} />
          </button>
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 p-0.5">
            <div className="w-full h-full bg-olive-200 rounded-full flex items-center justify-center text-olive-700">
              <User size={16} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {currentTab === 'converse' ? (
            <motion.div
              key="converse"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col"
            >
              <div className="px-8 pt-12">
                <div className="flex items-center gap-3 text-orange-600 mb-2">
                  <span className="w-12 h-[1px] bg-orange-600" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">{currentCategory.name}</span>
                </div>
                <h2 className="text-5xl font-serif text-ink-900 leading-tight italic">
                  ¿Qué tal si hablamos un poco?
                </h2>
              </div>
              
              <ConversationalUI 
                categoryId={currentCategory.id}
                categoryName={currentCategory.name} 
                mission={currentCategory.mission}
                culturalNote={currentCategory.culturalNote}
              />
            </motion.div>
          ) : (
            <motion.div
              key="journey"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <JourneyTracker 
                currentCategoryId={currentCategoryId}
                completedIds={completedIds}
                onSelectCategory={(id) => {
                  setCurrentCategoryId(id);
                  setCurrentTab('converse');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-xl rounded-2xl border border-olive-100 shadow-2xl z-50 flex items-center justify-around px-6">
        <button 
          onClick={() => setCurrentTab('converse')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'converse' ? 'text-orange-600' : 'text-olive-400'}`}
        >
          <Globe size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Hablar</span>
        </button>
        <button 
          onClick={() => setCurrentTab('journey')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'journey' ? 'text-orange-600' : 'text-olive-400'}`}
        >
          <Map size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Camino</span>
        </button>
      </nav>

      {/* Subtle Footer Info */}
      <footer className="px-8 py-12 flex flex-col md:flex-row items-center justify-between text-olive-900/40 border-t border-olive-100">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <span className="text-[10px] font-mono tracking-widest">HABLA LOCAL © 2026</span>
          <span className="w-1 h-1 bg-olive-200 rounded-full" />
          <span className="text-[10px] font-mono tracking-widest">HECHO EN ESPAÑA</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 hover:text-ink-900 transition-colors">
            <Info size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Créditos</span>
          </button>
          <button className="flex items-center gap-2 hover:text-ink-900 transition-colors">
            <Settings size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ajustes</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
