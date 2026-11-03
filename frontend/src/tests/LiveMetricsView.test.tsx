import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveMetricsView } from '../components/LiveMetricsView';

describe('LiveMetricsView', () => {
  it('renders title and telemetry banner', () => {
    render(<LiveMetricsView onNavigate={() => {}} />);
    expect(screen.getByText('Live Metrics & Operational Health')).toBeTruthy();
    expect(screen.getByText(/Real-time telemetry from CausalForestDML/)).toBeTruthy();
  });

  it('renders category filter buttons', () => {
    render(<LiveMetricsView onNavigate={() => {}} />);
    expect(screen.getByText('ALL')).toBeTruthy();
    expect(screen.getByText('ML')).toBeTruthy();
    expect(screen.getByText('BUSINESS')).toBeTruthy();
    expect(screen.getByText('SYSTEM')).toBeTruthy();
  });
});

