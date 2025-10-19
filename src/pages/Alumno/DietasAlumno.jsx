import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    FaUtensils,
    FaSpinner,
    FaCalendarAlt,
    FaInfoCircle,
    FaTag,
    FaUserCircle,
    FaEye,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadDietIcon from '../../assets/download-diet.svg';
import DocIcon from '../../assets/doc.svg';
import DietaSlider from '../../assets/dieta-slider.png';
import SimplePDFViewer from '../../components/SimplePDFViewer';

const DietasAlumno = () => {
    const { user } = useAuth();
    const [dietas, setDietas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingFile, setDownloadingFile] = useState(null);
    const [pdfViewer, setPdfViewer] = useState({
        isOpen: false,
        archivo: null,
        dietaNombre: null
    });

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
            // Mejorar la extracción del path del archivo
            let fileName;
            
            if (archivo.path) {
                // Usar path directo si está disponible
                fileName = archivo.path;
                console.log('Usando path directo:', fileName);
            } else {
                // Extraer el path desde la URL de manera más robusta
                const url = archivo.url;
                const supabaseStorageUrl = '/storage/v1/object/public/dietas/';
                
                if (url.includes(supabaseStorageUrl)) {
                    // Para URLs de Supabase storage
                    fileName = url.split(supabaseStorageUrl)[1];
                    console.log('Path extraído de URL Supabase:', fileName);
                } else if (url.includes('/dietas/')) {
                    // Fallback para otras estructuras de URL
                    const parts = url.split('/dietas/');
                    fileName = parts[parts.length - 1];
                    console.log('Path extraído con fallback /dietas/:', fileName);
                } else {
                    // Último fallback: usar el nombre del archivo desde la URL
                    const urlParts = url.split('/');
                    fileName = urlParts[urlParts.length - 1];
                    console.log('Usando nombre desde URL:', fileName);
                }
                
                // Decodificar URL encoding si es necesario
                fileName = decodeURIComponent(fileName);
            }
            
            console.log('Intentando crear signed URL para:', fileName);
            
            // Intentar crear URL firmada
            const { data, error } = await supabase.storage
                .from('dietas')
                .createSignedUrl(fileName, 300); // 5 minutos de validez

            if (error) {
                console.error('Error al generar URL de descarga:', error);
                console.log('Intentando descarga directa...');
                
                // Fallback: descarga directa usando la URL pública
                const link = document.createElement('a');
                link.href = archivo.url;
                link.download = archivo?.name || archivo?.nombre || `dieta-${dieta.nombre || 'archivo'}.pdf`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                
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
            link.rel = 'noopener noreferrer';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Descarga con URL firmada exitosa');

        } catch (error) {
            console.error('Error al descargar archivo:', error);
            
            // Último fallback: descarga directa
            try {
                const link = document.createElement('a');
                link.href = archivo.url;
                link.download = archivo?.name || archivo?.nombre || `dieta-${dieta.nombre || 'archivo'}.pdf`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('Descarga de emergencia iniciada');
            } catch (fallbackError) {
                console.error('Error en descarga de emergencia:', fallbackError);
                alert('Error al descargar el archivo. Por favor, contacta con soporte.');
            }
        } finally {
            setDownloadingFile(null);
        }
    }, []);

    // Función para abrir el visor de PDF
    const abrirVisorPDF = useCallback((dieta, archivo) => {
        console.log('🔍 Abriendo visor PDF:', { dieta: dieta.nombre, archivo });
        setPdfViewer({
            isOpen: true,
            archivo: archivo,
            dietaNombre: dieta.nombre
        });
    }, []);

    // Función para cerrar el visor de PDF
    const cerrarVisorPDF = useCallback(() => {
        setPdfViewer({
            isOpen: false,
            archivo: null,
            dietaNombre: null
        });
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


    

    return (
        <div className="mt-[50px]">
            <header className="relative mb-4 px-2 ">
                <img 
                    src={DietaSlider} 
                    alt="Encabezado de dietas" 
                    className="w-full h-32 object-cover rounded-lg" 
                />
                <div className="absolute inset-0 bg-black/40 rounded-lg mx-2" />
                <div className=" absolute inset-0 flex items-center justify-center">
                    <h1 className="text-[25px] text-white tracking-wider">
                        Mi Dieta
                    </h1>
                </div>
            </header>
            <main className=" mx-auto px-2 space-y-2 ">


                {/* Lista de dietas */}
                {dietas.length === 0 ? (
                    <section className="flex items-center justify-center mt-20">
                        <div className="rounded-2xl p-6 bg-[#121212] text-center">
                            <div className="mb-4">
                                <FaUserCircle className="text-4xl text-[#FF0000] mx-auto mb-2" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-white mb-2">
                                Aún no tienes dietas asignadas
                            </h3>
                            <p className="text-[14px] text-[#B5B5B5]">
                                Pronto un entrenador te asignará una
                            </p>
                        </div>
                    </section>
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
                                    className="rounded-[10px] px-2 py-4 bg-[#D9D9D9]"
                                >
                                    {/* Header de la dieta */}
                                    <div className="flex items-start justify-between ">
                                        <div className="flex-1">
                                            <h3 className="text-[20px] text-[#000000] mb-1">
                                                {dieta.nombre}
                                            </h3>
                                    
                                           
                                        </div>
                                    </div>

                                    {/* Archivos - Solo mostrar archivos múltiples */}
                                    <div className="space-y-3">
                                      
                                        {dieta.archivos && dieta.archivos.length > 0 ? dieta.archivos.map((archivo, archivoIndex) => {
                                            const fileId = `${dieta.id}-${archivo?.name || archivo?.nombre || 'archivo'}`;
                                            const fileExtension = (archivo?.name || archivo?.nombre)?.split('.')?.pop()?.toLowerCase();
                                            const isPDF = fileExtension === 'pdf';
                                            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension || '');
                                            
                                            return (
                                                <div key={archivoIndex} className="bg-[#121212] rounded-[10px] p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                                                                <img src={DocIcon} alt="Documento" className="w-[30px] h-[37px]" />
                                                            </div>
                                                            <div className="text-left flex-1">
                                                                <p className="text-[15px] text-[#b5b5b5] mb-1">
                                                                    {archivo?.name || archivo?.nombre || 'Archivo sin nombre'}
                                                                </p>
                                                           
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-2">
                                                            {/* Botón de Vista Previa para PDFs */}
                                                            {isPDF && (
                                                                <motion.button
                                                                    onClick={() => abrirVisorPDF(dieta, archivo)}
                                                                    className="px-3 py-2 bg-[#FF0000] rounded-lg flex items-center gap-2 transition-colors"
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    title="Ver PDF"
                                                                >
                                                                    <span className="text-[#FFFFFF] text-[12px] font-medium">Ver</span>
                                                                </motion.button>
                                                            )}
                                                            
                                                            {/* Botón de Descarga */}
                                                            <motion.button
                                                                onClick={() => descargarArchivo(dieta, archivo)}
                                                                disabled={downloadingFile === fileId}
                                                                className="px-3 py-2  rounded-lg flex items-center gap-2 transition-colors"
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                title="Descargar archivo"
                                                            >
                                                                {downloadingFile === fileId ? (
                                                                    <FaSpinner className="w-5 h-5 animate-spin text-white" />
                                                                ) : (
                                                                    <img src={DownloadDietIcon} alt="Descargar" className="w-[20px] h-[20px]" />
                                                                )}
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </div>
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
            
            {/* Visor de PDF simplificado */}
            <SimplePDFViewer
                isOpen={pdfViewer.isOpen}
                onClose={cerrarVisorPDF}
                archivo={pdfViewer.archivo}
                dietaNombre={pdfViewer.dietaNombre}
            />
        </div>
    );
};

export default DietasAlumno;
