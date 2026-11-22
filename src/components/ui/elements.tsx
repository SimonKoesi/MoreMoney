'use client';
import { useId } from 'react';
import type { ComponentType, KeyboardEvent } from 'react';
import { Check } from 'lucide-react';

export type Option = { value: string; label: string };

/** JellyRadio: native mutually exclusive values, never visual-only selection. */
export function JellyRadio({ label, options, value, onChange }: {
  label: string; options: Option[]; value: string; onChange: (value: string) => void;
}) {
  const name = useId();
  return <fieldset className="jelly-radio"><legend className="sr-only">{label}</legend>
    {options.map(option => <label key={option.value} className={value === option.value ? 'selected' : ''}>
      <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
      <span>{option.label}</span>
    </label>)}
  </fieldset>;
}

/** RubberSegment: immediate content selection, arrow navigation and roving focus. */
export function RubberSegment({ label, options, value, panelId, onChange }: {
  label: string; options: Option[]; value: string; panelId: string; onChange: (value: string) => void;
}) {
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % options.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else return;
    event.preventDefault();
    onChange(options[next].value);
    document.getElementById(`${panelId}-tab-${options[next].value}`)?.focus();
  }
  return <div className="rubber-segment" role="tablist" aria-label={label}>
    {options.map((option, index) => <button key={option.value} type="button" role="tab"
      id={`${panelId}-tab-${option.value}`} aria-controls={panelId} aria-selected={value === option.value}
      tabIndex={value === option.value ? 0 : -1} className={value === option.value ? 'selected' : ''}
      onClick={() => onChange(option.value)} onKeyDown={event => move(event, index)}>{option.label}</button>)}
  </div>;
}

/** SpringCheck: label and space key share one native checkbox hit area. */
export function SpringCheck({ label, checked, onChange, task = true }: {
  label: string; checked: boolean; onChange: (checked: boolean) => void; task?: boolean;
}) {
  return <label className="spring-check">
    <span className="spring-check-control"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span aria-hidden="true" className="spring-check-mark"><Check size={13} strokeWidth={3} /></span>
    </span><span className={task && checked ? 'done' : ''}>{label}</span>
  </label>;
}

/** Dock + GlassSurface: stable mobile destinations, active state comes from routing. */
export function Dock({ items, active, navigate }: {
  items: { id: string; label: string; icon: ComponentType<{ size?: number }> }[];
  active: string; navigate: (route: string) => void;
}) {
  return <nav className="mobile-dock glass-surface" aria-label="Schnellnavigation">
    {items.map(item => <button key={item.id} aria-current={active === item.id ? 'page' : undefined}
      className={active === item.id ? 'active' : ''} onClick={() => navigate(item.id)}>
      <item.icon size={20} /><span>{item.label}</span>
    </button>)}
  </nav>;
}
