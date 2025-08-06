import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { FaChartBar } from 'react-icons/fa';

const RepsChartCard = ({ repsData }) => {
    return (
        <div className="bg-gray-700/20 backdrop-blur-sm rounded-xl p-4  shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg">
                        <FaChartBar className="text-purple-400 text-sm" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Repeticiones Totales</h3>
                        <p className="text-xs text-gray-400">Por semana</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">
                        {repsData?.reduce((sum, week) => sum + week.repeticiones, 0) || 0}
                    </div>
                    <div className="text-xs text-gray-400">Total mes</div>
                </div>
            </div>

            <div className="h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={repsData}
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
                                border: '1px solid rgba(168, 85, 247, 0.3)',
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
                                <span className="text-purple-300 font-semibold">
                                    {value.toLocaleString()} reps
                                </span>,
                                'Total Semanal'
                            ]}
                            labelFormatter={(label) => `Semana del ${label}`}
                        />

                        <defs>
                            <linearGradient id="repsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
                                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.05)" />
                            </linearGradient>
                        </defs>

                        <Area
                            type="monotone"
                            dataKey="repeticiones"
                            stroke="none"
                            fill="url(#repsGradient)"
                        />

                        <Line
                            type="monotone"
                            dataKey="repeticiones"
                            stroke="#A855F7"
                            strokeWidth={3}
                            dot={{
                                fill: '#A855F7',
                                stroke: 'rgba(17, 24, 39, 0.8)',
                                strokeWidth: 2,
                                r: 4
                            }}
                            activeDot={{
                                r: 6,
                                stroke: '#A855F7',
                                strokeWidth: 3,
                                fill: '#FFFFFF'
                            }}
                            filter="drop-shadow(0px 2px 4px rgba(168, 85, 247, 0.3))"
                        />
                    </LineChart>
                </ResponsiveContainer>

                {repsData && repsData.length >= 2 && (
                    <div className="absolute top-2 right-2">
                        {(() => {
                            const lastTwo = repsData.slice(-2);
                            const trend = lastTwo[1].repeticiones - lastTwo[0].repeticiones;
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
                        {repsData?.length > 0
                            ? Math.round(repsData.reduce((sum, week) => sum + week.repeticiones, 0) / repsData.length)
                            : 0
                        } reps/sem
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-400">Mejor semana</div>
                    <div className="text-sm font-semibold text-purple-400">
                        {repsData?.length > 0
                            ? Math.max(...repsData.map(w => w.repeticiones))
                            : 0
                        } reps
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-400">Última semana</div>
                    <div className="text-sm font-semibold text-white">
                        {repsData?.length > 0
                            ? repsData[repsData.length - 1].repeticiones
                            : 0
                        } reps
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepsChartCard;
