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
      
      // Debug: Log para verificar qué datos se obtienen
      console.log('📊 useDietas - Datos obtenidos de BD:', data?.map(d => ({
        id: d.id,
        nombre: d.nombre,
        archivos: d.archivos,
        archivo_url: d.archivo_url,
        tieneArchivos: Array.isArray(d.archivos) ? d.archivos.length > 0 : false,
        tipoArchivos: typeof d.archivos
      })))
      
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
      
      console.log('📦 Datos que se van a insertar:', {
        nombre: dietaData.nombre,
        archivos: dietaData.archivos,
        archivo_url: dietaData.archivo_url,
        cantidadArchivos: archivosSubidos.length,
        dietaDataCompleta: dietaData
      })

      // Crear dieta
      dietaData.creado_por = user.id
      const { data: insertedData, error } = await supabase
        .from('dietas')
        .insert(dietaData)
        .select()
      
      console.log('📦 Resultado de inserción:', {
        insertedData,
        error
      })

      if (error) {
        console.error('❌ Error al insertar en BD:', error)
        throw error
      }
      return insertedData?.[0] || dietaData
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
    mutationFn: async ({ dietaId, dietaData, archivos, archivosExistentes: archivosExistentesParam }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Subir archivos nuevos si existen
      let archivosNuevos = []
      
      // Usar archivos existentes pasados como parámetro o extraer de dietaData como fallback
      const archivosExistentes = archivosExistentesParam || dietaData.archivos?.filter(file => {
        // Archivos existentes tienen URL pero NO son objetos File
        return file.url && !(file instanceof File) && !file.size
      }) || []
      
      const archivosParaSubir = archivos?.filter(file => {
        // Solo procesar archivos File que son nuevos
        return file instanceof File
      }) || []
      
      console.log('🗄 Actualizando dieta:', {
        existentes: archivosExistentes.length,
        nuevosParaSubir: archivosParaSubir.length
      })

      if (archivosParaSubir.length > 0) {
        console.log('📤 Subiendo', archivosParaSubir.length, 'archivos nuevos...')
        for (const archivo of archivosParaSubir) {
          try {
            const uploadResult = await uploadFile(archivo, user.id)
            archivosNuevos.push(uploadResult)
            console.log('✅ Archivo subido:', uploadResult.name)
          } catch (error) {
            console.error('❌ Error al subir archivo:', archivo.name, error)
            throw new Error(`Error al subir ${archivo.name}: ${error.message}`)
          }
        }
      }

      // Combinar archivos existentes con nuevos
      const todosLosArchivos = [...archivosExistentes, ...archivosNuevos]
      
      console.log('📁 Archivos finales:', todosLosArchivos.length)
      
      if (todosLosArchivos.length > 0) {
        dietaData.archivo_url = todosLosArchivos[0]?.url
        dietaData.pdf_url = todosLosArchivos[0]?.url
        dietaData.archivos = todosLosArchivos
      } else {
        // Si no hay archivos, limpiar las referencias
        dietaData.archivo_url = null
        dietaData.pdf_url = null
        dietaData.archivos = []
      }
      
      console.log('🔄 Datos que se van a actualizar:', {
        dietaId,
        archivos: dietaData.archivos,
        archivo_url: dietaData.archivo_url,
        cantidadArchivos: todosLosArchivos.length,
        dietaDataCompleta: dietaData
      })

      const { data: updatedData, error } = await supabase
        .from('dietas')
        .update(dietaData)
        .eq('id', dietaId)
        .select()
      
      console.log('🔄 Resultado de actualización:', {
        updatedData,
        error
      })

      if (error) {
        console.error('❌ Error al actualizar en BD:', error)
        throw error
      }
      return { dietaId, dietaData: updatedData?.[0] || dietaData }
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
    
    // Obtener URL pública con validación
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('dietas')
      .getPublicUrl(fileName)
    
    if (urlError) {
      console.error('Error obteniendo URL pública:', urlError)
      throw new Error(`Error obteniendo URL pública: ${urlError.message}`)
    }
    
    // Validar que la URL sea válida
    if (!publicUrl || !publicUrl.startsWith('http')) {
      throw new Error('URL pública inválida generada')
    }

    console.log('✅ Archivo subido correctamente:', {
      path: data.path,
      url: publicUrl,
      name: archivo.name,
      size: archivo.size
    })

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