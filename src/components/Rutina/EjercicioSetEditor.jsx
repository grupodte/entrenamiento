// src/components/Rutina/EjercicioSetEditor.jsx
import SeriesInput from './SeriesInput';

const EjercicioSetEditor = ({ series, onSeriesChange }) => {
    const actualizarSerie = (index, nueva) => {
        const nuevas = [...series];
        nuevas[index] = nueva;
        onSeriesChange(nuevas);
    };

    const agregarSerie = () => {
        onSeriesChange([...series, { 
            reps: '', 
            pausa: '', 
            carga_sugerida: '', 
            tipo_ejecucion: 'standard',
            duracion_segundos: ''
        }]);
    };

    return (
        <div className="space-y-2 mt-2">
            {series.map((serie, index) => (
                <SeriesInput
                    key={index}
                    serie={serie}
                    index={index}
                    onChange={actualizarSerie}
                />
            ))}
            <button
                onClick={agregarSerie}
                className=" hover:text-sky-300 text-sm font-medium"
            >
                + Agregar serie
            </button>
        </div>
    );
};

export default EjercicioSetEditor;
