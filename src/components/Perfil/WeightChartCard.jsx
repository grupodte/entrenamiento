import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaDumbbell, FaChartLine } from 'react-icons/fa';

const WeightTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-600">
                <p className="text-gray-300 text-xs mb-1">
                    {new Date(label).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit'
                    })}
                </p>
                <p className="text-orange-400 font-semibold">
                    <FaDumbbell className="inline mr-1" />
                    {payload[0].value} kg promedio
                </p>
                {data.sesiones && (
                    <p className="text-gray-400 text-xs">
                        {data.sesiones} sesión{data.sesiones > 1 ? 'es' : ''}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

const WeightChartCard = ({ weightData }) => {
    const weightStats = weightData.length > 0 ? {
        promedio: Math.round((weightData.reduce((acc, d) => acc + d.peso, 0) / weightData.length) * 10) / 10,
        maximo: Math.max(...weightData.map(d => d.peso)),
        minimo: Math.min(...weightData.map(d => d.peso)),
        tendencia: weightData.length > 1 ?
            (weightData[weightData.length - 1].peso - weightData[0].peso).toFixed(1) : 0
    } : { promedio: 0, maximo: 0, minimo: 0, tendencia: 0 };

    return (
        <div className="bg-gray-700/20 rounded-lg p-2 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <FaChartLine className="text-orange-400 mr-1 text-xs" />
                    <h3 className="text-xs font-semibold text-white">Peso Promedio</h3>
                </div>
                <div className="text-xs text-gray-400">
                    {weightData.length} días
                </div>
            </div>

            <div className="grid grid-cols-2 gap-1 mb-2">
                <div className="text-center">
                    <p className="text-[8px] text-gray-400">Promedio</p>
                    <p className="text-[10px] font-semibold text-orange-400">{weightStats.promedio} kg</p>
                </div>
                <div className="text-center">
                    <p className="text-[8px] text-gray-400">Tendencia</p>
                    <p className={`text-[10px] font-semibold ${weightStats.tendencia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {weightStats.tendencia > 0 ? '+' : ''}{weightStats.tendencia} kg
                    </p>
                </div>
            </div>

            <div className="h-20">
                {weightData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <defs>
                                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.5} />
                            <XAxis
                                dataKey="fecha"
                                tick={{ fontSize: 8, fill: '#9CA3AF' }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                                tickFormatter={(tick) => {
                                    const date = new Date(tick);
                                    return `${date.getDate()}/${date.getMonth() + 1}`;
                                }}
                            />
                            <YAxis
                                tick={{ fontSize: 8, fill: '#9CA3AF' }}
                                axisLine={false}
                                tickLine={false}
                                domain={['dataMin - 5', 'dataMax + 5']}
                            />
                            <Tooltip content={<WeightTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="peso"
                                stroke="#F97316"
                                strokeWidth={2}
                                fill="url(#weightGradient)"
                                dot={{ fill: '#F97316', r: 2, strokeWidth: 1, stroke: '#1F2937' }}
                                activeDot={{ r: 3, stroke: '#F97316', strokeWidth: 2, fill: '#FFF' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        <div className="text-center">
                            <FaDumbbell className="mx-auto mb-1 text-gray-500 text-sm" />
                            <p>Sin datos</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeightChartCard;
