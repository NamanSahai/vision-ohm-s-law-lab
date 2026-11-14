import * as THREE from 'three';

export class LaboratoryRoom {
  public group: THREE.Group;
  private disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'IndianEEELaboratoryEnvironment';
    this.buildRoomStructure();
    this.buildLightingFixtures();
    this.buildMainWorkbenchDetails();
    this.buildAdjacentWorkbenches();
    this.buildStaticEquipment();
    this.buildLabWallDecor();
    this.buildCeilingFans();
  }

  private buildRoomStructure() {
    // Room dimensions: 9m wide x 8m deep x 3.6m high (spacious Indian college lab)
    const roomWidth = 9.0;
    const roomDepth = 8.0;
    const roomHeight = 3.6;

    // 1. FLOOR: Classic light grey Kota stone / Terrazzo lab tiles
    // Raised slightly to y = 0 to be the sole master floor
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 1024;
    floorCanvas.height = 1024;
    const fctx = floorCanvas.getContext('2d')!;

    // Light stone base color (typical Indian institutional terrazzo/kota stone)
    fctx.fillStyle = '#e2e8f0'; // light cool grey stone
    fctx.fillRect(0, 0, 1024, 1024);

    // Subtle stone speckles
    for (let i = 0; i < 4000; i++) {
      const sx = Math.random() * 1024;
      const sy = Math.random() * 1024;
      const grey = Math.floor(180 + Math.random() * 50);
      fctx.fillStyle = `rgb(${grey},${grey},${grey})`;
      fctx.fillRect(sx, sy, 2, 2);
    }

    // 2ft x 2ft tile grout joints
    fctx.strokeStyle = '#94a3b8';
    fctx.lineWidth = 3;
    const tileSize = 256;
    for (let x = 0; x <= 1024; x += tileSize) {
      fctx.beginPath();
      fctx.moveTo(x, 0);
      fctx.lineTo(x, 1024);
      fctx.stroke();
    }
    for (let y = 0; y <= 1024; y += tileSize) {
      fctx.beginPath();
      fctx.moveTo(0, y);
      fctx.lineTo(1024, y);
      fctx.stroke();
    }

    // Yellow safety boundary lines around workstation aisle
    fctx.strokeStyle = '#ca8a04';
    fctx.lineWidth = 8;
    fctx.setLineDash([24, 16]);
    fctx.strokeRect(180, 240, 664, 544);
    fctx.setLineDash([]);

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(2, 2);
    this.disposables.push(floorTexture);

    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    this.disposables.push(floorGeo);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.05,
    });
    this.disposables.push(floorMat);

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -0.6);
    floor.receiveShadow = true;
    this.group.add(floor);

    // 2. WALLS: Two-tone Indian college walls (Cream/white upper, classic Green/Teal institutional dado band at bottom 1.1m)
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 512;
    wallCanvas.height = 512;
    const wctx = wallCanvas.getContext('2d')!;

    // Top: Warm off-white / ivory plaster
    wctx.fillStyle = '#f8fafc';
    wctx.fillRect(0, 0, 512, 350);

    // Thin wooden / dark border trim between colors
    wctx.fillStyle = '#1e293b';
    wctx.fillRect(0, 350, 512, 8);

    // Bottom: Classic Indian engineering college green dado paint (oil-based washable paint)
    wctx.fillStyle = '#115e59'; // rich institutional green-teal
    wctx.fillRect(0, 358, 512, 154);

    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    this.disposables.push(wallTexture);

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.6,
      metalness: 0.05,
    });
    this.disposables.push(wallMat);

    // Back Wall
    const backWallGeo = new THREE.PlaneGeometry(roomWidth, roomHeight);
    this.disposables.push(backWallGeo);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, roomHeight / 2, -4.0);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    // Left Wall with windows
    const sideWallGeo = new THREE.PlaneGeometry(roomDepth, roomHeight);
    this.disposables.push(sideWallGeo);

    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, -0.6);
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(roomWidth / 2, roomHeight / 2, -0.6);
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // Ceiling: Off-white plaster
    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    this.disposables.push(ceilingGeo);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.9,
    });
    this.disposables.push(ceilingMat);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, roomHeight, -0.6);
    this.group.add(ceiling);

    // Build large classroom/lab windows on Left wall letting in bright natural daylight
    this.buildWindows(-roomWidth / 2 + 0.02);
  }

  private buildWindows(wallX: number) {
    const windowPositions = [-2.2, 0.8];
    const frameGeo = new THREE.BoxGeometry(0.04, 1.8, 1.4);
    this.disposables.push(frameGeo);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    this.disposables.push(frameMat);

    const glassGeo = new THREE.PlaneGeometry(1.3, 1.7);
    this.disposables.push(glassGeo);
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.7,
    });
    this.disposables.push(glassMat);

    windowPositions.forEach((z) => {
      const winGroup = new THREE.Group();
      winGroup.position.set(wallX, 2.2, z);

      const frame = new THREE.Mesh(frameGeo, frameMat);
      winGroup.add(frame);

      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.rotation.y = Math.PI / 2;
      winGroup.add(glass);

      // Louvered venetian blind effect
      for (let y = -0.75; y <= 0.75; y += 0.12) {
        const slatGeo = new THREE.BoxGeometry(0.015, 0.015, 1.3);
        const slat = new THREE.Mesh(slatGeo, frameMat);
        slat.position.set(0.02, y, 0);
        winGroup.add(slat);
      }

      this.group.add(winGroup);
    });
  }

  private buildLightingFixtures() {
    // Twin-tube fluorescent light batten fixtures (typical 4ft Philips / Bajaj batten lights in Indian labs)
    const fixturePositions: [number, number][] = [
      [-2.0, -2.0],
      [2.0, -2.0],
      [-2.0, 0.4],
      [2.0, 0.4],
      [0.0, -0.8], // Direct light over the main student workbench
    ];

    const casingGeo = new THREE.BoxGeometry(1.4, 0.06, 0.18);
    this.disposables.push(casingGeo);
    const casingMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    this.disposables.push(casingMat);

    const tubeGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.3, 16);
    this.disposables.push(tubeGeo);
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // pure glowing daylight
    this.disposables.push(tubeMat);

    fixturePositions.forEach(([x, z]) => {
      const fixture = new THREE.Group();
      fixture.position.set(x, 3.56, z);

      const casing = new THREE.Mesh(casingGeo, casingMat);
      fixture.add(casing);

      // Two tubes
      const tube1 = new THREE.Mesh(tubeGeo, tubeMat);
      tube1.rotation.z = Math.PI / 2;
      tube1.position.set(0, -0.04, -0.04);
      fixture.add(tube1);

      const tube2 = new THREE.Mesh(tubeGeo, tubeMat);
      tube2.rotation.z = Math.PI / 2;
      tube2.position.set(0, -0.04, 0.04);
      fixture.add(tube2);

      // Real downwards light from this fixture
      const pointLight = new THREE.PointLight(0xf8fafc, 0.9, 5.0, 1.2);
      pointLight.position.set(0, -0.1, 0);
      fixture.add(pointLight);

      this.group.add(fixture);
    });
  }

  private buildMainWorkbenchDetails() {
    // The main central workbench sits at [0, 0.85, -0.6]
    // Add realistic Indian lab details to it:
    // 1. Power Trunking / Raceway on the rear edge of table
    const racewayGeo = new THREE.BoxGeometry(1.6, 0.12, 0.08);
    this.disposables.push(racewayGeo);
    const racewayMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // dark industrial raceway
      roughness: 0.4,
    });
    this.disposables.push(racewayMat);

    const raceway = new THREE.Mesh(racewayGeo, racewayMat);
    raceway.position.set(0, 0.935, -1.01);
    this.group.add(raceway);

    // Indian 3-pin switch sockets (Anchor / Havells style) along the raceway
    const socketCanvas = document.createElement('canvas');
    socketCanvas.width = 256;
    socketCanvas.height = 128;
    const sctx = socketCanvas.getContext('2d')!;

    sctx.fillStyle = '#f1f5f9';
    sctx.fillRect(0, 0, 256, 128);

    // Switch on left
    sctx.fillStyle = '#1e293b';
    sctx.fillRect(25, 30, 45, 68);
    sctx.fillStyle = '#e2e8f0';
    sctx.fillRect(30, 45, 35, 38);

    // 3-pin socket on right (Earth at top, Line & Neutral at bottom)
    sctx.fillStyle = '#0f172a';
    // Earth pin
    sctx.beginPath();
    sctx.arc(175, 40, 12, 0, Math.PI * 2);
    sctx.fill();
    // Neutral & Live pins
    sctx.beginPath();
    sctx.arc(150, 85, 9, 0, Math.PI * 2);
    sctx.arc(200, 85, 9, 0, Math.PI * 2);
    sctx.fill();

    // Red pilot lamp
    sctx.fillStyle = '#dc2626';
    sctx.beginPath();
    sctx.arc(95, 45, 8, 0, Math.PI * 2);
    sctx.fill();

    const socketTexture = new THREE.CanvasTexture(socketCanvas);
    this.disposables.push(socketTexture);
    const socketMat = new THREE.MeshStandardMaterial({ map: socketTexture, roughness: 0.3 });
    this.disposables.push(socketMat);

    const socketGeo = new THREE.PlaneGeometry(0.12, 0.07);
    this.disposables.push(socketGeo);

    const socketPositions = [-0.55, -0.2, 0.2, 0.55];
    socketPositions.forEach((sx) => {
      const sock = new THREE.Mesh(socketGeo, socketMat);
      sock.position.set(sx, 0.935, -0.969);
      this.group.add(sock);
    });

    // Lab stools (Classic circular wooden top stools with black steel tubular legs)
    this.buildLabStool(-0.45, 0.0, -0.1);
    this.buildLabStool(0.45, 0.0, -0.1);
  }

  private buildLabStool(x: number, y: number, z: number) {
    const stoolGroup = new THREE.Group();
    stoolGroup.position.set(x, y, z);

    // Round wooden seat
    const seatGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.03, 24);
    this.disposables.push(seatGeo);
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e, // polished teak/sheesham wood
      roughness: 0.4,
    });
    this.disposables.push(seatMat);
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = 0.58;
    seat.castShadow = true;
    stoolGroup.add(seat);

    // 4 metal tubular legs
    const legGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.58, 12);
    this.disposables.push(legGeo);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });
    this.disposables.push(legMat);

    const legOffsets = [
      [-0.1, -0.1],
      [0.1, -0.1],
      [-0.1, 0.1],
      [0.1, 0.1],
    ];
    legOffsets.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.29, lz);
      stoolGroup.add(leg);
    });

    // Footrest ring
    const ringGeo = new THREE.TorusGeometry(0.12, 0.008, 8, 24);
    this.disposables.push(ringGeo);
    const ring = new THREE.Mesh(ringGeo, legMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.22;
    stoolGroup.add(ring);

    this.group.add(stoolGroup);
  }

  private buildAdjacentWorkbenches() {
    // TABLE 2: Left adjacent workbench with Oscilloscope & Variac
    this.buildBenchTable(-2.6, 0.85, -0.8, 1.8, 0.9);

    // TABLE 3: Right adjacent workbench with Rheostats & Analog Meters
    this.buildBenchTable(2.6, 0.85, -0.8, 1.8, 0.9);

    // TABLE 4: Teacher / Demo bench in the back against the wall
    this.buildBenchTable(0, 0.85, -3.2, 3.2, 0.7);
  }

  private buildBenchTable(x: number, y: number, z: number, width: number, depth: number) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(x, 0, z);

    // Wooden tabletop (Solid 30mm ply with laminate)
    const topGeo = new THREE.BoxGeometry(width, 0.04, depth);
    this.disposables.push(topGeo);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x92400e, // rich teak laboratory laminate
      roughness: 0.45,
      metalness: 0.1,
    });
    this.disposables.push(topMat);

    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = y;
    top.castShadow = true;
    top.receiveShadow = true;
    tableGroup.add(top);

    // Steel frame under tabletop (Indian lab blue enamel steel frame)
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // classic Indian lab blue
      roughness: 0.35,
      metalness: 0.6,
    });
    this.disposables.push(frameMat);

    const legGeo = new THREE.BoxGeometry(0.04, y, 0.04);
    this.disposables.push(legGeo);

    const hx = width / 2 - 0.05;
    const hz = depth / 2 - 0.05;
    const legPositions = [
      [-hx, y / 2, -hz],
      [hx, y / 2, -hz],
      [-hx, y / 2, hz],
      [hx, y / 2, hz],
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, frameMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    });

    this.group.add(tableGroup);
  }

  private buildStaticEquipment() {
    // 1. Dual-Trace Cathode Ray Oscilloscope (CRO) on Left Table
    this.buildOscilloscope(-2.8, 0.87, -0.85);

    // 2. Variac / Auto-transformer on Left Table
    this.buildVariac(-2.0, 0.87, -0.75);

    // 3. Classic Heavy Wire-Wound Rheostats on Right Table
    this.buildClassicRheostat(2.1, 0.87, -0.65, 0.35);
    this.buildClassicRheostat(2.2, 0.87, -0.95, 0.45);

    // 4. Decade Resistance Box (Teak Wood Box with Dial Switches) on Right Table
    this.buildDecadeResistanceBox(2.8, 0.87, -0.8);

    // 5. Slanted Analog Wooden Meters (Voltmeter & Ammeter) on Teacher / Back Table
    this.buildAnalogMeter(-0.8, 0.87, -3.2, 'VOLTMETER 0-300V');
    this.buildAnalogMeter(-0.3, 0.87, -3.2, 'AMMETER 0-5A');
    this.buildAnalogMeter(0.3, 0.87, -3.2, 'GALVANOMETER (30-0-30)');

    // 6. Step-down Transformer & Wire lead rack
    this.buildTransformer(0.8, 0.87, -3.2);
    this.buildWireLeadRack(3.2, 1.8, -3.8);
  }

  private buildOscilloscope(x: number, y: number, z: number) {
    const croGroup = new THREE.Group();
    croGroup.position.set(x, y, z);

    // Metal chassis
    const bodyGeo = new THREE.BoxGeometry(0.32, 0.22, 0.42);
    this.disposables.push(bodyGeo);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // industrial beige/grey
      roughness: 0.3,
      metalness: 0.7,
    });
    this.disposables.push(bodyMat);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.11;
    croGroup.add(body);

    // CRT Screen with glowing green grid graticule
    const screenGeo = new THREE.PlaneGeometry(0.14, 0.12);
    this.disposables.push(screenGeo);

    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 256;
    screenCanvas.height = 256;
    const sctx = screenCanvas.getContext('2d')!;

    sctx.fillStyle = '#064e3b'; // dark green phosphor
    sctx.fillRect(0, 0, 256, 256);

    // 8x10 graticule grid
    sctx.strokeStyle = '#10b98166';
    sctx.lineWidth = 2;
    for (let gx = 0; gx <= 256; gx += 25.6) {
      sctx.beginPath();
      sctx.moveTo(gx, 0);
      sctx.lineTo(gx, 256);
      sctx.stroke();
    }
    for (let gy = 0; gy <= 256; gy += 25.6) {
      sctx.beginPath();
      sctx.moveTo(0, gy);
      sctx.lineTo(256, gy);
      sctx.stroke();
    }

    // Glowing sine wave on screen
    sctx.strokeStyle = '#34d399';
    sctx.lineWidth = 4;
    sctx.beginPath();
    for (let px = 0; px <= 256; px++) {
      const py = 128 + Math.sin((px / 256) * Math.PI * 4) * 60;
      if (px === 0) sctx.moveTo(px, py);
      else sctx.lineTo(px, py);
    }
    sctx.stroke();

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    this.disposables.push(screenTexture);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
    this.disposables.push(screenMat);

    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(-0.06, 0.12, 0.211);
    croGroup.add(screen);

    // Knobs and BNC inputs on front right
    const knobGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.015, 16);
    this.disposables.push(knobGeo);
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    this.disposables.push(knobMat);

    const knobPositions = [
      [0.06, 0.16, 0.22],
      [0.11, 0.16, 0.22],
      [0.06, 0.09, 0.22],
      [0.11, 0.09, 0.22],
      [0.06, 0.03, 0.22],
    ];
    knobPositions.forEach(([kx, ky, kz]) => {
      const knob = new THREE.Mesh(knobGeo, knobMat);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(kx, ky, kz);
      croGroup.add(knob);
    });

    this.group.add(croGroup);
  }

  private buildVariac(x: number, y: number, z: number) {
    const variacGroup = new THREE.Group();
    variacGroup.position.set(x, y, z);

    // Cylindrical metal casing
    const caseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 24);
    this.disposables.push(caseGeo);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // hammered grey metal
      roughness: 0.4,
      metalness: 0.7,
    });
    this.disposables.push(caseMat);

    const casing = new THREE.Mesh(caseGeo, caseMat);
    casing.position.y = 0.08;
    variacGroup.add(casing);

    // Circular dial plate (0-270V) on top
    const dialGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.01, 32);
    this.disposables.push(dialGeo);

    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 256;
    dialCanvas.height = 256;
    const dctx = dialCanvas.getContext('2d')!;

    dctx.fillStyle = '#f8fafc';
    dctx.beginPath();
    dctx.arc(128, 128, 120, 0, Math.PI * 2);
    dctx.fill();

    dctx.strokeStyle = '#0f172a';
    dctx.lineWidth = 3;
    dctx.stroke();

    dctx.fillStyle = '#0f172a';
    dctx.font = 'bold 20px system-ui, sans-serif';
    dctx.textAlign = 'center';
    dctx.fillText('VARIAC 0-270V', 128, 70);
    dctx.fillText('OUTPUT', 128, 190);

    const dialTexture = new THREE.CanvasTexture(dialCanvas);
    this.disposables.push(dialTexture);
    const dialMat = new THREE.MeshStandardMaterial({ map: dialTexture, roughness: 0.3 });
    this.disposables.push(dialMat);

    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.position.y = 0.165;
    variacGroup.add(dial);

    // Large bakelite knob with red pointer on top
    const knobGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.035, 24);
    this.disposables.push(knobGeo);
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
    this.disposables.push(knobMat);

    const knob = new THREE.Mesh(knobGeo, knobMat);
    knob.position.y = 0.185;
    variacGroup.add(knob);

    // Red pointer arrow on knob
    const ptrGeo = new THREE.ConeGeometry(0.012, 0.035, 12);
    this.disposables.push(ptrGeo);
    const ptrMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    this.disposables.push(ptrMat);

    const ptr = new THREE.Mesh(ptrGeo, ptrMat);
    ptr.rotation.x = Math.PI / 2;
    ptr.position.set(0, 0.205, -0.04);
    variacGroup.add(ptr);

    this.group.add(variacGroup);
  }

  private buildClassicRheostat(x: number, y: number, z: number, length: number) {
    const rheoGroup = new THREE.Group();
    rheoGroup.position.set(x, y, z);

    // Cast iron end stands
    const standGeo = new THREE.BoxGeometry(0.03, 0.10, 0.10);
    this.disposables.push(standGeo);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 });
    this.disposables.push(standMat);

    const stand1 = new THREE.Mesh(standGeo, standMat);
    stand1.position.set(-length / 2, 0.05, 0);
    rheoGroup.add(stand1);

    const stand2 = new THREE.Mesh(standGeo, standMat);
    stand2.position.set(length / 2, 0.05, 0);
    rheoGroup.add(stand2);

    // Ceramic tube with resistance wire winding
    const tubeGeo = new THREE.CylinderGeometry(0.03, 0.03, length - 0.06, 24);
    this.disposables.push(tubeGeo);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x78716c, // oxidised constantan/eureka wire coil
      roughness: 0.5,
      metalness: 0.4,
    });
    this.disposables.push(tubeMat);

    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.z = Math.PI / 2;
    tube.position.y = 0.06;
    rheoGroup.add(tube);

    // Slider guide rod (polished brass/chrome)
    const rodGeo = new THREE.CylinderGeometry(0.005, 0.005, length, 12);
    this.disposables.push(rodGeo);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.1 });
    this.disposables.push(rodMat);

    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, 0.105, 0);
    rheoGroup.add(rod);

    // Sliding contact block with bakelite knob
    const sliderGeo = new THREE.BoxGeometry(0.035, 0.04, 0.04);
    this.disposables.push(sliderGeo);
    const sliderMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
    this.disposables.push(sliderMat);

    const slider = new THREE.Mesh(sliderGeo, sliderMat);
    slider.position.set(length * 0.15, 0.105, 0);
    rheoGroup.add(slider);

    // Terminal binding posts (bakelite heads)
    const termGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 12);
    this.disposables.push(termGeo);
    const termMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 });
    this.disposables.push(termMat);

    const t1 = new THREE.Mesh(termGeo, termMat);
    t1.position.set(-length / 2, 0.11, 0.03);
    rheoGroup.add(t1);

    const t2 = new THREE.Mesh(termGeo, termMat);
    t2.position.set(length / 2, 0.11, 0.03);
    rheoGroup.add(t2);

    this.group.add(rheoGroup);
  }

  private buildDecadeResistanceBox(x: number, y: number, z: number) {
    const drbGroup = new THREE.Group();
    drbGroup.position.set(x, y, z);

    // Polished teak wooden box
    const boxGeo = new THREE.BoxGeometry(0.28, 0.09, 0.18);
    this.disposables.push(boxGeo);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // rich polished teak
      roughness: 0.35,
    });
    this.disposables.push(boxMat);

    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 0.045;
    drbGroup.add(box);

    // Top ebonite / bakelite panel with rotary dials (1Ω, 10Ω, 100Ω, 1000Ω)
    const panelGeo = new THREE.PlaneGeometry(0.26, 0.16);
    this.disposables.push(panelGeo);

    const panelCanvas = document.createElement('canvas');
    panelCanvas.width = 512;
    panelCanvas.height = 256;
    const pctx = panelCanvas.getContext('2d')!;

    pctx.fillStyle = '#0f172a'; // black ebonite panel
    pctx.fillRect(0, 0, 512, 256);

    pctx.fillStyle = '#f8fafc';
    pctx.font = 'bold 22px system-ui, sans-serif';
    pctx.textAlign = 'center';
    pctx.fillText('DECADE RESISTANCE BOX', 256, 35);

    // 4 dial markings (×1Ω, ×10Ω, ×100Ω, ×1000Ω)
    const dialLabels = ['×1 Ω', '×10 Ω', '×100 Ω', '×1000 Ω'];
    const dialX = [70, 190, 310, 430];
    dialLabels.forEach((lbl, idx) => {
      pctx.fillStyle = '#38bdf8';
      pctx.font = '16px monospace';
      pctx.fillText(lbl, dialX[idx], 190);

      // Dial circle
      pctx.strokeStyle = '#94a3b8';
      pctx.lineWidth = 2;
      pctx.beginPath();
      pctx.arc(dialX[idx], 110, 45, 0, Math.PI * 2);
      pctx.stroke();
    });

    const panelTexture = new THREE.CanvasTexture(panelCanvas);
    this.disposables.push(panelTexture);
    const panelMat = new THREE.MeshStandardMaterial({ map: panelTexture, roughness: 0.3 });
    this.disposables.push(panelMat);

    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.rotation.x = -Math.PI / 2;
    panel.position.set(0, 0.091, 0);
    drbGroup.add(panel);

    // 4 Dial knobs
    const knobGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.015, 16);
    this.disposables.push(knobGeo);
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
    this.disposables.push(knobMat);

    const kOffsets = [-0.09, -0.03, 0.03, 0.09];
    kOffsets.forEach((kx) => {
      const knob = new THREE.Mesh(knobGeo, knobMat);
      knob.position.set(kx, 0.10, -0.01);
      drbGroup.add(knob);
    });

    this.group.add(drbGroup);
  }

  private buildAnalogMeter(x: number, y: number, z: number, label: string) {
    const meterGroup = new THREE.Group();
    meterGroup.position.set(x, y, z);

    // Slanted wooden desk stand casing (typical Indian AE / Simpson / Motwane analog meter)
    const caseGeo = new THREE.BoxGeometry(0.14, 0.12, 0.14);
    this.disposables.push(caseGeo);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // polished dark mahogany wood
      roughness: 0.35,
    });
    this.disposables.push(caseMat);

    const casing = new THREE.Mesh(caseGeo, caseMat);
    casing.position.y = 0.06;
    meterGroup.add(casing);

    // Slanted meter dial glass face
    const faceGeo = new THREE.PlaneGeometry(0.12, 0.09);
    this.disposables.push(faceGeo);

    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 256;
    faceCanvas.height = 192;
    const fctx = faceCanvas.getContext('2d')!;

    fctx.fillStyle = '#f8fafc';
    fctx.fillRect(0, 0, 256, 192);

    fctx.strokeStyle = '#0f172a';
    fctx.lineWidth = 3;
    fctx.strokeRect(4, 4, 248, 184);

    // Arc scale
    fctx.beginPath();
    fctx.arc(128, 140, 95, Math.PI * 1.25, Math.PI * 1.75);
    fctx.stroke();

    // Mirror scale strip
    fctx.fillStyle = '#cbd5e1';
    fctx.fillRect(50, 90, 156, 8);

    // Red pointer needle
    fctx.strokeStyle = '#dc2626';
    fctx.lineWidth = 2.5;
    fctx.beginPath();
    fctx.moveTo(128, 140);
    fctx.lineTo(100, 50);
    fctx.stroke();

    fctx.fillStyle = '#0f172a';
    fctx.font = 'bold 15px system-ui, sans-serif';
    fctx.textAlign = 'center';
    fctx.fillText(label, 128, 170);

    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    this.disposables.push(faceTexture);
    const faceMat = new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.3 });
    this.disposables.push(faceMat);

    const face = new THREE.Mesh(faceGeo, faceMat);
    face.rotation.x = -Math.PI / 4;
    face.position.set(0, 0.085, 0.02);
    meterGroup.add(face);

    // Binding post terminals (+ Red, - Black)
    const termGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.018, 12);
    this.disposables.push(termGeo);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.6 });
    this.disposables.push(redMat, blackMat);

    const tRed = new THREE.Mesh(termGeo, redMat);
    tRed.position.set(0.04, 0.125, -0.04);
    meterGroup.add(tRed);

    const tBlack = new THREE.Mesh(termGeo, blackMat);
    tBlack.position.set(-0.04, 0.125, -0.04);
    meterGroup.add(tBlack);

    this.group.add(meterGroup);
  }

  private buildTransformer(x: number, y: number, z: number) {
    const tGroup = new THREE.Group();
    tGroup.position.set(x, y, z);

    // Iron core laminations
    const coreGeo = new THREE.BoxGeometry(0.12, 0.10, 0.08);
    this.disposables.push(coreGeo);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.8 });
    this.disposables.push(coreMat);

    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.05;
    tGroup.add(core);

    // Copper wire coil bobbin
    const coilGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.08, 16);
    this.disposables.push(coilGeo);
    const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.2 });
    this.disposables.push(coilMat);

    const coil = new THREE.Mesh(coilGeo, coilMat);
    coil.position.y = 0.05;
    tGroup.add(coil);

    this.group.add(tGroup);
  }

  private buildWireLeadRack(x: number, y: number, z: number) {
    // Wall-mounted banana patch cord hanger with hanging red, black, yellow, and blue leads
    const rackGroup = new THREE.Group();
    rackGroup.position.set(x, y, z);

    const barGeo = new THREE.BoxGeometry(0.8, 0.04, 0.06);
    this.disposables.push(barGeo);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    this.disposables.push(barMat);

    const bar = new THREE.Mesh(barGeo, barMat);
    rackGroup.add(bar);

    // Hanging flexible lead clusters
    const colors = [0xef4444, 0x18181b, 0x3b82f6, 0xeab308, 0x10b981];
    for (let i = -0.32; i <= 0.32; i += 0.06) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const leadGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.5 + Math.random() * 0.2, 8);
      this.disposables.push(leadGeo);
      const leadMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
      this.disposables.push(leadMat);

      const lead = new THREE.Mesh(leadGeo, leadMat);
      lead.position.set(i, -0.3, 0.03);
      rackGroup.add(lead);
    }

    this.group.add(rackGroup);
  }

  private buildLabWallDecor() {
    // 1. Department Safety & Protocol Chart on Back Wall
    const chartGeo = new THREE.PlaneGeometry(1.6, 1.0);
    this.disposables.push(chartGeo);

    const chartCanvas = document.createElement('canvas');
    chartCanvas.width = 1024;
    chartCanvas.height = 640;
    const cctx = chartCanvas.getContext('2d')!;

    // White chart paper with blue border
    cctx.fillStyle = '#ffffff';
    cctx.fillRect(0, 0, 1024, 640);

    cctx.strokeStyle = '#1e3a8a';
    cctx.lineWidth = 10;
    cctx.strokeRect(8, 8, 1008, 624);

    // Institutional Banner
    cctx.fillStyle = '#1e3a8a';
    cctx.fillRect(10, 10, 1004, 85);

    cctx.fillStyle = '#ffffff';
    cctx.font = 'bold 26px system-ui, sans-serif';
    cctx.textAlign = 'center';
    cctx.fillText('BITS PILANI • DEPT. OF ELECTRICAL & ELECTRONICS ENGINEERING', 512, 48);
    cctx.font = '18px system-ui, sans-serif';
    cctx.fillText('BASIC ELECTRICAL SCIENCES LABORATORY (EEE F111)', 512, 78);

    // Rules
    cctx.textAlign = 'left';
    cctx.fillStyle = '#b91c1c';
    cctx.font = 'bold 22px system-ui, sans-serif';
    cctx.fillText('LABORATORY RULES & SAFETY DIRECTIVES:', 40, 140);

    const rules = [
      '1. Verify all circuit connections with the Laboratory Instructor before turning ON main supply.',
      '2. AMMETERS must strictly be connected in SERIES. Never connect an ammeter across the supply.',
      '3. VOLTMETERS must be connected in PARALLEL across the load/resistor branch.',
      '4. Keep the main DC power supply knob set to ZERO before toggling power switches.',
      '5. In case of spark, smell of burning insulation or overload, IMMEDIATELY HIT EMERGENCY OFF.',
      '6. Maintain neat wiring using color-coded leads: RED (+) Positive, BLACK (-) Return/Common.',
    ];

    cctx.fillStyle = '#1e293b';
    cctx.font = '17px system-ui, sans-serif';
    rules.forEach((rule, idx) => {
      cctx.fillText(rule, 40, 190 + idx * 45);
    });

    cctx.fillStyle = '#64748b';
    cctx.font = 'italic 16px system-ui, sans-serif';
    cctx.fillText('Experiment No. 1: Verification of Ohm\'s Law and Temperature Dependence of Resistance', 40, 580);

    const chartTexture = new THREE.CanvasTexture(chartCanvas);
    this.disposables.push(chartTexture);
    const chartMat = new THREE.MeshStandardMaterial({ map: chartTexture, roughness: 0.4 });
    this.disposables.push(chartMat);

    const chart = new THREE.Mesh(chartGeo, chartMat);
    chart.position.set(-2.0, 2.2, -3.98);
    this.group.add(chart);

    // 2. Large Central Laboratory Green Chalkboard on Back Wall
    this.buildLaboratoryBlackboard(1.6, 2.2, -3.98);
  }

  private buildLaboratoryBlackboard(x: number, y: number, z: number) {
    const boardGeo = new THREE.PlaneGeometry(2.8, 1.4);
    this.disposables.push(boardGeo);

    const boardCanvas = document.createElement('canvas');
    boardCanvas.width = 1024;
    boardCanvas.height = 512;
    const ctx = boardCanvas.getContext('2d')!;

    // Institutional Matte Dark Green chalkboard
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 1024, 512);

    // Wooden teak frame
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 1010, 498);

    // Chalk writings
    ctx.fillStyle = '#fef08a'; // yellow chalk header
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText("EXPERIMENT 1: VERIFICATION OF OHM'S LAW", 40, 55);

    ctx.fillStyle = '#ffffff'; // white chalk
    ctx.font = '20px serif';
    ctx.fillText("Statement: At constant temperature, the current (I) flowing through a conductor", 40, 100);
    ctx.fillText("is directly proportional to the potential difference (V) applied across its ends.", 40, 130);

    ctx.fillStyle = '#38bdf8'; // light blue chalk equation
    ctx.font = 'bold 24px monospace';
    ctx.fillText("V ∝ I   ⇒   V = I × R   ⇒   I = V / R", 40, 185);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText("Where:  V = Potential Difference (Volts)", 40, 230);
    ctx.fillText("        I = Current (Amperes / Milliamperes)", 40, 260);
    ctx.fillText("        R = Resistance of the specimen (Ohms, Ω)", 40, 290);

    // Small chalk circuit diagram sketch
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(550, 310, 140, 70); // Resistor block
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText("Specimen R", 575, 350);

    ctx.fillStyle = '#fef08a';
    ctx.fillText("Slope of V-I Graph = ΔV / ΔI = R (Ω)", 40, 450);

    const boardTexture = new THREE.CanvasTexture(boardCanvas);
    this.disposables.push(boardTexture);
    const boardMat = new THREE.MeshStandardMaterial({ map: boardTexture, roughness: 0.6 });
    this.disposables.push(boardMat);

    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(x, y, z);
    this.group.add(board);
  }

  private buildCeilingFans() {
    // Classic 3-blade white/brown Indian ceiling fans (Crompton / Usha style)
    const fanPositions: [number, number][] = [
      [-2.0, -1.0],
      [2.0, -1.0],
      [0.0, 1.2],
    ];

    const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.8, 12);
    this.disposables.push(rodGeo);
    const motorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24);
    this.disposables.push(motorGeo);
    const fanMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.4 }); // classic dark brown/bronze
    this.disposables.push(fanMat);

    fanPositions.forEach(([fx, fz]) => {
      const fanGroup = new THREE.Group();
      fanGroup.position.set(fx, 3.6, fz);

      // Downrod
      const rod = new THREE.Mesh(rodGeo, fanMat);
      rod.position.y = -0.4;
      fanGroup.add(rod);

      // Motor hub
      const motor = new THREE.Mesh(motorGeo, fanMat);
      motor.position.y = -0.8;
      fanGroup.add(motor);

      // 3 Blades at 120°
      for (let b = 0; b < 3; b++) {
        const bladeGeo = new THREE.BoxGeometry(0.12, 0.005, 0.6);
        this.disposables.push(bladeGeo);
        const blade = new THREE.Mesh(bladeGeo, fanMat);
        blade.rotation.y = (b * Math.PI * 2) / 3;
        blade.position.set(
          Math.sin((b * Math.PI * 2) / 3) * 0.35,
          -0.8,
          Math.cos((b * Math.PI * 2) / 3) * 0.35
        );
        fanGroup.add(blade);
      }

      this.group.add(fanGroup);
    });
  }

  public dispose() {
    this.disposables.forEach((item) => {
      if ('dispose' in item) {
        item.dispose();
      }
    });
  }
}
