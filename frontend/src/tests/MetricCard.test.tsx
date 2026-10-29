import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../components/ui/MetricCard';

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="AUQC" value="0.412" unit="score" />);
    expect(screen.getByText('AUQC')).toBeTruthy();
    expect(screen.getByText('0.412')).toBeTruthy();
  });

  it('shows loading skeleton when loading=true', () => {
    const { container } = render(<MetricCard label="Test" value="0" loading />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});

