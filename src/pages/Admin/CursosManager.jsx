import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter,
  Edit3,
  Trash2,
  Eye,
  Users,
  Star,
  TrendingUp,
  Book,
  Play,
  Settings,
  MoreVertical,
  Calendar,
  DollarSign
} from 'lucide-react';

const CursosManager = () => {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [stats, setStats] = useState({
    totalCursos: 0,
    cursosPublicados: 0,
    totalEstudiantes: 0,
    ingresosTotales: 0
  });

  useEffect(() => {
    fetchCursos();
    fetchStats();
  }, []);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vista_cursos_completa')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setCursos(data || []);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      toast.error('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Estadísticas básicas
      const { data: cursosData } = await supabase
        .from('cursos')
        .select('id, estado, total_estudiantes, precio')
        .neq('estado', 'archivado');

      if (cursosData) {
        const totalCursos = cursosData.length;
        const cursosPublicados = cursosData.filter(c => c.estado === 'publicado').length;
        const totalEstudiantes = cursosData.reduce((sum, c) => sum + (c.total_estudiantes || 0), 0);
        
        // Calcular ingresos aproximados (esto sería más preciso con tabla de pagos)
        const ingresosTotales = cursosData.reduce((sum, c) => 
          sum + ((c.total_estudiantes || 0) * (c.precio || 0)), 0
        );

        setStats({
          totalCursos,
          cursosPublicados,
          totalEstudiantes,
          ingresosTotales
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const cursosFiltrados = cursos.filter(curso => {
    const matchSearch = curso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       curso.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = filtroCategoria === 'todos' || curso.categoria === filtroCategoria;
    const matchEstado = filtroEstado === 'todos' || curso.estado === filtroEstado;
    
    return matchSearch && matchCategoria && matchEstado;
  });

  const handleDeleteCurso = async (cursoId) => {
    try {
      const { error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', cursoId);

      if (error) throw error;
      
      toast.success('Curso eliminado correctamente');
      fetchCursos();
      fetchStats();
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error al eliminar curso:', error);
      toast.error('Error al eliminar el curso');
    }
  };

  const toggleEstadoCurso = async (cursoId, estadoActual) => {
    const nuevoEstado = estadoActual === 'publicado' ? 'borrador' : 'publicado';
    
    try {
      const { error } = await supabase
        .from('cursos')
        .update({ 
          estado: nuevoEstado,
          fecha_publicacion: nuevoEstado === 'publicado' ? new Date().toISOString() : null
        })
        .eq('id', cursoId);

      if (error) throw error;
      
      toast.success(`Curso ${nuevoEstado === 'publicado' ? 'publicado' : 'despublicado'} correctamente`);
      fetchCursos();
      fetchStats();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar el estado del curso');
    }
  };

  const StatCard = ({ icon: Icon, label, value, color = "purple" }) => (
    <motion.div 
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
    </motion.div>
  );

  const CursoCard = ({ curso }) => (
    <motion.div
      layout
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300"
      whileHover={{ y: -2 }}
    >
      {/* Header con imagen */}
      <div className="relative h-48 bg-gradient-to-br from-purple-600 to-black-600">
        {curso.imagen_portada ? (
          <img 
            src={curso.imagen_portada} 
            alt={curso.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book className="w-16 h-16 text-white/50" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {curso.popular && (
            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
              POPULAR
            </span>
          )}
          {curso.nuevo && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              NUEVO
            </span>
          )}
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            curso.estado === 'publicado' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            curso.estado === 'borrador' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
            'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {curso.estado.toUpperCase()}
          </span>
        </div>

        {/* Menú de acciones */}
        <div className="absolute top-3 right-3">
          <div className="relative group">
            <button className="p-2 bg-black/30 hover:bg-black/50 rounded-lg backdrop-blur-sm transition-colors">
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-2">
                <button 
                  onClick={() => toggleEstadoCurso(curso.id, curso.estado)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {curso.estado === 'publicado' ? 'Despublicar' : 'Publicar'}
                </button>
                <button 
                  onClick={() => navigate(`/admin/cursos/editar/${curso.id}`)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button 
                  onClick={() => navigate(`/admin/cursos/asignar/${curso.id}`)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Asignar Alumnos
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurar
                </button>
                <hr className="my-1 border-gray-700" />
                <button 
                  onClick={() => setShowDeleteModal(curso.id)}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-white line-clamp-1">{curso.titulo}</h3>
          <div className="text-right">
            <div className="text-xl font-bold text-purple-400">
              ${curso.precio}
            </div>
            {curso.precio_original && curso.precio_original > curso.precio && (
              <div className="text-sm text-gray-400 line-through">
                ${curso.precio_original}
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {curso.descripcion || 'Sin descripción'}
        </p>

        {/* Stats del curso */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{curso.total_estudiantes || 0} estudiantes</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Star className="w-4 h-4 text-yellow-400" />
            <span>{curso.rating_promedio || 0} ({curso.total_ratings || 0})</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Book className="w-4 h-4" />
            <span>{curso.total_lecciones || 0} lecciones</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Play className="w-4 h-4" />
            <span>{curso.total_modulos || 0} módulos</span>
          </div>
        </div>

        {/* Categoría y nivel */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
            {curso.categoria}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            curso.nivel === 'principiante' ? 'bg-green-500/20 text-green-400' :
            curso.nivel === 'intermedio' ? 'bg-yellow-500/20 text-yellow-400' :
            curso.nivel === 'avanzado' ? 'bg-red-500/20 text-red-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {curso.nivel}
          </span>
        </div>

        {/* Fecha de creación */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Calendar className="w-3 h-3" />
          <span>Creado: {new Date(curso.fecha_creacion).toLocaleDateString()}</span>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/admin/cursos/editar/${curso.id}`)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </button>
          <button className="px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg transition-colors">
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen to-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Gestión de Cursos</h1>
        <p className="text-gray-400">Administra todos tus cursos desde aquí</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={Book} 
          label="Total Cursos" 
          value={stats.totalCursos} 
          color="purple" 
        />
        <StatCard 
          icon={Eye} 
          label="Cursos Publicados" 
          value={stats.cursosPublicados} 
          color="green" 
        />
        <StatCard 
          icon={Users} 
          label="Total Estudiantes" 
          value={stats.totalEstudiantes} 
          color="blue" 
        />
        <StatCard 
          icon={DollarSign} 
          label="Ingresos Estimados" 
          value={`$${stats.ingresosTotales.toLocaleString()}`} 
          color="yellow" 
        />
      </div>

      {/* Filtros y acciones */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-700/50">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-gray-900/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
            >
              <option value="todos">Todas las categorías</option>
              <option value="transformacion">Transformación</option>
              <option value="cardio">Cardio</option>
              <option value="fuerza">Fuerza</option>
              <option value="bienestar">Bienestar</option>
              <option value="nutricion">Nutrición</option>
              <option value="movilidad">Movilidad</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-gray-900/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="publicado">Publicado</option>
              <option value="archivado">Archivado</option>
            </select>
          </div>

          {/* Botón crear curso */}
          <motion.button
            onClick={() => navigate('/admin/cursos/crear')}
            className="text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-purple-500/25"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            Crear Curso
          </motion.button>
        </div>
      </div>

      {/* Grid de cursos */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            // Loading skeletons
            [...Array(6)].map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                className="bg-gray-800/30 rounded-xl overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="h-48 bg-gray-700/50 animate-pulse" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-700/50 rounded animate-pulse" />
                  <div className="h-3 bg-gray-700/30 rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-3 bg-gray-700/30 rounded animate-pulse" />
                    <div className="h-3 bg-gray-700/30 rounded animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : cursosFiltrados.length > 0 ? (
            cursosFiltrados.map((curso) => (
              <CursoCard key={curso.id} curso={curso} />
            ))
          ) : (
            <motion.div 
              className="col-span-full text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No se encontraron cursos</p>
              <p className="text-gray-500">Intenta ajustar los filtros o crea tu primer curso</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal de confirmación para eliminar */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">¿Eliminar curso?</h3>
              <p className="text-gray-400 mb-6">
                Esta acción no se puede deshacer. Se eliminarán todos los módulos, lecciones y datos relacionados.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteCurso(showDeleteModal)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CursosManager;
