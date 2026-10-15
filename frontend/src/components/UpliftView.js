import React, { useState } from 'react';

export default function UpliftView({ upliftData }) {
  const [discountArm, setDiscountArm] = useState(10);

  const sampleQini = {
    10: {
      fractions: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      dml_qini: [0.0, 52.0, 98.0, 134.0, 162.0, 185.0, 198.0, 204.0, 208.0, 210.0, 210.0],
      naive_qini: [0.0, 18.0, 36.0, 58.0, 82.0, 110.0, 135.0, 160.0, 182.0, 199.0, 210.0],
      random_qini: [0.0, 21.0, 42.0, 63.0, 84.0, 105.0, 126.0, 147.0, 168.0, 189.0, 210.0],
      dml_score: 48.6,
      naive_score: 12.1,
      dml_pehe: 0.034,
      naive_pehe: 0.118,
    },
    20: {
      fractions: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      dml_qini: [0.0, 88.0, 165.0, 230.0, 282.0, 318.0, 342.0, 355.0, 360.0, 362.0, 362.0],
      naive_qini: [0.0, 28.0, 62.0, 104.0, 150.0, 202.0, 245.0, 285.0, 320.0, 345.0, 362.0],
      random_qini: [0.0, 36.2, 72.4, 108.6, 144.8, 181.0, 217.2, 253.4, 289.6, 325.8, 362.0],
      dml_score: 84.2,
      naive_score: 21.4,
      dml_pehe: 0.042,
      naive_pehe: 0.145,
    },
  };

  const activeData = sampleQini[discountArm];
  const maxVal = Math.max(...activeData.dml_qini) * 1.15;
  const svgWidth = 600;
  const svgHeight = 280;
  const pad = 40;

  const getPoints = (series) => {
    return series
      .map((val, idx) => {
        const x = pad + (activeData.fractions[idx] * (svgWidth - 2 * pad));
        const y = svgHeight - pad - ((val / maxVal) * (svgHeight - 2 * pad));
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid-4">
        <div className="kpi-card">
          <div className="kpi-label">DML Qini Score (AUUC)</div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            +{activeData.dml_score}
          </div>
          <div className="kpi-subtext">CausalForestDML</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Naive Baseline Qini</div>
          <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>
            +{activeData.naive_score}
          </div>
          <div className="kpi-subtext">Standard Predictive ML</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">PEHE Accuracy</div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            {activeData.dml_pehe}
          </div>
          <div className="kpi-subtext">
            vs Naive: {activeData.naive_pehe} ({Math.round((1 - activeData.dml_pehe / activeData.naive_pehe) * 100)}% lower error)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Causal Targeting Gain</div>
          <div className="kpi-value" style={{ color: '#a855f7' }}>
            +{Math.round((activeData.dml_score / activeData.naive_score - 1) * 100)}%
          </div>
          <div className="kpi-subtext">Efficiency vs correlation</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="card-title">
              <span>📈</span> Cumulative Qini & Uplift Evaluation Curves
            </div>
            <div className="card-subtitle" style={{ marginBottom: 0 }}>
              Benchmarking EconML Double Machine Learning against naive predictive classifiers and random selection.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Discount Arm:</span>
            <button
              type="button"
              className={`btn ${discountArm === 10 ? '' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => setDiscountArm(10)}
            >
              $10 Promo
            </button>
            <button
              type="button"
              className={`btn ${discountArm === 20 ? '' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => setDiscountArm(20)}
            >
              $20 Promo
            </button>
          </div>
        </div>

        <div style={{ background: 'rgba(9, 13, 22, 0.6)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#10b981' }}></span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>DML Causal Forest (Optimal)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#f59e0b' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Naive Predictive Model</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#64748b' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>Random Targeting Baseline</span>
            </div>
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', maxHeight: '380px' }}>
            <line x1={pad} y1={svgHeight - pad} x2={svgWidth - pad} y2={svgHeight - pad} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1={pad} y1={pad} x2={pad} y2={svgHeight - pad} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

            {[0.2, 0.4, 0.6, 0.8, 1.0].map((frac, idx) => (
              <g key={idx}>
                <line
                  x1={pad + frac * (svgWidth - 2 * pad)}
                  y1={pad}
                  x2={pad + frac * (svgWidth - 2 * pad)}
                  y2={svgHeight - pad}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={pad + frac * (svgWidth - 2 * pad)}
                  y={svgHeight - pad + 18}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(frac * 100)}%
                </text>
              </g>
            ))}

            <polyline
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="4 4"
              points={getPoints(activeData.random_qini)}
            />

            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              points={getPoints(activeData.naive_qini)}
            />

            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="3.5"
              points={getPoints(activeData.dml_qini)}
            />
          </svg>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>Target Population Fraction (sorted by predicted uplift)</span>
            <span>Cumulative Incremental Conversions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
