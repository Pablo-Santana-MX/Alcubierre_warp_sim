/**
 * Procedural Spacecraft Model with Warp Rings and Exotic Emitters
 * High-fidelity 8-part composite procedural group.
 */

import * as THREE from 'three';

export function createSpacecraftModel(): {
  group: THREE.Group;
  warpRings: THREE.Mesh[];
  pulseEmitter: THREE.Mesh;
  glowShield: THREE.Mesh;
} {
  const group = new THREE.Group();

  // Materials
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8e2ed,
    metalness: 0.85,
    roughness: 0.22,
  });

  const darkTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.92,
    roughness: 0.35,
  });

  const cockpitGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    metalness: 0.2,
    roughness: 0.1,
    transmission: 0.7,
    thickness: 0.4,
    transparent: true,
    opacity: 0.85,
  });

  const warpCoilMaterial = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x0284c7,
    emissiveIntensity: 1.8,
    metalness: 0.6,
    roughness: 0.2,
  });

  const forwardDeflectorMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.5,
    metalness: 0.7,
    roughness: 0.15,
  });

  // 1. Central Hull: Aerodynamic streamlined fuselage
  const hullGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.75, 18);
  hullGeo.rotateZ(Math.PI / 2); // orient along X (travel axis)
  const hullMesh = new THREE.Mesh(hullGeo, hullMaterial);
  hullMesh.castShadow = true;
  group.add(hullMesh);

  // 2. Cockpit Canopy / Bridge
  const canopyGeo = new THREE.SphereGeometry(0.09, 16, 12);
  canopyGeo.scale(1.8, 0.8, 0.9);
  const canopyMesh = new THREE.Mesh(canopyGeo, cockpitGlassMaterial);
  canopyMesh.position.set(0.18, 0.06, 0);
  group.add(canopyMesh);

  // 3. Forward Navigational Deflector (Concentrates gravitational field ahead)
  const deflectorGeo = new THREE.ConeGeometry(0.08, 0.15, 16);
  deflectorGeo.rotateZ(-Math.PI / 2);
  const deflectorMesh = new THREE.Mesh(deflectorGeo, forwardDeflectorMaterial);
  deflectorMesh.position.set(0.42, 0, 0);
  group.add(deflectorMesh);

  // 4. Rear Engine Cluster / Sublight Exhaust
  const engineGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.16, 16);
  engineGeo.rotateZ(Math.PI / 2);
  const engineMesh = new THREE.Mesh(engineGeo, darkTrimMaterial);
  engineMesh.position.set(-0.4, 0, 0);
  group.add(engineMesh);

  // 5. Warp Field Pylons / Outriggers (Symmetric struts holding the warp rings)
  const pylonGeo = new THREE.BoxGeometry(0.2, 0.02, 0.7);
  const pylonMesh = new THREE.Mesh(pylonGeo, darkTrimMaterial);
  pylonMesh.position.set(-0.05, 0, 0);
  group.add(pylonMesh);

  const verticalPylonGeo = new THREE.BoxGeometry(0.2, 0.45, 0.02);
  const verticalPylonMesh = new THREE.Mesh(verticalPylonGeo, darkTrimMaterial);
  verticalPylonMesh.position.set(-0.05, 0, 0);
  group.add(verticalPylonMesh);

  // 6. Toroidal Alcubierre Warp Coil Rings (Coaxial Exotic Matter Guides)
  const warpRings: THREE.Mesh[] = [];

  // Forward Primary Ring
  const ringGeo1 = new THREE.TorusGeometry(0.38, 0.032, 16, 40);
  ringGeo1.rotateY(Math.PI / 2); // perpendicular to X axis
  const ring1 = new THREE.Mesh(ringGeo1, warpCoilMaterial);
  ring1.position.set(0.08, 0, 0);
  group.add(ring1);
  warpRings.push(ring1);

  // Aft Secondary Ring
  const ringGeo2 = new THREE.TorusGeometry(0.34, 0.028, 16, 40);
  ringGeo2.rotateY(Math.PI / 2);
  const ring2 = new THREE.Mesh(ringGeo2, warpCoilMaterial);
  ring2.position.set(-0.2, 0, 0);
  group.add(ring2);
  warpRings.push(ring2);

  // 7. Exotic Plasma Emitter Core (In the geometric focus)
  const coreGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    wireframe: true,
  });
  const pulseEmitter = new THREE.Mesh(coreGeo, coreMat);
  pulseEmitter.position.set(-0.05, 0, 0);
  group.add(pulseEmitter);

  // 8. Flat Space Inertial Shield Bubble (Visualizes the zero-gravity comfort zone)
  const shieldGeo = new THREE.SphereGeometry(0.55, 24, 20);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.12,
    wireframe: true,
    blending: THREE.AdditiveBlending,
  });
  const glowShield = new THREE.Mesh(shieldGeo, shieldMat);
  group.add(glowShield);

  // Scale spacecraft appropriately for simulation grid bounds
  group.scale.set(0.9, 0.9, 0.9);

  return {
    group,
    warpRings,
    pulseEmitter,
    glowShield,
  };
}
