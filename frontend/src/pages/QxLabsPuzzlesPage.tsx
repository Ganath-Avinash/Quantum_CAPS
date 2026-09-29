import React, { useState, useEffect, useMemo } from 'react';
import { puzzles, type Puzzle, type PuzzleTier } from '@/modules/quantum-puzzles/data/puzzles';
import { 
  getInitialState, 
  getGateOperator, 
  applyUnitary, 
  stateToBlochVector 
} from '@/components/bloch/utils/quantumMath';
import type { QubitState } from '@/components/bloch/types/quantum';
import { GATE_CATEGORIES } from '@/modules/gates-playground/components/GateTray';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { 
  FaCheck, 
  FaArrowRight, 
  FaUndo, 
  FaLightbulb, 
  FaTimes, 
  FaInfoCircle, 
  FaPuzzlePiece,
  FaCheckCircle
} from 'react-icons/fa';

const SOLVED_STORAGE_KEY = 'qxlabs_solved_puzzles';

export const QxLabsPuzzlesPage: React.FC = () => {
  const { theme } = useTheme();

  // Load solved puzzles from localStorage
  const [solvedIds, setSolvedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SOLVED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [selectedTier, setSelectedTier] = useState<PuzzleTier | 'All'>('All');
  const [activePuzzleId, setActivePuzzleId] = useState<string>(puzzles[0].id);

  // Filtered puzzle list
  const filteredPuzzles = useMemo(() => {
    if (selectedTier === 'All') return puzzles;
    return puzzles.filter((p) => p.tier === selectedTier);
  }, [selectedTier]);

  const currentPuzzle = useMemo(() => {
    return puzzles.find((p) => p.id === activePuzzleId) || puzzles[0];
  }, [activePuzzleId]);

  // Gate Sequence for reach_target puzzles
  const [placedGates, setPlacedGates] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [resultState, setResultState] = useState<'idle' | 'success' | 'incorrect'>('idle');

  // Match the gate selection
  const [matchTaskIndex, setMatchTaskIndex] = useState(0);
  const [selectedMatchOption, setSelectedMatchOption] = useState<string | null>(null);

  // Reset local state when active puzzle changes
  useEffect(() => {
    setPlacedGates([]);
    setShowHint(false);
    setResultState('idle');
    setMatchTaskIndex(0);
    setSelectedMatchOption(null);
  }, [activePuzzleId]);

  const markAsSolved = (id: string) => {
    setSolvedIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(SOLVED_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  // Compute live state for reach_target
  const liveVector = useMemo(() => {
    if (currentPuzzle.format !== 'reach_target') return null;

    // Start state
    let state: QubitState = getInitialState();
    if (currentPuzzle.startState) {
      const { x, y, z } = currentPuzzle.startState;
      const theta = Math.acos(Math.max(-1, Math.min(1, z)));
      const phi = x === 0 && y === 0 ? 0 : Math.atan2(y, x);
      state = [
        { re: Math.cos(theta / 2), im: 0 },
        { re: Math.sin(theta / 2) * Math.cos(phi), im: Math.sin(theta / 2) * Math.sin(phi) },
      ];
    }

    // Apply placed gates
    for (const g of placedGates) {
      const normalized = g === 'Sdg' ? 'Sdag' : g === 'Tdg' ? 'Tdag' : g;
      const op = getGateOperator(normalized as any);
      if (op) {
        state = applyUnitary(op, state);
      }
    }

    return stateToBlochVector(state);
  }, [currentPuzzle, placedGates]);

  const handleAddGate = (gateName: string) => {
    if (currentPuzzle.gateLimit && placedGates.length >= currentPuzzle.gateLimit) return;
    setPlacedGates((prev) => [...prev, gateName]);
    setResultState('idle');
  };

  const handleRemoveGate = (index: number) => {
    setPlacedGates((prev) => prev.filter((_, i) => i !== index));
    setResultState('idle');
  };

  const handleClearGates = () => {
    setPlacedGates([]);
    setResultState('idle');
  };

  const handleVerifyReachTarget = () => {
    if (!liveVector || !currentPuzzle.targetState) return;

    if (placedGates.length === 0) {
      setResultState('incorrect');
      return;
    }

    const { x, y, z } = currentPuzzle.targetState;
    const tol = 0.08;
    const isXMatch = Math.abs(liveVector.u - x) < tol;
    const isYMatch = Math.abs(liveVector.v - y) < tol;
    const isZMatch = Math.abs(liveVector.w - z) < tol;

    if (isXMatch && isYMatch && isZMatch) {
      setResultState('success');
      markAsSolved(currentPuzzle.id);
    } else {
      setResultState('incorrect');
    }
  };

  const handleSelectMatchOption = (option: string) => {
    if (!currentPuzzle.matchTasks || currentPuzzle.matchTasks.length === 0) return;
    const task = currentPuzzle.matchTasks[matchTaskIndex];
    const correct = task.correctAnswer || task.gateName;

    setSelectedMatchOption(option);

    if (option === correct) {
      if (matchTaskIndex < currentPuzzle.matchTasks.length - 1) {
        setTimeout(() => {
          setMatchTaskIndex((prev) => prev + 1);
          setSelectedMatchOption(null);
        }, 600);
      } else {
        setResultState('success');
        markAsSolved(currentPuzzle.id);
      }
    } else {
      setResultState('incorrect');
    }
  };

  const handleNextPuzzle = () => {
    const currentIndex = puzzles.findIndex((p) => p.id === currentPuzzle.id);
    if (currentIndex >= 0 && currentIndex < puzzles.length - 1) {
      setActivePuzzleId(puzzles[currentIndex + 1].id);
    }
  };

  const isCurrentSolved = solvedIds.includes(currentPuzzle.id);

  // Helper to get gate color from GATE_CATEGORIES
  const getGateColor = (gateName: string) => {
    for (const cat of GATE_CATEGORIES) {
      const found = cat.gates.find((g) => g.name === gateName);
      if (found) return found.color;
    }
    return 'bg-zinc-800 text-white';
  };

  return (
    <div
      className={cn(
        'min-h-[calc(100vh-4rem)] w-full py-12 px-6 md:px-12 font-sans transition-colors',
        theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'
      )}
    >
      <div className="max-w-[1600px] mx-auto pb-20 flex flex-col gap-10">
        {/* Standardized Hero Header matching Bloch Sphere */}
        <div className="flex flex-col gap-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-sans tracking-tight text-zinc-900 dark:text-white">
            Quantum Gate Puzzles
          </h1>
          <p className={cn("text-lg", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>
            Master quantum logic gates, basis transformations, and multi-qubit states through interactive challenges.
          </p>
        </div>

        {/* Tier & Filter Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-300/50 dark:border-zinc-800">
            {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                  selectedTier === tier
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                )}
              >
                {tier}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <span>Completed:</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 font-semibold">
              {solvedIds.length} / {puzzles.length}
            </span>
          </div>
        </div>

        {/* Horizontal Puzzle Navigator Grid: 1 to 30 in All, 1 to 10 in each section */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 custom-scrollbar">
          {filteredPuzzles.map((p, idx) => {
            const isActive = p.id === currentPuzzle.id;
            const isSolved = solvedIds.includes(p.id);
            const displayNumber = selectedTier === 'All' ? idx + 1 : p.level;

            return (
              <button
                key={p.id}
                onClick={() => setActivePuzzleId(p.id)}
                className={cn(
                  'min-w-[44px] h-10 px-2.5 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-1 transition-all border shrink-0',
                  isActive
                    ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white shadow-sm scale-105'
                    : isSolved
                    ? 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700'
                    : 'bg-white text-zinc-600 border-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-zinc-800 hover:border-zinc-400'
                )}
                title={selectedTier === 'All' ? `Puzzle ${idx + 1}: ${p.prompt}` : `Level ${p.level}: ${p.prompt}`}
              >
                <span>{displayNumber}</span>
                {isSolved && <FaCheck className="w-2.5 h-2.5 text-zinc-950 dark:text-white" />}
              </button>
            );
          })}
        </div>

        {/* Main Challenge Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Question & Interaction Panel (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                    {selectedTier === 'All'
                      ? `Puzzle ${puzzles.findIndex((p) => p.id === currentPuzzle.id) + 1} of 30`
                      : `Level ${currentPuzzle.level} of 10`}
                  </span>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {currentPuzzle.tier}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    {currentPuzzle.format === 'reach_target' ? 'Target State' : 'Gate Matching'}
                  </span>
                  {isCurrentSolved && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-zinc-900 dark:text-white px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      <FaCheckCircle className="w-3 h-3 text-zinc-900 dark:text-white" /> Solved
                    </span>
                  )}
                </div>
              </div>

              {/* Prompt */}
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-4">
                {currentPuzzle.prompt}
              </h2>

              {/* Topics */}
              <div className="flex flex-wrap gap-2 mb-8">
                {currentPuzzle.topicsToLearn.map((topic, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              {/* Interactive Answering: reach_target */}
              {currentPuzzle.format === 'reach_target' && (
                <div className="space-y-6">
                  {/* Sequence Tray */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                        Your Gate Sequence
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        {placedGates.length} / {currentPuzzle.gateLimit || '∞'} gates
                      </span>
                    </div>

                    <div className="min-h-[56px] flex items-center gap-2 flex-wrap p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                      {placedGates.length === 0 ? (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 italic px-2">
                          Click gates below to compose your quantum circuit sequence...
                        </span>
                      ) : (
                        placedGates.map((g, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleRemoveGate(idx)}
                            className={cn(
                              'h-9 px-3 rounded-lg flex items-center gap-1.5 font-mono text-xs font-semibold cursor-pointer shadow-sm transition-transform hover:scale-95 group',
                              getGateColor(g)
                            )}
                            title="Click to remove"
                          >
                            <span>{g}</span>
                            <FaTimes className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Allowed Gates Palette */}
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-3 block">
                      Available Gates
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {(currentPuzzle.allowedGates || ['H', 'X', 'Y', 'Z', 'S']).map((gateName) => (
                        <button
                          key={gateName}
                          onClick={() => handleAddGate(gateName)}
                          disabled={
                            currentPuzzle.gateLimit
                              ? placedGates.length >= currentPuzzle.gateLimit
                              : false
                          }
                          className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed',
                            getGateColor(gateName)
                          )}
                        >
                          {gateName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={handleVerifyReachTarget}
                      className="px-6 py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs font-semibold tracking-tight shadow-sm transition-all active:scale-95"
                    >
                      Verify Solution
                    </button>
                    <button
                      onClick={handleClearGates}
                      disabled={placedGates.length === 0}
                      className="px-4 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors disabled:opacity-40"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Interactive Answering: match_gate */}
              {currentPuzzle.format === 'match_gate' && currentPuzzle.matchTasks && (
                <div className="space-y-6">
                  {(() => {
                    const task = currentPuzzle.matchTasks[matchTaskIndex];
                    if (!task) return null;

                    return (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {task.question}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {task.options.map((opt) => {
                            const isSelected = selectedMatchOption === opt;
                            const correct = task.correctAnswer || task.gateName;
                            const isCorrect = isSelected && opt === correct;

                            return (
                              <button
                                key={opt}
                                onClick={() => handleSelectMatchOption(opt)}
                                disabled={selectedMatchOption !== null}
                                className={cn(
                                  'p-4 rounded-xl border text-sm font-mono font-medium text-left transition-all',
                                  isSelected
                                    ? isCorrect
                                      ? 'border-zinc-950 bg-zinc-100 dark:bg-zinc-800 dark:border-white font-bold'
                                      : 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-600'
                                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                                )}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {currentPuzzle.matchTasks.length > 1 && (
                          <div className="flex items-center gap-1.5 justify-center pt-2">
                            {currentPuzzle.matchTasks.map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'w-2 h-2 rounded-full transition-all',
                                  i === matchTaskIndex
                                    ? 'w-5 bg-zinc-950 dark:bg-white'
                                    : i < matchTaskIndex
                                    ? 'bg-zinc-400 dark:bg-zinc-600'
                                    : 'bg-zinc-200 dark:bg-zinc-800'
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Feedback States */}
              {resultState === 'success' && (
                <div className="mt-6 p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaCheckCircle className="text-zinc-950 dark:text-white w-4 h-4" />
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Challenge Solved!
                    </h4>
                  </div>
                  {currentPuzzle.intuition && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5 leading-relaxed mb-4">
                      {currentPuzzle.intuition.map((line, i) => (
                        <p key={i}>• {line}</p>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleNextPuzzle}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs font-semibold shadow-sm transition-transform active:scale-95"
                  >
                    <span>Next Challenge</span>
                    <FaArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {resultState === 'incorrect' && (
                <div className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 leading-relaxed flex items-start gap-2.5">
                  <FaInfoCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Not quite right</span>
                    <span>{currentPuzzle.wrongFeedback}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: State & Hint Card (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Target vs Live State Info */}
            {currentPuzzle.format === 'reach_target' && (
              <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-4">
                  Bloch Coordinates
                </h3>

                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-1 font-mono uppercase">
                      Target State (x, y, z)
                    </span>
                    <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-white">
                      [{currentPuzzle.targetState?.x ?? 0},{' '}
                      {currentPuzzle.targetState?.y ?? 0},{' '}
                      {currentPuzzle.targetState?.z ?? 0}]
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-1 font-mono uppercase">
                      Current State (x, y, z)
                    </span>
                    <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-white">
                      [{liveVector?.u.toFixed(2) ?? '0.00'},{' '}
                      {liveVector?.v.toFixed(2) ?? '0.00'},{' '}
                      {liveVector?.w.toFixed(2) ?? '1.00'}]
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Hint Box */}
            {currentPuzzle.hint && (
              <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
                    <FaLightbulb className="w-3.5 h-3.5" />
                    <span>Need a hint?</span>
                  </div>
                  <button
                    onClick={() => setShowHint((prev) => !prev)}
                    className="text-xs text-zinc-500 hover:text-zinc-950 dark:hover:text-white font-medium underline"
                  >
                    {showHint ? 'Hide' : 'Reveal'}
                  </button>
                </div>

                {showHint && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    {currentPuzzle.hint}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QxLabsPuzzlesPage;
