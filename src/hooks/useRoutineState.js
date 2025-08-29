import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook personalizado para gestionar el estado complejo de la rutina en curso
 * Centraliza toda la lógica de UI y interacciones de la nueva arquitectura
 */
const useRoutineState = (rutina, elementosCompletados) => {
  // Estados de UI
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [expandedExercises, setExpandedExercises] = useState(new Set());
  const [restTimerState, setRestTimerState] = useState({
    isActive: false,
    duration: 0,
    exerciseName: '',
    variant: 'simple'
  });

  // Estados de modales/drawers
  const [showExitModal, setShowExitModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [activeFloatingButton, setActiveFloatingButton] = useState(null);

  // Referencias
  const sectionRefs = useRef({});
  const contentRef = useRef(null);

  // Procesar datos de la rutina
  const processedSections = rutina ? rutina.bloques.map(bloque => {
    const groupedSubBloques = bloque.subbloques?.reduce((acc, subbloque) => {
      const key = subbloque.nombre || `__individual__${subbloque.id}`;
      if (!acc[key]) {
        acc[key] = {
          id: subbloque.nombre ? `section_${subbloque.nombre}` : `section_${subbloque.id}`,
          name: subbloque.nombre || 'Sección',
          subbloques: []
        };
      }
      acc[key].subbloques.push(subbloque);
      return acc;
    }, {});
    
    return Object.values(groupedSubBloques || {});
  }).flat() : [];

  // Calcular estadísticas de sets
  const calculateSetStats = useCallback(() => {
    if (!rutina) return { total: 0, completed: 0, pending: 0 };
    
    let total = 0;
    let completed = 0;
    
    rutina.bloques?.forEach(bloque => {
      bloque.subbloques?.forEach(subbloque => {
        if (subbloque.tipo === 'superset') {
          total += subbloque.num_series_superset || 1;
        } else {
          subbloque.subbloques_ejercicios?.forEach(sbe => {
            total += sbe.series?.length || 0;
          });
        }
      });
    });
    
    completed = Object.keys(elementosCompletados).length;
    return { total, completed, pending: total - completed };
  }, [rutina, elementosCompletados]);

  // Calcular progreso por sección
  const calculateSectionProgress = useCallback(() => {
    return processedSections.reduce((acc, section) => {
      let sectionCompleted = 0;
      let sectionTotal = 0;
      
      section.subbloques.forEach(subbloque => {
        if (subbloque.tipo === 'superset') {
          sectionTotal += subbloque.num_series_superset || 1;
          // Count completed superset sets
          for (let i = 1; i <= (subbloque.num_series_superset || 1); i++) {
            const supersetSetId = `${subbloque.id}_set_${i}`;
            if (elementosCompletados[supersetSetId]) {
              sectionCompleted++;
            }
          }
        } else {
          subbloque.subbloques_ejercicios?.forEach(sbe => {
            sectionTotal += sbe.series?.length || 0;
            sbe.series?.forEach(serie => {
              const setId = `${subbloque.id}_${sbe.id}_set_${serie.nro_set}`;
              if (elementosCompletados[setId]) {
                sectionCompleted++;
              }
            });
          });
        }
      });
      
      acc[section.id] = { completed: sectionCompleted, total: sectionTotal };
      return acc;
    }, {});
  }, [processedSections, elementosCompletados]);

  // Manejadores de eventos
  const handleSectionClick = useCallback((sectionId) => {
    setActiveSectionId(sectionId);
    const sectionElement = sectionRefs.current[sectionId];
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleExerciseToggleExpanded = useCallback((exerciseId) => {
    setExpandedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  }, []);

  const startRestTimer = useCallback((duration, exerciseName = '', variant = 'simple') => {
    setRestTimerState({
      isActive: true,
      duration,
      exerciseName,
      variant
    });
  }, []);

  const stopRestTimer = useCallback(() => {
    setRestTimerState(prev => ({ ...prev, isActive: false }));
  }, []);

  // Auto-detección de sección activa en scroll
  useEffect(() => {
    const throttle = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const sections = Object.entries(sectionRefs.current);
      const scrollTop = window.scrollY + 200; // Offset for header
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const [sectionId, element] = sections[i];
        if (element && element.offsetTop <= scrollTop) {
          setActiveSectionId(sectionId);
          break;
        }
      }
    };

    const throttledScroll = throttle(handleScroll, 100);
    window.addEventListener('scroll', throttledScroll);
    
    // Initial detection
    handleScroll();
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [processedSections]);

  return {
    // Estados
    activeSectionId,
    expandedExercises,
    restTimerState,
    showExitModal,
    showMenuDrawer,
    showSummaryDrawer,
    showNotesDrawer,
    activeFloatingButton,
    
    // Referencias
    sectionRefs,
    contentRef,
    
    // Datos procesados
    processedSections,
    setStats: calculateSetStats(),
    sectionProgress: calculateSectionProgress(),
    
    // Setters para modales/drawers
    setShowExitModal,
    setShowMenuDrawer,
    setShowSummaryDrawer,
    setShowNotesDrawer,
    setActiveFloatingButton,
    
    // Manejadores
    handleSectionClick,
    handleExerciseToggleExpanded,
    startRestTimer,
    stopRestTimer,
  };
};

export default useRoutineState;
