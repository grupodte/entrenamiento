import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { 
    FaArrowLeft, FaSave, FaUserCircle, FaChevronDown, FaChevronUp, FaUser, 
    FaWeight, FaBullseye, FaHeartbeat, FaMedkit, FaCamera, FaUtensils
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
                        className="w-full p-3 bg-[#000000] text-[#FFFFFF] border-none"
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
                            className="w-full p-3 bg-[#000000] text-[#FFFFFF] border-none"
                />
            )}
        </div>
    );
};

// Lista de países del onboarding
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



// Componente para sección expandible (también movido fuera)
const ExpandableSection = ({ title, icon, isOpen, onToggle, children }) => (
    <div className="bg-[#191919] rounded-[10px]  overflow-hidden ">
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex items-center justify-between p-2 "
        >
            <div className="flex items-center space-x-3">
                <div className="p-2 ">
                    {icon}
                </div>
                <h3 className="text-[15px] text-[#FFFFFF]">{title}</h3>
            </div>
            {isOpen ? (
                <FaChevronUp className="text-[#FF0000]" />
            ) : (
                    <FaChevronDown className="text-[#FF0000]" />
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
        // Métricas físicas - usando nombres correctos de la tabla
        peso: '', altura: '', cintura_cm: '',
        // Metas
        meta_peso: '', meta_cintura: '',
        // Salud
        condiciones_medicas: '',
        // Dieta
        comentarios_dieta: '',
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
        diet: false,
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
                // Normalizar datos para manejar campos legacy
                const normalizedData = {
                    ...data,
                    // Asegurar que peso y altura usen los nombres correctos
                    peso: data?.peso || data?.peso_kg || '',
                    // Altura: si viene en metros (legacy), convertir a cm; si ya está en cm, usar directamente
                    altura: data?.altura || (data?.altura_m ? Math.round(data.altura_m * 100).toString() : '') || '',
                    // Campos que ya tienen nombres correctos
                    cintura_cm: data?.cintura_cm || data?.cintura || ''
                };
                
                console.log('Datos cargados del perfil:', normalizedData);
                setPerfil(prev => ({ ...prev, ...normalizedData }));
                setPreview(normalizedData?.avatar_url || '');
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
        const alturaM = parseFloat(altura);
        
        // Validaciones básicas
        if (isNaN(pesoNum) || isNaN(alturaM) || pesoNum <= 0 || alturaM <= 0) {
            return '';
        }
        
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
            
            const peso = perfil.peso ? parseFloat(perfil.peso) : null;
            const altura = perfil.altura ? parseInt(perfil.altura) : null; // Altura en cm como integer
            const meta_peso = perfil.meta_peso ? parseFloat(perfil.meta_peso) : null;
            
            // Validaciones específicas - ajustadas a la precisión de la BD (5,2)
            if (peso !== null && (peso < 1 || peso > 999.99)) {
                throw new Error('El peso debe estar entre 1 y 999.99 kg');
            }
            
            if (altura !== null && (altura < 100 || altura > 250)) {
                throw new Error('La altura debe estar entre 100 y 250 cm');
            }
            
            if (meta_peso !== null && (meta_peso < 1 || meta_peso > 999.99)) {
                throw new Error('La meta de peso debe estar entre 1 y 999.99 kg');
            }
            
            // Validar preferencia_inicio si no está vacía
            const validPreferencias = [
                'rutina', 'cursos', 'explorar', 
                'Mañana', 'Tarde', 'Noche', 'Sin preferencia', // valores legacy
                ''
            ];
            
     
            
            // Función para limpiar valores problemáticos
            const limpiarValor = (campo, valor) => {
                if (!valor || valor === '') return null;
                
                // Mapear valores problemáticos a valores válidos conocidos
                const mapeos = {
       
                    genero: {
                        'Masculino': 'masculino',
                        'Femenino': 'femenino',
                        
                    },
                   
                   
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
            
            // DEBUGGING: Crear objeto minimal para identificar el campo problemático
            const updateData = {
                // Solo campos de texto básicos para testing
                nombre: perfil.nombre || null,
                apellido: perfil.apellido || null,
                telefono: perfil.telefono || null,
                fecha_actualizacion: new Date().toISOString()
            };
            
            // PASO 2: Agregar campos de texto (no numéricos)
            if (generoLimpio) updateData.genero = generoLimpio;
            if (perfil.fecha_nacimiento) updateData.fecha_nacimiento = perfil.fecha_nacimiento;
            if (perfil.biografia) updateData.biografia = perfil.biografia;
            if (perfil.ciudad) updateData.ciudad = perfil.ciudad;
            if (perfil.pais) updateData.pais = perfil.pais;
            if (avatar_url) updateData.avatar_url = avatar_url;
            if (perfil.objetivo) updateData.objetivo = perfil.objetivo;
            if (perfil.nivel) updateData.nivel = perfil.nivel;
            if (experienciaLimpia) updateData.experiencia = experienciaLimpia;
            if (actividadLimpia) updateData.actividad_fisica = actividadLimpia;
            if (frecuenciaLimpia) updateData.frecuencia_entrenamiento = frecuenciaLimpia;
            if (preferenciaLimpia) updateData.preferencia_inicio = preferenciaLimpia;
            if (perfil.condiciones_medicas) updateData.condiciones_medicas = perfil.condiciones_medicas;
            
            // CAMPOS DE DIETA
            if (perfil.comentarios_dieta) updateData.comentarios_dieta = perfil.comentarios_dieta;
            if (perfil.frecuencia_cena) updateData.frecuencia_cena = perfil.frecuencia_cena;
            
            // PASO 3: Agregar campos numéricos uno por uno
            
            // Campos integer
            if (perfil.edad && parseInt(perfil.edad) > 0) {
                updateData.edad = parseInt(perfil.edad);
            }
            
            // ALTURA: Campo integer directo en centímetros
            if (altura !== null && altura > 0 && altura <= 250) {
                updateData.altura = altura; // Ya está en cm como integer
            }
            
            // PESO: Campo numeric
            if (peso !== null && peso > 0 && peso <= 999.99) {
                const pesoRedondeado = Math.round(peso * 100) / 100;
                console.log('➕ Agregando peso:', pesoRedondeado);
                updateData.peso = pesoRedondeado;
            }
            
            // META PESO: Campo numeric  
            if (meta_peso !== null && meta_peso > 0 && meta_peso <= 999.99) {
                const metaPesoRedondeado = Math.round(meta_peso * 100) / 100;
                console.log('➕ Agregando meta_peso:', metaPesoRedondeado);
                updateData.meta_peso = metaPesoRedondeado;
            }
            
            // CAMPOS DE CINTURA: integers
            if (perfil.cintura_cm && parseInt(perfil.cintura_cm) > 0) {
                console.log('➕ Agregando cintura_cm:', parseInt(perfil.cintura_cm));
                updateData.cintura_cm = parseInt(perfil.cintura_cm);
            }
            if (perfil.meta_cintura && parseInt(perfil.meta_cintura) > 0) {
                console.log('➕ Agregando meta_cintura:', parseInt(perfil.meta_cintura));
                updateData.meta_cintura = parseInt(perfil.meta_cintura);
            }
            
            console.log('Datos que se enviarán a la base de datos:', updateData);
            
            // Debug detallado de campos numéricos
            console.log('=== DEBUG CAMPOS NUMÉRICOS ===');
            console.log('peso:', peso, '(type:', typeof peso, ')');
            console.log('altura:', altura, '(type:', typeof altura, 'cm)');
            console.log('meta_peso:', meta_peso, '(type:', typeof meta_peso, ')');
            console.log('cintura_cm:', perfil.cintura_cm, '(parsed:', perfil.cintura_cm ? parseInt(perfil.cintura_cm) : null, ')');
            console.log('meta_cintura:', perfil.meta_cintura, '(parsed:', perfil.meta_cintura ? parseInt(perfil.meta_cintura) : null, ')');
            console.log('edad:', perfil.edad, '(parsed:', perfil.edad ? parseInt(perfil.edad) : null, ')');
            console.log('================================');
            
            console.log('🚀 INICIANDO GUARDADO...', new Date().toISOString());
            console.log('📋 updateData final:', JSON.stringify(updateData, null, 2));
            console.log('🔑 user.id:', user.id);
            
            const { error: updateError } = await supabase
                .from('perfiles')
                .update(updateData)
                .eq('id', user.id);

            console.log('✅ RESPUESTA DE SUPABASE:');
            console.log('- error:', updateError);
            console.log('- success:', !updateError);

            if (updateError) {
                console.error('🛑 ERROR EN SUPABASE:', updateError);
                throw updateError;
            }
            
            console.log('✨ GUARDADO EXITOSO - continuando...');

            // Actualizar estado local con TODOS los datos guardados
            console.log('🔄 Actualizando estado local...');
            setPerfil(prev => ({ 
                ...prev, 
                ...updateData,  // Aplicar todos los cambios guardados
                avatar_url: avatar_url, 
                avatarFile: undefined 
            }));
            setPreview(avatar_url);
            
            // Llamar callback de actualización si existe (esto debe invalidar queries)
            console.log('🔄 Llamando callback de actualización...');
            if(onProfileUpdate) {
                console.log('onProfileUpdate existe, llamando...');
                onProfileUpdate();
            } else {
                console.log('onProfileUpdate NO existe');
            }
            
            // Mostrar toast de éxito ANTES de cerrar
            toast('Perfil actualizado', {
                duration: 2000,
                position: 'top-center',
                style: {
                    background: '#191919',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '16px',
                    padding: '16px 24px',
                },
            });
            
            console.log('😪 Esperando 500ms para mostrar el toast antes de cerrar drawer...');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Cerrar drawer
            console.log('❌ Cerrando drawer...');
            onClose();

        } catch (err) {
            console.error(err);
            const errorMessage = `Error al guardar cambios: ${err.message || err}`;
            setError(errorMessage);
            
            // También mostrar toast de error
            toast.error(`❌ ${errorMessage}`, {
                duration: 6000,
                position: 'top-center',
                style: {
                    background: '#EF4444',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    padding: '16px 24px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #DC2626'
                },
                icon: '⚠️'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} panelClassName=" bg-[url('/src/assets/onbordingbg.png')] backdrop-blur-[15px] ">
            <div className="flex flex-col h-full pb-safe font-product">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700/50">
                    <button 
                        onClick={onBack} 
                        className="p-4 "
                    >
                        <FaArrowLeft className="text-[#000000]" />
                    </button>
                    <h1 className="text-[20px] text-[#000000]">Editar Perfil</h1>
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
                        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide p-4 space-y-2 ios-inertial">
                            
                            {/* Información Personal */}
                            <ExpandableSection
                                title="Información Personal"
                                    icon={<FaUser className="text-[#FF0000]" />}
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
                                        placeholder="Selecciona tu país"
                                        value={perfil.pais}
                                        onChange={handleChange}
                                        options={opcionesPaises}
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

                    
                            {/* Métricas Físicas */}
                            <ExpandableSection
                                title="Métricas Físicas"
                                icon={<FaWeight className="text-[#FF0000]" />}
                                isOpen={expandedSections.metrics}
                                onToggle={() => toggleSection('metrics')}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <SimpleInput
                                        label="Peso Actual (kg)"
                                        name="peso"
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="70.5"
                                        min="1"
                                        max="999.99"
                                        step="0.01"
                                        value={perfil.peso}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Altura (cm)"
                                        name="altura"
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="175"
                                        min="100"
                                        max="250"
                                        value={perfil.altura}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Cintura (cm)"
                                        name="cintura_cm"
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="85"
                                        min="40"
                                        max="200"
                                        value={perfil.cintura_cm}
                                        onChange={handleChange}
                                    />
                                </div>
                            </ExpandableSection>

                            {/* Metas y Objetivos */}
                            <ExpandableSection
                                title="Metas y Objetivos"
                                    icon={<FaBullseye className="text-[#FF0000]" />}
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
                                        max="999.99"
                                        step="0.01"
                                        value={perfil.meta_peso}
                                        onChange={handleChange}
                                    />
                                    <SimpleInput
                                        label="Meta de Cintura (cm)"
                                        name="meta_cintura"
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="80"
                                        min="40"
                                        max="150"
                                        value={perfil.meta_cintura}
                                        onChange={handleChange}
                                    />
                                </div>
                            </ExpandableSection>

                            {/* Dieta */}
                            <ExpandableSection
                                title="Dieta"
                                icon={<FaUtensils className="text-[#FF0000]" />}
                                isOpen={expandedSections.diet}
                                onToggle={() => toggleSection('diet')}
                            >
                                <div className="space-y-4">
                                 
                                    <SimpleInput
                                        label="Comentarios sobre Dieta"
                                        name="comentarios_dieta"
                                        placeholder="Comparte información relevante sobre tus hábitos alimentarios, restricciones, preferencias..."
                                        value={perfil.comentarios_dieta}
                                        onChange={handleChange}
                                        rows={3}
                                    />
                                </div>
                            </ExpandableSection>

                            {/* Información de Salud */}
                            <ExpandableSection
                                title="Información de Salud"
                                    icon={<FaMedkit className="text-[#FF0000]" />}
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
                                        className="w-full flex items-center justify-center space-x-2 py-3 text-[15px] bg-[#FF0000] rounded-[10px] text-[#000000]"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
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
