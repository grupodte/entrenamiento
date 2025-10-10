# Integración de Mux para Videos Protegidos

Esta implementación proporciona videos protegidos usando Mux Signed URLs para garantizar que solo usuarios autenticados y con acceso al curso puedan ver los videos.

## 🔧 Configuración

### Variables de Entorno Requeridas

Las siguientes variables ya están configuradas en Vercel:

```env
MUX_SIGNING_KEY_ID=x9XIQMfXGg7mFkSUeFZh21025Wj1EHtw5HKw1B02a6guY
MUX_SIGNING_KEY_SECRET=LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQ...
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Base de Datos

Ejecuta el archivo SQL para crear la tabla de logs (opcional):
```sql
-- En tu consola de Supabase
\i database/video_access_logs.sql
```

## 🎯 Cómo Funciona

### 1. Verificación de Acceso
- Verifica que el usuario esté autenticado
- Verifica que tenga acceso al curso (tabla `acceso_cursos`)
- Los administradores tienen acceso automático
- Verifica que la lección pertenezca al curso solicitado

### 2. Generación de URL Firmada
- Extrae el Playback ID de Mux del `video_url` de la lección
- Genera un JWT firmado con la clave privada de Mux
- La URL expira en 24 horas
- Incluye metadata de seguridad adicional

### 3. Cache y Optimización
- URLs firmadas se cachean en el cliente
- Limpieza automática de cache expirado
- Prevención de requests duplicados
- Precarga opcional para múltiples lecciones

## 📋 Uso

### En el Componente
```jsx
// El hook se usa automáticamente en VisualizarCurso.jsx
const { getSignedUrl, loadingUrls, errors } = useMuxSignedUrl();

// Al seleccionar una lección
const signedUrl = await getSignedUrl(leccionId, userId, cursoId);
```

### Formato de video_url en la Base de Datos

Los `video_url` en la tabla `lecciones` pueden estar en varios formatos:

```
// Formato completo de Mux
https://stream.mux.com/ABC123XYZ.m3u8

// Solo Playback ID
ABC123XYZ

// URL sin extensión
https://stream.mux.com/ABC123XYZ
```

## 🔒 Seguridad

### Protecciones Implementadas
- ✅ Autenticación de usuario requerida
- ✅ Verificación de acceso al curso
- ✅ Validación de pertenencia lección-curso
- ✅ URLs firmadas con expiración (24h)
- ✅ Logs de acceso para auditoría
- ✅ Rate limiting por usuario
- ✅ Validación de parámetros server-side

### Limitaciones de Seguridad
- ⚠️ Una vez generada, la URL firmada es válida por 24h
- ⚠️ URLs pueden ser compartidas durante el período de validez
- ⚠️ Dependiente de la seguridad de las claves de Mux

## 🚀 API Endpoint

### POST /api/mux-signed-url

**Request Body:**
```json
{
  "leccionId": 123,
  "userId": "uuid-string",
  "cursoId": 456
}
```

**Response Success (200):**
```json
{
  "signedUrl": "https://stream.mux.com/ABC123XYZ.m3u8?token=eyJ...",
  "playbackId": "ABC123XYZ",
  "expiresIn": 86400,
  "leccionTitulo": "Introducción al Entrenamiento"
}
```

**Response Error:**
```json
{
  "error": "User does not have access to this course"
}
```

## 📊 Analytics

### Logs de Acceso
Los accesos se registran en `video_access_logs` con:
- Usuario y timestamp
- Lección y curso
- Playback ID de Mux
- IP y User Agent
- Útil para analytics y detección de abuso

### Consultas Útiles
```sql
-- Videos más vistos
SELECT l.titulo, COUNT(*) as accesos
FROM video_access_logs val
JOIN lecciones l ON l.id = val.leccion_id
GROUP BY l.id, l.titulo
ORDER BY accesos DESC;

-- Usuarios más activos
SELECT p.nombre, COUNT(*) as videos_vistos
FROM video_access_logs val
JOIN perfiles p ON p.id = val.usuario_id
GROUP BY p.id, p.nombre
ORDER BY videos_vistos DESC;
```

## 🐛 Troubleshooting

### Error: "Invalid Mux video URL format"
- Verifica que el `video_url` en la lección contenga un Playback ID válido de Mux
- Formato esperado: `https://stream.mux.com/{PLAYBACK_ID}`

### Error: "User does not have access to this course"
- Verifica que exista un registro en `acceso_cursos` con `activo = true`
- Verifica que el `usuario_id` y `curso_id` sean correctos

### Videos no cargan
1. Verifica las variables de entorno de Mux
2. Revisa los logs del servidor para errores JWT
3. Confirma que la clave privada esté en formato correcto
4. Verifica conectividad con la API de Mux

### Performance
- Las URLs se cachean automáticamente
- El cache se limpia cada minuto para URLs expiradas
- Considera implementar precarga para mejor UX

## 🔄 Actualizaciones Futuras

### Mejoras Posibles
- [ ] Tiempo de expiración configurable por curso
- [ ] Restricción por IP adicional
- [ ] Límite de dispositivos simultáneos
- [ ] Watermark personalizado por usuario
- [ ] Analytics más detallados (tiempo de visualización)
- [ ] Notificaciones de acceso sospechoso

### Monitoreo
- [ ] Dashboard de analytics en tiempo real
- [ ] Alertas por uso anómalo
- [ ] Métricas de engagement por video
- [ ] Reportes de acceso para instructores