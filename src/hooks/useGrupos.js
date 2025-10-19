import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'react-hot-toast'

// Keys para React Query
export const GRUPO_QUERY_KEYS = {
  all: ['grupos'],
  detail: (id) => ['grupos', id],
  members: (id) => ['grupos', id, 'members'],
  assignments: (id) => ['grupos', id, 'assignments'],
  diets: (id) => ['grupos', id, 'diets']
}

// Hook para obtener detalles del grupo
export const useGrupoDetail = (grupoId) => {
  return useQuery({
    queryKey: GRUPO_QUERY_KEYS.detail(grupoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grupos_alumnos')
        .select('*')
        .eq('id', grupoId)
        .eq('activo', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Grupo no encontrado')
        }
        throw error
      }
      return data
    },
    enabled: !!grupoId
  })
}

// Hook para obtener miembros del grupo
export const useGrupoMembers = (grupoId) => {
  return useQuery({
    queryKey: GRUPO_QUERY_KEYS.members(grupoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asignaciones_grupos_alumnos')
        .select(`
          *,
          perfiles!inner(id, nombre, apellido, email, avatar_url)
        `)
        .eq('grupo_id', grupoId)
        .eq('activo', true)

      if (error) throw error
      return data || []
    },
    enabled: !!grupoId
  })
}

// Hook para obtener asignaciones del grupo
export const useGrupoAssignments = (grupoId) => {
  return useQuery({
    queryKey: GRUPO_QUERY_KEYS.assignments(grupoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asignaciones_grupos_contenido')
        .select(`
          *,
          rutinas_base(nombre),
          rutinas_de_verdad(nombre),
          cursos(titulo)
        `)
        .eq('grupo_id', grupoId)
        .eq('activo', true)
        .order('fecha_asignacion', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!grupoId
  })
}

// Hook para obtener dietas del grupo
export const useGrupoDiets = (grupoId) => {
  return useQuery({
    queryKey: GRUPO_QUERY_KEYS.diets(grupoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asignaciones_dietas_grupos')
        .select(`
          *,
          dietas(id, nombre, descripcion, tipo, calorias, macronutrientes, etiquetas, archivo_url, archivo_nombre)
        `)
        .eq('grupo_id', grupoId)
        .eq('activo', true)
        .order('fecha_asignacion', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!grupoId
  })
}

// Hook para agregar miembros al grupo
export const useAddMembersToGroup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ grupoId, alumnosIds }) => {
      const asignaciones = alumnosIds.map(alumnoId => ({
        grupo_id: grupoId,
        alumno_id: alumnoId,
        activo: true
      }))

      const { error, data } = await supabase
        .from('asignaciones_grupos_alumnos')
        .insert(asignaciones)
        .select('alumno_id')

      if (error) throw error
      return data
    },
    onSuccess: (data, { grupoId }) => {
      // Invalidar queries relacionadas para refrescar automáticamente
      queryClient.invalidateQueries({ queryKey: GRUPO_QUERY_KEYS.members(grupoId) })
      queryClient.invalidateQueries({ queryKey: GRUPO_QUERY_KEYS.detail(grupoId) })
      queryClient.invalidateQueries({ queryKey: ['alumnos'] }) // Si tienes una lista de alumnos
      
      toast.success(`${data.length} miembro${data.length > 1 ? 's agregados' : ' agregado'} al grupo`)
    },
    onError: (error) => {
      console.error('Error al agregar miembros:', error)
      toast.error('Error al agregar miembros al grupo')
    }
  })
}

// Hook para asignar contenido masivo
export const useAssignContentToGroup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ grupoId, contenidoId, tipo, userId }) => {
      const asignacionGrupo = {
        grupo_id: grupoId,
        tipo: tipo,
        asignado_por: userId,
        fecha_inicio: new Date().toISOString().split('T')[0],
        activo: true
      }

      if (tipo === 'rutina') asignacionGrupo.rutina_base_id = contenidoId
      else if (tipo === 'rutina_completa') asignacionGrupo.rutina_de_verdad_id = contenidoId
      else if (tipo === 'curso') asignacionGrupo.curso_id = contenidoId

      const { error } = await supabase
        .from('asignaciones_grupos_contenido')
        .insert(asignacionGrupo)

      if (error) throw error
      
      return { grupoId, contenidoId, tipo }
    },
    onSuccess: (data, variables) => {
      // Invalidar queries para actualización automática
      queryClient.invalidateQueries({ queryKey: GRUPO_QUERY_KEYS.assignments(data.grupoId) })
      queryClient.invalidateQueries({ queryKey: GRUPO_QUERY_KEYS.detail(data.grupoId) })
      
      toast.success(`Contenido asignado exitosamente al grupo`)
    },
    onError: (error) => {
      console.error('Error al asignar contenido:', error)
      toast.error('Error al asignar contenido al grupo')
    }
  })
}

// Hook para asignar dieta al grupo
export const useAssignDietToGroup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ grupoId, dietaId, userId }) => {
      const { error } = await supabase
        .from('asignaciones_dietas_grupos')
        .insert({
          grupo_id: grupoId,
          dieta_id: dietaId,
          asignado_por: userId,
          activo: true
        })

      if (error) throw error
      
      return { grupoId, dietaId }
    },
    onSuccess: (data) => {
      // Invalidar queries para actualización automática
      queryClient.invalidateQueries({ queryKey: GRUPO_QUERY_KEYS.diets(data.grupoId) })
      queryClient.invalidateQueries({ queryKey: GRUPO_QUERY_KEYS.detail(data.grupoId) })
      
      toast.success('Dieta asignada exitosamente al grupo')
    },
    onError: (error) => {
      console.error('Error al asignar dieta:', error)
      toast.error('Error al asignar dieta al grupo')
    }
  })
}

// Hook para eliminar asignación del grupo
export const useRemoveAssignmentFromGroup = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ asignacionId, grupoId }) => {
      const { error } = await supabase
        .from('asignaciones_grupos_contenido')
        .update({ activo: false })
        .eq('id', asignacionId)

      if (error) throw error
      
      return { asignacionId, grupoId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: GRUPO_QUERY_KEYS.assignments(data.grupoId) })
      queryClient.invalidateQueries({ queryKey: GRUPO_QUERY_KEYS.detail(data.grupoId) })
      
      toast.success('Asignación eliminada del grupo')
    },
    onError: (error) => {
      console.error('Error al eliminar asignación:', error)
      toast.error('Error al eliminar la asignación')
    }
  })
}