// Loaded once before every test file (see vitest.config.js) — adds jest-dom's
// DOM-specific matchers (toBeInTheDocument, etc.) to Vitest's expect.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Testing Library only registers its automatic cleanup when test globals are
// enabled, and this project runs with `globals: false` — so without this, every
// rendered component stays mounted for the rest of the file and later tests
// find duplicate elements from earlier ones.
afterEach(() => cleanup());
