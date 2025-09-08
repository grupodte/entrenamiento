import { useState } from 'react';
import { debugExecutionTypes } from '../../utils/debugExecutionTypes';
import { EXECUTION_TYPES } from '../../constants/executionTypes';

const ExecutionTypeTest = () => {
    const [debugResults, setDebugResults] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    const runDebug = async () => {
        setIsRunning(true);
        try {
            // Capturar console.log durante el debug
            const originalLog = console.log;
            const originalError = console.error;
            const originalGroup = console.group;
            const originalGroupEnd = console.groupEnd;
            
            let capturedLogs = [];
            
            console.log = (...args) => {
                capturedLogs.push({ type: 'log', args });
                originalLog(...args);
            };
            
            console.error = (...args) => {
                capturedLogs.push({ type: 'error', args });
                originalError(...args);
            };
            
            console.group = (...args) => {
                capturedLogs.push({ type: 'group', args });
                originalGroup(...args);
            };
            
            console.groupEnd = () => {
                capturedLogs.push({ type: 'groupEnd', args: [] });
                originalGroupEnd();
            };

            await debugExecutionTypes();
            
            // Restaurar console.log
            console.log = originalLog;
            console.error = originalError;
            console.group = originalGroup;
            console.groupEnd = originalGroupEnd;
            
            setDebugResults(capturedLogs);
        } catch (error) {
            console.error('Error ejecutando debug:', error);
            setDebugResults([{ type: 'error', args: ['Error ejecutando debug:', error.message] }]);
        } finally {
            setIsRunning(false);
        }
    };

    const renderLogEntry = (entry, index) => {
        const { type, args } = entry;
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');

        let className = 'p-2 rounded text-sm font-mono ';
        let prefix = '';

        switch (type) {
            case 'error':
                className += 'bg-red-900/20 text-red-300 border border-red-500/30';
                prefix = '❌ ';
                break;
            case 'group':
                className += 'bg-blue-900/20 text-blue-300 border border-blue-500/30 font-bold';
                prefix = '📁 ';
                break;
            case 'groupEnd':
                return null; // No mostrar groupEnd
            default:
                className += 'bg-gray-800/50 text-gray-300 border border-gray-600/30';
                break;
        }

        return (
            <div key={index} className={className}>
                <pre className="whitespace-pre-wrap">{prefix}{message}</pre>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
            <h2 className="text-2xl font-bold mb-4">🔧 Diagnóstico de Tipos de Ejecución</h2>
            
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Constantes cargadas:</h3>
                <div className="bg-gray-800 p-3 rounded text-sm font-mono">
                    <pre>{JSON.stringify(EXECUTION_TYPES, null, 2)}</pre>
                </div>
            </div>

            <button
                onClick={runDebug}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold mb-4"
            >
                {isRunning ? 'Ejecutando diagnóstico...' : '🔍 Ejecutar Diagnóstico'}
            </button>

            {debugResults && (
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Resultados del Diagnóstico:</h3>
                    <div className="bg-black/50 p-4 rounded space-y-1 max-h-96 overflow-y-auto">
                        {debugResults.map((entry, index) => renderLogEntry(entry, index))}
                    </div>
                </div>
            )}

            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded">
                <h4 className="font-bold text-yellow-300 mb-2">🚨 Pasos necesarios:</h4>
                <ol className="list-decimal list-inside text-yellow-100 space-y-1">
                    <li>Ejecutar el diagnóstico con el botón de arriba</li>
                    <li>Si las columnas no existen, ejecutar las migraciones SQL en Supabase</li>
                    <li>Verificar que el enum <code>execution_type</code> esté creado</li>
                    <li>Probar el guardado de rutinas después de las migraciones</li>
                </ol>
            </div>
        </div>
    );
};

export default ExecutionTypeTest;
