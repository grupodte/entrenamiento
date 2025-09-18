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
    FaCheckCircle,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaBirthdayCake,
    FaVenusMars
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

    const getGeneroLabel = (genero) => {
        const generos = {
            masculino: 'Masculino',
            femenino: 'Femenino',
            otro: 'Otro',
            prefiero_no_decir: 'Prefiero no decir'
        };
        return generos[genero] || genero;
    };

    const objetivoInfo = getObjetivoInfo(data.objetivo);
    const experienciaInfo = getExperienciaInfo(data.experiencia);
    const preferenciaInfo = getPreferenciaInfo(data.preferencia_inicio);

    return (
        <div className="space-y-6">
           

            {/* Resumen de datos */}
            <div className="space-y-4">
                {/* Datos personales */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]"
                >
                    <div className="space-y-4">
                        <p className="text-white/90 font-semibold flex items-center text-lg">
                            <FaUser className="w-5 h-5 mr-3 text-cyan-400" />
                            Información personal
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-white/50 text-xs uppercase tracking-wide">Nombre completo</span>
                                <p className="text-white/90 font-medium">{data.nombre} {data.apellido}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-white/50 text-xs uppercase tracking-wide">Email</span>
                                <p className="text-white/90 font-medium truncate">{data.email}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-white/50 text-xs uppercase tracking-wide">Edad</span>
                                <p className="text-white/90 font-medium">{data.edad} años</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-white/50 text-xs uppercase tracking-wide">Género</span>
                                <p className="text-white/90 font-medium">{getGeneroLabel(data.genero)}</p>
                            </div>
                            {data.telefono && (
                                <div className="md:col-span-2 space-y-1">
                                    <span className="text-white/50 text-xs uppercase tracking-wide">Teléfono</span>
                                    <p className="text-white/90 font-medium">{data.telefono}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
                {/* Objetivo */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]"
                >
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl bg-white/[0.08] ${objetivoInfo.color}`}>
                            <objetivoInfo.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Tu objetivo</p>
                            <p className="text-white/90 font-semibold text-lg">{objetivoInfo.title}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Experiencia */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]"
                >
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl bg-white/[0.08] ${experienciaInfo.color}`}>
                            <experienciaInfo.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Tu nivel</p>
                            <p className="text-white/90 font-semibold text-lg">{experienciaInfo.title}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Biometría */}
                {(data.altura || data.peso) && (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]"
                    >
                        <div className="space-y-4">
                            <p className="text-white/90 font-semibold flex items-center text-lg">
                                <FaDumbbell className="w-5 h-5 mr-3 text-cyan-400" />
                                Datos físicos
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {data.altura && (
                                    <div className="space-y-1">
                                        <span className="text-white/50 text-xs uppercase tracking-wide">Altura</span>
                                        <p className="text-white/90 font-medium">{data.altura} cm</p>
                                    </div>
                                )}
                                {data.peso && (
                                    <div className="space-y-1">
                                        <span className="text-white/50 text-xs uppercase tracking-wide">Peso</span>
                                        <p className="text-white/90 font-medium">{data.peso} kg</p>
                                    </div>
                                )}
                                {data.porcentaje_grasa && (
                                    <div className="space-y-1">
                                        <span className="text-white/50 text-xs uppercase tracking-wide">Grasa corporal</span>
                                        <p className="text-white/90 font-medium">{data.porcentaje_grasa}%</p>
                                    </div>
                                )}
                                {data.cintura_cm && (
                                    <div className="space-y-1">
                                        <span className="text-white/50 text-xs uppercase tracking-wide">Cintura</span>
                                        <p className="text-white/90 font-medium">{data.cintura_cm} cm</p>
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
                    transition={{ delay: 0.7 }}
                    className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]"
                >
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl bg-white/[0.08] ${preferenciaInfo.color}`}>
                            <preferenciaInfo.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Tu preferencia</p>
                            <p className="text-white/90 font-semibold text-lg">{preferenciaInfo.title}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

     
        </div>
    );
};

export default ResumenStep;
