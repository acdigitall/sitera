import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  LineChart,
} from 'lucide-react';

interface MonthlyCashflow {
  month: string;
  monthShort: string;
  year: number;
  income: number;  // Gelir (TL)
  expense: number; // Gider (TL)
}

// 12 Aylık Demo / Projeksiyon Nakit Akışı Verisi
const DEMO_CASHFLOW_DATA: MonthlyCashflow[] = [
  { month: 'Ekim 2025', monthShort: 'Eki', year: 2025, income: 48000, expense: 31200 },
  { month: 'Kasım 2025', monthShort: 'Kas', year: 2025, income: 54500, expense: 35800 },
  { month: 'Aralık 2025', monthShort: 'Ara', year: 2025, income: 61000, expense: 39400 },
  { month: 'Ocak 2026', monthShort: 'Oca', year: 2026, income: 68000, expense: 43200 },
  { month: 'Şubat 2026', monthShort: 'Şub', year: 2026, income: 74200, expense: 46900 },
  { month: 'Mart 2026', monthShort: 'Mar', year: 2026, income: 81500, expense: 49800 },
  { month: 'Nisan 2026', monthShort: 'Nis', year: 2026, income: 88000, expense: 53600 },
  { month: 'Mayıs 2026', monthShort: 'May', year: 2026, income: 95400, expense: 57200 },
  { month: 'Haziran 2026', monthShort: 'Haz', year: 2026, income: 102000, expense: 61500 },
  { month: 'Temmuz 2026', monthShort: 'Tem', year: 2026, income: 111000, expense: 65400 },
  { month: 'Ağustos 2026', monthShort: 'Ağu', year: 2026, income: 118500, expense: 69800 },
  { month: 'Eylül 2026', monthShort: 'Eyl', year: 2026, income: 126000, expense: 74500 },
];

export const SuperAdminCashflowChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'6m' | '12m'>('6m');
  const [chartType, setChartType] = useState<'trend' | 'bar'>('trend');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeData = useMemo(() => {
    return timeframe === '6m' ? DEMO_CASHFLOW_DATA.slice(-6) : DEMO_CASHFLOW_DATA;
  }, [timeframe]);

  const totalIncome = useMemo(() => activeData.reduce((s, d) => s + d.income, 0), [activeData]);
  const totalExpense = useMemo(() => activeData.reduce((s, d) => s + d.expense, 0), [activeData]);
  const netCashflow = totalIncome - totalExpense;

  const svgWidth = 680;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const rawMax = Math.max(...activeData.map((d) => Math.max(d.income, d.expense)));
  const yAxisMax = Math.ceil(rawMax / 20000) * 20000;
  const yTicks = [0, yAxisMax * 0.33, yAxisMax * 0.66, yAxisMax];
  const colWidth = chartWidth / activeData.length;

  const generatePoints = (key: 'income' | 'expense') => {
    return activeData.map((d, i) => {
      const x = paddingLeft + i * colWidth + colWidth / 2;
      const y = paddingTop + chartHeight - (d[key] / yAxisMax) * chartHeight;
      return { x, y };
    });
  };

  const incomePoints = useMemo(() => generatePoints('income'), [activeData, yAxisMax]);
  const expensePoints = useMemo(() => generatePoints('expense'), [activeData, yAxisMax]);

  const incomeLinePath = `M ${incomePoints.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const expenseLinePath = `M ${expensePoints.map((p) => `${p.x},${p.y}`).join(' L ')}`;

  const incomeAreaPath = `${incomeLinePath} L ${incomePoints[incomePoints.length - 1].x},${paddingTop + chartHeight} L ${incomePoints[0].x},${paddingTop + chartHeight} Z`;
  const expenseAreaPath = `${expenseLinePath} L ${expensePoints[expensePoints.length - 1].x},${paddingTop + chartHeight} L ${expensePoints[0].x},${paddingTop + chartHeight} Z`;

  const activeHoverItem = hoveredIdx !== null ? activeData[hoveredIdx] : null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between h-full min-h-[380px] select-none">
      {/* 1. Başlık & Kontroller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Platform Nakit Akışı</h3>
            <span className="text-[11px] text-slate-400 font-normal">Tahmini Projeksiyon</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Sistem geneli aidat ve operasyonel harcama dengesi</p>
        </div>

        {/* Buton Kontrolleri */}
        <div className="flex items-center gap-2">
          {/* Çizgi / Sütun */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            <button
              type="button"
              onClick={() => setChartType('trend')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                chartType === 'trend' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChart size={13} />
              <span>Çizgi</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                chartType === 'bar' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={13} />
              <span>Sütun</span>
            </button>
          </div>

          {/* 6A / 12A */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setTimeframe('6m');
                setHoveredIdx(null);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                timeframe === '6m' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Ay
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeframe('12m');
                setHoveredIdx(null);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                timeframe === '12m' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Ay
            </button>
          </div>
        </div>
      </div>

      {/* 2. Kompakt Özet Şeridi */}
      <div className="flex items-center justify-between flex-wrap gap-3 py-2 border-b border-slate-50">
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-slate-500">Tahsilat:</span>
            <span className="font-semibold font-mono text-slate-900">₺{totalIncome.toLocaleString('tr-TR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-500">Gider:</span>
            <span className="font-semibold font-mono text-slate-900">₺{totalExpense.toLocaleString('tr-TR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
            <span className="text-slate-500">Net Fark:</span>
            <span className={`font-semibold font-mono ${netCashflow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {netCashflow >= 0 ? '+' : ''}₺{netCashflow.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {/* Hover Anlık Detay */}
        <div className="h-6 flex items-center text-xs">
          {activeHoverItem ? (
            <div className="flex items-center gap-3 font-mono text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
              <span className="font-bold text-slate-900">{activeHoverItem.monthShort}:</span>
              <span className="text-emerald-700">₺{activeHoverItem.income.toLocaleString('tr-TR')}</span>
              <span className="text-slate-300">/</span>
              <span className="text-rose-600">₺{activeHoverItem.expense.toLocaleString('tr-TR')}</span>
            </div>
          ) : (
            <span className="text-slate-400 text-[11px]">Veri noktalarının üzerine gelin</span>
          )}
        </div>
      </div>

      {/* 3. SVG Grafik */}
      <div className="w-full overflow-x-auto pt-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-52 select-none block"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cfIncomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="cfExpenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Kılavuz Çizgileri */}
          {yTicks.map((val, idx) => {
            const y = paddingTop + chartHeight - (val / yAxisMax) * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fill="#94a3b8"
                >
                  ₺{val >= 1000 ? `${val / 1000}k` : val}
                </text>
              </g>
            );
          })}

          {/* 1. ÇİZGİ / TREND MODU (Kullanıcının talep ettiği temiz çift çizgi) */}
          {chartType === 'trend' && (
            <>
              {/* Alan gölgeleri */}
              <path d={incomeAreaPath} fill="url(#cfIncomeGrad)" />
              <path d={expenseAreaPath} fill="url(#cfExpenseGrad)" />

              {/* Çizgiler */}
              <path
                d={incomeLinePath}
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={expenseLinePath}
                fill="none"
                stroke="#e11d48"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Veri Noktaları ve Kolon Hover Alanları */}
              {activeData.map((d, i) => {
                const ptIncome = incomePoints[i];
                const ptExpense = expensePoints[i];
                const isHovered = hoveredIdx === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover sütun arka planı */}
                    <rect
                      x={paddingLeft + i * colWidth}
                      y={paddingTop}
                      width={colWidth}
                      height={chartHeight}
                      fill={isHovered ? '#0f172a' : 'transparent'}
                      fillOpacity={isHovered ? 0.03 : 0}
                    />

                    {/* İki nokta arasındaki dikey bağlantı çizgisi */}
                    {isHovered && (
                      <line
                        x1={ptIncome.x}
                        y1={Math.min(ptIncome.y, ptExpense.y)}
                        x2={ptIncome.x}
                        y2={Math.max(ptIncome.y, ptExpense.y)}
                        stroke="#cbd5e1"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Gelir Noktası */}
                    <circle
                      cx={ptIncome.x}
                      cy={ptIncome.y}
                      r={isHovered ? 5 : 3.5}
                      fill="#059669"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Gider Noktası */}
                    <circle
                      cx={ptExpense.x}
                      cy={ptExpense.y}
                      r={isHovered ? 5 : 3.5}
                      fill="#e11d48"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* X Ekseni Etiketi */}
                    <text
                      x={ptIncome.x}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={isHovered ? '600' : 'normal'}
                      fill={isHovered ? '#0f172a' : '#64748b'}
                    >
                      {d.monthShort}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* 2. SÜTUN MODU */}
          {chartType === 'bar' &&
            activeData.map((d, i) => {
              const xBase = paddingLeft + i * colWidth;
              const isHovered = hoveredIdx === i;

              const barWidth = Math.min(18, colWidth * 0.3);
              const gap = 3;
              const totalBarGroupWidth = barWidth * 2 + gap;
              const groupStartX = xBase + (colWidth - totalBarGroupWidth) / 2;

              const incomeHeight = (d.income / yAxisMax) * chartHeight;
              const incomeY = paddingTop + chartHeight - incomeHeight;

              const expenseHeight = (d.expense / yAxisMax) * chartHeight;
              const expenseY = paddingTop + chartHeight - expenseHeight;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  {isHovered && (
                    <rect
                      x={xBase}
                      y={paddingTop}
                      width={colWidth}
                      height={chartHeight}
                      fill="#0f172a"
                      fillOpacity="0.03"
                      rx="4"
                    />
                  )}

                  {/* Gelir Çubuğu */}
                  <rect
                    x={groupStartX}
                    y={incomeY}
                    width={barWidth}
                    height={Math.max(3, incomeHeight)}
                    fill="#059669"
                    rx="2"
                    opacity={isHovered ? 1 : 0.85}
                  />

                  {/* Gider Çubuğu */}
                  <rect
                    x={groupStartX + barWidth + gap}
                    y={expenseY}
                    width={barWidth}
                    height={Math.max(3, expenseHeight)}
                    fill="#e11d48"
                    rx="2"
                    opacity={isHovered ? 1 : 0.85}
                  />

                  {/* X Ekseni Etiketi */}
                  <text
                    x={xBase + colWidth / 2}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={isHovered ? '600' : 'normal'}
                    fill={isHovered ? '#0f172a' : '#64748b'}
                  >
                    {d.monthShort}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>
    </div>
  );
};
