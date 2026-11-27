'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const destinations = new Set(['dashboard', 'accounts', 'transactions', 'recurring', 'installments', 'goals', 'budgets', 'projects', 'simulator', 'settings', 'subscriptions', 'worth', 'bank', 'privacy', 'analysis', 'health', 'notifications', 'assistant', 'reports']);
type Route = { page: string; detail: string | null };
function readRoute(): Route {
  const [page, id] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (page==='stocks') return {page:'dashboard',detail:null};
  if (page==='bank' && id==='quality') return {page,detail:id};
  if (destinations.has(page)) return { page, detail: ['budgets', 'goals'].includes(page) && /^[a-f0-9-]{36}$/.test(id || '') ? id : null };
  const previous = localStorage.getItem('moremoney-nav') || localStorage.getItem('finova-nav') || 'dashboard';
  return { page: destinations.has(previous) ? previous : 'dashboard', detail: null };
}
export function useNavigation() {
  const [route, setRoute] = useState<Route>({ page: 'dashboard', detail: null });
  const scroll = useRef<Record<string, number>>({});
  const active = useRef('dashboard');
  const frame = useRef<number | null>(null);
  const apply=useCallback((next: Route) => {
    const key=next.page+(next.detail||'');
    if(active.current===key){setRoute(next);return;}
    scroll.current[active.current] = window.scrollY;
    active.current = key;
    setRoute(next);
    localStorage.setItem('moremoney-nav', next.page);
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
  function navigate(page: string, detail: string | null = null) {
    if (!destinations.has(page)) return;
    const hash = '#/' + page + (detail ? '/' + detail : '');
    if (window.location.hash !== hash) history.pushState(null, '', hash);
    apply({ page, detail });
  }
  return { ...route, selectedBudget: route.page === 'budgets' ? route.detail : null, navigate };
}
