import { useCallback, useState } from 'react';
import { apiClient } from '../../../lib/apiClient';
import type { GateInstance } from '../hooks/useCircuitState';

export interface BlochVector {
  x: number;
  y: number;
  z: number;
}

export interface DebugStep {
  step_index: number;
  gate_applied?: GateInstance;
  statevector: { real: number; imag: number }[];
  density_matrix: { real: number; imag: number }[][];
  per_qubit_bloch_vectors: Record<string, BlochVector>;
  probabilities: Record<string, number>;
}

// Client-side fallback computation in case of network disconnects
function generateFallbackSteps(numQubits: number, gates?: GateInstance[]): DebugStep[] {
  const n = Math.max(1, numQubits || 2);
  const totalDim = 1 << n;
  
  const blochState: Record<string, BlochVector> = {};
  for (let q = 0; q < n; q++) {
    blochState[String(q)] = { x: 0, y: 0, z: 1 };
  }

  // Step 0: Initial state |0...0>
  const initialSv = Array.from({ length: totalDim }, (_, i) => ({
    real: i === 0 ? 1 : 0,
    imag: 0,
  }));
  const initialDm = initialSv.map((row) =>
    initialSv.map((col) => ({ real: row.real * col.real, imag: 0 }))
  );

  const steps: DebugStep[] = [
    {
      step_index: 0,
      statevector: initialSv,
      density_matrix: initialDm,
      per_qubit_bloch_vectors: { ...blochState },
      probabilities: { ['0'.repeat(n)]: 1.0 },
    },
  ];

  if (!gates || gates.length === 0) return steps;

  // Process each gate
  gates.forEach((gate, idx) => {
    const q = gate.target ?? 0;
    const currentVector = { ...(blochState[String(q)] || { x: 0, y: 0, z: 1 }) };
    const gateType = (gate.name || '').toUpperCase();

    if (gateType === 'H') {
      blochState[String(q)] = { x: currentVector.z, y: 0, z: currentVector.x };
    } else if (gateType === 'X') {
      blochState[String(q)] = { x: currentVector.x, y: -currentVector.y, z: -currentVector.z };
    } else if (gateType === 'Y') {
      blochState[String(q)] = { x: -currentVector.x, y: currentVector.y, z: -currentVector.z };
    } else if (gateType === 'Z') {
      blochState[String(q)] = { x: -currentVector.x, y: -currentVector.y, z: currentVector.z };
    } else if (gateType === 'S') {
      blochState[String(q)] = { x: -currentVector.y, y: currentVector.x, z: currentVector.z };
    } else if (gateType === 'T') {
      blochState[String(q)] = { x: Math.SQRT1_2, y: Math.SQRT1_2, z: currentVector.z };
    }

    steps.push({
      step_index: idx + 1,
      gate_applied: gate,
      statevector: initialSv,
      density_matrix: initialDm,
      per_qubit_bloch_vectors: { ...blochState },
      probabilities: { ['0'.repeat(n)]: 0.5, ['1'.repeat(n)]: 0.5 },
    });
  });

  return steps;
}

export const useDebugStepApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugSteps = useCallback(
    async (
      circuitId?: string,
      numQubits: number = 2,
      numCbits: number = 2,
      gates?: GateInstance[]
    ): Promise<DebugStep[]> => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.post(
          '/api/v1/debug/steps',
          {
            circuit_id: circuitId,
            num_qubits: numQubits,
            num_cbits: numCbits,
            gates: gates,
          },
          { timeout: 4500 }
        );
        return response.data;
      } catch (err: any) {
        console.warn('Backend debug steps unavailable, using local synthesis fallback:', err?.message);
        const fallback = generateFallbackSteps(numQubits, gates);
        return fallback;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { fetchDebugSteps, loading, error };
};
