import { useState } from 'react';
import { motion } from 'framer-motion';
import DietasManager from '../../components/DietasManager';
import StorageDiagnostics from '../../components/StorageDiagnostics';
import { Settings } from 'lucide-react';

const AdminDietas = () => {
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 text-white pb-safe">
            {/* Botón de diagnóstico */}
            <div className="flex justify-end">
                <motion.button
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="flex items-center gap-2 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Settings className="w-4 h-4" />
                    {showDiagnostics ? 'Ocultar' : 'Mostrar'} Diagnóstico
                </motion.button>
            </div>

            {/* Diagnóstico de Storage */}
            {showDiagnostics && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <StorageDiagnostics />
                </motion.div>
            )}
            
            {/* Gestor de Dietas */}
            <DietasManager />
        </div>
    );
};

export default AdminDietas;
