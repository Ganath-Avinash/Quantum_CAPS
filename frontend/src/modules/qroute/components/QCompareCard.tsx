import React, { useEffect, useState } from 'react';
import { useQRouteApi } from '../hooks/useQRouteApi';
import type { QCompareReport } from '../hooks/useQRouteApi';
import { HistogramChart } from '../../gates-playground/components/HistogramChart';
import { AudioOverviewOutputCard } from '../../qstudio/components/AudioOverviewOutputCard';
import { AnimationOverviewOutputCard } from '../../qstudio/components/AnimationOverviewOutputCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FaCircleNotch, FaHeadphones, FaLightbulb, FaMagic, FaShapes } from 'react-icons/fa';
// Same three visual themes Slides/Video Overview already offer — reused as-is
// (not a separate qCompare-specific type) since the underlying Manim render
// (manim_scenes.py's THEME_PALETTES) uses the identical three keys.
import { SLIDE_THEME_OPTIONS } from '../../qstudio/types';
import type { SlideTheme } from '../../qstudio/types';

interface QCompareCardProps {
  jobId: string;
  isSimulator: boolean;
}

const toProbabilities = (counts: Record<string, number>): Record<string, number> => {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(Object.entries(counts).map(([bitstring, count]) => [bitstring, count / total]));
};

export const QCompareCard: React.FC<QCompareCardProps> = ({ jobId, isSimulator }) => {
  const { runQCompare, getQCompare, runQCompareAudio, runQCompareAnimation } = useQRouteApi();
  const [report, setReport] = useState<QCompareReport | null>(null);
  const [checking, setChecking] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [startingAudio, setStartingAudio] = useState(false);
  const [startingAnimation, setStartingAnimation] = useState(false);
  const [animationTheme, setAnimationTheme] = useState<SlideTheme>('minimal_dark');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getQCompare(jobId)
      .then((existing) => !cancelled && setReport(existing))
      .catch(() => {})
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await runQCompare(jobId);
      setReport(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate qCompare report');
    } finally {
      setGenerating(false);
    }
  };

  const handleAudio = async () => {
    setStartingAudio(true);
    setError(null);
    try {
      setReport(await runQCompareAudio(jobId));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to start audio generation');
    } finally {
      setStartingAudio(false);
    }
  };

  const handleAnimation = async () => {
    setStartingAnimation(true);
    setError(null);
    try {
      setReport(await runQCompareAnimation(jobId, animationTheme));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to start animation generation');
    } finally {
      setStartingAnimation(false);
    }
  };

  if (checking) return null;

  if (!report) {
    return (
      <Card className="col-span-12 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl bg-white dark:bg-zinc-950">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white">
                qCompare — Physical Hardware vs. Ideal Simulation
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Fundamental physics and noise sources that explain why real quantum QPUs diverge from ideal simulator outcomes.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono border-zinc-200 dark:border-zinc-800">
              Noise Physics
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Ideal quantum simulators compute exact statevectors using unitary matrix multiplication. In physical quantum computers (QPUs), hardware results diverge from ideal distributions due to physical noise channels inherent to quantum systems:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">T₁ Energy Relaxation</h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Spontaneous decay from the excited state |1⟩ to ground state |0⟩ caused by thermal coupling to the ambient substrate environment.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">T₂ Phase Dephasing</h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Fluctuations in magnetic flux or control lines that randomize the relative phase between |0⟩ and |1⟩, destroying quantum coherence.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">Gate Infidelities</h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Microwave pulse distortion, timing jitter, and cross-resonance calibration errors (~0.1% for 1Q gates, ~1.5% for 2Q CNOT gates).
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">SPAM & Readout Errors</h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                State Preparation and Measurement errors where readout resonators misclassify a |0⟩ as |1⟩ or vice versa during projective measurement.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">Lattice Crosstalk</h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Microwave pulses driving target qubits can weakly couple and induce stray phase shifts on neighboring spectator qubits in the QPU array.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">Shot Sampling Statistics</h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                A finite shot count (e.g. 100 or 1,024 shots) produces binomial counting variance σ ≈ √(p(1-p)/N) even on mathematically perfect systems.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const idealProbabilities = toProbabilities(report.ideal_counts);
  const realProbabilities = toProbabilities(report.real_counts);

  return (
    <Card className="col-span-12">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-sm">qCompare — ideal vs. real hardware</CardTitle>
        <Badge variant="outline" className="font-mono text-xs">
          TVD {(report.total_variation_distance * 100).toFixed(1)}%
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-56">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Ideal (AerSimulator)
            </p>
            <HistogramChart probabilities={idealProbabilities} />
          </div>
          <div className="h-56">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Real ({report.device_id})
            </p>
            <HistogramChart probabilities={realProbabilities} />
          </div>
        </div>

        {(generating || report.simple_explanation) && (
          <div className="flex gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
            {generating ? (
              <>
                <FaCircleNotch className="animate-spin w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">
                    Explained Simply
                  </p>
                  <p className="text-sm text-muted-foreground">Writing a plain-English explanation of this run…</p>
                </div>
              </>
            ) : (
              <>
                <FaLightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">
                    Explained Simply
                  </p>
                  <p className="text-sm leading-relaxed">{report.simple_explanation}</p>
                </div>
              </>
            )}
          </div>
        )}

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
            Technical summary
          </p>
          <p className="text-sm leading-relaxed">{report.summary}</p>
        </div>

        {report.likely_causes.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
              Likely causes
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {report.likely_causes.map((cause, i) => (
                <li key={i}>{cause}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            {generating ? 'Regenerating…' : 'Regenerate'}
          </button>

          <button
            onClick={handleAudio}
            disabled={startingAudio}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-xs font-medium disabled:opacity-50 hover:bg-accent transition-colors"
          >
            {startingAudio ? <FaCircleNotch className="animate-spin w-3 h-3" /> : <FaHeadphones className="w-3 h-3" />}
            {report.audio_output_id ? 'Regenerate podcast' : 'Turn into podcast'}
          </button>

          <Select value={animationTheme} onValueChange={(v) => setAnimationTheme(v as SlideTheme)}>
            <SelectTrigger className="h-7 w-36 text-xs" disabled={startingAnimation}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SLIDE_THEME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={handleAnimation}
            disabled={startingAnimation}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-xs font-medium disabled:opacity-50 hover:bg-accent transition-colors"
          >
            {startingAnimation ? <FaCircleNotch className="animate-spin w-3 h-3" /> : <FaShapes className="w-3 h-3" />}
            {report.animation_output_id ? 'Regenerate animation (new theme)' : 'Turn into animation'}
          </button>
        </div>

        {report.audio_output_id && <AudioOverviewOutputCard outputId={report.audio_output_id} />}
        {report.animation_output_id && <AnimationOverviewOutputCard outputId={report.animation_output_id} />}
      </CardContent>
    </Card>
  );
};
