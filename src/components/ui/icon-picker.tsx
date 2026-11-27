"use client";

import { useRef } from "react";
import {
  ChevronDown,
  Cloud,
  Gem,
  Heart,
  House,
  Landmark,
  Music,
  Play,
  Repeat,
  ShoppingBag,
  Target,
  Wallet,
} from "lucide-react";

const icons = {
  repeat: Repeat,
  play: Play,
  music: Music,
  cloud: Cloud,
  heart: Heart,
  home: House,
  landmark: Landmark,
  shopping: ShoppingBag,
  target: Target,
  wallet: Wallet,
  gem: Gem,
};
const labels = {
  repeat: "Wiederkehrend",
  play: "Streaming",
  music: "Musik",
  cloud: "Cloud",
  heart: "Gesundheit",
  home: "Wohnen",
  landmark: "Bank",
  shopping: "Einkauf",
  target: "Ziel",
  wallet: "Geldbörse",
  gem: "Vermögen",
};
export const iconOptions = Object.entries(labels).map(([value, label]) => ({
  value,
  label,
}));
export function FinanceIcon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const Icon = icons[name as keyof typeof icons] || Repeat;
  return <Icon size={size} aria-hidden="true" />;
}

export function IconPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options?: { value: string; label: string }[];
  onChange: (next: string) => void;
}) {
  const popup = useRef<HTMLDetailsElement>(null);
  const available = options?.length ? options : iconOptions;
  return (
    <div className="icon-picker">
      <span>{label}</span>
      <details ref={popup} className="icon-dropdown">
        <summary aria-label={`${label} auswählen`}>
          <FinanceIcon name={value} />
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="icon-grid" role="group" aria-label={label}>
          {available.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              aria-label={option.label}
              title={option.label}
              onClick={() => {
                onChange(option.value);
                if (popup.current) {
                  popup.current.open = false;
                  popup.current.querySelector("summary")?.focus();
                }
              }}
            >
              <FinanceIcon name={option.value} />
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
