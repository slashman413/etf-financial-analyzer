"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

type SelectCtx = {
  value: string;
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const SelectCtx = createContext<SelectCtx | null>(null);

export function Select({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <SelectCtx.Provider value={{ value, onValueChange, open, setOpen }}>
      {children}
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const ctx = useContext(SelectCtx)!;
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        ctx.setOpen(false);
      }
    };
    if (ctx.open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ctx.open]);

  return (
    <button
      ref={ref}
      onClick={() => ctx.setOpen(!ctx.open)}
      className={cn(
        "flex h-9 w-[140px] items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-300",
        className
      )}
    >
      {children || ctx.value}
      <ChevronDown className="h-4 w-4 text-slate-400" />
    </button>
  );
}

export function SelectContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(SelectCtx)!;
  if (!ctx.open) return null;
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const ctx = useContext(SelectCtx)!;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => {
        ctx.onValueChange(value);
        ctx.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-slate-100 text-slate-900"
          : "text-slate-600 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}
