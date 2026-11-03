import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShapExplainabilityView } from '../components/ShapExplainabilityView';

describe('ShapExplainabilityView', () => {
  it('renders SHAP attribution header', () => {
    render(<ShapExplainabilityView onNavigate={() => {}} />);
    expect(screen.getByText('SHAP Heterogeneous Treatment Effect Attribution')).toBeTruthy();
    expect(screen.getByText(/TreeSHAP on CATE Residuals/)).toBeTruthy();
  });

  it('renders top feature drivers', () => {
    render(<ShapExplainabilityView onNavigate={() => {}} />);
    expect(screen.getAllByText('past_spend').length).toBeGreaterThan(0);
    expect(screen.getAllByText('loyalty_tier').length).toBeGreaterThan(0);
  });
});

