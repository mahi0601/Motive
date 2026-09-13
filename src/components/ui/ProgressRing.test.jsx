import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressRing from './ProgressRing';

// Proves the React Testing Library harness itself works end to end (jsdom +
// @testing-library/react + framer-motion rendering), not just the
// pure-function test runner — see PLAN's testing-strategy section. Picked
// for having no network/context dependency, unlike almost everything else
// in this app.
describe('ProgressRing', () => {
  test('renders the rounded percentage as text', () => {
    render(<ProgressRing progress={62.7} />);
    expect(screen.getByText('63%')).toBeInTheDocument();
  });

  test('renders at the requested size', () => {
    const { container } = render(<ProgressRing progress={40} size={80} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '80');
  });

  test('0% and 100% render without throwing (the boundary cases for the stroke-dashoffset math)', () => {
    expect(() => render(<ProgressRing progress={0} />)).not.toThrow();
    expect(() => render(<ProgressRing progress={100} />)).not.toThrow();
  });
});
