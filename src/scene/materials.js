import * as THREE from 'three';

/**
 * Generador de texturas procedurales de alta definición mediante Canvas 2D.
 * Evita dependencias de activos externos garantizando carga instantánea y determinista
 * para superficies de ingeniería: cuero microperforado, aluminio cepillado CNC,
 * pistas conductivas planares Uniforce y sustratos de circuito impreso FR-4.
 */

/**
 * Genera un mapa de relieve (bump map) de aluminio anodizado con cepillado lineal microscópico.
 * @returns {THREE.CanvasTexture} Textura procedural con filtrado anisotrópico.
 */
function createBrushedMetalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  // Trazado estocástico de micro-surcos de mecanizado CNC
  for (let i = 0; i < 4500; i++) {
    const y = Math.random() * 512;
    const x = Math.random() * 512;
    const length = 25 + Math.random() * 90;
    const shade = Math.floor(110 + (Math.random() - 0.5) * 55);
    ctx.strokeStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.lineWidth = 0.6 + Math.random() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo((x + length) % 512, y + (Math.random() - 0.5) * 1.2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

/**
 * Genera el patrón hexagonal de microperforaciones acústicas para el cuero proteico viscoelástico.
 * @returns {THREE.CanvasTexture} Textura de relieve para almohadillas circumaurales.
 */
function createPerforatedLeatherTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base neutra con grano orgánico fino
  ctx.fillStyle = '#969696';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 9000; i++) {
    const gx = Math.random() * 512;
    const gy = Math.random() * 512;
    const val = 135 + Math.floor((Math.random() - 0.5) * 35);
    ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
    ctx.fillRect(gx, gy, 2, 2);
  }

  // Matriz regular escalonada de microperforaciones (0.7mm equivalentes)
  const spacingX = 16;
  const spacingY = 14;
  for (let row = 0; row < 512 / spacingY + 1; row++) {
    for (let col = 0; col < 512 / spacingX + 1; col++) {
      const cx = col * spacingX + (row % 2 === 0 ? 0 : spacingX * 0.5);
      const cy = row * spacingY;

      const grad = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, 4.2);
      grad.addColorStop(0, '#0a0a0a');
      grad.addColorStop(0.65, '#303030');
      grad.addColorStop(1, '#969696');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 3);
  return texture;
}

/**
 * Genera el circuito serpenteante en espiral de aluminio/oro sobre película de Mylar
 * correspondiente al diafragma Planar Magnetic Uniforce de 90mm.
 * @returns {{ map: THREE.CanvasTexture, bumpMap: THREE.CanvasTexture }}
 */
function createPlanarUniforceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Fondo polimérico Mylar translúcido oscuro
  ctx.fillStyle = '#1b2234';
  ctx.fillRect(0, 0, 1024, 1024);

  const cx = 512;
  const cy = 512;

  // Trazas concéntricas y radiales del patrón de bobina impresa Uniforce
  ctx.strokeStyle = '#e5c158';
  ctx.lineWidth = 4.5;

  for (let r = 64; r <= 460; r += 16) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Líneas de modulación de densidad de flujo (patrón diferencial Audeze/Fluxor)
  ctx.fillStyle = '#1b2234';
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillRect(-3, 55, 6, 415);
    ctx.restore();
  }

  // Bus colector perimetral chapado en oro
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, 476, 0, Math.PI * 2);
  ctx.stroke();

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, bumpMap: map };
}

/**
 * Genera la topología visual de una placa PCB multicapa FR-4 con acabado ENIG
 * (Electroless Nickel Immersion Gold), pistas diferenciales y encapsulados QFN/SMD.
 * @returns {{ map: THREE.CanvasTexture, bumpMap: THREE.CanvasTexture }}
 */
function createPCBTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Máscara de soldadura negra mate verdosa de grado aeroespacial
  ctx.fillStyle = '#071510';
  ctx.fillRect(0, 0, 1024, 1024);

  // Planos de masa de cobre subyacentes
  ctx.strokeStyle = '#0f2920';
  ctx.lineWidth = 2;
  for (let i = 0; i < 1024; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
  }

  // Pistas de señal de alta velocidad (oro ENIG)
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3.2;
  const cx = 512;
  const cy = 512;

  for (let i = 0; i < 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    const r1 = 110 + (i % 3) * 20;
    const r2 = 280 + (i % 5) * 35;
    const r3 = 440;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle + 0.08) * r2, cy + Math.sin(angle + 0.08) * r2);
    ctx.lineTo(cx + Math.cos(angle + 0.08) * r3, cy + Math.sin(angle + 0.08) * r3);
    ctx.stroke();

    // Vías metalizadas (vias)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle + 0.08) * r3, cy + Math.sin(angle + 0.08) * r3, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#050a08';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle + 0.08) * r3, cy + Math.sin(angle + 0.08) * r3, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Serigrafía técnica y pads de montaje superficial
  ctx.fillStyle = '#d4af37';
  for (let p = 0; p < 32; p++) {
    const px = cx - 95 + (p % 8) * 26;
    const py = cy - 95 + Math.floor(p / 8) * 60;
    ctx.fillRect(px, py, 12, 6);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, bumpMap: map };
}

/**
 * Genera una textura de rejilla hexagonal acústica y grabado láser concéntrico para las tapas exteriores.
 * @returns {THREE.CanvasTexture}
 */
function createAcousticMeshTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(0, 0, 512, 512);

  const r = 10;
  const dx = r * 1.732;
  const dy = r * 1.5;

  ctx.fillStyle = '#181818';
  for (let row = 0; row < 512 / dy + 2; row++) {
    for (let col = 0; col < 512 / dx + 2; col++) {
      const x = col * dx + (row % 2 === 0 ? 0 : dx * 0.5);
      const y = row * dy;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const ang = (s * Math.PI) / 3 + Math.PI / 6;
        const hx = x + Math.cos(ang) * (r * 0.72);
        const hy = y + Math.sin(ang) * (r * 0.72);
        if (s === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

/**
 * Paletas cromáticas de laboratorio para iluminación emisiva y acentos ópticos.
 */
export const COLOR_THEMES = {
  'cyber-cyan': {
    primary: new THREE.Color(0x00f0ff),
    secondary: new THREE.Color(0xff9e00),
    gelColor: new THREE.Color(0x0ea5e9)
  },
  'amber-lab': {
    primary: new THREE.Color(0xff9e00),
    secondary: new THREE.Color(0x00f0ff),
    gelColor: new THREE.Color(0xf59e0b)
  },
  'phantom-violet': {
    primary: new THREE.Color(0xa855f7),
    secondary: new THREE.Color(0x00f0ff),
    gelColor: new THREE.Color(0x8b5cf6)
  }
};

/**
 * Crea la biblioteca de materiales físicamente basados (PBR) del casco AETHER NOVA PRO.
 * Incluye métodos para alternar entre modos de visualización (PBR, Wireframe, Rayos X)
 * y temas cromáticos de telemetría.
 *
 * @param {THREE.WebGLRenderer} [renderer] Instancia del renderizador para configurar anisotropía máxima.
 * @returns {Object} Catálogo completo de materiales y controladores de estado óptico.
 */
export function createMaterialLibrary(renderer) {
  const maxAnisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 8;

  const brushedTex = createBrushedMetalTexture();
  const leatherTex = createPerforatedLeatherTexture();
  const planarTex = createPlanarUniforceTexture();
  const pcbTex = createPCBTexture();
  const meshTex = createAcousticMeshTexture();

  [brushedTex, leatherTex, planarTex.map, pcbTex.map, meshTex].forEach((tex) => {
    tex.anisotropy = maxAnisotropy;
  });

  const materials = {
    // 1. Aluminio serie 7000 mecanizado por CNC con anodizado duro grafito
    cncAluminum: new THREE.MeshPhysicalMaterial({
      name: 'cncAluminum',
      color: 0x181c24,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.5,
      clearcoatRoughness: 0.18,
      bumpMap: brushedTex,
      bumpScale: 0.012
    }),

    // 2. Titanio grado 5 cepillado para horquillas cinéticas, bisagras y tornillería Torx
    titaniumBrushed: new THREE.MeshPhysicalMaterial({
      name: 'titaniumBrushed',
      color: 0x8a95a5,
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 0.25,
      bumpMap: brushedTex,
      bumpScale: 0.008
    }),

    // 3. Acero para muelles con recubrimiento PVD negro satinado (arco estructural)
    springSteelPVD: new THREE.MeshStandardMaterial({
      name: 'springSteelPVD',
      color: 0x101216,
      metalness: 0.85,
      roughness: 0.32,
      bumpMap: brushedTex,
      bumpScale: 0.006
    }),

    // 4. Cuero proteico microperforado acústicamente transparente
    memoryFoamLeather: new THREE.MeshPhysicalMaterial({
      name: 'memoryFoamLeather',
      color: 0x111318,
      metalness: 0.04,
      roughness: 0.78,
      sheen: 0.65,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color(0x2e3440),
      bumpMap: leatherTex,
      bumpScale: 0.032
    }),

    // 5. Capa interior de gel refrigerante termoconductor (azul hielo translúcido)
    coolingGelLayer: new THREE.MeshPhysicalMaterial({
      name: 'coolingGelLayer',
      color: 0x0ea5e9,
      metalness: 0.0,
      roughness: 0.15,
      transmission: 0.72,
      ior: 1.48,
      thickness: 0.45,
      transparent: true,
      opacity: 0.85
    }),

    // 6. Policarbonato óptico moldeado por inyección para la cámara acústica trasera
    polycarbonateChamber: new THREE.MeshPhysicalMaterial({
      name: 'polycarbonateChamber',
      color: 0x0f172a,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.85,
      ior: 1.58,
      thickness: 0.6,
      transparent: true,
      opacity: 0.88
    }),

    // 7. Diafragma Planar Magnetic Uniforce (Mylar sub-micrónico con iridiscencia de película delgada)
    planarDiaphragm: new THREE.MeshPhysicalMaterial({
      name: 'planarDiaphragm',
      color: 0xe2e8f0,
      map: planarTex.map,
      bumpMap: planarTex.bumpMap,
      bumpScale: 0.015,
      metalness: 0.9,
      roughness: 0.12,
      iridescence: 0.85,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [120, 420],
      side: THREE.DoubleSide
    }),

    // 8. Anillo de tensión y bobina de aluminio revestido de cobre (CCAW)
    copperVoiceCoil: new THREE.MeshStandardMaterial({
      name: 'copperVoiceCoil',
      color: 0xd97724,
      metalness: 0.96,
      roughness: 0.16
    }),

    // 9. Matriz magnética Fluxor de Neodimio N50 niquelado de alto flujo
    neodymiumMagnet: new THREE.MeshStandardMaterial({
      name: 'neodymiumMagnet',
      color: 0xcbd5e1,
      metalness: 0.98,
      roughness: 0.10
    }),

    // 10. Sustrato de circuito impreso FR-4 negro mate con trazas doradas ENIG
    pcbSubstrate: new THREE.MeshPhysicalMaterial({
      name: 'pcbSubstrate',
      color: 0x091914,
      map: pcbTex.map,
      bumpMap: pcbTex.bumpMap,
      bumpScale: 0.01,
      metalness: 0.35,
      roughness: 0.35,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15
    }),

    // 11. Silicio negro para encapsulados de chips DSP, ANC y SoC inalámbrico
    siliconChip: new THREE.MeshStandardMaterial({
      name: 'siliconChip',
      color: 0x0b0d12,
      metalness: 0.25,
      roughness: 0.28
    }),

    // 12. Contactos chapados en oro de 24k y pines Pogo de carga
    goldContacts: new THREE.MeshStandardMaterial({
      name: 'goldContacts',
      color: 0xffc83d,
      metalness: 1.0,
      roughness: 0.08
    }),

    // 13. Espuma acústica de celda abierta y amortiguador poroso
    dampingFoam: new THREE.MeshStandardMaterial({
      name: 'dampingFoam',
      color: 0x1e222d,
      metalness: 0.05,
      roughness: 0.95,
      bumpMap: meshTex,
      bumpScale: 0.025
    }),

    // 14. Malla acústica metálica micro-tejida para el filtro anti-pop y ventilación
    acousticGrille: new THREE.MeshStandardMaterial({
      name: 'acousticGrille',
      color: 0x333c4d,
      metalness: 0.88,
      roughness: 0.34,
      bumpMap: meshTex,
      bumpScale: 0.03
    }),

    // 15. Difusor LED emisivo primario (Anillos RGB y telemetría DSP)
    rgbEmissiveCyan: new THREE.MeshStandardMaterial({
      name: 'rgbEmissiveCyan',
      color: 0x00f0ff,
      emissive: new THREE.Color(0x00f0ff),
      emissiveIntensity: 2.2,
      roughness: 0.15,
      metalness: 0.1
    }),

    // 16. Difusor LED emisivo secundario (Indicadores de batería Hot-Swap y estado ANC)
    rgbEmissiveAmber: new THREE.MeshStandardMaterial({
      name: 'rgbEmissiveAmber',
      color: 0xff9e00,
      emissive: new THREE.Color(0xff9e00),
      emissiveIntensity: 2.0,
      roughness: 0.15,
      metalness: 0.1
    })
  };

  // Respaldo de las propiedades originales de cada material para restaurar tras modos Wireframe o X-Ray
  const baseStates = new Map();
  Object.values(materials).forEach((mat) => {
    if (mat && mat.isMaterial) {
      baseStates.set(mat, {
        wireframe: mat.wireframe,
        transparent: mat.transparent,
        opacity: mat.opacity,
        depthWrite: mat.depthWrite,
        emissiveIntensity: mat.emissiveIntensity || 0
      });
    }
  });

  /**
   * Conmuta el modo global de renderizado de todos los materiales del catálogo.
   * @param {'pbr' | 'wireframe' | 'xray'} mode Modo visual activo.
   */
  materials.setRenderMode = function (mode) {
    Object.values(materials).forEach((mat) => {
      if (!mat || !mat.isMaterial) return;
      const base = baseStates.get(mat);
      if (!base) return;

      const isEmissive = mat === materials.rgbEmissiveCyan || mat === materials.rgbEmissiveAmber;

      if (mode === 'wireframe') {
        mat.wireframe = true;
        mat.transparent = true;
        mat.opacity = isEmissive ? 1.0 : 0.82;
        mat.depthWrite = true;
      } else if (mode === 'xray') {
        mat.wireframe = false;
        mat.transparent = true;
        mat.opacity = isEmissive ? 0.95 : 0.22;
        mat.depthWrite = false;
      } else {
        // Restauración íntegra del estado PBR de estudio
        mat.wireframe = base.wireframe;
        mat.transparent = base.transparent;
        mat.opacity = base.opacity;
        mat.depthWrite = base.depthWrite;
      }
      mat.needsUpdate = true;
    });
  };

  /**
   * Actualiza en caliente el esquema de color de los acentos emisivos y el gel criogénico.
   * @param {'cyber-cyan' | 'amber-lab' | 'phantom-violet'} themeKey Identificador del tema.
   */
  materials.setColorTheme = function (themeKey) {
    const theme = COLOR_THEMES[themeKey] || COLOR_THEMES['cyber-cyan'];

    materials.rgbEmissiveCyan.color.copy(theme.primary);
    materials.rgbEmissiveCyan.emissive.copy(theme.primary);

    materials.rgbEmissiveAmber.color.copy(theme.secondary);
    materials.rgbEmissiveAmber.emissive.copy(theme.secondary);

    materials.coolingGelLayer.color.copy(theme.gelColor);
  };

  return materials;
}
