import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@shared/ui/use-mobile';

interface DailyPoint {
  day: string;
  consumption: number;
}

export function WeeklyConsumptionChart({ points = [] }: { points?: DailyPoint[] }) {
  const isMobile = useIsMobile();
  const data = points;

  // Ajustar altura según dispositivo
  const chartHeight = isMobile ? 200 : 250;
  const margin = isMobile
    ? { top: 5, right: 5, left: -20, bottom: 5 }
    : { top: 5, right: 5, left: 0, bottom: 5 };

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minHeight={chartHeight}
      id="weekly-chart-container"
    >
      <BarChart data={data} margin={margin} id="weekly-bar-chart-svg">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="day"
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
            padding: '8px 12px',
          }}
        />
        <Bar
          dataKey="consumption"
          fill="#3b82f6"
          name="Consumo (m³)"
          radius={[isMobile ? 3 : 4, isMobile ? 3 : 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
