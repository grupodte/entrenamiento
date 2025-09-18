import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
    FaEdit, FaUserCircle, FaBullseye, FaChartLine, FaExclamationTriangle, 
    FaWeight, FaRuler, FaFire, FaTrophy, FaDumbbell, FaCalendarCheck 
} from 'react-icons/fa';
import Drawer from '../../components/Drawer';
import DrawerLoader from '../../components/DrawerLoader';

const PerfilDrawer = ({ isOpen, onClose, onEdit }) => {
    const { user } = useAuth();

    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rutinasCompletadas, setRutinasCompletadas] = useState(0);
    const [rutinaActual, setRutinaActual] = useState(null);

    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchPerfil = async () => {
            setLoading(true);
            setError('');
            
            try {
                // Cargar perfil
                const { data: perfilData, error: perfilErr } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (perfilErr) throw perfilErr;
                
                // Cargar rutinas completadas
                const { count } = await supabase
                    .from('sesiones_entrenamiento')
                    .select('*', { count: 'exact', head: true })
                    .eq('usuario_id', user.id)
                    .eq('completada', true);
                
                // Cargar rutina actual asignada
                const { data: rutinaData } = await supabase
                    .from('rutinas_asignadas')
                    .select('rutina_real:rutina_real_id(nombre)')
                    .eq('alumno_id', user.id)
                    .eq('activa', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                setPerfil(perfilData);
                setRutinasCompletadas(count || 0);
                setRutinaActual(rutinaData?.rutina_real?.nombre || null);
                
            } catch (err) {
                console.error('Error al cargar datos:', err);
                setError('No se pudo cargar el perfil.');
            } finally {
                setLoading(false);
            }
        };
        fetchPerfil();
    }, [isOpen, user]);

    // Función para calcular IMC
    const calculateIMC = (peso, altura) => {
        if (!peso || !altura) return null;
        const pesoNum = parseFloat(peso);
        const alturaCm = parseFloat(altura);
        if (isNaN(pesoNum) || isNaN(alturaCm) || alturaCm <= 0) return null;
        const alturaM = alturaCm / 100;
        return (pesoNum / (alturaM * alturaM)).toFixed(1);
    };

    // Función para obtener categoría de IMC
    const getIMCCategory = (imc) => {
        if (!imc) return null;
        const imcNum = parseFloat(imc);
        if (imcNum < 18.5) return { text: 'Bajo peso', color: 'text-blue-400' };
        if (imcNum < 25) return { text: 'Normal', color: 'text-green-400' };
        if (imcNum < 30) return { text: 'Sobrepeso', color: 'text-yellow-400' };
        return { text: 'Obesidad', color: 'text-red-400' };
    };

    // Abrir drawer de editar perfil
    const handleEditProfile = () => {
        if (onEdit) {
            onEdit();
        }
    };

    // Componente para métricas fitness
    const MetricCard = ({ icon, label, value, subValue, colorClass = "text-cyan-400" }) => {
        if (value === null || value === undefined || value === '') return null;
        return (
            <div className="bg-gray-700/50 rounded-lg p-3 flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gray-600/50`}>
                    <span className={`${colorClass} text-lg`}>{icon}</span>
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-400">{label}</p>
                    <p className="text-lg font-semibold text-white">{value}</p>
                    {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
                </div>
            </div>
        );
    };

    // Componente para progreso
    const ProgressCard = ({ label, current, target, unit = "kg", icon }) => {
        if (!current && !target) return null;
        const progress = target ? Math.min((current / target) * 100, 100) : 0;
        
        return (
            <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-purple-400">{icon}</span>
                        <span className="text-sm text-gray-400">{label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                    <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-white font-medium">{current || 0} {unit}</span>
                    <span className="text-gray-400">Meta: {target || 0} {unit}</span>
                </div>
            </div>
        );
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            {loading ? (
                <DrawerLoader />
            ) : error ? (
                <div className="bg-gray-800 text-white font-sans p-4">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-white">Error</h1>
                        <p className="text-sm text-gray-400">Problema al cargar el perfil</p>
                    </div>
                    <div className="text-center p-6 bg-red-900/50 rounded-lg">
                        <FaExclamationTriangle className="mx-auto mb-3 text-3xl text-red-400" />
                        <p className="text-red-300 mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            ) : !perfil ? (
                <div className="bg-gray-800 text-white font-sans p-4">
                    <div className="mb-4">
                        <p className="text-sm text-gray-400">Perfil no encontrado</p>
                    </div>
                    <div className="text-center p-6 bg-gray-700 rounded-lg">
                        <FaUserCircle className="mx-auto mb-3 text-6xl text-gray-400" />
                        <p className="text-gray-300 mb-4">No se encontró información de perfil.</p>
                        <button 
                            onClick={handleEditProfile}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Crear Perfil
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-900 text-white font-sans min-h-full">
                    {/* Header con avatar centrado */}
                    <div className="relative pb-4">
                        {/* Botón editar */}
                        <button
                            onClick={handleEditProfile}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-700/80 hover:bg-gray-600 transition-all duration-200 shadow-lg"
                        >
                            <FaEdit className="text-cyan-400 text-sm" />
                        </button>

                        {/* Avatar centrado */}
                        <div className="flex flex-col items-center pt-8 pb-2">
                            {perfil.avatar_url ? (
                                <img 
                                    src={perfil.avatar_url} 
                                    alt="Avatar" 
                                    className="w-20 h-20 rounded-full object-cover border-3 border-cyan-500 shadow-xl" 
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center border-3 border-gray-600">
                                    <FaUserCircle className="text-4xl text-gray-400" />
                                </div>
                            )}
                            
                            {/* Nombre discreto */}
                            <h2 className="text-lg font-medium text-gray-300 mt-2 mb-1">
                                {perfil.nombre} {perfil.apellido}
                            </h2>
                        </div>
                    </div>

                    <div className="px-4 pb-4 space-y-4">
                        {/* Objetivo Principal */}
                        {perfil.objetivo && (
                            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                                        <FaBullseye className="text-cyan-400 text-lg" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-cyan-300 font-medium">Objetivo:</p>
                                        <p className="text-white font-semibold">{perfil.objetivo}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progreso de Peso */}
                        {(perfil.peso_kg || perfil.meta_peso) && (
                            <ProgressCard 
                                label="Progreso de Peso"
                                current={perfil.peso_kg}
                                target={perfil.meta_peso}
                                unit="kg"
                                icon={<FaTrophy />}
                            />
                        )}

                        {/* Métricas Físicas */}
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard 
                                icon={<FaWeight />}
                                label="Peso Actual"
                                value={perfil.peso_kg ? `${perfil.peso_kg} kg` : null}
                                colorClass="text-blue-400"
                            />
                            <MetricCard 
                                icon={<FaRuler />}
                                label="Altura"
                                value={perfil.altura_cm ? `${perfil.altura_cm} cm` : null}
                                colorClass="text-green-400"
                            />
                        </div>

                        {/* IMC */}
                        {(() => {
                            const imc = calculateIMC(perfil.peso_kg, perfil.altura_cm);
                            const categoria = getIMCCategory(imc);
                            return imc ? (
                                <MetricCard 
                                    icon={<FaChartLine />}
                                    label="Índice de Masa Corporal"
                                    value={imc}
                                    subValue={categoria?.text}
                                    colorClass={categoria?.color || "text-cyan-400"}
                                />
                            ) : null;
                        })()}

                        {/* Nivel y Experiencia */}
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard 
                                icon={<FaChartLine />}
                                label="Experiencia"
                                value={perfil.experiencia}
                                colorClass="text-orange-400"
                            />
                            <MetricCard 
                                icon={<FaFire />}
                                label="% Grasa"
                                value={perfil.grasa_pct ? `${perfil.grasa_pct}%` : null}
                                colorClass="text-red-400"
                            />
                        </div>

                        {/* Rutina Actual y Entrenamientos */}
                        <div className="space-y-3">
                            {rutinaActual && (
                                <MetricCard 
                                    icon={<FaDumbbell />}
                                    label="Rutina Actual"
                                    value={rutinaActual}
                                    colorClass="text-purple-400"
                                />
                            )}
                            
                            {rutinasCompletadas > 0 ? (
                                <MetricCard 
                                    icon={<FaCalendarCheck />}
                                    label="Entrenamientos Completados"
                                    value={`${rutinasCompletadas} sesiones`}
                                    colorClass="text-green-400"
                                />
                            ) : (
                                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                                    <FaCalendarCheck className="text-yellow-400 text-2xl mx-auto mb-2" />
                                    <p className="text-sm text-yellow-300 font-medium">¡Comienza tu primer entrenamiento!</p>
                                    <p className="text-xs text-gray-400 mt-1">Tus sesiones aparecerán aquí</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default PerfilDrawer;
