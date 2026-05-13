import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import TaskRow from './TaskRow.svelte';
import type { Task } from '../lib/types';

// Mock the API module so we don't hit the network
vi.mock('../lib/api', () => ({
  api: {
    tasks: {
      toggle: vi.fn(),
    },
  },
}));

import { api } from '../lib/api';

const baseTask: Task = {
  id: 'task-1',
  title: 'Check sound levels',
  slug: null,
  completed: false,
  sectionId: 'sec-1',
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TaskRow', () => {
  it('renders the task title', () => {
    const { getByText } = render(TaskRow, { props: { task: baseTask } });
    expect(getByText('Check sound levels')).toBeInTheDocument();
  });

  it('shows no strike-through when incomplete', () => {
    const { getByText } = render(TaskRow, { props: { task: baseTask } });
    const title = getByText('Check sound levels');
    expect(title.className).not.toContain('line-through');
  });

  it('shows strike-through when completed', () => {
    const completedTask = { ...baseTask, completed: true };
    const { getByText } = render(TaskRow, { props: { task: completedTask } });
    const title = getByText('Check sound levels');
    expect(title.className).toContain('line-through');
  });

  it('calls api.tasks.toggle and invokes onToggle callback on click', async () => {
    const toggledTask = { ...baseTask, completed: true };
    vi.mocked(api.tasks.toggle).mockResolvedValue(toggledTask);

    const onToggle = vi.fn();
    const { getByRole } = render(TaskRow, { props: { task: baseTask, onToggle } });

    const button = getByRole('button');
    await fireEvent.click(button);

    await waitFor(() => {
      expect(api.tasks.toggle).toHaveBeenCalledWith('task-1');
      expect(onToggle).toHaveBeenCalledWith('task-1', true);
    });
  });

  it('disables the button while the toggle is pending', async () => {
    // Never resolve so we can inspect the pending state
    vi.mocked(api.tasks.toggle).mockReturnValue(new Promise(() => {}));

    const { getByRole } = render(TaskRow, { props: { task: baseTask } });
    const button = getByRole('button');

    await fireEvent.click(button);

    expect(button).toBeDisabled();
  });
});
