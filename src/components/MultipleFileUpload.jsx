import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

const MultipleFileUpload = ({ 
    archivos = [], 
    onChange, 
    maxFiles = 5, 
    maxSizeMB = 10,
    allowedTypes = ['application/pdf'],
    className = ""
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file) => {
        // Verificar tipo
        if (!allowedTypes.includes(file.type)) {
            return `Tipo de archivo no permitido. Solo se permiten: ${allowedTypes.join(', ')}`;
        }

        // Verificar tamaño
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return `El archivo es muy grande. Máximo ${maxSizeMB}MB.`;
        }

        return null;
    };

    const handleFiles = (newFiles) => {
        setError('');
        
        const validFiles = [];
        const errors = [];

        // Verificar límite total
        if (archivos.length + newFiles.length > maxFiles) {
            setError(`Máximo ${maxFiles} archivos permitidos`);
            return;
        }

        // Validar cada archivo
        Array.from(newFiles).forEach(file => {
            const validation = validateFile(file);
            if (validation) {
                errors.push(`${file.name}: ${validation}`);
            } else {
                // Verificar si ya existe
                const exists = archivos.some(existing => 
                    existing.name === file.name && existing.size === file.size
                );
                
                if (!exists) {
                    validFiles.push(file);
                } else {
                    errors.push(`${file.name}: Archivo duplicado`);
                }
            }
        });

        if (errors.length > 0) {
            setError(errors.join(', '));
        }

        if (validFiles.length > 0) {
            const updatedFiles = [...archivos, ...validFiles];
            onChange(updatedFiles);
        }
    };

    const removeFile = (indexToRemove) => {
        const updatedFiles = archivos.filter((_, index) => index !== indexToRemove);
        onChange(updatedFiles);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleFileInputChange = (e) => {
        const files = e.target.files;
        if (files) {
            handleFiles(files);
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Zona de drop */}
            <motion.div
                className={`
                    relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging 
                        ? 'border-cyan-400 bg-cyan-500/10' 
                        : 'border-white/20 hover:border-cyan-500/50 hover:bg-white/5'
                    }
                `}
                onClick={openFileDialog}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={allowedTypes.join(',')}
                    onChange={handleFileInputChange}
                    className="hidden"
                />
                
                <Upload className="w-12 h-12 text-white/50 mx-auto mb-4" />
                <p className="text-white text-lg font-medium mb-2">
                    {archivos.length === 0 
                        ? 'Arrastra archivos aquí o haz clic para seleccionar'
                        : 'Agregar más archivos'
                    }
                </p>
                <p className="text-gray-400 text-sm">
                    Máximo {maxFiles} archivos, {maxSizeMB}MB cada uno
                </p>
                <p className="text-gray-400 text-xs mt-1">
                    Formatos: {allowedTypes.includes('application/pdf') && 'PDF'} 
                </p>
            </motion.div>

            {/* Error message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
            )}

            {/* Lista de archivos */}
            <AnimatePresence>
                {archivos.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        <h4 className="text-white font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Archivos seleccionados ({archivos.length}/{maxFiles})
                        </h4>
                        
                        {archivos.map((file, index) => (
                            <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <FileText className="w-5 h-5 text-red-400" />
                                    <div className="flex-1">
                                        <p className="text-white font-medium text-sm truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                
                                <motion.button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MultipleFileUpload;
