import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskForm from './TaskForm';

// The attachments, comments, subtasks and timer panels only matter for a saved
// task and make their own network calls; this file is about the category chips.
vi.mock('../collab/CommentSection', () => ({ default: () => null }));
vi.mock('./SubtaskList', () => ({ default: () => null }));
vi.mock('../collab/AttachmentList', () => ({ default: () => null }));
vi.mock('./TaskTimer', () => ({ default: () => null }));

const chip = (name) => screen.getByRole('button', { name });

describe('TaskForm categories', () => {
  test('a new task defaults to "Client work"', () => {
    render(<TaskForm onSubmit={() => {}} />);
    expect(chip('Client work')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Personal')).toHaveAttribute('aria-pressed', 'false');
  });

  test('offers the agency categories', () => {
    render(<TaskForm onSubmit={() => {}} />);
    for (const c of ['Client work', 'Internal', 'Admin', 'Sales']) expect(chip(c)).toBeInTheDocument();
  });

  test('submits the default category without the user touching it', () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Send the proposal' } });
    fireEvent.submit(screen.getByLabelText(/title/i).closest('form'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Send the proposal', category: 'Client work' }));
  });

  test('editing a task with an older category keeps that category selected and saveable', () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} initialData={{ title: 'Run 5k', category: 'Health' }} />);
    expect(chip('Health')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.submit(screen.getByLabelText(/title/i).closest('form'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ category: 'Health' }));
  });

  test('picking another category changes what is saved', () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Invoice' } });
    fireEvent.click(chip('Admin'));
    fireEvent.submit(screen.getByLabelText(/title/i).closest('form'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ category: 'Admin' }));
  });
});
