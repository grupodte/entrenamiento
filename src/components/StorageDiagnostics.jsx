import { useState } from 'react';
import { motion } from 'framer-motion';
import { runFullDiagnosis, diagnoseStorage, testStorageFunctions, checkStoragePolicies } from '../utils/storageDebug';
import { AlertTriangle, CheckCircle, XCircle, Play, RefreshCw, FileText } from 'lucide-react';

const StorageDiagnostics = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const runDiagnosis = async () => {
        setIsRunning(true);
        setResults(null);
        
        try {
            const diagnosticResults = await runFullDiagnosis();
            setResults(diagnosticResults);
        } catch (error) {
            console.error('Error ejecutando diagnóstico:', error);
            setResults({
                error: error.message,
                storage: { errors: [{ step: 'diagnosis', error }] },
                functions: { uploadSuccess: false, error },
                policies: { error }
            });
        } finally {
            setIsRunning(false);
        }
    };

    const runQuickTest = async () => {
        setIsRunning(true);
        
        try {
            console.log('🚀 Ejecutando test rápido de storage...');
            const testResults = await testStorageFunctions();
            
            if (testResults.uploadSuccess) {
                alert('✅ Test rápido exitoso - Storage funcionando correctamente');
            } else {
                alert('❌ Test falló: ' + (testResults.error?.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error en test rápido:', error);
            alert('❌ Error ejecutando test: ' + error.message);
        } finally {
            setIsRunning(false);
        }
    };

    const getStatusIcon = (success) => {
        if (success === null || success === undefined) {
            return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
        }
        return success ? 
            <CheckCircle className="w-5 h-5 text-green-400" /> : 
            <XCircle className="w-5 h-5 text-red-400" />;
    };

    const getStatusColor = (success) => {
        if (success === null || success === undefined) return 'text-yellow-400';
        return success ? 'text-green-400' : 'text-red-400';
    };

    return (
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        Diagnóstico de Storage
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Verifica el funcionamiento del sistema de archivos de Supabase
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <motion.button
                        onClick={runQuickTest}
                        disabled={isRunning}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isRunning ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        Test Rápido
                    </motion.button>
                    
                    <motion.button
                        onClick={runDiagnosis}
                        disabled={isRunning}
                        className="flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isRunning ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileText className="w-4 h-4" />
                        )}
                        Diagnóstico Completo
                    </motion.button>
                </div>
            </div>

            {isRunning && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4"
                >
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                        <span className="text-blue-400">Ejecutando diagnóstico...</span>
                    </div>
                    <p className="text-blue-300 text-sm mt-2">
                        Revisa la consola del navegador para ver el progreso detallado
                    </p>
                </motion.div>
            )}

            {results && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {/* Resumen de resultados */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                {getStatusIcon(results.storage?.errors?.length === 0)}
                                <div>
                                    <p className="text-white font-medium">Storage</p>
                                    <p className={`text-sm ${getStatusColor(results.storage?.errors?.length === 0)}`}>
                                        {results.storage?.errors?.length === 0 ? 'OK' : `${results.storage?.errors?.length || 0} errores`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                {getStatusIcon(results.functions?.uploadSuccess)}
                                <div>
                                    <p className="text-white font-medium">Funciones</p>
                                    <p className={`text-sm ${getStatusColor(results.functions?.uploadSuccess)}`}>
                                        {results.functions?.uploadSuccess ? 'Funcionando' : 'Error'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                {getStatusIcon(results.policies?.canRead && results.policies?.canWrite)}
                                <div>
                                    <p className="text-white font-medium">Políticas</p>
                                    <p className={`text-sm ${getStatusColor(results.policies?.canRead && results.policies?.canWrite)}`}>
                                        {results.policies?.canRead && results.policies?.canWrite ? 'Permitidas' : 'Restringidas'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botón para mostrar detalles */}
                    <motion.button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full text-left bg-gray-800/30 hover:bg-gray-800/50 rounded-lg p-4 transition-colors"
                        whileHover={{ scale: 1.01 }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-white">Ver detalles técnicos</span>
                            <motion.div
                                animate={{ rotate: showDetails ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                ▼
                            </motion.div>
                        </div>
                    </motion.button>

                    {/* Detalles técnicos */}
                    {showDetails && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-900/50 rounded-lg p-4 overflow-auto max-h-96"
                        >
                            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                {JSON.stringify(results, null, 2)}
                            </pre>
                        </motion.div>
                    )}

                    {/* Recomendaciones basadas en los resultados */}
                    {results.storage?.errors?.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <h4 className="text-red-400 font-medium mb-2">⚠️ Problemas detectados:</h4>
                            <ul className="text-red-300 text-sm space-y-1">
                                {results.storage.errors.map((error, index) => (
                                    <li key={index}>
                                        • {error.step}: {error.error?.message || 'Error desconocido'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!results.policies?.authenticated && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <h4 className="text-yellow-400 font-medium mb-2">ℹ️ Información:</h4>
                            <p className="text-yellow-300 text-sm">
                                Usuario no autenticado. Algunas pruebas requieren login de administrador.
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            <div className="mt-4 text-xs text-gray-500">
                💡 Tip: Abre las DevTools (F12) → Console para ver logs detallados durante el diagnóstico
            </div>
        </div>
    );
};

export default StorageDiagnostics;