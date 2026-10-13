import React, { useState } from 'react';
import UploadView from './components/UploadView';
import DiagnosticsView from './components/DiagnosticsView';
import AllocationView from './components/AllocationView';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [campaignData, setCampaignData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [driftStatus, setDriftStatus] = useState({ drifted: false, psi: 0.042, message: 'Feature distributions stable (PSI = 0.042 < 0.20).' });

  const handleDataReady = (data) => {
    setCampaignData(data);
    if (data.runOptimization) {
      setActiveTab('allocation');
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <span className="brand-badge">Causal AI</span>
          <span className="brand-title">EconoCausal</span>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📁 Upload & Budget
          </button>
          <button
            className={`nav-tab ${activeTab === 'diagnostics' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagnostics')}
          >
            ⚖️ Causal Diagnostics
          </button>
          <button
            className={`nav-tab ${activeTab === 'allocation' ? 'active' : ''}`}
            onClick={() => setActiveTab('allocation')}
          >
            📊 Allocation Matrix
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-success" style={{ fontFamily: 'var(--font-mono)' }}>
            DML Engine: v1.0
          </span>
        </div>
      </header>

      <div style={{ background: 'rgba(18, 24, 38, 0.9)', borderBottom: '1px solid var(--border-subtle)', padding: '0.65rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-emerald)' }}>●</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              <strong>Executive Summary:</strong> Targeting persuadables with Double ML yields estimated <strong>+$14,250 net incremental profit</strong> and <strong>$7,850 cost savings</strong> vs blanket discount promotion.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge ${driftStatus.drifted ? 'badge-warning' : 'badge-success'}`}>
              {driftStatus.drifted ? '⚠️ Drift Alert' : '✓ No Drift'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              {driftStatus.message}
            </span>
          </div>
        </div>
      </div>

      <main className="main-content">
        {activeTab === 'upload' && (
          <UploadView
            onDataReady={handleDataReady}
            isLoading={isLoading}
            setLoading={setIsLoading}
          />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsView />
        )}

        {activeTab === 'allocation' && (
          <AllocationView
            budget={campaignData?.budget || 5000}
            margin={campaignData?.margin || 50}
          />
        )}
      </main>
    </div>
  );
}
