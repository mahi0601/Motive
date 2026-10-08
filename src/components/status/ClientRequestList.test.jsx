import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ClientRequestList from './ClientRequestList';

const R = (over) => ({ ref: 'a', title: 'Add a pricing page', state: 'received', scope: null, declineNote: null, createdAt: '2026-10-02T10:00:00Z', ...over });

describe('ClientRequestList allowance', () => {
  const A = (over) => ({ limit: 5, used: 3, extra: 0, resetsOn: '2026-11-01T00:00:00.000Z', ...over });

  test('says how much is used, in words, with the reset date', () => {
    render(<ClientRequestList requests={[R()]} allowance={A()} />);
    expect(screen.getByText(/3 of 5 included requests used this month/i)).toBeInTheDocument();
    expect(screen.getByText(/resets nov 1/i)).toBeInTheDocument();
  });

  test('shows even before the first request', () => {
    render(<ClientRequestList requests={[]} allowance={A({ used: 0 })} />);
    expect(screen.getByText(/0 of 5 included requests used/i)).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  test('counts extra work apart and says it is not counted', () => {
    render(<ClientRequestList requests={[R()]} allowance={A({ extra: 2 })} />);
    expect(screen.getByText(/2 extra work requests this month, not counted above/i)).toBeInTheDocument();
  });

  test('says plainly when it is over, and uses the singular for one', () => {
    const { rerender } = render(<ClientRequestList requests={[R()]} allowance={A({ used: 6 })} />);
    expect(screen.getByText(/6 of 5 included requests used this month \(over the included amount\)/i)).toBeInTheDocument();
    rerender(<ClientRequestList requests={[R()]} allowance={A({ limit: 1, used: 1 })} />);
    expect(screen.getByText(/1 of 1 included request used this month/i)).toBeInTheDocument();
  });

  test('without an allowance there is no summary', () => {
    render(<ClientRequestList requests={[R()]} />);
    expect(screen.queryByText(/included request/i)).not.toBeInTheDocument();
  });
});

describe('ClientRequestList', () => {
  test('renders nothing when there are no requests', () => {
    const { container } = render(<ClientRequestList requests={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  test.each([
    ['received', 'Received'],
    ['planned', 'Planned'],
    ['in_progress', 'In progress'],
    ['done', 'Done'],
    ['declined', 'Not taken on'],
    ['closed', 'Closed'],
  ])('says "%s" in words', (state, label) => {
    render(<ClientRequestList requests={[R({ state })]} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  test('tags extra work, and shows the owner\'s note on a declined request', () => {
    render(<ClientRequestList requests={[R({ ref: 'a', state: 'planned', scope: 'extra' }), R({ ref: 'b', title: 'Login area', state: 'declined', declineNote: 'Happy to quote it separately.' })]} />);
    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText('Extra work')).toBeInTheDocument();
    expect(within(items[1]).getByText(/happy to quote it separately/i)).toBeInTheDocument();
  });
});
