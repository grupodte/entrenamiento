import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import ModulosEditor from '../../components/ModulosEditor';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  Star,
  Users,
  Clock,
  Tag,
  FileText,
  Image,
  Video,
  DollarSign
} from 'lucide-react';

const CrearCurso = () => {
  const { cursoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(cursoId);

  const [curso, setCurso] = useState({
    titulo: '',
    descripcion: '',
    descripcion_larga: '',
    instructor: 'Michele Ris',
    categoria: 'transformacion',
    nivel: 'principiante',
    precio: '',
    precio_original: '',
    duracion_estimada: '',
    imagen_portada: '',
    video_preview: '',
    estado: 'borrador',
    orden_visualizacion: 0,
    popular: false,
    nuevo: false,
    tags: [],
    requisitos: [],
    objetivos: [],
    incluye: []
  });

  const [modulos, setModulos] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [currentRequisito, setCurrentRequisito] = useState('');
  const [currentObjetivo, setCurrentObjetivo] = useState('');
  const [currentIncluye, setCurrentIncluye] = useState('');

  const categorias = [
    { value: 'transformacion', label: 'Transformación' },
    { value: 'cardio', label: 'Cardio & HIIT' },
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'bienestar', label: 'Bienestar' },
    { value: 'nutricion', label: 'Nutrición' },
    { value: 'movilidad', label: 'Movilidad' }
  ];

  const niveles = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
    { value: 'todos', label: 'Todos los niveles' }
  ];

  const estados = [
    { value: 'borrador', label: 'Borrador' },
    { value: 'publicado', label: 'Publicado' },
    { value: 'archivado', label: 'Archivado' },
    { value: 'mantenimiento', label: 'Mantenimiento' }
  ];

  useEffect(() => {
    if (isEditing) {
      cargarCurso();
    }
  }, [isEditing, cursoId]);

  const cargarCurso = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Cargando curso con ID:', cursoId);
      
      // Cargar datos del curso
      const { data: cursoData, error: cursoError } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', cursoId)
        .single();

      if (cursoError) throw cursoError;

      console.log('✅ Datos del curso cargados:', cursoData);

      setCurso({
        ...cursoData,
        precio: cursoData.precio?.toString() || '',
        precio_original: cursoData.precio_original?.toString() || '',
        tags: cursoData.tags || [],
        requisitos: cursoData.requisitos || [],
        objetivos: cursoData.objetivos || [],
        incluye: cursoData.incluye || []
      });

      // Cargar módulos del curso
      console.log('🔍 Cargando módulos para curso ID:', cursoId);
      
      try {
        // Intentar cargar con join primero
        const { data: modulosData, error: modulosError } = await supabase
          .from('modulos_curso')
          .select(`
            *,
            lecciones (*)
          `)
          .eq('curso_id', cursoId)
          .order('orden', { ascending: true });

        if (modulosError) {
          console.warn('⚠️ Error en consulta con join, intentando consulta separada:', modulosError);
          
          // Consulta de respaldo: cargar módulos y lecciones por separado
          const { data: modulosSolos, error: modulosSolosError } = await supabase
            .from('modulos_curso')
            .select('*')
            .eq('curso_id', cursoId)
            .order('orden', { ascending: true });

          if (modulosSolosError) {
            console.error('❌ Error al cargar módulos:', modulosSolosError);
            setModulos([]);
            return;
          }

          console.log('✅ Módulos cargados (sin lecciones):', modulosSolos);

          // Cargar lecciones para cada módulo
          const modulosConLecciones = [];
          for (const modulo of modulosSolos || []) {
            const { data: leccionesData, error: leccionesError } = await supabase
              .from('lecciones')
              .select('*')
              .eq('modulo_id', modulo.id)
              .order('orden', { ascending: true });

            if (leccionesError) {
              console.warn(`⚠️ Error al cargar lecciones para módulo ${modulo.id}:`, leccionesError);
            }

            modulosConLecciones.push({
              ...modulo,
              lecciones: leccionesData || []
            });
          }

          console.log('✅ Módulos con lecciones (consulta separada):', modulosConLecciones);
          
          const modulosProcessed = modulosConLecciones.map(modulo => ({
            ...modulo,
            id: modulo.id.toString(),
            lecciones: (modulo.lecciones || []).map(leccion => ({
              ...leccion,
              id: leccion.id.toString()
            }))
          }));
          
          setModulos(modulosProcessed);
        } else {
          console.log('✅ Módulos cargados con join:', modulosData);
          
          // Procesar los módulos para compatibilidad con el editor
          const modulosProcessed = (modulosData || []).map(modulo => ({
            ...modulo,
            id: modulo.id.toString(), // Convertir a string para compatibilidad
            lecciones: (modulo.lecciones || []).map(leccion => ({
              ...leccion,
              id: leccion.id.toString() // Convertir a string para compatibilidad
            }))
          }));
          
          console.log('✅ Módulos procesados:', modulosProcessed);
          setModulos(modulosProcessed);
        }
      } catch (error) {
        console.error('❌ Error inesperado al cargar módulos:', error);
        setModulos([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar curso:', error);
      toast.error('Error al cargar el curso');
      navigate('/admin/cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🏁 INICIANDO GUARDADO DEL CURSO');
    console.log('🔍 Estado actual de módulos:', modulos);
    console.log('🔍 Número de módulos:', modulos.length);
    
    modulos.forEach((modulo, index) => {
      console.log(`📁 Módulo ${index + 1}:`, {
        id: modulo.id,
        titulo: modulo.titulo,
        descripcion: modulo.descripcion,
        orden: modulo.orden,
        duracion_estimada: modulo.duracion_estimada,
        num_lecciones: modulo.lecciones?.length || 0
      });
      
      if (modulo.lecciones && modulo.lecciones.length > 0) {
        modulo.lecciones.forEach((leccion, lecIndex) => {
          console.log(`  🎥 Lección ${lecIndex + 1}:`, {
            id: leccion.id,
            titulo: leccion.titulo,
            descripcion: leccion.descripcion,
            contenido: leccion.contenido,
            video_url: leccion.video_url,
            duracion_segundos: leccion.duracion_segundos,
            orden: leccion.orden,
            es_preview: leccion.es_preview
          });
        });
      }
    });
    
    if (!curso.titulo || !curso.descripcion || !curso.categoria || !curso.nivel) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setSaving(true);
      
      const cursoData = {
        ...curso,
        precio: curso.precio ? parseFloat(curso.precio) : null,
        precio_original: curso.precio_original ? parseFloat(curso.precio_original) : null,
        creado_por: user.id,
        fecha_publicacion: curso.estado === 'publicado' ? new Date().toISOString() : null
      };

      let result;
      if (isEditing) {
        const { data, error } = await supabase
          .from('cursos')
          .update(cursoData)
          .eq('id', cursoId)
          .select()
          .single();
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('cursos')
          .insert(cursoData)
          .select()
          .single();
        result = { data, error };
      }

      if (result.error) throw result.error;

      const cursoIdGuardado = result.data.id;

      // Guardar módulos y lecciones
      console.log('🔍 Guardando módulos:', modulos);
      console.log('🔍 isEditing:', isEditing);
      console.log('🔍 cursoId original:', cursoId);
      console.log('🔍 cursoIdGuardado:', cursoIdGuardado);
      
      // Usar el ID correcto dependiendo si estamos editando o creando
      const cursoIdFinal = isEditing ? cursoId : cursoIdGuardado;
      console.log('🔍 cursoIdFinal a usar:', cursoIdFinal);
      
      if (modulos.length > 0) {
        // Si estamos editando, eliminamos módulos y lecciones existentes
        if (isEditing) {
          console.log('🔍 Eliminando módulos existentes del curso:', cursoIdFinal);
          
          // Primero eliminar lecciones
          const { error: eliminarLeccionesError } = await supabase
            .from('lecciones')
            .delete()
            .eq('curso_id', cursoIdFinal);
            
          if (eliminarLeccionesError) {
            console.error('❌ Error al eliminar lecciones:', eliminarLeccionesError);
            throw eliminarLeccionesError;
          }
          
          // Luego eliminar módulos
          const { error: eliminarModulosError } = await supabase
            .from('modulos_curso')
            .delete()
            .eq('curso_id', cursoIdFinal);
            
          if (eliminarModulosError) {
            console.error('❌ Error al eliminar módulos:', eliminarModulosError);
            throw eliminarModulosError;
          }
          
          console.log('✅ Módulos y lecciones existentes eliminados');
        }

        // Insertar módulos
        for (let i = 0; i < modulos.length; i++) {
          const modulo = modulos[i];
          
          console.log(`🔍 Guardando módulo ${i + 1}:`, {
            titulo: modulo.titulo,
            descripcion: modulo.descripcion,
            orden: modulo.orden,
            duracion_estimada: modulo.duracion_estimada
          });
          
          const { data: moduloData, error: moduloError } = await supabase
            .from('modulos_curso')
            .insert({
              curso_id: cursoIdFinal,
              titulo: modulo.titulo,
              descripcion: modulo.descripcion || '',
              orden: modulo.orden,
              duracion_estimada: modulo.duracion_estimada || ''
            })
            .select()
            .single();

          if (moduloError) {
            console.error('❌ Error al guardar módulo:', moduloError);
            throw moduloError;
          }

          console.log('✅ Módulo guardado:', moduloData);

          // Insertar lecciones del módulo
          if (modulo.lecciones && modulo.lecciones.length > 0) {
            console.log(`🔍 Guardando ${modulo.lecciones.length} lecciones para el módulo:`);
            
            const leccionesData = modulo.lecciones.map((leccion, index) => {
              console.log(`🔍 Procesando lección ${index + 1}:`);
              console.log('  - Lección completa:', leccion);
              console.log('  - Título:', leccion.titulo);
              console.log('  - Descripción:', leccion.descripcion);
              console.log('  - Contenido:', leccion.contenido);
              console.log('  - Video URL:', leccion.video_url);
              console.log('  - Duración segundos:', leccion.duracion_segundos);
              console.log('  - Es preview:', leccion.es_preview);
              
              const leccionData = {
                modulo_id: moduloData.id,
                curso_id: cursoIdFinal,
                titulo: leccion.titulo || 'Sin título',
                descripcion: leccion.descripcion || '',
                contenido: leccion.contenido || '',
                video_url: leccion.video_url || '',
                duracion_segundos: parseInt(leccion.duracion_segundos) || 0,
                orden: leccion.orden || 1,
                es_preview: Boolean(leccion.es_preview)
              };
              
              console.log('  - Datos finales a insertar:', leccionData);
              return leccionData;
            });

            const { error: leccionesError } = await supabase
              .from('lecciones')
              .insert(leccionesData);

            if (leccionesError) {
              console.error('❌ Error al guardar lecciones:', leccionesError);
              throw leccionesError;
            }
            
            console.log(`✅ ${leccionesData.length} lecciones guardadas correctamente`);
          }
        }
      } else {
        console.log('ℹ️ No hay módulos para guardar');
      }

      console.log('\u2705 Proceso de guardado completado exitosamente');
      
      toast.success(isEditing ? 'Curso actualizado correctamente' : 'Curso creado correctamente');
      
      // Si estamos editando, recargar los datos para confirmar cambios
      if (isEditing) {
        console.log('\ud83d\udd04 Recargando datos del curso para confirmar cambios...');
        await cargarCurso();
        console.log('\u2705 Datos recargados - cambios confirmados');
      }
      
      // Delay la navegaci\u00f3n para asegurar que los datos se hayan guardado
      setTimeout(() => {
        navigate('/admin/cursos');
      }, 500);
    } catch (error) {
      console.error('Error al guardar curso:', error);
      toast.error('Error al guardar el curso');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCurso(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addToArray = (field, value, currentSetter) => {
    if (value.trim()) {
      setCurso(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      currentSetter('');
    }
  };

  const removeFromArray = (field, index) => {
    setCurso(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const ArrayInput = ({ field, label, value, setValue, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToArray(field, value, setValue);
              }
            }}
            placeholder={placeholder}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => addToArray(field, value, setValue)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-1">
          {curso[field].map((item, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-200">{item}</span>
              <button
                type="button"
                onClick={() => removeFromArray(field, index)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/cursos')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-3xl font-bold text-white">
            {isEditing ? 'Editar Curso' : 'Crear Nuevo Curso'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Información Básica
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título del Curso *
                </label>
                <input
                  type="text"
                  value={curso.titulo}
                  onChange={(e) => handleInputChange('titulo', e.target.value)}
                  placeholder="Ej: Transformación Total 12 Semanas"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoría *
                </label>
                <select
                  value={curso.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  required
                >
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nivel *
                </label>
                <select
                  value={curso.nivel}
                  onChange={(e) => handleInputChange('nivel', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  required
                >
                  {niveles.map(nivel => (
                    <option key={nivel.value} value={nivel.value}>{nivel.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instructor
                </label>
                <input
                  type="text"
                  value={curso.instructor}
                  onChange={(e) => handleInputChange('instructor', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duración Estimada
                </label>
                <input
                  type="text"
                  value={curso.duracion_estimada}
                  onChange={(e) => handleInputChange('duracion_estimada', e.target.value)}
                  placeholder="Ej: 12 semanas, 6 horas"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción Corta *
                </label>
                <textarea
                  value={curso.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Descripción breve que aparece en las tarjetas"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción Detallada
                </label>
                <textarea
                  value={curso.descripcion_larga}
                  onChange={(e) => handleInputChange('descripcion_larga', e.target.value)}
                  placeholder="Descripción completa del curso"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  rows={5}
                />
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Precios
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Precio Actual
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={curso.precio}
                  onChange={(e) => handleInputChange('precio', e.target.value)}
                  placeholder="97.00"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Precio Original
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={curso.precio_original}
                  onChange={(e) => handleInputChange('precio_original', e.target.value)}
                  placeholder="197.00"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={curso.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  {estados.map(estado => (
                    <option key={estado.value} value={estado.value}>{estado.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Contenido Multimedia
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL Imagen de Portada
                </label>
                <input
                  type="url"
                  value={curso.imagen_portada}
                  onChange={(e) => handleInputChange('imagen_portada', e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL Video Preview
                </label>
                <input
                  type="url"
                  value={curso.video_preview}
                  onChange={(e) => handleInputChange('video_preview', e.target.value)}
                  placeholder="https://ejemplo.com/video.mp4"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Arrays de información */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Información Adicional
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ArrayInput
                field="tags"
                label="Tags"
                value={currentTag}
                setValue={setCurrentTag}
                placeholder="Agregar tag"
              />

              <ArrayInput
                field="requisitos"
                label="Requisitos"
                value={currentRequisito}
                setValue={setCurrentRequisito}
                placeholder="Agregar requisito"
              />

              <ArrayInput
                field="objetivos"
                label="Objetivos"
                value={currentObjetivo}
                setValue={setCurrentObjetivo}
                placeholder="Agregar objetivo"
              />

              <ArrayInput
                field="incluye"
                label="Qué Incluye"
                value={currentIncluye}
                setValue={setCurrentIncluye}
                placeholder="Agregar característica"
              />
            </div>
          </div>

          {/* Configuraciones */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Configuraciones
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  value={curso.orden_visualizacion}
                  onChange={(e) => handleInputChange('orden_visualizacion', parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={curso.popular}
                    onChange={(e) => handleInputChange('popular', e.target.checked)}
                    className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Marcar como popular</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={curso.nuevo}
                    onChange={(e) => handleInputChange('nuevo', e.target.checked)}
                    className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Marcar como nuevo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Módulos y Lecciones */}
          <ModulosEditor 
            modulos={modulos} 
            onModulosChange={setModulos} 
          />

          {/* Botones de acción */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/cursos')}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            
            <motion.button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : (isEditing ? 'Actualizar Curso' : 'Crear Curso')}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearCurso;
