/**
 * WebGL 3D Spacetime Distortion Engine using Three.js
 * High-performance, zero-latency reactive mesh deformation and spacecraft kinematics.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { WarpParameters } from '../physics/types';
import { volumeExpansion, energyDensity, shapeFunction } from '../physics/alcubierrePhysics';
import { createSpacecraftModel } from './spacecraftModel';

export const GravitationalLensingShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'uBubbleScreenPos': { value: new THREE.Vector2(0.5, 0.5) },
    'uLensingIntensity': { value: 0.0 },
    'uBubbleRadiusScreen': { value: 0.15 },
    'uAspectRatio': { value: 1.0 },
    'uTime': { value: 0.0 }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 uBubbleScreenPos;
    uniform float uLensingIntensity;
    uniform float uBubbleRadiusScreen;
    uniform float uAspectRatio;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 center = uBubbleScreenPos;
      vec2 delta = uv - center;
      delta.x *= uAspectRatio;
      
      float dist = length(delta);
      
      // Gravitational lensing refraction ring around the Alcubierre warp bubble walls
      float bandWidth = 0.1 * (1.0 + uLensingIntensity * 0.5);
      float edgeDist = abs(dist - uBubbleRadiusScreen);
      
      if (edgeDist < bandWidth && uLensingIntensity > 0.001) {
        float influence = smoothstep(bandWidth, 0.0, edgeDist);
        float strength = uLensingIntensity * 0.045 * influence;
        
        vec2 dir = dist > 0.0001 ? normalize(delta) : vec2(0.0, 1.0);
        dir.x /= uAspectRatio;
        
        // Relativistic chromatic dispersion (RGB channel splitting)
        vec2 uvR = uv + dir * strength * 1.35;
        vec2 uvG = uv + dir * strength * 1.0;
        vec2 uvB = uv + dir * strength * 0.65;
        
        float r = texture2D(tDiffuse, uvR).r;
        float g = texture2D(tDiffuse, uvG).g;
        float b = texture2D(tDiffuse, uvB).b;
        
        // Photon sphere glow highlight intensifying with energy multiplier
        float ringGlow = influence * uLensingIntensity * 0.45;
        gl_FragColor = vec4(r + ringGlow * 0.4, g + ringGlow * 0.75, b + ringGlow, 1.0);
      } else {
        gl_FragColor = texture2D(tDiffuse, uv);
      }
    }
  `
};

export type VisualStyle = 'checkerboard' | 'hologram' | 'heat_expansion' | 'deep_space';
export type CameraPreset = 'isometric' | 'top_down' | 'cockpit' | 'side_profile' | 'cinematic';

export class WarpSpacetimeScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private animationFrameId: number | null = null;

  // Grid mesh
  private gridBounds = 4.5;
  private resolution = 72; // 72x72 = 5,184 vertices, 60-120fps instantaneous CPU/GPU reactive update
  private gridGeometry: THREE.PlaneGeometry;
  private surfaceMesh: THREE.Mesh;
  private wireframeMesh: THREE.Mesh;
  private originalPositions: Float32Array;

  // Spacecraft
  private spacecraft: ReturnType<typeof createSpacecraftModel>;

  // Exotic energy ring (T_00 torus)
  private exoticRingMesh: THREE.Mesh;

  // Warp field geodesics / relativistic particle stream
  private streamParticles: THREE.Points;
  private particleBasePositions: Float32Array;

  // FTL Star Streaks Particle Overlay
  private starStreakCount = 750;
  private starStreaksMesh: THREE.LineSegments | null = null;
  private starStreakGeo: THREE.BufferGeometry | null = null;
  private starStreakMat: THREE.LineBasicMaterial | null = null;
  private starStreakHeadPositions: Float32Array = new Float32Array(0);
  private starStreakBaseLengths: Float32Array = new Float32Array(0);
  private starStreakSpeeds: Float32Array = new Float32Array(0);

  // Lighting
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.HemisphereLight;
  private craftPointLight: THREE.PointLight;

  // Interaction & Camera
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private cameraIdealPos = new THREE.Vector3(0, 5.5, 6.5);
  private cameraPreset: CameraPreset = 'isometric';
  private isPointerDown = false;
  private previousPointerPos = { x: 0, y: 0 };
  private orbitSpherical = { radius: 8.5, phi: 1.15, theta: -0.85 };

  // Post-processing Effect Composer & Gravitational Lensing Pass
  private composer!: EffectComposer;
  private lensingPass!: ShaderPass;

  // Current physics parameters
  private currentParams: WarpParameters;
  private lastTime = 0;
  private visualStyle: VisualStyle = 'checkerboard';
  private isPaused = false;

  // Temporary vectors to avoid GC in animation loop
  private readonly _color1 = new THREE.Color();
  private readonly _color2 = new THREE.Color();

  constructor(container: HTMLElement, initialParams: WarpParameters) {
    this.container = container;
    this.currentParams = { ...initialParams };

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030712);
    this.scene.fog = new THREE.FogExp2(0x030712, 0.045);

    // 2. Camera setup
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.updateCameraFromSpherical();

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // Effect Composer & Gravitational Lensing Post-Processing Pass
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.lensingPass = new ShaderPass(GravitationalLensingShader);
    this.composer.addPass(this.lensingPass);

    // 4. Lighting setup
    this.keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    this.keyLight.position.set(5, 12, 6);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.1);
    this.scene.add(this.fillLight);

    this.craftPointLight = new THREE.PointLight(0x06b6d4, 3.0, 6.0);
    this.scene.add(this.craftPointLight);

    // 5. Build Spacetime Surface & Wireframe Mesh
    const bounds = this.gridBounds;
    this.gridGeometry = new THREE.PlaneGeometry(
      bounds * 2,
      bounds * 2,
      this.resolution,
      this.resolution
    );
    // Orient so X is forward/backward, Y is transverse, Z is vertical displacement
    this.gridGeometry.rotateX(-Math.PI / 2);

    // Preserve flat coordinates
    this.originalPositions = new Float32Array(this.gridGeometry.attributes.position.array);

    // Setup vertex colors buffer
    const vertexCount = this.gridGeometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      colors[i * 3 + 0] = 0.08;
      colors[i * 3 + 1] = 0.25;
      colors[i * 3 + 2] = 0.55;
    }
    this.gridGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Surface Material: smooth PBR with vertex coloring and slight specular sheen
    const surfaceMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    this.surfaceMesh = new THREE.Mesh(this.gridGeometry, surfaceMaterial);
    this.scene.add(this.surfaceMesh);

    // Dual wireframe overlay for checkerboard / grid appearance like ManimGX
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    this.wireframeMesh = new THREE.Mesh(this.gridGeometry, wireframeMaterial);
    this.wireframeMesh.position.y += 0.005; // avoid z-fighting
    this.scene.add(this.wireframeMesh);

    // 6. Build Spacecraft
    this.spacecraft = createSpacecraftModel();
    this.scene.add(this.spacecraft.group);

    // 7. Exotic Matter Toroid (Visualizing T_00 concentration around equator)
    const ringGeo = new THREE.TorusGeometry(
      this.currentParams.bubbleRadius,
      0.045,
      16,
      48
    );
    ringGeo.rotateY(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444, // Red negative energy
      transparent: true,
      opacity: 0.75,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    this.exoticRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.scene.add(this.exoticRingMesh);

    // 8. Stream particles (Dust/photons being deflected by metric expansion)
    const particleCount = 450;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * bounds * 2.2;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * bounds * 2.2;
    }
    this.particleBasePositions = new Float32Array(particlePositions);
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.streamParticles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.streamParticles);

    // 9. Background Starfield
    this.createBackgroundStars();

    // 10. FTL Star Streaks Particle Overlay
    this.createStarStreaks();

    // 11. Event listeners
    this.setupInteraction();

    // 12. Initial mesh deformation
    this.updateMeshDeformation();

    // 13. Start animation loop
    this.animate = this.animate.bind(this);
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private createBackgroundStars(): void {
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 25 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
    });
    this.scene.add(new THREE.Points(starGeo, starMat));
  }

  /**
   * Initializes the FTL Star Streaks particle overlay.
   * Renders high-speed filaments that stretch and intensify as warp velocity increases.
   */
  private createStarStreaks(): void {
    const count = this.starStreakCount;
    const vertexCount = count * 2;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);

    this.starStreakHeadPositions = new Float32Array(count * 3);
    this.starStreakBaseLengths = new Float32Array(count);
    this.starStreakSpeeds = new Float32Array(count);

    const xRange = 18.0;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Layered radial distribution: inner corridor + outer interstellar field
      const isInner = Math.random() < 0.35;
      const radius = isInner
        ? 1.5 + Math.random() * 2.8
        : 4.2 + Math.random() * 9.5;

      const x = (Math.random() - 0.5) * xRange * 2.0;
      const y = radius * Math.sin(angle) + 0.3;
      const z = radius * Math.cos(angle);

      this.starStreakHeadPositions[i * 3 + 0] = x;
      this.starStreakHeadPositions[i * 3 + 1] = y;
      this.starStreakHeadPositions[i * 3 + 2] = z;

      this.starStreakBaseLengths[i] = 0.65 + Math.random() * 0.75;
      this.starStreakSpeeds[i] = 0.85 + Math.random() * 0.45;

      // Head vertex (forward in travel direction)
      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;

      // Tail vertex (backward along -X)
      positions[i * 6 + 3] = x - 0.2;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z;

      // Head Color: Luminous white/cyan
      colors[i * 6 + 0] = 1.0;
      colors[i * 6 + 1] = 1.0;
      colors[i * 6 + 2] = 1.0;

      // Tail Color: Relativistic celestial blue
      colors[i * 6 + 3] = 0.15;
      colors[i * 6 + 4] = 0.5;
      colors[i * 6 + 5] = 0.95;
    }

    this.starStreakGeo = new THREE.BufferGeometry();
    this.starStreakGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starStreakGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.starStreakMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.starStreaksMesh = new THREE.LineSegments(this.starStreakGeo, this.starStreakMat);
    this.scene.add(this.starStreaksMesh);
  }

  /**
   * Instantly recompute vertex heights and vertex colors based on current Alcubierre parameters
   * Direct WebGL BufferAttribute manipulation without recreating geometry.
   */
  public updateMeshDeformation(): void {
    const posAttr = this.gridGeometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.gridGeometry.attributes.color as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;
    const orig = this.originalPositions;
    const vertexCount = posAttr.count;

    const { bubbleRadius, wallSharpness, velocity, heightScale, xCenter } = this.currentParams;

    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      const x = orig[idx];      // X coordinate along motion axis
      const z = orig[idx + 2];  // Z is transverse horizontal in PlaneGeometry after rotateX

      // Calculate volume expansion scalar theta
      const theta = volumeExpansion(x, z, 0, xCenter, {
        bubbleRadius,
        wallSharpness,
        velocity,
      });

      // Height displacement: y in Three.js coordinate system
      const h = heightScale * theta;
      pos[idx + 1] = h; // Set vertical elevation

      // Vertex color styling based on local expansion/contraction & T_00
      if (this.visualStyle === 'checkerboard') {
        // Classic ManimGX checkerboard style with dynamic blue/cyan crest and dark blue troughs
        const cellX = Math.floor((x + this.gridBounds) * 4);
        const cellZ = Math.floor((z + this.gridBounds) * 4);
        const isAlternate = (cellX + cellZ) % 2 === 0;

        if (h > 0.04) {
          // Contraction hill / peak ahead: bright glowing cyan
          const intensity = Math.min(1.0, 0.4 + h * 1.5);
          col[idx + 0] = isAlternate ? 0.1 * intensity : 0.2 * intensity;
          col[idx + 1] = 0.7 * intensity;
          col[idx + 2] = 0.95 * intensity;
        } else if (h < -0.04) {
          // Expansion dip behind: deep indigo / violet
          const depth = Math.min(1.0, Math.abs(h) * 1.2);
          col[idx + 0] = 0.15 + depth * 0.25;
          col[idx + 1] = 0.12;
          col[idx + 2] = 0.5 + depth * 0.3;
        } else {
          // Flat undisturbed metric: classic dark-blue / blue_e from ManimGX
          if (isAlternate) {
            col[idx + 0] = 0.05;
            col[idx + 1] = 0.22;
            col[idx + 2] = 0.48;
          } else {
            col[idx + 0] = 0.03;
            col[idx + 1] = 0.15;
            col[idx + 2] = 0.35;
          }
        }
      } else if (this.visualStyle === 'heat_expansion') {
        // Red for expansion behind, blue for contraction ahead
        if (theta < -0.05) {
          // Contraction (ahead)
          const norm = Math.min(1.0, Math.abs(theta) / (velocity * 2 + 0.1));
          col[idx + 0] = 0.1;
          col[idx + 1] = 0.4 + norm * 0.5;
          col[idx + 2] = 0.9;
        } else if (theta > 0.05) {
          // Expansion (behind)
          const norm = Math.min(1.0, theta / (velocity * 2 + 0.1));
          col[idx + 0] = 0.9;
          col[idx + 1] = 0.2 + norm * 0.3;
          col[idx + 2] = 0.15;
        } else {
          // Flat
          col[idx + 0] = 0.12;
          col[idx + 1] = 0.18;
          col[idx + 2] = 0.25;
        }
      } else if (this.visualStyle === 'hologram') {
        // High-tech holographic wireframe neon
        const distFromCenter = Math.hypot(x - xCenter, z);
        const nearWall = Math.abs(distFromCenter - bubbleRadius) < 0.2;
        if (nearWall) {
          col[idx + 0] = 0.95;
          col[idx + 1] = 0.2;
          col[idx + 2] = 0.3;
        } else {
          col[idx + 0] = 0.05;
          col[idx + 1] = 0.75;
          col[idx + 2] = 0.95;
        }
      } else {
        // Deep space dark minimal
        col[idx + 0] = 0.08;
        col[idx + 1] = 0.18;
        col[idx + 2] = 0.32;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    this.gridGeometry.computeVertexNormals();

    // Update Spacecraft position and orientation (XYZ rotation)
    // Ship sits exactly at x = xCenter, Y = slight vertical offset over flat center
    this.spacecraft.group.position.set(xCenter, 0.08, 0);
    this.spacecraft.group.rotation.set(
      THREE.MathUtils.degToRad(this.currentParams.shipRotationX || 0),
      THREE.MathUtils.degToRad(this.currentParams.shipRotationY || 0),
      THREE.MathUtils.degToRad(this.currentParams.shipRotationZ || 0)
    );

    // Update Exotic Energy Ring
    this.exoticRingMesh.position.set(xCenter, 0.05, 0);
    this.exoticRingMesh.scale.set(
      bubbleRadius / 0.8,
      bubbleRadius / 0.8,
      bubbleRadius / 0.8
    );

    // Update light position
    this.craftPointLight.position.set(xCenter, 0.4, 0);
  }

  /**
   * Main render and animation loop
   */
  private animate(currentTime: number): void {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min((currentTime - this.lastTime) * 0.001, 0.1);
    this.lastTime = currentTime;

    // Freeze motion when paused to allow effortless camera framing and screenshot capture
    if (this.isPaused) {
      this.updateCameraDamping(delta);
      this.composer.render();
      return;
    }

    // Auto-cruise travel if active
    if (this.currentParams.isCruising) {
      const travelRange = 3.2;
      const speed = this.currentParams.cruiseSpeed * (this.currentParams.velocity / 1.5);
      this.currentParams.xCenter += speed * delta;

      if (this.currentParams.xCenter > travelRange) {
        this.currentParams.xCenter = -travelRange;
      }

      this.updateMeshDeformation();
    }

    // Spacecraft idle animations: warp rings rotation & exotic field pulse
    const elapsed = currentTime * 0.001;
    this.spacecraft.warpRings.forEach((ring, index) => {
      ring.rotation.x += (index % 2 === 0 ? 1 : -1) * (1.5 + this.currentParams.velocity * 0.4) * delta;
    });

    // Pulse emitter glow
    const pulseFactor = 0.8 + 0.3 * Math.sin(elapsed * 6.0 * (this.currentParams.velocity + 0.5));
    this.spacecraft.pulseEmitter.scale.set(pulseFactor, pulseFactor, pulseFactor);

    // Subtle ship floating inertia
    this.spacecraft.group.position.y = 0.08 + Math.sin(elapsed * 2.5) * 0.015;

    // Continuous auto-rotation on Y axis if enabled
    if (this.currentParams.autoRotateShip) {
      this.currentParams.shipRotationY = (this.currentParams.shipRotationY + 35 * delta) % 360;
      this.spacecraft.group.rotation.y = THREE.MathUtils.degToRad(this.currentParams.shipRotationY);
    }

    // Exotic ring pulse
    const ringMat = this.exoticRingMesh.material as THREE.MeshBasicMaterial;
    ringMat.opacity = 0.45 + 0.35 * Math.sin(elapsed * 4.0);

    // Relativistic dust stream particles deformation
    this.animateParticles(delta);

    // FTL Star Streaks Particle Overlay (stretches & intensifies with velocity)
    this.animateStarStreaks(delta);

    // Smooth camera damping
    this.updateCameraDamping(delta);

    // Update gravitational lensing uniforms (intensifying with exotic energy multiplier & velocity)
    if (this.lensingPass) {
      const bubbleWorldPos = new THREE.Vector3(this.currentParams.xCenter, 0, 0);
      bubbleWorldPos.project(this.camera);
      const screenX = (bubbleWorldPos.x + 1) * 0.5;
      const screenY = (bubbleWorldPos.y + 1) * 0.5;

      this.lensingPass.uniforms['uBubbleScreenPos'].value.set(screenX, screenY);
      const energyMult = this.currentParams.exoticEnergyMultiplier ?? 1.0;
      const vel = Math.abs(this.currentParams.velocity);
      this.lensingPass.uniforms['uLensingIntensity'].value = Math.max(0.0, energyMult * 0.4 + vel * 0.12);

      const edgeWorldPos = new THREE.Vector3(this.currentParams.xCenter + this.currentParams.bubbleRadius, 0, 0);
      edgeWorldPos.project(this.camera);
      const edgeScreenX = (edgeWorldPos.x + 1) * 0.5;
      const edgeScreenY = (edgeWorldPos.y + 1) * 0.5;
      const aspect = this.container.clientWidth / (this.container.clientHeight || 1);
      const radiusScreen = Math.hypot(edgeScreenX - screenX, (edgeScreenY - screenY) * aspect);
      this.lensingPass.uniforms['uBubbleRadiusScreen'].value = Math.max(0.04, radiusScreen);
      this.lensingPass.uniforms['uAspectRatio'].value = aspect;
      this.lensingPass.uniforms['uTime'].value = currentTime * 0.001;
    }

    this.composer.render();
  }

  /**
   * Animates the FTL Star Streaks particle overlay.
   * Streaks stream backward along the travel axis (-X direction), dynamically
   * elongating and brightening as the velocity parameter increases.
   */
  private animateStarStreaks(delta: number): void {
    if (!this.starStreakGeo || !this.starStreakMat) return;

    const posAttr = this.starStreakGeo.attributes.position as THREE.BufferAttribute;
    const colAttr = this.starStreakGeo.attributes.color as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;

    const v = this.currentParams.velocity;
    const count = this.starStreakCount;
    const xBound = 18.0;

    // Stream speed: rapid FTL transit as velocity increases
    const baseStreamSpeed = v * 8.5 + 2.0;

    // Streak length stretches dynamically with velocity:
    // At v = 0.1c -> ~0.12 units (starlight point)
    // At v = 1.0c -> ~0.66 units (linear motion blur)
    // At v = 6.0c -> ~4.80 units (hyperdrive warp streak filament)
    const lengthMultiplier = Math.pow(Math.max(0.1, v), 1.2) * 0.58 + 0.08;

    // Brightness and opacity surge at higher FTL warp factors
    const brightnessRatio = Math.min(1.0, 0.4 + (v / 6.0) * 0.6);
    this.starStreakMat.opacity = Math.min(1.0, 0.45 + (v / 6.0) * 0.55);

    // Relativistic chromatic shift: energetic cyan-white glow
    const headR = 1.0;
    const headG = Math.max(0.8, 1.0 - (v / 6.0) * 0.12);
    const headB = 1.0;

    const tailR = 0.12 * brightnessRatio;
    const tailG = (0.35 + (v / 6.0) * 0.45) * brightnessRatio;
    const tailB = (0.7 + (v / 6.0) * 0.3) * brightnessRatio;

    for (let i = 0; i < count; i++) {
      const idxHead = i * 3;
      const speed = this.starStreakSpeeds[i] * baseStreamSpeed;

      // Stream backward along travel axis (-X)
      this.starStreakHeadPositions[idxHead] -= speed * delta;

      // Wrap around when passing rear boundary
      if (this.starStreakHeadPositions[idxHead] < -xBound) {
        this.starStreakHeadPositions[idxHead] = xBound + Math.random() * 2.5;

        // Re-randomize radial position around flight corridor
        const angle = Math.random() * Math.PI * 2;
        const isInner = Math.random() < 0.35;
        const radius = isInner
          ? 1.5 + Math.random() * 2.8
          : 4.2 + Math.random() * 9.5;
        this.starStreakHeadPositions[idxHead + 1] = radius * Math.sin(angle) + 0.3;
        this.starStreakHeadPositions[idxHead + 2] = radius * Math.cos(angle);
      }

      const hx = this.starStreakHeadPositions[idxHead];
      const hy = this.starStreakHeadPositions[idxHead + 1];
      const hz = this.starStreakHeadPositions[idxHead + 2];

      const streakLen = this.starStreakBaseLengths[i] * lengthMultiplier;

      const vIdx = i * 6;

      // Head vertex (leading point)
      pos[vIdx + 0] = hx;
      pos[vIdx + 1] = hy;
      pos[vIdx + 2] = hz;

      // Tail vertex (trailing filament along -X)
      pos[vIdx + 3] = hx - streakLen;
      pos[vIdx + 4] = hy;
      pos[vIdx + 5] = hz;

      // Head Color: Brilliant radiant white-cyan
      col[vIdx + 0] = headR;
      col[vIdx + 1] = headG;
      col[vIdx + 2] = headB;

      // Tail Color: Faded relativistic electric blue
      col[vIdx + 3] = tailR;
      col[vIdx + 4] = tailG;
      col[vIdx + 5] = tailB;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  private animateParticles(delta: number): void {
    const posAttr = this.streamParticles.geometry.attributes.position as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const base = this.particleBasePositions;
    const count = posAttr.count;
    const v = this.currentParams.velocity;
    const xCenter = this.currentParams.xCenter;
    const R = this.currentParams.bubbleRadius;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Drift particles backward relative to travel direction
      base[idx] -= (v * 0.8 + 0.5) * delta;
      if (base[idx] < -this.gridBounds * 1.1) {
        base[idx] = this.gridBounds * 1.1;
      }

      const x = base[idx];
      const y = base[idx + 1];
      const z = base[idx + 2];

      // Geodesic deflection around the bubble boundary
      const dx = x - xCenter;
      const r = Math.hypot(dx, z);

      if (r < R * 1.3 && r > 0.05) {
        // Push particles outward around the bubble wall
        const push = (1.3 * R - r) * 0.4;
        pos[idx] = x;
        pos[idx + 1] = y + push * 0.5;
        pos[idx + 2] = z + (z / r) * push;
      } else {
        pos[idx] = x;
        pos[idx + 1] = y;
        pos[idx + 2] = z;
      }
    }
    posAttr.needsUpdate = true;
  }

  private updateCameraDamping(delta: number): void {
    if (this.cameraPreset === 'cockpit') {
      // Follow right behind the ship inside the flat bubble
      const targetPos = new THREE.Vector3(
        this.currentParams.xCenter - 1.8,
        0.55,
        0
      );
      this.camera.position.lerp(targetPos, 0.08);
      this.cameraTarget.lerp(new THREE.Vector3(this.currentParams.xCenter + 2.5, 0, 0), 0.1);
      this.camera.lookAt(this.cameraTarget);
    } else if (this.cameraPreset === 'cinematic') {
      // Slowly orbit around the warp bubble to showcase 3D metric deformation from multiple angles
      this.orbitSpherical.theta += delta * 0.22;
      this.cameraTarget.lerp(new THREE.Vector3(this.currentParams.xCenter, 0, 0), 0.08);
      this.updateCameraFromSpherical();
    } else {
      // Orbit camera damping
      this.cameraTarget.lerp(new THREE.Vector3(0, 0, 0), 0.08);
      this.updateCameraFromSpherical();
      this.camera.lookAt(this.cameraTarget);
    }
  }

  private updateCameraFromSpherical(): void {
    const { radius, phi, theta } = this.orbitSpherical;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  private setupInteraction(): void {
    const dom = this.renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      this.isPointerDown = true;
      this.previousPointerPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isPointerDown) return;
      const dx = e.clientX - this.previousPointerPos.x;
      const dy = e.clientY - this.previousPointerPos.y;
      this.previousPointerPos = { x: e.clientX, y: e.clientY };

      if (this.cameraPreset === 'cockpit') return;
      if (this.cameraPreset === 'cinematic') {
        this.cameraPreset = 'isometric';
      }

      this.orbitSpherical.theta -= dx * 0.007;
      this.orbitSpherical.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, this.orbitSpherical.phi - dy * 0.007)
      );
    };

    const onPointerUp = () => {
      this.isPointerDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.orbitSpherical.radius = Math.max(
        3.5,
        Math.min(18.0, this.orbitSpherical.radius + e.deltaY * 0.008)
      );
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Touch gesture support
    let initialTouchDist = 0;
    dom.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialTouchDist = Math.hypot(dx, dy);
      }
    }, { passive: true });

    dom.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 2 && initialTouchDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const diff = initialTouchDist - dist;
        this.orbitSpherical.radius = Math.max(
          3.5,
          Math.min(18.0, this.orbitSpherical.radius + diff * 0.02)
        );
        initialTouchDist = dist;
      }
    }, { passive: true });
  }

  // Public methods called by React controls
  public updateParams(newParams: Partial<WarpParameters>): void {
    Object.assign(this.currentParams, newParams);
    this.updateMeshDeformation();
  }

  public setCameraPreset(preset: CameraPreset): void {
    this.cameraPreset = preset;
    if (preset === 'isometric') {
      this.orbitSpherical = { radius: 8.5, phi: 1.15, theta: -0.85 };
      this.cameraTarget.set(0, 0, 0);
    } else if (preset === 'top_down') {
      this.orbitSpherical = { radius: 9.0, phi: 0.12, theta: 0.0 };
      this.cameraTarget.set(0, 0, 0);
    } else if (preset === 'side_profile') {
      this.orbitSpherical = { radius: 7.5, phi: 1.45, theta: Math.PI / 2 };
      this.cameraTarget.set(0, 0, 0);
    } else if (preset === 'cinematic') {
      this.orbitSpherical = { radius: 9.2, phi: 1.0, theta: 0.0 };
      this.cameraTarget.set(this.currentParams.xCenter, 0, 0);
    }
  }

  public setVisualStyle(style: VisualStyle): void {
    this.visualStyle = style;
    const wireframeMat = this.wireframeMesh.material as THREE.MeshBasicMaterial;
    if (style === 'checkerboard') {
      wireframeMat.color.setHex(0x38bdf8);
      wireframeMat.opacity = 0.45;
    } else if (style === 'hologram') {
      wireframeMat.color.setHex(0x06b6d4);
      wireframeMat.opacity = 0.75;
    } else if (style === 'heat_expansion') {
      wireframeMat.color.setHex(0xf8fafc);
      wireframeMat.opacity = 0.25;
    } else {
      wireframeMat.color.setHex(0x1e3a8a);
      wireframeMat.opacity = 0.3;
    }
    this.updateMeshDeformation();
  }

  public handleResize(width: number, height: number): void {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = width / (height || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public getPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Captures high-resolution canvas snapshot as base64 PNG data URL
   */
  public captureScreenshot(): string {
    this.composer.render();
    return this.renderer.domElement.toDataURL('image/png');
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.gridGeometry.dispose();
    (this.surfaceMesh.material as THREE.Material).dispose();
    (this.wireframeMesh.material as THREE.Material).dispose();
    if (this.starStreakGeo) this.starStreakGeo.dispose();
    if (this.starStreakMat) this.starStreakMat.dispose();
    if (this.starStreaksMesh) this.scene.remove(this.starStreaksMesh);
    if (this.composer) {
      this.composer.dispose();
    }
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
