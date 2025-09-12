// Script para verificar qué íconos están disponibles en @heroicons/react/24/outline

// Importar todos los íconos que necesitamos en nuestros componentes
const requiredIcons = [
  'ArrowDownTrayIcon',
  'DevicePhoneMobileIcon', 
  'CheckCircleIcon',
  'CloudArrowDownIcon',
  'WifiIcon',
  'BoltIcon',
  'ShieldCheckIcon',
  'ArrowLeftIcon',
  'ChevronDownIcon',
  'ChevronUpIcon'
];

async function checkIcons() {
  console.log('🔍 Verificando íconos de Heroicons...\n');
  
  for (const iconName of requiredIcons) {
    try {
      await import(`@heroicons/react/24/outline`).then(module => {
        if (module[iconName]) {
          console.log(`✅ ${iconName} - Disponible`);
        } else {
          console.log(`❌ ${iconName} - NO DISPONIBLE`);
        }
      });
    } catch (error) {
      console.log(`❌ ${iconName} - ERROR: ${error.message}`);
    }
  }
  
  console.log('\n✨ Verificación completada');
}

checkIcons();
