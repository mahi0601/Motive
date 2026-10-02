import { describe, test, expect } from 'vitest';
import { TASK_CATEGORIES, DEFAULT_TASK_CATEGORY, categoryOptions } from './constants';

describe('task categories', () => {
  test('lead with client-delivery work, and default to "Client work"', () => {
    expect(TASK_CATEGORIES.slice(0, 4)).toEqual(['Client work', 'Internal', 'Admin', 'Sales']);
    expect(DEFAULT_TASK_CATEGORY).toBe('Client work');
    expect(TASK_CATEGORIES).toContain(DEFAULT_TASK_CATEGORY);
  });

  test('personal use is still possible', () => {
    expect(TASK_CATEGORIES).toContain('Personal');
  });

  test('categoryOptions keeps a task\'s older category visible so editing never drops it', () => {
    expect(categoryOptions('Health')).toEqual([...TASK_CATEGORIES, 'Health']);
    expect(categoryOptions('Finance')).toEqual([...TASK_CATEGORIES, 'Finance']);
  });

  test('categoryOptions adds nothing for a current, empty or missing category', () => {
    expect(categoryOptions('Sales')).toEqual(TASK_CATEGORIES);
    expect(categoryOptions('')).toEqual(TASK_CATEGORIES);
    expect(categoryOptions(undefined)).toEqual(TASK_CATEGORIES);
    expect(categoryOptions(null)).toEqual(TASK_CATEGORIES);
  });

  test('categoryOptions returns a new array each time', () => {
    expect(categoryOptions('Health')).not.toBe(TASK_CATEGORIES);
    expect(TASK_CATEGORIES).toHaveLength(5);
  });
});
