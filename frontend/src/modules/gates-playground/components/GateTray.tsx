import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { getShortcutForGate } from '../utils/playgroundShortcuts';
import { cn } from '@/lib/utils';

export const GATE_CATEGORIES = [
  {
    id: 'single',
    label: 'Single Qubit Gates',
    gates: [
      { name: 'H', label: 'H', color: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]' },
      { name: 'X', label: 'X', color: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]' },
      { name: 'Y', label: 'Y', color: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]' },
      { name: 'Z', label: 'Z', color: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]' },
      { name: 'S', label: 'S', color: 'bg-[#4f46e5] text-white hover:bg-[#4338ca]' },
      { name: 'Sdg', label: 'S†', color: 'bg-[#4f46e5] text-white hover:bg-[#4338ca]' },
      { name: 'T', label: 'T', color: 'bg-[#4f46e5] text-white hover:bg-[#4338ca]' },
      { name: 'Tdg', label: 'T†', color: 'bg-[#4f46e5] text-white hover:bg-[#4338ca]' },
      { name: 'P', label: 'P', color: 'bg-[#4f46e5] text-white hover:bg-[#4338ca]' },
      { name: 'RX', label: 'RX', color: 'bg-[#0284c7] text-white hover:bg-[#0369a1]' },
      { name: 'RY', label: 'RY', color: 'bg-[#0284c7] text-white hover:bg-[#0369a1]' },
      { name: 'RZ', label: 'RZ', color: 'bg-[#0284c7] text-white hover:bg-[#0369a1]' },
      { name: 'U', label: 'U', color: 'bg-[#0284c7] text-white hover:bg-[#0369a1]' },
    ]
  },
  {
    id: 'controlled',
    label: 'Controlled Gates',
    gates: [
      { name: 'CNOT', label: 'CX', color: 'bg-[#18181b] text-white hover:bg-[#27272a]' },
      { name: 'CY', label: 'CY', color: 'bg-[#18181b] text-white hover:bg-[#27272a]' },
      { name: 'CZ', label: 'CZ', color: 'bg-[#18181b] text-white hover:bg-[#27272a]' },
      { name: 'CP', label: 'CP', color: 'bg-[#18181b] text-white hover:bg-[#27272a]' },
      { name: 'SWAP', label: 'SWAP', color: 'bg-[#18181b] text-white hover:bg-[#27272a] text-[10px]' },
    ]
  },
  {
    id: 'special',
    label: 'Special Gates',
    gates: [
      { name: 'MEASURE', label: 'M', color: 'bg-[#475569] text-white hover:bg-[#334155]' },
      { name: 'RESET', label: '|0⟩', color: 'bg-[#475569] text-white hover:bg-[#334155]' },
      { name: 'BARRIER', label: 'B', color: 'bg-[#475569] text-white hover:bg-[#334155]' },
      { name: 'QFT', label: 'QFT', color: 'bg-[#7c3aed] text-white hover:bg-[#6d28d9] text-[10px]' },
      { name: 'IQFT', label: 'IQFT', color: 'bg-[#7c3aed] text-white hover:bg-[#6d28d9] text-[10px]' },
    ]
  }
];

const GateItem: React.FC<{ 
  name: string; 
  label: string; 
  color: string;
  isSelected?: boolean;
  onSelect?: () => void;
}> = ({ name, label, color, isSelected, onSelect }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `gate-tray-${name}`,
    data: { name, label, color, type: 'new_gate' }
  });

  const style = {
    opacity: isDragging ? 0.3 : 1
  };
  
  const shortcut = getShortcutForGate(name);
  const tooltipText = shortcut ? `${name} • ${shortcut}` : name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={cn(
        "w-9 h-9 flex items-center justify-center font-mono font-medium text-xs rounded cursor-pointer transition-all z-50 shadow-sm",
        color,
        isSelected ? "ring-2 ring-zinc-950 scale-110 shadow-md brightness-110" : ""
      )}
      title={tooltipText}
    >
      {label}
    </div>
  );
};

export const GateTray: React.FC<{ 
  allowedGates?: string[];
  selectedGateToPlace?: string | null;
  onSelectGate?: (name: string) => void;
}> = ({ allowedGates, selectedGateToPlace, onSelectGate }) => {
  const isAllowed = (gateName: string) => {
    if (!allowedGates) return true;
    const normalized = allowedGates.map((gate) =>
      gate === 'Sdag' ? 'Sdg' : (gate === 'Tdag' ? 'Tdg' : gate)
    );
    return normalized.includes(gateName);
  };
  return (
    <div className="flex-1 min-w-0 flex items-center overflow-x-auto custom-scrollbar pb-1 -mb-1">
      <div className="flex items-center gap-3 w-max pr-2">
        {GATE_CATEGORIES.filter(block => 
          block.gates.some(gate => isAllowed(gate.name))
        ).map((block) => (
          <div key={block.id} className="flex flex-col gap-1 shrink-0 bg-qp-secondary/50 p-1.5 rounded-xl border border-qp-border">
            <span className="text-[9px] font-mono uppercase tracking-wider text-qp-text-muted px-1 opacity-70">
              {block.label}
            </span>
            <div className="grid grid-flow-col grid-rows-2 gap-1.5">
              {block.gates
                .filter((gate) => isAllowed(gate.name))
                .map((gate) => (
                <GateItem 
                  key={gate.name} 
                  name={gate.name} 
                  label={gate.label} 
                  color={gate.color} 
                  isSelected={selectedGateToPlace === gate.name}
                  onSelect={() => onSelectGate?.(gate.name)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
