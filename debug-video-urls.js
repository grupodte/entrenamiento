// Script de debugging para URLs de video
// Ejecutar desde la consola del navegador o Node.js con Supabase

const debugVideoUrls = async () => {
  console.log('🔍 Analizando URLs de video en la base de datos...');
  
  try {
    // Esto se debe ejecutar desde la consola del navegador donde supabase esté disponible
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase no está disponible. Ejecuta esto desde la consola del navegador en tu aplicación.');
      return;
    }

    const { data: lecciones, error } = await supabase
      .from('lecciones')
      .select('id, titulo, video_url')
      .not('video_url', 'is', null)
      .limit(10);

    if (error) {
      console.error('❌ Error al consultar lecciones:', error);
      return;
    }

    console.log(`📊 Encontradas ${lecciones.length} lecciones con video URLs:`);
    
    lecciones.forEach((leccion, index) => {
      console.log(`\n${index + 1}. ${leccion.titulo}`);
      console.log(`   URL: ${leccion.video_url}`);
      
      // Analizar tipo de URL
      if (leccion.video_url.includes('youtube.com') || leccion.video_url.includes('youtu.be')) {
        console.log('   🎥 Tipo: YouTube');
        console.log('   ⚠️  Nota: YouTube requiere iframe embed, no video directo');
      } else if (leccion.video_url.includes('vimeo.com')) {
        console.log('   🎥 Tipo: Vimeo');
        console.log('   ⚠️  Nota: Vimeo requiere iframe embed, no video directo');
      } else if (leccion.video_url.match(/\.(mp4|webm|ogg|mov)$/i)) {
        console.log('   🎥 Tipo: Video directo (MP4/WebM/OGG)');
        console.log('   ✅ Compatible con elemento <video>');
      } else if (leccion.video_url.includes('blob:') || leccion.video_url.includes('data:')) {
        console.log('   🎥 Tipo: Blob/Data URL');
        console.log('   ✅ Probablemente compatible');
      } else {
        console.log('   🎥 Tipo: URL desconocida');
        console.log('   ❓ Necesita verificación manual');
      }
    });

    console.log('\n🧪 Prueba de carga de video:');
    console.log('Ejecuta esto para probar una URL específica:');
    console.log(`
const testVideoUrl = '${lecciones[0]?.video_url || 'TU_URL_AQUI'}';
const video = document.createElement('video');
video.src = testVideoUrl;
video.addEventListener('loadeddata', () => console.log('✅ Video carga correctamente'));
video.addEventListener('error', (e) => console.error('❌ Error al cargar video:', e));
video.load();
    `);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
};

// Ejecutar inmediatamente si estamos en un entorno del navegador
if (typeof window !== 'undefined') {
  debugVideoUrls();
} else {
  console.log('📝 Copia este script y ejecútalo en la consola del navegador de tu aplicación.');
}
