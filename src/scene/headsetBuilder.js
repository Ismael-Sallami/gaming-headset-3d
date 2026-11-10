import * as THREE from 'three';

/**
 * Constructor CAD paramétrico del casco gaming flagship "AETHER NOVA PRO".
 *
 * Convención espacial del ensamblaje:
 * - Origen (0, 0, 0) en el centro geométrico entre ambas copas y bajo el arco de la diadema.
 * - Eje X: eje acústico transversal (Copa Izquierda en X < 0, side = -1; Copa Derecha en X > 0, side = +1).
 * - Todas las geometrías de revolución y cilindros de las copas se orientan de modo que su eje axial
 *   coincida con el eje X local, y se escalan ligeramente en Z (0.86) e Y (1.06) para lograr el perfil
 *   circumaural ovalado ergonómico propio de transductores Planar Magnetic de 90mm.
 */

const OVAL_SCALE_Y = 1.06;
const OVAL_SCALE_Z = 0.86;

/**
 * Orienta una geometría cuyo eje de simetría nativo es Y (CylinderGeometry, LatheGeometry)
 * o Z (TorusGeometry, ExtrudeGeometry, RingGeometry) para que su eje apunte en la dirección +X,
 * aplicando además el factor de forma elíptico circumaural en el plano YZ.
 *
 * @param {THREE.BufferGeometry} geometry Geometría a transformar in-place.
 * @param {'Y' | 'Z'} nativeAxis Eje axial original de la primitiva.
 * @param {boolean} applyOval Si es true, aplica la relación de aspecto ovalada (Y=1.06, Z=0.86).
 * @returns {THREE.BufferGeometry}
 */
function alignToAcousticAxisX(geometry, nativeAxis = 'Y', applyOval = true) {
  if (nativeAxis === 'Y') {
    geometry.rotateZ(-Math.PI / 2);
  } else if (nativeAxis === 'Z') {
    geometry.rotateY(Math.PI / 2);
  }
  if (applyOval) {
    geometry.scale(1.0, OVAL_SCALE_Y, OVAL_SCALE_Z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Construye una almohadilla circumaural viscoelástica con perfil ergonómico biselado.
 */
function createEarpadMesh(materials) {
  const group = new THREE.Group();

  // Cuerpo principal de espuma con memoria recubierta en cuero microperforado
  const padGeo = new THREE.TorusGeometry(0.95, 0.27, 36, 72);
  alignToAcousticAxisX(padGeo, 'Z', true);
  // Aplanamos ligeramente en X para que el contacto con el cráneo y el baffle sea plano
  padGeo.scale(0.82, 1.0, 1.0);
  const padMesh = new THREE.Mesh(padGeo, materials.memoryFoamLeather);
  padMesh.castShadow = true;
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // Falda de sellado acústico trasero (labio de acoplamiento al anillo de bayoneta)
  const lipGeo = new THREE.CylinderGeometry(1.18, 1.21, 0.12, 64, 1, true);
  alignToAcousticAxisX(lipGeo, 'Y', true);
  const lipMesh = new THREE.Mesh(lipGeo, materials.memoryFoamLeather);
  group.add(lipMesh);

  // Costura interna y malla protectora antipolvo
  const innerScreenGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.015, 48);
  alignToAcousticAxisX(innerScreenGeo, 'Y', true);
  const innerScreen = new THREE.Mesh(innerScreenGeo, materials.dampingFoam);
  group.add(innerScreen);

  return group;
}

/**
 * Construye el anillo interior de gel refrigerante con micro-cápsulas de cambio de fase.
 */
function createCoolingGelMesh(materials) {
  const group = new THREE.Group();

  const gelGeo = new THREE.TorusGeometry(0.93, 0.14, 28, 64);
  alignToAcousticAxisX(gelGeo, 'Z', true);
  gelGeo.scale(0.45, 1.0, 1.0);
  const gelMesh = new THREE.Mesh(gelGeo, materials.coolingGelLayer);
  group.add(gelMesh);

  // Canales térmicos hex-grid grabados sobre el gel
  const ringGeo = new THREE.TorusGeometry(0.94, 0.018, 12, 64);
  alignToAcousticAxisX(ringGeo, 'Z', true);
  const ringMesh = new THREE.Mesh(ringGeo, materials.rgbEmissiveCyan);
  group.add(ringMesh);

  return group;
}

/**
 * Construye el anillo magnético de liberación rápida con pestañas de bayoneta y 8 imanes N52.
 */
function createBayonetRingMesh(materials) {
  const group = new THREE.Group();

  const ringGeo = new THREE.TorusGeometry(1.08, 0.055, 20, 64);
  alignToAcousticAxisX(ringGeo, 'Z', true);
  group.add(new THREE.Mesh(ringGeo, materials.cncAluminum));

  // 8 alojamientos cilíndricos con imanes de neodimio y pines guía
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const y = Math.cos(angle) * 1.08 * OVAL_SCALE_Y;
    const z = Math.sin(angle) * 1.08 * OVAL_SCALE_Z;

    const lugGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.08, 16);
    lugGeo.rotateZ(-Math.PI / 2);
    const lug = new THREE.Mesh(lugGeo, materials.titaniumBrushed);
    lug.position.set(0, y, z);
    group.add(lug);

    const magGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.09, 16);
    magGeo.rotateZ(-Math.PI / 2);
    const mag = new THREE.Mesh(magGeo, materials.neodymiumMagnet);
    mag.position.set(0, y, z);
    group.add(mag);
  }

  return group;
}

/**
 * Construye la placa deflectora acústica (Baffle) con puertos de alivio de graves
 * y cápsula de micrófono MEMS para cancelación activa de ruido (Feedforward/Feedback ANC).
 */
function createAcousticBaffleMesh(materials) {
  const group = new THREE.Group();

  // Chasis perimetral del deflector
  const rimGeo = new THREE.TorusGeometry(1.12, 0.075, 24, 64);
  alignToAcousticAxisX(rimGeo, 'Z', true);
  group.add(new THREE.Mesh(rimGeo, materials.cncAluminum));

  // Placa base perforada
  const plateGeo = new THREE.CylinderGeometry(1.08, 1.08, 0.045, 64);
  alignToAcousticAxisX(plateGeo, 'Y', true);
  group.add(new THREE.Mesh(plateGeo, materials.acousticGrille));

  // Cápsula del micrófono MEMS de referencia ANC en cámara frontal
  const memsHousingGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.08, 24);
  memsHousingGeo.rotateZ(-Math.PI / 2);
  const memsHousing = new THREE.Mesh(memsHousingGeo, materials.copperVoiceCoil);
  memsHousing.position.set(0, 0.68, 0.35);
  group.add(memsHousing);

  const memsCapGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.09, 20);
  memsCapGeo.rotateZ(-Math.PI / 2);
  const memsCap = new THREE.Mesh(memsCapGeo, materials.goldContacts);
  memsCap.position.set(0, 0.68, 0.35);
  group.add(memsCap);

  // 6 tornillos Torx perimetrales de fijación al chasis
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const screwGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.07, 12);
    screwGeo.rotateZ(-Math.PI / 2);
    const screw = new THREE.Mesh(screwGeo, materials.titaniumBrushed);
    screw.position.set(0, Math.cos(ang) * 1.04 * OVAL_SCALE_Y, Math.sin(ang) * 1.04 * OVAL_SCALE_Z);
    group.add(screw);
  }

  return group;
}

/**
 * Construye la guía de ondas acústicas Fazor de 9 barras de sección triangular aerodinámica
 * que elimina la difracción de alta frecuencia a la salida del conjunto magnético.
 */
function createFazorWaveguideMesh(materials) {
  const group = new THREE.Group();

  const frameGeo = new THREE.TorusGeometry(0.92, 0.045, 20, 64);
  alignToAcousticAxisX(frameGeo, 'Z', true);
  group.add(new THREE.Mesh(frameGeo, materials.titaniumBrushed));

  // 9 barras difusoras Fazor con sección prisma-triangular
  const barCount = 9;
  for (let i = 0; i < barCount; i++) {
    const normZ = (i - (barCount - 1) / 2) / ((barCount - 1) / 2); // [-1, 1]
    const zPos = normZ * 0.66;
    const chordHeight = Math.sqrt(Math.max(0.05, 1.0 - normZ * normZ * 0.85)) * 1.68;

    const barGeo = new THREE.CylinderGeometry(0.032, 0.032, chordHeight, 3);
    const barMesh = new THREE.Mesh(barGeo, materials.titaniumBrushed);
    barMesh.position.set(0, 0, zPos);
    group.add(barMesh);
  }

  return group;
}

/**
 * Construye una matriz magnética Fluxor de Neodimio N50 (frontal o trasera) con polos alternados
 * en configuración Halbach a 45° para concentrar un flujo de 1.5 Tesla sobre el diafragma.
 */
function createFluxorMagnetArrayMesh(materials) {
  const group = new THREE.Group();

  // Yugo anular de acero magnético sinterizado
  const yokeGeo = new THREE.TorusGeometry(0.95, 0.055, 20, 64);
  alignToAcousticAxisX(yokeGeo, 'Z', true);
  group.add(new THREE.Mesh(yokeGeo, materials.cncAluminum));

  // Barras de imanes de Neodimio N50 niquelado
  const magnetBars = 7;
  for (let i = 0; i < magnetBars; i++) {
    const normZ = (i - (magnetBars - 1) / 2) / ((magnetBars - 1) / 2);
    const zPos = normZ * 0.62;
    const lengthY = Math.sqrt(Math.max(0.08, 1.0 - normZ * normZ * 0.82)) * 1.65;

    const magGeo = new THREE.BoxGeometry(0.055, lengthY, 0.068);
    const magMesh = new THREE.Mesh(magGeo, materials.neodymiumMagnet);
    magMesh.position.set(0, 0, zPos);
    group.add(magMesh);
  }

  // Terminales colectores de cobre de alta pureza
  const tabGeo = new THREE.BoxGeometry(0.07, 0.22, 0.08);
  const tabTop = new THREE.Mesh(tabGeo, materials.copperVoiceCoil);
  tabTop.position.set(0, 0.96, 0);
  group.add(tabTop);

  return group;
}

/**
 * Construye el núcleo del transductor Planar Magnetic de 90mm:
 * Película polimérica Uniforce ultra-delgada con trazas en espiral y anillo de tensión CCAW.
 */
function createPlanarDiaphragmMesh(materials) {
  const group = new THREE.Group();

  // Película activa Uniforce (iridiscente con trazas de aluminio/oro)
  const filmGeo = new THREE.CylinderGeometry(0.91, 0.91, 0.008, 64);
  alignToAcousticAxisX(filmGeo, 'Y', true);
  const filmMesh = new THREE.Mesh(filmGeo, materials.planarDiaphragm);
  group.add(filmMesh);

  // Anillo tensor perimetral de cobre/aluminio CCAW mecanizado
  const tensionRingGeo = new THREE.TorusGeometry(0.93, 0.05, 24, 64);
  alignToAcousticAxisX(tensionRingGeo, 'Z', true);
  const tensionRing = new THREE.Mesh(tensionRingGeo, materials.copperVoiceCoil);
  group.add(tensionRing);

  // 12 remaches de calibración de tensión uniforme en micras
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 12);
    pinGeo.rotateZ(-Math.PI / 2);
    const pin = new THREE.Mesh(pinGeo, materials.goldContacts);
    pin.position.set(0, Math.cos(ang) * 0.93 * OVAL_SCALE_Y, Math.sin(ang) * 0.93 * OVAL_SCALE_Z);
    group.add(pin);
  }

  return group;
}

/**
 * Construye el anillo amortiguador acústico posterior de espuma microporosa calibrada.
 */
function createAcousticDampingRingMesh(materials) {
  const group = new THREE.Group();

  const foamGeo = new THREE.TorusGeometry(0.88, 0.095, 24, 64);
  alignToAcousticAxisX(foamGeo, 'Z', true);
  foamGeo.scale(0.65, 1.0, 1.0);
  group.add(new THREE.Mesh(foamGeo, materials.dampingFoam));

  // Malla central de impedancia acústica controlada
  const centerFeltGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.025, 48);
  alignToAcousticAxisX(centerFeltGeo, 'Y', true);
  group.add(new THREE.Mesh(centerFeltGeo, materials.acousticGrille));

  return group;
}

/**
 * Construye la cámara acústica trasera sellada de policarbonato óptico ahumado
 * con nervaduras radiales anti-resonancia de Helmholtz.
 */
function createPolycarbonateChamberMesh(materials, side) {
  const group = new THREE.Group();

  // Cúpula torneada mediante LatheGeometry
  const points = [
    new THREE.Vector2(0.32, 0.18),
    new THREE.Vector2(0.85, 0.18),
    new THREE.Vector2(1.06, 0.08),
    new THREE.Vector2(1.12, -0.06),
    new THREE.Vector2(1.12, -0.18),
    new THREE.Vector2(1.04, -0.18),
    new THREE.Vector2(0.98, 0.04),
    new THREE.Vector2(0.32, 0.12)
  ];
  const latheGeo = new THREE.LatheGeometry(points, 64);
  alignToAcousticAxisX(latheGeo, 'Y', true);
  if (side < 0) {
    latheGeo.scale(-1, 1, 1);
    latheGeo.computeVertexNormals();
  }
  const domeMesh = new THREE.Mesh(latheGeo, materials.polycarbonateChamber);
  group.add(domeMesh);

  // 6 nervaduras estructurales de rigidez modal
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const ribGeo = new THREE.BoxGeometry(0.14, 0.03, 0.65);
    const rib = new THREE.Mesh(ribGeo, materials.titaniumBrushed);
    rib.rotation.x = ang;
    rib.position.set(side * 0.04, Math.sin(ang) * 0.62, Math.cos(ang) * 0.62);
    group.add(rib);
  }

  return group;
}

/**
 * Construye la placa base electrónica principal de la Copa Izquierda (DSP Quad-Core 24-bit/96kHz,
 * coprocesador neuronal ANC y transceptor inalámbrico Dual-Wireless 2.4GHz + Bluetooth 5.3).
 */
function createLeftDspPcbMesh(materials) {
  const group = new THREE.Group();

  // Sustrato multicapa FR-4 negro con trazas doradas ENIG
  const boardGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.045, 64);
  alignToAcousticAxisX(boardGeo, 'Y', true);
  group.add(new THREE.Mesh(boardGeo, materials.pcbSubstrate));

  // SoC Principal AETHER NOVA DSP (encapsulado QFN con marco dorado)
  const dspFrameGeo = new THREE.BoxGeometry(0.055, 0.42, 0.42);
  const dspFrame = new THREE.Mesh(dspFrameGeo, materials.goldContacts);
  dspFrame.position.set(-0.02, 0.08, 0);
  group.add(dspFrame);

  const dspDieGeo = new THREE.BoxGeometry(0.075, 0.36, 0.36);
  const dspDie = new THREE.Mesh(dspDieGeo, materials.siliconChip);
  dspDie.position.set(-0.03, 0.08, 0);
  group.add(dspDie);

  // Indicador óptico de telemetría sobre el DSP
  const dspLedGeo = new THREE.BoxGeometry(0.085, 0.08, 0.24);
  const dspLed = new THREE.Mesh(dspLedGeo, materials.rgbEmissiveCyan);
  dspLed.position.set(-0.035, 0.08, 0);
  group.add(dspLed);

  // Coprocesador AI ANC y DAC dedicado ESS Sabre
  const ancChipGeo = new THREE.BoxGeometry(0.065, 0.24, 0.28);
  const ancChip = new THREE.Mesh(ancChipGeo, materials.siliconChip);
  ancChip.position.set(-0.025, -0.42, 0.22);
  group.add(ancChip);

  const rfShieldGeo = new THREE.BoxGeometry(0.07, 0.32, 0.22);
  const rfShield = new THREE.Mesh(rfShieldGeo, materials.titaniumBrushed);
  rfShield.position.set(-0.025, -0.38, -0.24);
  group.add(rfShield);

  // Banco de condensadores de tantalio de grado audiófilo y oscilador de cristal
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const capGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.08, 16);
    capGeo.rotateZ(-Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, i % 2 === 0 ? materials.goldContacts : materials.copperVoiceCoil);
    cap.position.set(-0.03, Math.cos(ang) * 0.68 * OVAL_SCALE_Y, Math.sin(ang) * 0.68 * OVAL_SCALE_Z);
    group.add(cap);
  }

  return group;
}

/**
 * Construye el módulo de controles físicos e I/O de la Copa Izquierda:
 * Rueda de volumen moleteada con codificador óptico, puerto USB-C y conector de micrófono.
 */
function createLeftIoControlsMesh(materials) {
  const group = new THREE.Group();

  // Bracket curvo de soporte I/O
  const bracketGeo = new THREE.BoxGeometry(0.14, 0.72, 0.26);
  const bracket = new THREE.Mesh(bracketGeo, materials.cncAluminum);
  bracket.position.set(0, -0.78, -0.35);
  bracket.rotation.x = 0.42;
  group.add(bracket);

  // Rueda de volumen moleteada (Knurled Aluminum Wheel)
  const wheelGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 32);
  const wheel = new THREE.Mesh(wheelGeo, materials.titaniumBrushed);
  wheel.position.set(-0.02, -0.68, -0.52);
  wheel.rotation.z = Math.PI / 2;
  group.add(wheel);

  // Anillo luminoso en el eje de la rueda
  const wheelRingGeo = new THREE.CylinderGeometry(0.165, 0.165, 0.025, 32);
  const wheelRing = new THREE.Mesh(wheelRingGeo, materials.rgbEmissiveCyan);
  wheelRing.position.set(-0.02, -0.68, -0.52);
  wheelRing.rotation.z = Math.PI / 2;
  group.add(wheelRing);

  // Puerto USB-C chapado en oro y botón multifunción ANC
  const usbcGeo = new THREE.BoxGeometry(0.09, 0.06, 0.14);
  const usbc = new THREE.Mesh(usbcGeo, materials.goldContacts);
  usbc.position.set(-0.02, -0.98, -0.18);
  group.add(usbc);

  return group;
}

/**
 * Construye la placa reguladora de potencia y matriz de Pogo Pins chapados en oro (Copa Derecha)
 * para el sistema de cambio de batería en caliente (Zero-Downtime Hot-Swap).
 */
function createRightPowerBoardMesh(materials) {
  const group = new THREE.Group();

  const boardGeo = new THREE.CylinderGeometry(0.90, 0.90, 0.045, 64);
  alignToAcousticAxisX(boardGeo, 'Y', true);
  group.add(new THREE.Mesh(boardGeo, materials.pcbSubstrate));

  // Bahía receptora del cartucho de batería y bloque de 6 Pogo Pins de oro 24k
  const cradleGeo = new THREE.BoxGeometry(0.08, 0.92, 0.58);
  const cradle = new THREE.Mesh(cradleGeo, materials.cncAluminum);
  cradle.position.set(0.03, 0, 0);
  group.add(cradle);

  for (let i = 0; i < 6; i++) {
    const pinGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.12, 16);
    pinGeo.rotateZ(-Math.PI / 2);
    const pin = new THREE.Mesh(pinGeo, materials.goldContacts);
    pin.position.set(0.06, 0.34, -0.18 + i * 0.072);
    group.add(pin);
  }

  // Bobina inductora toroidal del convertidor DC-DC y supercondensador puente
  const inductorGeo = new THREE.TorusGeometry(0.16, 0.055, 16, 32);
  alignToAcousticAxisX(inductorGeo, 'Z', false);
  const inductor = new THREE.Mesh(inductorGeo, materials.copperVoiceCoil);
  inductor.position.set(0.04, -0.62, 0);
  group.add(inductor);

  return group;
}

/**
 * Construye el cartucho de batería de Iones de Litio extraíble (Hot-Swap Battery Pack)
 * alojado en la Copa Derecha, con asa ergonómica de extracción y barra de estado LED Ámbar.
 */
function createHotSwapBatteryMesh(materials) {
  const group = new THREE.Group();

  // Cuerpo blindado de la celda Li-Ion de alta densidad (3.85V / 1500mAh)
  const cellGeo = new THREE.BoxGeometry(0.22, 0.84, 0.50);
  const cell = new THREE.Mesh(cellGeo, materials.cncAluminum);
  group.add(cell);

  // Envoltura metálica secundaria con grabado técnico
  const sleeveGeo = new THREE.BoxGeometry(0.23, 0.64, 0.51);
  const sleeve = new THREE.Mesh(sleeveGeo, materials.titaniumBrushed);
  group.add(sleeve);

  // Indicador LED de carga en ámbar de laboratorio
  const ledStripGeo = new THREE.BoxGeometry(0.24, 0.44, 0.045);
  const ledStrip = new THREE.Mesh(ledStripGeo, materials.rgbEmissiveAmber);
  ledStrip.position.set(0.01, 0, 0.18);
  group.add(ledStrip);

  // Contactos de oro en la cara interna del cartucho
  const padGeo = new THREE.BoxGeometry(0.02, 0.14, 0.38);
  const pad = new THREE.Mesh(padGeo, materials.goldContacts);
  pad.position.set(-0.115, 0.28, 0);
  group.add(pad);

  // Asa abatible de extracción rápida en titanio
  const handleGeo = new THREE.TorusGeometry(0.14, 0.022, 12, 32, Math.PI);
  handleGeo.rotateY(Math.PI / 2);
  const handle = new THREE.Mesh(handleGeo, materials.titaniumBrushed);
  handle.position.set(0.11, 0, 0);
  group.add(handle);

  return group;
}

/**
 * Construye la carcasa exterior monobloque de aluminio CNC serie 7000 con bisel diamantado.
 */
function createOuterShellMesh(materials, side) {
  const group = new THREE.Group();

  // Perfil exterior de revolución CNC con escalón para el anillo RGB y bahía magnética
  const points = [
    new THREE.Vector2(0.86, 0.22),
    new THREE.Vector2(1.04, 0.22),
    new THREE.Vector2(1.14, 0.12),
    new THREE.Vector2(1.18, -0.08),
    new THREE.Vector2(1.16, -0.22),
    new THREE.Vector2(1.08, -0.22),
    new THREE.Vector2(1.08, 0.05),
    new THREE.Vector2(0.86, 0.15)
  ];

  const shellGeo = new THREE.LatheGeometry(points, 72);
  alignToAcousticAxisX(shellGeo, 'Y', true);
  if (side < 0) {
    shellGeo.scale(-1, 1, 1);
    shellGeo.computeVertexNormals();
  }

  const shellMesh = new THREE.Mesh(shellGeo, materials.cncAluminum);
  shellMesh.castShadow = true;
  shellMesh.receiveShadow = true;
  group.add(shellMesh);

  // Rejilla de descompresión barométrica perimetral
  const ventRingGeo = new THREE.TorusGeometry(1.09, 0.022, 16, 64);
  alignToAcousticAxisX(ventRingGeo, 'Z', true);
  const ventRing = new THREE.Mesh(ventRingGeo, materials.titaniumBrushed);
  ventRing.position.set(side * 0.12, 0, 0);
  group.add(ventRing);

  return group;
}

/**
 * Construye el anillo difusor LED RGB direccionable de 36 zonas integrado en el bisel de la copa.
 */
function createRgbRingMesh(materials) {
  const group = new THREE.Group();

  const ringGeo = new THREE.TorusGeometry(0.95, 0.028, 20, 72);
  alignToAcousticAxisX(ringGeo, 'Z', true);
  const ringMesh = new THREE.Mesh(ringGeo, materials.rgbEmissiveCyan);
  group.add(ringMesh);

  return group;
}

/**
 * Construye la tapa exterior magnética intercambiable (Faceplate) con bisel de titanio,
 * núcleo acústico micro-perforado y acento lumínico central.
 */
function createMagneticFaceplateMesh(materials, side) {
  const group = new THREE.Group();

  // Disco principal de aluminio anodizado con bisel concéntrico
  const plateGeo = new THREE.CylinderGeometry(0.89, 0.93, 0.055, 64);
  alignToAcousticAxisX(plateGeo, 'Y', true);
  const plateMesh = new THREE.Mesh(plateGeo, materials.cncAluminum);
  plateMesh.castShadow = true;
  group.add(plateMesh);

  // Inserto central con textura de malla hexagonal acústica
  const insertGeo = new THREE.CylinderGeometry(0.74, 0.74, 0.062, 64);
  alignToAcousticAxisX(insertGeo, 'Y', true);
  const insertMesh = new THREE.Mesh(insertGeo, materials.acousticGrille);
  group.add(insertMesh);

  // Emblema orbital de titanio y núcleo emisivo AETHER NOVA
  const emblemRingGeo = new THREE.TorusGeometry(0.28, 0.022, 16, 48);
  alignToAcousticAxisX(emblemRingGeo, 'Z', true);
  const emblemRing = new THREE.Mesh(emblemRingGeo, materials.titaniumBrushed);
  emblemRing.position.set(side * 0.032, 0, 0);
  group.add(emblemRing);

  const coreGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.068, 6);
  alignToAcousticAxisX(coreGeo, 'Y', false);
  const coreMesh = new THREE.Mesh(coreGeo, materials.rgbEmissiveCyan);
  coreMesh.position.set(side * 0.005, 0, 0);
  group.add(coreMesh);

  // 4 pines magnéticos internos de anclaje rápido a la carcasa
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const pinGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.08, 16);
    pinGeo.rotateZ(-Math.PI / 2);
    const pin = new THREE.Mesh(pinGeo, materials.neodymiumMagnet);
    pin.position.set(
      -side * 0.04,
      Math.cos(ang) * 0.78 * OVAL_SCALE_Y,
      Math.sin(ang) * 0.78 * OVAL_SCALE_Z
    );
    group.add(pin);
  }

  return group;
}

/**
 * Construye la horquilla cardán de 2 ejes (Yoke) en titanio cepillado CNC que abraza cada copa
 * y permite giro horizontal e inclinación vertical libre de fricción.
 */
function createTitaniumYokeMesh(materials, side) {
  const group = new THREE.Group();

  // Articulación cilíndrica superior (bisagra de rotación con retenes mecánicos)
  const hingeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.36, 28);
  hingeGeo.rotateZ(side * 0.22);
  const hingeMesh = new THREE.Mesh(hingeGeo, materials.titaniumBrushed);
  hingeMesh.position.set(-side * 0.06, 1.36, 0);
  group.add(hingeMesh);

  // Anillo de telemetría en la junta de la bisagra
  const collarGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.03, 28);
  collarGeo.rotateZ(side * 0.22);
  const collarMesh = new THREE.Mesh(collarGeo, materials.rgbEmissiveCyan);
  collarMesh.position.set(-side * 0.06, 1.36, 0);
  group.add(collarMesh);

  // Brazos gemelos de la horquilla (delantero y trasero) mediante TubeGeometry
  [-1, 1].forEach((zDir) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-side * 0.05, 1.22, 0),
      new THREE.Vector3(side * 0.06, 1.06, zDir * 0.56),
      new THREE.Vector3(side * 0.14, 0.52, zDir * 0.94),
      new THREE.Vector3(side * 0.10, 0.0, zDir * 0.99)
    ]);
    const armGeo = new THREE.TubeGeometry(curve, 36, 0.048, 16, false);
    const armMesh = new THREE.Mesh(armGeo, materials.titaniumBrushed);
    armMesh.castShadow = true;
    group.add(armMesh);

    // Pernos de pivote axiales que entran en el chasis de la copa
    const pivotGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.14, 20);
    pivotGeo.rotateZ(-Math.PI / 2);
    const pivot = new THREE.Mesh(pivotGeo, materials.cncAluminum);
    pivot.position.set(side * 0.06, 0.0, zDir * 0.99);
    group.add(pivot);

    const capGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.15, 16);
    capGeo.rotateZ(-Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, materials.goldContacts);
    cap.position.set(side * 0.06, 0.0, zDir * 0.99);
    group.add(cap);
  });

  return group;
}

/**
 * Construye el arco estructural superior de acero para muelles con recubrimiento PVD negro
 * y recortes geométricos de aligeramiento.
 */
function createSpringSteelHeadbandMesh(materials) {
  const group = new THREE.Group();

  const curvePoints = [];
  const numPts = 48;
  for (let i = 0; i <= numPts; i++) {
    const t = (i / numPts) * 2 - 1; // [-1, 1]
    const angle = t * 1.18; // Arco de ~135 grados totales
    const x = Math.sin(angle) * 1.88;
    const y = Math.cos(angle) * 1.62 + 0.34;
    curvePoints.push(new THREE.Vector3(x, y, 0));
  }
  const archCurve = new THREE.CatmullRomCurve3(curvePoints);

  // Rieles gemelos de acero PVD que conforman los bordes del arco aligerado
  [-0.14, 0.14].forEach((zOffset) => {
    const railPoints = curvePoints.map((p) => new THREE.Vector3(p.x, p.y, zOffset));
    const railCurve = new THREE.CatmullRomCurve3(railPoints);
    const railGeo = new THREE.TubeGeometry(railCurve, 64, 0.032, 14, false);
    const railMesh = new THREE.Mesh(railGeo, materials.springSteelPVD);
    railMesh.castShadow = true;
    group.add(railMesh);
  });

  // Travesaños estructurales de unión tipo celosía aeroespacial
  for (let i = 3; i <= numPts - 3; i += 4) {
    const pt = archCurve.getPoint(i / numPts);
    const tangent = archCurve.getTangent(i / numPts);
    const strutGeo = new THREE.BoxGeometry(0.06, 0.025, 0.28);
    const strut = new THREE.Mesh(strutGeo, materials.springSteelPVD);
    strut.position.copy(pt);
    strut.rotation.z = Math.atan2(tangent.y, tangent.x);
    group.add(strut);
  }

  // Terminales inferiores de bloqueo de cremallera en ambos extremos
  [-1, 1].forEach((side) => {
    const endCapGeo = new THREE.BoxGeometry(0.16, 0.32, 0.34);
    const endCap = new THREE.Mesh(endCapGeo, materials.cncAluminum);
    endCap.position.set(side * 1.74, 0.96, 0);
    endCap.rotation.z = -side * 0.42;
    group.add(endCap);
  });

  return group;
}

/**
 * Construye el acolchado superior del arco y el arnés de cableado interno trenzado.
 */
function createHeadbandCushionMesh(materials) {
  const group = new THREE.Group();

  const curvePoints = [];
  const numPts = 36;
  for (let i = 0; i <= numPts; i++) {
    const t = (i / numPts) * 2 - 1;
    const angle = t * 0.78;
    const x = Math.sin(angle) * 1.82;
    const y = Math.cos(angle) * 1.56 + 0.34;
    curvePoints.push(new THREE.Vector3(x, y, 0));
  }
  const padCurve = new THREE.CatmullRomCurve3(curvePoints);
  const padGeo = new THREE.TubeGeometry(padCurve, 48, 0.065, 20, false);
  padGeo.scale(1.0, 0.65, 1.85);
  const padMesh = new THREE.Mesh(padGeo, materials.memoryFoamLeather);
  group.add(padMesh);

  return group;
}

/**
 * Construye la banda de suspensión elástica tipo Ski-Goggle que distribuye el peso sin puntos de presión.
 */
function createSuspensionStrapMesh(materials) {
  const group = new THREE.Group();

  const strapPoints = [];
  const numPts = 40;
  for (let i = 0; i <= numPts; i++) {
    const t = (i / numPts) * 2 - 1;
    const angle = t * 0.96;
    const x = Math.sin(angle) * 1.72;
    // Curva catenaria invertida ligeramente más plana que el arco de acero superior
    const y = Math.cos(angle) * 1.28 + 0.40;
    strapPoints.push(new THREE.Vector3(x, y, 0));
  }
  const strapCurve = new THREE.CatmullRomCurve3(strapPoints);
  const strapGeo = new THREE.TubeGeometry(strapCurve, 56, 0.035, 16, false);
  strapGeo.scale(1.0, 0.35, 3.8);
  const strapMesh = new THREE.Mesh(strapGeo, materials.memoryFoamLeather);
  strapMesh.castShadow = true;
  group.add(strapMesh);

  // Hebillas tensoras de titanio en los anclajes laterales
  [-1, 1].forEach((side) => {
    const buckleGeo = new THREE.BoxGeometry(0.08, 0.18, 0.32);
    const buckle = new THREE.Mesh(buckleGeo, materials.titaniumBrushed);
    buckle.position.set(side * 1.42, 1.12, 0);
    buckle.rotation.z = -side * 0.65;
    group.add(buckle);
  });

  return group;
}

/**
 * Construye el brazo flexible del micrófono Boom Cardioide desmontable (Gooseneck)
 * con conector magnético propietario y cápsula direccional ranurada.
 */
function createBoomMicArmMesh(materials) {
  const group = new THREE.Group();

  // Conector base que se inserta en la Copa Izquierda
  const plugBodyGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.24, 24);
  plugBodyGeo.rotateX(Math.PI / 2);
  const plugBody = new THREE.Mesh(plugBodyGeo, materials.cncAluminum);
  plugBody.position.set(-1.62, -1.08, 0.52);
  group.add(plugBody);

  // Brazo cuello de cisne metálico segmentado
  const micCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.62, -1.08, 0.62),
    new THREE.Vector3(-1.52, -1.16, 1.15),
    new THREE.Vector3(-1.18, -1.12, 1.62),
    new THREE.Vector3(-0.74, -0.96, 1.84)
  ]);
  const armGeo = new THREE.TubeGeometry(micCurve, 48, 0.036, 16, false);
  const armMesh = new THREE.Mesh(armGeo, materials.titaniumBrushed);
  armMesh.castShadow = true;
  group.add(armMesh);

  // Anillos mecánicos del cuello de cisne
  for (let i = 4; i < 40; i += 4) {
    const pt = micCurve.getPoint(i / 44);
    const ringGeo = new THREE.TorusGeometry(0.04, 0.008, 8, 20);
    const ring = new THREE.Mesh(ringGeo, materials.cncAluminum);
    ring.position.copy(pt);
    group.add(ring);
  }

  // Cápsula condensadora cardioide y anillo LED de estado Mute/Active
  const capsuleGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.24, 24);
  capsuleGeo.rotateZ(Math.PI / 3);
  capsuleGeo.rotateY(-0.4);
  const capsule = new THREE.Mesh(capsuleGeo, materials.cncAluminum);
  capsule.position.set(-0.68, -0.92, 1.88);
  group.add(capsule);

  const tallyLedGeo = new THREE.TorusGeometry(0.082, 0.014, 12, 32);
  tallyLedGeo.rotateY(0.6);
  const tallyLed = new THREE.Mesh(tallyLedGeo, materials.rgbEmissiveCyan);
  tallyLed.position.set(-0.68, -0.92, 1.88);
  group.add(tallyLed);

  return group;
}

/**
 * Construye el filtro anti-pop aerodinámico desmontable de malla metálica hidrofóbica.
 */
function createMicPopFilterMesh(materials) {
  const group = new THREE.Group();

  const filterGeo = new THREE.SphereGeometry(0.135, 32, 24);
  filterGeo.scale(1.35, 0.95, 1.05);
  const filterMesh = new THREE.Mesh(filterGeo, materials.acousticGrille);
  filterMesh.position.set(-0.56, -0.88, 1.94);
  filterMesh.rotation.y = -0.45;
  group.add(filterMesh);

  const collarGeo = new THREE.TorusGeometry(0.125, 0.016, 12, 32);
  collarGeo.rotateY(1.1);
  const collar = new THREE.Mesh(collarGeo, materials.titaniumBrushed);
  collar.position.set(-0.62, -0.90, 1.91);
  group.add(collar);

  return group;
}

/**
 * Construye el ensamblaje completo del casco gaming flagship "AETHER NOVA PRO"
 * con 32 piezas mecánicas independientes distribuidas en los 7 estratos de ingeniería
 * y 8 puntos de anclaje 3D para proyección de telemetría HUD.
 *
 * @param {Object} materials Biblioteca de materiales generada por `createMaterialLibrary`.
 * @returns {{ rootGroup: THREE.Group, parts: Array<Object>, anchors: Array<Object> }}
 */
export function buildAetherNovaHeadset(materials) {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'AetherNovaPro_Root';

  const parts = [];

  /**
   * Registra una pieza individual dentro del árbol de escena y le asigna sus metadatos
   * cinemáticos de ensamblaje y explosión escalonada.
   */
  function registerPart({
    id,
    name,
    stratum,
    mesh,
    assembledPos,
    explodedPos,
    assembledRot = new THREE.Euler(0, 0, 0),
    explodedRot = null,
    stageRange = [0.0, 1.0]
  }) {
    mesh.name = id;
    mesh.position.copy(assembledPos);
    mesh.rotation.copy(assembledRot);

    const finalExplodedRot = explodedRot ? explodedRot.clone() : assembledRot.clone();

    const partRecord = {
      id,
      name,
      stratum,
      mesh,
      assembledPos: assembledPos.clone(),
      explodedPos: explodedPos.clone(),
      assembledRot: assembledRot.clone(),
      explodedRot: finalExplodedRot,
      stageRange
    };

    // Vinculamos la referencia en userData de cada sub-mesh para selección inmediata por Raycasting
    mesh.traverse((child) => {
      child.userData.partId = id;
      child.userData.partName = name;
      child.userData.stratum = stratum;
    });

    rootGroup.add(mesh);
    parts.push(partRecord);
    return partRecord;
  }

  // Construcción simétrica y asimétrica de ambas copas acústicas (Izquierda: side = -1, Derecha: side = +1)
  [-1, 1].forEach((side) => {
    const sfx = side < 0 ? 'L' : 'R';
    const sideLabel = side < 0 ? 'Izquierda' : 'Derecha';
    const baseY = -0.35;
    const tiltZ = side * 0.14; // Ángulo ergonómico circumaural
    const baseRot = new THREE.Euler(0, 0, tiltZ);

    // ESTRATO 1: Confort Termo-Acústico y Acoplamiento Magnético
    registerPart({
      id: `earpad_${sfx}`,
      name: `Almohadilla Viscoelástica Microperforada (${sideLabel})`,
      stratum: 1,
      mesh: createEarpadMesh(materials),
      assembledPos: new THREE.Vector3(side * 1.16, baseY, 0),
      explodedPos: new THREE.Vector3(side * 0.68, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, side * 0.08, tiltZ * 0.4),
      stageRange: [0.10, 0.48]
    });

    registerPart({
      id: `cooling_gel_${sfx}`,
      name: `Anillo de Gel Refrigerante Cryo-Phase (${sideLabel})`,
      stratum: 1,
      mesh: createCoolingGelMesh(materials),
      assembledPos: new THREE.Vector3(side * 1.24, baseY, 0),
      explodedPos: new THREE.Vector3(side * 1.18, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, 0, tiltZ * 0.4),
      stageRange: [0.14, 0.52]
    });

    registerPart({
      id: `bayonet_${sfx}`,
      name: `Anillo de Bayoneta Magnético N52 (${sideLabel})`,
      stratum: 1,
      mesh: createBayonetRingMesh(materials),
      assembledPos: new THREE.Vector3(side * 1.32, baseY, 0),
      explodedPos: new THREE.Vector3(side * 1.66, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(side * 0.25, 0, tiltZ * 0.35),
      stageRange: [0.18, 0.56]
    });

    // ESTRATO 2: Control de Fase, Deflector y Micrófono ANC
    registerPart({
      id: `baffle_${sfx}`,
      name: `Placa Deflectora Acústica + Mic MEMS ANC (${sideLabel})`,
      stratum: 2,
      mesh: createAcousticBaffleMesh(materials),
      assembledPos: new THREE.Vector3(side * 1.40, baseY, 0),
      explodedPos: new THREE.Vector3(side * 2.18, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, -side * 0.12, tiltZ * 0.3),
      stageRange: [0.22, 0.62]
    });

    registerPart({
      id: `fazor_${sfx}`,
      name: `Guía de Ondas Fazor de 9 Barras (${sideLabel})`,
      stratum: 2,
      mesh: createFazorWaveguideMesh(materials),
      assembledPos: new THREE.Vector3(side * 1.47, baseY, 0),
      explodedPos: new THREE.Vector3(side * 2.68, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, 0, tiltZ * 0.25),
      stageRange: [0.28, 0.68]
    });

    // ESTRATO 3: Motor Transductor Planar Magnetic de 90mm
    registerPart({
      id: `fluxor_front_${sfx}`,
      name: `Matriz Magnética Frontal Fluxor N50 (${sideLabel})`,
      stratum: 3,
      mesh: createFluxorMagnetArrayMesh(materials),
      assembledPos: new THREE.Vector3(side * 1.54, baseY, 0),
      explodedPos: new THREE.Vector3(side * 3.16, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, 0, tiltZ * 0.2),
      stageRange: [0.34, 0.74]
    });

    registerPart({
      id: `driver_planar_${sfx}`,
      name: `Diafragma Planar Uniforce 90mm + Anillo CCAW (${sideLabel})`,
      stratum: 3,
      mesh: createPlanarDiaphragmMesh(materials),
      assembledPos: new THREE.Vector3(side * 1.60, baseY, 0),
      explodedPos: new THREE.Vector3(side * 3.68, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0.35, side * 0.22, tiltZ * 0.15),
      stageRange: [0.38, 0.78]
    });

    registerPart({
      id: `fluxor_rear_${sfx}`,
      name: `Matriz Magnética Trasera Fluxor N50 (${sideLabel})`,
      stratum: 3,
      mesh: createFluxorMagnetArrayMesh(materials),
      assembledPos: new THREE.Vector3(side * 1.66, baseY, 0),
      explodedPos: new THREE.Vector3(side * 4.18, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, 0, tiltZ * 0.2),
      stageRange: [0.36, 0.76]
    });

    // ESTRATO 4: Cámara Acústica Sellada y Amortiguación
    registerPart({
      id: `damping_${sfx}`,
      name: `Anillo Amortiguador Acústico Microporoso (${sideLabel})`,
      stratum: 4,
      mesh: createAcousticDampingRingMesh(materials),
      assembledPos: new THREE.Vector3(side * 1.73, baseY, 0),
      explodedPos: new THREE.Vector3(side * 4.62, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, 0, tiltZ * 0.15),
      stageRange: [0.42, 0.82]
    });

    registerPart({
      id: `chamber_${sfx}`,
      name: `Cámara Acústica Sellada de Policarbonato (${sideLabel})`,
      stratum: 4,
      mesh: createPolycarbonateChamberMesh(materials, side),
      assembledPos: new THREE.Vector3(side * 1.80, baseY, 0),
      explodedPos: new THREE.Vector3(side * 5.08, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, -side * 0.14, tiltZ * 0.15),
      stageRange: [0.46, 0.86]
    });

    // ESTRATO 5: Electrónica Asimétrica (Izquierda: DSP/ANC/Wireless | Derecha: Power/Pogo Pins)
    if (side < 0) {
      registerPart({
        id: 'pcb_dsp_L',
        name: 'PCB Multicapa FR-4 (DSP 24-bit/96kHz + AI ANC + SoC 2.4GHz)',
        stratum: 5,
        mesh: createLeftDspPcbMesh(materials),
        assembledPos: new THREE.Vector3(-1.88, baseY, 0),
        explodedPos: new THREE.Vector3(-5.58, baseY, 0),
        assembledRot: baseRot,
        explodedRot: new THREE.Euler(0.25, 0.32, tiltZ * 0.1),
        stageRange: [0.52, 0.92]
      });

      registerPart({
        id: 'io_controls_L',
        name: 'Módulo I/O: Rueda de Volumen Moleteada + USB-C',
        stratum: 5,
        mesh: createLeftIoControlsMesh(materials),
        assembledPos: new THREE.Vector3(-1.86, baseY, 0),
        explodedPos: new THREE.Vector3(-5.52, baseY - 0.55, -0.35),
        assembledRot: baseRot,
        explodedRot: new THREE.Euler(0.15, 0.2, 0),
        stageRange: [0.56, 0.94]
      });
    } else {
      registerPart({
        id: 'power_board_R',
        name: 'Placa Reguladora DC-DC + Matriz Pogo Pins 24k (Hot-Swap)',
        stratum: 5,
        mesh: createRightPowerBoardMesh(materials),
        assembledPos: new THREE.Vector3(1.86, baseY, 0),
        explodedPos: new THREE.Vector3(5.48, baseY, 0),
        assembledRot: baseRot,
        explodedRot: new THREE.Euler(-0.18, -0.25, tiltZ * 0.1),
        stageRange: [0.50, 0.90]
      });
    }

    // ESTRATO 6: Bahía de Batería Hot-Swap, Carcasa CNC y Tapas Magnéticas
    if (side > 0) {
      registerPart({
        id: 'battery_hotswap_R',
        name: 'Cartucho de Batería Li-Ion Extraíble (Hot-Swap 1500mAh)',
        stratum: 6,
        mesh: createHotSwapBatteryMesh(materials),
        assembledPos: new THREE.Vector3(1.95, baseY, 0),
        explodedPos: new THREE.Vector3(5.96, baseY + 0.18, 0.22),
        assembledRot: baseRot,
        explodedRot: new THREE.Euler(0.12, -0.38, 0.08),
        stageRange: [0.54, 0.96]
      });
    }

    registerPart({
      id: `outer_shell_${sfx}`,
      name: `Carcasa Monobloque de Aluminio CNC (${sideLabel})`,
      stratum: 6,
      mesh: createOuterShellMesh(materials, side),
      assembledPos: new THREE.Vector3(side * 1.92, baseY, 0),
      explodedPos: new THREE.Vector3(side * 6.08, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, 0, tiltZ * 0.1),
      stageRange: [0.16, 0.65]
    });

    registerPart({
      id: `rgb_ring_${sfx}`,
      name: `Anillo Difusor LED RGB Direccionable (${sideLabel})`,
      stratum: 6,
      mesh: createRgbRingMesh(materials),
      assembledPos: new THREE.Vector3(side * 2.09, baseY, 0),
      explodedPos: new THREE.Vector3(side * 6.38, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, 0, tiltZ * 0.08),
      stageRange: [0.08, 0.52]
    });

    registerPart({
      id: `faceplate_${sfx}`,
      name: `Tapa Exterior Magnética con Grabado Láser (${sideLabel})`,
      stratum: 6,
      mesh: createMagneticFaceplateMesh(materials, side),
      assembledPos: new THREE.Vector3(side * 2.13, baseY, 0),
      explodedPos: new THREE.Vector3(side * 6.68, baseY, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, side * 0.24, 0),
      stageRange: [0.02, 0.42]
    });

    // ESTRATO 7 (Horquillas laterales): Articulación Cardán de 2 ejes
    registerPart({
      id: `yoke_${sfx}`,
      name: `Horquilla Cinética de Titanio CNC 2-Ejes (${sideLabel})`,
      stratum: 7,
      mesh: createTitaniumYokeMesh(materials, side),
      assembledPos: new THREE.Vector3(side * 1.88, baseY, 0),
      explodedPos: new THREE.Vector3(side * 2.55, baseY + 0.88, 0),
      assembledRot: baseRot,
      explodedRot: new THREE.Euler(0, 0, tiltZ * 1.35),
      stageRange: [0.08, 0.48]
    });
  });

  // ESTRATO 7 (Arquitectura Superior e Inferior): Arco de Acero, Suspensión y Micrófono Boom
  registerPart({
    id: 'headband_steel',
    name: 'Arco Estructural de Acero para Muelles PVD Aligerado',
    stratum: 7,
    mesh: createSpringSteelHeadbandMesh(materials),
    assembledPos: new THREE.Vector3(0, 0, 0),
    explodedPos: new THREE.Vector3(0, 1.55, 0),
    stageRange: [0.04, 0.44]
  });

  registerPart({
    id: 'headband_pad',
    name: 'Revestimiento Superior Viscoelástico de Diadema',
    stratum: 7,
    mesh: createHeadbandCushionMesh(materials),
    assembledPos: new THREE.Vector3(0, 0, 0),
    explodedPos: new THREE.Vector3(0, 1.12, 0),
    stageRange: [0.06, 0.46]
  });

  registerPart({
    id: 'suspension_strap',
    name: 'Banda de Suspensión Elástica Autoajustable (Ski-Goggle)',
    stratum: 7,
    mesh: createSuspensionStrapMesh(materials),
    assembledPos: new THREE.Vector3(0, 0, 0),
    explodedPos: new THREE.Vector3(0, 0.64, 0),
    stageRange: [0.10, 0.48]
  });

  registerPart({
    id: 'boom_mic_L',
    name: 'Micrófono Boom Cardioide Desmontable ClearCast AI',
    stratum: 7,
    mesh: createBoomMicArmMesh(materials),
    assembledPos: new THREE.Vector3(0, 0, 0),
    explodedPos: new THREE.Vector3(-0.95, -0.52, 0.95),
    explodedRot: new THREE.Euler(0.12, -0.22, 0),
    stageRange: [0.45, 0.92]
  });

  registerPart({
    id: 'mic_pop_filter_L',
    name: 'Filtro Anti-Pop Metálico Hidrofóbico Desmontable',
    stratum: 7,
    mesh: createMicPopFilterMesh(materials),
    assembledPos: new THREE.Vector3(0, 0, 0),
    explodedPos: new THREE.Vector3(-1.35, -0.68, 1.48),
    explodedRot: new THREE.Euler(0.18, -0.35, 0.1),
    stageRange: [0.55, 0.96]
  });

  // Definición de los 8 puntos de anclaje 3D para proyección de callouts técnicos en el HUD
  const partMap = new Map(parts.map((p) => [p.id, p]));

  const anchorSpecs = [
    {
      id: 'anchor_earpad',
      code: 'STR-01 // CRYO-PAD',
      title: 'Almohadilla + Gel Refrigerante',
      detail: 'Espuma viscoelástica de alta densidad con microperforaciones y anillo magnético N52.',
      stratum: 1,
      partId: 'earpad_L',
      localOffset: new THREE.Vector3(0.05, 0.88, 0.35)
    },
    {
      id: 'anchor_fazor',
      code: 'STR-02 // FAZOR-WG',
      title: 'Guía de Ondas Fazor + MEMS ANC',
      detail: '9 barras difusoras sin difracción de fase y micrófono interno de cancelación activa.',
      stratum: 2,
      partId: 'fazor_L',
      localOffset: new THREE.Vector3(0.1, -0.45, 0.45)
    },
    {
      id: 'anchor_planar',
      code: 'STR-03 // UNIFORCE-90',
      title: 'Driver Planar Magnetic 90mm',
      detail: 'Diafragma sub-micrónico Uniforce entre matrices dobles de Neodimio Fluxor N50.',
      stratum: 3,
      partId: 'driver_planar_L',
      localOffset: new THREE.Vector3(0.15, 0.42, 0.45)
    },
    {
      id: 'anchor_chamber',
      code: 'STR-04 // ISO-CHAMBER',
      title: 'Cámara Acústica de Policarbonato',
      detail: 'Recinto amortiguado libre de ondas estacionarias con nervaduras radiales.',
      stratum: 4,
      partId: 'chamber_R',
      localOffset: new THREE.Vector3(-0.85, 0.72, 0.35)
    },
    {
      id: 'anchor_dsp',
      code: 'STR-05 // NOVA-DSP',
      title: 'PCB Multicapa + DSP 24-bit/96kHz',
      detail: 'Procesamiento espacial por hardware, AI ANC y enlace inalámbrico 2.4GHz Ultra-Low Latency.',
      stratum: 5,
      partId: 'pcb_dsp_L',
      localOffset: new THREE.Vector3(0.35, 1.05, 0.25)
    },
    {
      id: 'anchor_battery',
      code: 'STR-06 // HOT-SWAP',
      title: 'Batería Li-Ion Extraíble en Caliente',
      detail: 'Cartucho magnético de 1500mAh con contactos Pogo de oro 24k para autonomía infinita.',
      stratum: 6,
      partId: 'battery_hotswap_R',
      localOffset: new THREE.Vector3(-1.15, -0.35, 0.35)
    },
    {
      id: 'anchor_headband',
      code: 'STR-07 // KINETIC-ARCH',
      title: 'Arco de Acero PVD + Banda Ski-Goggle',
      detail: 'Chasis superior flexible aligerado y horquillas de titanio CNC de 2 ejes.',
      stratum: 7,
      partId: 'headband_steel',
      localOffset: new THREE.Vector3(-0.45, 1.92, 0)
    },
    {
      id: 'anchor_mic',
      code: 'STR-07 // CLEARCAST-AI',
      title: 'Micrófono Boom Cardioide + Anti-Pop',
      detail: 'Cápsula bidireccional con supresión neuronal de ruido de fondo y filtro metálico.',
      stratum: 7,
      partId: 'boom_mic_L',
      localOffset: new THREE.Vector3(-0.35, -0.55, 1.45)
    }
  ];

  const anchors = anchorSpecs.map((spec) => ({
    ...spec,
    part: partMap.get(spec.partId),
    worldPos: new THREE.Vector3()
  }));

  return {
    rootGroup,
    parts,
    anchors
  };
}
