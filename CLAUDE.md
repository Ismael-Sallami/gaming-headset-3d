# CLAUDE.md — AETHER NOVA PRO // ACOUSTIC TELEMETRY LAB

## Descripción General del Proyecto
Laboratorio interactivo de telemetría acústica e inspección de ingeniería en 3D para los auriculares **AETHER NOVA PRO (90mm Planar Magnetic Wireless System)**. Combina modelado paramétrico procedural en Three.js, coreografía cinemática de despiece en 7 estratos sincronizada con GSAP ScrollTrigger, un HUD de estética *Cyber-Luxury Industrial Lab* y un sintetizador acústico en tiempo real basado en Web Audio API.

## Comandos Principales

- `npm install` — Instala las dependencias (`three`, `gsap`, `vite`).
- `npm run dev` — Inicia el servidor de desarrollo Vite en `http://localhost:5173`.
- `npm run build` — Compila y empaqueta la aplicación para producción en `dist/`.
- `npm run preview` — Sirve la compilación de producción localmente para verificación.

## Arquitectura de Módulos

```text
gaming-headset-3d/
├── index.html                  # Estructura DOM del HUD fijo, lienzos y los 6 capítulos narrativos (650vh)
├── package.json                # Manifiesto de dependencias ESM
├── vite.config.js              # Configuración de empaquetado Vite y división de chunks (Three/GSAP)
├── CLAUDE.md                   # Memoria arquitectónica y contratos de integración
└── src/
    ├── main.js                 # Controlador maestro: une SceneManager, GSAP ScrollTrigger, HUD y Audio
    ├── styles/
    │   └── main.css            # Diseño Cyber-Luxury Industrial Lab, retícula técnica y animaciones HUD
    ├── data/
    │   └── headsetSpecs.js     # Especificaciones de los 7 estratos, 28 piezas, poses de cámara y curva SPL
    ├── audio/
    │   └── soundEngine.js      # Sintetizador procedural Web Audio API, generador de tonos y AnalyserNode
    └── scene/
        ├── materials.js        # Librería de materiales PBR, metal anodizado, cobre PCB, iridiscencia y X-Ray
        ├── headsetBuilder.js   # Ensamblador paramétrico CAD de las 28 piezas con vectores de explosión
        ├── acousticWaves.js    # Propagación holográfica 3D de frentes de onda en el motor Planar de 90 mm
        └── sceneManager.js     # Motor WebGL2, cámara amortiguada, raycasting de selección y proyección 2D
```

## Contrato de Integración (`src/main.js` <-> `src/scene/sceneManager.js`)

`src/main.js` instancia `new SceneManager(canvasElement, { onPartSelect, onAnchorProject })` y se comunica mediante los siguientes métodos públicos:

1. `sceneManager.setExplosionState(progress)`
   - Recibe un `float` normalizado en el rango `[0.0, 1.0]`.
   - Desplaza axial y radialmente los 7 estratos y 28 subcomponentes según sus vectores de despiece e interpola la apertura mecánica.
2. `sceneManager.setCameraPose({ position: [x, y, z], target: [tx, ty, tz], fov })`
   - Define la pose objetivo de la cámara orbital que `SceneManager` interpola suavemente con amortiguación crítica.
3. `sceneManager.setRenderMode(mode)`
   - Alterna el modo visual de los materiales entre `'pbr'` (estudio fotorrealista), `'wireframe'` (malla técnica CAD) y `'xray'` (transparencia interna de diagnóstico).
4. `sceneManager.setAcousticWaveIntensity(intensity, frequencyHz)`
   - Controla la amplitud (`0.0` a `1.0`) y frecuencia en hercios (`20` a `14000`) de los anillos de onda acústica holográfica sobre el transductor Planar Magnetic.
5. `sceneManager.setColorTheme(themeKey)`
   - Cambia la firma lumínica de acento y emisivos 3D entre `'cyber-cyan'` (`#00f0ff`), `'amber-lab'` (`#ff9e00`) y `'phantom-violet'` (`#b84dff`).
6. `sceneManager.focusStratum(stratumIndex)`
   - Recibe `0` para mostrar todos los estratos con opacidad completa, o un entero `1..7` para aislar y destacar el estrato seleccionado atenuando el resto.
7. `sceneManager.getStats()`
   - Retorna `{ fps, triangles, partsCount, activeStratum }` para actualizar la barra superior de telemetría en vivo.
8. **Callbacks hacia el HUD**:
   - `onAnchorProject(anchors)`: Invocado en cada frame con un array de `{ id, label, code, stratum, spec, x, y, visible }` en coordenadas de pantalla (`px`) para renderizar los marcadores flotantes `#callout-layer`.
   - `onPartSelect(partData)`: Invocado al hacer clic sobre una pieza 3D con `{ id, name, stratum, code, description, metrics }` para actualizar el panel de inspección del componente.

## Convenciones de Código y Calidad
- **Cero activos externos bloqueantes**: Toda la geometría 3D y la síntesis de sonido se generan de forma paramétrica y procedural en tiempo de ejecución.
- **Sincronización híbrida Scroll + Scrub Manual**: El usuario puede desplazarse por los 6 capítulos (`650vh`) o arrastrar el deslizador de explosión manual en el pie del HUD, manteniendo sincronizados el estado del casco, la telemetría axial en milímetros y la curva de respuesta en frecuencia.
