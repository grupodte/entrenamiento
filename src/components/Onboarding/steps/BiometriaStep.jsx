import React from 'react';
import { FaRuler, FaWeight, FaPercentage, FaSearchMinus } from 'react-icons/fa';

const BiometriaStep = ({ values, onChange, errors = {} }) => {
    const handleInputChange = (field, value) => {
        // Validar que sea un número positivo
        if (value && (isNaN(value) || parseFloat(value) <= 0)) return;
        onChange(field, value);
    };

    const campos = [
        {
            key: 'altura',
            label: 'Altura (cm)',
            icon: FaRuler,
            placeholder: 'ej: 175',
            min: 100,
            max: 250,
            required: true
        },
        {
            key: 'peso',
            label: 'Peso (kg)',
            icon: FaWeight,
            placeholder: 'ej: 70.5',
            min: 30,
            max: 300,
            step: 0.1,
            required: true
        },
        {
            key: 'porcentaje_grasa',
            label: 'Grasa corporal (%) - Opcional',
            icon: FaPercentage,
            placeholder: 'ej: 15',
            min: 1,
            max: 50,
            required: false
        },
        {
            key: 'cintura_cm',
            label: 'Circunferencia cintura (cm) - Opcional',
            icon: FaSearchMinus,
            placeholder: 'ej: 85',
            min: 50,
            max: 200,
            required: false
        }
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
                <p className="text-sm text-white/80">
                    <strong className="text-cyan-400">Nota:</strong> Estos datos nos ayudan a personalizar mejor tu experiencia. 
                    Los campos opcionales puedes completarlos más tarde desde tu perfil.
                </p>
            </div>

            <div className="grid gap-4">
                {campos.map((campo) => (
                    <div key={campo.key} className="space-y-2">
                        <label className="flex items-center text-white/90 font-medium text-sm mb-2">
                            <campo.icon className="w-4 h-4 mr-2 text-cyan-400" />
                            {campo.label}
                            {campo.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        
                        <input
                            type="number"
                            placeholder={campo.placeholder}
                            min={campo.min}
                            max={campo.max}
                            step={campo.step || 1}
                            value={values[campo.key] || ''}
                            onChange={(e) => handleInputChange(campo.key, e.target.value)}
                            className={`w-full p-4 rounded-2xl transition-all duration-200 ${
                                errors[campo.key]
                                    ? 'bg-white/[0.03] border border-red-400/30 focus:border-red-400/50 text-white placeholder-white/40 backdrop-blur-sm shadow-[0_4px_20px_rgba(239,68,68,0.15)]'
                                    : 'bg-white/[0.03] border border-white/10 focus:border-cyan-400/50 text-white placeholder-white/40 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:bg-white/[0.05]'
                            } focus:outline-none focus:shadow-[0_4px_20px_rgba(56,189,248,0.2)]`}
                        />
                        
                        {errors[campo.key] && (
                            <p className="text-red-400/90 text-sm mt-2 px-2">{errors[campo.key]}</p>
                        )}
                    </div>
                ))}
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

export default BiometriaStep;
