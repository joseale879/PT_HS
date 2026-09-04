import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@shared/ui/use-mobile';

interface HourlyPoint { hour: number; averageConsumptionM3: number; }

export function DailyConsumptionChart({ points = [] }: { points?: HourlyPoint[] }) {
  const isMobile = useIsMobile();
  const data = points.map((point) => ({ hour: `${String(point.hour).padStart(2, '0')}:00`, consumption: point.averageConsumptionM3 }));

  // Ajustar altura según dispositivo
  const chartHeight = isMobile ? 200 : 250;
  const margin = isMobile
    ? { top: 5, right: 5, left: -20, bottom: 5 }
    : { top: 5, right: 5, left: 0, bottom: 5 };

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={chartHeight} id="daily-chart-container">
      <AreaChart
        data={data}
        margin={margin}
        id="daily-area-chart-svg"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="hour"
          stroke="#6b7280"
          style={{ fontSize: isMobile ? '10px' : '12px' }}
          tick={{ angle: isMobile ? 45 : 0 }}
          height={isMobile ? 50 : 30}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: isMobile ? '10px' : '12px' }}
          width={isMobile ? 30 : 40}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            fontSize: isMobile ? '12px' : '14px',
            padding: '8px 12px'
          }}
        />
        <Area
          type="monotone"
          dataKey="consumption"
          stroke="#3b82f6"
          strokeWidth={isMobile ? 1.5 : 2}
          fill="#93c5fd"
          fillOpacity={0.3}
          name="Consumo (m³)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
