import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

// Componentes
import ProgressBar from '../components/Onboarding/ProgressBar';
import StepContainer from '../components/Onboarding/StepContainer';

// Pasos
import DatosPersonalesStep from '../components/Onboarding/steps/DatosPersonalesStep';
import DatosFisicosYObjetivosStep from '../components/Onboarding/steps/DatosFisicosYObjetivosStep';
import FrecuenciaEntrenamientoStep from '../components/Onboarding/steps/FrecuenciaEntrenamientoStep';
import FrecuenciaDietaStep from '../components/Onboarding/steps/FrecuenciaDietaStep';

const Onboarding = () => {
    const { user, updateOnboardingStatus } = useAuth();
    const navigate = useNavigate();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    // Estado de datos del onboarding
    const [onboardingData, setOnboardingData] = useState({
        // Datos personales (paso 1)
        nombre: '',
        apellido: '',
        email: '',
        edad: '',
        telefono: '',
        genero: '',
        pais: '',
        avatar_url: '',
        // Datos físicos y objetivos (paso 2)
        objetivo: '',
        altura: '',
        peso: '',
        porcentaje_grasa: '',
        cintura_cm: '',
        // Campos de objetivos
        meta_peso: '',
        meta_grasa: '',
        meta_cintura: '',
        // Frecuencia de entrenamiento (paso 3)
        frecuencia_entrenamiento: '',
        // Frecuencia de dieta (paso 4 - en pausa)
        frecuencia_dieta: ''
    });

    const totalSteps = 4;

    // Cargar datos existentes al montar el componente
    useEffect(() => {
        if (user) {
            loadExistingData();
            // Autocompletar con datos de Google si están disponibles
            autoFillFromGoogle();
        }
    }, [user]);

    // Función para autocompletar datos desde Google
    const autoFillFromGoogle = () => {
        if (!user || !user.user_metadata) return;

        const metadata = user.user_metadata;
        const updates = {};

        // Autocompletar nombre y apellido desde full_name
        if (metadata.full_name && (!onboardingData.nombre || !onboardingData.apellido)) {
            const nameParts = metadata.full_name.split(' ');
            if (!onboardingData.nombre && nameParts[0]) {
                updates.nombre = nameParts[0];
            }
            if (!onboardingData.apellido && nameParts.length > 1) {
                updates.apellido = nameParts.slice(1).join(' ');
            }
        }

        // Autocompletar email
        if (user.email && !onboardingData.email) {
            updates.email = user.email;
        }

        // Actualizar solo si hay datos para autocompletar
        if (Object.keys(updates).length > 0) {
            setOnboardingData(prev => ({
                ...prev,
                ...updates
            }));
        }
    };

    const loadExistingData = async () => {
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('nombre, apellido, email, edad, telefono, genero, pais, avatar_url, objetivo, altura, peso, porcentaje_grasa, cintura_cm, meta_peso, meta_grasa, meta_cintura, frecuencia_entrenamiento, frecuencia_dieta')
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
            case 1: // Datos personales
                if (!onboardingData.nombre || onboardingData.nombre.trim().length < 2) {
                    newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
                }
                if (!onboardingData.apellido || onboardingData.apellido.trim().length < 2) {
                    newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
                }
                if (!onboardingData.email) {
                    newErrors.email = 'El email es requerido';
                }
                if (!onboardingData.edad) {
                    newErrors.edad = 'La edad es requerida';
                } else if (onboardingData.edad < 13 || onboardingData.edad > 100) {
                    newErrors.edad = 'La edad debe estar entre 13 y 100 años';
                }
                if (!onboardingData.genero) {
                    newErrors.genero = 'Debes seleccionar tu género';
                }
                if (!onboardingData.pais) {
                    newErrors.pais = 'Debes seleccionar tu país';
                }
                // Validación opcional de teléfono si se proporciona
                if (onboardingData.telefono && onboardingData.telefono.length < 10) {
                    newErrors.telefono = 'El número de teléfono debe tener al menos 10 dígitos';
                }
                break;
                
            case 2: // Datos físicos y objetivos
                if (!onboardingData.objetivo) {
                    newErrors.objetivo = 'Debes seleccionar un objetivo';
                }
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
                
            case 3: // Frecuencia de entrenamiento
                if (!onboardingData.frecuencia_entrenamiento) {
                    newErrors.frecuencia_entrenamiento = 'Debes seleccionar la frecuencia de entrenamiento';
                }
                break;
                
            case 4: // Frecuencia de dieta (en pausa)
                // Sin validaciones por ahora, ya que está en pausa
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
                    if (['altura', 'peso', 'porcentaje_grasa', 'cintura_cm', 'edad'].includes(key)) {
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

            // Redirigir al dashboard
            navigate('/dashboard', { replace: true });
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
            case 1: // Datos personales
                return !!onboardingData.nombre && !!onboardingData.apellido && !!onboardingData.email && !!onboardingData.edad && !!onboardingData.genero && !!onboardingData.pais;
            case 2: // Datos físicos y objetivos
                return !!onboardingData.objetivo && !!onboardingData.altura && !!onboardingData.peso;
            case 3: // Frecuencia de entrenamiento
                return !!onboardingData.frecuencia_entrenamiento;
            case 4: // Frecuencia de dieta (en pausa)
                return true; // No requerimos nada por ahora
            default:
                return false;
        }
    };

    // Configuración de pasos
    const stepConfig = {
        1: {
            title: "Cuéntanos sobre ti",
            description: "Necesitamos algunos datos básicos para personalizar tu experiencia",
            component: (
                <DatosPersonalesStep
                    values={onboardingData}
                    onChange={updateStepData}
                    errors={errors}
                />
            )
        },
        2: {
            title: "Datos físicos y objetivos",
            description: "Definamos tu objetivo y conozcamos mejor tu estado físico",
            component: (
                <DatosFisicosYObjetivosStep
                    values={onboardingData}
                    onChange={updateStepData}
                    errors={errors}
                />
            )
        },
        3: {
            title: "Frecuencia de entrenamiento",
            description: "¿Con qué frecuencia quieres entrenar?",
            component: (
                <FrecuenciaEntrenamientoStep
                    value={onboardingData.frecuencia_entrenamiento}
                    onChange={(value) => updateStepData('frecuencia_entrenamiento', value)}
                />
            )
        },
        4: {
            title: "Seguimiento nutricional",
            description: "Herramientas para optimizar tu alimentación",
            component: (
                <FrecuenciaDietaStep
                    value={onboardingData.frecuencia_dieta}
                    onChange={(value) => updateStepData('frecuencia_dieta', value)}
                />
            )
        }
    };

    const currentStepConfig = stepConfig[currentStep];

    return (
        <div className="min-h-screen flex flex-col ">
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
