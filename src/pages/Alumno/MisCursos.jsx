import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  BookOpen,
  Clock,
  CheckCircle,
  Star,
  Calendar,
  Search,
  PlayCircle,
  ArrowRight,
  User,
  Trophy,
  TrendingUp
} from 'lucide-react';

const MisCursos = () => {
  const { user, rol } = useAuth();
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      // Solo permitir acceso a usuarios con rol de alumno o admin
      if (rol !== 'alumno' && rol !== 'admin') {
        navigate('/dashboard');
        return;
      }
      fetchMisCursos();
    }
  }, [user, rol, navigate]);

  const fetchMisCursos = async () => {
    try {
      setLoading(true);
      
      // Obtener cursos con acceso activo
      const { data: accesosData, error } = await supabase
        .from('acceso_cursos')
        .select(`
          *,
          curso:cursos (*)
        `)
        .eq('usuario_id', user.id)
        .eq('activo', true);

      if (error) throw error;

      setCursos(accesosData || []);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cursosFiltrados = cursos.filter(({ curso }) => {
    return curso.titulo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const CursoCard = ({ acceso, curso }) => (
    <motion.div
      className="bg-gray-800/50 backdrop-blur-sm rounded-lg md:rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/curso/${curso.id}`)}
    >
      <div className="relative h-32 md:h-40">
        {curso.imagen_portada ? (
          <img 
            src={curso.imagen_portada} 
            alt={curso.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-white/50" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <motion.div
            className="bg-white/20 backdrop-blur-sm rounded-full p-2 md:p-3"
            whileHover={{ scale: 1.1 }}
          >
            <Play className="w-6 h-6 md:w-7 md:h-7 text-white fill-current" />
          </motion.div>
        </div>

        <div className="absolute top-2 left-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            acceso.tipo_acceso === 'comprado' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {acceso.tipo_acceso === 'comprado' ? 'Comprado' : 'Regalo'}
          </div>
        </div>
      </div>

      <div className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base md:text-lg font-bold text-white line-clamp-2 flex-1">
            {curso.titulo}
          </h3>
          <div className="flex items-center gap-1 ml-2">
            <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
            <span className="text-xs md:text-sm text-gray-400">{curso.rating_promedio || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2 md:mb-3">
          <User className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
          <span className="text-xs md:text-sm text-gray-400 truncate">{curso.instructor}</span>
          <span className="text-gray-600">•</span>
          <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">
            {curso.categoria}
          </span>
        </div>

        <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
          {curso.descripcion || 'Sin descripción disponible'}
        </p>

        <motion.button
          className="w-full hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 md:py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlayCircle className="w-4 h-4 md:w-5 md:h-5" />
          Ver Curso
          <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
        </motion.button>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 md:mb-6">
            <div className="h-6 md:h-8 bg-gray-700/50 rounded w-48 md:w-64 mb-1 md:mb-2 animate-pulse" />
            <div className="h-3 md:h-4 bg-gray-700/30 rounded w-64 md:w-96 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-lg md:rounded-xl overflow-hidden">
                <div className="h-32 md:h-40 bg-gray-700/50 animate-pulse" />
                <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                  <div className="h-3 md:h-4 bg-gray-700/50 rounded animate-pulse" />
                  <div className="h-2 md:h-3 bg-gray-700/30 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">




        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          <AnimatePresence>
            {cursosFiltrados.length > 0 ? (
              cursosFiltrados.map((acceso) => (
                <CursoCard 
                  key={acceso.id}
                  acceso={acceso}
                  curso={acceso.curso}
                />
              ))
            ) : cursos.length === 0 ? (
              <motion.div 
                className="col-span-full text-center py-8 md:py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-3 md:mb-4" />
                <p className="text-gray-400 text-base md:text-lg mb-1 md:mb-2">No tienes cursos disponibles</p>
                <p className="text-gray-500 mb-4 md:mb-6 text-sm md:text-base px-4">Explora nuestro catálogo y encuentra el curso perfecto para ti</p>
                <motion.button
                  onClick={() => navigate('/cursos')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all duration-300 flex items-center gap-2 mx-auto text-sm md:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Ver Catálogo <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                className="col-span-full text-center py-8 md:py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Search className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-3 md:mb-4" />
                <p className="text-gray-400 text-base md:text-lg mb-1 md:mb-2">No se encontraron cursos</p>
                <p className="text-gray-500 text-sm md:text-base">Intenta ajustar la búsqueda</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default MisCursos;
