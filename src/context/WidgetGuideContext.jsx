import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const WidgetGuideContext = createContext();

export const useWidgetGuide = () => {
    const context = useContext(WidgetGuideContext);
    if (!context) {
        throw new Error('useWidgetGuide must be used within a WidgetGuideProvider');
    }
    return context;
};

// Configuración de pasos de guía por ruta
const GUIDE_STEPS_BY_PATH = {
    '/dashboard': [
        {
            target: '[data-guide="stats-overview"]',
            title: '📊 Panel de estadísticas',
            content: 'Aquí puedes ver un resumen de tu progreso y estadísticas generales.',
            position: 'bottom'
        },
        {
            target: '[data-guide="rutina-actual"]',
            title: '💪 Tu rutina actual',
            content: 'Esta es tu rutina activa. Haz clic para comenzar tu entrenamiento.',
            position: 'bottom'
        },
        {
            target: '[data-guide="progreso-semanal"]',
            title: '📈 Progreso semanal',
            content: 'Visualiza tu progreso y entrenamientos de la semana.',
            position: 'top'
        }
    ],
    '/rutina': [
        {
            target: '[data-guide="ejercicio-item"]',
            title: '🏋️ Ejercicios',
            content: 'Toca cualquier ejercicio para ver su detalle y comenzar.',
            position: 'right'
        },
        {
            target: '[data-guide="timer-descanso"]',
            title: '⏱️ Timer de descanso',
            content: 'El timer te ayudará a controlar los descansos entre series.',
            position: 'bottom'
        }
    ],
    '/cursos': [
        {
            target: '[data-guide="curso-card"]',
            title: '🎓 Cursos disponibles',
            content: 'Explora cursos para aprender nuevas técnicas y conocimientos.',
            position: 'bottom'
        }
    ]
};

const GUIDE_VERSION = '1.0';
const STORAGE_KEY = 'widget_guide_completed';

export const WidgetGuideProvider = ({ children }) => {
    const { user, onboardingCompleted } = useAuth();
    const location = useLocation();
    
    const [isGuideActive, setIsGuideActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [guideSteps, setGuideSteps] = useState([]);
    const [completedGuides, setCompletedGuides] = useState(new Set());

    // Cargar guías completadas desde localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.version === GUIDE_VERSION) {
                    setCompletedGuides(new Set(parsed.completed));
                }
            }
        } catch (error) {
            console.error('[WidgetGuide] Error cargando guías completadas:', error);
        }
    }, []);

    // Verificar si debemos mostrar la guía para la ruta actual
    useEffect(() => {
        if (!user || !onboardingCompleted) return;
        
        const pathKey = location.pathname;
        const steps = GUIDE_STEPS_BY_PATH[pathKey];
        
        if (steps && !completedGuides.has(pathKey)) {
            // Esperar un poco para que la página se renderice completamente
            const timer = setTimeout(() => {
                startGuide(pathKey, steps);
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [location.pathname, user, onboardingCompleted, completedGuides]);

    // Guardar guías completadas en localStorage
    const saveCompletedGuides = (newCompleted) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: GUIDE_VERSION,
                completed: Array.from(newCompleted)
            }));
        } catch (error) {
            console.error('[WidgetGuide] Error guardando guías completadas:', error);
        }
    };

    // Iniciar guía para una ruta
    const startGuide = (pathKey, steps) => {
        // Verificar que los elementos objetivo existen
        const validSteps = steps.filter(step => {
            const element = document.querySelector(step.target);
            return element !== null;
        });

        if (validSteps.length === 0) {
            console.log('[WidgetGuide] No se encontraron elementos objetivo para la guía');
            return;
        }

        console.log(`[WidgetGuide] Iniciando guía para ${pathKey} con ${validSteps.length} pasos`);
        
        setGuideSteps(validSteps);
        setCurrentStep(0);
        setIsGuideActive(true);
        
        // Hacer scroll al primer elemento
        scrollToTarget(validSteps[0].target);
    };

    // Hacer scroll a un elemento objetivo
    const scrollToTarget = (target) => {
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    };

    // Avanzar al siguiente paso
    const nextStep = () => {
        if (currentStep < guideSteps.length - 1) {
            const newStep = currentStep + 1;
            setCurrentStep(newStep);
            scrollToTarget(guideSteps[newStep].target);
        } else {
            completeGuide();
        }
    };

    // Retroceder al paso anterior
    const previousStep = () => {
        if (currentStep > 0) {
            const newStep = currentStep - 1;
            setCurrentStep(newStep);
            scrollToTarget(guideSteps[newStep].target);
        }
    };

    // Saltar la guía
    const skipGuide = () => {
        completeGuide();
    };

    // Completar la guía actual
    const completeGuide = () => {
        const pathKey = location.pathname;
        const newCompleted = new Set([...completedGuides, pathKey]);
        
        setCompletedGuides(newCompleted);
        saveCompletedGuides(newCompleted);
        
        setIsGuideActive(false);
        setCurrentStep(0);
        setGuideSteps([]);
        
        console.log(`[WidgetGuide] Guía completada para ${pathKey}`);
    };

    // Reiniciar todas las guías (para debugging)
    const resetAllGuides = () => {
        setCompletedGuides(new Set());
        localStorage.removeItem(STORAGE_KEY);
        console.log('[WidgetGuide] Todas las guías han sido reiniciadas');
    };

    // Iniciar guía manualmente
    const startManualGuide = (pathKey = location.pathname) => {
        const steps = GUIDE_STEPS_BY_PATH[pathKey];
        if (steps) {
            startGuide(pathKey, steps);
        }
    };

    const value = {
        isGuideActive,
        currentStep,
        guideSteps,
        totalSteps: guideSteps.length,
        nextStep,
        previousStep,
        skipGuide,
        startManualGuide,
        resetAllGuides
    };

    return (
        <WidgetGuideContext.Provider value={value}>
            {children}
        </WidgetGuideContext.Provider>
    );
};
