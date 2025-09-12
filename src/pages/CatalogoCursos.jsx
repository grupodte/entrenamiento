import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Star, 
  Clock, 
  Users, 
  Trophy, 
  Filter,
  Search,
  ChevronDown,
  ArrowLeft,
  PlayCircle,
  Lock,
  CheckCircle
} from 'lucide-react';

const CatalogoCursos = () => {
  const [cursos, setCursos] = useState([]);
  const [filtroSeleccionado, setFiltroSeleccionado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const navigate = useNavigate();

  // Mock data - En producción esto vendría de Supabase
  const cursosData = [
    {
      id: 1,
      titulo: "Transformación Total 12 Semanas",
      instructor: "Michele Ris",
      precio: 97,
      precioOriginal: 197,
      descripcion: "Programa completo para perder grasa y ganar músculo magro",
      duracion: "12 semanas",
      nivel: "Intermedio",
      estudiantes: 2847,
      rating: 4.9,
      totalRatings: 423,
      categoria: "transformacion",
      imagen: "/cursos/transformacion-total.jpg",
      video_preview: "/previews/transformacion-preview.mp4",
      caracteristicas: [
        "12 semanas de entrenamiento progresivo",
        "Plan nutricional personalizable",
        "Videos HD de cada ejercicio",
        "Acceso a comunidad privada",
        "Soporte directo con Michele"
      ],
      modulos: [
        { titulo: "Fundamentos", lecciones: 8, duracion: "2h 30min" },
        { titulo: "Fuerza Base", lecciones: 12, duracion: "4h 15min" },
        { titulo: "Hipertrofia", lecciones: 15, duracion: "5h 45min" },
        { titulo: "Definición", lecciones: 10, duracion: "3h 20min" }
      ],
      popular: true,
      nuevo: false
    },
    {
      id: 2,
      titulo: "HIIT Extremo - Quema Grasa",
      instructor: "Michele Ris",
      precio: 47,
      precioOriginal: 97,
      descripcion: "Entrenamientos HIIT intensos para máxima quema de calorías",
      duracion: "6 semanas",
      nivel: "Avanzado",
      estudiantes: 1654,
      rating: 4.8,
      totalRatings: 289,
      categoria: "cardio",
      imagen: "/cursos/hiit-extremo.jpg",
      video_preview: "/previews/hiit-preview.mp4",
      caracteristicas: [
        "30 entrenamientos HIIT únicos",
        "15-25 minutos por sesión",
        "Sin equipamiento necesario",
        "Plan de comidas incluido",
        "Tracker de progreso"
      ],
      modulos: [
        { titulo: "HIIT Básico", lecciones: 10, duracion: "3h 00min" },
        { titulo: "HIIT Intermedio", lecciones: 12, duracion: "4h 00min" },
        { titulo: "HIIT Avanzado", lecciones: 8, duracion: "3h 30min" }
      ],
      popular: false,
      nuevo: true
    },
    {
      id: 3,
      titulo: "Fuerza Funcional en Casa",
      instructor: "Michele Ris",
      precio: 67,
      precioOriginal: 127,
      descripcion: "Desarrolla fuerza real con ejercicios funcionales sin gimnasio",
      duracion: "8 semanas",
      nivel: "Principiante",
      estudiantes: 934,
      rating: 4.7,
      totalRatings: 156,
      categoria: "fuerza",
      imagen: "/cursos/fuerza-funcional.jpg",
      video_preview: "/previews/fuerza-preview.mp4",
      caracteristicas: [
        "100% entrenamientos en casa",
        "Equipamiento mínimo requerido",
        "Progresiones para todos los niveles",
        "Videos técnica perfecta",
        "Calendario de entrenamiento"
      ],
      modulos: [
        { titulo: "Movilidad y Base", lecciones: 6, duracion: "2h 15min" },
        { titulo: "Fuerza Básica", lecciones: 10, duracion: "3h 45min" },
        { titulo: "Combinaciones", lecciones: 8, duracion: "3h 00min" }
      ],
      popular: false,
      nuevo: false
    },
    {
      id: 4,
      titulo: "Yoga Flow & Flexibilidad",
      instructor: "Michele Ris",
      precio: 37,
      precioOriginal: 77,
      descripcion: "Mejora tu flexibilidad y encuentra equilibrio interior",
      duracion: "4 semanas",
      nivel: "Todos",
      estudiantes: 567,
      rating: 4.9,
      totalRatings: 89,
      categoria: "bienestar",
      imagen: "/cursos/yoga-flow.jpg",
      video_preview: "/previews/yoga-preview.mp4",
      caracteristicas: [
        "Rutinas de 20-45 minutos",
        "Para todos los niveles",
        "Meditaciones guiadas",
        "Secuencias de relajación",
        "Audio de alta calidad"
      ],
      modulos: [
        { titulo: "Fundamentos Yoga", lecciones: 8, duracion: "2h 30min" },
        { titulo: "Flow Dinámico", lecciones: 6, duracion: "2h 15min" },
        { titulo: "Relajación Profunda", lecciones: 4, duracion: "1h 30min" }
      ],
      popular: false,
      nuevo: false
    }
  ];

  const categorias = [
    { id: 'todos', nombre: 'Todos los Cursos', count: cursosData.length },
    { id: 'transformacion', nombre: 'Transformación', count: cursosData.filter(c => c.categoria === 'transformacion').length },
    { id: 'cardio', nombre: 'Cardio & HIIT', count: cursosData.filter(c => c.categoria === 'cardio').length },
    { id: 'fuerza', nombre: 'Fuerza', count: cursosData.filter(c => c.categoria === 'fuerza').length },
    { id: 'bienestar', nombre: 'Bienestar', count: cursosData.filter(c => c.categoria === 'bienestar').length }
  ];

  useEffect(() => {
    setCursos(cursosData);
  }, []);

  const cursosFiltrados = cursos.filter(curso => {
    const matchBusqueda = curso.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                         curso.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = filtroSeleccionado === 'todos' || curso.categoria === filtroSeleccionado;
    return matchBusqueda && matchCategoria;
  });

  const CursoCard = ({ curso }) => (
    <motion.div
      layout
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-gray-700/50 transition-all duration-300 group cursor-pointer"
      whileHover={{ scale: 1.02 }}
      onClick={() => setCursoSeleccionado(curso)}
    >
      {/* Imagen y badges */}
      <div className="relative aspect-video overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <PlayCircle className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
        </div>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {curso.popular && (
            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
              MÁS POPULAR
            </span>
          )}
          {curso.nuevo && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              NUEVO
            </span>
          )}
        </div>

        {/* Preview button */}
        <button className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100"
            whileHover={{ scale: 1.1 }}
          >
            <Play className="w-8 h-8 text-white" />
          </motion.div>
        </button>
      </div>

      {/* Contenido */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
            {curso.titulo}
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">
              ${curso.precio}
            </div>
            {curso.precioOriginal && (
              <div className="text-sm text-gray-400 line-through">
                ${curso.precioOriginal}
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {curso.descripcion}
        </p>

        {/* Rating y stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-white font-medium">{curso.rating}</span>
            <span>({curso.totalRatings})</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{curso.estudiantes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{curso.duracion}</span>
          </div>
        </div>

        {/* Nivel */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            curso.nivel === 'Principiante' ? 'bg-green-500/20 text-green-400' :
            curso.nivel === 'Intermedio' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {curso.nivel}
          </span>
          
          <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
            Ver detalles →
          </button>
        </div>
      </div>
    </motion.div>
  );

  const CursoModal = ({ curso, onClose }) => (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <PlayCircle className="w-24 h-24 text-white hover:scale-110 transition-transform cursor-pointer" />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
          >
            ×
          </button>
          
          {/* Badges en modal */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {curso.popular && (
              <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                MÁS POPULAR
              </span>
            )}
            {curso.nuevo && (
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                NUEVO
              </span>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* Título y precio */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{curso.titulo}</h2>
              <p className="text-gray-400 text-lg">{curso.descripcion}</p>
            </div>
            <div className="text-right mt-4 md:mt-0">
              <div className="text-4xl font-bold text-purple-400 mb-1">
                ${curso.precio}
              </div>
              {curso.precioOriginal && (
                <div className="text-lg text-gray-400 line-through">
                  ${curso.precioOriginal}
                </div>
              )}
              <div className="text-sm text-green-400 font-medium">
                {Math.round(((curso.precioOriginal - curso.precio) / curso.precioOriginal) * 100)}% DESC
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mb-8 text-gray-300">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="font-medium">{curso.rating}</span>
              <span className="text-gray-400">({curso.totalRatings} reseñas)</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{curso.estudiantes.toLocaleString()} estudiantes</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{curso.duracion}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <span>Nivel {curso.nivel}</span>
            </div>
          </div>

          {/* Características */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">¿Qué incluye este curso?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {curso.caracteristicas.map((caracteristica, index) => (
                <div key={index} className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>{caracteristica}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Módulos */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Contenido del curso</h3>
            <div className="space-y-3">
              {curso.modulos.map((modulo, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">{modulo.titulo}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{modulo.lecciones} lecciones</span>
                      <span>{modulo.duracion}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/register')}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Comprar Ahora - ${curso.precio}
            </button>
            <button className="flex-1 border-2 border-purple-400 hover:bg-purple-400/10 text-purple-400 font-bold py-4 px-8 rounded-full transition-all duration-300">
              Vista Previa Gratis
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/90 backdrop-blur-sm z-40 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
              <h1 className="text-2xl md:text-3xl font-bold">Catálogo de Cursos</h1>
            </div>
            <div className="text-sm text-gray-400">
              {cursosFiltrados.length} curso{cursosFiltrados.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Búsqueda y filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Filtro de categorías */}
            <div className="relative">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-full py-3 px-6 text-white hover:border-purple-400 transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>{categorias.find(c => c.id === filtroSeleccionado)?.nombre}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {mostrarFiltros && (
                  <motion.div
                    className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 min-w-48"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {categorias.map((categoria) => (
                      <button
                        key={categoria.id}
                        onClick={() => {
                          setFiltroSeleccionado(categoria.id);
                          setMostrarFiltros(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center justify-between ${
                          filtroSeleccionado === categoria.id ? 'text-purple-400 bg-purple-400/10' : 'text-gray-300'
                        }`}
                      >
                        <span>{categoria.nombre}</span>
                        <span className="text-sm text-gray-400">({categoria.count})</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de cursos */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {cursosFiltrados.map((curso) => (
              <CursoCard key={curso.id} curso={curso} />
            ))}
          </AnimatePresence>
        </motion.div>

        {cursosFiltrados.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-gray-400 text-lg mb-4">
              No se encontraron cursos que coincidan con tu búsqueda
            </div>
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroSeleccionado('todos');
              }}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Limpiar filtros
            </button>
          </motion.div>
        )}
      </div>

      {/* Modal de curso */}
      <AnimatePresence>
        {cursoSeleccionado && (
          <CursoModal 
            curso={cursoSeleccionado} 
            onClose={() => setCursoSeleccionado(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CatalogoCursos;
