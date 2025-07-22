const AdminPanel = () => (
  <div className=" inset-0 w-full h-full  bg-cover bg-center mt-[25px] items-center">
    <div className=" inset-0 backdrop-blur-sm " />

    <div className="relative z-10 max-w-[300px] mx-auto px-6 py-8 rounded-xl bg-white/5 backdrop-blur-md shadow-md border border-white/10 text-white">
      <h1 className="text-2xl font-bold mb-4">Bienvenido al Dashboard del entrenador</h1>
      <p className="text-gray-200">  por ahora solo podes crear ejercicio, rutinas y asignarlas a alumnos
      </p>
    </div>
  </div>
);

export default AdminPanel;
