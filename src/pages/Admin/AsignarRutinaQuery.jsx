import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import AdminLayout from '../../layouts/AdminLayout'

const AsignarRutina = () => {
  const { id: alumnoId } = useParams()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const dia = parseInt(searchParams.get('dia'), 10)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Query para obtener rutinas
  const { data: rutinas = [], isLoading: rutinasLoading } = useQuery({
    queryKey: ['rutinas-base'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rutinas_base')
        .select('*')
      
      if (error) throw error
      return data || []
    }
  })

  // Query para obtener datos del alumno
  const { data: alumno, isLoading: alumnoLoading } = useQuery({
    queryKey: ['alumno', alumnoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfiles')
        .select('nombre, apellido, email')
        .eq('id', alumnoId)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!alumnoId
  })

  // Mutación para asignar rutina
  const asignarRutinaMutation = useMutation({
    mutationFn: async (rutinaBaseId) => {
      const { error } = await supabase
        .from('asignaciones')
        .insert({
          alumno_id: alumnoId,
          rutina_base_id: rutinaBaseId,
          dia_semana: dia,
          fecha_asignacion: new Date().toISOString(),
        })

      if (error) throw error
      return rutinaBaseId
    },
    onSuccess: (rutinaBaseId) => {
      const rutina = rutinas.find(r => r.id === rutinaBaseId)
      
      // Invalidar queries relacionadas para actualización instantánea
      queryClient.invalidateQueries({ queryKey: ['alumno', alumnoId, 'rutinas'] })
      queryClient.invalidateQueries({ queryKey: ['alumno', alumnoId] })
      queryClient.invalidateQueries({ queryKey: ['asignaciones'] })
      
      toast.success('✅ Rutina base asignada correctamente.')
      
      // Navegar después de mostrar el mensaje
      setTimeout(() => navigate(`/admin/alumno/${alumnoId}`), 1500)
    },
    onError: (error) => {
      console.error('❌ Error durante la asignación:', error)
      if (error.code === '23505') {
        toast.error('❌ Este día ya tiene una rutina asignada.')
      } else {
        toast.error('❌ Ocurrió un error al asignar la rutina')
      }
    }
  })

  const loading = rutinasLoading || alumnoLoading

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded shadow">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded shadow">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        ← Volver atrás
      </button>

      <h1 className="text-xl font-bold mb-4">Seleccionar rutina base para el día</h1>
      
      {rutinas.length > 0 ? (
        <ul className="space-y-4">
          {rutinas.map((rutina) => (
            <li key={rutina.id} className="p-4 border rounded bg-gray-50">
              <h3 className="font-bold">{rutina.nombre}</h3>
              <p className="text-sm text-gray-600">{rutina.descripcion}</p>
              <div className="mt-2">
                <button
                  onClick={() => asignarRutinaMutation.mutate(rutina.id)}
                  disabled={asignarRutinaMutation.isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {asignarRutinaMutation.isPending ? 'Asignando...' : 'Asignar esta rutina'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No hay rutinas disponibles</p>
      )}
    </div>
  )
}

export default AsignarRutina