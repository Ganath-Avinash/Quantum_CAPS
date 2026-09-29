import React from 'react';
import { Link } from 'react-router-dom';
import { QxLabsNavbar } from '@/components/QxLabsNavbar';
import {
  FaLaptopCode,
  FaSatelliteDish,
  FaGlobe,
  FaArrowRight,
  FaCheck,
} from 'react-icons/fa';

export const QxLabsLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fbfbfd] text-zinc-900 flex flex-col font-sans selection:bg-zinc-200">
      {/* Navbar */}
      <QxLabsNavbar />

      {/* Hero Section */}
      <section className="pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Main Headline - Apple-style Monochrome Gradient */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight max-w-4xl leading-[1.08]">
          <span className="bg-gradient-to-b from-zinc-950 via-zinc-800 to-zinc-500 bg-clip-text text-transparent">
            Quantum Learning Sandbox
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed font-normal">
          Design and simulate multi-qubit circuits with Qiskit Aer, dispatch jobs to real quantum processors via QRoute, and master quantum state mechanics with our interactive 3D Bloch sphere challenges.
        </p>

        {/* Action Buttons - Apple Pill Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 z-10">
          <Link
            to="/playground"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-sm tracking-tight transition-all duration-200 shadow-sm active:scale-95"
          >
            <FaLaptopCode className="text-sm" />
            <span>Launch Quantum Playground</span>
            <FaArrowRight className="text-[11px]" />
          </Link>

          <Link
            to="/qroute"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 hover:border-zinc-400 font-medium text-sm tracking-tight transition-all duration-200 shadow-sm active:scale-95"
          >
            <FaSatelliteDish className="text-sm text-zinc-700" />
            <span>Dispatch to Hardware (QRoute)</span>
          </Link>

          <Link
            to="/bloch"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 hover:border-zinc-400 font-medium text-sm tracking-tight transition-all duration-200 shadow-sm active:scale-95"
          >
            <FaGlobe className="text-sm text-zinc-700" />
            <span>3D Bloch Sphere Tasks</span>
          </Link>
        </div>

        {/* Metric Cards - Mac Light Monochrome Design */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl z-10 text-left">
          <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-zinc-200/80 transition-all">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              SIMULATION ENGINE
            </div>
            <div className="text-xl font-semibold text-zinc-950 mt-1">
              Qiskit Aer 0.17
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Deterministic & Noisy sampling
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-zinc-200/80 transition-all">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              HARDWARE VENDORS
            </div>
            <div className="text-xl font-semibold text-zinc-950 mt-1">
              4 Providers
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              IBM, IonQ, qBraid, IQM
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-zinc-200/80 transition-all">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              3D VISUALIZATION
            </div>
            <div className="text-xl font-semibold text-zinc-950 mt-1">
              WebGL Bloch Sphere
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Three.js + Real-time trajectories
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-zinc-200/80 transition-all">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              CHALLENGE TASKS
            </div>
            <div className="text-xl font-semibold text-zinc-950 mt-1">
              Curated Tasks
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Curated tasks to understand bloch sphere
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Platform Capabilities
          </h2>
          <p className="text-3xl sm:text-4xl font-semibold text-zinc-950 tracking-tight mt-2">
            The Three Pillars of QxLabs
          </p>
          <p className="text-sm text-zinc-600 mt-3 max-w-xl mx-auto font-normal">
            Everything you need to experiment, simulate, visualize, and execute quantum algorithms in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pillar 1: Quantum Playground */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Clean Inline Header to completely eliminate overline cutting */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] border border-zinc-200/80 flex items-center justify-center text-zinc-900 text-xl">
                  <FaLaptopCode />
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-medium tracking-wide">
                  CIRCUITS
                </span>
              </div>

              <h3 className="text-xl font-semibold text-zinc-950 tracking-tight">
                1. Quantum Playground
              </h3>
              <p className="text-xs text-zinc-600 mt-2.5 leading-relaxed">
                Visual drag-and-drop circuit canvas supporting single-qubit rotations, entangling 2-qubit gates, and measurement registers.
              </p>

              <ul className="mt-6 space-y-3 text-xs text-zinc-700">
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Real-time statevector amplitude & phase calculation</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Measurement probability distribution histogram</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Full two-way OpenQASM and Python Qiskit code export</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Integrated keyboard shortcuts and gate debugging</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100">
              <Link
                to="/playground"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold tracking-wide transition-colors"
              >
                <span>Open Playground</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>

          {/* Pillar 2: QRoute */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Clean Inline Header to completely eliminate overline cutting */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] border border-zinc-200/80 flex items-center justify-center text-zinc-900 text-xl">
                  <FaSatelliteDish />
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-medium tracking-wide">
                  HARDWARE
                </span>
              </div>

              <h3 className="text-xl font-semibold text-zinc-950 tracking-tight">
                2. QRoute Dispatcher
              </h3>
              <p className="text-xs text-zinc-600 mt-2.5 leading-relaxed">
                Compose your quantum circuit once and submit directly to commercial quantum hardware grouped by physical modality.
              </p>

              <ul className="mt-6 space-y-3 text-xs text-zinc-700">
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Multi-vendor support: IBM, IonQ, qBraid & IQM</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Live chip status: Garnet (20q), Emerald (54q), Sirius (16q)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Real-time job queue polling and result histogram viewer</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Free mock endpoints for zero-cost rapid testing</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100">
              <Link
                to="/qroute"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold tracking-wide transition-colors"
              >
                <span>Launch QRoute</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>

          {/* Pillar 3: Bloch Sphere Tasks */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Clean Inline Header to completely eliminate overline cutting */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] border border-zinc-200/80 flex items-center justify-center text-zinc-900 text-xl">
                  <FaGlobe />
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-medium tracking-wide">
                  3D & TASKS
                </span>
              </div>

              <h3 className="text-xl font-semibold text-zinc-950 tracking-tight">
                3. Bloch Sphere (Tasks)
              </h3>
              <p className="text-xs text-zinc-600 mt-2.5 leading-relaxed">
                Full 3D WebGL Bloch sphere visualizer paired with curated tasks to understand bloch sphere dynamics.
              </p>

              <ul className="mt-6 space-y-3 text-xs text-zinc-700">
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Curated tasks to understand bloch sphere mechanics</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Live vector transformation trajectories on the sphere surface</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Arbitrary axis rotation controls (polar θ, azimuthal φ, rotation γ)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheck className="text-zinc-900 text-xs shrink-0 mt-0.5" />
                  <span>Persistent task completion tracking with automated validation</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100">
              <Link
                to="/bloch"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold tracking-wide transition-colors"
              >
                <span>Explore Bloch Tasks</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
            <span className="font-semibold text-zinc-950 text-sm tracking-tight">QxLabs</span>
            <span className="text-xs text-zinc-500">— High-Performance Quantum Learning Sandbox</span>
          </div>
          <div className="text-xs text-zinc-500">
            © 2026 copyrighted all rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
};
