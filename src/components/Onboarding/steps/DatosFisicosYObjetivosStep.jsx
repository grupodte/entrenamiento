import React from 'react';
import { FaRuler, FaWeight, FaPercentage, FaSearchMinus } from 'react-icons/fa';

const DatosFisicosYObjetivosStep = ({ values, onChange, errors = {} }) => {
    const handleInputChange = (field, value) => {
        // permitir vacío; validar numérico si hay valor
        if (value === '' || value === null || value === undefined) {
            onChange(field, '');
            return;
        }
        if (['altura', 'peso', 'porcentaje_grasa', 'cintura_cm', 'meta_peso', 'meta_grasa', 'meta_cintura'].includes(field)) {
            // Para campos que son enteros en la base de datos
            if (['cintura_cm', 'meta_cintura'].includes(field)) {
                const num = parseInt(value);
                if (isNaN(num) || num <= 0) {
                    onChange(field, null);
                    return;
                }
                onChange(field, num);
                return;
            }
            // Para campos que permiten decimales
            else {
                const num = parseFloat(value);
                if (isNaN(num) || num <= 0) {
                    onChange(field, null);
                    return;
                }
                onChange(field, num);
                return;
            }
        }
        onChange(field, value);
    };

    const rows = [
        {
            key: 'peso',
            label: 'Peso (kg)',
            icon: FaWeight,
            actual: { key: 'peso', placeholder: 'Ej: 70.5', step: 0.1, min: 30, max: 300, required: true },
            objetivo: { key: 'meta_peso', placeholder: 'Ej: 65.0', step: 0.1, min: 30, max: 300, required: true },
        },
        {
            key: 'grasa',
            label: 'Grasa corporal (%)',
            icon: FaPercentage,
            actual: { key: 'porcentaje_grasa', placeholder: 'Ej: 20', step: 0.1, min: 1, max: 60 },
            objetivo: { key: 'meta_grasa', placeholder: 'Ej: 15', step: 0.1, min: 1, max: 60 },
        },
        {
            key: 'cintura',
            label: 'Cintura (cm)',
            icon: FaSearchMinus,
            actual: { key: 'cintura_cm', placeholder: 'Ej: 85', step: 1, min: 40, max: 250 },
            objetivo: { key: 'meta_cintura', placeholder: 'Ej: 80', step: 1, min: 40, max: 250 },
        },
    ];

    const inputBase =
        'w-full p-4 rounded-2xl transition-all duration-200 bg-[#191919] text-white placeholder-white/40 ' +
        'focus:outline-none focus:ring-0 focus:border-transparent';

    return (
        <div className="space-y-8">
            <p className="text-xs text-center text-gray-500 -mb-4">
                Los campos marcados con <span className="text-[#FF0000] font-bold">*</span> son obligatorios.
            </p>
            {/* Altura (solo Actual) */}
            <div className="space-y-2">
                <label className="flex items-center text-[#000000] font-medium text-[16px] mb-2">
                    <FaRuler className="w-4 h-4 mr-2 text-[#FF0000]" />
                    Altura (cm)
                    <span className="text-[#FF0000] ml-1">*</span>
                </label>
                <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Ej: 175"
                    min={100}
                    max={250}
                    value={values.altura ?? ''}
                    onChange={(e) => handleInputChange('altura', e.target.value)}
                    className={`${inputBase} ${errors.altura ? 'ring-1 ring-red-500/50' : ''}`}
                />
                {errors.altura && <p className="text-red-400/90 text-sm mt-2 px-2">{errors.altura}</p>}
            </div>

            {/* Tabla de dos columnas: Actual / Objetivo */}
            <div className="space-y-6">
                {rows.map(({ key, label, icon: Icon, actual, objetivo }) => (
                    <div key={key} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-[#FF0000]" />
                            <h4 className="text-[#000000] font-medium text-[16px] leading-none">{label}</h4>
                            {(actual.required || objetivo.required) && <span className="text-[#FF0000] ml-1">*</span>}
                        </div>

                        {/* Encabezado columnas (solo en md+) */}
                        <div className="hidden md:grid md:grid-cols-2 md:gap-4 text-[13px]">
                            <div className="text-[#000000] opacity-80">Actual {actual.required && <span className="text-[#FF0000]">*</span>}</div>
                            <div className="text-[#000000] opacity-80">Objetivo {objetivo.required && <span className="text-[#FF0000]">*</span>}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {/* Actual */}
                            <div className="space-y-2">
                                <label className="md:hidden text-[#000000] text-[13px]">Actual {actual.required && <span className="text-[#FF0000]">*</span>}</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder={actual.placeholder}
                                    min={actual.min}
                                    max={actual.max}
                                    step={actual.step || 1}
                                    value={values[actual.key] ?? ''}
                                    onChange={(e) => handleInputChange(actual.key, e.target.value)}
                                    className={`${inputBase} ${errors[actual.key] ? 'ring-1 ring-red-500/50' : ''}`}
                                />
                                {errors[actual.key] && (
                                    <p className="text-red-400/90 text-xs mt-1">{errors[actual.key]}</p>
                                )}
                            </div>

                            {/* Objetivo */}
                            <div className="space-y-2">
                                <label className="md:hidden text-[#000000] text-[13px]">Objetivo {objetivo.required && <span className="text-[#FF0000]">*</span>}</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder={objetivo.placeholder}
                                    min={objetivo.min}
                                    max={objetivo.max}
                                    step={objetivo.step || 1}
                                    value={values[objetivo.key] ?? ''}
                                    onChange={(e) => handleInputChange(objetivo.key, e.target.value)}
                                    className={`${inputBase} ${errors[objetivo.key] ? 'ring-1 ring-red-500/50' : ''}`}
                                />
                                {errors[objetivo.key] && (
                                    <p className="text-red-400/90 text-xs mt-1">{errors[objetivo.key]}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

          
        </div>
    );
};

export default DatosFisicosYObjetivosStep;
