import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import MultipleFileUpload from './MultipleFileUpload';
import { useDietas, useCreateDieta, useUpdateDieta, useDeleteDieta } from '../hooks/useDietas';
import { isPWA, handleFileDownload } from '../utils/pwaHelpers';
import {
    Search,
    Plus,
    FileText,
    Calendar,
    Edit2,
    Trash2,
    Download,
    Upload,
    X,
    Save,
    BookOpen,
    Users,
    Target,
    Zap
} from 'lucide-react';

const INPUT_CLASS = "w-full rounded-xl bg-white/10 pl-12 pr-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-500 border border-transparent focus:border-cyan-400 transition-all outline-none shadow-inner";

const TIPOS_DIETA = [
    { value: 'deficit_calorico', label: 'Déficit Calórico', color: '#f87171' },
    { value: 'aumento_masa', label: 'Aumento de Masa', color: '#34d399' },
    { value: 'mantenimiento', label: 'Mantenimiento', color: '#60a5fa' },
    { value: 'definicion', label: 'Definición', color: '#fbbf24' },
    { value: 'volumen', label: 'Volumen', color: '#a78bfa' },
    { value: 'especial', label: 'Especial', color: '#fb7185' }
];

const DietasManager = () => {
    const [busqueda, setBusqueda] = useState('');
    const [showCrearDieta, setShowCrearDieta] = useState(false);
    const [dietaEditando, setDietaEditando] = useState(null);

    // React Query hooks
    const { data: dietas = [], isLoading: cargando, error } = useDietas();
    const createDietaMutation = useCreateDieta();
    const updateDietaMutation = useUpdateDieta();
    const deleteDietaMutation = useDeleteDieta();
    
    // Query para verificar rol de admin
    const { data: esAdmin, isLoading: loadingAdmin } = useQuery({
        queryKey: ['user-role'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', user?.id)
                .single();
            return perfil?.rol === 'admin';
        }
    });

    const subiendoArchivo = createDietaMutation.isPending || updateDietaMutation.isPending;

    // Estados del formulario
    const [formulario, setFormulario] = useState({
        nombre: '',
        descripcion: '',
        tipo: 'deficit_calorico',
        calorias: '',
        macronutrientes: {
            proteinas: '',
            carbohidratos: '',
            grasas: ''
        },
        etiquetas: '',
        archivos: [] // Cambiado para soportar múltiples archivos
    });

    const dietasFiltradas = useMemo(() => 
        dietas.filter(dieta =>
            `${dieta.nombre} ${dieta.descripcion || ''} ${dieta.tipo || ''}`.toLowerCase()
            .includes(busqueda.toLowerCase())
        ), [dietas, busqueda]);

    
    const resetFormulario = () => {
        setFormulario({
            nombre: '',
            descripcion: '',
            tipo: 'deficit_calorico',
            calorias: '',
            macronutrientes: {
                proteinas: '',
                carbohidratos: '',
                grasas: ''
            },
            etiquetas: '',
            archivos: []
        });
    };
    
    const inicializarFormulario = (dieta) => {
        setFormulario({
            nombre: dieta.nombre || '',
            descripcion: dieta.descripcion || '',
            tipo: dieta.tipo || 'deficit_calorico',
            calorias: dieta.calorias ? dieta.calorias.toString() : '',
            macronutrientes: {
                proteinas: dieta.macronutrientes?.proteinas || '',
                carbohidratos: dieta.macronutrientes?.carbohidratos || '',
                grasas: dieta.macronutrientes?.grasas || ''
            },
            etiquetas: dieta.etiquetas ? dieta.etiquetas.join(', ') : '',
            archivos: dieta.archivos || [] // Mostrar archivos existentes
        });
    };

    const handleSubmitDieta = async (e) => {
        e.preventDefault();
        
        if (!formulario.nombre.trim()) {
            toast.error('El nombre de la dieta es obligatorio');
            return;
        }

        // Validar archivos para nuevas dietas
        if (!dietaEditando) {
            const archivosFile = formulario.archivos?.filter(file => file instanceof File) || [];
            if (archivosFile.length === 0) {
                toast.error('Debes subir al menos un archivo PDF');
                return;
            }
        }

        const dietaData = {
            nombre: formulario.nombre.trim(),
            descripcion: formulario.descripcion || null,
            tipo: formulario.tipo,
            calorias: formulario.calorias ? parseInt(formulario.calorias) : null,
            macronutrientes: (formulario.macronutrientes.proteinas || formulario.macronutrientes.carbohidratos || formulario.macronutrientes.grasas) 
                ? formulario.macronutrientes : null,
            etiquetas: formulario.etiquetas ? formulario.etiquetas.split(',').map(tag => tag.trim()).filter(Boolean) : null
        };

        // Separar archivos existentes de archivos nuevos de manera más robusta
        const archivosExistentes = formulario.archivos?.filter(file => {
            // Archivos existentes tienen URL pero NO son objetos File
            return file.url && !(file instanceof File) && !file.size;
        }) || [];
        
        const archivosNuevos = formulario.archivos?.filter(file => {
            // Archivos nuevos son instancias de File
            return file instanceof File;
        }) || [];
        
        console.log('🔍 Análisis de archivos:', {
            total: formulario.archivos?.length || 0,
            existentes: archivosExistentes.length,
            nuevos: archivosNuevos.length,
            archivosExistentes,
            archivosNuevos
        });
        
        if (dietaEditando) {
            // Actualizar dieta existente
            dietaData.archivos = archivosExistentes; // Mantener archivos existentes
            updateDietaMutation.mutate(
                { dietaId: dietaEditando.id, dietaData, archivos: archivosNuevos },
                {
                    onSuccess: () => {
                        setShowCrearDieta(false);
                        setDietaEditando(null);
                        resetFormulario();
                    }
                }
            );
        } else {
            // Crear nueva dieta - solo procesar archivos File
            const archivosParaSubir = formulario.archivos?.filter(file => file instanceof File) || [];
            
            if (archivosParaSubir.length === 0) {
                toast.error('Debes subir al menos un archivo PDF');
                return;
            }
            
            console.log('📤 Creando dieta con archivos:', archivosParaSubir.length);
            
            createDietaMutation.mutate(
                { dietaData, archivos: archivosParaSubir },
                {
                    onSuccess: () => {
                        setShowCrearDieta(false);
                        setDietaEditando(null);
                        resetFormulario();
                    }
                }
            );
        }
    };

    const eliminarDieta = async (dietaId, nombreDieta) => {
        if (!confirm(`¿Estás seguro de eliminar la dieta "${nombreDieta}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        deleteDietaMutation.mutate({ dietaId });
    };

    const abrirModalEditar = (dieta) => {
        setDietaEditando(dieta);
        inicializarFormulario(dieta);
        setShowCrearDieta(true);
    };



    const descargarDieta = async (dieta) => {
        try {
            console.log('Iniciando descarga desde admin:', { dieta: dieta.nombre, isPWA: isPWA() });
            
            // Si tiene múltiples archivos, descargar todos
            if (dieta.archivos && dieta.archivos.length > 0) {
                for (const archivo of dieta.archivos) {
                    const fileName = archivo.name || `${dieta.nombre}_${Math.random().toString(36).substring(2, 7)}.pdf`;
                    
                    await handleFileDownload(archivo.url, fileName, {
                        onSuccess: (message) => {
                            console.log('Archivo procesado:', fileName, message);
                        },
                        onError: (error) => {
                            console.error('Error procesando archivo:', fileName, error);
                        }
                    });
                    
                    // Pequeña pausa entre descargas
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
                if (isPWA()) {
                    toast.success(`Abriendo ${dieta.archivos.length} archivo${dieta.archivos.length > 1 ? 's' : ''} en navegador`);
                } else {
                    toast.success(`Descargando ${dieta.archivos.length} archivo${dieta.archivos.length > 1 ? 's' : ''}`);
                }
            } else if (dieta.pdf_url) {
                // Compatibilidad con archivos únicos anteriores
                await handleFileDownload(dieta.pdf_url, `${dieta.nombre}.pdf`, {
                    onSuccess: (message) => {
                        console.log('Archivo único procesado:', message);
                        if (isPWA()) {
                            toast.success('Abriendo archivo en navegador');
                        } else {
                            toast.success('Descarga iniciada');
                        }
                    },
                    onError: (error) => {
                        console.error('Error procesando archivo único:', error);
                        toast.error(isPWA() ? 'Error al abrir el archivo' : 'Error al descargar la dieta');
                    }
                });
            } else {
                toast.error('No hay archivos para descargar');
            }
        } catch (error) {
            console.error('Error al descargar:', error);
            toast.error(isPWA() ? 'Error al abrir el archivo' : 'Error al descargar la dieta');
        }
    };

    if (cargando || loadingAdmin) {
        return <DietasSkeleton />;
    }

    if (!esAdmin) {
        return (
            <div className="p-6 text-red-400 font-semibold text-center text-lg bg-red-500/10 rounded-2xl">
                ⛔ Acceso denegado — Solo administradores pueden ver esta sección.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gestión de Dietas</h1>
                    <p className="text-gray-400 mt-1">
                        Administra los planes nutricionales para tus alumnos y grupos
                    </p>
                </div>
                
                <motion.button
                    onClick={() => {
                        resetFormulario();
                        setDietaEditando(null);
                        setShowCrearDieta(true);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Plus className="w-5 h-5" />
                    Nueva Dieta
                </motion.button>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative">
                <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-white/40" />
                <input
                    type="text"
                    placeholder="Buscar dietas por nombre, descripción o tipo..."
                    className={INPUT_CLASS}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* Grid de dietas */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                    {dietasFiltradas.map(dieta => (
                        <DietaCard 
                            key={dieta.id} 
                            dieta={dieta} 
                            onEliminar={eliminarDieta}
                            onEditar={abrirModalEditar}
                            onDescargar={descargarDieta}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {dietasFiltradas.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="w-20 h-20 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {busqueda ? 'No se encontraron dietas' : 'No tienes dietas creadas'}
                    </h3>
                    <p className="text-gray-400 mb-4">
                        {busqueda 
                            ? 'Intenta con otros términos de búsqueda' 
                            : 'Crea tu primera dieta para asignar a tus alumnos'
                        }
                    </p>
                    {!busqueda && (
                        <motion.button
                            onClick={() => {
                                resetFormulario();
                                setShowCrearDieta(true);
                            }}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Crear primera dieta
                        </motion.button>
                    )}
                </div>
            )}

            {/* Modal para crear/editar dieta */}
            <AnimatePresence>
                {showCrearDieta && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setShowCrearDieta(false);
                            setDietaEditando(null);
                        }}
                    >
                        <motion.form
                            onSubmit={handleSubmitDieta}
                            className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {dietaEditando ? 'Editar Dieta' : 'Nueva Dieta'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCrearDieta(false);
                                        setDietaEditando(null);
                                    }}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Nombre */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Nombre de la Dieta *
                                    </label>
                                    <input
                                        type="text"
                                        value={formulario.nombre}
                                        onChange={(e) => setFormulario(prev => ({ ...prev, nombre: e.target.value }))}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                                        placeholder="Ej: Plan Déficit 1800 kcal"
                                        required
                                    />
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formulario.descripcion}
                                        onChange={(e) => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none h-20 resize-none"
                                        placeholder="Describe el plan nutricional..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Tipo */}
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Tipo de Dieta
                                        </label>
                                        <select
                                            value={formulario.tipo}
                                            onChange={(e) => setFormulario(prev => ({ ...prev, tipo: e.target.value }))}
                                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                                        >
                                            {TIPOS_DIETA.map(tipo => (
                                                <option key={tipo.value} value={tipo.value}>
                                                    {tipo.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Calorías */}
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Calorías (opcional)
                                        </label>
                                        <input
                                            type="number"
                                            value={formulario.calorias}
                                            onChange={(e) => setFormulario(prev => ({ ...prev, calorias: e.target.value }))}
                                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                                            placeholder="1800"
                                        />
                                    </div>
                                </div>

                                {/* Macronutrientes */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Macronutrientes (gramos - opcional)
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <input
                                            type="number"
                                            value={formulario.macronutrientes.proteinas}
                                            onChange={(e) => setFormulario(prev => ({
                                                ...prev,
                                                macronutrientes: { ...prev.macronutrientes, proteinas: e.target.value }
                                            }))}
                                            className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                                            placeholder="Proteínas"
                                        />
                                        <input
                                            type="number"
                                            value={formulario.macronutrientes.carbohidratos}
                                            onChange={(e) => setFormulario(prev => ({
                                                ...prev,
                                                macronutrientes: { ...prev.macronutrientes, carbohidratos: e.target.value }
                                            }))}
                                            className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                                            placeholder="Carbohidratos"
                                        />
                                        <input
                                            type="number"
                                            value={formulario.macronutrientes.grasas}
                                            onChange={(e) => setFormulario(prev => ({
                                                ...prev,
                                                macronutrientes: { ...prev.macronutrientes, grasas: e.target.value }
                                            }))}
                                            className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                                            placeholder="Grasas"
                                        />
                                    </div>
                                </div>

                                {/* Etiquetas */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Etiquetas (separadas por coma)
                                    </label>
                                    <input
                                        type="text"
                                        value={formulario.etiquetas}
                                        onChange={(e) => setFormulario(prev => ({ ...prev, etiquetas: e.target.value }))}
                                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                                        placeholder="vegana, sin lactosa, deportiva"
                                    />
                                </div>

                                {/* Archivos PDF */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Archivos PDF {!dietaEditando && '*'}
                                    </label>
                                    <MultipleFileUpload
                                        archivos={formulario.archivos}
                                        onChange={(archivos) => setFormulario(prev => ({ ...prev, archivos }))}
                                        maxFiles={10}
                                        maxSizeMB={15}
                                        allowedTypes={['application/pdf']}
                                    />
                                    <p className="text-gray-400 text-sm mt-2">
                                        {dietaEditando ? 'Los nuevos archivos se agregarán a los existentes' : 'Puedes subir hasta 10 archivos PDF'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCrearDieta(false);
                                        setDietaEditando(null);
                                    }}
                                    className="flex-1 bg-gray-700 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={subiendoArchivo}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-3 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
                                >
                                    {subiendoArchivo ? (
                                        <>
                                            <Upload className="w-4 h-4 animate-spin" />
                                            {dietaEditando ? 'Actualizando...' : 'Creando...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {dietaEditando ? 'Actualizar' : 'Crear Dieta'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DietaCard = ({ dieta, onEliminar, onEditar, onDescargar }) => {
    const tipoConfig = TIPOS_DIETA.find(t => t.value === dieta.tipo) || TIPOS_DIETA[0];
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="group relative"
        >
            <div className="absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500"
                 style={{ background: `linear-gradient(45deg, ${tipoConfig.color}, ${tipoConfig.color}80)` }} />
            
            <div className="relative bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: tipoConfig.color }}
                        />
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-lg text-white line-clamp-1">
                                {dieta.nombre}
                            </h3>
                            <span className="text-xs px-2 py-1 rounded-full font-medium"
                                  style={{ backgroundColor: `${tipoConfig.color}20`, color: tipoConfig.color }}>
                                {tipoConfig.label}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                            onClick={() => onDescargar(dieta)}
                            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Descargar PDF"
                        >
                            <Download className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            onClick={() => onEditar(dieta)}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Editar"
                        >
                            <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            onClick={() => onEliminar(dieta.id, dieta.nombre)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                {/* Descripción */}
                {dieta.descripcion && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {dieta.descripcion}
                    </p>
                )}

                {/* Información nutricional */}
                {(dieta.calorias || dieta.macronutrientes) && (
                    <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
                        {dieta.calorias && (
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span className="text-white font-medium">{dieta.calorias} kcal</span>
                            </div>
                        )}
                        {dieta.macronutrientes && (
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                {dieta.macronutrientes.proteinas && (
                                    <div className="text-center">
                                        <div className="text-gray-400">Proteínas</div>
                                        <div className="text-white font-medium">{dieta.macronutrientes.proteinas}g</div>
                                    </div>
                                )}
                                {dieta.macronutrientes.carbohidratos && (
                                    <div className="text-center">
                                        <div className="text-gray-400">Carbohidratos</div>
                                        <div className="text-white font-medium">{dieta.macronutrientes.carbohidratos}g</div>
                                    </div>
                                )}
                                {dieta.macronutrientes.grasas && (
                                    <div className="text-center">
                                        <div className="text-gray-400">Grasas</div>
                                        <div className="text-white font-medium">{dieta.macronutrientes.grasas}g</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Etiquetas */}
                {dieta.etiquetas && dieta.etiquetas.length > 0 && (
                    <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                            {dieta.etiquetas.slice(0, 3).map((etiqueta, index) => (
                                <span key={index} className="text-xs bg-gray-600/50 text-gray-300 px-2 py-1 rounded-full">
                                    {etiqueta}
                                </span>
                            ))}
                            {dieta.etiquetas.length > 3 && (
                                <span className="text-xs text-gray-400">+{dieta.etiquetas.length - 3}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(dieta.fecha_creacion).toLocaleDateString()}</span>
                    </div>
                    {dieta.archivo_nombre && (
                        <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span className="text-xs">{dieta.archivo_nombre.slice(-10)}</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const DietasSkeleton = () => (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <div className="h-8 w-64 bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-4 w-96 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="h-12 w-32 bg-white/10 rounded-xl animate-pulse" />
        </div>
        
        <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse" />
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            ))}
        </div>
    </div>
);

export default DietasManager;
