# 🔧 Migración Requerida: Agregar Columna `unidad_tiempo`

## ❗ Problema Detectado
```
Error: Could not find the 'unidad_tiempo' column of 'series_subejercicio' in the schema cache
```

## ✅ Solución: Ejecutar Migración SQL

### 📋 **Pasos para aplicar la migración:**

1. **Conectar a tu base de datos** (PostgreSQL, MySQL, etc.)

2. **Ejecutar el archivo de migración:**
   ```sql
   -- Ubicación: database/migrations/add_unidad_tiempo_to_series.sql
   
   -- Agregar columna unidad_tiempo
   ALTER TABLE series_subejercicio 
   ADD COLUMN unidad_tiempo VARCHAR(10) DEFAULT 'minutes';
   
   -- Agregar comentario a la columna
   COMMENT ON COLUMN series_subejercicio.unidad_tiempo IS 'Unidad de tiempo para ejercicios por tiempo: minutes o seconds';
   
   -- Crear índice para mejorar consultas (opcional)
   CREATE INDEX idx_series_subejercicio_unidad_tiempo ON series_subejercicio(unidad_tiempo);
   
   -- Actualizar registros existentes para que tengan unidad_tiempo por defecto
   UPDATE series_subejercicio 
   SET unidad_tiempo = 'minutes' 
   WHERE tipo_ejecucion = 'tiempo' AND unidad_tiempo IS NULL;
   ```

3. **Verificar que la migración se aplicó correctamente:**
   ```sql
   -- Verificar que la columna existe
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'series_subejercicio' 
   AND column_name = 'unidad_tiempo';
   ```

### 🎯 **Resultado Esperado:**
- ✅ Columna `unidad_tiempo` agregada
- ✅ Valor por defecto: `'minutes'`
- ✅ Registros existentes actualizados
- ✅ Índice creado para mejorar performance

### 🚀 **Después de la Migración:**
1. **Reinicia el servidor de desarrollo**
2. **Prueba crear ejercicios por tiempo**
3. **Verifica que puedes cambiar entre minutos y segundos**
4. **Confirma que los valores se guardan correctamente**

---

## 📊 **Opciones de Ejecución:**

### **Opción A: Via Cliente SQL (pgAdmin, phpMyAdmin, etc.)**
- Abre tu cliente de base de datos
- Copia y pega el SQL del archivo de migración
- Ejecuta las consultas

### **Opción B: Via Terminal/CLI**
```bash
# PostgreSQL
psql -d tu_base_de_datos -f database/migrations/add_unidad_tiempo_to_series.sql

# MySQL
mysql -u usuario -p tu_base_de_datos < database/migrations/add_unidad_tiempo_to_series.sql
```

### **Opción C: Via Supabase Dashboard (si usas Supabase)**
- Ve al SQL Editor en tu dashboard de Supabase
- Copia el contenido del archivo de migración
- Ejecuta la consulta

---

🔥 **Importante**: Una vez aplicada la migración, la funcionalidad de unidades de tiempo flexibles funcionará completamente!
