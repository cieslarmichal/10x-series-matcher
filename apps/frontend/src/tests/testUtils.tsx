import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContextProvider } from '@/context/AuthContextProvider';

/**
 * Test Utilities for Frontend Unit Tests
 *
 * Provides custom render function with common providers
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withRouter?: boolean;
  withAuth?: boolean;
}

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions) {
  const { withRouter = true, withAuth = true, ...renderOptions } = options || {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    let wrapped = children;

    if (withAuth) {
      wrapped = <AuthContextProvider>{wrapped}</AuthContextProvider>;
    }

    if (withRouter) {
      wrapped = <BrowserRouter>{wrapped}</BrowserRouter>;
    }

    return <>{wrapped}</>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock API response helper
 */
export function createMockResponse<T>(data: T, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  } as Response;
}

/**
 * Mock API error helper
 */
export function createMockError(message: string, status = 500) {
  return {
    ok: false,
    status,
    json: async () => ({ message }),
    text: async () => JSON.stringify({ message }),
    headers: new Headers(),
  } as Response;
}

/**
 * Wait for async operations
 */
export function waitForAsync(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Re-export everything from Testing Library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
