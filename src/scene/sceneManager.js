import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { createMaterialLibrary, COLOR_THEMES } from './materials.js';
import { buildAetherNovaHeadset } from './headsetBuilder.js';
import { createAcousticWaveSystem } from './acousticWaves.js';

/**
 * Función de suavizado polinómico de Hermite (smoothstep) para transiciones cinemáticas
 * libres de discontinuidades en velocidad al principio y final del recorrido de cada pieza.
 *
 * @param {number} min Límite inferior del intervalo.
 * @param {number} max Límite superior del intervalo.
 * @param {number} value Valor actual normalizado.
 * @returns {number} Factor interpolado en [0, 1].
 */
function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min || 1e-6)));
  return x * x * (3 - 2 * x);
}

/**
 * Orquestador central de la escena WebGL, iluminación de estudio PBR, post-procesado Bloom,
 * cinemática de explosión escalonada por estratos, raycasting de piezas e inspección técnica.
 */
export class SceneManager {
  /**
   * @param {HTMLCanvasElement} canvasElement Lienzo DOM donde se inicializa el contexto WebGL2.
   * @param {Object} [callbacks] Funciones de retorno para sincronizar el HUD 2D.
   * @param {Function} [callbacks.onPartHover] Invocado al pasar el cursor sobre un componente 3D.
   * @param {Function} [callbacks.onPartSelect] Invocado al hacer clic sobre un componente 3D.
   * @param {Function} [callbacks.onAnchorsUpdate] Recibe en cada frame las coordenadas 2D proyectadas de los 8 anclajes.
   */
  constructor(canvasElement, callbacks = {}) {
    this.canvas = canvasElement;
    this.callbacks = callbacks;

    // Estado interno de simulación y telemetría
    this.explosionProgress = 0.0;
    this.targetExplosionProgress = 0.0;
    this.waveIntensity = 0.35;
    this.frequencyHz = 440;
    this.renderMode = 'pbr';
    this.activeStratum = 0; // 0 = todos visibles al 100%, 1..7 = estrato aislado
    this.isDisposed = false;

    // Seguimiento de rendimiento (FPS y geometría)
    this.clock = new THREE.Clock();
    this.frameCount = 0;
    this.fpsAccumTime = 0;
    this.currentFps = 60;
    this.triangleCount = 0;

    // Coordenadas normalizadas del puntero para parallax y raycasting
    this.pointer = new THREE.Vector2(0, 0);
    this.smoothPointer = new THREE.Vector2(0, 0);
    this.hoveredPart = null;

    this._initRenderer();
    this._initSceneAndCamera();
    this._initLightingAndEnvironment();
    this._initHeadsetAndSystems();
    this._initPostProcessing();
    this._initInteractionEvents();

    // Arrancar bucle de renderizado
    this._animate = this._animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this._animate);
  }

  /**
   * Configura el motor WebGL con mapeo tonal ACES Filmic de cine y sombras suaves.
   */
  _initRenderer() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  /**
   * Inicializa la escena, niebla atmosférica de laboratorio y cámara con interpolación amortiguada.
   */
  _initSceneAndCamera() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080d);
    this.scene.fog = new THREE.FogExp2(0x06080d, 0.032);

    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(38, width / Math.max(1, height), 0.1, 100);
    this.camera.position.set(0, 0.45, 7.2);

    // Objetivos de interpolación cinemática de cámara
    this.cameraState = {
      currentPos: new THREE.Vector3(0, 0.45, 7.2),
      targetPos: new THREE.Vector3(0, 0.45, 7.2),
      currentLookAt: new THREE.Vector3(0, -0.1, 0),
      targetLookAt: new THREE.Vector3(0, -0.1, 0),
      currentFov: 38,
      targetFov: 38
    };
  }

  /**
   * Configura el entorno IBL mediante PMREMGenerator + RoomEnvironment y el esquema de 4 luces de estudio
   * (Key Light cálida suave, Rim Light cian cibernética, Fill Light ámbar y Top Light cenital).
   */
  _initLightingAndEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.envMapTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    this.scene.environment = this.envMapTexture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Luz principal de estudio (Key Light) con proyección de sombras suaves
    this.keyLight = new THREE.DirectionalLight(0xf8fafc, 2.6);
    this.keyLight.position.set(5.5, 7.5, 6.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 1.0;
    this.keyLight.shadow.camera.far = 22.0;
    const d = 5.5;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Contraluz lateral izquierda (Rim Light Cian) para perfilar biseles CNC y policarbonato
    this.rimLightCyan = new THREE.SpotLight(0x00f0ff, 6.5, 18, Math.PI / 3, 0.65, 1.2);
    this.rimLightCyan.position.set(-6.8, 2.4, -4.2);
    this.scene.add(this.rimLightCyan);

    // Contraluz lateral derecha (Fill/Accent Light Ámbar) para destacar titanio, cobre y batería Hot-Swap
    this.rimLightAmber = new THREE.SpotLight(0xff9e00, 5.2, 18, Math.PI / 3, 0.65, 1.2);
    this.rimLightAmber.position.set(6.8, -1.8, -3.8);
    this.scene.add(this.rimLightAmber);

    // Luz cenital suave sobre el arco de acero PVD
    this.topLight = new THREE.DirectionalLight(0x94a3b8, 1.4);
    this.topLight.position.set(0, 8.0, -2.0);
    this.scene.add(this.topLight);

    // Rejilla métrica circular en la base del laboratorio acústico
    this.labFloorGroup = new THREE.Group();
    this.labFloorGroup.position.set(0, -2.35, 0);

    const polarGrid = new THREE.PolarGridHelper(6.5, 16, 8, 64, 0x1e293b, 0x0f172a);
    polarGrid.material.transparent = true;
    polarGrid.material.opacity = 0.45;
    this.labFloorGroup.add(polarGrid);

    // Plano receptor de sombras de contacto bajo el auricular
    const shadowPlaneGeo = new THREE.PlaneGeometry(16, 16);
    shadowPlaneGeo.rotateX(-Math.PI / 2);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.42 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.receiveShadow = true;
    this.labFloorGroup.add(shadowPlane);

    this.scene.add(this.labFloorGroup);
  }

  /**
   * Instancia el catálogo de materiales PBR, el modelo CAD de 32 piezas del casco AETHER NOVA PRO
   * y el sistema de ondas acústicas holográficas.
   */
  _initHeadsetAndSystems() {
    this.materials = createMaterialLibrary(this.renderer);

    const headsetData = buildAetherNovaHeadset(this.materials);
    this.headsetGroup = headsetData.rootGroup;
    this.parts = headsetData.parts;
    this.anchors = headsetData.anchors;
    this.scene.add(this.headsetGroup);

    this.acousticSystem = createAcousticWaveSystem();
    this.scene.add(this.acousticSystem.group);

    // Cálculo inicial del recuento real de triángulos de la malla CAD
    let tris = 0;
    this.headsetGroup.traverse((obj) => {
      if (obj.isMesh && obj.geometry) {
        const index = obj.geometry.index;
        const pos = obj.geometry.attributes.position;
        if (index) tris += index.count / 3;
        else if (pos) tris += pos.count / 3;
      }
    });
    this.triangleCount = Math.round(tris);
  }

  /**
   * Configura la tubería de post-procesado con UnrealBloomPass calibrado para que únicamente
   * los anillos LED, indicadores DSP/ANC y frentes de onda acústicos emitan resplandor óptico.
   */
  _initPostProcessing() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.52, // strength
      0.45, // radius
      0.82  // threshold alto para preservar la nitidez metálica del chasis
    );
    this.composer.addPass(this.bloomPass);
  }

  /**
   * Registra los eventos de redimensionado de ventana, movimiento de puntero y selección 3D por Raycaster.
   */
  _initInteractionEvents() {
    this.raycaster = new THREE.Raycaster();

    this._onResize = () => {
      if (this.isDisposed) return;
      const width = this.canvas.clientWidth || window.innerWidth;
      const height = this.canvas.clientHeight || window.innerHeight;

      this.camera.aspect = width / Math.max(1, height);
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height, false);
      this.composer.setSize(width, height);
    };

    this._onPointerMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      this.pointer.set(x, y);
      this._performRaycast(false);
    };

    this._onClick = () => {
      this._performRaycast(true);
    };

    window.addEventListener('resize', this._onResize);
    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    this.canvas.addEventListener('click', this._onClick);
  }

  /**
   * Ejecuta intersección geométrica entre el puntero del usuario y las 32 piezas del casco.
   * @param {boolean} isClick True si proviene de un clic de selección.
   */
  _performRaycast(isClick = false) {
    if (!this.headsetGroup) return;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.headsetGroup.children, true);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const partId = hitObj.userData.partId;
      const partRecord = this.parts.find((p) => p.id === partId) || null;

      if (this.hoveredPart !== partRecord) {
        this.hoveredPart = partRecord;
        this.canvas.style.cursor = partRecord ? 'pointer' : 'default';
        if (typeof this.callbacks.onPartHover === 'function') {
          this.callbacks.onPartHover(
            partRecord
              ? {
                  id: partRecord.id,
                  name: partRecord.name,
                  stratum: partRecord.stratum
                }
              : null
          );
        }
      }

      if (isClick && partRecord && typeof this.callbacks.onPartSelect === 'function') {
        this.callbacks.onPartSelect({
          id: partRecord.id,
          name: partRecord.name,
          stratum: partRecord.stratum
        });
      }
    } else if (this.hoveredPart !== null) {
      this.hoveredPart = null;
      this.canvas.style.cursor = 'default';
      if (typeof this.callbacks.onPartHover === 'function') {
        this.callbacks.onPartHover(null);
      }
    }
  }

  /**
   * Actualiza el estado de explosión mecánico [0..1] interpolando cada componente según su
   * ventana de activación escalonada (`stageRange`) mediante `smoothstep`.
   *
   * @param {number} progress Valor continuo entre 0.0 (ensamblado compacto) y 1.0 (despiece total).
   */
  setExplosionState(progress) {
    this.targetExplosionProgress = THREE.MathUtils.clamp(progress, 0.0, 1.0);
  }

  /**
   * Aplica internamente la interpolación espacial y rotacional a todas las piezas registradas.
   * @param {number} progress Progreso suavizado actual.
   */
  _applyExplosionTransforms(progress) {
    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i];
      const [startP, endP] = part.stageRange;
      const localT = smoothstep(startP, endP, progress);

      // Interpolación lineal exacta entre posición ensamblada y posición expandida
      part.mesh.position.lerpVectors(part.assembledPos, part.explodedPos, localT);

      // Interpolación de ángulos de Euler para rotación de presentación técnica
      part.mesh.rotation.x = THREE.MathUtils.lerp(part.assembledRot.x, part.explodedRot.x, localT);
      part.mesh.rotation.y = THREE.MathUtils.lerp(part.assembledRot.y, part.explodedRot.y, localT);
      part.mesh.rotation.z = THREE.MathUtils.lerp(part.assembledRot.z, part.explodedRot.z, localT);
    }
  }

  /**
   * Define la pose objetivo de la cámara (posición, punto de interés y campo de visión).
   *
   * @param {Object} pose Configuración cinemática de cámara.
   * @param {Array<number>|THREE.Vector3} [pose.position] Coordenadas [x, y, z] de la cámara.
   * @param {Array<number>|THREE.Vector3} [pose.target] Coordenadas [x, y, z] del objetivo (lookAt).
   * @param {number} [pose.fov] Ángulo de campo visual vertical en grados.
   */
  setCameraPose({ position, target, fov } = {}) {
    if (position) {
      if (Array.isArray(position)) {
        this.cameraState.targetPos.set(position[0], position[1], position[2]);
      } else if (position.isVector3) {
        this.cameraState.targetPos.copy(position);
      } else if (typeof position.x === 'number') {
        this.cameraState.targetPos.set(position.x, position.y, position.z);
      }
    }

    if (target) {
      if (Array.isArray(target)) {
        this.cameraState.targetLookAt.set(target[0], target[1], target[2]);
      } else if (target.isVector3) {
        this.cameraState.targetLookAt.copy(target);
      } else if (typeof target.x === 'number') {
        this.cameraState.targetLookAt.set(target.x, target.y, target.z);
      }
    }

    if (typeof fov === 'number') {
      this.cameraState.targetFov = THREE.MathUtils.clamp(fov, 20, 75);
    }
  }

  /**
   * Conmuta el modo de sombreado global del motor 3D.
   * @param {'pbr' | 'wireframe' | 'xray'} mode
   */
  setRenderMode(mode) {
    this.renderMode = mode;
    this.materials.setRenderMode(mode);

    // Si había un estrato enfocado, reaplicamos el aislamiento sobre el nuevo modo
    if (this.activeStratum > 0) {
      this.focusStratum(this.activeStratum);
    }
  }

  /**
   * Ajusta la amplitud y frecuencia del campo de ondas acústicas holográficas.
   * @param {number} intensity Amplitud normalizada [0..1].
   * @param {number} [frequencyHz=440] Frecuencia en hercios.
   */
  setAcousticWaveIntensity(intensity, frequencyHz = this.frequencyHz) {
    this.waveIntensity = THREE.MathUtils.clamp(intensity, 0.0, 1.0);
    if (typeof frequencyHz === 'number') {
      this.frequencyHz = THREE.MathUtils.clamp(frequencyHz, 20, 20000);
    }
  }

  /**
   * Cambia en tiempo real el esquema de color de laboratorio (luces de acento, materiales emisivos y ondas).
   * @param {'cyber-cyan' | 'amber-lab' | 'phantom-violet'} themeKey
   */
  setColorTheme(themeKey) {
    const theme = COLOR_THEMES[themeKey] || COLOR_THEMES['cyber-cyan'];
    this.materials.setColorTheme(themeKey);
    this.acousticSystem.setColorTheme(themeKey);

    this.rimLightCyan.color.copy(theme.primary);
    this.rimLightAmber.color.copy(theme.secondary);
  }

  /**
   * Aísla visualmente uno de los 7 estratos de ingeniería para inspección de detalle,
   * o restaura la visibilidad completa cuando `stratumIndex === 0`.
   *
   * @param {number} stratumIndex Índice entero en [0..7].
   */
  focusStratum(stratumIndex) {
    this.activeStratum = stratumIndex;

    // Primero restauramos materiales base según el modo actual
    this.materials.setRenderMode(this.renderMode);

    this.parts.forEach((part) => {
      const isFocused = stratumIndex === 0 || part.stratum === stratumIndex;
      part.mesh.traverse((child) => {
        if (!child.isMesh) return;

        // Clonamos perezosamente el material por mesh solo cuando necesitamos atenuar estratos no seleccionados
        if (!child.userData.baseMaterial) {
          child.userData.baseMaterial = child.material;
        }

        if (isFocused) {
          child.material = child.userData.baseMaterial;
        } else {
          if (!child.userData.ghostMaterial) {
            child.userData.ghostMaterial = child.userData.baseMaterial.clone();
          }
          const ghostMat = child.userData.ghostMaterial;
          ghostMat.transparent = true;
          ghostMat.opacity = 0.09;
          ghostMat.depthWrite = false;
          ghostMat.wireframe = this.renderMode === 'wireframe';
          child.material = ghostMat;
        }
      });
    });
  }

  /**
   * Proyecta las posiciones 3D de los 8 puntos de anclaje al espacio de coordenadas 2D de pantalla
   * para que el HUD dibuje líneas guía SVG y etiquetas de telemetría.
   *
   * @returns {Array<Object>} Lista de anclajes con `{ id, code, title, detail, stratum, x, y, visible }`.
   */
  getProjectedAnchors() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    const projected = [];

    for (let i = 0; i < this.anchors.length; i++) {
      const anchor = this.anchors[i];
      if (!anchor.part) continue;

      anchor.part.mesh.getWorldPosition(anchor.worldPos);
      anchor.worldPos.add(anchor.localOffset);

      const ndc = anchor.worldPos.clone().project(this.camera);
      const isBehind = ndc.z > 1.0 || ndc.z < -1.0;
      const screenX = (ndc.x * 0.5 + 0.5) * width;
      const screenY = (-ndc.y * 0.5 + 0.5) * height;

      const stratumMatch = this.activeStratum === 0 || this.activeStratum === anchor.stratum;

      projected.push({
        id: anchor.id,
        code: anchor.code,
        title: anchor.title,
        label: anchor.title,
        detail: anchor.detail,
        spec: anchor.detail,
        stratum: anchor.stratum,
        partId: anchor.partId,
        x: screenX,
        y: screenY,
        ndcZ: ndc.z,
        visible: !isBehind && stratumMatch
      });
    }

    return projected;
  }

  /**
   * Devuelve métricas instantáneas de telemetría del motor 3D para el HUD de diagnóstico.
   * @returns {{ fps: number, triangles: number, partsCount: number, activeStratum: number, explosionProgress: number }}
   */
  getStats() {
    return {
      fps: this.currentFps,
      triangles: this.triangleCount,
      partsCount: this.parts.length,
      activeStratum: this.activeStratum,
      explosionProgress: this.explosionProgress
    };
  }

  /**
   * Bucle principal de animación a 60/120Hz con amortiguación exponencial independiente del framerate.
   */
  _animate() {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this._animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // Cálculo de FPS promediado cada 0.4 segundos
    this.frameCount++;
    this.fpsAccumTime += delta;
    if (this.fpsAccumTime >= 0.4) {
      this.currentFps = Math.round(this.frameCount / this.fpsAccumTime);
      this.frameCount = 0;
      this.fpsAccumTime = 0;
    }

    // 1. Amortiguación suave del estado de explosión mecánico
    const damping = 1.0 - Math.exp(-8.5 * delta);
    this.explosionProgress = THREE.MathUtils.lerp(
      this.explosionProgress,
      this.targetExplosionProgress,
      damping
    );
    this._applyExplosionTransforms(this.explosionProgress);

    // 2. Flotación orgánica sutil del ensamblaje en cámara cero-G de laboratorio
    this.headsetGroup.position.y = Math.sin(elapsedTime * 1.35) * 0.035;
    this.headsetGroup.rotation.y = Math.sin(elapsedTime * 0.45) * 0.025;

    // 3. Interpolación cinemática de cámara + micro-parallax reactivo al cursor del ratón
    this.smoothPointer.lerp(this.pointer, damping * 0.6);
    const parallaxX = this.smoothPointer.x * 0.28;
    const parallaxY = this.smoothPointer.y * 0.18;

    const desiredCamPos = this.cameraState.targetPos.clone();
    desiredCamPos.x += parallaxX;
    desiredCamPos.y += parallaxY;

    this.cameraState.currentPos.lerp(desiredCamPos, damping);
    this.cameraState.currentLookAt.lerp(this.cameraState.targetLookAt, damping);
    this.cameraState.currentFov = THREE.MathUtils.lerp(
      this.cameraState.currentFov,
      this.cameraState.targetFov,
      damping
    );

    this.camera.position.copy(this.cameraState.currentPos);
    this.camera.lookAt(this.cameraState.currentLookAt);
    if (Math.abs(this.camera.fov - this.cameraState.currentFov) > 0.05) {
      this.camera.fov = this.cameraState.currentFov;
      this.camera.updateProjectionMatrix();
    }

    // 4. Actualización del sistema de ondas acústicas y partículas de telemetría
    this.acousticSystem.update(
      elapsedTime,
      this.explosionProgress,
      this.waveIntensity,
      this.frequencyHz
    );

    // 5. Renderizado de escena con pase UnrealBloom
    this.composer.render();

    // 6. Emisión de coordenadas 2D de los 8 anclajes hacia el HUD si se proporcionó el callback
    const anchorCallback = this.callbacks.onAnchorProject || this.callbacks.onAnchorsUpdate;
    if (typeof anchorCallback === 'function') {
      anchorCallback(this.getProjectedAnchors());
    }
  }

  /**
   * Libera la memoria de GPU (geometrías, texturas, render targets) y elimina listeners del DOM.
   */
  dispose() {
    this.isDisposed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('click', this._onClick);

    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    if (this.envMapTexture) this.envMapTexture.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
