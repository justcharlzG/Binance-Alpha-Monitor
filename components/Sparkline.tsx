import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineProps {
  data: { value: number }[]; // 图表数据源
  color?: string;            // 线条颜色
  width?: number;            // 容器宽度
  height?: number;           // 容器高度
}

/**
 * Sparkline 组件
 * 用于在表格中展示微型的趋势折线图
 */
const Sparkline: React.FC<SparklineProps> = ({ data, color = "#10b981", width = 120, height = 40 }) => {
  // 如果没有数据，显示一个占位符骨架屏效果
  if (!data || data.length === 0) return <div className="w-[120px] h-[40px] bg-gray-800/30 rounded animate-pulse" />;

  // 简单的逻辑判断：如果最后一个点大于第一个点，认为是上涨趋势（虽然颜色可以通过props覆盖）
  const isPositive = data.length > 1 ? data[data.length - 1].value >= data[0].value : true;
  const strokeColor = color || (isPositive ? "#10b981" : "#ef4444");

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {/* 隐藏 Y 轴，让线条自适应高度填满容器 */}
          <YAxis domain={['auto', 'auto']} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false} // 禁用动画以提高列表渲染性能
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;