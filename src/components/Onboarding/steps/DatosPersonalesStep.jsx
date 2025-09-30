import React, { useState, useRef } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaVenusMars, FaGlobe, FaCamera, FaEdit } from 'react-icons/fa';
import CustomSelect from '../CustomSelect';

const DatosPersonalesStep = ({ values, onChange, errors = {} }) => {
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);
    
    const handleInputChange = (field, value) => {
        onChange(field, value);
    };
    
    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido');
            return;
        }
        
        // Validar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no puede superar los 5MB');
            return;
        }
        
        setIsUploadingPhoto(true);
        try {
            // Aquí implementarías la subida a tu servicio de almacenamiento
            // Por ahora, solo creamos una URL temporal para preview
            const photoUrl = URL.createObjectURL(file);
            onChange('avatar_url', photoUrl);
        } catch (error) {
            console.error('Error subiendo foto:', error);
            alert('Error al subir la imagen. Inténtalo de nuevo.');
        } finally {
            setIsUploadingPhoto(false);
        }
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
    
    const opcionesPaises = [
        { value: 'AR', label: 'Argentina' },
        { value: 'MX', label: 'México' },
        { value: 'ES', label: 'España' },
        { value: 'CO', label: 'Colombia' },
        { value: 'CL', label: 'Chile' },
        { value: 'PE', label: 'Perú' },
        { value: 'UY', label: 'Uruguay' },
        { value: 'PY', label: 'Paraguay' },
        { value: 'BO', label: 'Bolivia' },
        { value: 'EC', label: 'Ecuador' },
        { value: 'VE', label: 'Venezuela' },
        { value: 'US', label: 'Estados Unidos' },
        { value: 'OTHER', label: 'Otro' }
    ];

    const opcionesGenero = [
        { value: 'masculino', label: 'Masculino' },
        { value: 'femenino', label: 'Femenino' },

    ];

    return (
        <div className="space-y-6">
          
            {/* Foto de perfil */}
            <div className="flex flex-col items-center ">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 flex items-center justify-center">
                        {values.avatar_url ? (
                            <img 
                                src={values.avatar_url} 
                                alt="Foto de perfil" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <FaUser className="w-8 h-8 text-white/40" />
                        )}
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#FF0000]  rounded-full flex items-center justify-center transition-colors shadow-lg"
                    >
                        {isUploadingPhoto ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FaCamera className="w-3 h-3 text-white" />
                        )}
                    </button>
                </div>
                
                <div className="text-center leading-none">
                    <p className="text-[14px] text-[#000000] mt-4">
                        Foto de perfil 
                    </p>
                    <p className="text-[12px] text-[#000000] mt-1">
                        Toca el ícono para cambiar tu foto
                    </p>
                </div>
                
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                />
            </div>

            <div className="space-y-4">
                {campos.map((campo) => (
                    <div key={campo.key} className="space-y-2">
                        <label className="flex items-center text-[#000000] font-medium text-[16px] mb-2">
                            <campo.icon className="w-4 h-4 mr-2 text-[#FF0000]" />
                            {campo.label}
                            {campo.required && <span className="text-[#FF0000] ml-1">*</span>}
                        </label>
                        
                        <input
                            type={campo.type}
                            placeholder={campo.placeholder}
                            min={campo.min}
                            max={campo.max}
                            value={values[campo.key] ?? ''}
                            onChange={(e) => handleInputChange(campo.key, e.target.value)}
                            disabled={!!campo.disabled}
                            className={`w-full p-4 rounded-2xl transition-all duration-200
    focus:outline-none focus:ring-0 focus:border-transparent
    ${campo.disabled ? 'bg-black cursor-not-allowed opacity-70' : 'bg-[#191919]'}
    ${errors[campo.key] ? 'ring-1 ring-red-500/50' : ''}`
                            }
                        />

                        
                        {errors[campo.key] && (
                            <p className="text-red-400/90 text-sm mt-2 px-2">{errors[campo.key]}</p>
                        )}
                    </div>
                ))}

                {/* Campo de género como select */}
                <div className="space-y-2">
                    <label className="flex items-center text-[#000000] font-medium text-[16px] mb-2">
                        <FaVenusMars className=" w-4 h-4 mr-2 text-[#FF0000]" />
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
                
                {/* Campo de país como select */}
                <div className="space-y-2">
                    <label className="flex items-center text-[#000000] font-medium text-[16px] mb-2">
                        <FaGlobe className="w-4 h-4 mr-2 text-[#FF0000]" />
                        País
                        <span className="text-red-400 ml-1">*</span>
                    </label>
                    
                    <CustomSelect
                        options={opcionesPaises}
                        value={values.pais}
                        onChange={(value) => handleInputChange('pais', value)}
                        placeholder="Selecciona tu país"
                        error={!!errors.pais}
                    />
                    
                    {errors.pais && (
                        <p className="text-red-400/90 text-sm mt-2 px-2">{errors.pais}</p>
                    )}
                </div>
            </div>

         
        </div>
    );
};

export default DatosPersonalesStep;
