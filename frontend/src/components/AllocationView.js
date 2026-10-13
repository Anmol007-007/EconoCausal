import React, { useState } from 'react';

export default function AllocationView({ allocationData, budget = 5000, margin = 50 }) {
  const [filterDiscount, setFilterDiscount] = useState('ALL');
  const [searchId, setSearchId] = useState('');

  const sampleRows = allocationData?.allocations || [
    { customer_id: 1042, past_spend: 42.5, loyalty_tier: 'Bronze', recommended_discount: 20, uplift: 0.231, p_buy: 0.48, profit_contribution: 1.95 },
    { customer_id: 1043, past_spend: 38.0, loyalty_tier: 'Bronze', recommended_discount: 10, uplift: 0.142, p_buy: 0.35, profit_contribution: 3.60 },
    { customer_id: 1044, past_spend: 480.0, loyalty_tier: 'Gold', recommended_discount: 0, uplift: 0.012, p_buy: 0.72, profit_contribution: 0.00 },
    { customer_id: 1045, past_spend: 55.0, loyalty_tier: 'Silver', recommended_discount: 10, uplift: 0.118, p_buy: 0.39, profit_contribution: 2.00 },
    { customer_id: 1046, past_spend: 620.0, loyalty_tier: 'Gold', recommended_discount: 0, uplift: 0.008, p_buy: 0.81, profit_contribution: 0.00 },
    { customer_id: 1047, past_spend: 64.0, loyalty_tier: 'Bronze', recommended_discount: 20, uplift: 0.215, p_buy: 0.44, profit_contribution: 1.95 },
    { customer_id: 1048, past_spend: 110.0, loyalty_tier: 'Silver', recommended_discount: 10, uplift: 0.095, p_buy: 0.42, profit_contribution: 0.55 },
    { customer_id: 1049, past_spend: 310.0, loyalty_tier: 'Silver', recommended_discount: 0, uplift: 0.025, p_buy: 0.65, profit_contribution: 0.00 },
  ];

  const totalSpent = allocationData?.total_spent || 4920;
  const expectedProfit = allocationData?.expected_profit || 14250;
  const savingsVsBlanket = allocationData?.savings_vs_blanket || 7850;
  const incrementalBuyers = allocationData?.incremental_buyers || 412;

  const filteredRows = sampleRows.filter((row) => {
    const matchesDiscount = filterDiscount === 'ALL' || row.recommended_discount.toString() === filterDiscount;
    const matchesId = !searchId || row.customer_id.toString().includes(searchId);
    return matchesDiscount && matchesId;
  });

  const exportCSV = () => {
    const headers = ['customer_id', 'past_spend', 'loyalty_tier', 'recommended_discount', 'uplift', 'p_buy', 'profit_contribution'];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...filteredRows.map((r) => headers.map((h) => r[h]).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'econocausal_allocation_matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid-4">
        <div className="kpi-card">
          <div className="kpi-label">Optimized Budget Spent</div>
          <div className="kpi-value">${totalSpent.toLocaleString()}</div>
          <div className="kpi-subtext">Within ${budget.toLocaleString()} cap</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Expected Net Profit</div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            +${expectedProfit.toLocaleString()}
          </div>
          <div className="kpi-subtext">Margin: ${margin}/purchase</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Savings vs Blanket</div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            ${savingsVsBlanket.toLocaleString()}
          </div>
          <div className="kpi-subtext">Eliminated discount waste</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Incremental Conversions</div>
          <div className="kpi-value">+{incrementalBuyers}</div>
          <div className="kpi-subtext">Persuadable buyers</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="card-title">
              <span>📊</span> Customer Allocation Matrix
            </div>
            <div className="card-subtitle" style={{ marginBottom: 0 }}>
              SciPy MILP optimal discount assignment targeting customers with highest incremental ROI.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search Customer ID..."
              className="input-text"
              style={{ width: '180px', padding: '0.5rem 0.75rem' }}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />

            <select
              value={filterDiscount}
              onChange={(e) => setFilterDiscount(e.target.value)}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <option value="ALL">All Discounts</option>
              <option value="0">$0 (No Promo)</option>
              <option value="10">$10 Promo</option>
              <option value="20">$20 Promo</option>
            </select>

            <button type="button" className="btn btn-secondary" onClick={exportCSV} style={{ padding: '0.5rem 1rem' }}>
              📥 Export CSV
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Past Spend</th>
                <th>Loyalty Tier</th>
                <th>Assigned Discount</th>
                <th>Estimated Uplift (ITE)</th>
                <th>Conversion P(buy|d)</th>
                <th>Incremental Profit</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>#{row.customer_id}</td>
                  <td>${row.past_spend.toFixed(2)}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background:
                          row.loyalty_tier === 'Gold'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : row.loyalty_tier === 'Silver'
                            ? 'rgba(148, 163, 184, 0.2)'
                            : 'rgba(180, 83, 9, 0.2)',
                        color:
                          row.loyalty_tier === 'Gold'
                            ? '#fcd34d'
                            : row.loyalty_tier === 'Silver'
                            ? '#cbd5e1'
                            : '#f97316',
                      }}
                    >
                      {row.loyalty_tier}
                    </span>
                  </td>
                  <td>
                    {row.recommended_discount === 20 && (
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>$20 Discount</span>
                    )}
                    {row.recommended_discount === 10 && (
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>$10 Discount</span>
                    )}
                    {row.recommended_discount === 0 && (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>$0 (Holdout)</span>
                    )}
                  </td>
                  <td style={{ color: row.uplift > 0.1 ? 'var(--accent-emerald)' : 'var(--text-secondary)', fontWeight: 600 }}>
                    +{(row.uplift * 100).toFixed(1)}%
                  </td>
                  <td>{(row.p_buy * 100).toFixed(1)}%</td>
                  <td style={{ color: row.profit_contribution > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 700 }}>
                    {row.profit_contribution > 0 ? `+$${row.profit_contribution.toFixed(2)}` : '$0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
