import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalSearch } from '../components/GlobalSearch';

describe('GlobalSearch', () => {
  it('renders search input when open', () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={() => {}}
        onSelectTab={() => {}}
        onRunPipeline={() => {}}
        onOpenApiDocs={() => {}}
        onOpenExportModal={() => {}}
      />
    );
    expect(screen.getByPlaceholderText(/Search views, models, and actions/)).toBeTruthy();
    expect(screen.getByText('EconoCausal Omnisearch v2.0')).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <GlobalSearch
        isOpen={false}
        onClose={() => {}}
        onSelectTab={() => {}}
        onRunPipeline={() => {}}
        onOpenApiDocs={() => {}}
        onOpenExportModal={() => {}}
      />
    );
    expect(container.querySelector('input')).toBeNull();
  });
});

