import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationsPanel } from '../components/NotificationsPanel';

describe('NotificationsPanel', () => {
  it('renders notifications when open', () => {
    render(<NotificationsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('System Notifications')).toBeTruthy();
    expect(screen.getByText(/Model Retraining Check Passed/)).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<NotificationsPanel isOpen={false} onClose={() => {}} />);
    expect(container.querySelector('.fixed')).toBeNull();
  });
});

