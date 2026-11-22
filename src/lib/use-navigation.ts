'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const destinations = new Set(['dashboard', 'accounts', 'transactions', 'recurring', 'goals', 'budgets', 'projects', 'simulator', 'settings']);
type Route = { page: string; selectedBudget: string | null };
function readRoute(): Route {
  const [page, id] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (destinations.has(page)) return { page, selectedBudget: page === 'budgets' && /^[a-f0-9-]{36}$/.test(id || '') ? id : null };
  const previous = localStorage.getItem('finova-nav') || 'dashboard';
  return { page: destinations.has(previous) ? previous : 'dashboard', selectedBudget: null };
}
export function useNavigation() {
  const [route, setRoute] = useState<Route>({ page: 'dashboard', selectedBudget: null });
  const scroll = useRef<Record<string, number>>({});
  const active = useRef('dashboard');
  const frame = useRef<number | null>(null);
  const apply=useCallback((next: Route) => {
    const key=next.page+(next.selectedBudget||'');
    if(active.current===key){setRoute(next);return;}
    scroll.current[active.current] = window.scrollY;
    active.current = key;
    setRoute(next);
    localStorage.setItem('finova-nav', next.page);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => window.scrollTo({ top: scroll.current[active.current] || 0, behavior: 'instant' }));
  },[]);
  useEffect(() => {
    const restore = () => apply(readRoute());
    const initial = setTimeout(restore, 0);
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => {
      clearTimeout(initial);
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [apply]);
  function navigate(page: string, selectedBudget: string | null = null) {
    if (!destinations.has(page)) return;
    const hash = '#/' + page + (selectedBudget ? '/' + selectedBudget : '');
    if (window.location.hash !== hash) history.pushState(null, '', hash);
    apply({ page, selectedBudget });
  }
  return { ...route, navigate };
}
