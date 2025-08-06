import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { FaClock } from 'react-icons/fa';

const TimeChartCard = ({ timeData }) => {
    const totalMinutes = timeData?.reduce((sum, week) => sum + week.minutos, 0) || 0;
    const averageMinutes = timeData?.length > 0 ? Math.round(totalMinutes / timeData.length) : 0;
    const bestWeekMinutes = timeData?.length > 0 ? Math.max(...timeData.map(w => w.minutos)) : 0;
    const lastWeekMinutes = timeData?.length > 0 ? timeData[timeData.length - 1].minutos : 0;

    return (
        <div className="bg-gray-700/20 backdrop-blur-sm rounded-xl p-4  shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-green-500/20 rounded-lg">
                        <FaClock className="text-green-400 text-sm" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Tiempo Total</h3>
                        <p className="text-xs text-gray-400">Por semana</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                        {totalMinutes} min
                    </div>
                    <div className="text-xs text-gray-400">Total mes</div>
                </div>
            </div>

            <div className="h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={timeData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(156, 163, 175, 0.1)"
                            horizontal={true}
                            vertical={false}
                        />

                        <XAxis
                            dataKey="fecha"
                            tick={{
                                fontSize: 9,
                                fill: '#9CA3AF',
                                fontWeight: 500
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={8}
                            tickFormatter={(tick) => new Date(tick).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        />

                        <YAxis
                            tick={{
                                fontSize: 9,
                                fill: '#9CA3AF',
                                fontWeight: 500
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={8}
                            domain={['dataMin - 10', 'dataMax + 10']}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '12px',
                                fontSize: '11px',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                            }}
                            labelStyle={{
                                color: '#E5E7EB',
                                fontWeight: '600',
                                marginBottom: '4px'
                            }}
                            formatter={(value, name) => [
                                <span className="text-green-300 font-semibold">
                                    {value.toLocaleString()} min
                                </span>,
                                'Total Semanal'
                            ]}
                            labelFormatter={(label) => `Semana del ${label}`}
                        />

                        <defs>
                            <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
                            </linearGradient>
                        </defs>

                        <Area
                            type="monotone"
                            dataKey="minutos"
                            stroke="none"
                            fill="url(#timeGradient)"
                        />

                        <Line
                            type="monotone"
                            dataKey="minutos"
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{
                                fill: '#10B981',
                                stroke: 'rgba(17, 24, 39, 0.8)',
                                strokeWidth: 2,
                                r: 4
                            }}
                            activeDot={{
                                r: 6,
                                stroke: '#10B981',
                                strokeWidth: 3,
                                fill: '#FFFFFF'
                            }}
                            filter="drop-shadow(0px 2px 4px rgba(16, 185, 129, 0.3))"
                        />
                    </LineChart>
                </ResponsiveContainer>

                {timeData && timeData.length >= 2 && (
                    <div className="absolute top-2 right-2">
                        {(() => {
                            const lastTwo = timeData.slice(-2);
                            const trend = lastTwo[1].minutos - lastTwo[0].minutos;
                            const isPositive = trend > 0;
                            const isNeutral = trend === 0;

                            if (isNeutral) return null;

                            return (
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                    {isPositive ? '↗' : '↘'}
                                    <span>{Math.abs(trend)}</span>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                <div className="text-center">
                    <div className="text-xs text-gray-400">Promedio</div>
                    <div className="text-sm font-semibold text-white">
                        {averageMinutes} min/sem
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-400">Mejor semana</div>
                    <div className="text-sm font-semibold text-green-400">
                        {bestWeekMinutes} min
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-400">Última semana</div>
                    <div className="text-sm font-semibold text-white">
                        {lastWeekMinutes} min
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeChartCard;
