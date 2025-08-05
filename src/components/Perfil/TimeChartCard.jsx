import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaClock } from 'react-icons/fa';

const TimeChartCard = ({ timeData }) => {
    return (
        <div className="bg-gray-700/20 rounded-lg p-3">
            <div className="flex items-center mb-2"><FaClock className="text-green-400 mr-2 text-sm" /><h3 className="text-sm font-semibold text-white">Tiempo de Entrenamiento (min)</h3></div>
            <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="fecha"
                            tick={{ fontSize: 10, fill: '#9CA3AF' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(tick) => new Date(tick).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [v, 'Minutos']} />
                        <Line type="monotone" dataKey="minutos" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} activeDot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TimeChartCard;
