import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'react-hot-toast'

// Keys para React Query
export const DIETA_QUERY_KEYS = {
  all: ['dietas'],
  active: ['dietas', 'active'],
  byId: (id) => ['dietas', id],
  byUser: (userId) => ['dietas', 'user', userId]
}

// Hook para obtener todas las dietas activas
export const useDietas = () => {
  return useQuery({
    queryKey: DIETA_QUERY_KEYS.active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dietas')
        .select('*, perfiles!creado_por(nombre, apellido)')
        .eq('activo', true)
        .order('fecha_creacion', { ascending: false })

      if (error) throw error
      return data || []
    }
  })
}

// Hook para crear una nueva dieta
export const useCreateDieta = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dietaData, archivos }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Subir archivos si existen
      let archivosSubidos = []
      if (archivos && archivos.length > 0) {
        for (const archivo of archivos) {
          const uploadResult = await uploadFile(archivo, user.id)
          archivosSubidos.push(uploadResult)
        }
      }

      // Agregar información de archivos a dietaData
      if (archivosSubidos.length > 0) {
        dietaData.archivo_url = archivosSubidos[0]?.url
        dietaData.pdf_url = archivosSubidos[0]?.url
        dietaData.archivos = archivosSubidos
      }

      // Crear dieta
      dietaData.creado_por = user.id
      const { error } = await supabase
        .from('dietas')
        .insert(dietaData)

      if (error) throw error
      return dietaData
    },
    onSuccess: () => {
      // Invalidar queries para actualización instantánea
      queryClient.invalidateQueries({ queryKey: DIETA_QUERY_KEYS.active })
      queryClient.invalidateQueries({ queryKey: DIETA_QUERY_KEYS.all })
      
      toast.success('Dieta creada exitosamente')
    },
    onError: (error) => {
      console.error('Error al crear dieta:', error)
      if (error.code === '23505') {
        toast.error('Ya existe una dieta con ese nombre')
      } else {
        toast.error('Error al crear la dieta')
      }
    }
  })
}

// Hook para actualizar una dieta
export const useUpdateDieta = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dietaId, dietaData, archivos }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Subir archivos nuevos si existen
      let archivosNuevos = []
      const archivosExistentes = dietaData.archivos?.filter(file => file.url && !file.size) || []
      const archivosParaSubir = archivos?.filter(file => !file.url || file.size) || []

      if (archivosParaSubir.length > 0) {
        for (const archivo of archivosParaSubir) {
          const uploadResult = await uploadFile(archivo, user.id)
          archivosNuevos.push(uploadResult)
        }
      }

      // Combinar archivos existentes con nuevos
      const todosLosArchivos = [...archivosExistentes, ...archivosNuevos]
      
      if (todosLosArchivos.length > 0) {
        dietaData.archivo_url = todosLosArchivos[0]?.url
        dietaData.pdf_url = todosLosArchivos[0]?.url
        dietaData.archivos = todosLosArchivos
      }

      const { error } = await supabase
        .from('dietas')
        .update(dietaData)
        .eq('id', dietaId)

      if (error) throw error
      return { dietaId, dietaData }
    },
    onSuccess: () => {
      // Invalidar queries para actualización instantánea
      queryClient.invalidateQueries({ queryKey: DIETA_QUERY_KEYS.active })
      queryClient.invalidateQueries({ queryKey: DIETA_QUERY_KEYS.all })
      
      toast.success('Dieta actualizada exitosamente')
    },
    onError: (error) => {
      console.error('Error al actualizar dieta:', error)
      if (error.code === '23505') {
        toast.error('Ya existe una dieta con ese nombre')
      } else {
        toast.error('Error al actualizar la dieta')
      }
    }
  })
}

// Hook para eliminar una dieta
export const useDeleteDieta = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dietaId }) => {
      const { error } = await supabase
        .from('dietas')
        .update({ activo: false })
        .eq('id', dietaId)

      if (error) throw error
      return dietaId
    },
    onSuccess: () => {
      // Invalidar queries para actualización instantánea
      queryClient.invalidateQueries({ queryKey: DIETA_QUERY_KEYS.active })
      queryClient.invalidateQueries({ queryKey: DIETA_QUERY_KEYS.all })
      
      toast.success('Dieta eliminada correctamente')
    },
    onError: (error) => {
      console.error('Error al eliminar dieta:', error)
      toast.error('Error al eliminar la dieta')
    }
  })
}

// Función auxiliar para subir archivos
const uploadFile = async (archivo, userId) => {
  try {
    // Verificar que el usuario tenga rol de admin
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', userId)
      .single()
    
    if (perfilError) {
      throw new Error(`Error obteniendo perfil: ${perfilError.message}`)
    }
    
    if (perfil?.rol !== 'admin') {
      throw new Error(`No tienes permisos para subir archivos. Tu rol: ${perfil?.rol}`)
    }
    
    // Crear nombre de archivo sanitizado
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const sanitizedFileName = sanitizeFileName(archivo.name)
    let fileName = `${userId}/${timestamp}_${randomId}_${sanitizedFileName}`
    
    // Verificar tamaño del archivo (15MB máximo)
    const maxSize = 15 * 1024 * 1024
    if (archivo.size > maxSize) {
      throw new Error(`El archivo es muy grande (${(archivo.size / 1024 / 1024).toFixed(2)}MB). Máximo 15MB.`)
    }
    
    // Verificar que sea un PDF
    if (archivo.type !== 'application/pdf') {
      throw new Error('Solo se permiten archivos PDF')
    }
    
    // Subir archivo
    let { data, error } = await supabase.storage
      .from('dietas')
      .upload(fileName, archivo, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      if (error.message?.includes('already exists')) {
        // Reintentar con nombre diferente
        const retryFileName = `${userId}/${timestamp}_${Date.now()}_${sanitizedFileName}`
        const { data: retryData, error: retryError } = await supabase.storage
          .from('dietas')
          .upload(retryFileName, archivo, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (retryError) {
          throw new Error(`Error al subir archivo: ${retryError.message}`)
        }
        
        data = retryData
        fileName = retryFileName
      } else {
        throw new Error(`Error al subir archivo: ${error.message}`)
      }
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('dietas')
      .getPublicUrl(fileName)

    return { 
      path: data.path, 
      url: publicUrl,
      name: archivo.name,
      size: archivo.size,
      type: archivo.type
    }
  } catch (error) {
    console.error('Error en uploadFile:', error)
    throw error
  }
}

// Función auxiliar para sanitizar nombres de archivos
const sanitizeFileName = (fileName) => {
  return fileName
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Reemplazar caracteres especiales con guion bajo
    .replace(/_{2,}/g, '_') // Reemplazar múltiples guiones bajos con uno solo
    .replace(/^_+|_+$/g, '') // Remover guiones bajos al inicio y final
    .toLowerCase() // Convertir a minúsculas
}