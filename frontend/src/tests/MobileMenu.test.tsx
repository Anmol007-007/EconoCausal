import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileMenu } from '../components/MobileMenu';

describe('MobileMenu', () => {
  it('renders menu when open', () => {
    render(
      <MobileMenu
        isOpen={true}
        onClose={() => {}}
        currentTab="upload-pipeline"
        onSelectTab={() => {}}
        onRunPipeline={() => {}}
        onOpenApiDocs={() => {}}
        onOpenNotifications={() => {}}
        onOpenSettings={() => {}}
        isPipelineRunning={false}
        isBackendLive={true}
      />
    );
    expect(screen.getByText('EconoCausal')).toBeTruthy();
    expect(screen.getByText('Causal AI Engine v2.0')).toBeTruthy();
    expect(screen.getByText('CORE PIPELINE')).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <MobileMenu
        isOpen={false}
        onClose={() => {}}
        currentTab="upload-pipeline"
        onSelectTab={() => {}}
        onRunPipeline={() => {}}
        onOpenApiDocs={() => {}}
        onOpenNotifications={() => {}}
        onOpenSettings={() => {}}
        isPipelineRunning={false}
        isBackendLive={true}
      />
    );
    expect(container.querySelector('.fixed')).toBeNull();
  });
});

