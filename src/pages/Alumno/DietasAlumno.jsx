import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    FaUtensils,
    FaDownload,
    FaSpinner,
    FaCalendarAlt,
    FaInfoCircle,
    FaTag,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const DietasAlumno = () => {
    const { user } = useAuth();
    const [dietas, setDietas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingFile, setDownloadingFile] = useState(null);

    // Función para obtener las dietas asignadas al alumno
    const fetchDietasAsignadas = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        
        try {
            // Obtener dietas asignadas directamente al alumno
            const { data: dietasDirectas, error: errorDirectas } = await supabase
                .from('asignaciones_dietas_alumnos')
                .select(`
                    id,
                    fecha_asignacion,
                    observaciones,
                    activo,
                    dietas (
                        id,
                        nombre,
                        descripcion,
                        tipo,
                        calorias,
                        archivo_url,
                        archivo_nombre,
                        archivos,
                        fecha_creacion
                    )
                `)
                .eq('alumno_id', user.id)
                .eq('activo', true);

            if (errorDirectas) {
                console.error('Error al obtener dietas directas:', errorDirectas);
            }
            
            console.log('Dietas directas obtenidas:', dietasDirectas);

            // Obtener dietas asignadas a través de grupos
            const { data: dietasGrupos, error: errorGrupos } = await supabase
                .from('asignaciones_dietas_grupos')
                .select(`
                    id,
                    fecha_asignacion,
                    activo,
                    dietas (
                        id,
                        nombre,
                        descripcion,
                        tipo,
                        calorias,
                        archivo_url,
                        archivo_nombre,
                        archivos,
                        fecha_creacion
                    ),
                    grupos_alumnos!inner (
                        asignaciones_grupos_alumnos!inner (
                            alumno_id,
                            activo
                        )
                    )
                `)
                .eq('activo', true)
                .eq('grupos_alumnos.asignaciones_grupos_alumnos.alumno_id', user.id)
                .eq('grupos_alumnos.asignaciones_grupos_alumnos.activo', true);

            if (errorGrupos) {
                console.error('Error al obtener dietas de grupos:', errorGrupos);
            }
            
            console.log('Dietas de grupos obtenidas:', dietasGrupos);

            // Combinar y formatear las dietas
            const dietasCombinadas = [];
            
            // Agregar dietas directas
            if (dietasDirectas) {
                dietasDirectas.forEach(asignacion => {
                    if (asignacion.dietas) {
                        dietasCombinadas.push({
                            ...asignacion.dietas,
                            tipo_asignacion: 'directa',
                            fecha_asignacion: asignacion.fecha_asignacion,
                            observaciones: asignacion.observaciones
                        });
                    }
                });
            }

            // Agregar dietas de grupos
            if (dietasGrupos) {
                dietasGrupos.forEach(asignacion => {
                    if (asignacion.dietas) {
                        // Evitar duplicados
                        const existe = dietasCombinadas.some(d => d.id === asignacion.dietas.id);
                        if (!existe) {
                            dietasCombinadas.push({
                                ...asignacion.dietas,
                                tipo_asignacion: 'grupo',
                                fecha_asignacion: asignacion.fecha_asignacion
                            });
                        }
                    }
                });
            }

            // Filtrar solo las dietas que tienen archivos cargados
            const dietasConArchivos = dietasCombinadas.filter(dieta => 
                dieta.archivos && Array.isArray(dieta.archivos) && dieta.archivos.length > 0
            );

            // Ordenar por fecha de asignación más reciente
            dietasConArchivos.sort((a, b) => 
                new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion)
            );

            console.log('Dietas filtradas con archivos:', dietasConArchivos);
            setDietas(dietasConArchivos);
        } catch (error) {
            console.error('Error general al obtener dietas:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Función para descargar un archivo
    const descargarArchivo = useCallback(async (dieta, archivo) => {
        console.log('Iniciando descarga:', { dieta: dieta.nombre, archivo });
        
        if (!archivo || !archivo.url) {
            console.error('No hay archivo para descargar:', archivo);
            return;
        }

        const fileId = `${dieta.id}-${archivo?.name || archivo?.nombre || 'archivo'}`;
        setDownloadingFile(fileId);

        try {
            // Intentar múltiples formas de obtener el path correcto
            let fileName;
            
            if (archivo.path) {
                fileName = archivo.path;
                console.log('Usando path directo:', fileName);
            } else if (archivo.url.includes('/dietas/')) {
                // Extraer el path desde la URL completa
                fileName = archivo.url.split('/dietas/')[1];
                console.log('Extraido desde URL /dietas/:', fileName);
            } else {
                // Fallback: usar solo el nombre del archivo
                fileName = archivo.url.split('/').pop();
                console.log('Usando nombre de archivo desde URL:', fileName);
            }
            
            console.log('Intentando crear signed URL para:', fileName);
            
            const { data, error } = await supabase.storage
                .from('dietas')
                .createSignedUrl(fileName, 300);

            if (error) {
                console.error('Error al generar URL de descarga:', error);
                console.log('Intentando descarga directa...');
                
                // Fallback: descarga directa usando la URL pública
                const link = document.createElement('a');
                link.href = archivo.url;
                link.download = archivo?.name || archivo?.nombre || `dieta-${dieta.nombre || 'archivo'}.pdf`;
                link.target = '_blank';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('Descarga directa iniciada');
                return;
            }

            // Crear enlace temporal para descargar con URL firmada
            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.download = archivo?.name || archivo?.nombre || `dieta-${dieta.nombre || 'archivo'}.pdf`;
            link.target = '_blank';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Descarga con URL firmada iniciada');

        } catch (error) {
            console.error('Error al descargar archivo:', error);
            
            // Último fallback: descarga directa
            try {
                const link = document.createElement('a');
                link.href = archivo.url;
                link.download = archivo?.name || archivo?.nombre || `dieta-${dieta.nombre || 'archivo'}.pdf`;
                link.target = '_blank';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('Descarga de emergencia iniciada');
            } catch (fallbackError) {
                console.error('Error en descarga de emergencia:', fallbackError);
            }
        } finally {
            setDownloadingFile(null);
        }
    }, []);

    useEffect(() => {
        fetchDietasAsignadas();
    }, [fetchDietasAsignadas]);

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getTipoBadge = (tipo) => {
        const tipos = {
            'deficit_calorico': { label: 'Déficit Calórico', color: 'bg-red-500/20 text-red-400' },
            'aumento_masa': { label: 'Aumento de Masa', color: 'bg-green-500/20 text-green-400' },
            'mantenimiento': { label: 'Mantenimiento', color: 'bg-blue-500/20 text-blue-400' },
            'definicion': { label: 'Definición', color: 'bg-purple-500/20 text-purple-400' },
            'volumen': { label: 'Volumen', color: 'bg-orange-500/20 text-orange-400' }
        };
        
        return tipos[tipo] || { label: tipo || 'General', color: 'bg-gray-500/20 text-gray-400' };
    };

    if (loading) {
        return (
            <div className="min-h-svh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <FaSpinner className="w-8 h-8 animate-spin text-cyan-500" />
                    <p className="text-white/60">Cargando tus dietas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-svh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <main className="max-w-screen-md mx-auto px-4 py-6 pb-[env(safe-area-inset-bottom)] space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500">
                            <FaUtensils className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Mis Dietas</h1>
                    </div>
                    <p className="text-white/60 text-sm">
                        Aquí encontrarás todas las dietas asignadas para ti
                    </p>
                </div>

                {/* Lista de dietas */}
                {dietas.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
                            <FaUtensils className="w-8 h-8 text-white/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-white/80">
                            No hay dietas con archivos disponibles
                        </h3>
                        <p className="text-white/50 text-sm max-w-sm mx-auto">
                            No tienes dietas con archivos cargados disponibles para descargar. 
                            Consulta con tu entrenador si esperas ver contenido aquí.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {dietas.map((dieta, index) => (
                                <motion.div
                                    key={dieta.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]"
                                >
                                    {/* Header de la dieta */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold mb-1">
                                                {dieta.nombre}
                                            </h3>
                                            <div className="flex items-center gap-2 mb-2">
                                                {dieta.tipo && (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getTipoBadge(dieta.tipo).color}`}>
                                                        <FaTag className="w-3 h-3" />
                                                        {getTipoBadge(dieta.tipo).label}
                                                    </span>
                                                )}
                                                {dieta.calorias && (
                                                    <span className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded-lg">
                                                        {dieta.calorias} kcal
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                <FaCalendarAlt className="w-3 h-3" />
                                                <span>
                                                    Asignada el {formatearFecha(dieta.fecha_asignacion)}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    dieta.tipo_asignacion === 'directa' 
                                                        ? 'bg-cyan-500/20 text-cyan-400' 
                                                        : 'bg-purple-500/20 text-purple-400'
                                                }`}>
                                                    {dieta.tipo_asignacion === 'directa' ? 'Personal' : 'Grupal'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Archivos - Solo mostrar archivos múltiples */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-white/80 mb-3">
                                            Archivos ({dieta.archivos?.length || 0})
                                        </h4>
                                        {dieta.archivos && dieta.archivos.length > 0 ? dieta.archivos.map((archivo, archivoIndex) => {
                                            const fileId = `${dieta.id}-${archivo?.name || archivo?.nombre || 'archivo'}`;
                                            const fileExtension = (archivo?.name || archivo?.nombre)?.split('.')?.pop()?.toLowerCase();
                                            const isPDF = fileExtension === 'pdf';
                                            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension || '');
                                            
                                            return (
                                                <motion.button
                                                    key={archivoIndex}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => descargarArchivo(dieta, archivo)}
                                                    disabled={downloadingFile === fileId}
                                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-400/40 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 disabled:opacity-50 group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                                            isPDF ? 'bg-red-500/20 text-red-400 group-hover:bg-red-500/30' :
                                                            isImage ? 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30' :
                                                            'bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30'
                                                        }`}>
                                                            {isPDF ? (
                                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                                </svg>
                                                            ) : isImage ? (
                                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                                </svg>
                                                            ) : (
                                                                <FaUtensils className="w-5 h-5" />
                                                            )}
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <p className="text-sm font-semibold text-white group-hover:text-white/90 transition-colors">
                                                                {archivo?.name || archivo?.nombre || 'Archivo sin nombre'}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                {archivo?.size && (
                                                                    <span className="text-xs text-white/60">
                                                                        {(archivo.size / (1024 * 1024)).toFixed(1)} MB
                                                                    </span>
                                                                )}
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                    isPDF ? 'bg-red-500/20 text-red-300' :
                                                                    isImage ? 'bg-purple-500/20 text-purple-300' :
                                                                    'bg-cyan-500/20 text-cyan-300'
                                                                }`}>
                                                                    {fileExtension?.toUpperCase() || 'ARCHIVO'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        {downloadingFile === fileId ? (
                                                            <FaSpinner className="w-5 h-5 animate-spin text-green-400" />
                                                        ) : (
                                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-400 group-hover:bg-green-500/30 transition-colors">
                                                                <FaDownload className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.button>
                                            );
                                        }) : (
                                            <div className="text-center py-8 space-y-3">
                                                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
                                                    <FaUtensils className="w-6 h-6 text-white/40" />
                                                </div>
                                                <p className="text-sm text-white/60">
                                                    No hay archivos disponibles para esta dieta
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DietasAlumno;
