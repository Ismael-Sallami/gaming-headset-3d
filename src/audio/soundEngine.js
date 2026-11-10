/**
 * Motor de Síntesis Acústica Procedural (Web Audio API)
 * para AETHER NOVA PRO // ACOUSTIC TELEMETRY LAB.
 *
 * Genera toda la retroalimentación sonora de alta precisión en tiempo real
 * sin depender de archivos de audio externos (.mp3 / .wav):
 * 1. Clics mecánicos de precisión CNC al cambiar de estrato, modo de vista o pieza.
 * 2. Pulsos de telemetría sutiles durante el barrido de despiece axial.
 * 3. Banco de pruebas acústico Planar Magnetic en vivo con 3 regímenes:
 *    - 20-28 Hz Sub-Bass (excursión isodinámica profunda con armónicos pares controlados)
 *    - 440 Hz Reference (acorde armónico espacial puro con modulación de fase estéreo)
 *    - 14 kHz Fazor Air (barrido cristalino de alta frecuencia + pulso de fase ANC)
 * 4. Nodo analizador FFT real (`AnalyserNode`) para alimentar el oscilograma y la
 *    curva de respuesta en frecuencia del HUD a 60 FPS.
 */

export class SoundEngine {
  constructor() {
    /** @type {AudioContext | null} */
    this.ctx = null;

    /** @type {GainNode | null} */
    this.masterGain = null;

    /** @type {AnalyserNode | null} */
    this.analyser = null;

    /** @type {Uint8Array | null} */
    this.timeDomainData = null;

    /** @type {Uint8Array | null} */
    this.frequencyData = null;

    /** @type {boolean} */
    this.isTestPlaying = false;

    /** @type {string} */
    this.activePresetId = 'sub-bass';

    /** @type {number} */
    this.activeFrequencyHz = 28;

    /** @type {Array<AudioNode>} */
    this.activeNodes = [];

    /** @type {number | null} */
    this.pulseIntervalId = null;

    /** @type {number} */
    this.lastScrubTickTime = 0;
  }

  /**
   * Inicializa o reanuda el AudioContext bajo demanda tras un gesto del usuario.
   * @returns {AudioContext}
   */
  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.38, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.82;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Reproduce un clic mecánico de precisión inspirado en retenedores CNC
   * al interactuar con botones del HUD o seleccionar estratos/piezas.
   *
   * @param {'stratum' | 'select' | 'mode' | 'scrub'} [variant='stratum']
   */
  playMechanicalClick(variant = 'stratum') {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      if (variant === 'scrub') {
        if (now - this.lastScrubTickTime < 0.055) {
          return;
        }
        this.lastScrubTickTime = now;
      }

      const osc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';

      if (variant === 'select') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1480, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.032);
        filter.frequency.setValueAtTime(1800, now);
        filter.Q.setValueAtTime(3.2, now);
        clickGain.gain.setValueAtTime(0.14, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.036);
      } else if (variant === 'mode') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(1840, now + 0.045);
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(2.4, now);
        clickGain.gain.setValueAtTime(0.11, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      } else if (variant === 'scrub') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.014);
        filter.frequency.setValueAtTime(900, now);
        filter.Q.setValueAtTime(4.0, now);
        clickGain.gain.setValueAtTime(0.045, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);
      } else {
        // 'stratum'
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1120, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.028);
        filter.frequency.setValueAtTime(1350, now);
        filter.Q.setValueAtTime(3.5, now);
        clickGain.gain.setValueAtTime(0.13, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
      }

      osc.connect(filter);
      filter.connect(clickGain);
      clickGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Si el navegador aún bloquea el autoplay antes del primer clic, ignorar silenciosamente
    }
  }

  /**
   * Activa o detiene el sintetizador acústico en vivo del transductor Planar Magnetic de 90mm.
   *
   * @param {string} [presetId] - Identificador del preset ('sub-bass' | 'reference' | 'fazor-air')
   * @returns {boolean} Nuevo estado de reproducción
   */
  toggleTestAudio(presetId) {
    if (presetId && presetId !== this.activePresetId) {
      this.activePresetId = presetId;
      if (this.isTestPlaying) {
        this.stopTestAudio();
        this.startTestAudio(presetId);
        return true;
      }
    }

    if (this.isTestPlaying) {
      this.stopTestAudio();
      return false;
    } else {
      this.startTestAudio(this.activePresetId);
      return true;
    }
  }

  /**
   * Cambia el preset de frecuencia activo; si el banco de pruebas está encendido,
   * reconfigura la síntesis inmediatamente.
   *
   * @param {string} presetId
   * @param {number} frequencyHz
   */
  setPreset(presetId, frequencyHz) {
    this.activePresetId = presetId;
    this.activeFrequencyHz = frequencyHz;
    this.playMechanicalClick('mode');

    if (this.isTestPlaying) {
      this.stopTestAudio();
      this.startTestAudio(presetId);
    }
  }

  /**
   * Inicia la generación procedural de ondas según el preset seleccionado.
   *
   * @param {string} presetId
   */
  startTestAudio(presetId = 'sub-bass') {
    const ctx = this.ensureContext();
    this.stopTestAudio();

    this.activePresetId = presetId;
    this.isTestPlaying = true;
    const now = ctx.currentTime;

    const sessionGain = ctx.createGain();
    sessionGain.gain.setValueAtTime(0.001, now);
    sessionGain.gain.exponentialRampToValueAtTime(0.55, now + 0.18);
    sessionGain.connect(this.masterGain);
    this.activeNodes.push(sessionGain);

    if (presetId === 'sub-bass') {
      this.activeFrequencyHz = 28;

      // Oscilador fundamental sub-grave (28 Hz) + segundo armónico audible (56 Hz) + textura espacial (112 Hz)
      const subOsc = ctx.createOscillator();
      const harmOsc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const subGain = ctx.createGain();
      const harmGain = ctx.createGain();

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(28, now);

      harmOsc.type = 'triangle';
      harmOsc.frequency.setValueAtTime(56, now);

      // Modulación lenta de barrido (24 Hz a 36 Hz) para sentir la excursión planar
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.45, now);
      lfoGain.gain.setValueAtTime(6.0, now);

      subGain.gain.setValueAtTime(0.65, now);
      harmGain.gain.setValueAtTime(0.22, now);

      lfo.connect(lfoGain);
      lfoGain.connect(subOsc.frequency);
      lfoGain.connect(harmOsc.frequency);

      subOsc.connect(subGain);
      harmOsc.connect(harmGain);
      subGain.connect(sessionGain);
      harmGain.connect(sessionGain);

      subOsc.start(now);
      harmOsc.start(now);
      lfo.start(now);

      this.activeNodes.push(subOsc, harmOsc, lfo, lfoGain, subGain, harmGain);
    } else if (presetId === 'reference') {
      this.activeFrequencyHz = 440;

      // Acorde armónico espacial de calibración (220 Hz, 440 Hz A4, 659.25 Hz E5)
      const freqs = [220, 440, 659.25];
      const gains = [0.28, 0.36, 0.16];

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        osc.type = idx === 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(gains[idx], now);

        osc.connect(g);
        if (panner) {
          panner.pan.setValueAtTime((idx - 1) * 0.45, now);
          g.connect(panner);
          panner.connect(sessionGain);
          this.activeNodes.push(panner);
        } else {
          g.connect(sessionGain);
        }

        osc.start(now);
        this.activeNodes.push(osc, g);
      });
    } else {
      // 'fazor-air' (14 kHz Fazor Air + armónico cristalino)
      this.activeFrequencyHz = 14000;

      // Combinamos un portador de alta frecuencia suave (7 kHz / 11.2 kHz para ser audible en cualquier monitor)
      // con una base armónica en 880 Hz que demuestra la coherencia de fase Fazor
      const airOsc = ctx.createOscillator();
      const phaseOsc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const airGain = ctx.createGain();
      const phaseGain = ctx.createGain();

      airOsc.type = 'sine';
      airOsc.frequency.setValueAtTime(6800, now);

      phaseOsc.type = 'sine';
      phaseOsc.frequency.setValueAtTime(880, now);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(1.2, now);
      lfoGain.gain.setValueAtTime(1200, now);

      airGain.gain.setValueAtTime(0.12, now);
      phaseGain.gain.setValueAtTime(0.24, now);

      lfo.connect(lfoGain);
      lfoGain.connect(airOsc.frequency);

      airOsc.connect(airGain);
      phaseOsc.connect(phaseGain);
      airGain.connect(sessionGain);
      phaseGain.connect(sessionGain);

      airOsc.start(now);
      phaseOsc.start(now);
      lfo.start(now);

      this.activeNodes.push(airOsc, phaseOsc, lfo, lfoGain, airGain, phaseGain);
    }

    // Pulso periódico de sonar/telemetría ANC cada 2.2 segundos mientras el test está activo
    this.pulseIntervalId = window.setInterval(() => {
      if (!this.isTestPlaying || !this.ctx) return;
      const t = this.ctx.currentTime;
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();

      ping.type = 'sine';
      ping.frequency.setValueAtTime(1760, t);
      ping.frequency.exponentialRampToValueAtTime(880, t + 0.14);

      pingGain.gain.setValueAtTime(0.06, t);
      pingGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

      ping.connect(pingGain);
      pingGain.connect(this.masterGain);

      ping.start(t);
      ping.stop(t + 0.17);
    }, 2200);
  }

  /**
   * Detiene limpiamente todos los osciladores del banco de pruebas acústico.
   */
  stopTestAudio() {
    if (this.pulseIntervalId !== null) {
      window.clearInterval(this.pulseIntervalId);
      this.pulseIntervalId = null;
    }

    this.activeNodes.forEach((node) => {
      try {
        if (typeof node.stop === 'function') {
          node.stop();
        }
        node.disconnect();
      } catch {
        // Ignorar nodos ya detenidos
      }
    });

    this.activeNodes = [];
    this.isTestPlaying = false;
  }

  /**
   * Obtiene muestras de dominio temporal y frecuencial en vivo del AnalyserNode
   * para animar el oscilograma del HUD. Si el sintetizador está en reposo,
   * devuelve una onda estacionaria de telemetría de baja amplitud.
   *
   * @param {number} timeSec - Tiempo global en segundos
   * @returns {{ waveform: Float32Array, rms: number, isLive: boolean, activeFrequencyHz: number }}
   */
  sampleTelemetry(timeSec = performance.now() * 0.001) {
    const sampleCount = 64;
    const waveform = new Float32Array(sampleCount);

    if (this.isTestPlaying && this.analyser && this.timeDomainData) {
      this.analyser.getByteTimeDomainData(this.timeDomainData);
      const step = Math.floor(this.timeDomainData.length / sampleCount);
      let sumSq = 0;

      for (let i = 0; i < sampleCount; i++) {
        const normalized = (this.timeDomainData[i * step] - 128) / 128;
        waveform[i] = normalized;
        sumSq += normalized * normalized;
      }

      const rms = Math.min(1, Math.sqrt(sumSq / sampleCount) * 2.6);
      return {
        waveform,
        rms: Math.max(0.22, rms),
        isLive: true,
        activeFrequencyHz: this.activeFrequencyHz
      };
    }

    // Onda sintética de reposo para el monitor de estado del HUD
    for (let i = 0; i < sampleCount; i++) {
      const u = i / (sampleCount - 1);
      const env = Math.sin(u * Math.PI);
      waveform[i] =
        env *
        (0.18 * Math.sin(u * Math.PI * 6 - timeSec * 2.4) +
          0.08 * Math.cos(u * Math.PI * 14 + timeSec * 4.1));
    }

    return {
      waveform,
      rms: 0.12,
      isLive: false,
      activeFrequencyHz: 0
    };
  }
}
