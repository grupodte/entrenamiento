import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaDumbbell } from 'react-icons/fa';

const WeightTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 p-2 rounded-lg shadow-md border  text-xs">
                <p className="text-gray-300">
                    {new Date(label).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </p>
                <p className="text-orange-400 font-semibold">
                    <FaDumbbell className="inline mr-1" />
                    {Number(payload[0].value).toFixed(1)} kg
                </p>
            </div>
        );
    }
    return null;
};

const WeightChartCard = ({ weightDailyData = [], loading = false }) => {
    // Aseguramos datos válidos y orden cronológico
    const data = Array.isArray(weightDailyData)
        ? weightDailyData
            .map(d => ({
                ...d,
                carga: parseFloat(d.carga) || 0,
                fecha: d.fullDate || d.fecha, // fecha cruda para el eje
            }))
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        : [];

    // Estadísticas
    const totalLevantado = data.reduce((sum, d) => sum + (d.carga || 0), 0);
    const maximoDia = data.length > 0 ? Math.max(...data.map(d => d.carga)) : 0;
    const ultimoDia = data.length > 0 ? data[data.length - 1].carga : 0;

    return (
        <div className="bg-gray-700/20 backdrop-blur-sm rounded-lg p-2 shadow-md">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1">
                    <div className="p-1 bg-orange-500/20 rounded-md">
                        <FaDumbbell className="text-orange-400 text-xs" />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold text-white">Peso levantado</h3>
                        <p className="text-[10px] text-gray-400">Diario (últimos 30 días)</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-base font-bold text-orange-400">{totalLevantado.toFixed(1)} kg</div>
                    <div className="text-[10px] text-gray-400">Total acumulado</div>
                </div>
            </div>

            {/* CHART */}
            <div className="h-16 relative">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        <p>Cargando...</p>
                    </div>
                ) : data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <defs>
                                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 2" stroke="rgba(156, 163, 175, 0.1)" />
                            <XAxis
                                dataKey="fecha"
                                tickFormatter={(tick) =>
                                    new Date(tick).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                                }
                                tick={{ fontSize: 7, fill: '#9CA3AF' }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 7, fill: '#9CA3AF' }}
                                axisLine={false}
                                tickLine={false}
                                domain={['dataMin - 5', 'dataMax + 5']}
                            />
                            <Tooltip content={<WeightTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="carga"
                                stroke="#F97316"
                                strokeWidth={1.5}
                                fill="url(#weightGradient)"
                                dot={{ fill: '#F97316', r: 2 }}
                                activeDot={{ r: 3, stroke: '#F97316', strokeWidth: 1.5, fill: '#FFF' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        <div className="text-center">
                            <FaDumbbell className="mx-auto mb-1 text-gray-500 text-xs" />
                            <p>Sin datos</p>
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/10 text-[10px]">
                <div className="text-center">
                    <div className="text-gray-400">Total</div>
                    <div className="font-semibold text-white">{totalLevantado.toFixed(1)} kg</div>
                </div>
                <div className="text-center">
                    <div className="text-gray-400">Máx. día</div>
                    <div className="font-semibold text-orange-400">{maximoDia.toFixed(1)} kg</div>
                </div>
                <div className="text-center">
                    <div className="text-gray-400">Último día</div>
                    <div className="font-semibold text-white">{ultimoDia.toFixed(1)} kg</div>
                </div>
            </div>
        </div>
    );
};

export default WeightChartCard;
