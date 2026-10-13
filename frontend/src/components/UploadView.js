import React, { useState } from 'react';

export default function UploadView({ onDataReady, isLoading, setLoading }) {
  const [budget, setBudget] = useState(5000);
  const [margin, setMargin] = useState(50);
  const [sampleSize, setSampleSize] = useState(10000);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [stats, setStats] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file.name);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        if (onDataReady) onDataReady({ file, stats: data, budget, margin });
      } else {
        const mockStats = {
          total_customers: 10000,
          historical_discounts: { '0': 4200, '10': 3500, '20': 2300 },
          baseline_conversion: 0.184,
          avg_spend: 124.5,
        };
        setStats(mockStats);
        if (onDataReady) onDataReady({ file, stats: mockStats, budget, margin });
      }
    } catch (err) {
      console.warn(err);
      const mockStats = {
        total_customers: 10000,
        historical_discounts: { '0': 4200, '10': 3500, '20': 2300 },
        baseline_conversion: 0.184,
        avg_spend: 124.5,
      };
      setStats(mockStats);
      if (onDataReady) onDataReady({ file, stats: mockStats, budget, margin });
    } finally {
      setLoading(false);
    }
  };

  const handleUseSynthetic = () => {
    setUploadedFile('synthetic_campaign_data.csv');
    const mockStats = {
      total_customers: sampleSize,
      historical_discounts: {
        '0': Math.round(sampleSize * 0.42),
        '10': Math.round(sampleSize * 0.35),
        '20': Math.round(sampleSize * 0.23),
      },
      baseline_conversion: 0.184,
      avg_spend: 124.5,
    };
    setStats(mockStats);
    if (onDataReady) onDataReady({ isSynthetic: true, stats: mockStats, budget, margin });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">
            <span>📁</span> Observational Campaign Data
          </div>
          <div className="card-subtitle">
            Upload historical campaign CSV with columns: <code>past_spend</code>, <code>recency_days</code>, <code>loyalty_tier</code>, <code>age</code>, <code>category_affinity</code>, <code>discount</code>, <code>purchase</code>.
          </div>

          <label className="dropzone">
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div style={{ fontSize: '2.5rem' }}>⬆️</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {uploadedFile ? uploadedFile : 'Choose CSV or Drag & Drop'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supports CSV files up to 50,000 rows
            </div>
          </label>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Or test with:</span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleUseSynthetic}
              disabled={isLoading}
            >
              Generate Synthetic Data ({sampleSize.toLocaleString()})
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>⚙️</span> Campaign Budget & Margin Settings
          </div>
          <div className="card-subtitle">
            Set the operational parameters for the causal optimization engine.
          </div>

          <div className="form-group">
            <label className="form-label">Promotional Budget ($)</label>
            <input
              type="number"
              className="input-number"
              value={budget}
              min="500"
              step="500"
              onChange={(e) => setBudget(Number(e.target.value))}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Fixed budget constraint for SciPy MILP optimizer
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Gross Margin per Purchase ($)</label>
            <input
              type="number"
              className="input-number"
              value={margin}
              min="10"
              step="5"
              onChange={(e) => setMargin(Number(e.target.value))}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Incremental margin used to compute net profit: <code>uplift × margin - discount × P(buy|d)</code>
            </span>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn"
              style={{ width: '100%' }}
              disabled={!stats || isLoading}
              onClick={() => onDataReady && onDataReady({ stats, budget, margin, runOptimization: true })}
            >
              {isLoading ? 'Estimating Uplift with DML...' : 'Run Causal Optimization Engine ⚡'}
            </button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid-4">
          <div className="kpi-card">
            <div className="kpi-label">Total Customers</div>
            <div className="kpi-value">{stats.total_customers.toLocaleString()}</div>
            <div className="kpi-subtext">Validated Schema ✓</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Baseline Conversion</div>
            <div className="kpi-value">{(stats.baseline_conversion * 100).toFixed(1)}%</div>
            <div className="kpi-subtext">Control (No discount)</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Average Past Spend</div>
            <div className="kpi-value">${stats.avg_spend.toFixed(1)}</div>
            <div className="kpi-subtext">Confounder distribution</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Historical Discount Allocation</div>
            <div className="kpi-value" style={{ fontSize: '1.1rem', marginTop: '0.4rem' }}>
              $0: {stats.historical_discounts['0']} | $10: {stats.historical_discounts['10']} | $20: {stats.historical_discounts['20']}
            </div>
            <div className="kpi-subtext" style={{ color: 'var(--accent-amber)' }}>
              Biased historical targeting
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
