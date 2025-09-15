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
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                    <strong>Nota:</strong> Estos datos nos ayudan a personalizar mejor tu experiencia. 
                    Los campos opcionales puedes completarlos más tarde desde tu perfil.
                </p>
            </div>

            <div className="grid gap-4">
                {campos.map((campo) => (
                    <div key={campo.key} className="space-y-2">
                        <label className="flex items-center text-white font-medium">
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
                            className={`w-full p-3 rounded-lg bg-gray-800 border transition-colors ${
                                errors[campo.key]
                                    ? 'border-red-500 focus:border-red-400'
                                    : 'border-gray-600 focus:border-cyan-500'
                            } text-white placeholder-gray-400 focus:outline-none`}
                        />
                        
                        {errors[campo.key] && (
                            <p className="text-red-400 text-sm">{errors[campo.key]}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* IMC Calculado */}
            {values.altura && values.peso && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-white font-medium mb-2">Tu IMC calculado:</h4>
                    <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-cyan-400">
                            {(values.peso / Math.pow(values.altura / 100, 2)).toFixed(1)}
                        </span>
                        <div className="text-sm text-gray-300">
                            <p>Índice de Masa Corporal</p>
                            <p className="text-xs text-gray-400">Solo referencial</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BiometriaStep;
