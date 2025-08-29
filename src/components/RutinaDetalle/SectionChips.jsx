import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Star } from 'lucide-react';
import ProgressRing from '../UI/ProgressRing';

// Mapeo de iconos para cada tipo de sección
const getSectionIcon = (sectionName) => {
  const name = sectionName.toLowerCase();
  if (name.includes('calentamiento') || name.includes('warm')) {
    return Flame;
  } else if (name.includes('principal') || name.includes('main')) {
    return Zap;
  } else if (name.includes('extra') || name.includes('cooldown') || name.includes('estiramiento')) {
    return Star;
  }
  return Zap; // Default
};

// Componente individual del chip de sección
const SectionChip = ({ 
  section, 
  isActive = false, 
  onClick, 
  setsCompleted = 0, 
  totalSets = 0 
}) => {
  const IconComponent = getSectionIcon(section.name);
  const progress = totalSets > 0 ? (setsCompleted / totalSets) * 100 : 0;
  
  return (
    <motion.button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full min-w-0 shrink-0
        border backdrop-blur-xl transition-all duration-300
        ${isActive 
          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-lg shadow-cyan-500/25' 
          : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/15 hover:border-white/30'
        }
      `}
      whileTap={{ scale: 0.95 }}
      layout
    >
      {/* Icono de la sección */}
      <motion.div
        animate={{ 
          rotate: isActive ? 360 : 0,
          scale: isActive ? 1.1 : 1
        }}
        transition={{ duration: 0.3 }}
      >
        <IconComponent className="w-4 h-4" />
      </motion.div>

      {/* Nombre de la sección */}
      <span className="text-sm font-medium truncate">
        {section.name}
      </span>

      {/* Mini indicador de progreso */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono">
          {setsCompleted}/{totalSets}
        </span>
        
        {/* Anillo de progreso mini */}
        <ProgressRing
          progress={progress}
          size={20}
          strokeWidth={2}
          color={isActive ? '#67e8f9' : '#9ca3af'} // cyan-300 o gray-400
          backgroundColor="rgba(255, 255, 255, 0.15)"
          className="shrink-0"
        />
      </div>

      {/* Badge de completado */}
      {setsCompleted === totalSets && totalSets > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2 h-2 bg-green-500 rounded-full"
        />
      )}
    </motion.button>
  );
};

const SectionChips = ({ 
  sections = [], 
  activeSectionId = null, 
  onSectionClick = () => {},
  sectionProgress = {} // Objeto con sectionId como key y { completed, total } como value
}) => {
  const scrollContainerRef = useRef(null);

  // Auto scroll al chip activo
  useEffect(() => {
    if (activeSectionId && scrollContainerRef.current) {
      const activeChip = scrollContainerRef.current.querySelector(`[data-section-id="${activeSectionId}"]`);
      if (activeChip) {
        activeChip.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeSectionId]);

  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="sticky top-[80px] z-40 bg-black/10 backdrop-blur-lg border-b border-white/5"
      style={{
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      }}
    >
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {sections.map((section) => {
          const progress = sectionProgress[section.id] || { completed: 0, total: 0 };
          
          return (
            <SectionChip
              key={section.id}
              section={section}
              isActive={activeSectionId === section.id}
              onClick={() => onSectionClick(section.id)}
              setsCompleted={progress.completed}
              totalSets={progress.total}
              data-section-id={section.id}
            />
          );
        })}
      </div>

      {/* Indicador de scroll si hay overflow */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-6 h-6 bg-gradient-to-l from-black/30 to-transparent rounded-full" />
      </div>
    </motion.div>
  );
};

export default SectionChips;
