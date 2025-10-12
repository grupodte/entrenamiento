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
import { FaUserCircle } from 'react-icons/fa';

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
      className="bg-[#121212] py-4 min-h-[440px] min-w-[363px] rounded-[10px] overflow-hidden flex flex-col justify-center items-center  cursor-pointer p-2"
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/curso/${curso.id}`)}
    >
      <div className="relative h-[206px] w-[321px] ">
        {curso.imagen_portada ? (
          <img 
            src={curso.imagen_portada} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-white/50" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <motion.div
            className="bg-white/20 backdrop-blur-sm rounded-full p-2 md:p-3"
            whileHover={{ scale: 1.1 }}
          >
            <Play className="w-6 h-6 md:w-7 md:h-7 text-white fill-current" />
          </motion.div>
        </div>

        
      </div>

      <div className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-[27px] text-[#B5B5B5] leading-none">
            {curso.titulo}
          </h3>
        
        </div>

    

        <p className="text-[#B5B5B5] text-[13px] leading-none md:text-sm mb-3 md:mb-4 ">
          {curso.descripcion || 'Sin descripción disponible'}
        </p>

        <motion.button
          className="w-full  text-[23px]  font-bold  py-2.5 flex items-center justify-center gap-2  text-[#F84B4B]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Ver Curso
          <PlayCircle className="w-[24px] h-[24px]" />

        </motion.button>
      </div>
    </motion.div>
  );


  return (
    <div className="min-h-screen mt-8 p-3 sm:p-4 md:p-6 transition-all flex flex-col duration-300">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          // Mostrar un loader simple mientras carga
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F84B4B]"></div>
          </div>
        ) : (
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
                <section className="col-span-full flex items-center justify-center mt-20">
                    <div className="rounded-2xl p-6 bg-[#121212] text-center">
                        <div className="mb-4">
                            <FaUserCircle className="text-4xl text-[#FF0000] mx-auto mb-2" />
                        </div>
                        <h3 className="text-[18px] font-semibold text-white mb-2">
                            Aún no tienes cursos asignados
                        </h3>
                        <p className="text-[14px] text-[#B5B5B5]">
                            Pronto un entrenador te asignará uno
                        </p>
                    </div>
                </section>
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
        )}
      </div>
    </div>
  );
};

export default MisCursos;
