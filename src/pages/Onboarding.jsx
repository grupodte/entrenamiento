import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

import ProgressBar from '../components/Onboarding/ProgressBar';
import StepContainer from '../components/Onboarding/StepContainer';

import FeatureCard from '../components/Onboarding/steps/FeatureCard';

// Pasos existentes de datos
import DatosPersonalesStep from '../components/Onboarding/steps/DatosPersonalesStep';
import DatosFisicosYObjetivosStep from '../components/Onboarding/steps/DatosFisicosYObjetivosStep';
import FrecuenciaEntrenamientoStep from '../components/Onboarding/steps/FrecuenciaEntrenamientoStep';
import FrecuenciaDietaStep from '../components/Onboarding/steps/FrecuenciaDietaStep';

import Bgonbording from '../assets/onbordingbg.png';

const Onboarding = () => {
    const { user, updateOnboardingStatus } = useAuth();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Estado de datos del onboarding (se mantiene)
    const [onboardingData, setOnboardingData] = useState({
        // Paso datos personales
        nombre: '',
        apellido: '',
        email: '',
        edad: '',
        telefono: '',
        genero: '',
        pais: '',
        avatar_url: '',
        // Paso datos físicos y objetivos
        objetivo: '',
        altura: '',
        peso: '',
        porcentaje_grasa: '',
        cintura_cm: '',
        meta_peso: '',
        meta_grasa: '',
        meta_cintura: '',
        // Frecuencia de entrenamiento
        frecuencia_entrenamiento: '',
        // Nutrición (placeholder)
        frecuencia_dieta: ''
    });

    // 🔸 Antes: 4. Ahora: 9 (5 tour + 4 datos)
    const totalSteps = 9;

    useEffect(() => {
        if (user) {
            loadExistingData();
            autoFillFromGoogle();
        }
    }, [user]);

    const autoFillFromGoogle = () => {
        if (!user || !user.user_metadata) return;
        const metadata = user.user_metadata;
        const updates = {};

        if (metadata.full_name && (!onboardingData.nombre || !onboardingData.apellido)) {
            const nameParts = metadata.full_name.split(' ');
            if (!onboardingData.nombre && nameParts[0]) updates.nombre = nameParts[0];
            if (!onboardingData.apellido && nameParts.length > 1) updates.apellido = nameParts.slice(1).join(' ');
        }
        if (user.email && !onboardingData.email) updates.email = user.email;

        if (Object.keys(updates).length > 0) {
            setOnboardingData(prev => ({ ...prev, ...updates }));
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
                    ...Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== null))
                }));
            }
        } catch (error) {
            console.error('[Onboarding] Error cargando datos existentes:', error);
        }
    };

    const updateStepData = (field, value) => {
        setOnboardingData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validateCurrentStep = () => {
        const newErrors = {};

        // 🔸 Los pasos 1-5 (tour) NO validan nada:
        if (currentStep <= 5) {
            setErrors({});
            return true;
        }

        // ⬇️ Tus validaciones existentes (corren en 6-9)
        switch (currentStep) {
            case 6: // Datos personales
                if (!onboardingData.nombre || onboardingData.nombre.trim().length < 2)
                    newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
                if (!onboardingData.apellido || onboardingData.apellido.trim().length < 2)
                    newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
                if (!onboardingData.email) newErrors.email = 'El email es requerido';
                if (!onboardingData.edad) newErrors.edad = 'La edad es requerida';
                else if (onboardingData.edad < 13 || onboardingData.edad > 100)
                    newErrors.edad = 'La edad debe estar entre 13 y 100 años';
                if (!onboardingData.genero) newErrors.genero = 'Debes seleccionar tu género';
                if (!onboardingData.pais) newErrors.pais = 'Debes seleccionar tu país';
                if (onboardingData.telefono && onboardingData.telefono.length < 10)
                    newErrors.telefono = 'El número de teléfono debe tener al menos 10 dígitos';
                break;

            case 7: // Datos físicos y objetivos
                if (!onboardingData.objetivo)
                    newErrors.objetivo = 'Debes seleccionar un objetivo';
                if (!onboardingData.altura)
                    newErrors.altura = 'La altura es requerida';
                else if (onboardingData.altura < 100 || onboardingData.altura > 250)
                    newErrors.altura = 'La altura debe estar entre 100 y 250 cm';
                if (!onboardingData.peso)
                    newErrors.peso = 'El peso es requerido';
                else if (onboardingData.peso < 30 || onboardingData.peso > 300)
                    newErrors.peso = 'El peso debe estar entre 30 y 300 kg';
                if (onboardingData.porcentaje_grasa && (onboardingData.porcentaje_grasa < 1 || onboardingData.porcentaje_grasa > 50))
                    newErrors.porcentaje_grasa = 'El porcentaje de grasa debe estar entre 1% y 50%';
                if (onboardingData.cintura_cm && (onboardingData.cintura_cm < 50 || onboardingData.cintura_cm > 200))
                    newErrors.cintura_cm = 'La circunferencia de cintura debe estar entre 50 y 200 cm';
                break;

            case 8: // Frecuencia entrenamiento
                if (!onboardingData.frecuencia_entrenamiento)
                    newErrors.frecuencia_entrenamiento = 'Debes seleccionar la frecuencia de entrenamiento';
                break;

            case 9: // Nutrición (placeholder)
                // sin validaciones
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveStepData = async () => {
        if (!user) return false;

        // 🔸 No guardamos nada en Supabase durante el tour (1-5)
        if (currentStep <= 5) return true;

        setIsLoading(true);
        try {
            const dataToUpdate = {};
            Object.entries(onboardingData).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
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
            return true;
        } catch (error) {
            console.error('[Onboarding] Error guardando datos:', error);
            setErrors(prev => ({ ...prev, general: 'Error al guardar los datos. Intenta nuevamente.' }));
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const finishOnboarding = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('perfiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id);
            if (error) throw error;

            updateOnboardingStatus(true);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            console.error('[Onboarding] Error finalizando onboarding:', error);
            setErrors(prev => ({ ...prev, general: 'Error al finalizar el onboarding. Intenta nuevamente.' }));
        } finally {
            setIsLoading(false);
        }
    };

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

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const canContinue = () => {
        // 🔸 Tour siempre continúa
        if (currentStep <= 5) return true;

        // ⬇️ Tu lógica anterior
        switch (currentStep) {
            case 6:
                return !!onboardingData.nombre && !!onboardingData.apellido && !!onboardingData.email && !!onboardingData.edad && !!onboardingData.genero && !!onboardingData.pais;
            case 7:
                return !!onboardingData.objetivo && !!onboardingData.altura && !!onboardingData.peso;
            case 8:
                return !!onboardingData.frecuencia_entrenamiento;
            case 9:
                return true;
            default:
                return false;
        }
    };

    // 🔹 Config de pasos (1–5 = TOUR) (6–9 = TUS DATOS)
    const stepConfig = {
        1: {
            isFeature: true, // Flag for new design
            component: (
                <FeatureCard
                    title="Bienvenido/a"
                    description="Te estábamos esperando. Ahora te guiamos paso a paso hacia tu mejor versión"
                />
            )
        },
        2: {
            isFeature: true,
            component: (
                <FeatureCard
                    icon="💪"
                    title="Entrenamiento a Tu Medida"
                    bullets={[
                        "Videos explicativos.",
                        "Seguimiento de progreso semanal",
                    ]}
                />
            )
        },
        3: {
            isFeature: true,
            component: (
                <FeatureCard
                    icon="🍎"
                    title=" Nutrición Inteligente"
                    description="Te enseñamos a comer mejor, con conciencia y funcionalidad.
Hábitos reales que podés sostener."
                />
            )
        },
        4: {
            isFeature: true,
            component: (
                <FeatureCard
                    icon="💡"
                    title="Aprendé y Motiváte"
                    bullets={[
                        "Videos nuevos cada semana.",
                        "Retos y desafíos",
                        "Motivación constante"
                    ]}
                />
            )
        },
        5: {
            isFeature: true,
            component: (
                <FeatureCard
                    icon="🚀"
                    title=" ¡Listo para Empezar!"
                    description="Vamos a personalizar tu plan.
Unas preguntas rápidas y comenzamos"
                />
            )
        },

        // ⬇️ Pasos de recolección de datos con textos más motivacionales
        6: {
            title: "Primero, Conozcámonos Mejor",
            description: "Necesitamos algunos datos básicos para adaptar el plan a vos. Rápido, simple y útil.",
            component: (
                <DatosPersonalesStep
                    values={onboardingData}
                    onChange={updateStepData}
                    errors={errors}
                />
            )
        },
        7: {
            title: "Tu Cuerpo, Tus Metas",
            description: "Conocer tu estado actual nos permite ajustar el plan a vos y medir tu evolución real desde el día",
            component: (
                <DatosFisicosYObjetivosStep
                    values={onboardingData}
                    onChange={updateStepData}
                    errors={errors}
                />
            )
        },
        8: {
            title: "Tu Frecuencia, Tu Compromiso",
            description: "¿Cuántos días vas a entrenar? Elegí lo que realmente puedas sostener. Nosotros lo adaptamos.",
            component: (
                <FrecuenciaEntrenamientoStep
                    value={onboardingData.frecuencia_entrenamiento}
                    onChange={(value) => updateStepData('frecuencia_entrenamiento', value)}
                />
            )
        },
        9: {
            title: "Tu Alimentación, Tus Necesidades",
            description: "Contanos cuántas veces comés al día y si tenés alguna alergia, intolerancia o restricción. Así adaptamos tu plan sin errores.",
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
        <div
            className="min-h-screen flex flex-col bg-center bg-no-repeat bg-cover "
            style={{ backgroundImage: `url(${Bgonbording})` }}  
        >
            <div className="min-h-screen flex flex-col">
                <div className="flex-1 container mx-auto px-2 py-10 w-[320px] flex flex-col justify-between">

                    {/* Arriba: barra de progreso */}
                    <div className="w-full flex justify-center">
                        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
                    </div>

                    {/* Medio: contenido */}
                    <div className="flex-1 flex flex-col justify-center">
                        {errors.general && (
                            <div className=" bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{errors.general}</p>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            <StepContainer
                                key={currentStep}
                                title={currentStepConfig.title}
                                description={currentStepConfig.description}
                                isFeatureStep={!!currentStepConfig.isFeature}
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
            </div>
        </div>


    );
};

export default Onboarding;
