import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/ui/Badge';

describe('Badge', () => {
  it('renders label', () => {
    render(<Badge label="PASSED" variant="success" />);
    expect(screen.getByText('PASSED')).toBeTruthy();
  });

  it('renders dot when dot=true', () => {
    const { container } = render(<Badge label="LIVE" variant="primary" dot />);
    expect(container.querySelector('.rounded-full')).toBeTruthy();
  });
});

