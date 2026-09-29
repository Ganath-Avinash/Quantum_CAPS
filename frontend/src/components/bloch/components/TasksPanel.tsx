import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, BookOpen, FlaskConical, Puzzle, Lightbulb, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

// ─── Introduction content ─────────────────────────────────────────────────────
const INTRO = {
  overview: `The Bloch sphere is a unit sphere in 3D space used to represent the pure quantum state of a single qubit. Unlike a classical bit which can only be 0 or 1, a qubit can exist in a superposition of both states simultaneously. Every point on the surface of the Bloch sphere corresponds to a unique, valid qubit state.

The north pole (top, z = +1) represents the computational basis state |0⟩, and the south pole (bottom, z = −1) represents |1⟩. All other points on the surface are superpositions. The equatorial plane (z = 0) contains all equal-weight superpositions that differ only in phase.

Quantum operations (gates) are represented as rotations of this sphere — a consequence of the mathematical isomorphism between SU(2) (unitary operations on a qubit) and SO(3) (rotations in 3D space). This makes the Bloch sphere an extraordinarily powerful visual tool for building intuition about quantum gates and algorithms.`,

  math: [
    {
      title: 'Qubit State Parameterization',
      formula: '|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} · sin(θ/2)|1⟩',
      desc: 'Any pure qubit state is parameterized by two angles: θ (polar angle, 0 ≤ θ ≤ π) and φ (azimuthal phase angle, 0 ≤ φ < 2π). This completely covers the surface of the Bloch sphere.'
    },
    {
      title: 'Bloch Vector Coordinates (u, v, w)',
      formula: 'u = ⟨σ_x⟩ = sin θ cos φ\nv = ⟨σ_y⟩ = sin θ sin φ\nw = ⟨σ_z⟩ = cos θ',
      desc: 'Given state |ψ⟩ = α|0⟩ + β|1⟩, the Cartesian coordinates (u, v, w) correspond directly to expectation values of the Pauli X, Y, and Z observables.'
    },
    {
      title: 'Unitary Rotation Operators',
      formula: 'R_x(θ) = exp(−iθX/2) = cos(θ/2)·I − i·sin(θ/2)·X\nR_y(θ) = exp(−iθY/2) = cos(θ/2)·I − i·sin(θ/2)·Y\nR_z(θ) = exp(−iθZ/2) = cos(θ/2)·I − i·sin(θ/2)·Z',
      desc: 'Every single-qubit gate is a rotation by angle θ around an axis on the Bloch sphere. Matrices preserve the unit sphere norm (U†U = I).'
    },
    {
      title: 'Standard Gate Decomposition',
      formula: 'X = R_x(π)        (Bit flip)\nY = R_y(π)        (Bit & Phase flip)\nZ = R_z(π)        (Phase flip)\nH = R_y(π/2) · R_z(π)  (Hadamard: Z ↔ X)\nS = R_z(π/2)       (Quarter-turn phase)\nT = R_z(π/4)       (Eighth-turn phase)',
      desc: 'All standard quantum gates map directly to rotation angles around coordinate axes on the Bloch sphere.'
    }
  ],

  howToUse: [
    { label: 'INIT', desc: 'Resets the qubit to the ground state |0⟩ (north pole, z=+1).' },
    { label: 'UNDO', desc: 'Steps back one operation at a time through your gate history.' },
    { label: 'IMG EXPORT', desc: 'Saves a high-resolution PNG screenshot of the current 3D Bloch sphere.' },
    { label: 'RECORD GIF', desc: 'Records real-time gate rotations and exports an animated WebP/GIF.' },
    { label: 'Default Axes', desc: 'Apply preset 90° or 180° rotations, or type a custom angle around X, Y, or Z.' },
    { label: 'Custom Axis', desc: 'Define an arbitrary unit axis n̂(θ, φ) and rotate by angle γ.' },
    { label: 'Quantum Gates', desc: 'Click standard Pauli and phase gates (X, Y, Z, H, S, T, S†, T†).' },
    { label: 'Rabi Pulses', desc: 'Simulate radio-frequency pulse driving in the rotating frame with detuning and amplitude.' }
  ]
};

// ─── Gate Reference ───────────────────────────────────────────────────────────
const GATE_REFERENCE = [
  { name: 'Pauli X', symbol: 'X', prefix: '', matrix: [['0', '1'], ['1', '0']], desc: 'Bit flip (180° around X)' },
  { name: 'Pauli Y', symbol: 'Y', prefix: '', matrix: [['0', '−i'], ['i', '0']], desc: 'Bit & phase flip (180° around Y)' },
  { name: 'Pauli Z', symbol: 'Z', prefix: '', matrix: [['1', '0'], ['0', '−1']], desc: 'Phase flip (180° around Z)' },
  { name: 'Hadamard', symbol: 'H', prefix: '1/√2', matrix: [['1', '1'], ['1', '−1']], desc: 'Creates equal superposition' },
  { name: 'Phase (S)', symbol: 'S', prefix: '', matrix: [['1', '0'], ['0', 'i']], desc: '90° rotation around Z (π/2)' },
  { name: 'Phase Dagger (S†)', symbol: 'S†', prefix: '', matrix: [['1', '0'], ['0', '−i']], desc: '−90° rotation around Z (−π/2)' },
  { name: 'T Gate (T)', symbol: 'T', prefix: '', matrix: [['1', '0'], ['0', 'e^{iπ/4}']], desc: '45° rotation around Z (π/4)' },
  { name: 'T Dagger (T†)', symbol: 'T†', prefix: '', matrix: [['1', '0'], ['0', 'e^{−iπ/4}']], desc: '−45° rotation around Z (−π/4)' },
  { name: 'Rotation Rx(θ)', symbol: 'Rx', prefix: '', matrix: [['cos(θ/2)', '−i sin(θ/2)'], ['−i sin(θ/2)', 'cos(θ/2)']], desc: 'Arbitrary rotation around X-axis' },
  { name: 'Rotation Ry(θ)', symbol: 'Ry', prefix: '', matrix: [['cos(θ/2)', '−sin(θ/2)'], ['sin(θ/2)', 'cos(θ/2)']], desc: 'Arbitrary rotation around Y-axis' },
  { name: 'Rotation Rz(θ)', symbol: 'Rz', prefix: '', matrix: [['e^{−iθ/2}', '0'], ['0', 'e^{iθ/2}']], desc: 'Arbitrary rotation around Z-axis' },
  { name: 'Universal (U)', symbol: 'U', prefix: '', matrix: [['cos(θ/2)', '−e^{iλ}sin(θ/2)'], ['e^{iφ}sin(θ/2)', 'e^{i(φ+λ)}cos(θ/2)']], desc: 'Arbitrary 3-parameter rotation U(θ, φ, λ)' }
];

// ─── Quantum Gate Puzzles ─────────────────────────────────────────────────────
export interface GatePuzzle {
  id: number;
  title: string;
  difficulty: 'Intro' | 'Intermediate' | 'Master';
  initialState: string;
  targetState: string;
  rules: string;
  hint: string;
  solution: string;
}

export const GATE_PUZZLES: GatePuzzle[] = [
  {
    id: 101,
    title: 'Puzzle 1: The X-Bypass (Flip without X)',
    difficulty: 'Intro',
    initialState: '|0⟩ (North Pole)',
    targetState: '|1⟩ (South Pole)',
    rules: 'Reach the South Pole |1⟩ without using the Pauli X gate. Use 3 gates or fewer.',
    hint: 'Think about how the Hadamard gate maps between Z and X bases: H · Z · H = X.',
    solution: 'Apply H to reach equatorial |+⟩, apply Z to shift phase to |−⟩, then apply H again to flip down to |1⟩.'
  },
  {
    id: 102,
    title: 'Puzzle 2: Equatorial Phase Navigation',
    difficulty: 'Intermediate',
    initialState: '|0⟩ (North Pole)',
    targetState: '|-i⟩ = (|0⟩ − i|1⟩)/√2 (Equator, −Y axis)',
    rules: 'Reach the −Y axis on the equator in exactly 2 operations.',
    hint: 'Use H to enter the equator at |+⟩ (+X axis), then rotate 90° clockwise around Z using S†.',
    solution: 'Step 1: Apply H to reach |+⟩. Step 2: Apply S† (Phase Dagger) to rotate −90° around Z into |−i⟩.'
  },
  {
    id: 103,
    title: 'Puzzle 3: The Single-Gate Reflection',
    difficulty: 'Intro',
    initialState: '|1⟩ (South Pole)',
    targetState: '|-⟩ = (|0⟩ − |1⟩)/√2 (Equator, −X axis)',
    rules: 'Transform the south pole state into |−⟩ in exactly 1 gate.',
    hint: 'The Hadamard gate maps |0⟩ → |+⟩ and |1⟩ → |−⟩.',
    solution: 'Apply the Hadamard gate (H). H|1⟩ = (|0⟩ − |1⟩)/√2 = |−⟩.'
  },
  {
    id: 104,
    title: 'Puzzle 4: The 45° Octant Shift',
    difficulty: 'Intermediate',
    initialState: '|+⟩ (Equator, +X axis)',
    targetState: '(|0⟩ + e^{iπ/4}|1⟩)/√2 (Equator, 45° between X and Y)',
    rules: 'Apply a single standard gate to advance the equatorial angle by exactly 45°.',
    hint: 'The T gate is a π/4 rotation around the Z-axis.',
    solution: 'Apply the T gate. T|+⟩ = (|0⟩ + e^{iπ/4}|1⟩)/√2.'
  },
  {
    id: 105,
    title: 'Puzzle 5: Phase Reflection (+Y to −Y)',
    difficulty: 'Master',
    initialState: '|+i⟩ = (|0⟩ + i|1⟩)/√2',
    targetState: '|-i⟩ = (|0⟩ − i|1⟩)/√2',
    rules: 'Invert the imaginary phase from +i to −i in a single gate.',
    hint: 'A 180° rotation around the Z axis reverses the sign of the equatorial Y component: Z|+i⟩ = |−i⟩.',
    solution: 'Apply the Pauli Z gate. Z(|0⟩ + i|1⟩)/√2 = (|0⟩ − i|1⟩)/√2 = |−i⟩.'
  },
  {
    id: 106,
    title: 'Puzzle 6: Return to Coherence',
    difficulty: 'Intro',
    initialState: '|-⟩ = (|0⟩ − |1⟩)/√2',
    targetState: '|0⟩ (Ground state)',
    rules: 'Reset the superposition state |−⟩ back to pure |0⟩ in 1 gate without clicking INIT.',
    hint: 'Unitary gates are strictly reversible and Hermitian: H† = H. What happens when H is applied to |−⟩?',
    solution: 'Apply the Hadamard gate (H). Because H|0⟩ = |+⟩ and H|1⟩ = |−⟩, H|−⟩ = |1⟩, or applying Z then H: Z|−⟩ = |+⟩, then H|+⟩ = |0⟩!'
  }
];

// ─── 21 Guided Tasks ──────────────────────────────────────────────────────────
export interface Task {
  id: number;
  title: string;
  focus: string;
  concept: string;
  goal: string;
  steps: string[];
  expectedResult: string;
  insight: string;
}

export const TASKS: Task[] = [
  {
    id: 1,
    title: 'Start at the North Pole',
    focus: 'INIT — getInitialState()',
    concept: 'The ground state |0⟩ is the starting point for almost every quantum computation. On the Bloch sphere it sits at the very top (north pole). Its Bloch vector is (0, 0, 1) — pointing straight up along the z-axis.',
    goal: 'Familiarise yourself with the |0⟩ state and the Bloch sphere coordinate system.',
    steps: [
      'Click the Init button at the top-left.',
      'Observe the state arrow pointing straight up to the north pole.',
      'Read the coordinates at the bottom: x=0.000, y=0.000, z=1.000.',
      'Try dragging the sphere to rotate the view and appreciate the 3D geometry.'
    ],
    expectedResult: 'Arrow at north pole. Coordinates: x=0, y=0, z=1. State = |ψ⟩ = |0⟩.',
    insight: 'Classical bits are permanently 0 or 1. A qubit at |0⟩ is still just "classical zero" — but we will soon move it away from this pole into truly quantum territory.'
  },
  {
    id: 2,
    title: 'The Quantum NOT Gate — Pauli X',
    focus: 'Gate: X = R_x(π)',
    concept: 'The Pauli X gate is the quantum equivalent of the classical NOT gate. Geometrically it is a 180° rotation around the x-axis of the Bloch sphere, which flips the state from the north pole to the south pole — from |0⟩ to |1⟩.',
    goal: 'Flip the qubit from |0⟩ to |1⟩ using the X gate.',
    steps: [
      'Ensure you are at |0⟩ (click Init if not).',
      'Open the Quantum gates section in the right panel.',
      'Click the X button.',
      'Watch the arrow rotate 180° around the x-axis to the south pole.'
    ],
    expectedResult: 'Arrow points straight down. Coordinates: x=0, y=0, z=-1. State = |ψ⟩ = |1⟩.',
    insight: 'Notice the trajectory: the arrow rotates around the x-axis, sweeping through the y-z plane to arrive at |1⟩.'
  },
  {
    id: 3,
    title: 'Create Equal Superposition — Hadamard Gate',
    focus: 'Gate: H = R_y(π/2) · R_z(π)',
    concept: 'The Hadamard gate creates an equal superposition: (|0⟩ + |1⟩)/√2. On the Bloch sphere, it rotates the north pole down to the equator, landing precisely on the positive x-axis. Here, measuring 0 or 1 is equally likely (50% each).',
    goal: 'Place the qubit into the |+⟩ superposition state using H.',
    steps: [
      'Click Init to reset to |0⟩.',
      'In Quantum gates, click H.',
      'Observe the arrow move to the equator, pointing along the +x axis.',
      'Check the state readouts: equal probability for |0⟩ and |1⟩.'
    ],
    expectedResult: 'Arrow points along +x. Coordinates: x=1, y=0, z=0. State = |+⟩ = (|0⟩ + |1⟩)/√2.',
    insight: 'Superposition does NOT mean "somewhere in between 0 and 1". It is a precise mathematical vector pointing along a specific axis.'
  },
  {
    id: 4,
    title: 'The Phase Flip — Pauli Z Gate',
    focus: 'Gate: Z = R_z(π)',
    concept: 'The Pauli Z gate introduces a 180° phase flip between |0⟩ and |1⟩: Z|0⟩ = |0⟩, Z|1⟩ = −|1⟩. When applied to the equator state |+⟩, it rotates it to |−⟩ on the −x axis. Note: Z applied to |0⟩ has NO observable effect because the north pole lies ON the rotation axis.',
    goal: 'Observe that Z does nothing to |0⟩, but flips the phase of |+⟩.',
    steps: [
      'Click Init to reset to |0⟩.',
      'Click Z. Notice the arrow does NOT move (it is on the z-axis!).',
      'Now click H to reach |+⟩ (on the +x axis).',
      'Click Z again. Watch the arrow rotate 180° around the z-axis to the −x axis.'
    ],
    expectedResult: 'Arrow on the equator at −x. Coordinates: x=-1, y=0, z=0. State = |−⟩ = (|0⟩ − |1⟩)/√2.',
    insight: 'A rotation around an axis leaves states ON that axis unchanged. This is why Z does not move |0⟩ or |1⟩ — they are eigenstates of Z.'
  },
  {
    id: 5,
    title: 'Rotate 90° Around the X-Axis',
    focus: 'Rotation: R_x(90°)',
    concept: 'Continuous rotations allow us to reach any point on the sphere, not just the poles and axes. A 90° rotation around x takes |0⟩ to the equator, pointing along the −y axis.',
    goal: 'Use the continuous rotation controls to rotate by 90° around x.',
    steps: [
      'Click Init to reset to |0⟩.',
      'Open Rotations around default axes.',
      'Click the X +90° button.',
      'Check the arrow position and coordinates.'
    ],
    expectedResult: 'Arrow points along −y axis on the equator. Coordinates: x=0, y=-1, z=0.',
    insight: 'Notice that rotating 90° around X gives an equal superposition, but on the y-axis rather than the x-axis — this state has an imaginary phase!'
  },
  {
    id: 6,
    title: 'Rotate 90° Around the Y-Axis',
    focus: 'Rotation: R_y(90°)',
    concept: 'A 90° rotation around the y-axis takes |0⟩ to the equator along the +x axis — identical in position to the Hadamard gate, but with a different trajectory.',
    goal: 'Compare R_y(90°) with the Hadamard gate.',
    steps: [
      'Click Init to reset to |0⟩.',
      'Click Y +90° under Rotations around default axes.',
      'Note the trajectory: it rotates directly around the y-axis.',
      'Click Undo, then click H under Quantum gates — compare the final state.'
    ],
    expectedResult: 'Arrow at +x on the equator. Coordinates: x=1, y=0, z=0.',
    insight: 'Multiple different gate sequences can reach the exact same state on the Bloch sphere via different paths. Quantum compilation finds the shortest path.'
  },
  {
    id: 7,
    title: 'The Quarter-Turn Phase Gate — S Gate',
    focus: 'Gate: S = R_z(π/2)',
    concept: 'The S gate is a 90° rotation around the z-axis. It is the "square root of Z" (S² = Z). It maps |+⟩ on the x-axis to |+i⟩ on the y-axis.',
    goal: 'Use the S gate to introduce a π/2 phase to the superposition state.',
    steps: [
      'Click Init, then click H to reach |+⟩ (on +x).',
      'Click S under Quantum gates.',
      'Watch the arrow rotate 90° counter-clockwise around the z-axis, landing on +y.',
      'Click S again. It lands on −x (which is Z|+⟩ = |−⟩!). S² = Z confirmed.'
    ],
    expectedResult: 'After first S: arrow at +y. Coordinates: x=0, y=1, z=0. State = |+i⟩ = (|0⟩ + i|1⟩)/√2.',
    insight: 'S² = Z is visibly obvious on the Bloch sphere: two 90° rotations make a 180° rotation.'
  },
  {
    id: 8,
    title: 'The Eighth-Turn Phase Gate — T Gate',
    focus: 'Gate: T = R_z(π/4)',
    concept: 'The T gate is a 45° rotation around the z-axis. It is the "fourth root of Z" (T⁴ = Z, T² = S). Crucially, adding the T gate to Clifford gates (H, S, CNOT) creates a UNIVERSAL quantum gate set.',
    goal: 'Verify T² = S on the Bloch sphere.',
    steps: [
      'Click Init, then click H to reach |+⟩.',
      'Click T. The arrow rotates 45° around z, halfway between +x and +y.',
      'Click T again. The arrow is now on the +y axis — exactly where S would put it!',
      'Verify: two T gates equal one S gate.'
    ],
    expectedResult: 'After one T: x≈0.707, y≈0.707, z=0. After two T gates: x=0, y=1, z=0.',
    insight: 'The T gate is the workhorse of fault-tolerant quantum computing — implementing it with error correction requires "magic state distillation".'
  },
  {
    id: 9,
    title: 'Undo Operations — S† and T† (Dagger Gates)',
    focus: 'Gates: S† = R_z(−π/2), T† = R_z(−π/4)',
    concept: 'Every unitary gate has an adjoint (dagger) that reverses its action: U · U† = I. On the Bloch sphere, the dagger gate rotates by the same angle in the opposite direction.',
    goal: 'Demonstrate that S† undoes S, and T† undoes T.',
    steps: [
      'Click Init, then click H, then click S (arrow is at +y).',
      'Click S†. Watch the arrow rotate 90° back to +x.',
      'Click T, then click T†. The arrow returns to +x.',
      'Verify the arrow is back at coordinates: x=1, y=0, z=0.'
    ],
    expectedResult: 'Arrow back at +x. Coordinates: x=1, y=0, z=0.',
    insight: 'All quantum gates (excluding measurement) are strictly reversible. No information is ever destroyed during gate operations.'
  },
  {
    id: 10,
    title: 'Rotate Around a Custom Axis n̂',
    focus: 'Rotations: Custom Axis n̂(θ, φ, γ)',
    concept: 'Any physical quantum control (like an RF or laser pulse) can be directed along an arbitrary axis in space. We define the axis by polar angle θ and azimuthal angle φ, then rotate by angle γ.',
    goal: 'Define a custom axis and rotate the qubit state around it.',
    steps: [
      'Click Init to reset to |0⟩.',
      'Open Rotations around custom axis.',
      'Set Polar θ = 45°, Azimuthal φ = 45°, Rotation γ = 90°.',
      'Click Rotate around n̂(θ, φ).',
      'Observe the trajectory arc as the state rotates around this tilted axis.'
    ],
    expectedResult: 'Arrow lands at a position determined by the 3D rotation matrix for axis (45°, 45°).',
    insight: 'This is how real quantum hardware controls qubits: microwave pulses with controlled frequency and phase define the rotation axis.'
  },
  {
    id: 11,
    title: 'Rabi Oscillations — Simulate a Pulse',
    focus: 'Pulses: applyRabiPulse()',
    concept: 'When an oscillating electromagnetic field is applied to a qubit at resonance, the state oscillates between |0⟩ and |1⟩. This is a Rabi oscillation. A "π-pulse" (amplitude=1, length=0.5) fully flips the qubit.',
    goal: 'Simulate a resonant π-pulse to flip the qubit from |0⟩ to |1⟩.',
    steps: [
      'Click Init to reset to |0⟩.',
      'Open the Pulses section.',
      'Keep defaults: Detuning = 0 (on resonance), Amplitude = 1.0, Length = 0.5 (π-pulse).',
      'Click X Pulse.',
      'Watch the arrow trace the Rabi oscillation trajectory down to the south pole |1⟩.'
    ],
    expectedResult: 'Arrow lands near south pole. Coordinates: x≈0, y≈0, z≈-1. State flipped via resonant pulse.',
    insight: 'In physical quantum processors (superconducting qubits, trapped ions), gates ARE pulses. A "NOT gate" is simply a calibrated microwave pulse.'
  },
  {
    id: 12,
    title: 'Off-Resonant Pulse — Incomplete Flip',
    focus: 'Pulses: Detuning Δ > 0',
    concept: 'When the driving frequency does not match the qubit transition frequency (detuning Δ ≠ 0), the effective rotation axis tilts and the oscillation amplitude decreases. The qubit cannot fully reach |1⟩.',
    goal: 'Observe how detuning prevents a complete state flip.',
    steps: [
      'Click Init to reset to |0⟩.',
      'In Pulses, set Detuning Δ = 2.0 (off resonance).',
      'Leave Amplitude = 1.0, Length = 0.5.',
      'Click X Pulse.',
      'Notice the arrow does NOT reach the south pole — it rotates on a smaller circle!'
    ],
    expectedResult: 'Arrow does not reach z = −1. It orbits on a cone around the tilted effective field vector.',
    insight: 'This is the origin of control errors in quantum computing. If the control pulse frequency drifts slightly off resonance, the gate fails to flip the qubit fully.'
  },
  {
    id: 13,
    title: 'The Pauli Y Gate — Bit and Phase Flip',
    focus: 'Gate: Y = R_y(π)',
    concept: 'The Pauli Y gate combines a bit flip and a phase flip: Y|0⟩ = i|1⟩, Y|1⟩ = −i|0⟩. Geometrically, it is a 180° rotation around the y-axis.',
    goal: 'Compare the Y rotation trajectory with the X rotation trajectory.',
    steps: [
      'Click Init to reset to |0⟩.',
      'In Quantum gates, click Y.',
      'Watch the arrow rotate 180° around the y-axis, landing at the south pole |1⟩.',
      'Compare this with the X gate: both reach |1⟩, but via completely orthogonal trajectories!'
    ],
    expectedResult: 'Arrow at south pole (z=-1). The trajectory passed through the x-z plane rather than the y-z plane.',
    insight: 'Both X and Y act as "NOT gates" (mapping |0⟩ to |1⟩), but they differ by a phase of i. In quantum mechanics, phase makes all the difference when interfering.'
  },
  {
    id: 14,
    title: 'The Equatorial Tour — H then S then S then S',
    focus: 'Path: H → S → S → S',
    concept: 'By applying H followed by successive S gates, we can visit all four cardinal directions on the equator: +x (|+⟩), +y (|+i⟩), −x (|−⟩), −y (|−i⟩).',
    goal: 'Navigate around all four equatorial cardinal points.',
    steps: [
      'Click Init, then click H → arrow at +x (|+⟩).',
      'Click S → arrow at +y (|+i⟩).',
      'Click S → arrow at −x (|−⟩).',
      'Click S → arrow at −y (|−i⟩).',
      'Click S once more → arrow returns to +x! S⁴ = I.'
    ],
    expectedResult: 'Four 90° steps around the equator, completing a full 360° circle. S⁴ = I.',
    insight: 'The equator of the Bloch sphere represents all states with equal 50/50 measurement probabilities, but different relative phases.'
  },
  {
    id: 15,
    title: 'The X-Z Duality — H · X · H = Z',
    focus: 'Identity: H · X · H = Z',
    concept: 'The Hadamard gate transforms the X operator into the Z operator and vice versa: H X H = Z, and H Z H = X. This means applying X "in the Hadamard basis" is identical to applying Z in the computational basis.',
    goal: 'Verify the identity H · X · H = Z on the Bloch sphere.',
    steps: [
      'Click Init to reset to |0⟩.',
      'Path A: Click Z. Arrow stays at |0⟩ (as established in Task 4).',
      'Path B: Click H (arrow at +x), click X (rotates 180° around x — stays at +x!), click H (arrow back at |0⟩).',
      'Both paths give the exact same final state: H · X · H|0⟩ = Z|0⟩ = |0⟩.'
    ],
    expectedResult: 'Final state: arrow at north pole |0⟩. The identity H · X · H = Z is verified.',
    insight: 'This identity is fundamental to quantum algorithms. Phase kickback, the Deutsch-Jozsa algorithm, and Grover search all rely on switching between X and Z bases using Hadamard gates.'
  },
  {
    id: 16,
    title: 'The Reverse Duality — H · Z · H = X',
    focus: 'Identity: H · Z · H = X',
    concept: 'Conversely, applying Z in the Hadamard basis creates a NOT gate (X): H · Z · H = X. We can flip a bit without ever applying an X gate!',
    goal: 'Flip the qubit from |0⟩ to |1⟩ using only H and Z gates.',
    steps: [
      'Click Init to reset to |0⟩.',
      'Click H: arrow moves to +x on the equator.',
      'Click Z: arrow rotates 180° around z to −x.',
      'Click H: arrow rotates down to the south pole |1⟩!'
    ],
    expectedResult: 'H·Z·H|0⟩ → |1⟩ (south pole). The sequence is mathematically equivalent to the Pauli X gate.',
    insight: 'This proves you do not need physical X rotations to perform NOT operations — Hadamard and Phase gates are sufficient.'
  },
  {
    id: 17,
    title: 'Pulse Phase Control — Y-Axis Pulse',
    focus: 'Pulses: Phase φ = 90°',
    concept: 'By shifting the phase of the driving pulse by 90°, the rotation axis shifts from the x-axis to the y-axis. This allows full 3D control using only frequency and phase modulation of a single drive line.',
    goal: 'Apply a Y-pulse by using the Y Pulse button.',
    steps: [
      'Click Init to reset to |0⟩.',
      'In Pulses, click Y Pulse (or set Phase = 90° and click X Pulse).',
      'Observe the trajectory: the arrow rotates around the y-axis instead of the x-axis.',
      'Compare with Task 11 (X Pulse) to see the orthogonal trajectory.'
    ],
    expectedResult: 'Arrow reaches south pole |1⟩ via the x-z plane rather than the y-z plane.',
    insight: 'In microwave control of superconducting qubits, "I" (in-phase) and "Q" (quadrature) channels control the x and y rotation axes simply by shifting the microwave phase by 90°.'
  },
  {
    id: 18,
    title: 'Explore the Bloch Sphere Shell',
    focus: 'Custom Axis: arbitrary (θ, φ) on the sphere',
    concept: 'Every point on the sphere surface corresponds to a unique quantum state. The polar angle θ controls the measurement probabilities (P(0) = cos²(θ/2), P(1) = sin²(θ/2)), while the azimuthal angle φ controls the relative phase.',
    goal: 'Place the state at a non-standard point: θ = 60°, φ = 120°.',
    steps: [
      'Click Init to reset to |0⟩.',
      'Under Rotations around custom axis, set Polar θ = 60°, Azimuthal φ = 120°, Rotation γ = 180°.',
      'Click Rotate around n̂.',
      'Read the coordinates and check that the vector lies on the unit sphere (x² + y² + z² = 1).'
    ],
    expectedResult: 'Arrow pointing into the upper-back quadrant of the sphere. Length = 1.000.',
    insight: 'Pure states always have length exactly 1. Mixed states (resulting from decoherence or entanglement) lie inside the sphere with length < 1.'
  },
  {
    id: 19,
    title: 'T† · S† · Z — Phase Accumulation',
    focus: 'Sequence: T† · S† · Z',
    concept: 'Rotations around the same axis simply add up: R_z(α) · R_z(β) = R_z(α + β). Here we accumulate −45° + −90° + 180° = +45° of phase.',
    goal: 'Verify that rotations around the same axis are commutative and additive.',
    steps: [
      'Click Init, then click H to reach the equator (+x).',
      'Click Z (+180° around z). Arrow at −x.',
      'Click S† (−90° around z). Arrow at +y.',
      'Click T† (−45° around z). Arrow halfway between +x and +y.',
      'Total angle: 180° − 90° − 45° = 45°. This is identical to a single T gate!'
    ],
    expectedResult: 'Arrow at angle φ = 45° on the equator. Coordinates: x≈0.707, y≈0.707, z=0.',
    insight: 'Because all three gates rotate around the Z axis, they commute: the order does not matter. Try clicking them in a different order and verify!'
  },
  {
    id: 20,
    title: 'Universal Gate Approximation — Solovay-Kitaev',
    focus: 'Concept: Solovay-Kitaev Theorem',
    concept: 'The Solovay-Kitaev theorem states that any single-qubit gate can be approximated to arbitrary accuracy using a finite sequence of gates from the set {H, T}. You do not need continuous rotation hardware to build a universal quantum computer!',
    goal: 'Build an approximation of an arbitrary rotation using only H and T gates.',
    steps: [
      'Click Init to reset to |0⟩.',
      'Apply the sequence: H → T → H → T → H → T.',
      'Watch how alternating H (which swaps z and x) and T (which rotates around z) explores the sphere in a fractal-like pattern.',
      'Observe the final position — you have created an arbitrary rotation without any continuous controls!'
    ],
    expectedResult: 'A state that cannot be reached by Clifford gates alone, constructed entirely from H and T.',
    insight: 'This is why quantum computers can be built with discrete, fault-tolerant gates: the Solovay-Kitaev theorem guarantees we can approximate any rotation with very short sequences.'
  },
  {
    id: 21,
    title: 'U(θ, φ, λ) — The Master Key',
    focus: 'Gate: U(θ, φ, λ)',
    concept: 'The U gate is the most general single-qubit gate. It allows rotation to any point on the Bloch sphere by defining two angles for the polar and azimuthal final position (plus a global phase λ). Any quantum operation can be built from sequences of U gates.',
    goal: 'Create an arbitrary state using the Universal U Gate.',
    steps: [
      'Click INIT to reset to |0⟩.',
      'Open the Universal U Gate section in the control panel.',
      'Set Theta (θ) to 90, Phi (φ) to 45, and Lambda (λ) to 0.',
      'Click Apply U(θ, φ, λ).'
    ],
    expectedResult: 'The state vector moves to the equator (θ=90) and points halfway between X and Y (φ=45).',
    insight: 'Every single-qubit gate (X, Y, Z, H, S, T) is just a specific case of the U gate! By tweaking θ, φ, and λ, you can reach any point on the Bloch sphere in a single step.'
  }
];

// ─── TasksPanel Component ─────────────────────────────────────────────────────
export const TasksPanel: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [completedPuzzles, setCompletedPuzzles] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('qxlabs_bloch_puzzles');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [expanded, setExpanded] = useState<number | null>(null);
  const [expandedPuzzle, setExpandedPuzzle] = useState<number | null>(null);
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [showSolution, setShowSolution] = useState<Record<number, boolean>>({});

  const [showIntro, setShowIntro] = useState(false);
  const [showGates, setShowGates] = useState(false);
  const [showPuzzles, setShowPuzzles] = useState(true);

  // Load task progress from backend on mount/user change
  useEffect(() => {
    async function loadProgress() {
      if (currentUser) {
        const saved = localStorage.getItem(`qrious_bloch_progress_${currentUser.uid}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setCompleted(new Set(parsed));
            }
          } catch (e) {
            console.error("Failed to parse saved bloch progress", e);
          }
        }

        try {
          const response = await apiClient.get<{ data: { completed_tasks: number[] } }>('/api/v1/bloch/progress');
          if (response.data && response.data.data && Array.isArray(response.data.data.completed_tasks)) {
            const tasksList = response.data.data.completed_tasks;
            setCompleted(new Set(tasksList));
            localStorage.setItem(
              `qrious_bloch_progress_${currentUser.uid}`,
              JSON.stringify(tasksList)
            );
          }
        } catch (err) {
          console.error("Failed to fetch bloch progress from backend", err);
        }
      } else {
        setCompleted(new Set());
      }
    }
    loadProgress();
  }, [currentUser]);

  const toggleComplete = async (id: number) => {
    const isCompleting = !completed.has(id);
    const nextSet = new Set(completed);
    if (isCompleting) {
      nextSet.add(id);
    } else {
      nextSet.delete(id);
    }
    const nextList = Array.from(nextSet);

    setCompleted(nextSet);

    if (currentUser) {
      localStorage.setItem(
        `qrious_bloch_progress_${currentUser.uid}`,
        JSON.stringify(nextList)
      );
      try {
        await apiClient.post('/api/v1/bloch/progress', { completed_tasks: nextList });
        if (isCompleting) {
          toast.success("Task completed! Progress saved.");
          window.dispatchEvent(new CustomEvent('xp_updated'));
        }
      } catch (err) {
        console.error("Failed to save bloch progress to backend", err);
      }
    }
  };

  const togglePuzzleComplete = (id: number) => {
    const next = new Set(completedPuzzles);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      toast.success("Puzzle solved! Mastered quantum rotation.");
    }
    setCompletedPuzzles(next);
    localStorage.setItem('qxlabs_bloch_puzzles', JSON.stringify(Array.from(next)));
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => prev === id ? null : id);
  };

  const togglePuzzleExpand = (id: number) => {
    setExpandedPuzzle(prev => prev === id ? null : id);
  };

  const pct = Math.round((completed.size / TASKS.length) * 100);
  const puzzlePct = Math.round((completedPuzzles.size / GATE_PUZZLES.length) * 100);

  return (
    <div className="w-full font-sans space-y-4 text-zinc-900">

      {/* ── Introduction & Mathematical Background accordion ── */}
      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-200">
        <button
          onClick={() => setShowIntro(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 transition-colors text-left hover:bg-zinc-50"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-zinc-800 shrink-0" />
            <div>
              <p className="font-semibold text-xs text-zinc-950 uppercase tracking-wider">Introduction &amp; Mathematical Background</p>
              <p className="text-xs text-zinc-500 mt-0.5">Bloch sphere theory, rotation operators, gate definitions &amp; usage guide</p>
            </div>
          </div>
          {showIntro
            ? <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
            : <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />}
        </button>

        {showIntro && (
          <div className="border-t border-zinc-100 px-5 pb-6 pt-4 space-y-5 bg-white">
            {/* Overview text */}
            <div className="space-y-2">
              {INTRO.overview.split('\n\n').map((para, i) => (
                <p key={i} className="text-xs text-zinc-600 leading-relaxed">{para}</p>
              ))}
            </div>

            {/* Math reference cards - HIGH CONTRAST & CLEAR */}
            <div>
              <p className="text-[11px] font-semibold text-zinc-900 uppercase tracking-widest mb-3">Mathematical Background</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INTRO.math.map(m => (
                  <div key={m.title} className="rounded-xl border border-zinc-200 bg-[#fbfbfd] p-4 space-y-2">
                    <p className="text-xs font-semibold text-zinc-950">{m.title}</p>
                    <div className="bg-zinc-100/90 border border-zinc-200 text-zinc-950 font-mono text-xs p-3 rounded-lg leading-relaxed whitespace-pre-wrap font-semibold select-all">
                      {m.formula}
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How to use */}
            <div>
              <p className="text-[11px] font-semibold text-zinc-900 uppercase tracking-widest mb-3">How to Use This Tool</p>
              <div className="space-y-2">
                {INTRO.howToUse.map(item => (
                  <div key={item.label} className="flex gap-3 text-xs">
                    <span className="shrink-0 font-medium text-zinc-900 w-36 text-xs">{item.label}</span>
                    <span className="text-zinc-500 text-xs leading-relaxed">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Gate Matrix Reference accordion ── */}
      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-200">
        <button
          onClick={() => setShowGates(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 transition-colors text-left hover:bg-zinc-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center shrink-0 border border-zinc-300 text-zinc-900 bg-zinc-100 font-mono text-[10px] rounded font-bold">U</div>
            <div>
              <p className="font-semibold text-xs text-zinc-950 uppercase tracking-wider">Gate Matrix Reference</p>
              <p className="text-xs text-zinc-500 mt-0.5">Standard 2×2 unitary gate representations</p>
            </div>
          </div>
          {showGates
            ? <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
            : <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />}
        </button>

        {showGates && (
          <div className="border-t border-zinc-100 px-5 pb-6 pt-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {GATE_REFERENCE.map(gate => (
                <div key={gate.symbol} className="rounded-xl border border-zinc-200 bg-[#fbfbfd] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-zinc-950">{gate.name}</p>
                    <span className="text-[10px] font-mono bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-bold border border-zinc-200">{gate.symbol}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center my-3">
                    <div className="flex items-center gap-2 text-zinc-950 font-mono text-xs">
                      {gate.prefix && <span className="font-semibold">{gate.prefix}</span>}
                      <div className="flex gap-1 relative px-2 py-1">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 border-l-2 border-t-2 border-b-2 border-zinc-400 rounded-l-sm" />
                        <div className="absolute right-0 top-0 bottom-0 w-1.5 border-r-2 border-t-2 border-b-2 border-zinc-400 rounded-r-sm" />
                        
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-center px-1">
                          {gate.matrix.map((row, rIdx) => (
                            <React.Fragment key={rIdx}>
                              <span className="font-semibold text-zinc-900">{row[0]}</span>
                              <span className="font-semibold text-zinc-900">{row[1]}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-snug">{gate.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── NEW: Quantum Gate Puzzles Section ── */}
      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-200">
        <button
          onClick={() => setShowPuzzles(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 transition-colors text-left hover:bg-zinc-50"
        >
          <div className="flex items-center gap-3">
            <Puzzle className="w-4 h-4 text-zinc-900 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-xs text-zinc-950 uppercase tracking-wider">Gate Puzzles</p>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-semibold border border-zinc-200">
                  {completedPuzzles.size} / {GATE_PUZZLES.length} Solved
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Solve state transformation challenges with constrained quantum gates</p>
            </div>
          </div>
          {showPuzzles
            ? <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
            : <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />}
        </button>

        {showPuzzles && (
          <div className="border-t border-zinc-100 px-5 pb-6 pt-4 space-y-3 bg-[#fbfbfd]">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>Goal: Transition the Bloch vector using minimal or restricted operations.</span>
              <span className="font-mono font-medium">{puzzlePct}% Completed</span>
            </div>

            <div className="space-y-2.5">
              {GATE_PUZZLES.map(puzzle => {
                const isSolved = completedPuzzles.has(puzzle.id);
                const isExpanded = expandedPuzzle === puzzle.id;
                const hasHintOpen = !!showHint[puzzle.id];
                const hasSolutionOpen = !!showSolution[puzzle.id];

                return (
                  <div
                    key={puzzle.id}
                    className={cn(
                      "border rounded-xl transition-all duration-200 bg-white",
                      isSolved ? "border-zinc-300 bg-zinc-50/50" : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <div className="flex items-center justify-between p-4 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => togglePuzzleComplete(puzzle.id)}
                          className="shrink-0 text-zinc-900 hover:scale-110 transition-transform"
                          title={isSolved ? 'Mark as unsolved' : 'Mark as solved'}
                        >
                          {isSolved ? (
                            <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-300" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0" onClick={() => togglePuzzleExpand(puzzle.id)}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-semibold text-zinc-700 uppercase tracking-wide">
                              {puzzle.difficulty}
                            </span>
                            <span className="text-xs font-semibold text-zinc-950 truncate">
                              {puzzle.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                            Target: {puzzle.targetState}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => togglePuzzleExpand(puzzle.id)}
                        className="p-1 rounded-full hover:bg-zinc-100 text-zinc-500"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-zinc-100 p-4 space-y-3 bg-[#fbfbfd] text-xs">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Start</span>
                            <span className="font-mono text-zinc-900 font-medium">{puzzle.initialState}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Target</span>
                            <span className="font-mono text-zinc-900 font-medium">{puzzle.targetState}</span>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">Constraint Rule</span>
                          <span className="text-zinc-700">{puzzle.rules}</span>
                        </div>

                        {/* Hint Toggle */}
                        <div>
                          <button
                            onClick={() => setShowHint(prev => ({ ...prev, [puzzle.id]: !prev[puzzle.id] }))}
                            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950 font-medium transition-colors"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>{hasHintOpen ? 'Hide Hint' : 'Show Hint'}</span>
                          </button>
                          {hasHintOpen && (
                            <p className="mt-1.5 p-2.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 leading-relaxed text-[11px]">
                              {puzzle.hint}
                            </p>
                          )}
                        </div>

                        {/* Solution Walkthrough Toggle */}
                        <div>
                          <button
                            onClick={() => setShowSolution(prev => ({ ...prev, [puzzle.id]: !prev[puzzle.id] }))}
                            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950 font-medium transition-colors"
                          >
                            <span>{hasSolutionOpen ? 'Hide Solution' : 'Reveal Solution'}</span>
                          </button>
                          {hasSolutionOpen && (
                            <div className="mt-1.5 p-2.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900 leading-relaxed text-[11px] font-mono">
                              {puzzle.solution}
                            </div>
                          )}
                        </div>

                        {/* Mark button */}
                        <button
                          onClick={() => togglePuzzleComplete(puzzle.id)}
                          className={cn(
                            "w-full py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm",
                            isSolved
                              ? "bg-zinc-200 text-zinc-800 hover:bg-zinc-300"
                              : "bg-zinc-950 text-white hover:bg-zinc-800"
                          )}
                        >
                          <Check className="w-3 h-3" />
                          <span>{isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Guided Tasks Header ── */}
      <div className="flex items-center justify-between gap-4 px-1 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-zinc-900" />
            <h2 className="text-sm font-semibold text-zinc-950">21 Guided Exploration Tasks</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 ml-6">
            {completed.size} of {TASKS.length} completed ({pct}%) — one gate or concept per task
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-24 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-500 w-8 text-right">{pct}%</span>
        </div>
      </div>

      {/* ── Task Cards List ── */}
      <div className="space-y-2.5">
        {TASKS.map(task => {
          const done = completed.has(task.id);
          const open = expanded === task.id;

          return (
            <div
              key={task.id}
              className={cn(
                "border rounded-2xl overflow-hidden transition-all duration-200 bg-white shadow-sm",
                done ? "border-zinc-300 bg-zinc-50/50" : "border-zinc-200 hover:border-zinc-300"
              )}
            >
              {/* Header row */}
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  onClick={() => toggleComplete(task.id)}
                  className="shrink-0 hover:scale-110 transition-transform"
                  title={done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                    : <Circle className="w-4 h-4 text-zinc-300" />}
                </button>

                <button className="flex-1 text-left min-w-0" onClick={() => toggleExpand(task.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-zinc-500">Task {task.id}</span>
                    <span className="text-[10px] font-mono bg-zinc-100 text-zinc-700 rounded px-1.5 py-0.5 truncate max-w-[220px] font-semibold border border-zinc-200/60">
                      {task.focus}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold mt-1 leading-snug",
                    done ? "text-zinc-500 line-through" : "text-zinc-950"
                  )}>
                    {task.title}
                  </p>
                </button>

                <button onClick={() => toggleExpand(task.id)} className="shrink-0 p-0.5 text-zinc-500">
                  {open
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded body */}
              {open && (
                <div className="border-t border-zinc-100 px-5 pb-5 pt-4 space-y-4 bg-[#fbfbfd]">
                  {/* Concept */}
                  <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-semibold text-zinc-900 uppercase tracking-widest mb-1.5">Concept</p>
                    <p className="text-xs text-zinc-600 leading-relaxed">{task.concept}</p>
                  </div>

                  {/* Goal */}
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-900 uppercase tracking-widest mb-1">Goal</p>
                    <p className="text-xs text-zinc-700 leading-relaxed font-medium">{task.goal}</p>
                  </div>

                  {/* Steps */}
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-900 uppercase tracking-widest mb-2">Steps</p>
                    <ol className="space-y-2">
                      {task.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-xs">
                          <span className="text-[10px] font-mono font-semibold text-zinc-800 bg-zinc-100 border border-zinc-200 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-zinc-600 leading-relaxed text-xs">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Expected result */}
                  <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Expected Result</p>
                    <p className="text-xs font-mono text-zinc-900 leading-relaxed font-medium">{task.expectedResult}</p>
                  </div>

                  {/* Insight */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <p className="text-[10px] font-semibold text-zinc-900 uppercase tracking-widest mb-1">Physical Insight</p>
                    <p className="text-xs text-zinc-600 leading-relaxed">{task.insight}</p>
                  </div>

                  {/* Complete button */}
                  <button
                    onClick={() => { toggleComplete(task.id); if (!done) setExpanded(null); }}
                    className={cn(
                      "w-full py-2.5 rounded-full text-xs font-medium transition-all duration-200 shadow-sm",
                      done
                        ? "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                        : "bg-zinc-950 text-white hover:bg-zinc-800 active:scale-95"
                    )}
                  >
                    {done ? '↩ Mark as Incomplete' : '✓ Mark as Complete'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
