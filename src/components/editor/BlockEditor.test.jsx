import React from 'react';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';

// The real Block is a contentEditable surface; here it only exposes the editor's callbacks.
vi.mock('./Block', () => ({
  default: ({ block, onChange, onConvert, onToggleCheck }) => (
    <div data-testid={`block-${block.id}`} data-type={block.type} data-position={block.position}>
      <button onClick={() => onChange(block.id, { text: '#', html: '#' })}>type-{block.id}</button>
      <button onClick={() => onConvert(block.id, 'heading1')}>convert-{block.id}</button>
      <button onClick={() => onToggleCheck(block.id, true)}>check-{block.id}</button>
    </div>
  ),
}));
vi.mock('./SlashMenu', () => ({ default: () => null }));
vi.mock('../../utils/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
vi.mock('../../services/blockService', () => ({
  getBlocks: vi.fn(),
  createBlock: vi.fn(),
  updateBlock: vi.fn(() => Promise.resolve({})),
  deleteBlock: vi.fn(),
  reorderBlocks: vi.fn(() => Promise.resolve({})),
}));

import BlockEditor from './BlockEditor';
import { getBlocks, updateBlock } from '../../services/blockService';

const block = (id, position, extra = {}) => ({ id, type: 'paragraph', position, parentBlockId: null, content: { text: '' }, ...extra });

describe('BlockEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  test('a convert right after typing is not overwritten by the typing save that was still waiting', async () => {
    getBlocks.mockResolvedValue({ data: { blocks: [block('a', 0)] } });
    render(<BlockEditor pageId="p1" />);
    await screen.findByTestId('block-a');

    act(() => screen.getByText('type-a').click());
    act(() => screen.getByText('convert-a').click());
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const saves = updateBlock.mock.calls.map(([, patch]) => patch);
    expect(saves).toEqual([{ type: 'heading1', content: { text: '' } }]); // the stale { text: '#' } never lands
  });

  test('a checkbox toggle right after typing saves once, with the typed text', async () => {
    getBlocks.mockResolvedValue({ data: { blocks: [block('a', 0, { type: 'todo' })] } });
    render(<BlockEditor pageId="p1" />);
    await screen.findByTestId('block-a');

    act(() => screen.getByText('type-a').click());
    act(() => screen.getByText('check-a').click());
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(updateBlock).toHaveBeenCalledTimes(1);
    expect(updateBlock.mock.calls[0][1]).toEqual({ content: { text: '#', html: '#', checked: true } });
  });

  test('a page that cannot be loaded says so instead of loading forever', async () => {
    getBlocks.mockRejectedValue(new Error('403'));
    render(<BlockEditor pageId="p1" />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not be loaded/i));
  });
});
