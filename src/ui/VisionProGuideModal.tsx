import React from 'react';
import { X, CheckCircle2, Shield, Sliders, Eye, Hand, Monitor } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VisionProGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              Apple Vision Pro & WebXR Compatibility Guide
            </h2>
            <p className="text-xs text-slate-400">Safari on visionOS Configuration & Interaction Architecture</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm leading-relaxed">
          {/* Section 1: Security & HTTPS */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <h3 className="font-semibold text-cyan-300 flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-emerald-400" /> 1. HTTPS Requirement
            </h3>
            <p className="text-xs text-slate-300">
              The WebXR Device API is <strong>strictly restricted to Secure Contexts (HTTPS)</strong>. When testing on Apple Vision Pro over your local Wi-Fi network, you must access the server using <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">https://&lt;your-local-ip&gt;:5173</code>. Vite's SSL plugin automatically generates a self-signed TLS certificate. Accept the certificate warning once in Safari on visionOS to allow WebXR session access.
            </p>
          </div>

          {/* Section 2: visionOS Safari Feature Flags */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <h3 className="font-semibold text-cyan-300 flex items-center gap-2 text-base">
              <Sliders className="w-4 h-4 text-amber-400" /> 2. visionOS Safari WebXR Feature Flags
            </h3>
            <p className="text-xs text-slate-300">
              In visionOS 1.0 – 1.2, Apple disables WebXR hand tracking by default for privacy reasons. In visionOS 2.0+ (Safari 18), WebXR immersive sessions are enabled by default. To unlock raw 25-joint hand tracking:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <li>Open <strong>Settings</strong> on Apple Vision Pro.</li>
              <li>Go to <strong>Apps</strong> &gt; <strong>Safari</strong> &gt; <strong>Advanced</strong> &gt; <strong>Feature Flags</strong>.</li>
              <li>Enable: <strong>WebXR Device API</strong></li>
              <li>Enable: <strong>WebXR Hand Input Mode</strong></li>
              <li>Restart Safari and reload this page over HTTPS.</li>
            </ol>
          </div>

          {/* Section 3: Dual-Input Spatial Architecture & Wire Connection */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <h3 className="font-semibold text-cyan-300 flex items-center gap-2 text-base">
              <Hand className="w-4 h-4 text-indigo-400" /> 3. Operating Equipment & Connecting Wires in visionOS
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Connecting Circuit Wires (Gaze &amp; Pinch):
                </div>
                <p className="text-slate-300">
                  1. Look directly at any banana post terminal on the apparatus (Power Supply, Switch, Resistor, Ammeter, or Voltmeter). A golden glowing halo will pulse around the terminal socket and the 3D reticle will lock onto it.<br />
                  2. <strong>Pinch your index finger and thumb</strong> to select the terminal.<br />
                  3. Look at the destination terminal on another apparatus and <strong>pinch again</strong>. The wire will instantly snap into place with realistic banana plugs and physics drape!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="font-semibold text-white mb-1">Repositioning Apparatus:</div>
                  <p className="text-slate-300">
                    Pinch on the body/casing of any equipment (away from terminal sockets) and move your hand to slide it smoothly across the teak workbench.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="font-semibold text-white mb-1">Unplugging &amp; Switches:</div>
                  <p className="text-slate-300">
                    Pinch directly on any wire to unplug it. Pinch the knife switch blade to open/close it. Pinch the red power rocker to toggle DC power.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50">
                <div className="font-semibold text-cyan-300 mb-1">Hand Visibility in visionOS:</div>
                <p className="text-slate-300">
                  The laboratory now renders a <strong>Holographic Spatial Hand &amp; Pinch Cursor</strong> at your hand position in standard Gaze &amp; Pinch mode. For full 25-joint skeletal hand meshes, enable <strong>WebXR Hand Input Mode</strong> in Safari Feature Flags (Section 2).
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Desktop Testing Mode */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <h3 className="font-semibold text-cyan-300 flex items-center gap-2 text-base">
              <Monitor className="w-4 h-4 text-slate-300" /> 4. Desktop Testing Controls
            </h3>
            <p className="text-xs text-slate-300">
              For development on Windows PC, full interactive parity is supported:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
              <li><strong>Left-Click &amp; Drag:</strong> Grabs and moves electrical apparatus across the workbench.</li>
              <li><strong>Right-Click &amp; Drag:</strong> Rotates the 3D orbit camera around the laboratory.</li>
              <li><strong>Mouse Scroll:</strong> Zooms in/out on workbench apparatus.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
