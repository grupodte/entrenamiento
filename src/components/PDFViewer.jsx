import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const PDFViewer = ({ 
    isOpen, 
    onClose, 
    archivo, 
    dietaNombre,
    showDownloadButton = true 
}) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [fullscreen, setFullscreen] = useState(false);

    useEffect(() => {
        if (isOpen && archivo) {
            loadPDF();
        }

        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [isOpen, archivo]);

    const loadPDF = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('🔍 Cargando PDF:', archivo);

            let finalUrl = archivo.url;

            // Si el archivo tiene path, intentar crear URL firmada
            if (archivo.path) {
                console.log('📝 Intentando URL firmada...');
                const { data: signedData, error: signedError } = await supabase.storage
                    .from('dietas')
                    .createSignedUrl(archivo.path, 3600); // 1 hora de validez

                if (!signedError && signedData?.signedUrl) {
                    finalUrl = signedData.signedUrl;
                    console.log('✅ URL firmada obtenida');
                } else {
                    console.warn('⚠️ Usando URL pública como fallback');
                }
            }

            // Verificar si la URL es accesible
            const response = await fetch(finalUrl, { 
                method: 'HEAD',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se puede acceder al archivo`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('pdf')) {
                console.warn('⚠️ Tipo de contenido inesperado:', contentType);
            }

            setPdfUrl(finalUrl);
            console.log('✅ PDF cargado exitosamente');

        } catch (error) {
            console.error('❌ Error cargando PDF:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!archivo) return;

        const link = document.createElement('a');
        link.href = pdfUrl || archivo.url;
        link.download = archivo.name || archivo.nombre || `${dietaNombre}.pdf`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleZoom = (direction) => {
        setZoom(prev => {
            if (direction === 'in') {
                return Math.min(prev + 0.25, 3);
            } else {
                return Math.max(prev - 0.25, 0.5);
            }
        });
    };

    const toggleFullscreen = () => {
        setFullscreen(!fullscreen);
    };

    const resetZoom = () => {
        setZoom(1);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center pt-20 ${
                    fullscreen ? 'p-0' : 'p-4'
                }`}
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`bg-white rounded-lg shadow-2xl flex flex-col ${
                        fullscreen 
                            ? 'w-full h-full rounded-none' 
                            : 'w-full max-w-6xl h-[90vh]'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-gray-900 text-white rounded-t-lg">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="font-semibold truncate">
                                    {archivo?.name || archivo?.nombre || 'Documento PDF'}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    {dietaNombre && `Dieta: ${dietaNombre}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Controles de zoom */}
                            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                                <button
                                    onClick={() => handleZoom('out')}
                                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                                    title="Alejar"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="px-2 text-sm font-mono">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    onClick={() => handleZoom('in')}
                                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                                    title="Acercar"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={resetZoom}
                                    className="p-1 hover:bg-gray-700 rounded transition-colors text-xs"
                                    title="Zoom 100%"
                                >
                                    100%
                                </button>
                            </div>

                            {/* Pantalla completa */}
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                title={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>

                            {/* Descargar */}
                            {showDownloadButton && (
                                <button
                                    onClick={handleDownload}
                                    className="p-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
                                    title="Descargar PDF"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            )}

                            {/* Cerrar */}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Cerrar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 flex items-center justify-center bg-gray-100 overflow-hidden">
                        {loading && (
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Cargando PDF...</p>
                            </div>
                        )}

                        {error && (
                            <div className="text-center p-8 max-w-md">
                                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Error al cargar el PDF
                                </h3>
                                <p className="text-gray-600 mb-4">{error}</p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={loadPDF}
                                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                                    >
                                        Reintentar
                                    </button>
                                    {showDownloadButton && (
                                        <button
                                            onClick={handleDownload}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            Descargar
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {pdfUrl && !loading && !error && (
                            <div className="w-full h-full overflow-auto p-4">
                                <div 
                                    className="mx-auto"
                                    style={{
                                        transform: `scale(${zoom})`,
                                        transformOrigin: 'top center',
                                        transition: 'transform 0.2s ease'
                                    }}
                                >
                                    {/* Iframe para mostrar el PDF sin herramientas */}
                                    <iframe
                                        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&page=1&view=FitH`}
                                        className="w-full border-0 shadow-lg rounded-lg bg-white"
                                        style={{
                                            height: fullscreen ? '100vh' : '80vh',
                                            minHeight: '600px'
                                        }}
                                        title={`PDF: ${archivo?.name || 'Documento'}`}
                                        onLoad={() => console.log('PDF iframe cargado')}
                                        onError={(e) => {
                                            console.error('Error en iframe PDF:', e);
                                            setError('Error mostrando el PDF en el navegador');
                                        }}
                                        allowFullScreen={false}
                                        sandbox="allow-same-origin allow-scripts"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer con información */}
                    <div className="px-4 py-2 bg-gray-50 border-t rounded-b-lg">
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>
                                💡 Usa Ctrl+rueda del ratón para hacer zoom
                            </span>
                            <span>
                                Tamaño: {archivo?.size ? `${(archivo.size / 1024 / 1024).toFixed(2)} MB` : 'Desconocido'}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PDFViewer;