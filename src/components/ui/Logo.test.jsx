import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Logo, { LogoMark } from './Logo';
import { MARK, WORDMARK } from '../../config/brandMark';

describe('LogoMark', () => {
  test('is an accessible image named "Motive" at the requested size', () => {
    render(<LogoMark size={48} />);
    const svg = screen.getByRole('img', { name: 'Motive' });
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
    expect(svg).toHaveAttribute('viewBox', `0 0 ${MARK.viewBox} ${MARK.viewBox}`);
  });

  test('draws exactly the shared geometry (check + arrowhead)', () => {
    const { container } = render(<LogoMark />);
    const paths = [...container.querySelectorAll('path')].map((p) => p.getAttribute('d'));
    expect(paths).toEqual([MARK.check, MARK.head]);
    for (const p of container.querySelectorAll('path')) {
      expect(p).toHaveAttribute('stroke-width', String(MARK.strokeWidth));
      expect(p).toHaveAttribute('stroke-linecap', 'round');
    }
  });

  test('every instance gets its own gradient id, and its tile points at it', () => {
    const { container } = render(
      <>
        <LogoMark />
        <LogoMark />
      </>
    );
    const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    const fills = [...container.querySelectorAll('rect')].map((r) => r.getAttribute('fill'));
    expect(fills).toEqual(ids.map((id) => `url(#${id})`));
  });

  test('decorative hides it from assistive tech and drops the image role', () => {
    const { container } = render(<LogoMark decorative />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Logo', () => {
  test('shows the wordmark once, and does not announce "Motive" twice', () => {
    render(<Logo />);
    expect(screen.getAllByText(WORDMARK.text)).toHaveLength(1);
    // The mark is decorative next to visible text, so there is no separate image.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('without text the mark carries the accessible name', () => {
    render(<Logo showText={false} />);
    expect(screen.queryByText(WORDMARK.text)).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Motive' })).toBeInTheDocument();
  });

  test('wordmark size and gap scale with the mark, using the shared lockup values', () => {
    const { container } = render(<Logo size={40} />);
    const wrapper = container.firstChild;
    const word = screen.getByText(WORDMARK.text);
    expect(wrapper.style.gap).toBe(`${40 * WORDMARK.gapRatio}px`);
    expect(word.style.fontSize).toBe(`${40 * WORDMARK.sizeRatio}px`);
    expect(word.style.fontWeight).toBe(String(WORDMARK.weight));
    expect(word.style.letterSpacing).toBe(`${WORDMARK.letterSpacingEm}em`);
  });

  test('tone="light" gives a white wordmark for the petrol panel; the default follows the theme', () => {
    const { rerender } = render(<Logo tone="light" />);
    expect(screen.getByText(WORDMARK.text)).toHaveClass('text-white');
    expect(screen.getByText(WORDMARK.text)).not.toHaveClass('dark:text-dark-text');

    rerender(<Logo />);
    expect(screen.getByText(WORDMARK.text)).toHaveClass('text-light-text', 'dark:text-dark-text');
    expect(screen.getByText(WORDMARK.text)).not.toHaveClass('text-white');
  });

  test('passes className through to the wrapper', () => {
    const { container } = render(<Logo className="mb-8" />);
    expect(container.firstChild).toHaveClass('mb-8', 'inline-flex');
  });
});
