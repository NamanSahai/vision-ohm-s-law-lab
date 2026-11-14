import * as THREE from 'three';
import { InputAbstraction } from '../interaction/InputAbstraction';
import { LaboratoryRoom } from './LaboratoryRoom';
import { WireManager } from '../circuit/WireManager';
import { labAudio } from '../audio/LabSoundSynthesizer';
import type { InteractableObject3D } from '../types/interaction';
import type { TerminalId, WireConnection, CircuitStatus } from '../types/circuit';
import type { CameraPreset } from '../ui/DesktopHUD/CameraPresetsBar';

export class Milestone1Scene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public inputAbstraction: InputAbstraction;
  public wireManager: WireManager;

  // Backward-compatible controls mock for external code
  public controls = {
    dispose: () => {},
    target: new THREE.Vector3(0, 0.9, -0.55),
    update: () => {},
    enabled: true,
  };

  private canvasElement!: HTMLCanvasElement;

  // First-Person Free Look & Navigation Engine
  public yaw: number = 0;       // Horizontal orientation (radians)
  public pitch: number = -0.38; // Vertical look angle (radians, looking down at table)
  public targetYaw: number = 0;
  public targetPitch: number = -0.38;
  private startYaw: number = 0;
  private startPitch: number = 0;
  public isPointerLocked: boolean = false;
  private targetFov: number = 52;
  private cameraVelocity: THREE.Vector3 = new THREE.Vector3();

  // Desktop drag look state
  private isRightDragging: boolean = false;
  private isLeftDraggingLook: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  // Pointer lock / Crosshair callbacks
  public onPointerLockChange?: (locked: boolean) => void;
  public onCrosshairActionChange?: (action: string | null) => void;

  private room: LaboratoryRoom;
  private interactiveObjects: InteractableObject3D[] = [];
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  public tableMesh: THREE.Mesh;

  // Component references for terminal tracking
  public resistorGroup!: InteractableObject3D;
  public psGroup!: InteractableObject3D;
  public voltmeterGroup!: InteractableObject3D;
  public ammeterGroup!: InteractableObject3D;
  public switchGroup!: InteractableObject3D;

  // Camera preset animation targets
  private cameraStartPos: THREE.Vector3 = new THREE.Vector3(0, 1.45, 0.85);
  private cameraTargetPos: THREE.Vector3 = new THREE.Vector3(0, 1.45, 0.85);
  private cameraAnimStartTime: number = 0;
  private cameraAnimDuration: number = 0.85; // smooth 850ms cinematic curve
  private isCinematicMoving: boolean = false;
  private keysPressed: Record<string, boolean> = {};
  private moveSpeed: number = 2.0;
  private lastFrameTime: number = performance.now();
  private terminalMeshes: THREE.Mesh[] = [];

  // Obstacle Colliders (Central Workbench, Left Bench, Right Bench, Rear Teacher Desk)
  private obstacleBoxes = [
    // 1. Main Student Workbench: table [0, 0.85, -0.6], width 1.6m, depth 0.9m + stools
    { minX: -0.85, maxX: 0.85, minZ: -1.15, maxZ: -0.05 },
    // 2. Left adjacent workbench (Oscilloscope table): [-2.6, 0.85, -0.8], width 1.8m, depth 0.9m
    { minX: -3.55, maxX: -1.65, minZ: -1.30, maxZ: -0.30 },
    // 3. Right adjacent workbench (Rheostat table): [2.6, 0.85, -0.8], width 1.8m, depth 0.9m
    { minX: 1.65, maxX: 3.55, minZ: -1.30, maxZ: -0.30 },
    // 4. Rear demonstration bench: [0, 0.85, -3.2], width 3.2m, depth 0.7m
    { minX: -1.65, maxX: 1.65, minZ: -3.60, maxZ: -2.80 },
  ];
  private cameraRadius: number = 0.32;

  // Callbacks
  public onWiresChanged?: (wires: WireConnection[]) => void;
  public onTerminalSelected?: (termId: TerminalId | null) => void;
  public onToggleSwitch?: () => void;
  public onTogglePower?: () => void;

  // 3D Visual Feedback & Live Display References
  private psPanelCtx?: CanvasRenderingContext2D;
  private psPanelTexture?: THREE.CanvasTexture;
  private psSwitchMesh?: THREE.Mesh;
  private coarseKnobGroup?: THREE.Group;
  private currentKnobAngle: number = 0;
  private targetKnobAngle: number = 0;
  private rockerAngle: number = -0.22;
  private targetRockerAngle: number = -0.22;

  private voltmeterScreenCtx?: CanvasRenderingContext2D;
  private voltmeterScreenTexture?: THREE.CanvasTexture;

  private ammeterScreenCtx?: CanvasRenderingContext2D;
  private ammeterScreenTexture?: THREE.CanvasTexture;

  // Mechanical Knife Switch Physics & Dynamics
  private knifeBladeArm?: THREE.Group;
  private bladeAngle: number = -0.05;
  private bladeVelocity: number = 0.0;
  private targetBladeAngle: number = -0.05;
  private isKnifeClosed: boolean = true;

  // Multimeter Dual-Slope ADC Settling Simulation
  private lastVoltageVal: number = 0;
  private lastCurrentVal: number = 0;
  private meterSettlingStartTime: number = 0;

  private terminalHalos: Map<TerminalId, { ring: THREE.Mesh; baseColor: number }> = new Map();
  private selectedTerminalId: TerminalId | null = null;

  constructor(canvas: HTMLCanvasElement, inputAbstraction: InputAbstraction) {
    this.inputAbstraction = inputAbstraction;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe2e8f0); // Bright, clean daytime institutional lab background

    // 2. Camera (Eye height in VR is controlled by XR reference space, desktop defaults to ~1.45m looking at table)
    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.05, 50);
    this.camera.position.set(0, 1.45, 0.85);
    this.canvasElement = canvas;

    // Initial pitch & yaw to look at (0, 0.9, -0.55) from (0, 1.45, 0.85)
    const initLookDir = new THREE.Vector3(0, 0.9, -0.55).sub(this.camera.position).normalize();
    this.pitch = Math.asin(initLookDir.y);
    this.yaw = Math.atan2(-initLookDir.x, -initLookDir.z);
    this.targetPitch = this.pitch;
    this.targetYaw = this.yaw;
    this.applyCameraRotation();

    // 3. Renderer with WebXR support
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;

    // 5. Studio-Grade Laboratory Lighting (High-CRI BITS Pilani Indian College EEE Laboratory)
    // Ambient light - Crisp white fill so no dark corners exist
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.05);
    this.scene.add(this.ambientLight);

    // Hemisphere light - Sky daylight from above, warm Kota stone terrazzo bounce from below
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd4a373, 0.85);
    this.scene.add(hemiLight);

    // Main Overhead Directional Light (Ceiling fluorescent bank simulation with ultra-sharp soft shadow mapping)
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.75);
    this.dirLight.position.set(1.2, 3.8, 1.0);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 4096;
    this.dirLight.shadow.mapSize.height = 4096;
    this.dirLight.shadow.camera.near = 0.1;
    this.dirLight.shadow.camera.far = 8;
    this.dirLight.shadow.camera.left = -2.0;
    this.dirLight.shadow.camera.right = 2.0;
    this.dirLight.shadow.camera.top = 2.0;
    this.dirLight.shadow.camera.bottom = -2.0;
    this.dirLight.shadow.bias = -0.0001;
    this.dirLight.shadow.normalBias = 0.015;
    this.dirLight.shadow.radius = 2.0;
    this.scene.add(this.dirLight);

    // Window daylight fill from the large classroom windows
    const windowLight = new THREE.DirectionalLight(0xdbeafe, 1.15);
    windowLight.position.set(-4.5, 2.5, -0.6);
    this.scene.add(windowLight);

    // Dedicated High-CRI Workbench Task Spotlight (Focused directly over the circuit assembly area)
    const taskSpot = new THREE.SpotLight(0xfffaed, 2.8, 6.0, Math.PI / 4.2, 0.45, 1.2);
    taskSpot.position.set(0, 2.7, -0.55);
    taskSpot.target.position.set(0, 0.88, -0.6);
    this.scene.add(taskSpot.target);
    taskSpot.castShadow = true;
    taskSpot.shadow.mapSize.width = 2048;
    taskSpot.shadow.mapSize.height = 2048;
    taskSpot.shadow.bias = -0.0001;
    this.scene.add(taskSpot);

    // 6. Build Laboratory Environment & Workbench
    this.room = new LaboratoryRoom();
    this.scene.add(this.room.group);

    // Initialize Wire System
    this.wireManager = new WireManager(
      (wires) => {
        if (this.onWiresChanged) this.onWiresChanged(wires);
      },
      (termId) => {
        this.handleTerminalSelected(termId);
      }
    );
    this.scene.add(this.wireManager.group);

    this.tableMesh = this.buildEnvironment();

    // 7. Create Interactive Test Objects
    this.buildInteractiveObjects();
    this.registerAllTerminals();

    // 8. Bind resize and desktop mouse events
    window.addEventListener('resize', this.onWindowResize);
    this.setupDesktopEvents(canvas);
  }

  private createTeakWoodTexture(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const rCanvas = document.createElement('canvas');
    rCanvas.width = width;
    rCanvas.height = height;
    const rctx = rCanvas.getContext('2d')!;

    // 1. Base Indian Teak Warm Amber / Sheesham Golden Brown
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#854d0e');
    grad.addColorStop(0.2, '#92400e');
    grad.addColorStop(0.4, '#78350f');
    grad.addColorStop(0.6, '#9a3412');
    grad.addColorStop(0.8, '#854d0e');
    grad.addColorStop(1.0, '#78350f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Roughness base (satin clear lacquer ~0.36)
    rctx.fillStyle = '#5c5c5c';
    rctx.fillRect(0, 0, width, height);

    // 2. Procedural Wood Planks & Grain Fibers
    const plankWidth = width / 4;
    for (let p = 0; p < 4; p++) {
      const px = p * plankWidth;

      // Dark chamfered seam between solid teak planks
      ctx.fillStyle = 'rgba(24, 15, 6, 0.55)';
      ctx.fillRect(px, 0, 4, height);
      ctx.fillStyle = 'rgba(254, 215, 170, 0.25)';
      ctx.fillRect(px + 4, 0, 2, height);

      // Fine longitudinal grain fibers
      for (let i = 0; i < 300; i++) {
        const y = Math.random() * height;
        const thickness = 0.5 + Math.random() * 2.0;
        const alpha = 0.04 + Math.random() * 0.12;
        const isDark = Math.random() > 0.35;

        ctx.strokeStyle = isDark ? `rgba(40, 18, 5, ${alpha})` : `rgba(251, 191, 36, ${alpha * 0.75})`;
        ctx.lineWidth = thickness;
        ctx.beginPath();

        const wavePeriod = 160 + Math.random() * 240;
        const waveAmp = 3 + Math.random() * 10;
        const yOffset = y;

        ctx.moveTo(px, yOffset);
        for (let x = px; x <= px + plankWidth; x += 15) {
          const cy = yOffset + Math.sin((x - px) / wavePeriod) * waveAmp + Math.cos((x - px) / 80) * 2;
          ctx.lineTo(x, cy);
        }
        ctx.stroke();

        // Matching subtle roughness variation along grain
        rctx.strokeStyle = isDark ? 'rgba(75, 75, 75, 0.18)' : 'rgba(95, 95, 95, 0.18)';
        rctx.lineWidth = thickness * 1.5;
        rctx.stroke();
      }

      // Natural teak growth ring whorls / wood knot rings
      const knotX = px + 80 + Math.random() * (plankWidth - 160);
      const knotY = 160 + Math.random() * (height - 320);
      for (let r = 6; r < 48; r += 4) {
        ctx.strokeStyle = 'rgba(45, 20, 6, 0.09)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(knotX, knotY, r * 1.7, r * 0.65, 0.12, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;

    const roughnessMap = new THREE.CanvasTexture(rCanvas);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;

    return { map, roughnessMap };
  }

  private buildEnvironment(): THREE.Mesh {
    // Main Student Workbench (Heavy solid teak-top workbench with Indian lab blue steel frame)
    // Height: 0.85m, Width: 1.6m, Depth: 0.9m, Center: [0, 0.85, -0.6]
    const teak = this.createTeakWoodTexture();
    const tableTopGeo = new THREE.BoxGeometry(1.6, 0.05, 0.9);
    const tableTopMat = new THREE.MeshStandardMaterial({
      map: teak.map,
      roughnessMap: teak.roughnessMap,
      roughness: 0.36,
      metalness: 0.06,
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.set(0, 0.85, -0.6);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.scene.add(tableTop);

    // 4 Corner Polished Brass Protective Plates with Brass Screws
    const brassBracketMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.22,
    });
    const bracketGeo = new THREE.BoxGeometry(0.06, 0.052, 0.06);
    const corners = [
      [-0.77, 0.85, -0.18],
      [0.77, 0.85, -0.18],
      [-0.77, 0.85, -1.02],
      [0.77, 0.85, -1.02],
    ];
    corners.forEach(([cx, cy, cz]) => {
      const bMesh = new THREE.Mesh(bracketGeo, brassBracketMat);
      bMesh.position.set(cx, cy, cz);
      this.scene.add(bMesh);
    });

    // Sturdy angle-iron steel frame & legs (Indian lab blue)
    const legGeo = new THREE.BoxGeometry(0.045, 0.85, 0.045);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // classic Indian lab blue enamel steel
      roughness: 0.35,
      metalness: 0.6,
    });
    const legPositions = [
      [-0.72, 0.425, -0.2],
      [0.72, 0.425, -0.2],
      [-0.72, 0.425, -1.0],
      [0.72, 0.425, -1.0],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      this.scene.add(leg);
    });

    // Horizontal stretcher bars between table legs
    const stretchGeoX = new THREE.BoxGeometry(1.44, 0.04, 0.03);
    const stretch1 = new THREE.Mesh(stretchGeoX, legMat);
    stretch1.position.set(0, 0.25, -1.0);
    this.scene.add(stretch1);

    const stretchGeoZ = new THREE.BoxGeometry(0.03, 0.04, 0.8);
    const stretch2 = new THREE.Mesh(stretchGeoZ, legMat);
    stretch2.position.set(-0.72, 0.25, -0.6);
    this.scene.add(stretch2);

    const stretch3 = new THREE.Mesh(stretchGeoZ, legMat);
    stretch3.position.set(0.72, 0.25, -0.6);
    this.scene.add(stretch3);

    // Demarcation overlay on workbench (Storage, Circuit, Observation)
    this.createTableMarkings(tableTop.position.y + 0.0252);

    return tableTop;
  }

  private createTableMarkings(y: number) {
    // High-resolution 2048x1024 canvas for crisp, razor-sharp technical lab graphics
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Transparent background so the rich teak wood tabletop shows through
    ctx.clearRect(0, 0, 2048, 1024);

    // Helper to draw clean rounded rectangles
    const drawRoundedRect = (rx: number, ry: number, rw: number, rh: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + rw - radius, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
      ctx.lineTo(rx + rw, ry + rh - radius);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
      ctx.lineTo(rx + radius, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
      ctx.lineTo(rx, ry + radius);
      ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
      ctx.closePath();
    };

    // ==========================================
    // ESD BENCH MAT PERIMETER & GROUNDING SNAPS
    // ==========================================
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1988, 964);

    // Metric millimeter/centimeter ruler along top edge
    ctx.fillStyle = '#fef08a';
    ctx.font = '10px monospace';
    for (let rx = 50; rx <= 1950; rx += 20) {
      const isMajor = (rx - 50) % 100 === 0;
      ctx.fillRect(rx, 32, 1.5, isMajor ? 14 : 7);
      if (isMajor) {
        ctx.fillText(`${(rx - 50) / 20}cm`, rx + 3, 44);
      }
    }

    // Gold ESD Grounding Snap Studs at 4 corners
    const snaps = [
      [45, 45],
      [2003, 45],
      [45, 979],
      [2003, 979],
    ];
    snaps.forEach(([sx, sy]) => {
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // ==========================================
    // TOP INSTITUTIONAL LAB EMBLEM & HEADER
    // ==========================================
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BITS PILANI • BASIC ELECTRICAL SCIENCES LABORATORY (EEE F111)', 1024, 75);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('EXPERIMENT 01: VERIFICATION OF OHM\'S LAW • WORKSTATION BENCH #04 • CALIBRATED RIG', 1024, 100);

    // ==========================================
    // ZONE 1: LEFT - EQUIPMENT STORAGE (Width ~580px)
    // ==========================================
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)'; // subtle dark ESD pad tint
    drawRoundedRect(60, 115, 560, 795, 16);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    drawRoundedRect(60, 115, 560, 795, 16);
    ctx.stroke();

    // Zone 1 Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText('1. APPARATUS STORAGE', 340, 165);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Standby Components & Wire Leads', 340, 195);

    // Dashed storage silhouettes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 8]);

    // Resistor Tray
    drawRoundedRect(110, 230, 460, 270, 12);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('[ RESISTOR SPECIMEN (100 Ω) ]', 340, 360);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Axial Wirewound Precision Specimen', 340, 395);

    // Spare Components / Switch Tray
    drawRoundedRect(110, 530, 460, 330, 12);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('[ SPST KNIFE SWITCH TRAY ]', 340, 690);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Porcelain Base • Heavy Copper Contact Jaws', 340, 725);

    // ==========================================
    // ZONE 2: CENTER - CIRCUIT ASSEMBLY ZONE (Width ~760px)
    // ==========================================
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(14, 116, 144, 0.18)'; // cyan technical tint
    drawRoundedRect(660, 115, 728, 795, 16);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    drawRoundedRect(660, 115, 728, 795, 16);
    ctx.stroke();

    // Zone 2 Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText('2. CIRCUIT ASSEMBLY AREA', 1024, 165);

    ctx.fillStyle = '#e0f2fe';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Place Active Apparatus & Construct Electrical Circuit', 1024, 195);

    // Center Breadboard / Mounting Grid
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
    ctx.lineWidth = 1.5;
    for (let gx = 720; gx <= 1320; gx += 60) {
      ctx.beginPath();
      ctx.moveTo(gx, 230);
      ctx.lineTo(gx, 700);
      ctx.stroke();
    }
    for (let gy = 230; gy <= 700; gy += 60) {
      ctx.beginPath();
      ctx.moveTo(720, gy);
      ctx.lineTo(1320, gy);
      ctx.stroke();
    }

    // Active test bed outline
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 10]);
    drawRoundedRect(720, 230, 608, 470, 14);
    ctx.stroke();
    ctx.setLineDash([]);

    // Circuit Topology Diagram hint at bottom of center zone
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('SERIES LOOP: DC (+) ➔ Knife Switch ➔ Ammeter ➔ Resistor ➔ DC (-)', 1024, 745);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'italic 19px system-ui, sans-serif';
    ctx.fillText('PARALLEL BRANCH: Connect Voltmeter across Resistor Terminals (T1 & T2)', 1024, 785);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('OHM\'S LAW: V = I · R   ⇒   I = V / R   (Constant Temperature)', 1024, 830);

    // Caution badge at bottom of assembly area
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('⚠ CAUTION: ENSURE AMMETER IS IN SERIES ONLY • NEVER CONNECT ACROSS DC SUPPLY', 1024, 875);

    // ==========================================
    // ZONE 3: RIGHT - MEASUREMENT & OBSERVATION (Width ~580px)
    // ==========================================
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    drawRoundedRect(1428, 115, 560, 795, 16);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    drawRoundedRect(1428, 115, 560, 795, 16);
    ctx.stroke();

    // Zone 3 Header
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText('3. INSTRUMENTATION', 1708, 165);

    ctx.fillStyle = '#d1fae5';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Digital Readouts & Measurement Observations', 1708, 195);

    // Dashed Meter Silhouettes
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 8]);

    // Voltmeter footprint
    drawRoundedRect(1478, 230, 460, 270, 12);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('[ DIGITAL VOLTMETER (V) ]', 1708, 355);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Measures potential drop across 100Ω Resistor', 1708, 390);

    // Ammeter footprint
    drawRoundedRect(1478, 530, 460, 330, 12);
    ctx.stroke();
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('[ DIGITAL AMMETER (mA) ]', 1708, 685);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Measures series circuit current I = V / R', 1708, 720);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('[ AMMETER (mA) READOUT ]', 1708, 675);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Measures series current in loop', 1708, 710);

    // Bottom Institution Bar
    ctx.setLineDash([]);
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText('BITS PILANI • BASIC ELECTRICAL SCIENCES LABORATORY • VERIFICATION OF OHM\'S LAW', 1024, 960);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    const planeGeo = new THREE.PlaneGeometry(1.58, 0.88);
    const planeMat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 0.35,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      depthWrite: false,
    });
    const overlay = new THREE.Mesh(planeGeo, planeMat);
    overlay.rotation.x = -Math.PI / 2;
    overlay.position.set(0, y, -0.6);
    this.scene.add(overlay);
  }

  private buildInteractiveObjects() {
    // 1. High-Detail 100Ω Resistor Specimen Carrier
    const resistorGroup = this.createInteractiveResistor();
    resistorGroup.position.set(-0.40, 0.88, -0.45);
    this.scene.add(resistorGroup);
    this.inputAbstraction.register(resistorGroup);
    this.interactiveObjects.push(resistorGroup);
    this.resistorGroup = resistorGroup;

    // 2. High-Detail Laboratory DC Regulated Power Supply
    const psGroup = this.createInteractivePowerSupplyBox();
    psGroup.position.set(-0.48, 0.88, -0.78);
    this.scene.add(psGroup);
    this.inputAbstraction.register(psGroup);
    this.interactiveObjects.push(psGroup);
    this.psGroup = psGroup;

    // 3. High-Detail Digital Voltmeter Module (0-20V DC)
    const meterGroup = this.createInteractiveMeterModule('VOLTMETER (V)', 'volts');
    meterGroup.position.set(0.48, 0.88, -0.72);
    this.scene.add(meterGroup);
    this.inputAbstraction.register(meterGroup);
    this.interactiveObjects.push(meterGroup);
    this.voltmeterGroup = meterGroup;

    // 4. High-Detail Digital Ammeter Module (0-200mA DC)
    const ammeterGroup = this.createInteractiveMeterModule('AMMETER (mA)', 'amps');
    ammeterGroup.position.set(0.48, 0.88, -0.42);
    this.scene.add(ammeterGroup);
    this.inputAbstraction.register(ammeterGroup);
    this.interactiveObjects.push(ammeterGroup);
    this.ammeterGroup = ammeterGroup;

    // 5. Interactive SPST Laboratory Knife Switch
    const switchGroup = this.createInteractiveSwitch();
    switchGroup.position.set(-0.18, 0.88, -0.45);
    this.scene.add(switchGroup);
    this.inputAbstraction.register(switchGroup);
    this.interactiveObjects.push(switchGroup);
    this.switchGroup = switchGroup;
  }

  private createTerminalAnchor(
    parentGroup: THREE.Object3D,
    id: TerminalId,
    name: string,
    componentName: string,
    color: string,
    localOffset: THREE.Vector3
  ) {
    const anchor = new THREE.Group();
    anchor.position.copy(localOffset);
    parentGroup.add(anchor);

    // Click target mesh (sphere volume for easy, accurate raycasting)
    const hitGeo = new THREE.SphereGeometry(0.024, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    (hitMesh as any).isTerminal = true;
    (hitMesh as any).terminalId = id;
    anchor.add(hitMesh);
    this.terminalMeshes.push(hitMesh);

    // Glowing halo ring around terminal socket
    const ringGeo = new THREE.RingGeometry(0.010, 0.016, 24);
    const ringColor = color === '#ef4444' ? 0xef4444 : color === '#18181b' ? 0x94a3b8 : 0x38bdf8;
    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    anchor.add(ring);

    this.terminalHalos.set(id, { ring, baseColor: ringColor });
    this.wireManager.registerTerminalAnchor(id, name, componentName, color, anchor);
  }

  public registerAllTerminals() {
    this.terminalMeshes = [];
    this.terminalHalos.clear();

    // 1. DC Power Supply Terminals (Front panel posts)
    this.createTerminalAnchor(this.psGroup, 'ps_pos', 'DC Supply (+)', 'DC Power Supply', '#ef4444', new THREE.Vector3(-0.045, 0.025, 0.112));
    this.createTerminalAnchor(this.psGroup, 'ps_gnd', 'DC Supply (GND)', 'DC Power Supply', '#10b981', new THREE.Vector3(0.0, 0.025, 0.112));
    this.createTerminalAnchor(this.psGroup, 'ps_neg', 'DC Supply (-)', 'DC Power Supply', '#18181b', new THREE.Vector3(0.045, 0.025, 0.112));

    // 2. Resistor Terminals (Brass binding posts T1 & T2)
    this.createTerminalAnchor(this.resistorGroup, 'resistor_t1', 'Resistor Terminal 1 (T1)', 'Resistor Specimen', '#d97706', new THREE.Vector3(-0.052, 0.034, 0));
    this.createTerminalAnchor(this.resistorGroup, 'resistor_t2', 'Resistor Terminal 2 (T2)', 'Resistor Specimen', '#d97706', new THREE.Vector3(0.052, 0.034, 0));

    // 3. Voltmeter Terminals (Red + & Black - jacks)
    this.createTerminalAnchor(this.voltmeterGroup, 'voltmeter_pos', 'Voltmeter (+)', 'Digital Voltmeter', '#ef4444', new THREE.Vector3(0.04, 0.095, -0.048));
    this.createTerminalAnchor(this.voltmeterGroup, 'voltmeter_neg', 'Voltmeter (-)', 'Digital Voltmeter', '#18181b', new THREE.Vector3(-0.04, 0.095, -0.048));

    // 4. Ammeter Terminals (Red + & Black - jacks)
    this.createTerminalAnchor(this.ammeterGroup, 'ammeter_pos', 'Ammeter (+)', 'Digital Ammeter', '#ef4444', new THREE.Vector3(0.04, 0.095, -0.048));
    this.createTerminalAnchor(this.ammeterGroup, 'ammeter_neg', 'Ammeter (-)', 'Digital Ammeter', '#18181b', new THREE.Vector3(-0.04, 0.095, -0.048));

    // 5. Knife Switch Terminals (Hinge in & Jaw out)
    this.createTerminalAnchor(this.switchGroup, 'sw_in', 'Switch In (Hinge)', 'Knife Switch', '#b45309', new THREE.Vector3(-0.042, 0.02, 0));
    this.createTerminalAnchor(this.switchGroup, 'sw_out', 'Switch Out (Jaw)', 'Knife Switch', '#b45309', new THREE.Vector3(0.042, 0.022, 0));
  }

  public autoWireCorrectCircuit() {
    this.wireManager.clearAllWires();
    // 1. DC Supply (+) -> Knife Switch In
    this.wireManager.createWire('ps_pos', 'sw_in', 'red');
    // 2. Knife Switch Out -> Ammeter (+)
    this.wireManager.createWire('sw_out', 'ammeter_pos', 'red');
    // 3. Ammeter (-) -> Resistor T1
    this.wireManager.createWire('ammeter_neg', 'resistor_t1', 'red');
    // 4. Resistor T2 -> DC Supply (-) Return
    this.wireManager.createWire('resistor_t2', 'ps_neg', 'black');
    // 5. Voltmeter (+) -> Resistor T1 (Parallel branch)
    this.wireManager.createWire('voltmeter_pos', 'resistor_t1', 'yellow');
    // 6. Voltmeter (-) -> Resistor T2 (Parallel branch)
    this.wireManager.createWire('voltmeter_neg', 'resistor_t2', 'blue');
  }

  public resolveCameraObstacles(candidate: THREE.Vector3): THREE.Vector3 {
    const r = this.cameraRadius;
    let cx = candidate.x;
    let cz = candidate.z;

    for (const box of this.obstacleBoxes) {
      const minX = box.minX - r;
      const maxX = box.maxX + r;
      const minZ = box.minZ - r;
      const maxZ = box.maxZ + r;

      if (cx > minX && cx < maxX && cz > minZ && cz < maxZ) {
        // Resolve along axis of least penetration
        const dLeft = cx - minX;
        const dRight = maxX - cx;
        const dBack = cz - minZ;
        const dFront = maxZ - cz;

        const minPen = Math.min(dLeft, dRight, dBack, dFront);
        if (minPen === dLeft) cx = minX;
        else if (minPen === dRight) cx = maxX;
        else if (minPen === dBack) cz = minZ;
        else if (minPen === dFront) cz = maxZ;
      }
    }

    // Room boundaries
    cx = THREE.MathUtils.clamp(cx, -3.8, 3.8);
    cz = THREE.MathUtils.clamp(cz, -3.6, 2.8);
    const cy = THREE.MathUtils.clamp(candidate.y, 1.10, 2.90);

    return new THREE.Vector3(cx, cy, cz);
  }

  public setCameraPreset(preset: CameraPreset) {
    this.cameraStartPos.copy(this.camera.position);
    this.startYaw = this.yaw;
    this.startPitch = this.pitch;
    this.cameraAnimStartTime = performance.now();
    this.isCinematicMoving = true;
    this.targetFov = 52; // Reset FOV zoom to standard 52 degrees

    const targetLookAt = new THREE.Vector3();

    switch (preset) {
      case 'overview':
        this.cameraTargetPos.set(0, 1.45, 0.85);
        targetLookAt.set(0, 0.9, -0.55);
        break;
      case 'circuit':
        this.cameraTargetPos.set(0, 1.35, -0.15);
        targetLookAt.set(0, 0.88, -0.55);
        break;
      case 'powersupply':
        this.cameraTargetPos.set(-0.48, 1.15, -0.45);
        targetLookAt.set(-0.48, 0.96, -0.78);
        break;
      case 'meters':
        this.cameraTargetPos.set(0.48, 1.15, -0.25);
        targetLookAt.set(0.48, 0.95, -0.55);
        break;
      case 'blackboard':
        this.cameraTargetPos.set(0, 1.7, -1.2);
        targetLookAt.set(0, 2.2, -3.98);
        break;
    }

    this.controls.target.copy(targetLookAt);
    const lookDir = targetLookAt.clone().sub(this.cameraTargetPos).normalize();
    this.targetPitch = Math.asin(lookDir.y);
    this.targetYaw = Math.atan2(-lookDir.x, -lookDir.z);
  }

  public clearSelectedTerminal() {
    this.wireManager.clearSelection();
  }

  public handleTerminalSelected(termId: TerminalId | null) {
    this.selectedTerminalId = termId;

    for (const [id, item] of this.terminalHalos.entries()) {
      const mat = item.ring.material as THREE.MeshBasicMaterial;
      if (termId === id) {
        mat.color.setHex(0xfacc15); // Glowing amber selection
        mat.opacity = 1.0;
        item.ring.scale.set(1.35, 1.35, 1.35);
      } else {
        mat.color.setHex(item.baseColor);
        mat.opacity = 0.75;
        item.ring.scale.set(1.0, 1.0, 1.0);
      }
    }

    if (this.onTerminalSelected) {
      this.onTerminalSelected(termId);
    }
  }

  public updateCircuitState(status: CircuitStatus) {
    // 1. Update DC Regulated Power Supply Front Panel 3D Readouts
    if (this.psPanelCtx && this.psPanelTexture) {
      const pctx = this.psPanelCtx;

      // Ruby Red LED Display (Voltage)
      pctx.fillStyle = '#1c0a0a';
      pctx.fillRect(40, 110, 440, 170);
      pctx.strokeStyle = '#7f1d1d';
      pctx.lineWidth = 4;
      pctx.strokeRect(40, 110, 440, 170);

      pctx.fillStyle = '#fca5a5';
      pctx.font = 'bold 20px system-ui, sans-serif';
      pctx.textAlign = 'left';
      pctx.fillText('DC VOLTAGE', 60, 140);

      pctx.fillStyle = status.isPowerOn ? '#ef4444' : '#450a0a';
      pctx.font = 'bold 72px monospace';
      const voltStr = status.isPowerOn ? `${status.appliedVoltage.toFixed(2).padStart(5, '0')} V` : '00.00 V';
      pctx.fillText(voltStr, 80, 220);

      // Emerald Green LED Display (Current)
      pctx.fillStyle = '#052e16';
      pctx.fillRect(544, 110, 440, 170);
      pctx.strokeStyle = '#14532d';
      pctx.lineWidth = 4;
      pctx.strokeRect(544, 110, 440, 170);

      pctx.fillStyle = '#86efac';
      pctx.font = 'bold 20px system-ui, sans-serif';
      pctx.fillText('LOAD CURRENT', 564, 140);

      pctx.fillStyle = status.isPowerOn ? '#22c55e' : '#064e3b';
      pctx.font = 'bold 72px monospace';
      const currStr = status.isPowerOn ? `${status.circuitCurrent.toFixed(3)} A` : '0.000 A';
      pctx.fillText(currStr, 580, 220);

      // C.V. indicator LED dot
      pctx.fillStyle = !status.isPowerOn ? '#14532d' : status.hasShortCircuit ? '#ef4444' : '#22c55e';
      pctx.beginPath();
      pctx.arc(380, 140, 10, 0, Math.PI * 2);
      pctx.fill();

      this.psPanelTexture.needsUpdate = true;
    }

    // Power rocker switch emissive glow & physical tilt target
    if (this.psSwitchMesh) {
      const mat = this.psSwitchMesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = status.isPowerOn ? 0.9 : 0.05;
      this.targetRockerAngle = status.isPowerOn ? 0.25 : -0.25;
    }

    // Coarse rotary knob rotation target (Smooth damping in update())
    this.targetKnobAngle = (status.appliedVoltage / 10) * Math.PI * 1.5;

    // Detect change to start authentic ADC settling timer
    if (
      Math.abs(status.voltmeterReading - this.lastVoltageVal) > 0.005 ||
      Math.abs(status.ammeterReading - this.lastCurrentVal) > 0.05
    ) {
      this.lastVoltageVal = status.voltmeterReading;
      this.lastCurrentVal = status.ammeterReading;
      this.meterSettlingStartTime = performance.now();
    }

    this.currentCircuitStatus = status;
    this.redrawMeterScreens(status, performance.now() - this.meterSettlingStartTime < 180);

    // 4. Physical Knife Switch Blade Target & Mechanical State
    if (status.isSwitchClosed !== this.isKnifeClosed) {
      this.isKnifeClosed = status.isSwitchClosed;
      this.targetBladeAngle = status.isSwitchClosed ? -0.05 : 1.15;
    }
  }

  private currentCircuitStatus?: CircuitStatus;

  private redrawMeterScreens(status: CircuitStatus, isSettling: boolean) {
    // 1. Update Digital Voltmeter 3D LCD Readout
    if (this.voltmeterScreenCtx && this.voltmeterScreenTexture) {
      const sctx = this.voltmeterScreenCtx;
      sctx.fillStyle = status.isPowerOn ? '#e0f2fe' : '#94a3b8';
      sctx.fillRect(0, 0, 512, 256);
      sctx.strokeStyle = '#0f172a';
      sctx.lineWidth = 6;
      sctx.strokeRect(4, 4, 504, 248);

      sctx.fillStyle = '#0f172a';
      sctx.font = 'bold 24px system-ui, sans-serif';
      sctx.textAlign = 'left';
      sctx.fillText('DIGITAL VOLTMETER', 25, 40);

      sctx.font = 'bold 18px monospace';
      sctx.fillText('DC • AUTO RANGE', 320, 40);

      sctx.font = 'bold 84px monospace';
      let vmVal = '+00.00';
      if (status.isPowerOn) {
        let v = status.voltmeterReading;
        if (isSettling) {
          // Authentic least-significant digit ADC integration micro-jitter
          v += (Math.random() - 0.5) * 0.02;
        }
        vmVal = v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
      }
      sctx.fillText(vmVal, 40, 150);

      sctx.font = 'bold 44px system-ui, sans-serif';
      sctx.fillText('V', 410, 150);

      sctx.font = 'bold 18px system-ui, sans-serif';
      sctx.fillStyle = '#0369a1';
      sctx.fillText('CONNECT IN PARALLEL', 25, 220);

      this.voltmeterScreenTexture.needsUpdate = true;
    }

    // 2. Update Digital Ammeter 3D LCD Readout
    if (this.ammeterScreenCtx && this.ammeterScreenTexture) {
      const sctx = this.ammeterScreenCtx;
      sctx.fillStyle = status.isPowerOn ? '#d1fae5' : '#94a3b8';
      sctx.fillRect(0, 0, 512, 256);
      sctx.strokeStyle = '#0f172a';
      sctx.lineWidth = 6;
      sctx.strokeRect(4, 4, 504, 248);

      sctx.fillStyle = '#0f172a';
      sctx.font = 'bold 24px system-ui, sans-serif';
      sctx.textAlign = 'left';
      sctx.fillText('DIGITAL AMMETER', 25, 40);

      sctx.font = 'bold 18px monospace';
      sctx.fillText('DC • 200mA RANGE', 320, 40);

      sctx.font = 'bold 84px monospace';
      let amVal = '+00.0';
      if (status.isPowerOn) {
        let i = status.ammeterReading;
        if (isSettling) {
          // Authentic least-significant digit ADC integration micro-jitter
          i += (Math.random() - 0.5) * 0.25;
        }
        amVal = i >= 0 ? `+${i.toFixed(1)}` : i.toFixed(1);
      }
      sctx.fillText(amVal, 40, 150);

      sctx.font = 'bold 44px system-ui, sans-serif';
      sctx.fillText('mA', 410, 150);

      sctx.font = 'bold 18px system-ui, sans-serif';
      sctx.fillStyle = '#b91c1c';
      sctx.fillText('CONNECT IN SERIES ONLY', 25, 220);

      this.ammeterScreenTexture.needsUpdate = true;
    }
  }

  private createContactShadow(width: number, depth: number, opacity: number = 0.5): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, `rgba(15, 23, 42, ${opacity})`);
    grad.addColorStop(0.5, `rgba(15, 23, 42, ${opacity * 0.45})`);
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(width, depth);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.001;
    return shadowMesh;
  }

  private createInteractiveResistor(): InteractableObject3D {
    const group: InteractableObject3D = new THREE.Group();
    group.name = 'Resistor_Specimen_100Ω';

    // 0. Soft Ambient Occlusion Contact Shadow on Table
    group.add(this.createContactShadow(0.20, 0.12, 0.52));

    // 1. Heavy Polished Bakelite Baseboard with Chamfered Edges
    const baseGeo = new THREE.BoxGeometry(0.16, 0.016, 0.08);
    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = 1024;
    baseCanvas.height = 512;
    const bctx = baseCanvas.getContext('2d')!;

    // Rich dark phenolic/bakelite plate texture
    bctx.fillStyle = '#090d16';
    bctx.fillRect(0, 0, 1024, 512);

    // Outer border with technical gold filigree
    bctx.strokeStyle = '#38bdf8';
    bctx.lineWidth = 6;
    bctx.strokeRect(16, 16, 992, 480);

    bctx.strokeStyle = '#0284c7';
    bctx.lineWidth = 2;
    bctx.strokeRect(26, 26, 972, 460);

    // University branding header
    bctx.fillStyle = '#f8fafc';
    bctx.font = 'bold 36px system-ui, sans-serif';
    bctx.textAlign = 'center';
    bctx.fillText('CARBON FILM RESISTOR SPECIMEN', 512, 75);

    bctx.fillStyle = '#38bdf8';
    bctx.font = 'bold 24px monospace';
    bctx.fillText('BITS PILANI • BASIC ELECTRICAL SCIENCES LAB • EE-111', 512, 115);

    // Rating specifications
    bctx.fillStyle = '#fef08a';
    bctx.font = 'bold 42px monospace';
    bctx.fillText('R = 100 Ω ± 5%  (2.0 W)', 512, 185);

    // Resistor schematic symbol
    bctx.strokeStyle = '#e2e8f0';
    bctx.lineWidth = 4;
    bctx.beginPath();
    bctx.moveTo(312, 240);
    bctx.lineTo(362, 240);
    bctx.lineTo(382, 215);
    bctx.lineTo(422, 265);
    bctx.lineTo(462, 215);
    bctx.lineTo(502, 265);
    bctx.lineTo(542, 215);
    bctx.lineTo(582, 265);
    bctx.lineTo(622, 215);
    bctx.lineTo(642, 240);
    bctx.lineTo(712, 240);
    bctx.stroke();

    bctx.fillStyle = '#94a3b8';
    bctx.font = 'bold 22px monospace';
    bctx.fillText('Color Bands: Brown(1)  Black(0)  Brown(×10)  Gold(±5%)', 512, 430);

    // Terminal markers T1 and T2
    bctx.fillStyle = '#38bdf8';
    bctx.font = 'bold 48px monospace';
    bctx.fillText('T1', 140, 270);
    bctx.fillText('T2', 884, 270);

    const baseTexture = new THREE.CanvasTexture(baseCanvas);
    const baseMat = new THREE.MeshStandardMaterial({
      map: baseTexture,
      roughness: 0.25,
      metalness: 0.15,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.008;
    base.castShadow = true;
    group.add(base);

    // 4 Corner Brass Mounting Screws with Slotted Heads
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    const screwPositions = [
      [-0.068, 0.0165, -0.028],
      [0.068, 0.0165, -0.028],
      [-0.068, 0.0165, 0.028],
      [0.068, 0.0165, 0.028],
    ];
    screwPositions.forEach(([sx, sy, sz]) => {
      const screwHead = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 16), screwMat);
      screwHead.position.set(sx, sy, sz);
      group.add(screwHead);

      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.005, 0.001, 0.001),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
      );
      slot.position.set(sx, sy + 0.001, sz);
      group.add(slot);
    });

    // 4 Molded Rubber Feet under baseboard
    const footGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.004, 16);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const footPositions = [
      [-0.07, 0.002, -0.03],
      [0.07, 0.002, -0.03],
      [-0.07, 0.002, 0.03],
      [0.07, 0.002, 0.03],
    ];
    footPositions.forEach(([fx, fy, fz]) => {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(fx, fy, fz);
      group.add(foot);
    });

    // 2. High-Fidelity Dumbbell Ceramic Resistor Body
    const bodyGeo = new THREE.CylinderGeometry(0.0135, 0.0135, 0.062, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xe2cfb5, // authentic glossy tan ceramic glaze
      roughness: 0.22,
      metalness: 0.05,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.033;
    body.castShadow = true;
    group.add(body);

    // Flared Ceramic Bell Ends
    const flareGeo = new THREE.CylinderGeometry(0.0145, 0.0135, 0.008, 32);
    const flare1 = new THREE.Mesh(flareGeo, bodyMat);
    flare1.rotation.z = Math.PI / 2;
    flare1.position.set(-0.028, 0.033, 0);
    group.add(flare1);

    const flare2 = new THREE.Mesh(flareGeo, bodyMat);
    flare2.rotation.z = -Math.PI / 2;
    flare2.position.set(0.028, 0.033, 0);
    group.add(flare2);

    // Stamped Nickel-Plated Metal End Caps with Crimp Ring
    const capGeo = new THREE.CylinderGeometry(0.0148, 0.0148, 0.007, 32);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    const cap1 = new THREE.Mesh(capGeo, capMat);
    cap1.rotation.z = Math.PI / 2;
    cap1.position.set(-0.034, 0.033, 0);
    group.add(cap1);

    const cap2 = new THREE.Mesh(capGeo, capMat);
    cap2.rotation.z = Math.PI / 2;
    cap2.position.set(0.034, 0.033, 0);
    group.add(cap2);

    // 3. Accurate 4-Band Color Bands with Glossy Specular Lacquer Sheen
    const bandData = [
      { color: 0x6d3b14, pos: -0.022 }, // Brown (1)
      { color: 0x09090b, pos: -0.009 }, // Black (0)
      { color: 0x6d3b14, pos: 0.005 },  // Brown (×10 multiplier)
      { color: 0xd4af37, pos: 0.022, metalness: 0.92, roughness: 0.1 }, // Gold (±5% tolerance)
    ];
    bandData.forEach((b) => {
      const bandGeo = new THREE.CylinderGeometry(0.0141, 0.0141, 0.0048, 32);
      const bandMat = new THREE.MeshStandardMaterial({
        color: b.color,
        roughness: b.roughness ?? 0.18,
        metalness: b.metalness ?? 0.1,
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.rotation.z = Math.PI / 2;
      band.position.set(b.pos, 0.033, 0);
      group.add(band);
    });

    // 4. Thick Curved Tin-plated Copper Leads diving into solder lugs
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.12 });

    const leftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.037, 0.033, 0),
      new THREE.Vector3(-0.052, 0.033, 0),
      new THREE.Vector3(-0.052, 0.022, 0),
    ]);
    const lead1 = new THREE.Mesh(new THREE.TubeGeometry(leftCurve, 20, 0.0022, 10, false), leadMat);
    group.add(lead1);

    const rightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.037, 0.033, 0),
      new THREE.Vector3(0.052, 0.033, 0),
      new THREE.Vector3(0.052, 0.022, 0),
    ]);
    const lead2 = new THREE.Mesh(new THREE.TubeGeometry(rightCurve, 20, 0.0022, 10, false), leadMat);
    group.add(lead2);

    // 5. Heavy Knurled Brass Binding Post Terminals (T1 and T2) with Hex Locknut & Solder Lug
    const postMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.92, roughness: 0.18 });
    const knurlMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.88, roughness: 0.35 });

    const createTerminalPost = (tx: number) => {
      const postGroup = new THREE.Group();
      postGroup.position.set(tx, 0.016, 0);

      // Hexagonal brass locking nut at base
      const hexNut = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.004, 6), postMat);
      hexNut.position.y = 0.002;
      postGroup.add(hexNut);

      // Solder turret eyelet tag
      const solderLug = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.001, 0.018), postMat);
      solderLug.position.set(0, 0.0045, 0);
      postGroup.add(solderLug);

      // Threaded center stud
      const tStud = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.018, 20), postMat);
      tStud.position.y = 0.011;
      postGroup.add(tStud);

      // Knurled thumb screw collar
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.010, 28), knurlMat);
      collar.position.y = 0.018;
      postGroup.add(collar);

      // Transverse wire feed-through hole
      const xHole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0025, 0.0025, 0.014, 12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
      );
      xHole.rotation.z = Math.PI / 2;
      xHole.position.y = 0.010;
      postGroup.add(xHole);

      // Banana plug socket hole on top
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.009, 16), footMat);
      hole.position.y = 0.023;
      postGroup.add(hole);

      return postGroup;
    };

    group.add(createTerminalPost(-0.052));
    group.add(createTerminalPost(0.052));

    // Interaction Highlighting Ring
    const glowGeo = new THREE.RingGeometry(0.09, 0.10, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const glowRing = new THREE.Mesh(glowGeo, glowMat);
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.002;
    group.add(glowRing);

    group.onHoverStart = () => {
      glowMat.opacity = 0.9;
      glowMat.color.setHex(0x38bdf8);
    };
    group.onHoverEnd = () => {
      if (!group.isGrabbed) glowMat.opacity = 0;
    };
    group.onGrabStart = () => {
      glowMat.opacity = 1.0;
      glowMat.color.setHex(0xf59e0b);
      base.position.y = 0.028;
    };
    group.onGrabEnd = () => {
      glowMat.opacity = 0;
      base.position.y = 0.008;
    };

    return group;
  }

  private createInteractivePowerSupplyBox(): InteractableObject3D {
    const group: InteractableObject3D = new THREE.Group();
    group.name = 'Scientific_DC_Power_Supply';

    // 0. Soft Ambient Occlusion Contact Shadow on Table
    group.add(this.createContactShadow(0.28, 0.24, 0.58));

    // 1. Instrument Chassis (0.22m W x 0.16m H x 0.20m D) with Chamfered Heavy Powder-Coated Metal
    const chassisGeo = new THREE.BoxGeometry(0.22, 0.16, 0.20);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // rich dark slate powder-coat
      metalness: 0.55,
      roughness: 0.32,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.08;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Side Ventilation Louvers (8 precision cut slots per side)
    const ventMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
    const ventGeo = new THREE.BoxGeometry(0.002, 0.004, 0.07);
    [-0.111, 0.111].forEach((sideX) => {
      for (let v = 0; v < 8; v++) {
        const vent = new THREE.Mesh(ventGeo, ventMat);
        vent.position.set(sideX, 0.052 + v * 0.010, -0.01);
        group.add(vent);
      }
    });

    // Rear Black-Anodized Aluminum Heatsink Base
    const heatsinkGeo = new THREE.BoxGeometry(0.18, 0.12, 0.015);
    const heatsinkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65, metalness: 0.7 });
    const heatsink = new THREE.Mesh(heatsinkGeo, heatsinkMat);
    heatsink.position.set(0, 0.08, -0.108);
    group.add(heatsink);

    // 7 Extruded Vertical Cooling Fins
    const finGeo = new THREE.BoxGeometry(0.003, 0.11, 0.018);
    for (let f = -3; f <= 3; f++) {
      const fin = new THREE.Mesh(finGeo, heatsinkMat);
      fin.position.set(f * 0.024, 0.08, -0.118);
      group.add(fin);
    }

    // 4 Molded Heavy-Duty Rubber Feet with Brass Center Washers
    const footGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.008, 16);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
    const footPositions = [
      [-0.09, 0.004, -0.08],
      [0.09, 0.004, -0.08],
      [-0.09, 0.004, 0.08],
      [0.09, 0.004, 0.08],
    ];
    footPositions.forEach(([fx, fy, fz]) => {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(fx, fy, fz);
      group.add(foot);
    });

    // Top Chrome Carrying Handle with Die-Cast Mounts and Hex Screws
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.96, roughness: 0.1 });
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.06, 0.16, 0),
      new THREE.Vector3(-0.06, 0.192, 0),
      new THREE.Vector3(0.06, 0.192, 0),
      new THREE.Vector3(0.06, 0.16, 0),
    ]);
    const handleMesh = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 20, 0.0055, 10, false), handleMat);
    group.add(handleMesh);

    const bracketGeo = new THREE.BoxGeometry(0.022, 0.012, 0.016);
    const b1 = new THREE.Mesh(bracketGeo, handleMat);
    b1.position.set(-0.06, 0.166, 0);
    group.add(b1);
    const b2 = new THREE.Mesh(bracketGeo, handleMat);
    b2.position.set(0.06, 0.166, 0);
    group.add(b2);

    // 2. High-Resolution Front Bezel & Dual Digital Display (1024x716)
    const panelGeo = new THREE.PlaneGeometry(0.20, 0.14);
    const panelCanvas = document.createElement('canvas');
    panelCanvas.width = 1024;
    panelCanvas.height = 716;
    const pctx = panelCanvas.getContext('2d')!;

    // Anodized dark front face
    pctx.fillStyle = '#0b1120';
    pctx.fillRect(0, 0, 1024, 716);

    // Chamfered bezel border
    pctx.strokeStyle = '#38bdf8';
    pctx.lineWidth = 6;
    pctx.strokeRect(8, 8, 1008, 700);

    pctx.strokeStyle = '#334155';
    pctx.lineWidth = 3;
    pctx.strokeRect(18, 18, 988, 680);

    // Brand and Model Header
    pctx.fillStyle = '#ffffff';
    pctx.font = 'bold 32px system-ui, sans-serif';
    pctx.fillText('SCIENTIFIC', 42, 54);
    pctx.fillStyle = '#38bdf8';
    pctx.font = 'bold 20px system-ui, sans-serif';
    pctx.fillText('0-30V / 2A REGULATED DC POWER SUPPLY • MODEL PSD-3002', 42, 84);

    // University Asset Tag
    pctx.fillStyle = '#fef08a';
    pctx.font = 'bold 16px monospace';
    pctx.textAlign = 'right';
    pctx.fillText('BITS PILANI • EEE LAB ASSET #PS-04', 980, 54);
    pctx.textAlign = 'left';

    // Left Display: Ruby Red LED (VOLTAGE)
    pctx.fillStyle = '#1c0a0a';
    pctx.fillRect(40, 110, 440, 170);
    pctx.strokeStyle = '#7f1d1d';
    pctx.lineWidth = 4;
    pctx.strokeRect(40, 110, 440, 170);

    pctx.fillStyle = '#ef4444'; // glowing red 7-segment LED
    pctx.font = 'bold 72px monospace';
    pctx.fillText('05.00 V', 80, 220);

    pctx.fillStyle = '#fca5a5';
    pctx.font = 'bold 20px system-ui, sans-serif';
    pctx.fillText('DC VOLTAGE', 60, 140);

    // Right Display: Emerald Green LED (CURRENT)
    pctx.fillStyle = '#052e16';
    pctx.fillRect(544, 110, 440, 170);
    pctx.strokeStyle = '#14532d';
    pctx.lineWidth = 4;
    pctx.strokeRect(544, 110, 440, 170);

    pctx.fillStyle = '#22c55e'; // glowing green 7-segment LED
    pctx.font = 'bold 72px monospace';
    pctx.fillText('0.050 A', 580, 220);

    pctx.fillStyle = '#86efac';
    pctx.font = 'bold 20px system-ui, sans-serif';
    pctx.fillText('LOAD CURRENT', 564, 140);

    // Mode Status indicators: C.V. (Constant Voltage) and C.C. (Constant Current / Short Protection)
    pctx.fillStyle = '#22c55e';
    pctx.beginPath();
    pctx.arc(380, 140, 10, 0, Math.PI * 2);
    pctx.fill();
    pctx.font = 'bold 16px system-ui, sans-serif';
    pctx.fillText('C.V.', 400, 146);

    pctx.fillStyle = '#7f1d1d';
    pctx.beginPath();
    pctx.arc(440, 140, 8, 0, Math.PI * 2);
    pctx.fill();
    pctx.fillStyle = '#94a3b8';
    pctx.fillText('C.C.', 455, 146);

    // Calibrated Circular Scale Ticks around Coarse Voltage Knob (Center ~256, 480)
    pctx.strokeStyle = '#64748b';
    pctx.lineWidth = 2;
    for (let deg = -140; deg <= 140; deg += 28) {
      const rad = (deg * Math.PI) / 180;
      const x1 = 240 + Math.cos(rad) * 65;
      const y1 = 490 + Math.sin(rad) * 65;
      const x2 = 240 + Math.cos(rad) * 78;
      const y2 = 490 + Math.sin(rad) * 78;
      pctx.beginPath();
      pctx.moveTo(x1, y1);
      pctx.lineTo(x2, y2);
      pctx.stroke();
    }

    // Knob Labels
    pctx.fillStyle = '#f8fafc';
    pctx.font = 'bold 22px system-ui, sans-serif';
    pctx.textAlign = 'center';
    pctx.fillText('VOLTAGE COARSE', 240, 360);
    pctx.fillText('VOLTAGE FINE', 520, 360);
    pctx.fillText('CURRENT LIMIT', 800, 360);

    // Terminal Labels
    pctx.font = 'bold 28px monospace';
    pctx.fillStyle = '#ef4444';
    pctx.fillText('(+) RED', 300, 670);
    pctx.fillStyle = '#22c55e';
    pctx.fillText('GND', 512, 670);
    pctx.fillStyle = '#ffffff';
    pctx.fillText('(-) BLK', 720, 670);

    const panelTexture = new THREE.CanvasTexture(panelCanvas);
    const panelMat = new THREE.MeshStandardMaterial({ map: panelTexture, roughness: 0.35, metalness: 0.1 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 0.08, 0.101);
    group.add(panel);

    this.psPanelCtx = pctx;
    this.psPanelTexture = panelTexture;

    // 3. Physical Rotatable Voltage Knobs with Milled Knurled Grips
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.32, metalness: 0.5 });
    const pointerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    // Coarse Voltage Knob (Large) with Chrome Bevel Ring
    const coarseGroup = new THREE.Group();
    coarseGroup.position.set(-0.05, 0.07, 0.11);
    const coarseKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.016, 28), knobMat);
    coarseKnob.rotation.x = Math.PI / 2;
    coarseGroup.add(coarseKnob);

    const chromeRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0192, 0.0192, 0.003, 28),
      handleMat
    );
    chromeRing.rotation.x = Math.PI / 2;
    chromeRing.position.z = 0.007;
    coarseGroup.add(chromeRing);

    const pointer1 = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.015, 0.003), pointerMat);
    pointer1.position.set(0, 0.006, 0.008);
    coarseGroup.add(pointer1);
    group.add(coarseGroup);
    this.coarseKnobGroup = coarseGroup;

    // Fine Voltage Knob
    const fineKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.0135, 0.014, 24), knobMat);
    fineKnob.rotation.x = Math.PI / 2;
    fineKnob.position.set(0.005, 0.07, 0.11);
    group.add(fineKnob);

    // Current Limit Knob
    const currentKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.0135, 0.014, 24), knobMat);
    currentKnob.rotation.x = Math.PI / 2;
    currentKnob.position.set(0.06, 0.07, 0.11);
    group.add(currentKnob);

    // 4. Power Rocker Switch with Translucent Glowing Red Body
    const switchGeo = new THREE.BoxGeometry(0.018, 0.024, 0.012);
    const switchMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0xdc2626,
      emissiveIntensity: 0.85,
      roughness: 0.25,
    });
    const pSwitch = new THREE.Mesh(switchGeo, switchMat);
    pSwitch.position.set(-0.075, 0.025, 0.106);
    (pSwitch as any).isPowerSwitch = true;
    group.add(pSwitch);
    this.psSwitchMesh = pSwitch;

    // Switch bezel frame
    const sBezelGeo = new THREE.BoxGeometry(0.022, 0.028, 0.006);
    const sBezelMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5 });
    const sBezel = new THREE.Mesh(sBezelGeo, sBezelMat);
    sBezel.position.set(-0.075, 0.025, 0.102);
    group.add(sBezel);

    // 5. Heavy-Duty Binding Post Terminals: (+) Red, GND Green, (-) Black with Cross-Holes
    const createBindingPost = (bx: number, color: number) => {
      const postGroup = new THREE.Group();
      postGroup.position.set(bx, 0.025, 0.112);

      // Fluted knurled collar
      const collarGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.016, 20);
      const collarMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.25 });
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.rotation.x = Math.PI / 2;
      postGroup.add(collar);

      // Center gold contact socket hole
      const jackHole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0035, 0.0035, 0.012, 16),
        new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 })
      );
      jackHole.rotation.x = Math.PI / 2;
      jackHole.position.z = 0.006;
      postGroup.add(jackHole);

      return postGroup;
    };

    group.add(createBindingPost(-0.045, 0xef4444)); // Positive Red
    group.add(createBindingPost(0.0, 0x10b981));     // Earth Green
    group.add(createBindingPost(0.045, 0x18181b));   // Negative Black

    // Highlighting ring
    const glowGeo = new THREE.RingGeometry(0.13, 0.14, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const glowRing = new THREE.Mesh(glowGeo, glowMat);
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.002;
    group.add(glowRing);

    group.onHoverStart = () => {
      glowMat.opacity = 0.9;
      glowMat.color.setHex(0x38bdf8);
    };
    group.onHoverEnd = () => {
      if (!group.isGrabbed) glowMat.opacity = 0;
    };
    group.onGrabStart = () => {
      glowMat.opacity = 1.0;
      glowMat.color.setHex(0xf59e0b);
      chassis.position.y = 0.095;
    };
    group.onGrabEnd = () => {
      glowMat.opacity = 0;
      chassis.position.y = 0.08;
    };

    return group;
  }

  private createInteractiveMeterModule(title: string, mode: 'volts' | 'amps'): InteractableObject3D {
    const group: InteractableObject3D = new THREE.Group();
    group.name = title;

    const isVolt = mode === 'volts';
    const accentColor = isVolt ? 0x0284c7 : 0x059669;
    const bumperColor = isVolt ? 0xf59e0b : 0x10b981; // Yellow bumper for Voltmeter, Green for Ammeter

    // 0. Soft Ambient Occlusion Contact Shadow on Table
    group.add(this.createContactShadow(0.20, 0.18, 0.54));

    // 1. Fold-Out Chrome Wire Tilt Bail Stand Underneath
    const bailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.06, 0.005, -0.02),
      new THREE.Vector3(-0.06, 0.005, -0.07),
      new THREE.Vector3(0.06, 0.005, -0.07),
      new THREE.Vector3(0.06, 0.005, -0.02),
    ]);
    const bailMesh = new THREE.Mesh(
      new THREE.TubeGeometry(bailCurve, 16, 0.003, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
    );
    group.add(bailMesh);

    // 2. Ergonomic Inclined Casing (0.15m W x 0.09m H x 0.13m D)
    const bodyGeo = new THREE.BoxGeometry(0.15, 0.09, 0.13);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // dark anthracite ABS chassis
      roughness: 0.38,
      metalness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.045;
    body.castShadow = true;
    group.add(body);

    // Shock-Absorbing Molded Rubber Holster Sleeve with Corner Impact Ribs
    const bumperMat = new THREE.MeshStandardMaterial({ color: bumperColor, roughness: 0.55, metalness: 0.05 });
    const bumperGeo = new THREE.BoxGeometry(0.154, 0.032, 0.134);
    const bumper = new THREE.Mesh(bumperGeo, bumperMat);
    bumper.position.y = 0.022;
    group.add(bumper);

    // 4 Corner Drop-Bumper Ribs
    const cornerGeo = new THREE.BoxGeometry(0.012, 0.045, 0.012);
    const cornerPositions = [
      [-0.074, 0.035, -0.064],
      [0.074, 0.035, -0.064],
      [-0.074, 0.035, 0.064],
      [0.074, 0.035, 0.064],
    ];
    cornerPositions.forEach(([cx, cy, cz]) => {
      const rib = new THREE.Mesh(cornerGeo, bumperMat);
      rib.position.set(cx, cy, cz);
      group.add(rib);
    });

    // 3. Slanted High-Resolution Backlit LCD Screen
    const screenGeo = new THREE.PlaneGeometry(0.12, 0.065);
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 256;
    const sctx = screenCanvas.getContext('2d')!;

    // LCD background (pale green-grey backlight)
    sctx.fillStyle = isVolt ? '#e0f2fe' : '#d1fae5';
    sctx.fillRect(0, 0, 512, 256);

    sctx.strokeStyle = '#0f172a';
    sctx.lineWidth = 6;
    sctx.strokeRect(4, 4, 504, 248);

    // Screen Header
    sctx.fillStyle = '#0f172a';
    sctx.font = 'bold 24px system-ui, sans-serif';
    sctx.fillText(isVolt ? 'DIGITAL VOLTMETER' : 'DIGITAL AMMETER', 25, 40);

    sctx.font = 'bold 18px monospace';
    sctx.fillText(isVolt ? 'DC • AUTO RANGE' : 'DC • 200mA RANGE', 320, 40);

    // Main 7-Segment Digital Readout
    sctx.font = 'bold 84px monospace';
    sctx.fillText(isVolt ? '+05.00' : '+050.0', 40, 150);

    sctx.font = 'bold 44px system-ui, sans-serif';
    sctx.fillText(isVolt ? 'V' : 'mA', 410, 150);

    // Warning Banner at bottom of LCD
    sctx.font = 'bold 18px system-ui, sans-serif';
    sctx.fillStyle = isVolt ? '#0369a1' : '#b91c1c';
    sctx.fillText(isVolt ? 'CONNECT IN PARALLEL' : 'CONNECT IN SERIES ONLY', 25, 220);

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    const screenMat = new THREE.MeshStandardMaterial({ map: screenTexture, roughness: 0.2 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.rotation.x = -Math.PI / 4;
    screen.position.set(0, 0.08, 0.025);
    group.add(screen);

    if (isVolt) {
      this.voltmeterScreenCtx = sctx;
      this.voltmeterScreenTexture = screenTexture;
    } else {
      this.ammeterScreenCtx = sctx;
      this.ammeterScreenTexture = screenTexture;
    }

    // 4. Rotary Function Range Switch with Tactile Pointer
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.35, metalness: 0.4 });
    const knobGroup = new THREE.Group();
    knobGroup.position.set(0, 0.095, -0.025);

    const knobBase = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.010, 28), knobMat);
    knobGroup.add(knobBase);

    // Pointer index ridge
    const knobPointer = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.008, 0.018),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    knobPointer.position.set(0, 0.005, -0.006);
    knobGroup.add(knobPointer);
    group.add(knobGroup);

    // 5. Heavy-Duty Safety Shrouded Banana Terminals: (+) Red and (-) Black with Inner Brass Sleeves
    const createSafetyTerminal = (tx: number, color: number) => {
      const termGroup = new THREE.Group();
      termGroup.position.set(tx, 0.095, -0.048);

      // Outer insulated shroud collar
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0095, 0.0095, 0.018, 20),
        new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.4 })
      );
      termGroup.add(collar);

      // Inner brass contact sleeve
      const brassSleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0042, 0.0042, 0.014, 16),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 })
      );
      brassSleeve.position.y = 0.003;
      termGroup.add(brassSleeve);

      // Center socket dark hole
      const socket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0032, 0.0032, 0.012, 12),
        new THREE.MeshBasicMaterial({ color: 0x090d16 })
      );
      socket.position.y = 0.006;
      termGroup.add(socket);

      return termGroup;
    };

    group.add(createSafetyTerminal(0.04, 0xef4444));  // (+) Red Post
    group.add(createSafetyTerminal(-0.04, 0x18181b)); // (-) Black Post

    // Highlighting ring
    const glowGeo = new THREE.RingGeometry(0.10, 0.11, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const glowRing = new THREE.Mesh(glowGeo, glowMat);
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.002;
    group.add(glowRing);

    group.onHoverStart = () => {
      glowMat.opacity = 0.9;
      glowMat.color.setHex(accentColor);
    };
    group.onHoverEnd = () => {
      if (!group.isGrabbed) glowMat.opacity = 0;
    };
    group.onGrabStart = () => {
      glowMat.opacity = 1.0;
      glowMat.color.setHex(0xf59e0b);
      body.position.y = 0.06;
    };
    group.onGrabEnd = () => {
      glowMat.opacity = 0;
      body.position.y = 0.045;
    };

    return group;
  }

  private createInteractiveSwitch(): InteractableObject3D {
    const group: InteractableObject3D = new THREE.Group();
    group.name = 'SPST_Knife_Switch';

    // 0. Soft Ambient Occlusion Contact Shadow on Table
    group.add(this.createContactShadow(0.16, 0.10, 0.50));

    // 1. Heavy Glazed Vitreous Ceramic / Porcelain Base with Chamfers
    const baseGeo = new THREE.BoxGeometry(0.13, 0.016, 0.065);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // high-gloss porcelain ivory
      roughness: 0.12,
      metalness: 0.08,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.008;
    base.castShadow = true;
    group.add(base);

    // 2 Countersunk Slotted Brass Mounting Screws into Table
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.92, roughness: 0.2 });
    [-0.048, 0.048].forEach((sx) => {
      const sHead = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 16), screwMat);
      sHead.position.set(sx, 0.0165, -0.022);
      group.add(sHead);
    });

    // 2. Copper Terminal Posts (Left Hinge & Right Contact Jaw)
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // polished heavy copper
      metalness: 0.94,
      roughness: 0.18,
    });

    // Left hinge block with pivot pin & tension spring washer
    const hingeBlock = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.018), copperMat);
    hingeBlock.position.set(-0.042, 0.02, 0);
    group.add(hingeBlock);

    const pivotPin = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.024, 16), copperMat);
    pivotPin.rotation.x = Math.PI / 2;
    pivotPin.position.set(-0.042, 0.022, 0);
    group.add(pivotPin);

    // Right spring contact jaws with curved entry flare
    const jawBlock = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.024, 0.014), copperMat);
    jawBlock.position.set(0.042, 0.022, 0);
    group.add(jawBlock);

    const jawLeafGeo = new THREE.BoxGeometry(0.008, 0.020, 0.003);
    const leftLeaf = new THREE.Mesh(jawLeafGeo, copperMat);
    leftLeaf.position.set(0.042, 0.025, -0.004);
    group.add(leftLeaf);

    const rightLeaf = new THREE.Mesh(jawLeafGeo, copperMat);
    rightLeaf.position.set(0.042, 0.025, 0.004);
    group.add(rightLeaf);

    // 3. Copper Knife Blade with Fluted Black Ebonite Handle
    const bladeArm = new THREE.Group();
    bladeArm.position.set(-0.042, 0.022, 0); // Pivot at hinge pin

    const bladeGeo = new THREE.BoxGeometry(0.085, 0.008, 0.004);
    const blade = new THREE.Mesh(bladeGeo, copperMat);
    blade.position.set(0.04, 0, 0);
    bladeArm.add(blade);

    // Brass ferrule collar connecting blade to handle
    const ferrule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.15 })
    );
    ferrule.position.set(0.082, 0.008, 0);
    bladeArm.add(ferrule);

    // Fluted cylindrical insulated handle
    const handleGeo = new THREE.CylinderGeometry(0.0075, 0.0075, 0.032, 20);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.28 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.086, 0.022, 0);
    bladeArm.add(handle);

    // Closed position
    bladeArm.rotation.z = -0.05;
    group.add(bladeArm);
    this.knifeBladeArm = bladeArm;
    (group as any).isKnifeSwitch = true;

    // Interaction Highlighting
    const glowGeo = new THREE.RingGeometry(0.075, 0.085, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const glowRing = new THREE.Mesh(glowGeo, glowMat);
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.002;
    group.add(glowRing);

    group.onHoverStart = () => {
      glowMat.opacity = 0.9;
      glowMat.color.setHex(0x38bdf8);
    };
    group.onHoverEnd = () => {
      if (!group.isGrabbed) glowMat.opacity = 0;
    };
    group.onGrabStart = () => {
      glowMat.opacity = 1.0;
      glowMat.color.setHex(0xf59e0b);
      base.position.y = 0.025;
    };
    group.onGrabEnd = () => {
      glowMat.opacity = 0;
      base.position.y = 0.008;
    };

    return group;
  }

  public applyCameraRotation() {
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  public requestPointerLock() {
    if (this.canvasElement && this.canvasElement.requestPointerLock) {
      this.canvasElement.requestPointerLock();
    }
  }

  public exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  public togglePointerLock() {
    if (this.isPointerLocked) {
      this.exitPointerLock();
    } else {
      this.requestPointerLock();
    }
  }

  private updateCrosshairAction(action: string | null) {
    if (this.onCrosshairActionChange) {
      this.onCrosshairActionChange(action);
    }
  }

  private executeCenterClick() {
    const centerRay = new THREE.Raycaster();
    centerRay.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    // 1. Terminals
    const termHits = centerRay.intersectObjects(this.terminalMeshes, false);
    if (termHits.length > 0) {
      const termId = (termHits[0].object as any).terminalId as TerminalId;
      if (termId) {
        labAudio.playWirePlug();
        this.wireManager.handleTerminalClick(termId);
        return;
      }
    }

    // 2. Wires
    const wireMeshes = this.wireManager.getWireMeshes();
    if (wireMeshes.length > 0) {
      const wireHits = centerRay.intersectObjects(wireMeshes, false);
      if (wireHits.length > 0) {
        const wireId = this.wireManager.findWireIdByMesh(wireHits[0].object);
        if (wireId) {
          labAudio.playWireUnplug();
          this.wireManager.removeWire(wireId);
          return;
        }
      }
    }

    // 3. Knife switch
    if (this.switchGroup) {
      const switchHits = centerRay.intersectObjects(this.switchGroup.children, true);
      if (switchHits.length > 0) {
        if (this.isKnifeClosed) {
          labAudio.playKnifeSwitchOpen();
        } else {
          labAudio.playKnifeSwitchClose();
        }
        if (this.onToggleSwitch) this.onToggleSwitch();
        return;
      }
    }

    // 4. Power switch
    if (this.psSwitchMesh) {
      const psHits = centerRay.intersectObject(this.psSwitchMesh, false);
      if (psHits.length > 0) {
        labAudio.playPowerSwitch(!this.currentCircuitStatus?.isPowerOn);
        if (this.onTogglePower) this.onTogglePower();
        return;
      }
    }
  }

  private setupDesktopEvents(canvas: HTMLCanvasElement) {
    const mouse = new THREE.Vector2();

    const updateMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const termRaycaster = new THREE.Raycaster();
    const clickRaycaster = new THREE.Raycaster();

    // 1. Pointer Lock Change Listener
    const onPointerLockChange = () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
      if (this.onPointerLockChange) {
        this.onPointerLockChange(this.isPointerLocked);
      }
      if (!this.isPointerLocked) {
        this.updateCrosshairAction(null);
      }
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // 2. WASD Movement Listeners
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      this.keysPressed[e.code] = true;
      this.isCinematicMoving = false; // Player takes over control
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keysPressed[e.code] = false;
    });

    // 3. Pointer Move Handler (Mouse look, Cursor updates & Hover feedback)
    window.addEventListener('pointermove', (e: PointerEvent) => {
      // Mode A: Pointer is locked -> Direct First-Person Mouse Look
      if (this.isPointerLocked) {
        this.isCinematicMoving = false;
        const sens = 0.0022;
        this.yaw -= e.movementX * sens;
        this.pitch -= e.movementY * sens;
        this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
        this.applyCameraRotation();
        return;
      }

      // Mode B: Right-Click Drag -> Smooth Camera Look
      if (this.isRightDragging) {
        this.isCinematicMoving = false;
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.yaw -= dx * 0.003;
        this.pitch -= dy * 0.003;
        this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
        this.applyCameraRotation();
        return;
      }

      // Mode C: Left-Click Drag on background -> Smooth Camera Look
      if (this.isLeftDraggingLook) {
        this.isCinematicMoving = false;
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.yaw -= dx * 0.003;
        this.pitch -= dy * 0.003;
        this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
        this.applyCameraRotation();
        return;
      }

      // Mode D: Cursor Hover & Drag
      updateMouse(e);
      this.inputAbstraction.processDesktopMouseMove(mouse, this.camera);

      // Interactive cursor feedback when hovering over terminals, switches or instruments
      if (!this.inputAbstraction.isDragging()) {
        termRaycaster.setFromCamera(mouse, this.camera);
        const termHits = termRaycaster.intersectObjects(this.terminalMeshes, false);
        if (termHits.length > 0) {
          canvas.style.cursor = 'pointer';
          this.wireManager.setHoveredWire(null);
          return;
        }

        clickRaycaster.setFromCamera(mouse, this.camera);

        // Hover over wires: highlight with amber glow
        const wireMeshes = this.wireManager.getWireMeshes();
        if (wireMeshes.length > 0) {
          const wireHits = clickRaycaster.intersectObjects(wireMeshes, false);
          if (wireHits.length > 0) {
            const wireId = this.wireManager.findWireIdByMesh(wireHits[0].object);
            this.wireManager.setHoveredWire(wireId || null);
            canvas.style.cursor = 'pointer';
            return;
          }
        }
        this.wireManager.setHoveredWire(null);

        // Hover over knife switch
        if (this.switchGroup) {
          const switchHits = clickRaycaster.intersectObjects(this.switchGroup.children, true);
          if (switchHits.length > 0) {
            canvas.style.cursor = 'pointer';
            return;
          }
        }

        // Hover over power switch
        if (this.psSwitchMesh) {
          const psHits = clickRaycaster.intersectObject(this.psSwitchMesh, false);
          if (psHits.length > 0) {
            canvas.style.cursor = 'pointer';
            return;
          }
        }

        // Hover over draggable apparatus
        const interactables = this.inputAbstraction.getInteractables();
        const appHits = clickRaycaster.intersectObjects(interactables, true);
        if (appHits.length > 0) {
          canvas.style.cursor = 'grab';
          return;
        }

        canvas.style.cursor = 'default';
      }
    });

    // 4. Pointer Down Handler (Interactions & Drag Start)
    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      // Right Mouse Button: Start smooth camera look
      if (e.button === 2) {
        this.isRightDragging = true;
        this.isCinematicMoving = false;
        return;
      }

      if (e.button !== 0) return; // Left click only below

      // If pointer is locked: execute center raycast click immediately
      if (this.isPointerLocked) {
        this.executeCenterClick();
        return;
      }

      updateMouse(e);

      // 1. Check if user clicked on a 3D terminal socket
      termRaycaster.setFromCamera(mouse, this.camera);
      const intersects = termRaycaster.intersectObjects(this.terminalMeshes, false);
      if (intersects.length > 0) {
        const termId = (intersects[0].object as any).terminalId as TerminalId;
        if (termId) {
          labAudio.playWirePlug();
          this.wireManager.handleTerminalClick(termId);
          return;
        }
      }

      // 2. Check if user clicked directly on a wire to remove it
      clickRaycaster.setFromCamera(mouse, this.camera);
      const wireMeshes = this.wireManager.getWireMeshes();
      if (wireMeshes.length > 0) {
        const wireHits = clickRaycaster.intersectObjects(wireMeshes, false);
        if (wireHits.length > 0) {
          const wireId = this.wireManager.findWireIdByMesh(wireHits[0].object);
          if (wireId) {
            labAudio.playWireUnplug();
            this.wireManager.removeWire(wireId);
            return;
          }
        }
      }

      // 3. Check 3D knife switch direct click
      if (this.switchGroup) {
        const switchHits = clickRaycaster.intersectObjects(this.switchGroup.children, true);
        if (switchHits.length > 0) {
          if (this.isKnifeClosed) {
            labAudio.playKnifeSwitchOpen();
          } else {
            labAudio.playKnifeSwitchClose();
          }
          if (this.onToggleSwitch) this.onToggleSwitch();
          return;
        }
      }

      // 4. Check 3D power supply rocker switch direct click
      if (this.psSwitchMesh) {
        const psHits = clickRaycaster.intersectObject(this.psSwitchMesh, false);
        if (psHits.length > 0) {
          labAudio.playPowerSwitch(!this.currentCircuitStatus?.isPowerOn);
          if (this.onTogglePower) this.onTogglePower();
          return;
        }
      }

      // 5. Check if user clicked on an apparatus to pick up and drag
      const grabbed = this.inputAbstraction.processDesktopMouseDown(mouse, this.camera);
      if (grabbed) {
        canvas.style.cursor = 'grabbing';
        return;
      }

      // 6. Otherwise: Left-drag on room background or table looks around
      this.isLeftDraggingLook = true;
      this.isCinematicMoving = false;
    });

    // 5. Pointer Up Handler
    window.addEventListener('pointerup', (e: PointerEvent) => {
      if (e.button === 2) {
        this.isRightDragging = false;
      }
      if (e.button === 0) {
        this.isLeftDraggingLook = false;
        if (this.inputAbstraction.isDragging('desktop-mouse')) {
          this.inputAbstraction.processDesktopMouseUp();
          canvas.style.cursor = 'default';
        }
      }
    });

    // 6. Mouse Scroll Wheel Handler (Optical Zoom In / Out)
    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      // Rolling up (deltaY < 0): Zoom In (smaller FOV = high optical magnification)
      // Rolling down (deltaY > 0): Zoom Out (larger FOV = wide room perspective)
      const zoomStep = e.deltaY * 0.035;
      this.targetFov = THREE.MathUtils.clamp(this.targetFov + zoomStep, 20, 68);
    }, { passive: false });

    // 7. Prevent Context Menu so Right-Click Drag Look is seamless
    canvas.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
    });
  }

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  public update() {
    const now = performance.now();
    const delta = Math.min(0.05, (now - this.lastFrameTime) / 1000.0);
    this.lastFrameTime = now;

    // 1. Professional Mechanical Knife Switch Physics Simulation (Spring Snap + Metallic Jaw Bounce)
    if (this.knifeBladeArm) {
      const diff = this.targetBladeAngle - this.bladeAngle;
      if (this.isKnifeClosed) {
        // Closing: strong spring acceleration with metallic contact bounce
        const springForce = diff * 95.0;
        const damping = this.bladeVelocity * 14.0;
        this.bladeVelocity += (springForce - damping) * delta;
        this.bladeAngle += this.bladeVelocity * delta;

        if (this.bladeAngle <= -0.05 && this.bladeVelocity < 0) {
          this.bladeAngle = -0.05;
          // Crisp metallic contact bounce in copper jaws
          this.bladeVelocity = -this.bladeVelocity * 0.25;
          if (Math.abs(this.bladeVelocity) < 0.08) this.bladeVelocity = 0;
        }
      } else {
        // Opening: smooth manual swing with gentle easing
        const springForce = diff * 48.0;
        const damping = this.bladeVelocity * 12.0;
        this.bladeVelocity += (springForce - damping) * delta;
        this.bladeAngle += this.bladeVelocity * delta;

        if (this.bladeAngle >= 1.15 && this.bladeVelocity > 0) {
          this.bladeAngle = 1.15;
          this.bladeVelocity = -this.bladeVelocity * 0.15;
          if (Math.abs(this.bladeVelocity) < 0.08) this.bladeVelocity = 0;
        }
      }
      this.knifeBladeArm.rotation.z = this.bladeAngle;
    }

    // Coarse rotary knob smooth rotational damping
    if (this.coarseKnobGroup) {
      this.currentKnobAngle = THREE.MathUtils.lerp(this.currentKnobAngle, this.targetKnobAngle, 0.18);
      this.coarseKnobGroup.rotation.z = this.currentKnobAngle;
    }

    // Power supply rocker switch smooth physical tilt
    if (this.psSwitchMesh) {
      this.rockerAngle = THREE.MathUtils.lerp(this.rockerAngle, this.targetRockerAngle, 0.22);
      this.psSwitchMesh.rotation.x = this.rockerAngle;
    }

    // Live Digital Multimeter ADC Settling Animation
    if (this.currentCircuitStatus && now - this.meterSettlingStartTime < 220) {
      this.redrawMeterScreens(this.currentCircuitStatus, true);
    }

    // 2. Selected Terminal Halo Glow Pulse Animation
    if (this.selectedTerminalId) {
      const halo = this.terminalHalos.get(this.selectedTerminalId);
      if (halo) {
        const pulse = 1.35 + 0.25 * Math.sin(now * 0.008);
        halo.ring.scale.set(pulse, pulse, pulse);
      }
    }

    // 3. WASD + Arrow Keys Keyboard Walk Navigation with Physical Colliders
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const moveDir = new THREE.Vector3();
    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) moveDir.add(forward);
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) moveDir.sub(forward);
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) moveDir.sub(right);
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) moveDir.add(right);
    if (this.keysPressed['KeyE'] || this.keysPressed['Space']) moveDir.y += 0.8;
    if (this.keysPressed['KeyQ'] || this.keysPressed['KeyC']) moveDir.y -= 0.8;

    if (moveDir.lengthSq() > 0) {
      this.isCinematicMoving = false;
      moveDir.normalize();
      const speed = this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight']
        ? this.moveSpeed * 1.8
        : this.moveSpeed;
      this.cameraVelocity.lerp(moveDir.multiplyScalar(speed), Math.min(1.0, delta * 12));
    } else {
      this.cameraVelocity.lerp(new THREE.Vector3(0, 0, 0), Math.min(1.0, delta * 14));
    }

    if (this.cameraVelocity.lengthSq() > 0.0001) {
      const candidatePos = this.camera.position.clone().addScaledVector(this.cameraVelocity, delta);
      const resolvedPos = this.resolveCameraObstacles(candidatePos);
      this.camera.position.copy(resolvedPos);
    }

    // Smooth FOV zoom update
    if (Math.abs(this.camera.fov - this.targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, Math.min(1.0, delta * 10));
      this.camera.updateProjectionMatrix();
    }

    // Cinematic preset animation
    if (this.isCinematicMoving) {
      const elapsed = (now - this.cameraAnimStartTime) / 1000.0;
      const rawT = Math.min(1.0, elapsed / this.cameraAnimDuration);
      const t = rawT * rawT * (3.0 - 2.0 * rawT);

      this.camera.position.lerpVectors(this.cameraStartPos, this.cameraTargetPos, t);

      let diffYaw = this.targetYaw - this.startYaw;
      while (diffYaw > Math.PI) diffYaw -= 2 * Math.PI;
      while (diffYaw < -Math.PI) diffYaw += 2 * Math.PI;
      this.yaw = this.startYaw + diffYaw * t;

      this.pitch = THREE.MathUtils.lerp(this.startPitch, this.targetPitch, t);
      this.applyCameraRotation();

      if (rawT >= 1.0) {
        this.camera.position.copy(this.cameraTargetPos);
        this.yaw = this.targetYaw;
        this.pitch = this.targetPitch;
        this.applyCameraRotation();
        this.isCinematicMoving = false;
      }
    } else {
      this.applyCameraRotation();
    }

    // 4. Center Crosshair Hover Raycasting when Pointer Locked
    if (this.isPointerLocked) {
      const centerRay = new THREE.Raycaster();
      centerRay.setFromCamera(new THREE.Vector2(0, 0), this.camera);

      const termHits = centerRay.intersectObjects(this.terminalMeshes, false);
      if (termHits.length > 0) {
        const termId = (termHits[0].object as any).terminalId as string;
        this.updateCrosshairAction(`[Left Click] Connect Terminal (${termId?.toUpperCase() || ''})`);
      } else if (this.switchGroup && centerRay.intersectObjects(this.switchGroup.children, true).length > 0) {
        this.updateCrosshairAction(`[Left Click] ${this.isKnifeClosed ? 'Open' : 'Close'} Knife Switch`);
      } else if (this.psSwitchMesh && centerRay.intersectObject(this.psSwitchMesh, false).length > 0) {
        this.updateCrosshairAction(`[Left Click] Toggle DC Power Supply`);
      } else {
        const wireMeshes = this.wireManager.getWireMeshes();
        if (wireMeshes.length > 0 && centerRay.intersectObjects(wireMeshes, false).length > 0) {
          this.updateCrosshairAction(`[Left Click] Remove Wire`);
        } else {
          this.updateCrosshairAction(null);
        }
      }
    }

    // 5. Fast in-place wire update when dragging objects
    if (this.inputAbstraction.isDragging()) {
      this.wireManager.updateAllWires();
    }
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    window.removeEventListener('resize', this.onWindowResize);
    this.wireManager.dispose();
    this.room.dispose();
    this.renderer.dispose();
  }
}
