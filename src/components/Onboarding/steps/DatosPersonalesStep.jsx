import React from 'react';
import { FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaVenusMars } from 'react-icons/fa';
import CustomSelect from '../CustomSelect';

const DatosPersonalesStep = ({ values, onChange, errors = {} }) => {
    const handleInputChange = (field, value) => {
        onChange(field, value);
    };

    const campos = [
        {
            key: 'nombre',
            label: 'Nombre',
            icon: FaUser,
            placeholder: 'Tu nombre',
            type: 'text',
            required: true
        },
        {
            key: 'apellido',
            label: 'Apellido',
            icon: FaUser,
            placeholder: 'Tu apellido',
            type: 'text',
            required: true
        },
        {
            key: 'email',
            label: 'Email',
            icon: FaEnvelope,
            placeholder: 'tu@email.com',
            type: 'email',
            required: true,
            disabled: true // Email viene de Google, no se puede editar
        },
        {
            key: 'edad',
            label: 'Edad',
            icon: FaBirthdayCake,
            placeholder: 'ej: 25',
            type: 'number',
            min: 13,
            max: 100,
            required: true
        },
        {
            key: 'telefono',
            label: 'Teléfono',
            icon: FaPhone,
            placeholder: 'ej: +54 9 11 1234-5678',
            type: 'tel',
            required: false
        }
    ];

    const opcionesGenero = [
        { value: 'masculino', label: 'Masculino' },
        { value: 'femenino', label: 'Femenino' },

    ];

    return (
        <div className="space-y-6">
            <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
                <p className="text-sm text-white/80">
                    <strong className="text-cyan-400">¡Bienvenido!</strong> Para personalizar tu experiencia, 
                    necesitamos algunos datos básicos. Los campos marcados con un asterisco (*) son obligatorios.
                </p>
            </div>

            <div className="space-y-4">
                {campos.map((campo) => (
                    <div key={campo.key} className="space-y-2">
                        <label className="flex items-center text-white/90 font-medium text-sm mb-2">
                            <campo.icon className="w-4 h-4 mr-2 text-cyan-400" />
                            {campo.label}
                            {campo.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        
                        <input
                            type={campo.type}
                            placeholder={campo.placeholder}
                            min={campo.min}
                            max={campo.max}
                            value={values[campo.key] || ''}
                            onChange={(e) => handleInputChange(campo.key, e.target.value)}
                            disabled={campo.disabled}
                            className={`w-full p-4 rounded-2xl transition-all duration-200 ${
                                campo.disabled 
                                    ? 'bg-white/[0.02] border border-white/5 text-white/40 cursor-not-allowed backdrop-blur-sm'
                                    : errors[campo.key]
                                        ? 'bg-white/[0.03] border border-red-400/30 focus:border-red-400/50 text-white placeholder-white/40 backdrop-blur-sm shadow-[0_4px_20px_rgba(239,68,68,0.15)]'
                                        : 'bg-white/[0.03] border border-white/10 focus:border-cyan-400/50 text-white placeholder-white/40 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:bg-white/[0.05]'
                            } focus:outline-none focus:shadow-[0_4px_20px_rgba(56,189,248,0.2)]`}
                        />
                        
                        {errors[campo.key] && (
                            <p className="text-red-400/90 text-sm mt-2 px-2">{errors[campo.key]}</p>
                        )}
                    </div>
                ))}

                {/* Campo de género como select */}
                <div className="space-y-2">
                    <label className="flex items-center text-white/90 font-medium text-sm mb-2">
                        <FaVenusMars className="w-4 h-4 mr-2 text-cyan-400" />
                        Género
                        <span className="text-red-400 ml-1">*</span>
                    </label>
                    
                    <CustomSelect
                        options={opcionesGenero}
                        value={values.genero}
                        onChange={(value) => handleInputChange('genero', value)}
                        placeholder="Selecciona tu género"
                        error={!!errors.genero}
                    />
                    
                    {errors.genero && (
                        <p className="text-red-400/90 text-sm mt-2 px-2">{errors.genero}</p>
                    )}
                </div>
            </div>

         
        </div>
    );
};

export default DatosPersonalesStep;
