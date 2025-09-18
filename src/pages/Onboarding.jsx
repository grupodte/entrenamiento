import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

// Componentes
import ProgressBar from '../components/Onboarding/ProgressBar';
import StepContainer from '../components/Onboarding/StepContainer';

// Pasos
import ObjetivoStep from '../components/Onboarding/steps/ObjetivoStep';
import ExperienciaStep from '../components/Onboarding/steps/ExperienciaStep';
import BiometriaStep from '../components/Onboarding/steps/BiometriaStep';
import PreferenciasStep from '../components/Onboarding/steps/PreferenciasStep';
import ResumenStep from '../components/Onboarding/steps/ResumenStep';

const Onboarding = () => {
    const { user, updateOnboardingStatus } = useAuth();
    const navigate = useNavigate();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    // Estado de datos del onboarding
    const [onboardingData, setOnboardingData] = useState({
        objetivo: '',
        experiencia: '',
        altura: '',
        peso: '',
        porcentaje_grasa: '',
        cintura_cm: '',
        preferencia_inicio: ''
    });

    const totalSteps = 5;

    // Cargar datos existentes al montar el componente
    useEffect(() => {
        if (user) {
            loadExistingData();
        }
    }, [user]);

    const loadExistingData = async () => {
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('objetivo, experiencia, altura, peso, porcentaje_grasa, cintura_cm, preferencia_inicio')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setOnboardingData(prev => ({
                    ...prev,
                    ...Object.fromEntries(
                        Object.entries(data).filter(([_, value]) => value !== null)
                    )
                }));
            }
        } catch (error) {
            console.error('[Onboarding] Error cargando datos existentes:', error);
        }
    };

    // Función para actualizar datos de un paso específico
    const updateStepData = (field, value) => {
        setOnboardingData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Limpiar errores relacionados con este campo
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // Función para actualizar datos de biometría (múltiples campos)
    const updateBiometriaData = (field, value) => {
        updateStepData(field, value);
    };

    // Validar paso actual
    const validateCurrentStep = () => {
        const newErrors = {};

        switch (currentStep) {
            case 1: // Objetivo
                if (!onboardingData.objetivo) {
                    newErrors.objetivo = 'Debes seleccionar un objetivo';
                }
                break;
                
            case 2: // Experiencia
                if (!onboardingData.experiencia) {
                    newErrors.experiencia = 'Debes seleccionar tu nivel de experiencia';
                }
                break;
                
            case 3: // Biometría
                if (!onboardingData.altura) {
                    newErrors.altura = 'La altura es requerida';
                } else if (onboardingData.altura < 100 || onboardingData.altura > 250) {
                    newErrors.altura = 'La altura debe estar entre 100 y 250 cm';
                }
                
                if (!onboardingData.peso) {
                    newErrors.peso = 'El peso es requerido';
                } else if (onboardingData.peso < 30 || onboardingData.peso > 300) {
                    newErrors.peso = 'El peso debe estar entre 30 y 300 kg';
                }
                
                // Validaciones opcionales si tienen valor
                if (onboardingData.porcentaje_grasa && (onboardingData.porcentaje_grasa < 1 || onboardingData.porcentaje_grasa > 50)) {
                    newErrors.porcentaje_grasa = 'El porcentaje de grasa debe estar entre 1% y 50%';
                }
                
                if (onboardingData.cintura_cm && (onboardingData.cintura_cm < 50 || onboardingData.cintura_cm > 200)) {
                    newErrors.cintura_cm = 'La circunferencia de cintura debe estar entre 50 y 200 cm';
                }
                break;
                
            case 4: // Preferencias
                if (!onboardingData.preferencia_inicio) {
                    newErrors.preferencia_inicio = 'Debes seleccionar una preferencia';
                }
                break;
                
            case 5: // Resumen - no hay validaciones adicionales
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Guardar datos incrementalmente
    const saveStepData = async () => {
        if (!user) return false;

        setIsLoading(true);
        try {
            // Preparar datos para actualizar (solo los que no son vacíos)
            const dataToUpdate = {};
            Object.entries(onboardingData).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    // Convertir a número los campos numéricos
                    if (['altura', 'peso', 'porcentaje_grasa', 'cintura_cm'].includes(key)) {
                        dataToUpdate[key] = parseFloat(value) || null;
                    } else {
                        dataToUpdate[key] = value;
                    }
                }
            });

            const { error } = await supabase
                .from('perfiles')
                .update(dataToUpdate)
                .eq('id', user.id);

            if (error) throw error;

            console.log(`[Onboarding] Datos del paso ${currentStep} guardados`);
            return true;
        } catch (error) {
            console.error('[Onboarding] Error guardando datos:', error);
            setErrors(prev => ({
                ...prev,
                general: 'Error al guardar los datos. Intenta nuevamente.'
            }));
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Finalizar onboarding
    const finishOnboarding = async () => {
        setIsLoading(true);
        try {
            // Marcar onboarding como completado
            const { error } = await supabase
                .from('perfiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id);

            if (error) throw error;

            // Actualizar estado en el contexto
            updateOnboardingStatus(true);

            console.log('[Onboarding] Onboarding completado');

            // Redirigir según la preferencia
            const { preferencia_inicio } = onboardingData;
            switch (preferencia_inicio) {
                case 'rutina':
                    navigate('/dashboard', { replace: true });
                    break;
                case 'cursos':
                    navigate('/cursos', { replace: true });
                    break;
                case 'explorar':
                default:
                    navigate('/dashboard', { replace: true });
                    break;
            }
        } catch (error) {
            console.error('[Onboarding] Error finalizando onboarding:', error);
            setErrors(prev => ({
                ...prev,
                general: 'Error al finalizar el onboarding. Intenta nuevamente.'
            }));
        } finally {
            setIsLoading(false);
        }
    };

    // Navegar al siguiente paso
    const handleNext = async () => {
        if (!validateCurrentStep()) return;

        const saveSuccess = await saveStepData();
        if (!saveSuccess) return;

        if (currentStep === totalSteps) {
            await finishOnboarding();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    // Navegar al paso anterior
    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Verificar si se puede continuar desde el paso actual
    const canContinue = () => {
        switch (currentStep) {
            case 1:
                return !!onboardingData.objetivo;
            case 2:
                return !!onboardingData.experiencia;
            case 3:
                return !!onboardingData.altura && !!onboardingData.peso;
            case 4:
                return !!onboardingData.preferencia_inicio;
            case 5:
                return true;
            default:
                return false;
        }
    };

    // Configuración de pasos
    const stepConfig = {
        1: {
            title: "¿Cuál es tu objetivo principal?",
            description: "Esto nos ayudará a personalizar tu experiencia",
            component: (
                <ObjetivoStep
                    value={onboardingData.objetivo}
                    onChange={(value) => updateStepData('objetivo', value)}
                />
            )
        },
        2: {
            title: "¿Cuál es tu nivel de experiencia?",
            description: "Queremos adaptar el contenido a tu nivel",
            component: (
                <ExperienciaStep
                    value={onboardingData.experiencia}
                    onChange={(value) => updateStepData('experiencia', value)}
                />
            )
        },
        3: {
            title: "Cuéntanos sobre ti",
            description: "Estos datos nos ayudan a personalizar mejor tu plan",
            component: (
                <BiometriaStep
                    values={onboardingData}
                    onChange={updateBiometriaData}
                    errors={errors}
                />
            )
        },
        4: {
            title: "¿Cómo prefieres comenzar?",
            description: "Elige la opción que más te interese",
            component: (
                <PreferenciasStep
                    value={onboardingData.preferencia_inicio}
                    onChange={(value) => updateStepData('preferencia_inicio', value)}
                />
            )
        },
        5: {
            title: "¡Todo listo!",
            description: "Revisa tu información antes de continuar",
            component: <ResumenStep data={onboardingData} />
        }
    };

    const currentStepConfig = stepConfig[currentStep];

    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                {/* Barra de progreso */}
                <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
                
                {/* Mensaje de error general */}
                {errors.general && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">{errors.general}</p>
                    </div>
                )}

                {/* Contenedor de pasos */}
                <AnimatePresence mode="wait">
                    <StepContainer
                        key={currentStep}
                        title={currentStepConfig.title}
                        description={currentStepConfig.description}
                        currentStep={currentStep}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        canContinue={canContinue()}
                        isLastStep={currentStep === totalSteps}
                        isLoading={isLoading}
                    >
                        {currentStepConfig.component}
                    </StepContainer>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;
