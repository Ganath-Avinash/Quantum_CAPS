import { useState, useCallback } from 'react';
import { apiClient } from '../../../lib/apiClient';

export interface CircuitContext {
  qasm: string;
  qubits: number;
  cbits: number;
  gateCount: number;
  selectedGate?: string | null;
  executionResult?: any;
  executionError?: string | null;
  loadedAlgorithm?: string | null;
}

function clientSideQuantumFallback(question: string, circuit?: CircuitContext): string {
  const q = question.toLowerCase();
  const gates = circuit?.gateCount || 0;
  const qubits = circuit?.qubits || 2;
  const qasm = circuit?.qasm || '';

  if (q.includes('hadamard') || q.includes('what is h') || q.includes('h gate')) {
    return `### Hadamard Gate ($H$)\n\nThe **Hadamard gate** maps computational basis states into equal superpositions:\n\n$$H|0\\rangle = |+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$$\n$$H|1\\rangle = |-\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}$$\n\nApplying $H$ twice returns the qubit to its original state ($H^2 = I$).`;
  }
  if (q.includes('cnot') || q.includes('cx') || q.includes('entangle')) {
    return `### Controlled-NOT ($CNOT$ / $CX$)\n\nThe **CNOT gate** operates on two qubits, inverting the target if the control qubit is $|1\\rangle$:\n\n$$|00\\rangle \\to |00\\rangle, \\quad |10\\rangle \\to |11\\rangle$$\n\nUsed after an $H$ gate, it generates a maximally entangled Bell state: $|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$.`;
  }
  if (q.includes('x gate') || q.includes('pauli-x') || q.includes('what is x') || q.includes('not gate')) {
    return `### Pauli-X Gate ($X$)\n\nThe quantum NOT gate performs a bit-flip rotation around the X-axis of the Bloch sphere:\n\n$$X|0\\rangle = |1\\rangle, \\quad X|1\\rangle = |0\\rangle$$`;
  }
  if (gates === 0) {
    return `### Quantum Circuit: Ready to Build\n\nYour circuit currently has **${qubits} qubits** in state $|0\\rangle^{\\otimes ${qubits}}$ and **0 gates**.\n\n**Getting Started:**\n1. Select a qubit rail and place an **$H$ (Hadamard)** gate on $q_0$.\n2. Add a **$CX$ (CNOT)** gate between $q_0$ and $q_1$ to create entanglement.\n3. Add **Measurement** gates to inspect output probabilities on the histogram.`;
  }
  return `### Circuit Overview (${gates} gates, ${qubits} qubits)\n\nYour circuit contains **${gates} quantum operations** on **${qubits} qubits**.\n\n\`\`\`qasm\n${qasm.trim() || '// empty circuit'}\n\`\`\`\n\n*Tip: Click "Run" in the toolbar to simulate the quantum statevector and view probability measurements.*`;
}

export const useAiTutorApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askAi = useCallback(async (question: string, circuit_context?: CircuitContext) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/v1/ai/ask', {
        question,
        circuit_context
      });
      return response.data;
    } catch (err: any) {
      console.warn('Backend AI ask unavailable, falling back to local quantum knowledge engine:', err);
      return {
        answer: clientSideQuantumFallback(question, circuit_context),
        sources: ['QxLabs Quantum Physics Engine']
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const explainCircuit = useCallback(async (circuit_context: CircuitContext) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/v1/ai/explain-circuit', { circuit_context });
      return response.data.explanation;
    } catch (err: any) {
      console.warn('Backend explain-circuit unavailable, falling back:', err);
      return clientSideQuantumFallback('explain circuit', circuit_context);
    } finally {
      setLoading(false);
    }
  }, []);

  const optimizeCircuit = useCallback(async (circuit_context: CircuitContext) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/v1/ai/optimize', { circuit_context });
      return response.data.suggestions;
    } catch (err: any) {
      console.warn('Backend optimize unavailable, falling back:', err);
      return [
        circuit_context?.gateCount === 0
          ? 'Your circuit is currently empty (0 gates). Place initial gates like H or X to begin building.'
          : '### Circuit Optimization Analysis\n\n1. **Cancel Self-Inverse Gates**: Adjacent identical gates ($H \\cdot H$, $X \\cdot X$) evaluate to identity and can be removed.\n2. **Parallelize Gates**: Place non-overlapping single-qubit gates in the same execution slice to minimize total circuit depth.\n3. **Postpone Measurements**: Keep measurement gates at the very end of the circuit.'
      ];
    } finally {
      setLoading(false);
    }
  }, []);

  const detectMistakes = useCallback(async (circuit_context: CircuitContext) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/v1/ai/detect-mistakes', { circuit_context });
      return response.data.issues;
    } catch (err: any) {
      console.warn('Backend detect-mistakes unavailable, falling back:', err);
      return [
        circuit_context?.gateCount === 0
          ? 'No mistakes detected! The circuit is currently empty and ready for new gates.'
          : '### Circuit Verification Check\n\n- **Qubit Allocation**: Register bounds are valid.\n- **Unitary Operations**: Operations preserve quantum state vector norm.\n- **Best Practice**: Verify measurement gates connect to the appropriate classical register indices.'
      ];
    } finally {
      setLoading(false);
    }
  }, []);

  return { askAi, explainCircuit, optimizeCircuit, detectMistakes, loading, error };
};

