import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useIsActiveRoute = (href: string) => {
  const location = useLocation();

  return useMemo(() => {
    if (location.pathname === '/' && href === '/') return true;
    if (href !== '/') return location.pathname.startsWith(href);
    return false;
  }, [location.pathname, href]);
};
