'use client';

/**
 * Dashboard Charts component for the Bucki application.
 * Contains reusable chart configurations and components.
 * 
 * @module components/charts/DashboardCharts
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

/**
 * Color palette for charts.
 * Emerald-based colors to match the app theme.
 */
export const CHART_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

/**
 * Format currency for chart tooltips.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for chart tooltips.
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Custom tooltip component for charts.
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  formatter?: (value: number) => string;
}

export function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload) return null;

  return (
    <div className="bg-card border rounded-lg shadow-lg p-3">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

/**
 * Props for the CashflowChart component.
 */
interface CashflowChartProps {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
    cashflow: number;
  }>;
}

/**
 * Cashflow bar chart component.
 */
export function CashflowChart({ data }: CashflowChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
        <Legend />
        <Bar dataKey="income" name="Einnahmen" fill={CHART_COLORS[0]} />
        <Bar dataKey="expenses" name="Ausgaben" fill={CHART_COLORS[3]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Props for the PortfolioDistributionChart component.
 */
interface PortfolioDistributionChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

/**
 * Portfolio distribution pie chart component.
 */
export function PortfolioDistributionChart({ data }: PortfolioDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Props for the ForecastChart component.
 */
interface ForecastChartProps {
  data: Array<{
    year: number;
    propertyValue: number;
    remainingDebt: number;
    equity: number;
    cumulativeCashflow: number;
  }>;
}

/**
 * Financial forecast line chart component.
 */
export function ForecastChart({ data }: ForecastChartProps) {
  const chartData = data.map((d) => ({
    year: d.year,
    Immobilienwert: d.propertyValue,
    Eigenkapital: d.equity,
    Restschuld: d.remainingDebt,
    KumulierterCashflow: d.cumulativeCashflow,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="year" className="text-xs" />
        <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="Immobilienwert" 
          stroke={CHART_COLORS[0]} 
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="Eigenkapital" 
          stroke={CHART_COLORS[1]} 
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="Restschuld" 
          stroke={CHART_COLORS[3]} 
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Props for the DepreciationChart component.
 */
interface DepreciationChartProps {
  data: Array<{
    category: string;
    amount: number;
    color: string;
  }>;
}

/**
 * Depreciation by category chart component.
 */
export function DepreciationChart({ data }: DepreciationChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" className="text-xs" tickFormatter={(v) => formatCurrency(v)} />
        <YAxis type="category" dataKey="category" className="text-xs" width={80} />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Bar dataKey="amount" name="Monatliche AfA" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const DashboardCharts = {
  CHART_COLORS,
  CashflowChart,
  PortfolioDistributionChart,
  ForecastChart,
  DepreciationChart,
};

export default DashboardCharts;
