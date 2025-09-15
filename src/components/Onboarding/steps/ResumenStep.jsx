import React from 'react';
import { motion } from 'framer-motion';
import { 
    FaFire, 
    FaDumbbell, 
    FaBalanceScale, 
    FaTrophy,
    FaSeedling,
    FaRunning,
    FaMedal,
    FaCalendarCheck,
    FaGraduationCap,
    FaCompass,
    FaCheckCircle
} from 'react-icons/fa';

const ResumenStep = ({ data }) => {
    const getObjetivoInfo = (objetivo) => {
        const objetivos = {
            perder_peso: { title: 'Perder peso', icon: FaFire, color: 'text-red-400' },
            ganar_musculo: { title: 'Ganar músculo', icon: FaDumbbell, color: 'text-blue-400' },
            mantenimiento: { title: 'Mantenerme en forma', icon: FaBalanceScale, color: 'text-green-400' },
            rendimiento: { title: 'Mejorar rendimiento', icon: FaTrophy, color: 'text-yellow-400' }
        };
        return objetivos[objetivo] || { title: objetivo, icon: FaCheckCircle, color: 'text-gray-400' };
    };

    const getExperienciaInfo = (experiencia) => {
        const experiencias = {
            principiante: { title: 'Principiante', icon: FaSeedling, color: 'text-green-400' },
            intermedio: { title: 'Intermedio', icon: FaRunning, color: 'text-blue-400' },
            avanzado: { title: 'Avanzado', icon: FaMedal, color: 'text-yellow-400' }
        };
        return experiencias[experiencia] || { title: experiencia, icon: FaCheckCircle, color: 'text-gray-400' };
    };

    const getPreferenciaInfo = (preferencia) => {
        const preferencias = {
            rutina: { title: 'Comenzar con rutinas', icon: FaCalendarCheck, color: 'text-cyan-400' },
            cursos: { title: 'Explorar cursos', icon: FaGraduationCap, color: 'text-purple-400' },
            explorar: { title: 'Explorar la plataforma', icon: FaCompass, color: 'text-orange-400' }
        };
        return preferencias[preferencia] || { title: preferencia, icon: FaCheckCircle, color: 'text-gray-400' };
    };

    const objetivoInfo = getObjetivoInfo(data.objetivo);
    const experienciaInfo = getExperienciaInfo(data.experiencia);
    const preferenciaInfo = getPreferenciaInfo(data.preferencia_inicio);

    return (
        <div className="space-y-6">
            {/* Header de bienvenida */}
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <FaCheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                
                <h3 className="text-xl font-bold text-white mb-2">¡Perfecto! Tu perfil está listo</h3>
                <p className="text-gray-300">Aquí tienes un resumen de tu configuración:</p>
            </div>

            {/* Resumen de datos */}
            <div className="space-y-4">
                {/* Objetivo */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                    <div className="flex items-center space-x-3">
                        <objetivoInfo.icon className={`w-6 h-6 ${objetivoInfo.color}`} />
                        <div>
                            <p className="text-white font-medium">Tu objetivo:</p>
                            <p className="text-gray-300">{objetivoInfo.title}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Experiencia */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                    <div className="flex items-center space-x-3">
                        <experienciaInfo.icon className={`w-6 h-6 ${experienciaInfo.color}`} />
                        <div>
                            <p className="text-white font-medium">Tu nivel:</p>
                            <p className="text-gray-300">{experienciaInfo.title}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Biometría */}
                {(data.altura || data.peso) && (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                        <div className="space-y-2">
                            <p className="text-white font-medium">Datos físicos:</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {data.altura && (
                                    <div>
                                        <span className="text-gray-400">Altura:</span>
                                        <span className="text-gray-300 ml-2">{data.altura} cm</span>
                                    </div>
                                )}
                                {data.peso && (
                                    <div>
                                        <span className="text-gray-400">Peso:</span>
                                        <span className="text-gray-300 ml-2">{data.peso} kg</span>
                                    </div>
                                )}
                                {data.porcentaje_grasa && (
                                    <div>
                                        <span className="text-gray-400">Grasa:</span>
                                        <span className="text-gray-300 ml-2">{data.porcentaje_grasa}%</span>
                                    </div>
                                )}
                                {data.cintura_cm && (
                                    <div>
                                        <span className="text-gray-400">Cintura:</span>
                                        <span className="text-gray-300 ml-2">{data.cintura_cm} cm</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Preferencia */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                    <div className="flex items-center space-x-3">
                        <preferenciaInfo.icon className={`w-6 h-6 ${preferenciaInfo.color}`} />
                        <div>
                            <p className="text-white font-medium">Tu preferencia:</p>
                            <p className="text-gray-300">{preferenciaInfo.title}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Mensaje final */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4 text-center"
            >
                <p className="text-cyan-300 font-medium">
                    ¡Bienvenido a Fit! 🎉
                </p>
                <p className="text-sm text-gray-300 mt-2">
                    Estás listo para comenzar tu viaje fitness personalizado
                </p>
            </motion.div>
        </div>
    );
};

export default ResumenStep;
