import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));

    expect(result.current).toBe('test');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });

    expect(result.current).toBe('initial');

    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 600 },
    );
  });

  it('should cancel previous debounce on rapid changes', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'first', delay: 500 },
    });

    rerender({ value: 'second', delay: 500 });
    rerender({ value: 'third', delay: 500 });
    rerender({ value: 'final', delay: 500 });

    expect(result.current).toBe('first');

    await waitFor(
      () => {
        expect(result.current).toBe('final');
      },
      { timeout: 600 },
    );
  });
});
