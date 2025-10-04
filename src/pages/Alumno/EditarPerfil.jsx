import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { 
    FaArrowLeft, FaSave, FaUserCircle, FaChevronDown, FaChevronUp, FaUser, 
    FaWeight, FaBullseye, FaHeartbeat, FaMedkit, FaCamera
} from 'react-icons/fa';
import Drawer from '../../components/Drawer';
import CustomSelect from '../../components/Onboarding/CustomSelect';

// Componente simple para input (movido fuera para evitar recreación)
const SimpleInput = ({ label, name, type = "text", placeholder, value, onChange, options = null, rows = null, inputMode, min, max, step }) => {
    // Convertir las opciones a formato requerido por CustomSelect
    const selectOptions = options ? options.map(option => {
        if (typeof option === 'string') {
            return { value: option, label: option };
        } else {
            return option; // Ya tiene formato { value, label }
        }
    }) : null;

    // Handler para CustomSelect que simula evento nativo
    const handleSelectChange = (newValue) => {
        onChange({
            target: {
                name: name,
                value: newValue
            }
        });
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{label}</label>
            {selectOptions ? (
                <CustomSelect
                    options={selectOptions}
                    value={value || ''}
                    onChange={handleSelectChange}
                    placeholder={placeholder}
                />
            ) : rows ? (
                <textarea
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    rows={rows}
                    className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 resize-none"
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    inputMode={inputMode}
                    min={min}
                    max={max}
                    step={step}
                    className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                />
            )}
        </div>
    );
};

// Componente para sección expandible (también movido fuera)
const ExpandableSection = ({ title, icon, isOpen, onToggle, children }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors duration-200 focus:outline-none"
        >
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                    {icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            {isOpen ? (
                <FaChevronUp className="text-gray-400" />
            ) : (
                <FaChevronDown className="text-gray-400" />
            )}
        </button>
        
        {isOpen && (
            <div className="px-4 pb-4 space-y-4">
                {children}
            </div>
        )}
    </div>
);

const EditarPerfilDrawer = ({ isOpen, onClose, onBack, onProfileUpdate }) => {
    const { user } = useAuth();

    const [perfil, setPerfil] = useState({
        // Información básica
        nombre: '', apellido: '', edad: '', telefono: '', genero: '', fecha_nacimiento: '', 
        biografia: '', ciudad: '', pais: '', avatar_url: '',
        // Fitness y objetivos
        objetivo: '', nivel: '', experiencia: '', actividad_fisica: '', frecuencia_entrenamiento: '',
        // Métricas físicas
        peso_kg: '', altura_cm: '', cintura_cm: '', grasa_pct: '',
        // Metas
        meta_peso: '', meta_grasa: '',
        // Salud
        condiciones_medicas: '',
        // Preferencias
        preferencia_inicio: ''
    });
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Estados para secciones expandibles
    const [expandedSections, setExpandedSections] = useState({
        personal: true,
        fitness: false,
        metrics: false,
        goals: false,
        health: false
    });

    useEffect(() => {
        if (!isOpen || !user) return;
        
        const fetchPerfil = async () => {
            setLoading(true);
            const { data, error: err } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', user.id)
                .single();
                
            if (err) {
                console.error(err);
                setError('No se pudo cargar el perfil');
            } else {
                setPerfil(prev => ({ ...prev, ...data }));
                setPreview(data?.avatar_url || '');
            }
            setLoading(false);
        };
        
        fetchPerfil();
    }, [isOpen, user]);

    // Función para toggle de secciones
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Calcular IMC automáticamente con validación robusta
    const calculateIMC = (peso, altura) => {
        if (!peso || !altura) return '';
        
        const pesoNum = parseFloat(peso);
        const alturaCm = parseFloat(altura);
        
        // Validaciones básicas
        if (isNaN(pesoNum) || isNaN(alturaCm) || pesoNum <= 0 || alturaCm < 1) {
            return '';
        }
        
        const alturaM = alturaCm / 100; // convertir cm a metros
        const imc = (pesoNum / (alturaM * alturaM)).toFixed(1);
        return imc;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setPerfil(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de archivo
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                const errorMsg = 'Por favor selecciona un archivo de imagen válido (JPEG, PNG, WebP)';
                setError(errorMsg);
                toast.error(`❌ ${errorMsg}`, {
                    duration: 4000,
                    position: 'top-center'
                });
                return;
            }
            
            // Validar tamaño de archivo (máx 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB en bytes
            if (file.size > maxSize) {
                const errorMsg = 'La imagen es muy grande. Por favor selecciona una imagen menor a 5MB.';
                setError(errorMsg);
                toast.error(`❌ ${errorMsg}`, {
                    duration: 4000,
                    position: 'top-center'
                });
                return;
            }
            
            // Limpiar error anterior
            setError('');
            
            // Actualizar estado
            setPerfil(prev => ({ ...prev, avatarFile: file }));
            setPreview(URL.createObjectURL(file));
            
            // Toast de confirmación
            toast.success('📷 Imagen seleccionada correctamente', {
                duration: 2000,
                position: 'top-center',
                style: {
                    background: 'rgba(59, 130, 246, 0.9)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '14px'
                }
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            let avatar_url = perfil.avatar_url;

            if (perfil.avatarFile) {
                const ext = perfil.avatarFile.name.split('.').pop();
                const fileName = `${user.id}_${Date.now()}.${ext}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, perfil.avatarFile);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatar_url = publicUrlData.publicUrl;
            }

            // Validar y preparar datos antes de enviar
            console.log('Perfil completo antes de validar:', perfil);
            
            const peso_kg = perfil.peso_kg ? parseFloat(perfil.peso_kg) : null;
            const altura_cm = perfil.altura_cm ? parseInt(perfil.altura_cm) : null;
            const meta_peso = perfil.meta_peso ? parseFloat(perfil.meta_peso) : null;
            
            // Validaciones específicas
            if (peso_kg !== null && (peso_kg < 1 || peso_kg > 1000)) {
                throw new Error('El peso debe estar entre 1 y 1000 kg');
            }
            
            if (altura_cm !== null && (altura_cm < 1 || altura_cm > 300)) {
                throw new Error('La altura debe estar entre 1 y 300 cm');
            }
            
            if (meta_peso !== null && (meta_peso < 1 || meta_peso > 1000)) {
                throw new Error('La meta de peso debe estar entre 1 y 1000 kg');
            }
            
            // Validar preferencia_inicio si no está vacía
            const validPreferencias = [
                'rutina', 'cursos', 'explorar', 
                'Mañana', 'Tarde', 'Noche', 'Sin preferencia', // valores legacy
                ''
            ];
            
            console.log('Validando preferencia_inicio:', perfil.preferencia_inicio);
            console.log('Valor de experiencia:', perfil.experiencia);
            console.log('Valor de actividad_fisica:', perfil.actividad_fisica);
            console.log('Valor de frecuencia_entrenamiento:', perfil.frecuencia_entrenamiento);
            console.log('Valor de genero:', perfil.genero);
            
            // Función para limpiar valores problemáticos
            const limpiarValor = (campo, valor) => {
                if (!valor || valor === '') return null;
                
                // Mapear valores problemáticos a valores válidos conocidos
                const mapeos = {
                    experiencia: {
                        'Principiante': 'principiante',
                        'Intermedio': 'intermedio', 
                        'Avanzado': 'avanzado',
                        'Experto': 'avanzado' // mapear experto a avanzado
                    },
                    genero: {
                        'Masculino': 'masculino',
                        'Femenino': 'femenino',
                        'No binario': 'no_binario',
                        'Prefiero no decir': 'prefiero_no_decir'
                    },
                    actividad_fisica: {
                        'Sedentario': 'sedentario',
                        'Ligera': 'ligera',
                        'Moderada': 'moderada',
                        'Intensa': 'intensa',
                        'Muy Intensa': 'muy_intensa'
                    },
                    frecuencia_entrenamiento: {
                        '1-2 días': '1-2_dias',
                        '3-4 días': '3-4_dias', 
                        '5-6 días': '5-6_dias',
                        'Todos los días': 'todos_los_dias'
                    },
                    preferencia_inicio: {
                        'Mañana': 'rutina', // mapear valores legacy
                        'Tarde': 'cursos',
                        'Noche': 'explorar',
                        'Sin preferencia': null
                    }
                };
                
                if (mapeos[campo] && mapeos[campo][valor]) {
                    return mapeos[campo][valor];
                }
                
                return valor;
            };
            
            if (perfil.preferencia_inicio && !validPreferencias.includes(perfil.preferencia_inicio)) {
                console.error('Valor inválido de preferencia_inicio:', perfil.preferencia_inicio);
                throw new Error(`Preferencia de inicio no válida: "${perfil.preferencia_inicio}"`);
            };
            
            // Limpiar valores y loggear
            const experienciaLimpia = limpiarValor('experiencia', perfil.experiencia);
            const generoLimpio = limpiarValor('genero', perfil.genero);
            const actividadLimpia = limpiarValor('actividad_fisica', perfil.actividad_fisica);
            const frecuenciaLimpia = limpiarValor('frecuencia_entrenamiento', perfil.frecuencia_entrenamiento);
            const preferenciaLimpia = limpiarValor('preferencia_inicio', perfil.preferencia_inicio);
            
            console.log('Valores limpiados:');
            console.log('- experiencia:', perfil.experiencia, '->', experienciaLimpia);
            console.log('- genero:', perfil.genero, '->', generoLimpio);
            console.log('- actividad_fisica:', perfil.actividad_fisica, '->', actividadLimpia);
            console.log('- frecuencia_entrenamiento:', perfil.frecuencia_entrenamiento, '->', frecuenciaLimpia);
            console.log('- preferencia_inicio:', perfil.preferencia_inicio, '->', preferenciaLimpia);
            
            const { error: updateError } = await supabase
                .from('perfiles')
                .update({
                    // Información básica
                    nombre: perfil.nombre || null,
                    apellido: perfil.apellido || null,
                    edad: perfil.edad ? parseInt(perfil.edad) : null,
                    telefono: perfil.telefono || null,
                    genero: generoLimpio,
                    fecha_nacimiento: perfil.fecha_nacimiento || null,
                    biografia: perfil.biografia || null,
                    ciudad: perfil.ciudad || null,
                    pais: perfil.pais || null,
                    avatar_url: avatar_url,
                    // Fitness y objetivos
                    objetivo: perfil.objetivo || null,
                    nivel: perfil.nivel || null,
                    experiencia: experienciaLimpia,
                    actividad_fisica: actividadLimpia,
                    frecuencia_entrenamiento: frecuenciaLimpia,
                    // Métricas físicas
                    peso_kg: peso_kg,
                    altura_cm: altura_cm,
                    cintura_cm: perfil.cintura_cm ? parseInt(perfil.cintura_cm) : null,
                    grasa_pct: perfil.grasa_pct ? parseFloat(perfil.grasa_pct) : null,
                    // Metas
                    meta_peso: meta_peso,
                    meta_grasa: perfil.meta_grasa ? parseFloat(perfil.meta_grasa) : null,
                    // Salud
                    condiciones_medicas: perfil.condiciones_medicas || null,
                    // Preferencias (limpiar valores legacy)
                    preferencia_inicio: preferenciaLimpia,
                    // Timestamp de actualización
                    fecha_actualizacion: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Actualizar estado local
            setPerfil(prev => ({ ...prev, avatar_url: avatar_url, avatarFile: undefined }));
            setPreview(avatar_url);
            
            // Llamar callback de actualización si existe
            if(onProfileUpdate) onProfileUpdate();
            
            // Cerrar drawer inmediatamente
            onClose();
            
            // Mostrar toast de éxito
            toast.success('Perfil actualizado correctamente', {
                duration: 4000,
                position: 'top-center',
                style: {
                    background: 'rgba(0, 255, 94, 0.15)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '16px',
                    padding: '12px 20px'
                }
            });

        } catch (err) {
            console.error(err);
            const errorMessage = `Error al guardar cambios: ${err.message || err}`;
            setError(errorMessage);
            
            // También mostrar toast de error
            toast.error(`❌ ${errorMessage}`, {
                duration: 5000,
                position: 'top-center',
                style: {
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '16px',
                    padding: '12px 20px'
                }
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} height="max-h-[95vh]">
            <div className="flex flex-col min-h-[100dvh] pt-safe pb-safe">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700/50">
                    <button 
                        onClick={onBack} 
                        className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors duration-200"
                    >
                        <FaArrowLeft className="text-gray-400" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Editar Perfil</h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-2"></div>
                            <p className="text-gray-400">Cargando perfil...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                        {/* Contenido scrolleable único */}
                        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide p-4 space-y-6 ios-inertial">
                            
                            {/* Información Personal */}
                            <ExpandableSection
                                title="Información Personal"
                                icon={<FaUser className="text-cyan-400" />}
                                isOpen={expandedSections.personal}
                                onToggle={() => toggleSection('personal')}
                            >
                                {/* Avatar Section */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative group">
                                        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-700/50 border-2 border-gray-600/50 group-hover:border-cyan-500/50 transition-all duration-200">
                                            {preview || perfil.avatar_url ? (
                                                <img 
                                                    src={preview || perfil.avatar_url} 
                                                    alt="Avatar preview" 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = '';
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FaUserCircle className="w-16 h-16 text-gray-400" />
                                                </div>
                                            )}
                                            
                                            {/* Overlay con ícono de cámara */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                                <FaCamera className="text-white text-xl" />
                                            </div>
                                        </div>
                                        
                                        {/* Input file oculto */}
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-center text-sm text-gray-400 mt-2">Toca la imagen para cambiar tu foto de perfil</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <SimpleInput
                                        label="Nombre"
                                        name="nombre"
                                        placeholder="Tu nombre"
                                        value={perfil.nombre}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Apellido"
                                        name="apellido"
                                        placeholder="Tu apellido"
                                        value={perfil.apellido}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Edad"
                                        name="edad"
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="25"
                                        value={perfil.edad}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Género"
                                        name="genero"
                                        placeholder="Seleccionar género"
                                        value={perfil.genero}
                                        onChange={handleChange}
                                        options={[
                                            { value: 'masculino', label: 'Masculino' },
                                            { value: 'femenino', label: 'Femenino' },
                                            { value: 'no_binario', label: 'No binario' },
                                            { value: 'prefiero_no_decir', label: 'Prefiero no decir' }
                                        ]}
                                    />
                                    <SimpleInput
                                        label="Teléfono"
                                        name="telefono"
                                        type="tel"
                                        inputMode="tel"
                                        placeholder="+1234567890"
                                        value={perfil.telefono}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Fecha de Nacimiento"
                                        name="fecha_nacimiento"
                                        type="date"
                                        value={perfil.fecha_nacimiento?.split('T')[0]}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Ciudad"
                                        name="ciudad"
                                        placeholder="Tu ciudad"
                                        value={perfil.ciudad}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="País"
                                        name="pais"
                                        placeholder="Tu país"
                                        value={perfil.pais}
                                        onChange={handleChange}
                                    />
                                </div>
                                <SimpleInput
                                    label="Biografía"
                                    name="biografia"
                                    placeholder="Cuéntanos un poco sobre ti..."
                                    value={perfil.biografia}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </ExpandableSection>

                            {/* Fitness y Objetivos */}
                            <ExpandableSection
                                title="Fitness y Objetivos"
                                icon={<FaBullseye className="text-orange-400" />}
                                isOpen={expandedSections.fitness}
                                onToggle={() => toggleSection('fitness')}
                            >
                                <div className="grid grid-cols-1 gap-4">
                                    <SimpleInput
                                        label="Objetivo Principal"
                                        name="objetivo"
                                        placeholder="Ej: Perder peso, ganar músculo, mantener forma..."
                                        value={perfil.objetivo}
                                        onChange={handleChange}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <SimpleInput
                                            label="Nivel de Experiencia"
                                            name="experiencia"
                                            placeholder="Seleccionar nivel"
                                            value={perfil.experiencia}
                                            onChange={handleChange}
                                            options={[
                                                { value: 'principiante', label: 'Principiante' },
                                                { value: 'intermedio', label: 'Intermedio' },
                                                { value: 'avanzado', label: 'Avanzado' }
                                            ]}
                                        />
                                        <SimpleInput
                                            label="Nivel Actual"
                                            name="nivel"
                                            placeholder="Tu nivel"
                                            value={perfil.nivel}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <SimpleInput
                                            label="Actividad Física"
                                            name="actividad_fisica"
                                            placeholder="Tipo de actividad"
                                            value={perfil.actividad_fisica}
                                            onChange={handleChange}
                                            options={[
                                                { value: 'sedentario', label: 'Sedentario' },
                                                { value: 'ligera', label: 'Ligera' },
                                                { value: 'moderada', label: 'Moderada' },
                                                { value: 'intensa', label: 'Intensa' },
                                                { value: 'muy_intensa', label: 'Muy Intensa' }
                                            ]}
                                        />
                                        <SimpleInput
                                            label="Frecuencia de Entrenamiento"
                                            name="frecuencia_entrenamiento"
                                            placeholder="Días por semana"
                                            value={perfil.frecuencia_entrenamiento}
                                            onChange={handleChange}
                                            options={[
                                                { value: '1-2_dias', label: '1-2 días' },
                                                { value: '3-4_dias', label: '3-4 días' },
                                                { value: '5-6_dias', label: '5-6 días' },
                                                { value: 'todos_los_dias', label: 'Todos los días' }
                                            ]}
                                        />
                                    </div>
                                    <SimpleInput
                                        label="Preferencia de Inicio"
                                        name="preferencia_inicio"
                                        placeholder="¿Cómo quieres empezar?"
                                        value={perfil.preferencia_inicio}
                                        onChange={handleChange}
                                        options={[
                                            { value: '', label: 'Sin preferencia' },
                                            { value: 'rutina', label: 'Comenzar con una rutina' },
                                            { value: 'cursos', label: 'Explorar cursos' },
                                            { value: 'explorar', label: 'Explorar la plataforma' }
                                        ]}
                                    />
                                </div>
                            </ExpandableSection>

                            {/* Métricas Físicas */}
                            <ExpandableSection
                                title="Métricas Físicas"
                                icon={<FaWeight className="text-green-400" />}
                                isOpen={expandedSections.metrics}
                                onToggle={() => toggleSection('metrics')}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <SimpleInput
                                        label="Peso Actual (kg)"
                                        name="peso_kg"
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="70.5"
                                        min="1"
                                        max="1000"
                                        step="0.1"
                                        value={perfil.peso_kg}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Altura (cm)"
                                        name="altura_cm"
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="175"
                                        min="1"
                                        max="300"
                                        value={perfil.altura_cm}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Cintura (cm)"
                                        name="cintura_cm"
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="85"
                                        value={perfil.cintura_cm}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="% Grasa Corporal"
                                        name="grasa_pct"
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="15.5"
                                        value={perfil.grasa_pct}
                                        onChange={handleChange}
                                    />
                                </div>
                            </ExpandableSection>

                            {/* Metas y Objetivos */}
                            <ExpandableSection
                                title="Metas y Objetivos"
                                icon={<FaBullseye className="text-purple-400" />}
                                isOpen={expandedSections.goals}
                                onToggle={() => toggleSection('goals')}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <SimpleInput
                                        label="Meta de Peso (kg)"
                                        name="meta_peso"
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="75.0"
                                        min="1"
                                        max="1000"
                                        step="0.1"
                                        value={perfil.meta_peso}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Meta de % Grasa"
                                        name="meta_grasa"
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="12.0"
                                        value={perfil.meta_grasa}
                                        onChange={handleChange}
                                    />
                                </div>
                            </ExpandableSection>

                            {/* Información de Salud */}
                            <ExpandableSection
                                title="Información de Salud"
                                icon={<FaMedkit className="text-red-400" />}
                                isOpen={expandedSections.health}
                                onToggle={() => toggleSection('health')}
                            >
                                <SimpleInput
                                    label="Condiciones Médicas"
                                    name="condiciones_medicas"
                                    placeholder="Menciona cualquier condición médica relevante (opcional)"
                                    value={perfil.condiciones_medicas}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </ExpandableSection>

                            {/* Footer con mensajes y botón */}
                            <div className="pt-4">
                                {error && (
                                    <div className="mb-3 p-3 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl text-sm">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="mb-3 p-3 bg-green-900/20 border border-green-500/30 text-green-400 rounded-xl text-sm">
                                        {success}
                                    </div>
                                )}
                                <button 
                                    type="submit" 
                                    disabled={saving} 
                                    className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaSave />
                                            <span>Guardar Cambios</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </Drawer>
    );
};

export default EditarPerfilDrawer;
