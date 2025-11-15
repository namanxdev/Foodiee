"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface ShortcutRow {
  keys: string[];
  description: string;
}

const shortcuts: ShortcutRow[] = [
  { keys: ["⌘", "K"], description: "Focus recipe search" },
  { keys: ["Shift", "?"], description: "Open keyboard shortcuts" },
  { keys: ["←", "→"], description: "Navigate pages" },
  { keys: ["F"], description: "Toggle favorites filter" },
  { keys: ["V"], description: "Toggle vegetarian mode" },
];

function ShortcutPopoverRow({ shortcut }: { shortcut: ShortcutRow }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-orange-50/60 px-4 py-3 text-sm text-slate-600">
      <span>{shortcut.description}</span>
      <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
        {shortcut.keys.map((key) => (
          <kbd
            key={key}
            className="rounded-md border border-orange-100 bg-white/90 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-500 shadow-sm"
          >
            {key}
          </kbd>
        ))}
      </span>
    </div>
  );
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="default">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Power through the recipe library using these handy shortcuts.
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-2 bg-orange-100" />
        <div className="flex flex-col gap-2">
          {shortcuts.map((shortcut) => (
            <ShortcutPopoverRow key={shortcut.description} shortcut={shortcut} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

