/**
 * Controlador Maestro — AETHER NOVA PRO // ACOUSTIC TELEMETRY LAB
 *
 * Orquesta la integración en tiempo real entre:
 * 1. `SceneManager` (`./scene/sceneManager.js`): motor 3D WebGL2, explosión axial de 7 estratos,
 *    poses de cámara cinemáticas, modos de vista PBR/Wireframe/X-Ray, ondas acústicas y raycasting.
 * 2. `GSAP + ScrollTrigger`: coreografía de 6 capítulos narrativos a lo largo de 650vh (`scrub: 1.2`).
 * 3. `SoundEngine` (`./audio/soundEngine.js`): sintetizador procedural Web Audio API con AnalyserNode.
 * 4. Interfaz Cyber-Luxury HUD: barra de telemetría superior, Stratum Dock lateral, callouts 3D
 *    proyectados, tarjeta de inspección de componente con analizador de curva de respuesta en
 *    frecuencia (10 Hz - 50 kHz) y slider manual de despiece rápido.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SceneManager } from './scene/sceneManager.js';
import { SoundEngine } from './audio/soundEngine.js';
import {
  COLOR_THEMES,
  STRATA_SPECS,
  COMPONENT_CATALOG,
  SCROLL_CHAPTERS,
  evaluateFrequencyResponse
} from './data/headsetSpecs.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Distancia axial física máxima del despiece completo en milímetros.
 */
const MAX_AXIAL_OPENING_MM = 184.0;

/**
 * Interpola linealmente dos vectores 3D `[x, y, z]`.
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} t
 * @returns {number[]}
 */
function lerpVec3(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

/**
 * Aplica suavizado hermite cúbico (`smoothstep`) a un factor `t` en `[0, 1]`.
 * @param {number} t
 * @returns {number}
 */
function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

class TelemetryLabApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.calloutLayer = document.getElementById('callout-layer');
    this.freqCanvas = document.getElementById('frequency-chart-canvas');
    this.freqCtx = this.freqCanvas ? this.freqCanvas.getContext('2d') : null;

    // Estado reactivo de la aplicación
    this.explosionProgress = 0.0;
    this.currentChapterIndex = 0;
    this.selectedStratum = 0;
    this.selectedPartId = null;
    this.activeThemeKey = 'cyber-cyan';
    this.activeRenderMode = 'pbr';
    this.isManualScrubbing = false;
    this.autoExplodeTween = null;

    /** @type {Map<string, HTMLElement>} */
    this.calloutElements = new Map();

    // Instancia del motor de síntesis acústica Web Audio API
    this.soundEngine = new SoundEngine();

    // Instancia del motor 3D WebGL2 respetando el contrato de integración
    this.sceneManager = new SceneManager(this.canvas, {
      onPartSelect: (partData) => this.handlePartSelect(partData),
      onAnchorProject: (anchors) => this.handleAnchorProject(anchors)
    });

    this.initDOMReferences();
    this.bindUIEvents();
    this.initScrollChoreography();
    this.updateInspectorWithStratum(0, false);
    this.startTelemetryLoop();
  }

  /**
   * Cachea las referencias a nodos DOM del HUD para actualizaciones de 60 FPS sin reflujos costosos.
   */
  initDOMReferences() {
    this.dom = {
      explosionPct: document.getElementById('hud-explosion-pct'),
      axialMm: document.getElementById('hud-axial-mm'),
      activeStratum: document.getElementById('hud-active-stratum'),
      engineStats: document.getElementById('hud-engine-stats'),
      inspectorCode: document.getElementById('inspector-code'),
      inspectorTitle: document.getElementById('inspector-title'),
      inspectorMaterial: document.getElementById('inspector-material'),
      inspectorDescription: document.getElementById('inspector-description'),
      inspectorMetricsGrid: document.getElementById('inspector-metrics-grid'),
      analyzerLiveBadge: document.getElementById('analyzer-live-badge'),
      scrubChapterIndicator: document.getElementById('scrub-chapter-indicator'),
      manualSlider: document.getElementById('manual-explode-slider'),
      btnAutoExplode: document.getElementById('btn-auto-explode'),
      btnAudioToggle: document.getElementById('btn-audio-toggle'),
      btnAudioLabel: document.getElementById('btn-audio-label'),
      btnResetFocus: document.getElementById('btn-reset-focus'),
      hudTopBar: document.getElementById('hud-top-bar'),
      componentInspector: document.getElementById('component-inspector'),
      btnMobileMenu: document.getElementById('btn-mobile-menu'),
      btnMobileInspector: document.getElementById('btn-mobile-inspector'),
      btnCloseInspector: document.getElementById('btn-close-inspector'),
      renderModeBtns: Array.from(document.querySelectorAll('[data-render-mode]')),
      themeBtns: Array.from(document.querySelectorAll('[data-theme-key]')),
      audioPresetBtns: Array.from(document.querySelectorAll('[data-audio-preset]')),
      stratumBtns: Array.from(document.querySelectorAll('.stratum-btn')),
      chapterSections: Array.from(document.querySelectorAll('.scroll-chapter'))
    };
  }

  /**
   * Conecta los eventos interactivos del HUD (modos de vista, temas, estratos, slider manual y audio).
   */
  bindUIEvents() {
    // 1. Selector de Modo de Renderizado ([PBR STUDIO], [CAD WIREFRAME], [X-RAY LAYER])
    this.dom.renderModeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-render-mode');
        if (!mode) return;

        this.activeRenderMode = mode;
        this.dom.renderModeBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
        this.sceneManager.setRenderMode(mode);
        this.soundEngine.playMechanicalClick('mode');
      });
    });

    // 2. Selector de Tema Lumínico ([CYBER CYAN], [AMBER LAB], [PHANTOM VIOLET])
    this.dom.themeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const themeKey = btn.getAttribute('data-theme-key');
        if (!themeKey || !COLOR_THEMES[themeKey]) return;

        this.activeThemeKey = themeKey;
        document.body.setAttribute('data-theme', themeKey);
        this.dom.themeBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
        this.sceneManager.setColorTheme(themeKey);
        this.soundEngine.playMechanicalClick('mode');
      });
    });

    // 3. Botón principal del Sintetizador Acústico en Vivo ([TEST 90MM PLANAR AUDIO])
    if (this.dom.btnAudioToggle) {
      this.dom.btnAudioToggle.addEventListener('click', () => {
        const playing = this.soundEngine.toggleTestAudio();
        this.syncAudioUIState(playing);
      });
    }

    // 4. Botones de frecuencia del banco de pruebas (20 Hz, 440 Hz, 14 kHz)
    this.dom.audioPresetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetId = btn.getAttribute('data-audio-preset');
        const freqHz = Number(btn.getAttribute('data-freq-hz') || 28);

        this.dom.audioPresetBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
        this.soundEngine.setPreset(presetId, freqHz);

        if (!this.soundEngine.isTestPlaying) {
          this.soundEngine.startTestAudio(presetId);
        }
        this.syncAudioUIState(this.soundEngine.isTestPlaying);
      });
    });

    // 5. Matriz Lateral de los 7 Estratos (Stratum Inspector Dock: ALL, S1..S7)
    this.dom.stratumBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const stratumIdx = Number(btn.getAttribute('data-stratum') || 0);
        this.selectStratum(stratumIdx, true);
      });
    });

    // 6. Botón [RESET VIEW] en la tarjeta de inspección
    if (this.dom.btnResetFocus) {
      this.dom.btnResetFocus.addEventListener('click', () => {
        this.selectStratum(0, true);
      });
    }

    // 7. Slider Manual de Despiece Rápido (0% a 100%)
    if (this.dom.manualSlider) {
      this.dom.manualSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value) / 100;
        this.isManualScrubbing = true;

        if (this.autoExplodeTween) {
          this.autoExplodeTween.kill();
          this.autoExplodeTween = null;
        }

        this.applyExplosionProgress(val, false);
        this.soundEngine.playMechanicalClick('scrub');

        // Sincronizar posición de scroll de la ventana de forma silenciosa
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 0) {
          window.scrollTo({ top: val * maxScroll, behavior: 'instant' });
        }

        window.clearTimeout(this.manualScrubTimeout);
        this.manualScrubTimeout = window.setTimeout(() => {
          this.isManualScrubbing = false;
        }, 180);
      });
    }

    // 8. Botón [AUTO-EXPLODE / ASSEMBLE]
    if (this.dom.btnAutoExplode) {
      this.dom.btnAutoExplode.addEventListener('click', () => {
        this.soundEngine.playMechanicalClick('stratum');
        const targetProgress = this.explosionProgress < 0.5 ? 1.0 : 0.0;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

        if (this.autoExplodeTween) {
          this.autoExplodeTween.kill();
        }

        const proxy = { p: this.explosionProgress };
        this.autoExplodeTween = gsap.to(proxy, {
          p: targetProgress,
          duration: 2.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (maxScroll > 0) {
              window.scrollTo(0, proxy.p * maxScroll);
            } else {
              this.applyExplosionProgress(proxy.p, true);
            }
          }
        });
      });
    }

    // 9. Alternador de Menú Móvil Táctico ([MENÚ] // [CERRAR])
    if (this.dom.btnMobileMenu && this.dom.hudTopBar) {
      this.dom.btnMobileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.dom.hudTopBar.classList.toggle('is-mobile-menu-open');
        this.dom.btnMobileMenu.setAttribute('aria-expanded', String(isOpen));
        this.dom.btnMobileMenu.textContent = isOpen ? '[CERRAR]' : '[MENÚ]';
      });
    }

    // 10. Alternador de Panel de Especificaciones en Móvil ([SPECS])
    if (this.dom.btnMobileInspector && this.dom.componentInspector) {
      this.dom.btnMobileInspector.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.dom.componentInspector.classList.toggle('is-mobile-open');
        this.dom.btnMobileInspector.classList.toggle('is-active', isOpen);
      });
    }

    // 11. Botón Cerrar Inspector ([X])
    if (this.dom.btnCloseInspector && this.dom.componentInspector) {
      this.dom.btnCloseInspector.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dom.componentInspector.classList.remove('is-mobile-open');
        if (this.dom.btnMobileInspector) {
          this.dom.btnMobileInspector.classList.remove('is-active');
        }
      });
    }

    // 12. Cerrar menú desplegable al hacer clic fuera del panel superior
    document.addEventListener('click', (e) => {
      if (this.dom.hudTopBar && this.dom.hudTopBar.classList.contains('is-mobile-menu-open')) {
        if (!this.dom.hudTopBar.contains(e.target)) {
          this.dom.hudTopBar.classList.remove('is-mobile-menu-open');
          if (this.dom.btnMobileMenu) {
            this.dom.btnMobileMenu.setAttribute('aria-expanded', 'false');
            this.dom.btnMobileMenu.textContent = '[MENÚ]';
          }
        }
      }
    });
  }

  /**
   * Actualiza los indicadores visuales del HUD y las ondas acústicas 3D cuando
   * el sintetizador Web Audio API se activa o detiene.
   *
   * @param {boolean} isPlaying
   */
  syncAudioUIState(isPlaying) {
    if (this.dom.btnAudioToggle) {
      this.dom.btnAudioToggle.classList.toggle('is-playing', isPlaying);
    }
    if (this.dom.btnAudioLabel) {
      this.dom.btnAudioLabel.textContent = isPlaying
        ? `[SYNTH ACTIVE // ${this.soundEngine.activeFrequencyHz} HZ]`
        : '[TEST 90MM PLANAR AUDIO]';
    }
    if (this.dom.analyzerLiveBadge) {
      this.dom.analyzerLiveBadge.textContent = isPlaying
        ? `LIVE SYNTH // ${this.soundEngine.activeFrequencyHz} HZ`
        : 'IDLE TELEMETRY';
      this.dom.analyzerLiveBadge.classList.toggle('is-live', isPlaying);
    }

    const waveIntensity = isPlaying ? 1.0 : this.getChapterAcousticIntensity();
    this.sceneManager.setAcousticWaveIntensity(
      waveIntensity,
      this.soundEngine.activeFrequencyHz
    );
  }

  /**
   * Configura GSAP ScrollTrigger sobre `#scroll-container` (`scrub: 1.2`)
   * para coreografiar los 6 capítulos narrativos a lo largo de los `650vh`.
   */
  initScrollChoreography() {
    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      onUpdate: (self) => {
        if (this.isManualScrubbing) return;
        this.applyScrollProgress(self.progress);
      }
    });
  }

  /**
   * Traduce el progreso global de scroll (`0.0` a `1.0`) al estado de explosión,
   * pose de cámara interpolada entre capítulos y estrato activo.
   *
   * @param {number} scrollProgress
   */
  applyScrollProgress(scrollProgress) {
    const clampedScroll = Math.max(0, Math.min(1, scrollProgress));

    // Determinar el capítulo activo según `scrollRange`
    let chapterIdx = SCROLL_CHAPTERS.findIndex(
      (ch) => clampedScroll >= ch.scrollRange[0] && clampedScroll <= ch.scrollRange[1]
    );
    if (chapterIdx === -1) {
      chapterIdx = clampedScroll > 0.5 ? SCROLL_CHAPTERS.length - 1 : 0;
    }

    const chapter = SCROLL_CHAPTERS[chapterIdx];
    const [rStart, rEnd] = chapter.scrollRange;
    const localT = smoothstep((clampedScroll - rStart) / Math.max(0.0001, rEnd - rStart));

    // Calcular el progreso de explosión interpolado dentro del capítulo
    const [eStart, eEnd] = chapter.explosionRange;
    const explosion = eStart + (eEnd - eStart) * localT;

    // Interpolar suavemente la cámara hacia el capítulo siguiente en el último tramo del capítulo actual
    const nextChapter = SCROLL_CHAPTERS[Math.min(SCROLL_CHAPTERS.length - 1, chapterIdx + 1)];
    const camPos = lerpVec3(chapter.camera.position, nextChapter.camera.position, localT * 0.65);
    const camTarget = lerpVec3(chapter.camera.target, nextChapter.camera.target, localT * 0.65);
    const camFov =
      chapter.camera.fov + (nextChapter.camera.fov - chapter.camera.fov) * (localT * 0.65);

    this.sceneManager.setCameraPose({
      position: camPos,
      target: camTarget,
      fov: camFov
    });

    if (chapterIdx !== this.currentChapterIndex) {
      this.currentChapterIndex = chapterIdx;
      this.highlightActiveChapter(chapterIdx);
    }

    this.applyExplosionProgress(explosion, false);
  }

  /**
   * Aplica directamente un factor de explosión (`0.0` a `1.0`) al modelo 3D y a los indicadores HUD.
   *
   * @param {number} progress
   * @param {boolean} updateCamera
   */
  applyExplosionProgress(progress, updateCamera = false) {
    this.explosionProgress = Math.max(0, Math.min(1, progress));
    this.sceneManager.setExplosionState(this.explosionProgress);

    // Si el sintetizador manual no está forzado, ajustar intensidad de ondas acústicas según apertura
    if (!this.soundEngine.isTestPlaying) {
      const baseIntensity = this.getChapterAcousticIntensity();
      this.sceneManager.setAcousticWaveIntensity(
        baseIntensity,
        this.soundEngine.activeFrequencyHz
      );
    }

    if (updateCamera) {
      const chapter = SCROLL_CHAPTERS[this.currentChapterIndex] || SCROLL_CHAPTERS[0];
      this.sceneManager.setCameraPose(chapter.camera);
    }

    // Actualizar lecturas numéricas de telemetría
    const pctText = (this.explosionProgress * 100).toFixed(1).padStart(4, '0') + '%';
    const mmText =
      (this.explosionProgress * MAX_AXIAL_OPENING_MM).toFixed(1).padStart(5, '0') + ' mm';

    if (this.dom.explosionPct) {
      this.dom.explosionPct.textContent = pctText;
    }
    if (this.dom.axialMm) {
      this.dom.axialMm.textContent = mmText;
    }
    if (this.dom.manualSlider && !this.isManualScrubbing) {
      this.dom.manualSlider.value = String((this.explosionProgress * 100).toFixed(1));
    }
  }

  /**
   * Marca visualmente el capítulo narrativo actual en el DOM y en el pie del HUD.
   *
   * @param {number} chapterIdx
   */
  highlightActiveChapter(chapterIdx) {
    const chapter = SCROLL_CHAPTERS[chapterIdx];
    if (!chapter) return;

    this.dom.chapterSections.forEach((sec, idx) => {
      sec.classList.toggle('is-active', idx === chapterIdx);
    });

    if (this.dom.scrubChapterIndicator) {
      this.dom.scrubChapterIndicator.textContent = `CHP ${chapter.number} // ${chapter.title.split('//').pop().trim()}`;
    }

    // Si el usuario no ha bloqueado manualmente una pieza individual, sincronizar el inspector con el estrato del capítulo
    if (!this.selectedPartId) {
      this.updateInspectorWithStratum(chapter.activeStratum, false);
    }
  }

  /**
   * Retorna la intensidad de onda acústica correspondiente al capítulo actual.
   * @returns {number}
   */
  getChapterAcousticIntensity() {
    const chapter = SCROLL_CHAPTERS[this.currentChapterIndex];
    return chapter ? chapter.acousticIntensity : 0.25;
  }

  /**
   * Aísla un estrato (`0` para todos, `1..7` para un estrato específico) en el visor 3D
   * y actualiza la ficha de ingeniería.
   *
   * @param {number} stratumIndex
   * @param {boolean} moveCamera
   */
  selectStratum(stratumIndex, moveCamera = true) {
    this.selectedStratum = stratumIndex;
    this.selectedPartId = null;

    this.sceneManager.focusStratum(stratumIndex);
    this.soundEngine.playMechanicalClick('stratum');

    // Si estamos en 0% de explosión y el usuario selecciona un estrato interno, abrir suavemente a 65%
    if (stratumIndex > 0 && this.explosionProgress < 0.28) {
      this.applyExplosionProgress(0.65, false);
      if (this.dom.manualSlider) {
        this.dom.manualSlider.value = '65';
      }
    }

    this.updateInspectorWithStratum(stratumIndex, moveCamera);
  }

  /**
   * Rellena la tarjeta de inspección lateral con los datos del estrato indicado.
   *
   * @param {number} stratumIndex
   * @param {boolean} moveCamera
   */
  updateInspectorWithStratum(stratumIndex, moveCamera = false) {
    const spec = STRATA_SPECS.find((s) => s.index === stratumIndex) || STRATA_SPECS[0];

    this.dom.stratumBtns.forEach((btn) => {
      const idx = Number(btn.getAttribute('data-stratum') || 0);
      btn.classList.toggle('is-active', idx === stratumIndex);
    });

    if (this.dom.activeStratum) {
      this.dom.activeStratum.textContent = `S${spec.index} // ${spec.navLabel}`;
    }
    if (this.dom.inspectorCode) {
      this.dom.inspectorCode.textContent = spec.code;
    }
    if (this.dom.inspectorTitle) {
      this.dom.inspectorTitle.textContent = spec.name;
    }
    if (this.dom.inspectorMaterial) {
      this.dom.inspectorMaterial.textContent = spec.materialSummary;
    }
    if (this.dom.inspectorDescription) {
      this.dom.inspectorDescription.textContent = spec.description;
    }

    this.renderMetricsGrid(spec.metrics);

    if (moveCamera && spec.defaultCamera) {
      this.sceneManager.setCameraPose(spec.defaultCamera);
    }
  }

  /**
   * Callback invocado por `SceneManager` cuando el usuario hace clic sobre una pieza 3D
   * o selecciona un marcador proyectado.
   *
   * @param {{ id: string, name?: string, stratum?: number, code?: string, description?: string, metrics?: Array<{label: string, value: string}> } | null} partData
   */
  handlePartSelect(partData) {
    if (!partData) {
      this.selectedPartId = null;
      this.updateInspectorWithStratum(this.selectedStratum, false);
      return;
    }

    this.selectedPartId = partData.id;
    this.soundEngine.playMechanicalClick('select');

    const catalogEntry = COMPONENT_CATALOG[partData.id] || {};
    const stratumIdx = partData.stratum ?? catalogEntry.stratum ?? 0;
    const stratumSpec = STRATA_SPECS.find((s) => s.index === stratumIdx) || STRATA_SPECS[0];

    const code = partData.code || catalogEntry.code || `PRT // STRATUM 0${stratumIdx}`;
    const name = partData.name || catalogEntry.name || stratumSpec.name;
    const description = partData.description || catalogEntry.description || stratumSpec.description;
    const metrics = partData.metrics || catalogEntry.metrics || stratumSpec.metrics;

    if (this.dom.activeStratum) {
      this.dom.activeStratum.textContent = `S${stratumIdx} // ${code.split('//')[0].trim()}`;
    }
    if (this.dom.inspectorCode) {
      this.dom.inspectorCode.textContent = code;
    }
    if (this.dom.inspectorTitle) {
      this.dom.inspectorTitle.textContent = name;
    }
    if (this.dom.inspectorMaterial) {
      this.dom.inspectorMaterial.textContent = stratumSpec.materialSummary;
    }
    if (this.dom.inspectorDescription) {
      this.dom.inspectorDescription.textContent = description;
    }

    this.dom.stratumBtns.forEach((btn) => {
      const idx = Number(btn.getAttribute('data-stratum') || 0);
      btn.classList.toggle('is-active', idx === stratumIdx);
    });

    this.renderMetricsGrid(metrics);

    if (window.innerWidth <= 768 && this.dom.componentInspector) {
      this.dom.componentInspector.classList.add('is-mobile-open');
      if (this.dom.btnMobileInspector) {
        this.dom.btnMobileInspector.classList.add('is-active');
      }
    }
  }

  /**
   * Actualiza las 4 celdas de métricas técnicas en la tarjeta de inspección.
   *
   * @param {Array<{ label: string, value: string }>} metrics
   */
  renderMetricsGrid(metrics = []) {
    if (!this.dom.inspectorMetricsGrid) return;

    this.dom.inspectorMetricsGrid.innerHTML = metrics
      .slice(0, 4)
      .map(
        (m) => `
        <div class="metric-box">
          <span class="metric-label">${m.label}</span>
          <strong class="metric-val">${m.value}</strong>
        </div>
      `
      )
      .join('');
  }

  /**
   * Callback invocado en cada frame por `SceneManager` con las coordenadas proyectadas en pantalla
   * de los anclajes 3D (`{ id, label, code, stratum, spec, x, y, visible }`).
   *
   * @param {Array<{ id: string, label: string, code: string, stratum: number, spec?: string, x: number, y: number, visible: boolean }>} anchors
   */
  handleAnchorProject(anchors) {
    if (!this.calloutLayer || !Array.isArray(anchors)) return;

    // Mostrar los callouts de forma progresiva conforme el casco se descompone (explosionProgress > 0.14)
    const showCallouts = this.explosionProgress > 0.14 || this.selectedStratum > 0;

    anchors.forEach((anchor) => {
      let pinEl = this.calloutElements.get(anchor.id);

      if (!pinEl) {
        pinEl = document.createElement('div');
        pinEl.className = 'callout-pin is-hidden';
        pinEl.innerHTML = `
          <span class="callout-node"></span>
          <span class="callout-line"></span>
          <div class="callout-tag">
            <span class="callout-code"></span>
            <span class="callout-label"></span>
          </div>
        `;

        pinEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.sceneManager.focusStratum(anchor.stratum || 0);
          this.handlePartSelect({
            id: anchor.id,
            name: anchor.label,
            code: anchor.code,
            stratum: anchor.stratum,
            description: anchor.spec
          });
        });

        this.calloutLayer.appendChild(pinEl);
        this.calloutElements.set(anchor.id, pinEl);
      }

      const codeEl = pinEl.querySelector('.callout-code');
      const labelEl = pinEl.querySelector('.callout-label');
      if (codeEl && codeEl.textContent !== anchor.code) {
        codeEl.textContent = anchor.code || `S0${anchor.stratum}`;
      }
      if (labelEl && labelEl.textContent !== anchor.label) {
        labelEl.textContent = anchor.label;
      }

      const stratumMatch =
        this.selectedStratum === 0 || anchor.stratum === this.selectedStratum;
      const vw = window.innerWidth || 1440;
      const vh = window.innerHeight || 900;
      const inSafeViewport =
        anchor.x > 245 &&
        anchor.x < vw - 495 &&
        anchor.y > 90 &&
        anchor.y < vh - 95 &&
        !(anchor.x < 680 && anchor.y > vh - 310);

      const isVisible = showCallouts && anchor.visible && stratumMatch && inSafeViewport;

      if (isVisible) {
        pinEl.classList.remove('is-hidden');
        pinEl.style.transform = `translate3d(${anchor.x.toFixed(1)}px, ${anchor.y.toFixed(1)}px, 0)`;
      } else {
        pinEl.classList.add('is-hidden');
      }
    });
  }

  /**
   * Dibuja en el `<canvas id="frequency-chart-canvas">` la curva armónica
   * Planar Magnetic de 90 mm vs Dinámico convencional (10 Hz - 50 kHz) junto con
   * el oscilograma en tiempo real del sintetizador Web Audio API.
   *
   * @param {number} timeSec
   */
  renderFrequencyResponseChart(timeSec) {
    if (!this.freqCtx || !this.freqCanvas) return;

    const ctx = this.freqCtx;
    const width = this.freqCanvas.width;
    const height = this.freqCanvas.height;
    const theme = COLOR_THEMES[this.activeThemeKey] || COLOR_THEMES['cyber-cyan'];

    ctx.clearRect(0, 0, width, height);

    // 1. Retícula logarítmica de laboratorio (10 Hz, 100 Hz, 1 kHz, 10 kHz, 50 kHz)
    ctx.strokeStyle = 'rgba(148, 175, 215, 0.12)';
    ctx.lineWidth = 1;

    const freqMarks = [10, 100, 1000, 10000, 50000];
    const minLog = Math.log10(10);
    const maxLog = Math.log10(50000);

    freqMarks.forEach((f) => {
      const x = ((Math.log10(f) - minLog) / (maxLog - minLog)) * (width - 28) + 14;
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x, height - 18);
      ctx.stroke();

      ctx.fillStyle = 'rgba(155, 176, 207, 0.65)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const label = f >= 1000 ? `${f / 1000}k` : `${f}Hz`;
      ctx.fillText(label, x, height - 5);
    });

    // Líneas horizontales de presión sonora (dB SPL)
    for (let row = 0; row < 4; row++) {
      const y = 14 + row * ((height - 34) / 3);
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
    }

    const audioSample = this.soundEngine.sampleTelemetry(timeSec);
    const activePresetHz = audioSample.isLive ? audioSample.activeFrequencyHz : 0;

    const mapDbToY = (db) => {
      // Mapea rango [72 dB .. 108 dB] al alto útil del gráfico
      const norm = (db - 72) / (108 - 72);
      return height - 22 - Math.max(0, Math.min(1, norm)) * (height - 36);
    };

    const samples = 96;

    // 2. Curva de Transductor Dinámico Convencional de 40mm (línea punteada secundaria)
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 1.4;

    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const freq = Math.pow(10, minLog + u * (maxLog - minLog));
      const { dynamicDb } = evaluateFrequencyResponse(freq, this.explosionProgress, 0);
      const x = 14 + u * (width - 28);
      const y = mapDbToY(dynamicDb);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Curva del Motor Planar Magnetic Uniforce de 90mm (línea sólida con área rellena)
    ctx.save();
    ctx.beginPath();
    const planarPoints = [];

    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const freq = Math.pow(10, minLog + u * (maxLog - minLog));
      const { planarDb } = evaluateFrequencyResponse(
        freq,
        this.explosionProgress,
        activePresetHz
      );

      // Si el sintetizador está activo, superponer la vibración armónica medida por el AnalyserNode
      const waveIdx = Math.min(
        audioSample.waveform.length - 1,
        Math.floor(u * audioSample.waveform.length)
      );
      const liveRipple = audioSample.isLive ? audioSample.waveform[waveIdx] * 2.8 : 0;

      const x = 14 + u * (width - 28);
      const y = mapDbToY(planarDb + liveRipple);
      planarPoints.push({ x, y });

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Relleno degradado bajo la curva Planar Magnetic
    if (planarPoints.length > 1) {
      ctx.lineTo(planarPoints[planarPoints.length - 1].x, height - 20);
      ctx.lineTo(planarPoints[0].x, height - 20);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 10, 0, height - 20);
      grad.addColorStop(0, theme.glow);
      grad.addColorStop(1, 'rgba(7, 9, 14, 0.0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.restore();

    // 4. Marcador luminoso de la frecuencia excitada cuando el test de audio está activo
    if (activePresetHz > 0) {
      const uFreq = (Math.log10(activePresetHz) - minLog) / (maxLog - minLog);
      const markerX = 14 + Math.max(0, Math.min(1, uFreq)) * (width - 28);
      const { planarDb } = evaluateFrequencyResponse(
        activePresetHz,
        this.explosionProgress,
        activePresetHz
      );
      const markerY = mapDbToY(planarDb);

      ctx.save();
      ctx.strokeStyle = theme.secondary;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(markerX, 8);
      ctx.lineTo(markerX, height - 20);
      ctx.stroke();

      ctx.fillStyle = theme.secondary;
      ctx.beginPath();
      ctx.arc(markerX, markerY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Bucle de telemetría del HUD para actualizar FPS, conteo de triángulos y
   * el analizador de respuesta en frecuencia en sincronía con el visor 3D.
   */
  startTelemetryLoop() {
    let lastStatsUpdate = 0;

    const tick = (nowMs) => {
      const timeSec = nowMs * 0.001;

      // Actualizar estadísticas del motor WebGL cada 250 ms para lectura limpia
      if (nowMs - lastStatsUpdate > 250) {
        lastStatsUpdate = nowMs;
        if (this.sceneManager && typeof this.sceneManager.getStats === 'function') {
          const stats = this.sceneManager.getStats();
          if (stats && this.dom.engineStats) {
            const fps = stats.fps || 60;
            const tris = stats.triangles
              ? `${(stats.triangles / 1000).toFixed(1)}k TRI`
              : `${stats.partsCount || 28} PRT`;
            this.dom.engineStats.textContent = `${fps} FPS // ${tris}`;
          }
        }
      }

      this.renderFrequencyResponseChart(timeSec);
      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  }
}

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TelemetryLabApp());
} else {
  new TelemetryLabApp();
}
