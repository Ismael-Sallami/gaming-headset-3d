/**
 * Base de datos de ingeniería y especificaciones técnicas del sistema
 * AETHER NOVA PRO // 90MM PLANAR MAGNETIC ACOUSTIC TELEMETRY LAB.
 *
 * Contiene la definición estructural de los 7 estratos de despiece axial,
 * el catálogo de los 28 componentes mecánicos/electrónicos, las trayectorias
 * de cámara por capítulo narrativo, los temas lumínicos de laboratorio y los
 * modelos matemáticos de respuesta en frecuencia (10 Hz - 50 kHz).
 */

/**
 * Temas cromáticos del laboratorio de telemetría.
 */
export const COLOR_THEMES = {
  'cyber-cyan': {
    key: 'cyber-cyan',
    label: 'CYBER CYAN',
    primary: '#00f0ff',
    secondary: '#ff9e00',
    glow: 'rgba(0, 240, 255, 0.28)',
    gridTint: 'rgba(0, 240, 255, 0.05)'
  },
  'amber-lab': {
    key: 'amber-lab',
    label: 'AMBER LAB',
    primary: '#ff9e00',
    secondary: '#00f0ff',
    glow: 'rgba(255, 158, 0, 0.28)',
    gridTint: 'rgba(255, 158, 0, 0.05)'
  },
  'phantom-violet': {
    key: 'phantom-violet',
    label: 'PHANTOM VIOLET',
    primary: '#b84dff',
    secondary: '#00f0ff',
    glow: 'rgba(184, 77, 255, 0.28)',
    gridTint: 'rgba(184, 77, 255, 0.05)'
  }
};

/**
 * Presets de frecuencia para el banco de pruebas acústico Web Audio API.
 */
export const AUDIO_TEST_PRESETS = [
  {
    id: 'sub-bass',
    label: '20 Hz SUB-BASS',
    frequencyHz: 28,
    displayFreq: '20-28 Hz',
    modeDescription: 'Excursión lineal de pistón planar sin compresión dinámica en sub-graves.',
    waveIntensity: 1.0
  },
  {
    id: 'reference',
    label: '440 Hz REFERENCE',
    frequencyHz: 440,
    displayFreq: '440 Hz A4',
    modeDescription: 'Tono de calibración armónica de referencia con distorsión THD < 0.04%.',
    waveIntensity: 0.78
  },
  {
    id: 'fazor-air',
    label: '14 kHz FAZOR AIR',
    frequencyHz: 14000,
    displayFreq: '14.0 kHz',
    modeDescription: 'Difracción de alta frecuencia guiada por matriz Fazor sin cancelación de fase.',
    waveIntensity: 0.92
  }
];

/**
 * Definición de los 7 estratos de ingeniería (S1 a S7) más el estado global (S0).
 * Cada estrato agrupa subsistemas físicos según su orden axial desde el oído hacia el exterior.
 */
export const STRATA_SPECS = [
  {
    index: 0,
    shortCode: 'ALL',
    navLabel: 'ALL',
    code: 'SYS-full-28',
    name: 'MATRIZ COMPLETA DE 28 COMPONENTES',
    axialOffsetMm: 0,
    materialSummary: 'Aluminio CNC 6061-T6 / Neodimio N50 / Poliimida 1.8 µm / Fibra de Carbono',
    description:
      'Vista integral del conjunto acústico, electromagnético y estructural de los auriculares AETHER NOVA PRO en configuración simétrica de doble copa.',
    metrics: [
      { label: 'COMPONENTES CAD', value: '28 PIEZAS' },
      { label: 'APERTURA AXIAL MÁX.', value: '184.0 mm' },
      { label: 'RESPUESTA FRECUENCIA', value: '10 Hz – 50 kHz' },
      { label: 'DISTORSIÓN ARMÓNICA', value: '< 0.05% @ 100dB' }
    ],
    defaultCamera: {
      position: [4.2, 2.1, 5.4],
      target: [0, 0.1, 0],
      fov: 38
    }
  },
  {
    index: 1,
    shortCode: 'S1',
    navLabel: '01 EARPAD',
    code: 'STR-01 // THERMO-SEAL',
    name: 'SELLADO TERMO-ACÚSTICO & BAYONETA MAGNÉTICA',
    axialOffsetMm: 68.5,
    materialSummary: 'Espuma Viscoelástica 65 kg/m³ + Gel de Cambio de Fase + Microfibra Perforada',
    description:
      'Almohadilla circumaural asimétrica con contorno ergonómico de presión distribuida. Incorpora una cámara de gel endotérmico y un anillo de bloqueo rápido con 8 imanes de neodimio que garantiza un sellado hermético de graves hasta 10 Hz.',
    metrics: [
      { label: 'ATENUACIÓN PASIVA', value: '-26.4 dB SPL' },
      { label: 'DENSIDAD VISCO', value: '65.0 kg/m³' },
      { label: 'FUERZA RETENCIÓN', value: '14.2 N (MagLock)' },
      { label: 'DELTA TÉRMICO GEL', value: '-3.8 °C (2h)' }
    ],
    defaultCamera: {
      position: [3.2, 1.1, 4.1],
      target: [-0.4, -0.1, 0],
      fov: 35
    }
  },
  {
    index: 2,
    shortCode: 'S2',
    navLabel: '02 FAZOR',
    code: 'STR-02 // FAZOR WAVEGUIDE',
    name: 'PLACA DEFLECTORA 15° & GUÍA DE ONDA FAZOR',
    axialOffsetMm: 46.0,
    materialSummary: 'Polímero Compuesto Cargado con 30% Fibra de Carbono + Malla Acústica Inox',
    description:
      'Bafle frontal inclinado 15° para alinear el frente de onda con el pabellón auditivo humano. Los elementos triangulares Fazor redirigen el flujo acústico generado entre los imanes, eliminando resonancias estacionarias por encima de 8 kHz.',
    metrics: [
      { label: 'ÁNGULO DE BAFLE', value: '15.0° AXIAL' },
      { label: 'PERFIL FAZOR', value: '7 ELEMENTOS / COPA' },
      { label: 'COHERENCIA DE FASE', value: '±4.2° (20Hz-20kHz)' },
      { label: 'RIGIDEZ ESPECÍFICA', value: '24.8 GPa' }
    ],
    defaultCamera: {
      position: [2.8, 0.9, 3.6],
      target: [-0.3, -0.1, 0],
      fov: 34
    }
  },
  {
    index: 3,
    shortCode: 'S3',
    navLabel: '03 PLANAR 90MM',
    code: 'STR-03 // FLUXOR UNIFORCE',
    name: 'MOTOR PLANAR MAGNETIC DE 90MM (PUSH-PULL N50)',
    axialOffsetMm: 18.0,
    materialSummary: 'Imanes Neodimio N50H Fluxor + Diafragma Kapton 1.8 µm + Bobina Aluminio Grabada',
    description:
      'Corazón transductor con doble matriz magnética Fluxor orientando el campo a 45° (configuración Halbach modificada). El diafragma ultradelgado de 1.8 micras se mueve de manera isodinámica en toda su superficie sin modos de ruptura de cono.',
    metrics: [
      { label: 'DIÁMETRO ACTIVO', value: '90.0 mm' },
      { label: 'ESPESOR DIAFRAGMA', value: '1.8 µm UNIFORCE' },
      { label: 'DENSIDAD DE FLUJO', value: '1.45 Tesla (N50H)' },
      { label: 'IMPEDANCIA NOMINAL', value: '32.0 Ω (Plana)' }
    ],
    defaultCamera: {
      position: [2.1, 0.55, 2.7],
      target: [-0.25, -0.05, 0],
      fov: 31
    }
  },
  {
    index: 4,
    shortCode: 'S4',
    navLabel: '04 CHAMBER',
    code: 'STR-04 // ISO-CHAMBER',
    name: 'CÁMARA ACÚSTICA SELLADA & AMORTIGUACIÓN HELMHOLTZ',
    axialOffsetMm: -22.5,
    materialSummary: 'Policarbonato de Grado Óptico + Espuma Acústica de Celda Abierta Calibrada',
    description:
      'Recinto posterior amortiguado que controla la onda trasera del transductor planar. Incorpora laberintos absorbentes sintonizados y venteo barométrico de precisión para evitar fatiga timpánica sin perder extensión sub-grave.',
    metrics: [
      { label: 'VOLUMEN INTERNO', value: '142.0 cm³' },
      { label: 'FACTOR DE MÉRITO Q', value: 'Qtc = 0.577 (Bessel)' },
      { label: 'ABSORCIÓN TRASERA', value: '94% @ >1.2 kHz' },
      { label: 'AISLAMIENTO TOTAL', value: '-38.0 dB (Hybrid)' }
    ],
    defaultCamera: {
      position: [3.0, 1.2, 3.8],
      target: [0.1, -0.05, 0],
      fov: 35
    }
  },
  {
    index: 5,
    shortCode: 'S5',
    navLabel: '05 DSP PCB',
    code: 'STR-05 // NEURAL DSP PCB',
    name: 'PCB MULTICAPA 6-LAYERS, DAC 24-BIT/96KHZ & ANC IA',
    axialOffsetMm: -48.0,
    materialSummary: 'Sustrato FR-4 TG170 Negro Mate + Pistas ENIG Oro 24K + Blindaje EMI Cobre',
    description:
      'Placa electrónica anular de 6 capas con etapas digitales y analógicas separadas galvánicamente. Aloja el procesador DSP de doble núcleo, el transceptor inalámbrico de 2.4 GHz (latencia < 11 ms) y el coprocesador de cancelación activa híbrida de 4 micrófonos.',
    metrics: [
      { label: 'RESOLUCIÓN DAC', value: '24-Bit / 96 kHz' },
      { label: 'RELACIÓN SEÑAL/RUIDO', value: '124 dB DNR' },
      { label: 'LATENCIA WIRELESS', value: '9.4 ms (2.4GHz ULL)' },
      { label: 'CANCELACIÓN ANC', value: '4-Mic Feedforward/FB' }
    ],
    defaultCamera: {
      position: [2.7, 0.85, 3.4],
      target: [0.25, -0.08, 0],
      fov: 33
    }
  },
  {
    index: 6,
    shortCode: 'S6',
    navLabel: '06 HOT-SWAP',
    code: 'STR-06 // POWER & COMMS',
    name: 'BATERÍA HOT-SWAP, TAPAS MAGNÉTICAS CNC & MIC BOOM',
    axialOffsetMm: -76.0,
    materialSummary: 'Celda Li-Ion Polímero 1050 mAh + Contactos Pogo Oro + Aluminio Anodizado',
    description:
      'Sistema de alimentación ininterrumpida con cartucho Li-Ion extraíble en caliente asistido por supercondensador puente en la PCB. Incluye las tapas exteriores fresadas por CNC con anillo difusor RGB direccionable y el micrófono hipercardioide retráctil.',
    metrics: [
      { label: 'AUTONOMÍA POR CELDA', value: '24h (∞ Hot-Swap)' },
      { label: 'TIEMPO PUENTE CAP', value: '18.0 s Reserva' },
      { label: 'PATRÓN MIC BOOM', value: 'Hipercardioide 100Hz-12kHz' },
      { label: 'CONTACTOS CARGA', value: '4x Pogo Pins 3A Oro' }
    ],
    defaultCamera: {
      position: [3.6, 1.4, 4.5],
      target: [0.35, -0.15, 0.2],
      fov: 37
    }
  },
  {
    index: 7,
    shortCode: 'S7',
    navLabel: '07 CNC YOKE',
    code: 'STR-07 // EXOSKELETON',
    name: 'HORQUILLAS CNC 2-EJES, ARCO DE ACERO & SUSPENSIÓN',
    axialOffsetMm: 92.0,
    materialSummary: 'Aluminio Aeroespacial 6061-T6 + Acero para Muelles PVD + Elastómero Técnico',
    description:
      'Chasis estructural de baja resonancia mecanizado en bloque sólido de aluminio 6061-T6 con articulación cardán silenciosa de doble eje. El arco superior de acero templado con recubrimiento PVD reparte la masa a través de una banda de suspensión flotante.',
    metrics: [
      { label: 'ALEACIÓN HORQUILLA', value: 'Al 6061-T6 CNC' },
      { label: 'FUERZA DE APRIETE', value: '4.1 N ± 0.2 N' },
      { label: 'ARTICULACIÓN CARDÁN', value: '180° Yaw / 35° Pitch' },
      { label: 'MASA ESTRUCTURAL', value: '112 g (Exoesqueleto)' }
    ],
    defaultCamera: {
      position: [3.8, 2.6, 4.9],
      target: [0, 0.55, 0],
      fov: 38
    }
  }
];

/**
 * Catálogo detallado de los 28 componentes de ingeniería (para el inspector de piezas y callouts).
 */
export const COMPONENT_CATALOG = {
  'earpad-left': {
    id: 'earpad-left',
    code: 'PRT-01L // VISCO-GEL PAD',
    name: 'Almohadilla Termo-Acústica Izquierda',
    stratum: 1,
    description: 'Almohadilla viscoelástica de memoria lenta con inserto superior de gel refrigerante y piel sintética microperforada acústicamente transparente.',
    metrics: [
      { label: 'ESPESOR AXIAL', value: '28.5 mm' },
      { label: 'DENSIDAD ESPUMA', value: '65 kg/m³' },
      { label: 'SELLADO SUB-BASS', value: 'Hermético 10 Hz' },
      { label: 'CONDUCTIVIDAD GEL', value: '0.68 W/m·K' }
    ]
  },
  'earpad-right': {
    id: 'earpad-right',
    code: 'PRT-02R // VISCO-GEL PAD',
    name: 'Almohadilla Termo-Acústica Derecha',
    stratum: 1,
    description: 'Almohadilla circumaural derecha con cámara acústica perfilada a 15° para maximizar la escena sonora tridimensional.',
    metrics: [
      { label: 'ESPESOR AXIAL', value: '28.5 mm' },
      { label: 'DENSIDAD ESPUMA', value: '65 kg/m³' },
      { label: 'SELLADO SUB-BASS', value: 'Hermético 10 Hz' },
      { label: 'CONDUCTIVIDAD GEL', value: '0.68 W/m·K' }
    ]
  },
  'maglock-ring-left': {
    id: 'maglock-ring-left',
    code: 'PRT-03L // MAGLOCK BAYONET',
    name: 'Anillo de Bayoneta Magnética Izquierdo',
    stratum: 1,
    description: 'Bastidor rígido de polímero reforzado con 8 imanes de neodimio N48 avellanados para acople instantáneo sin fugas de presión.',
    metrics: [
      { label: 'IMANES DE ANCLAJE', value: '8x N48 (Ø4mm)' },
      { label: 'FUERZA AXIAL', value: '14.2 N' },
      { label: 'JUNTA TÓRICA', value: 'Silicona 40 Shore A' },
      { label: 'TOLERANCIA CNC', value: '±0.03 mm' }
    ]
  },
  'maglock-ring-right': {
    id: 'maglock-ring-right',
    code: 'PRT-04R // MAGLOCK BAYONET',
    name: 'Anillo de Bayoneta Magnética Derecho',
    stratum: 1,
    description: 'Anillo portador magnético derecho con pines guía anticizallamiento y junta elastomérica perimetral.',
    metrics: [
      { label: 'IMANES DE ANCLAJE', value: '8x N48 (Ø4mm)' },
      { label: 'FUERZA AXIAL', value: '14.2 N' },
      { label: 'JUNTA TÓRICA', value: 'Silicona 40 Shore A' },
      { label: 'TOLERANCIA CNC', value: '±0.03 mm' }
    ]
  },
  'baffle-plate-left': {
    id: 'baffle-plate-left',
    code: 'PRT-05L // ANGLED BAFFLE',
    name: 'Placa Deflectora Acústica 15° (Izquierda)',
    stratum: 2,
    description: 'Chasis frontal moldeado en compuesto de fibra de carbono al 30% que desacopla mecánicamente el motor planar del recinto exterior.',
    metrics: [
      { label: 'INCLINACIÓN AXIAL', value: '15.0°' },
      { label: 'MÓDULO ELÁSTICO', value: '24.8 GPa' },
      { label: 'PUERTOS BAROMÉTRICOS', value: '4 Micro-Vents' },
      { label: 'AMORTIGUACIÓN', value: 'Elastómero Perimetral' }
    ]
  },
  'baffle-plate-right': {
    id: 'baffle-plate-right',
    code: 'PRT-06R // ANGLED BAFFLE',
    name: 'Placa Deflectora Acústica 15° (Derecha)',
    stratum: 2,
    description: 'Deflector acústico derecho con alojamiento dedicado para el micrófono feedforward del sistema Hybrid ANC.',
    metrics: [
      { label: 'INCLINACIÓN AXIAL', value: '15.0°' },
      { label: 'MÓDULO ELÁSTICO', value: '24.8 GPa' },
      { label: 'MIC ANC INTERNO', value: 'MEMS SNR 72dB' },
      { label: 'AMORTIGUACIÓN', value: 'Elastómero Perimetral' }
    ]
  },
  'fazor-grid-left': {
    id: 'fazor-grid-left',
    code: 'PRT-07L // FAZOR WAVEGUIDE',
    name: 'Matriz Difusora de Fase Fazor (Izquierda)',
    stratum: 2,
    description: 'Arreglo de 7 perfiles aerodinámicos triangulares que guían las ondas de alta frecuencia sin difracción de borde.',
    metrics: [
      { label: 'ELEMENTOS DIFUSORES', value: '7 Barras Fazor' },
      { label: 'GANANCIA >10kHz', value: '+2.4 dB Lineal' },
      { label: 'DISPERSIÓN DE FASE', value: '< 4.2°' },
      { label: 'ACABADO SUPERFICIAL', value: 'Anodizado Micro-Bead' }
    ]
  },
  'fazor-grid-right': {
    id: 'fazor-grid-right',
    code: 'PRT-08R // FAZOR WAVEGUIDE',
    name: 'Matriz Difusora de Fase Fazor (Derecha)',
    stratum: 2,
    description: 'Guía de onda Fazor derecha emparejada por láser con tolerancia acústica de ±0.3 dB respecto al canal izquierdo.',
    metrics: [
      { label: 'ELEMENTOS DIFUSORES', value: '7 Barras Fazor' },
      { label: 'EMPAREJAMIENTO L/R', value: '±0.3 dB SPL' },
      { label: 'DISPERSIÓN DE FASE', value: '< 4.2°' },
      { label: 'ACABADO SUPERFICIAL', value: 'Anodizado Micro-Bead' }
    ]
  },
  'fluxor-front-left': {
    id: 'fluxor-front-left',
    code: 'PRT-09L // FLUXOR N50 FRONT',
    name: 'Estator Magnético Frontal Fluxor N50 (Izq)',
    stratum: 3,
    description: 'Matriz frontal de barras de neodimio N50H en disposición Fluxor de 45° que duplica la densidad de flujo sobre el diafragma.',
    metrics: [
      { label: 'GRADO MAGNÉTICO', value: 'Neodimio N50H' },
      { label: 'FLUJO EN ENTREHIERRO', value: '1.45 Tesla' },
      { label: 'TEMP. MÁX. OPERACIÓN', value: '120 °C' },
      { label: 'RECUBRIMIENTO', value: 'Ni-Cu-Ni Anticorrosión' }
    ]
  },
  'planar-diaphragm-left': {
    id: 'planar-diaphragm-left',
    code: 'PRT-10L // UNIFORCE 90MM',
    name: 'Diafragma Planar Uniforce 90mm 1.8µm (Izq)',
    stratum: 3,
    description: 'Película polimérica ultradelgada de 1.8 micras con pistas de aluminio de ancho variable depositadas por litografía de plasma.',
    metrics: [
      { label: 'DIÁMETRO TRANSDUCTOR', value: '90.0 mm' },
      { label: 'ESPESOR FILM', value: '1.8 µm (Masa < 80mg)' },
      { label: 'TRAZADO CONDUCTOR', value: 'Aluminio 99.99% Puro' },
      { label: 'EXCURSIÓN PICO-PICO', value: '3.4 mm Lineal' }
    ]
  },
  'fluxor-rear-left': {
    id: 'fluxor-rear-left',
    code: 'PRT-11L // FLUXOR N50 REAR',
    name: 'Estator Magnético Trasero Push-Pull (Izq)',
    stratum: 3,
    description: 'Estator magnético posterior complementario que completa el circuito simétrico Push-Pull eliminando la distorsión de segundo orden.',
    metrics: [
      { label: 'SIMETRÍA PUSH-PULL', value: '99.4% Linealidad' },
      { label: 'ARMÓNICOS PARES', value: '-86 dBc' },
      { label: 'ESTRUCTURA CHASIS', value: 'Acero al Silicio CNC' },
      { label: 'APERTURA ACÚSTICA', value: '78% Área Libre' }
    ]
  },
  'fluxor-front-right': {
    id: 'fluxor-front-right',
    code: 'PRT-12R // FLUXOR N50 FRONT',
    name: 'Estator Magnético Frontal Fluxor N50 (Der)',
    stratum: 3,
    description: 'Matriz frontal de imanes N50H del canal derecho calibrada en banco Gaussímetro para simetría de sensibilidad.',
    metrics: [
      { label: 'GRADO MAGNÉTICO', value: 'Neodimio N50H' },
      { label: 'FLUJO EN ENTREHIERRO', value: '1.45 Tesla' },
      { label: 'SENSIBILIDAD', value: '104 dB / 1mW' },
      { label: 'RECUBRIMIENTO', value: 'Ni-Cu-Ni Anticorrosión' }
    ]
  },
  'planar-diaphragm-right': {
    id: 'planar-diaphragm-right',
    code: 'PRT-13R // UNIFORCE 90MM',
    name: 'Diafragma Planar Uniforce 90mm 1.8µm (Der)',
    stratum: 3,
    description: 'Membrana activa derecha de 90 mm con tensión biaxial controlada por interferometría láser.',
    metrics: [
      { label: 'DIÁMETRO TRANSDUCTOR', value: '90.0 mm' },
      { label: 'ESPESOR FILM', value: '1.8 µm' },
      { label: 'TIEMPO DE SUBIDA', value: '4.8 µs Impulso' },
      { label: 'IMPEDANCIA', value: '32.0 Ω ± 0.1 Ω' }
    ]
  },
  'fluxor-rear-right': {
    id: 'fluxor-rear-right',
    code: 'PRT-14R // FLUXOR N50 REAR',
    name: 'Estator Magnético Trasero Push-Pull (Der)',
    stratum: 3,
    description: 'Estator magnético trasero derecho con puentes de retorno de flujo de baja reluctancia.',
    metrics: [
      { label: 'SIMETRÍA PUSH-PULL', value: '99.4% Linealidad' },
      { label: 'ARMÓNICOS PARES', value: '-86 dBc' },
      { label: 'ESTRUCTURA CHASIS', value: 'Acero al Silicio CNC' },
      { label: 'APERTURA ACÚSTICA', value: '78% Área Libre' }
    ]
  },
  'acoustic-chamber-left': {
    id: 'acoustic-chamber-left',
    code: 'PRT-15L // ISO-SHELL L',
    name: 'Cámara Acústica de Policarbonato (Izquierda)',
    stratum: 4,
    description: 'Cúpula monobloque de policarbonato de alta densidad con costillas radiales anti-resonantes y puerto de carga acústica.',
    metrics: [
      { label: 'VOLUMEN ACÚSTICO', value: '142 cm³' },
      { label: 'RESONANCIA PROPIA', value: '< 18 Hz (Amortiguada)' },
      { label: 'ESPESOR PARED', value: '3.2 mm Variable' },
      { label: 'MATERIAL', value: 'Lexan Óptico Humo' }
    ]
  },
  'acoustic-chamber-right': {
    id: 'acoustic-chamber-right',
    code: 'PRT-16R // ISO-SHELL R',
    name: 'Cámara Acústica de Policarbonato (Derecha)',
    stratum: 4,
    description: 'Cámara acústica derecha con bahía sellada independiente para el cartucho de batería Hot-Swap.',
    metrics: [
      { label: 'VOLUMEN ACÚSTICO', value: '142 cm³' },
      { label: 'BAHÍA ENERGÍA', value: 'Aislada Herméticamente' },
      { label: 'ESPESOR PARED', value: '3.2 mm Variable' },
      { label: 'MATERIAL', value: 'Lexan Óptico Humo' }
    ]
  },
  'damping-ring-left': {
    id: 'damping-ring-left',
    code: 'PRT-17L // HELMHOLTZ FOAM',
    name: 'Anillo Amortiguador Helmholtz (Izquierdo)',
    stratum: 4,
    description: 'Corona acústica porosa de densidad progresiva que absorbe reflexiones de onda trasera entre 1.2 kHz y 16 kHz.',
    metrics: [
      { label: 'COEF. ABSORCIÓN α', value: '0.94 @ 2kHz' },
      { label: 'POROSIDAD', value: '85 PPI Calibrada' },
      { label: 'RESPUESTA TRANSITORIA', value: 'CSD < 0.8 ms' },
      { label: 'GEOMETRÍA', value: 'Anular Segmentada' }
    ]
  },
  'damping-ring-right': {
    id: 'damping-ring-right',
    code: 'PRT-18R // HELMHOLTZ FOAM',
    name: 'Anillo Amortiguador Helmholtz (Derecho)',
    stratum: 4,
    description: 'Elemento amortiguador posterior derecho sintonizado para igualar el volumen efectivo de la copa con batería.',
    metrics: [
      { label: 'COEF. ABSORCIÓN α', value: '0.94 @ 2kHz' },
      { label: 'POROSIDAD', value: '85 PPI Calibrada' },
      { label: 'RESPUESTA TRANSITORIA', value: 'CSD < 0.8 ms' },
      { label: 'GEOMETRÍA', value: 'Anular Segmentada' }
    ]
  },
  'dsp-pcb-left': {
    id: 'dsp-pcb-left',
    code: 'PRT-19L // MASTER DSP PCB',
    name: 'Placa Madre DSP 24-Bit/96kHz & Radio 2.4GHz',
    stratum: 5,
    description: 'PCB de 6 capas con DAC ESS Sabre de referencia, amplificador balanceado Clase AB/H para transductor planar y SoC Dual-Wireless.',
    metrics: [
      { label: 'ARQUITECTURA DAC', value: '32-Bit HyperStream' },
      { label: 'POTENCIA SALIDA', value: '420 mW @ 32Ω' },
      { label: 'ENLACE RF DUAL', value: '2.4GHz ULL + BT 5.4' },
      { label: 'ACABADO PISTAS', value: 'Oro Inmersión ENIG' }
    ]
  },
  'anc-pcb-right': {
    id: 'anc-pcb-right',
    code: 'PRT-20R // ANC & POWER PCB',
    name: 'Placa Coprocesadora ANC & Gestión Hot-Swap',
    stratum: 5,
    description: 'Módulo electrónico derecho con controlador PMIC de carga rápida, supercondensador puente de 18 segundos y matriz DSP de cancelación activa.',
    metrics: [
      { label: 'RESERVA HOT-SWAP', value: 'SuperCap 4.5F / 5.5V' },
      { label: 'ALGORITMO ANC', value: 'Adaptativo 48kHz/Ciclo' },
      { label: 'EFICIENCIA PMIC', value: '96.2% Buck-Boost' },
      { label: 'PROTECCIÓN ESD', value: '±15 kV IEC 61000' }
    ]
  },
  'hotswap-battery': {
    id: 'hotswap-battery',
    code: 'PRT-21R // LI-ION CARTRIDGE',
    name: 'Cartucho de Batería Li-Ion Hot-Swap (1050 mAh)',
    stratum: 6,
    description: 'Batería inteligente encapsulada en aluminio anodizado con lengüeta de extracción rápida y contactos chapados en oro de 24K.',
    metrics: [
      { label: 'CAPACIDAD NOMINAL', value: '1050 mAh / 3.99 Wh' },
      { label: 'AUTONOMÍA ACTIVA', value: '24 Horas Continuas' },
      { label: 'TIEMPO DE CAMBIO', value: '< 18s Sin Apagado' },
      { label: 'CICLOS DE VIDA', value: '> 1000 al 85% SoH' }
    ]
  },
  'cnc-cap-left': {
    id: 'cnc-cap-left',
    code: 'PRT-22L // CNC FACEPLATE L',
    name: 'Tapa Magnética CNC con Anillo RGB (Izquierda)',
    stratum: 6,
    description: 'Disco exterior fresado por CNC en aluminio 6061-T6 con bisel diamantado, grabado láser de telemetría y difusor óptico perimetral.',
    metrics: [
      { label: 'PROCESO MECÁNICO', value: 'Fresado CNC 5-Ejes' },
      { label: 'ILUMINACIÓN', value: '16 LEDs ARGB Difusos' },
      { label: 'ANCLAJE', value: '4x Imanes Neodimio' },
      { label: 'DUREZA ANODIZADO', value: 'Tipo III Hardcoat' }
    ]
  },
  'cnc-cap-right': {
    id: 'cnc-cap-right',
    code: 'PRT-23R // CNC FACEPLATE R',
    name: 'Tapa Magnética CNC Cubre-Batería (Derecha)',
    stratum: 6,
    description: 'Tapa magnética derecha de acceso rápido que protege el compartimento del cartucho energético Hot-Swap.',
    metrics: [
      { label: 'PROCESO MECÁNICO', value: 'Fresado CNC 5-Ejes' },
      { label: 'ILUMINACIÓN', value: '16 LEDs ARGB Difusos' },
      { label: 'ACCESO RÁPIDO', value: 'Apertura < 0.5 s' },
      { label: 'DUREZA ANODIZADO', value: 'Tipo III Hardcoat' }
    ]
  },
  'boom-mic': {
    id: 'boom-mic',
    code: 'PRT-24L // CLEARCAST BOOM',
    name: 'Micrófono Boom Bidireccional con Filtro Anti-Pop',
    stratum: 6,
    description: 'Brazo Gooseneck de memoria mecánica con cápsula electret de doble diafragma para cancelación de ruido de fondo por gradiente de presión.',
    metrics: [
      { label: 'PATRÓN POLAR', value: 'Bidireccional / Figura-8' },
      { label: 'RECHAZO FUERA EJE', value: '-28 dB @ 90°' },
      { label: 'RESPUESTA VOZ', value: '100 Hz – 12.5 kHz' },
      { label: 'INDICADOR MUTE', value: 'Anillo LED Óptico' }
    ]
  },
  'cnc-yoke-left': {
    id: 'cnc-yoke-left',
    code: 'PRT-25L // GIMBAL YOKE L',
    name: 'Horquilla Cardán CNC de 2 Ejes (Izquierda)',
    stratum: 7,
    description: 'Horquilla asimétrica mecanizada en aluminio sólido con rodamientos de fricción controlada y paso interno de cableado coaxial.',
    metrics: [
      { label: 'ALEACIÓN', value: 'Aluminio 6061-T6' },
      { label: 'ROTACIÓN HORIZONTAL', value: '180° Suave' },
      { label: 'BASCULACIÓN VERTICAL', value: '35° Auto-Ajuste' },
      { label: 'FACTOR SEGURIDAD', value: '4.5x Carga Fluencia' }
    ]
  },
  'cnc-yoke-right': {
    id: 'cnc-yoke-right',
    code: 'PRT-26R // GIMBAL YOKE R',
    name: 'Horquilla Cardán CNC de 2 Ejes (Derecha)',
    stratum: 7,
    description: 'Horquilla estructural derecha con retenedores telescópicos grabados milimétricamente para ajuste reproducible.',
    metrics: [
      { label: 'ALEACIÓN', value: 'Aluminio 6061-T6' },
      { label: 'CARRERA TELESCÓPICA', value: '38 mm (10 Posiciones)' },
      { label: 'CASQUILLO PIVOTE', value: 'POM Autolubricado' },
      { label: 'FACTOR SEGURIDAD', value: '4.5x Carga Fluencia' }
    ]
  },
  'spring-steel-arch': {
    id: 'spring-steel-arch',
    code: 'PRT-27C // PVD STEEL ARCH',
    name: 'Arco Principal de Acero para Muelles PVD',
    stratum: 7,
    description: 'Fleje de acero inoxidable templado con recubrimiento PVD titanio oscuro y ventanas de aligeramiento estructural.',
    metrics: [
      { label: 'LÍMITE ELÁSTICO', value: '1450 MPa' },
      { label: 'RECUBRIMIENTO', value: 'PVD Carburo Titanio' },
      { label: 'DEFORMACIÓN FATIGA', value: '0% tras 25,000 ciclos' },
      { label: 'FUERZA CLAMPING', value: '4.1 N Constante' }
    ]
  },
  'suspension-strap': {
    id: 'suspension-strap',
    code: 'PRT-28C // AERO-STRAP',
    name: 'Banda de Suspensión Elastomérica Flotante',
    stratum: 7,
    description: 'Banda inferior de tensión regulable que desacopla el peso del chasis y elimina puntos calientes en el cráneo durante sesiones prolongadas.',
    metrics: [
      { label: 'REPARTO DE PRESIÓN', value: '< 1.8 N/cm²' },
      { label: 'MATERIAL', value: 'Tejido 3D Transpirable' },
      { label: 'AJUSTE TENSIÓN', value: '3 Niveles de Anclaje' },
      { label: 'MASA BANDA', value: '18.5 g' }
    ]
  }
};

/**
 * Capítulos narrativos sincronizados con el scroll (650vh totales).
 * Define para cada tramo el rango de progreso de scroll, el rango de explosión 3D,
 * la pose de cámara cinemática, el estrato destacado y la narrativa de ingeniería.
 */
export const SCROLL_CHAPTERS = [
  {
    id: 'chapter-01',
    number: '01',
    scrollRange: [0.0, 0.16],
    explosionRange: [0.0, 0.12],
    activeStratum: 0,
    acousticIntensity: 0.15,
    code: 'CHP-01 // CHASSIS NOMINAL',
    kicker: '00% – 16% // INSPECCIÓN EXTERIOR & PRE-DESACOPLE',
    title: 'AETHER NOVA PRO // CHASIS ENSAMBLADO',
    subtitle: 'Arquitectura Acústica Planar Magnetic de 90 mm & Exoesqueleto CNC',
    description:
      'En estado nominal ensamblado, el chasis unibody de aluminio 6061-T6 y el arco de acero PVD conforman una jaula acústica hermética libre de resonancias parásitas. Al iniciar la secuencia de telemetría, los anillos difusores ARGB se energizan y las tapas magnéticas exteriores preparan el desacople axial.',
    telemetryHighlights: [
      { label: 'ESTADO MECÁNICO', value: 'NOMINAL LOCKED' },
      { label: 'MASA OPERATIVA', value: '338 g (Con Celda)' },
      { label: 'ATENUACIÓN HÍBRIDA', value: '-38.0 dB SPL' }
    ],
    camera: {
      position: [4.8, 1.95, 7.6],
      target: [0.25, 0.15, 0.0],
      fov: 40
    }
  },
  {
    id: 'chapter-02',
    number: '02',
    scrollRange: [0.16, 0.34],
    explosionRange: [0.12, 0.38],
    activeStratum: 2,
    acousticIntensity: 0.35,
    code: 'CHP-02 // THERMO-ACOUSTIC & FAZOR',
    kicker: '16% – 34% // ESTRATOS 01–02 // CONTROL DE FRENTE DE ONDA',
    title: 'ESTRATO 01-02 // SELLADO TERMO-ACÚSTICO & GUÍA FAZOR',
    subtitle: 'Almohadillas de Gel Endotérmico, Bayoneta MagLock y Bafle de 15°',
    description:
      'Las almohadillas viscoelásticas de 65 kg/m³ se separan revelando el anillo de retención de 8 imanes N48. Detrás emerge la placa deflectora inclinada 15° en fibra de carbono y la matriz de 7 elementos triangulares Fazor, diseñados para eliminar la difracción de alta frecuencia antes de que el sonido alcance el canal auditivo.',
    telemetryHighlights: [
      { label: 'INCLINACIÓN BAFLE', value: '15.0° ERGONOMIC' },
      { label: 'MATRIZ FAZOR', value: '7 ELEMENTOS / COPA' },
      { label: 'DELTA TÉRMICO GEL', value: '-3.8 °C ESTABLE' }
    ],
    camera: {
      position: [3.8, 1.15, 6.4],
      target: [-0.15, -0.05, 0.0],
      fov: 38
    }
  },
  {
    id: 'chapter-03',
    number: '03',
    scrollRange: [0.34, 0.56],
    explosionRange: [0.38, 0.68],
    activeStratum: 3,
    acousticIntensity: 0.95,
    code: 'CHP-03 // 90MM PLANAR CORE',
    kicker: '34% – 56% // ESTRATO 03 // TRANSDUCCIÓN ISODINÁMICA',
    title: 'ESTRATO 03 // MOTOR PLANAR MAGNETIC DE 90MM',
    subtitle: 'Doble Matriz Neodimio N50H Fluxor Push-Pull & Diafragma de 1.8 µm',
    description:
      'La cámara se aproxima al corazón electromagnético: dos estatores de imanes de neodimio N50H en configuración Fluxor concentran un campo de 1.45 Tesla sobre el diafragma iridiscente Uniforce de apenas 1.8 micras. Al excitar las pistas de aluminio grabadas por plasma, toda la superficie impulsa un frente de onda plano con distorsión inferior al 0.05%.',
    telemetryHighlights: [
      { label: 'FLUJO MAGNÉTICO', value: '1.45 TESLA (N50H)' },
      { label: 'DIAFRAGMA ACTIVO', value: '90 mm / 1.8 µm' },
      { label: 'THD @ 100dB SPL', value: '0.042% ULTRA-LINEAR' }
    ],
    camera: {
      position: [2.85, 0.65, 5.25],
      target: [-0.65, -0.15, 0.0],
      fov: 35
    }
  },
  {
    id: 'chapter-04',
    number: '04',
    scrollRange: [0.56, 0.74],
    explosionRange: [0.68, 0.85],
    activeStratum: 5,
    acousticIntensity: 0.5,
    code: 'CHP-04 // ISO-CHAMBER & DSP PCB',
    kicker: '56% – 74% // ESTRATOS 04–05 // ARQUITECTURA DIGITAL',
    title: 'ESTRATO 04-05 // CÁMARA SELLADA & DSP DUAL-WIRELESS',
    subtitle: 'Recinto Helmholtz Óptico, PCB de 6 Capas ENIG y DAC 24-Bit/96kHz',
    description:
      'Detrás del motor planar se abre la cúpula de policarbonato óptico con su anillo absorbente Helmholtz. En el estrato electrónico, la PCB anular de 6 capas con pistas de oro 24K aloja el convertidor DAC de 24-bit/96kHz, el coprocesador neuronal para cancelación activa de 4 micrófonos y el enlace inalámbrico de 2.4 GHz (9.4 ms).',
    telemetryHighlights: [
      { label: 'DAC / DSP CORE', value: '24-BIT / 96 kHz' },
      { label: 'LATENCIA ENLACE', value: '9.4 ms (2.4GHz ULL)' },
      { label: 'RANGO DINÁMICO', value: '124 dB DNR' }
    ],
    camera: {
      position: [-3.95, 1.05, 6.85],
      target: [-1.15, -0.18, 0.0],
      fov: 37
    }
  },
  {
    id: 'chapter-05',
    number: '05',
    scrollRange: [0.74, 0.90],
    explosionRange: [0.85, 0.96],
    activeStratum: 6,
    acousticIntensity: 0.3,
    code: 'CHP-05 // HOT-SWAP & EXOSKELETON',
    kicker: '74% – 90% // ESTRATOS 06–07 // ENERGÍA CONTINUA & CINEMÁTICA',
    title: 'ESTRATO 06-07 // ENERGÍA HOT-SWAP & CINEMÁTICA CNC',
    subtitle: 'Cartucho Li-Ion Extraíble en Caliente, Micrófono Boom y Cardán 2-Ejes',
    description:
      'En la copa derecha, el cartucho Li-Ion de 1050 mAh se desliza axialmente sobre contactos Pogo de oro mientras un supercondensador mantiene el sistema encendido durante 18 segundos. Simultáneamente, el micrófono boom hipercardioide se despliega y el arco de acero para muelles PVD se eleva junto a las horquillas CNC.',
    telemetryHighlights: [
      { label: 'ENERGÍA HOT-SWAP', value: '1050 mAh + 18s CAP' },
      { label: 'HORQUILLAS CARDÁN', value: 'ALUMINIO 6061-T6' },
      { label: 'MICRÓFONO BOOM', value: 'CLEARCAST FIG-8' }
    ],
    camera: {
      position: [4.65, 1.85, 8.45],
      target: [0.85, 0.12, 0.0],
      fov: 40
    }
  },
  {
    id: 'chapter-06',
    number: '06',
    scrollRange: [0.90, 1.0],
    explosionRange: [0.96, 1.0],
    activeStratum: 0,
    acousticIntensity: 0.85,
    code: 'CHP-06 // FULL AXIAL MATRIX',
    kicker: '90% – 100% // DESPIECE COMPLETO // BANCO INTERACTIVO ACTIVO',
    title: 'BLUEPRINT COMPLETO // 28 COMPONENTES EN MATRIZ AXIAL',
    subtitle: 'Apertura Máxima de 184 mm, Inspección Individual y Telemetría Acústica',
    description:
      'Con la matriz axial desplegada al 100% (184.0 mm de separación total), los 7 estratos y 28 componentes quedan suspendidos en simetría isométrica. Utiliza el selector lateral de estratos, haz clic directamente sobre cualquier pieza del modelo 3D o ejecuta el sintetizador acústico Planar Magnetic en tiempo real.',
    telemetryHighlights: [
      { label: 'APERTURA AXIAL', value: '184.0 mm (100%)' },
      { label: 'INSPECCIÓN RAYCAST', value: '28 PIEZAS ACTIVAS' },
      { label: 'BANCO DE AUDIO', value: 'WEB AUDIO SYNTH READY' }
    ],
    camera: {
      position: [0.4, 2.35, 11.4],
      target: [0.45, 0.1, 0.0],
      fov: 42
    }
  }
];

/**
 * Calcula la curva de respuesta en frecuencia SPL (en dB) entre 10 Hz y 50 kHz
 * para el motor Planar Magnetic de 90 mm frente a un transductor dinámico convencional de 40 mm.
 *
 * @param {number} freqHz - Frecuencia en hercios (10 a 50000)
 * @param {number} explosionProgress - Estado de apertura axial (0 a 1) que modula sutilmente la resonancia de cámara
 * @param {number} activePresetHz - Frecuencia activa del sintetizador si está encendido (0 si apagado)
 * @returns {{ planarDb: number, dynamicDb: number }}
 */
export function evaluateFrequencyResponse(freqHz, explosionProgress = 0, activePresetHz = 0) {
  const logF = Math.log10(Math.max(10, freqHz));

  // Respuesta Planar Magnetic 90mm:
  // Plana desde 10 Hz hasta 1.5 kHz (sellado hermético + diafragma isodinámico),
  // ganancia controlada de pabellón auditivo (pinna target Harman/Diffuse-Field) en 3.2 kHz
  // y extensión de aire Fazor hasta 50 kHz.
  const subBassExtension = -0.35 * Math.exp(-Math.pow((freqHz - 10) / 14, 2));
  const earGainPeak = 5.8 * Math.exp(-Math.pow((logF - Math.log10(3150)) / 0.24, 2));
  const presenceDip = -1.6 * Math.exp(-Math.pow((logF - Math.log10(6200)) / 0.14, 2));
  const fazorAirPeak = 3.4 * Math.exp(-Math.pow((logF - Math.log10(13800)) / 0.22, 2));
  const ultraHighRolloff = freqHz > 24000 ? -8.5 * Math.pow((logF - Math.log10(24000)) / 0.34, 1.7) : 0;

  // Efecto físico del despiece: al abrir la cámara (explosionProgress > 0), cae levemente la presión sub-grave
  // pero se revela la linealidad libre del estator en medios-altos.
  const openSealShift = explosionProgress * (-1.4 * Math.exp(-Math.pow((logF - 1.3) / 0.45, 2)) + 0.65 * Math.sin(logF * 3.1));

  // Realce localizado cuando el sintetizador está excitando una frecuencia de prueba
  let activeExcitation = 0;
  if (activePresetHz > 0) {
    const presetLog = Math.log10(activePresetHz);
    activeExcitation = 3.2 * Math.exp(-Math.pow((logF - presetLog) / 0.11, 2));
  }

  const planarDb = 98.0 + subBassExtension + earGainPeak + presenceDip + fazorAirPeak + ultraHighRolloff + openSealShift + activeExcitation;

  // Respuesta Transductor Dinámico convencional de 40mm:
  // Caída pronunciada por debajo de 55 Hz, resonancia de suspensión en 115 Hz y caída severa tras 12 kHz por ruptura modal.
  const dynSubRolloff = freqHz < 75 ? -13.5 * Math.pow((Math.log10(75) - logF) / 0.88, 1.85) : 0;
  const dynMidBassBump = 4.2 * Math.exp(-Math.pow((logF - Math.log10(118)) / 0.28, 2));
  const dynEarPeak = 4.6 * Math.exp(-Math.pow((logF - Math.log10(2700)) / 0.21, 2));
  const dynBreakupNotch = -4.8 * Math.exp(-Math.pow((logF - Math.log10(5400)) / 0.12, 2));
  const dynHighRolloff = freqHz > 9500 ? -19.5 * Math.pow((logF - Math.log10(9500)) / 0.72, 1.65) : 0;

  const dynamicDb = 96.5 + dynSubRolloff + dynMidBassBump + dynEarPeak + dynBreakupNotch + dynHighRolloff;

  return {
    planarDb,
    dynamicDb
  };
}
