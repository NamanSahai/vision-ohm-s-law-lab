# Ohm's Law — Immersive Virtual Electrical Engineering Laboratory
### BITS Pilani • Spatial Computing Engineering Prototype
**Target Platforms:** Apple Vision Pro (Safari on visionOS) & Desktop WebXR / Fallback

---

## 1. Overview & Vision

This application simulates an authentic university electrical engineering laboratory workstation for verifying **Ohm's Law ($V = I \cdot R$)**. Rather than being a static 2D website with an embedded 3D viewer, this project implements a spatial computing experience built on Three.js, React, TypeScript, and the W3C WebXR Device API.

The student physically interacts with virtual electrical equipment on a laboratory workbench, positions apparatus, connects terminals using realistic flexible wires, manipulates power supply knobs, observes meter readings, records observations, and analyzes V-I graphs.

---

## 2. Milestone 1: WebXR & Hand Interaction Proof-of-Concept

Milestone 1 establishes the spatial interaction pipeline and documents visionOS Safari compatibility:

- **Secure Context & HTTPS:** Automatic local TLS certificate handling via `@vitejs/plugin-basic-ssl`, allowing Apple Vision Pro on LAN to access WebXR.
- **Dual-Input Pipeline:**
  1. **Mode A — Real Skeletal Hand Tracking (`XRHand`):** Detects 25 joints per hand, computes physical pinch distance ($d < 28\text{ mm}$) between index tip and thumb tip, and highlights pinch interactions without fake simulations.
  2. **Mode B — visionOS Transient Pointer (Gaze & Pinch Fallback):** When skeletal hand tracking is unflagged in Safari, input falls back to eye gaze targeting and finger tap/pinch gestures (`targetRayMode: 'transient-pointer'`).
  3. **Mode C — Desktop Fallback:** Complete mouse drag-and-drop on workbench apparatus with orbit camera navigation.
- **Interactive 3D Objects:**
  - 100Ω Resistor with accurate 4-band color coding (Brown-Black-Brown-Gold) and lead terminals.
  - DC Regulated Power Supply chassis with front panel display, voltage knob, and output terminals.
  - Digital Voltmeter module ($V$) with dual terminal posts.
  - Digital Ammeter module ($\text{mA}$) with series terminal posts.
- **Live Diagnostics HUD:** Displays real-time FPS, HTTPS security status, WebXR support, active input mode, joint counts, and pinch states.

---

## 3. Apple Vision Pro Safari Compatibility & Setup

### A. Prerequisites for WebXR in visionOS
1. **HTTPS is Mandatory:** WebXR Device API (`navigator.xr`) will not initialize on an insecure HTTP origin. Access the app via `https://<host-ip>:5173`.
2. **Accepting Self-Signed Certificate:** On first loading `https://<host-ip>:5173` in Safari on Apple Vision Pro, tap **Show Details** &gt; **Visit this Website** to accept the self-signed certificate.

### B. visionOS Safari Feature Flags
By default in visionOS 1.x, raw 25-joint skeletal hand tracking is gated behind Safari privacy feature flags:
1. Open **Settings** on Apple Vision Pro.
2. Navigate to **Apps** &gt; **Safari** &gt; **Advanced** &gt; **Feature Flags**.
3. Toggle ON **WebXR Device API**.
4. Toggle ON **WebXR Hand Input Mode**.
5. Reload the application in Safari.

> **Note on visionOS 2.0+ (Safari 18):** WebXR `immersive-vr` sessions are supported natively. If hand tracking flags are disabled, the application automatically engages **Mode B (Gaze & Pinch transient pointer)** so the experience remains fully interactive.

---

## 4. Development & Local Execution

### Prerequisites
- Node.js 20.19+ or 22.12+ (Node.js v22 LTS recommended)
- Modern web browser (Chrome/Edge with WebXR emulator or Apple Vision Pro Safari)

### Installation
```bash
npm install
```

### Running Locally (HTTPS enabled)
```bash
npm run dev
```
The server will start on `https://localhost:5173` and will listen on your local network (e.g., `https://192.168.x.x:5173`).

### Production Build
```bash
npm run build
npm run preview
```

---

## 5. HTTPS Deployment to Production

For permanent testing on Apple Vision Pro without local network certificates, deploy directly to Vercel or Netlify:

### Vercel CLI
```bash
npx vercel --prod
```

### Netlify CLI
```bash
npx netlify deploy --prod
```

Both platforms automatically provision trusted Let's Encrypt SSL/TLS certificates, ensuring `navigator.xr` is immediately accessible on visionOS Safari without certificate prompts.

---

## 6. Implementation Status & Verification Matrix

| Capability | Implementation Status | Verified On | Notes |
| :--- | :--- | :--- | :--- |
| **Local HTTPS Server** | Complete | Windows PC Localhost & LAN | Handled via `@vitejs/plugin-basic-ssl` |
| **WebXR API Detection** | Complete | Chrome & Edge | Queries `navigator.xr.isSessionSupported('immersive-vr')` |
| **Real 25-Joint Skeletal Hand Tracking** | Complete | WebXR Hand Module Codebase | Renders 25 joints & bones per hand; activates upon receiving `XRHand` |
| **Transient Pointer / Gaze & Pinch Fallback** | Complete | WebXR Input Module | Handles `targetRayMode: 'transient-pointer'` for visionOS default input |
| **Desktop Mouse Fallback** | Complete | Windows Desktop Chrome/Edge | Left-click + drag moves apparatus; right-click orbits |
| **Interactive 3D Workbench** | Complete | 3D Canvas | Storage, Construction, and Observation zones demarcated |
| **Physical Vision Pro Device Verification** | Pending Hardware Connection | Unverified on physical hardware | Requires physical device connection; all code follows official W3C & WebKit visionOS specifications |
