import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoiSimulatorView } from '../components/RoiSimulatorView';

describe('RoiSimulatorView', () => {
  it('renders simulator title and initial metrics', () => {
    render(<RoiSimulatorView onNavigate={() => {}} totalBudget={5000} unitMargin={45} />);
    expect(screen.getByText('Promotional Campaign ROI & Scenario Planner')).toBeTruthy();
    expect(screen.getByText('Simulated Net Incremental Profit')).toBeTruthy();
    expect(screen.getByText('Projected Campaign ROI')).toBeTruthy();
  });

  it('renders strategy selection radios', () => {
    render(<RoiSimulatorView onNavigate={() => {}} totalBudget={5000} unitMargin={45} />);
    expect(screen.getByText(/Persuadables Only/)).toBeTruthy();
    expect(screen.getByText(/Top Decile Uplift Rank/)).toBeTruthy();
  });
});

