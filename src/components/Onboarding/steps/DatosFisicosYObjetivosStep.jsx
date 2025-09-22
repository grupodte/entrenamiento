import React from 'react';
import { 
    FaRuler, 
    FaWeight, 
    FaPercentage, 
    FaSearchMinus,
    FaFire, 
    FaDumbbell, 
    FaBalanceScale, 
    FaTrophy 
} from 'react-icons/fa';
import OptionCard from '../OptionCard';

const DatosFisicosYObjetivosStep = ({ values, onChange, errors = {} }) => {
    const handleInputChange = (field, value) => {
        // Validar que sea un número positivo para campos numéricos
        if (['altura', 'peso', 'porcentaje_grasa', 'cintura_cm'].includes(field) && value) {
            if (isNaN(value) || parseFloat(value) <= 0) return;
        }
        onChange(field, value);
    };

    const objetivos = [
        {
            id: 'perder_peso',
            title: 'Perder peso',
            description: 'Quemar grasa y reducir el peso corporal',
            icon: FaFire
        },
        {
            id: 'ganar_musculo',
            title: 'Ganar músculo',
            description: 'Aumentar masa muscular y fuerza',
            icon: FaDumbbell
        },
        {
            id: 'mantenimiento',
            title: 'Mantenerme en forma',
            description: 'Mantener mi condición física actual',
            icon: FaBalanceScale
        },
        {
            id: 'rendimiento',
            title: 'Mejorar rendimiento',
            description: 'Optimizar mi rendimiento deportivo',
            icon: FaTrophy
        }
    ];

    const camposFisicos = {
        // Campos requeridos (altura solo actual)
        altura: {
            key: 'altura',
            label: 'Altura (cm)',
            icon: FaRuler,
            placeholder: 'ej: 175',
            min: 100,
            max: 250,
            required: true,
            soloActual: true
        },
        // Campos con actual y objetivo
        peso: {
            actual: {
                key: 'peso',
                label: 'Peso actual (kg)',
                placeholder: 'ej: 70.5',
                min: 30,
                max: 300,
                step: 0.1,
                required: true
            },
            objetivo: {
                key: 'meta_peso',
                label: 'Peso objetivo (kg)',
                placeholder: 'ej: 65.0',
                min: 30,
                max: 300,
                step: 0.1,
                required: false
            },
            icon: FaWeight
        },
        grasa: {
            actual: {
                key: 'porcentaje_grasa',
                label: 'Grasa actual (%)',
                placeholder: 'ej: 20',
                min: 1,
                max: 50,
                required: false
            },
            objetivo: {
                key: 'meta_grasa',
                label: 'Grasa objetivo (%)',
                placeholder: 'ej: 15',
                min: 1,
                max: 50,
                required: false
            },
            icon: FaPercentage
        },
        cintura: {
            actual: {
                key: 'cintura_cm',
                label: 'Cintura actual (cm)',
                placeholder: 'ej: 85',
                min: 50,
                max: 200,
                required: false
            },
            objetivo: {
                key: 'meta_cintura',
                label: 'Cintura objetivo (cm)',
                placeholder: 'ej: 80',
                min: 50,
                max: 200,
                required: false
            },
            icon: FaSearchMinus
        }
    };

    return (
        <div className="space-y-8">
            <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
                <p className="text-sm text-white/80">
                    <strong className="text-cyan-400">Personalización:</strong> Estos datos nos ayudan a crear 
                    el plan perfecto para ti. Los campos opcionales puedes completarlos más tarde.
                </p>
            </div>

            {/* Sección de Objetivo */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/90 flex items-center">
                    <FaTrophy className="w-5 h-5 mr-2 text-cyan-400" />
                    ¿Cuál es tu objetivo principal?
                </h3>
                
                <div className="grid gap-3">
                    {objetivos.map((objetivo) => (
                        <OptionCard
                            key={objetivo.id}
                            title={objetivo.title}
                            description={objetivo.description}
                            icon={objetivo.icon}
                            selected={values.objetivo === objetivo.id}
                            onClick={() => handleInputChange('objetivo', objetivo.id)}
                        />
                    ))}
                </div>
                
                {errors.objetivo && (
                    <p className="text-red-400/90 text-sm mt-2 px-2">{errors.objetivo}</p>
                )}
            </div>

            {/* Sección de Datos Físicos */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white/90 flex items-center">
                    <FaRuler className="w-5 h-5 mr-2 text-cyan-400" />
                    Datos físicos
                </h3>
                
                {/* Altura (solo campo actual) */}
                <div className="space-y-2">
                    <label className="flex items-center text-white/90 font-medium text-sm mb-2">
                        <camposFisicos.altura.icon className="w-4 h-4 mr-2 text-cyan-400" />
                        {camposFisicos.altura.label}
                        <span className="text-red-400 ml-1">*</span>
                    </label>
                    
                    <input
                        type="number"
                        placeholder={camposFisicos.altura.placeholder}
                        min={camposFisicos.altura.min}
                        max={camposFisicos.altura.max}
                        value={values[camposFisicos.altura.key] || ''}
                        onChange={(e) => handleInputChange(camposFisicos.altura.key, e.target.value)}
                        className={`w-full p-4 rounded-2xl transition-all duration-200 ${
                            errors[camposFisicos.altura.key]
                                ? 'bg-white/[0.03] border border-red-400/30 focus:border-red-400/50 text-white placeholder-white/40 backdrop-blur-sm shadow-[0_4px_20px_rgba(239,68,68,0.15)]'
                                : 'bg-white/[0.03] border border-white/10 focus:border-cyan-400/50 text-white placeholder-white/40 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:bg-white/[0.05]'
                        } focus:outline-none focus:shadow-[0_4px_20px_rgba(56,189,248,0.2)]`}
                    />
                    
                    {errors[camposFisicos.altura.key] && (
                        <p className="text-red-400/90 text-sm mt-2 px-2">{errors[camposFisicos.altura.key]}</p>
                    )}
                </div>
                
                {/* Campos con actual y objetivo */}
                {Object.entries(camposFisicos).map(([key, campo]) => {
                    if (campo.soloActual) return null; // Saltar altura que ya se mostró
                    
                    return (
                        <div key={key} className="space-y-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <campo.icon className="w-5 h-5 text-cyan-400" />
                                <h4 className="text-white/90 font-medium">
                                    {key === 'peso' ? 'Peso' : key === 'grasa' ? 'Grasa corporal' : 'Circunferencia de cintura'}
                                </h4>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Campo actual */}
                                <div className="space-y-2">
                                    <label className="flex items-center text-white/80 text-sm">
                                        {campo.actual.label}
                                        {campo.actual.required && <span className="text-red-400 ml-1">*</span>}
                                    </label>
                                    
                                    <input
                                        type="number"
                                        placeholder={campo.actual.placeholder}
                                        min={campo.actual.min}
                                        max={campo.actual.max}
                                        step={campo.actual.step || 1}
                                        value={values[campo.actual.key] || ''}
                                        onChange={(e) => handleInputChange(campo.actual.key, e.target.value)}
                                        className={`w-full p-3 rounded-xl transition-all duration-200 ${
                                            errors[campo.actual.key]
                                                ? 'bg-white/[0.03] border border-red-400/30 focus:border-red-400/50 text-white placeholder-white/40 backdrop-blur-sm'
                                                : 'bg-white/[0.03] border border-white/10 focus:border-cyan-400/50 text-white placeholder-white/40 backdrop-blur-sm hover:bg-white/[0.05]'
                                        } focus:outline-none`}
                                    />
                                    
                                    {errors[campo.actual.key] && (
                                        <p className="text-red-400/90 text-xs mt-1">{errors[campo.actual.key]}</p>
                                    )}
                                </div>
                                
                                {/* Campo objetivo */}
                                <div className="space-y-2">
                                    <label className="flex items-center text-white/80 text-sm">
                                        {campo.objetivo.label}
                                        <span className="text-white/50 ml-1">(opcional)</span>
                                    </label>
                                    
                                    <input
                                        type="number"
                                        placeholder={campo.objetivo.placeholder}
                                        min={campo.objetivo.min}
                                        max={campo.objetivo.max}
                                        step={campo.objetivo.step || 1}
                                        value={values[campo.objetivo.key] || ''}
                                        onChange={(e) => handleInputChange(campo.objetivo.key, e.target.value)}
                                        className="w-full p-3 rounded-xl transition-all duration-200 bg-white/[0.02] border border-white/10 focus:border-yellow-400/50 text-white placeholder-white/30 backdrop-blur-sm hover:bg-white/[0.04] focus:outline-none"
                                    />
                                    
                                    {errors[campo.objetivo.key] && (
                                        <p className="text-red-400/90 text-xs mt-1">{errors[campo.objetivo.key]}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* IMC Calculado */}
            {values.altura && values.peso && (
                <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                    <h4 className="text-white/90 font-semibold mb-3">Tu IMC calculado:</h4>
                    <div className="flex items-center space-x-4">
                        <span className="text-3xl font-bold text-cyan-400">
                            {(values.peso / Math.pow(values.altura / 100, 2)).toFixed(1)}
                        </span>
                        <div className="text-sm text-white/70">
                            <p className="font-medium">Índice de Masa Corporal</p>
                            <p className="text-xs text-white/50">Solo referencial</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatosFisicosYObjetivosStep;
