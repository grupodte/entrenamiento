import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft,
  Search,
  Users,
  Check,
  X,
  Calendar,
  Clock,
  UserPlus,
  BookOpen,
  Star,
  Gift,
  Eye,
  Filter
} from 'lucide-react';

const AsignarCurso = () => {
  const { cursoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [curso, setCurso] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [alumnosConAcceso, setAlumnosConAcceso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumnos, setSelectedAlumnos] = useState([]);
  const [assigningAccess, setAssigningAccess] = useState(false);
  const [tipoAcceso, setTipoAcceso] = useState('regalo');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [showOnlyWithoutAccess, setShowOnlyWithoutAccess] = useState(true);

  useEffect(() => {
    if (cursoId) {
      cargarDatos();
    }
  }, [cursoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar información del curso
      const { data: cursoData, error: cursoError } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', cursoId)
        .single();

      if (cursoError) throw cursoError;
      setCurso(cursoData);

      // Cargar alumnos
      const { data: alumnosData, error: alumnosError } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, email, avatar_url, fecha_creacion, estado')
        .eq('rol', 'alumno')
        .order('nombre');

      if (alumnosError) throw alumnosError;
      setAlumnos(alumnosData || []);

      // Cargar alumnos que ya tienen acceso al curso
      const { data: accesosData, error: accesosError } = await supabase
        .from('acceso_cursos')
        .select(`
          *,
          perfiles!usuario_id(id, nombre, apellido, email)
        `)
        .eq('curso_id', cursoId)
        .eq('activo', true);

      if (accesosError) throw accesosError;
      setAlumnosConAcceso(accesosData || []);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
      navigate('/admin/cursos');
    } finally {
      setLoading(false);
    }
  };

  const alumnosFiltrados = alumnos.filter(alumno => {
    const matchSearch = (
      alumno.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumno.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumno.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showOnlyWithoutAccess) {
      const tieneAcceso = alumnosConAcceso.some(acceso => 
        acceso.usuario_id === alumno.id
      );
      return matchSearch && !tieneAcceso;
    }

    return matchSearch;
  });

  const toggleSelectAlumno = (alumnoId) => {
    setSelectedAlumnos(prev => {
      if (prev.includes(alumnoId)) {
        return prev.filter(id => id !== alumnoId);
      } else {
        return [...prev, alumnoId];
      }
    });
  };

  const selectAllAlumnos = () => {
    if (selectedAlumnos.length === alumnosFiltrados.length) {
      setSelectedAlumnos([]);
    } else {
      setSelectedAlumnos(alumnosFiltrados.map(a => a.id));
    }
  };

  const asignarAcceso = async () => {
    if (selectedAlumnos.length === 0) {
      toast.error('Selecciona al menos un alumno');
      return;
    }

    try {
      setAssigningAccess(true);

      const accesosData = selectedAlumnos.map(alumnoId => ({
        usuario_id: alumnoId,
        curso_id: cursoId,
        tipo_acceso: tipoAcceso,
        fecha_expiracion: fechaExpiracion || null,
        activo: true,
        creado_por: user.id,
        notas: `Asignado manualmente por admin el ${new Date().toLocaleString()}`
      }));

      const { error } = await supabase
        .from('acceso_cursos')
        .insert(accesosData);

      if (error) throw error;

      toast.success(`Acceso asignado a ${selectedAlumnos.length} alumno${selectedAlumnos.length > 1 ? 's' : ''}`);
      
      // Recargar datos
      await cargarDatos();
      setSelectedAlumnos([]);
      setFechaExpiracion('');
    } catch (error) {
      console.error('Error al asignar acceso:', error);
      toast.error('Error al asignar el acceso');
    } finally {
      setAssigningAccess(false);
    }
  };

  const removerAcceso = async (accesoId) => {
    try {
      const { error } = await supabase
        .from('acceso_cursos')
        .delete()
        .eq('id', accesoId);

      if (error) throw error;

      toast.success('Acceso removido correctamente');
      await cargarDatos();
    } catch (error) {
      console.error('Error al remover acceso:', error);
      toast.error('Error al remover el acceso');
    }
  };

  const AlumnoCard = ({ alumno, tieneAcceso, accesoInfo }) => (
    <motion.div
      className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border transition-all duration-300 ${
        selectedAlumnos.includes(alumno.id) 
          ? 'border-purple-500/50 bg-purple-500/10' 
          : 'border-gray-700/50 hover:border-gray-600/50'
      }`}
      layout
    >
      <div className="flex items-center gap-3">
        {!tieneAcceso && (
          <button
            type="button"
            onClick={() => toggleSelectAlumno(alumno.id)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selectedAlumnos.includes(alumno.id)
                ? 'border-purple-500 bg-purple-500'
                : 'border-gray-600 hover:border-purple-400'
            }`}
          >
            {selectedAlumnos.includes(alumno.id) && (
              <Check className="w-3 h-3 text-white" />
            )}
          </button>
        )}

        <div className="flex-1 flex items-center gap-3">
          {alumno.avatar_url ? (
            <img 
              src={alumno.avatar_url} 
              alt={alumno.nombre}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-400" />
            </div>
          )}

          <div className="flex-1">
            <h3 className="text-white font-medium">
              {alumno.nombre} {alumno.apellido}
            </h3>
            <p className="text-gray-400 text-sm">{alumno.email}</p>
            {tieneAcceso && accesoInfo && (
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  accesoInfo.tipo_acceso === 'comprado' ? 'bg-blue-500/20 text-blue-400' :
                  accesoInfo.tipo_acceso === 'regalo' ? 'bg-green-500/20 text-green-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {accesoInfo.tipo_acceso === 'comprado' ? 'Comprado' :
                   accesoInfo.tipo_acceso === 'regalo' ? 'Regalo' :
                   accesoInfo.tipo_acceso}
                </span>
                {accesoInfo.fecha_expiracion && (
                  <span className="text-xs text-gray-400">
                    Expira: {new Date(accesoInfo.fecha_expiracion).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {tieneAcceso ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm">Con acceso</span>
              </div>
              <button
                onClick={() => removerAcceso(accesoInfo.id)}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Sin acceso</div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/cursos')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">Asignar Acceso al Curso</h1>
            {curso && (
              <p className="text-gray-400 mt-1">
                <BookOpen className="w-4 h-4 inline mr-1" />
                {curso.titulo}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de alumnos */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              {/* Controles de búsqueda y filtros */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar alumnos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowOnlyWithoutAccess(!showOnlyWithoutAccess)}
                    className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                      showOnlyWithoutAccess
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Solo sin acceso
                  </button>

                  <button
                    onClick={selectAllAlumnos}
                    disabled={alumnosFiltrados.length === 0}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedAlumnos.length === alumnosFiltrados.length ? 'Deseleccionar' : 'Seleccionar'} todos
                  </button>
                </div>
              </div>

              {/* Lista de alumnos */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {alumnosFiltrados.map((alumno) => {
                    const accesoInfo = alumnosConAcceso.find(acceso => 
                      acceso.usuario_id === alumno.id
                    );
                    const tieneAcceso = !!accesoInfo;

                    return (
                      <AlumnoCard 
                        key={alumno.id}
                        alumno={alumno}
                        tieneAcceso={tieneAcceso}
                        accesoInfo={accesoInfo}
                      />
                    );
                  })}
                </AnimatePresence>

                {alumnosFiltrados.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No se encontraron alumnos</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel de asignación */}
          <div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 sticky top-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Asignar Acceso
              </h2>

              {selectedAlumnos.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-300 mb-2">
                      Seleccionados: <span className="font-semibold text-white">{selectedAlumnos.length}</span> alumno{selectedAlumnos.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de Acceso
                    </label>
                    <select
                      value={tipoAcceso}
                      onChange={(e) => setTipoAcceso(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg py-2 px-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                    >
                      <option value="regalo">Regalo</option>
                      <option value="prueba">Prueba</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de Expiración (opcional)
                    </label>
                    <input
                      type="date"
                      value={fechaExpiracion}
                      onChange={(e) => setFechaExpiracion(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg py-2 px-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Dejar vacío para acceso permanente
                    </p>
                  </div>

                  <motion.button
                    onClick={asignarAcceso}
                    disabled={assigningAccess}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: assigningAccess ? 1 : 1.02 }}
                    whileTap={{ scale: assigningAccess ? 1 : 0.98 }}
                  >
                    {assigningAccess ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Asignando...
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5" />
                        Asignar Acceso
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-2">Selecciona alumnos para asignar acceso</p>
                  <p className="text-sm">Usa los checkboxes para seleccionar múltiples alumnos</p>
                </div>
              )}
            </div>

            {/* Estadísticas */}
            {curso && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total alumnos:</span>
                    <span className="text-white font-medium">{alumnos.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Con acceso:</span>
                    <span className="text-green-400 font-medium">{alumnosConAcceso.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sin acceso:</span>
                    <span className="text-red-400 font-medium">{alumnos.length - alumnosConAcceso.length}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-2">
                    <span className="text-gray-400">Cobertura:</span>
                    <span className="text-purple-400 font-medium">
                      {alumnos.length > 0 ? Math.round((alumnosConAcceso.length / alumnos.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsignarCurso;
