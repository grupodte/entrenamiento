import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const SimplePDFViewer = ({ 
    isOpen, 
    onClose, 
    archivo, 
    dietaNombre,
    showDownloadButton = true 
}) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && archivo) {
            loadPDF();
            
            // Agregar estilo negro elegante a la scrollbar
            const style = document.createElement('style');
            style.id = 'pdf-viewer-scrollbar';
            style.innerHTML = `
                .pdf-viewer-container {
                    scrollbar-width: thin;
                    scrollbar-color: #333 #000;
                }
                .pdf-viewer-container::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .pdf-viewer-container::-webkit-scrollbar-track {
                    background: #000;
                    border-radius: 4px;
                }
                .pdf-viewer-container::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 4px;
                    border: 1px solid #222;
                }
                .pdf-viewer-container::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
                .pdf-viewer-container::-webkit-scrollbar-corner {
                    background: #000;
                }
            `;
            document.head.appendChild(style);
        }

        return () => {
            if (pdfUrl && pdfUrl.startsWith('blob:')) {
                URL.revokeObjectURL(pdfUrl);
            }
            // Limpiar estilos al cerrar
            const existingStyle = document.getElementById('pdf-viewer-scrollbar');
            if (existingStyle) {
                existingStyle.remove();
            }
        };
    }, [isOpen, archivo]);

    const loadPDF = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('📄 Cargando PDF simplificado:', archivo);

            let finalUrl = archivo.url;

            // Si el archivo tiene path, intentar crear URL firmada
            if (archivo.path) {
                console.log('🔐 Intentando URL firmada...');
                const { data: signedData, error: signedError } = await supabase.storage
                    .from('dietas')
                    .createSignedUrl(archivo.path, 3600);

                if (!signedError && signedData?.signedUrl) {
                    finalUrl = signedData.signedUrl;
                    console.log('✅ URL firmada obtenida');
                } else {
                    console.warn('⚠️ Usando URL pública como fallback');
                }
            }

            setPdfUrl(finalUrl);
            console.log('✅ PDF URL configurada');

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



    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-[9999]"
                style={{ minHeight: '100vh' }}
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                {/* Contenido del PDF */}
                <div className="w-full h-full">
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                <p className="text-white">Cargando PDF...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center p-8 max-w-md">
                                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Error al cargar el PDF
                                </h3>
                                <p className="text-gray-300 mb-4">{error}</p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={loadPDF}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                        </div>
                    )}

                    {pdfUrl && !loading && !error && (
                        <div className="w-full h-full pdf-viewer-container overflow-auto">
                            <iframe
                                src={`${pdfUrl}#toolbar=0&navpanes=0&statusbar=0&messages=0&zoom=page-fit&view=FitH`}
                                className="w-full h-full border-0"
                                title="Visor PDF"
                                style={{ 
                                    touchAction: 'pan-y pan-x zoom-in zoom-out',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    width: '100%',
                                    height: '100%'
                                }}
                                allow="fullscreen"
                                frameBorder="0"
                            />
                        </div>
                    )}
                </div>
                
                {/* Botones flotantes en posición fija */}
                <div className="absolute top-4 right-8 flex flex-col gap-2 z-[10000]">
                    {/* Cerrar */}
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/80 hover:bg-black/90 rounded-[10px] transition-colors shadow-lg border border-white/20"
                        title="Cerrar"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                    
                    {/* Descargar */}
                    {showDownloadButton && (
                        <button
                            onClick={handleDownload}
                            className="p-2 bg-[#FF0000] hover:bg-[#E60000] rounded-[10px] transition-colors shadow-lg"
                            title="Descargar PDF"
                        >
                            <Download className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>

            </motion.div>
        </AnimatePresence>
    );
};

export default SimplePDFViewer;