import React, { useState, useEffect } from 'react';
import { ScreenTab, ShapFeatureImportance } from '../types.ts';
import { apiService } from '../apiService.ts';
import { SHAP_IMPORTANCE_DATA, SHAP_WATERFALL_SAMPLE } from '../mockData.ts';
import { Badge } from './ui/Badge.tsx';
import { ChartContainer } from './ui/ChartContainer.tsx';
import { MetricCard } from './ui/MetricCard.tsx';
import { usePageTitle } from '../hooks/usePageTitle.ts';

interface ShapExplainabilityViewProps {
  onNavigate: (tab: ScreenTab) => void;
}

export const ShapExplainabilityView: React.FC<ShapExplainabilityViewProps> = ({ onNavigate }) => {
  usePageTitle('SHAP Causal Explainability');
  const [importance, setImportance] = useState<ShapFeatureImportance[]>(SHAP_IMPORTANCE_DATA);
  const [activeProfile, setActiveProfile] = useState<'persuadable' | 'sure_thing'>('persuadable');

  useEffect(() => {
    let mounted = true;
    apiService.getShapValues().then((res) => {
      if (mounted) {
        setImportance(res.data.importance);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const profileWaterfall = activeProfile === 'persuadable'
    ? SHAP_WATERFALL_SAMPLE
    : {
        customer_id: 'C-00003 (Gold Tier)',
        base_value: 0.052,
        final_cate: 0.012,
        contributions: [
          { feature: 'past_spend = $310.85', value: -0.015, cumulative: 0.037 },
          { feature: 'category_affinity = 0.94', value: +0.012, cumulative: 0.049 },
          { feature: 'recency_days = 6', value: -0.021, cumulative: 0.028 },
          { feature: 'loyalty_tier = Gold', value: -0.016, cumulative: 0.012 },
        ],
      };

  return (
    <div className="flex flex-col gap-6">

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-[#1a2b30] border border-[#bec8ce]/50 dark:border-[#2a3a3f] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#131d20] dark:text-[#e2ecef]">
              SHAP Heterogeneous Treatment Effect Attribution
            </h1>
            <Badge label="TreeSHAP on CATE Residuals" variant="primary" />
          </div>
          <p className="text-xs text-[#475053] dark:text-[#a8b8be] mt-1 font-mono">
            Explaining why individual customers exhibit high or negative treatment sensitivity under DML cross-fitting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('segment-explorer')}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bec8ce]/50 text-xs font-mono hover:bg-[#eaf5f9] dark:hover:bg-[#111e22] text-[#475053] dark:text-[#a8b8be] transition-colors"
          >
            <span>Segment Explorer</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Top Driver of Positive Lift"
          value="past_spend"
          subtitle="+38.4% Relative SHAP Weight"
          icon="insights"
          variant="primary"
        />
        <MetricCard
          label="Top Driver of Cannibalization"
          value="loyalty_tier"
          subtitle="Platinum members convert organically"
          icon="shield"
          variant="warning"
        />
        <MetricCard
          label="Recency Attenuation"
          value="-0.0615"
          subtitle="Mean negative attribution for lapsed"
          icon="history"
        />
        <MetricCard
          label="Mean Absolute SHAP"
          value="0.0438"
          subtitle="Across all 50,000 customers"
          icon="functions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartContainer
          title="Global Feature Importance (|SHAP| on CATE)"
          subtitle="Average magnitude of effect on conditional average treatment effect"
          height="h-80"
        >
          <div className="w-full h-full flex flex-col justify-around py-2">
            {importance.map((item) => (
              <div key={item.feature} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#131d20] dark:text-[#e2ecef]">{item.feature}</span>
                    <Badge
                      label={item.direction === 'positive' ? 'Increases Lift' : 'Decreases Lift'}
                      variant={item.direction === 'positive' ? 'success' : 'danger'}
                    />
                  </div>
                  <span className="text-[#475053] dark:text-[#a8b8be]">
                    {item.mean_abs_shap.toFixed(4)} ({item.relative_weight.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-[#eaf5f9] dark:bg-[#111e22] rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      item.direction === 'positive' ? 'bg-[#006481]' : 'bg-[#2e94b9]'
                    }`}
                    style={{ width: `${item.relative_weight * 2.2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer
          title={`Individual CATE Waterfall — ${profileWaterfall.customer_id}`}
          subtitle={`Base Expected Lift E[τ]: +${(profileWaterfall.base_value * 100).toFixed(1)}% → Individual CATE τ(x): +${(profileWaterfall.final_cate * 100).toFixed(1)}%`}
          height="h-80"
          actions={
            <div className="flex items-center gap-1 bg-[#eaf5f9] dark:bg-[#111e22] p-1 rounded border border-[#bec8ce]/40">
              <button
                onClick={() => setActiveProfile('persuadable')}
                type="button"
                className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                  activeProfile === 'persuadable' ? 'bg-[#006481] text-white' : 'text-[#475053]'
                }`}
              >
                Persuadable
              </button>
              <button
                onClick={() => setActiveProfile('sure_thing')}
                type="button"
                className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                  activeProfile === 'sure_thing' ? 'bg-[#006481] text-white' : 'text-[#475053]'
                }`}
              >
                Sure Thing
              </button>
            </div>
          }
        >
          <div className="w-full h-full flex flex-col justify-around py-2">
            <div className="space-y-3">
              {profileWaterfall.contributions.map((c, idx) => {
                const isPos = c.value >= 0;
                const widthPct = Math.min(100, Math.abs(c.value) * 800);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#131d20] dark:text-[#e2ecef]">{c.feature}</span>
                      <span className={isPos ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {isPos ? `+${(c.value * 100).toFixed(2)}%` : `${(c.value * 100).toFixed(2)}%`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#eaf5f9] dark:bg-[#111e22] h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full ${isPos ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.max(8, widthPct)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#6f787e] w-14 text-right">
                        Σ {(c.cumulative * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {importance.slice(0, 3).map((item) => (
          <div
            key={item.feature}
            className="p-4 rounded-xl border border-[#bec8ce]/50 dark:border-[#2a3a3f] bg-white dark:bg-[#1a2b30] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-bold text-[#006481] dark:text-[#2e94b9]">
                  {item.feature}
                </span>
                <Badge label={`${item.impact_level} Impact`} variant="info" />
              </div>
              <p className="text-xs text-[#475053] dark:text-[#a8b8be] leading-relaxed">
                {item.description}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#bec8ce]/30 flex items-center justify-between text-xs font-mono text-[#6f787e]">
              <span>Direction:</span>
              <span className={item.direction === 'positive' ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                {item.direction.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

