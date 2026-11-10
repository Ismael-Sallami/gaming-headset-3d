import * as THREE from 'three';
import { COLOR_THEMES } from './materials.js';

/**
 * Sistema de visualización holográfica de frentes de onda acústicos planares y
 * campo de cancelación activa de ruido (ANC) por inversión de fase.
 *
 * Modela la propagación de una onda plana generada por el transductor de 90mm
 * (a diferencia de la onda esférica de un driver dinámico convencional) junto con
 * partículas suspendidas de micro-telemetría en la cámara de pruebas.
 */
export function createAcousticWaveSystem() {
  const group = new THREE.Group();
  group.name = 'AcousticWaveSystem';

  const primaryColor = COLOR_THEMES['cyber-cyan'].primary.clone();
  const secondaryColor = COLOR_THEMES['cyber-cyan'].secondary.clone();

  // Material aditivo para los anillos de propagación de onda plana
  const primaryWaveMat = new THREE.MeshBasicMaterial({
    color: primaryColor,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  // Material aditivo para la onda invertida de cancelación activa (ANC -180°)
  const ancWaveMat = new THREE.MeshBasicMaterial({
    color: secondaryColor,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    wireframe: true
  });

  // Anillos concéntricos de frente de onda en ambos ejes acústicos (Izquierda y Derecha)
  const waveRings = [];
  const ringsPerSide = 7;

  [-1, 1].forEach((side) => {
    for (let i = 0; i < ringsPerSide; i++) {
      const isAncRing = i % 2 === 1;
      const ringGeo = new THREE.TorusGeometry(0.76, isAncRing ? 0.012 : 0.008, 12, 64);
      ringGeo.rotateY(Math.PI / 2);
      ringGeo.scale(1.0, 1.06, 0.86);

      const mesh = new THREE.Mesh(ringGeo, isAncRing ? ancWaveMat.clone() : primaryWaveMat.clone());
      mesh.position.set(side * 1.6, -0.35, 0);
      group.add(mesh);

      waveRings.push({
        mesh,
        side,
        index: i,
        phaseOffset: (i / ringsPerSide) * Math.PI * 2,
        isAncRing
      });
    }
  });

  // Mallas circulares de presión sonora isofásica situadas frente a los diafragmas planares
  const fieldGrids = [];
  [-1, 1].forEach((side) => {
    const planeGeo = new THREE.RingGeometry(0.12, 0.88, 48, 8);
    planeGeo.rotateY(Math.PI / 2);
    planeGeo.scale(1.0, 1.06, 0.86);

    // Guardamos las coordenadas originales de los vértices para deformación armónica en tiempo real
    const posAttr = planeGeo.attributes.position;
    const basePositions = new Float32Array(posAttr.array.length);
    basePositions.set(posAttr.array);

    const gridMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const gridMesh = new THREE.Mesh(planeGeo, gridMat);
    gridMesh.position.set(side * 1.5, -0.35, 0);
    group.add(gridMesh);

    fieldGrids.push({
      mesh: gridMesh,
      side,
      basePositions
    });
  });

  // Nube de micro-partículas de telemetría ambiental en el espacio del laboratorio
  const particleCount = 260;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const r = 2.2 + Math.random() * 6.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.3;
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8;
    positions[i * 3 + 2] = r * Math.cos(phi);
    scales[i] = 0.4 + Math.random() * 0.6;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const particleMat = new THREE.PointsMaterial({
    color: primaryColor,
    size: 0.028,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  group.add(particles);

  /**
   * Actualiza la propagación armónica de las ondas acústicas en cada fotograma.
   *
   * @param {number} elapsedTime Tiempo acumulado en segundos.
   * @param {number} explosionProgress Progreso actual del despiece [0..1].
   * @param {number} waveIntensity Intensidad solicitada del visualizador acústico [0..1].
   * @param {number} frequencyHz Frecuencia acústica simulada en Hz (ej. 20Hz - 20000Hz).
   */
  function update(elapsedTime, explosionProgress = 0, waveIntensity = 0.5, frequencyHz = 440) {
    // Escala logarítmica de velocidad angular para representar desde sub-graves hasta ultra-agudos
    const freqFactor = THREE.MathUtils.clamp(Math.log10(Math.max(20, frequencyHz)) / 4.3, 0.25, 1.2);
    const angularSpeed = 1.6 + freqFactor * 3.8;

    // Las ondas cobran mayor protagonismo cuando el usuario abre el casco o activa el modo acústico
    const visibilityBoost = THREE.MathUtils.clamp(waveIntensity * 0.85 + explosionProgress * 0.45, 0, 1);

    // 1. Propagación axial de los anillos concéntricos desde el driver Planar (Estrato 3) hacia el oído
    const driverOriginX = THREE.MathUtils.lerp(1.60, 3.68, explosionProgress);
    const travelSpan = THREE.MathUtils.lerp(1.35, 3.35, explosionProgress);

    waveRings.forEach((ring) => {
      const cycle = (elapsedTime * angularSpeed * 0.35 + ring.index / ringsPerSide) % 1.0;
      const xPos = ring.side * (driverOriginX - cycle * travelSpan);
      ring.mesh.position.x = xPos;

      // Envolvente de amplitud sinusoidal suave (fade-in al nacer en el diafragma, fade-out al converger)
      const envelope = Math.sin(cycle * Math.PI);
      const scaleMod = 0.72 + 0.38 * Math.sin(cycle * Math.PI * 0.85) + 0.05 * Math.sin(elapsedTime * 8 + ring.phaseOffset);

      ring.mesh.scale.set(1.0, scaleMod, scaleMod);
      ring.mesh.rotation.x = elapsedTime * (ring.isAncRing ? -0.45 : 0.35) * ring.side;

      const baseAlpha = ring.isAncRing ? 0.32 : 0.48;
      ring.mesh.material.opacity = envelope * visibilityBoost * baseAlpha;
    });

    // 2. Deformación armónica de las mallas de presión frente al diafragma planar
    fieldGrids.forEach((grid) => {
      grid.mesh.position.x = grid.side * (driverOriginX - 0.22);
      grid.mesh.material.opacity = visibilityBoost * 0.28;

      const posAttr = grid.mesh.geometry.attributes.position;
      const base = grid.basePositions;
      const k = 4.5 + freqFactor * 8.0; // Número de onda espacial

      for (let i = 0; i < posAttr.count; i++) {
        const by = base[i * 3 + 1];
        const bz = base[i * 3 + 2];
        const radialDist = Math.sqrt(by * by + bz * bz);

        // Ecuación de onda estacionaria planar amortiguada en los bordes del anillo CCAW
        const displacement =
          Math.sin(radialDist * k - elapsedTime * angularSpeed * 2.2) *
          0.065 *
          visibilityBoost *
          (1.0 - radialDist * 0.55);

        posAttr.array[i * 3] = base[i * 3] + grid.side * displacement;
      }
      posAttr.needsUpdate = true;
    });

    // 3. Rotación orbital lenta del polvo telemétrico de laboratorio
    particles.rotation.y = elapsedTime * 0.035;
    particles.rotation.x = Math.sin(elapsedTime * 0.15) * 0.04;
    particleMat.opacity = 0.22 + visibilityBoost * 0.25;
  }

  /**
   * Sincroniza la paleta cromática de las ondas con el tema global de la interfaz.
   * @param {'cyber-cyan' | 'amber-lab' | 'phantom-violet'} themeKey
   */
  function setColorTheme(themeKey) {
    const theme = COLOR_THEMES[themeKey] || COLOR_THEMES['cyber-cyan'];
    waveRings.forEach((ring) => {
      ring.mesh.material.color.copy(ring.isAncRing ? theme.secondary : theme.primary);
    });
    fieldGrids.forEach((grid) => {
      grid.mesh.material.color.copy(theme.primary);
    });
    particleMat.color.copy(theme.primary);
  }

  return {
    group,
    update,
    setColorTheme
  };
}
