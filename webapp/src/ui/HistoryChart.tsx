interface HistoryChartProps {
  values: number[];
  max: number;
  width?: number;
  height?: number;
}

export function HistoryChart({ values, max, width = 220, height = 48 }: HistoryChartProps) {
  if (values.length === 0) {
    return <svg width={width} height={height} className="history-chart" />;
  }
  const safeMax = Math.max(1, max);
  const recent = values.slice(-100);
  const stepX = width / Math.max(1, recent.length - 1);
  const points = recent
    .map((v, i) => {
      const x = i * stepX;
      const y = height - (Math.min(v, safeMax) / safeMax) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="history-chart" viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth={1.5} />
    </svg>
  );
}
