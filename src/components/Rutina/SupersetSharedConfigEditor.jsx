// src/components/Rutina/SupersetSharedConfigEditor.jsx
import React from 'react';

const SupersetSharedConfigEditor = ({ sharedConfig, onConfigChange }) => {
    const handleNumSetsChange = (e) => {
        let num = parseInt(e.target.value, 10);
        onConfigChange({ ...sharedConfig, num_sets: num });
    };

    const handleSharedRestChange = (e) => {
        onConfigChange({ ...sharedConfig, shared_rest: e.target.value });
    };

    const handleSharedRepsChange = (e) => {
        let reps = parseInt(e.target.value, 10);
        onConfigChange({ ...sharedConfig, shared_reps: reps });
    };

    return (
        <div>
  <div className="grid grid-cols-4 gap-3 items-center">
    <div>
      <label htmlFor="num_sets" className="block text-xs font-medium text-white/70 mb-1">
        Número de series:
      </label>
      <input
        type="text"
        id="num_sets"
        name="num_sets"
        value={sharedConfig?.num_sets || ''}
        onChange={handleNumSetsChange}
        className="w-full rounded-md bg-white/10 backdrop-blur px-3 py-1.5 text-white placeholder-white/50 text-sm focus:ring-sky-500 focus:border-sky-500 border-transparent"
        placeholder="Ej: 3"
      />
    </div>
    <div>
      <label htmlFor="shared_rest" className="block text-xs font-medium text-white/70 mb-1">
        Descanso (segundos):
      </label>
      <input
        type="text"
        id="shared_rest"
        name="shared_rest"
        value={sharedConfig?.shared_rest || ''}
        onChange={handleSharedRestChange}
        placeholder="Ej: 60"
        className="w-full rounded-md bg-white/10 backdrop-blur px-3 py-1.5 text-white placeholder-white/50 text-sm focus:ring-sky-500 focus:border-sky-500 border-transparent"
      />
    </div>
 
  </div>
</div>
    );
};

export default SupersetSharedConfigEditor;
