# Patch para Migración Simple

Si usaste el archivo `add_onboarding_fields_simple.sql`, necesitas hacer estos cambios en el código:

## 1. Actualizar AuthContext.jsx

```javascript
// En fetchRolAndOnboarding, cambiar:
.select("rol, onboarding_completed")

// Y en el insert:
.insert({
    id: userId,
    rol: 'alumno',
    onboarding_completed: false
})
```

## 2. Actualizar Onboarding.jsx

```javascript
// Cambiar el estado inicial:
const [onboardingData, setOnboardingData] = useState({
    objetivo_onboarding: '',          // era: objetivo
    experiencia_onboarding: '',       // era: experiencia
    altura_cm: '',
    peso_kg: '',
    grasa_pct: '',
    cintura_cm: '',
    preferencia_inicio: ''
});

// En loadExistingData, cambiar el select:
.select('objetivo_onboarding, experiencia_onboarding, altura_cm, peso_kg, grasa_pct, cintura_cm, preferencia_inicio')

// En las validaciones, actualizar los nombres de campos según corresponda
```

## 3. Actualizar ResumenStep.jsx

```javascript
// Cambiar las referencias:
data.objetivo_onboarding   // era: data.objetivo
data.experiencia_onboarding   // era: data.experiencia
```

## Alternativa: Usar la migración completa

Si prefieres mantener los nombres originales (`objetivo`, `experiencia`), usa el archivo `add_onboarding_fields_to_perfiles.sql` que maneja la migración de datos existentes automáticamente.
