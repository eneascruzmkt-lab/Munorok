import * as THREE from 'three';
import { ModelLoader, MODEL_CONFIG } from './ModelLoader.js';

export class Renderer {
  constructor(canvas) {
    this.modelLoader = null; // inicializado depois
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2a);
    this.scene.fog = new THREE.Fog(0x1a1a2a, 50, 90);

    this.setupLighting();
    this.createTerrain();
    this.createDecorations();
    this.createParticles();

    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0x7788bb, 0x445533, 0.7);
    this.scene.add(hemiLight);

    const ambient = new THREE.AmbientLight(0x8899bb, 0.5);
    this.scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0xccccee, 1.0);
    moonLight.position.set(-20, 35, -15);
    this.scene.add(moonLight);

    const fillLight = new THREE.DirectionalLight(0x6666aa, 0.3);
    fillLight.position.set(20, 10, 15);
    this.scene.add(fillLight);

    const corruptLight = new THREE.PointLight(0x9944ff, 0.6, 40, 1.5);
    corruptLight.position.set(0, 3, 0);
    this.scene.add(corruptLight);
  }

  createTerrain() {
    const size = 100;
    const segments = 60;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
      positions.setY(i, y);

      const distCenter = Math.sqrt(x * x + z * z) / 50;
      const corruption = Math.max(0, 1 - distCenter);
      const noise = (Math.sin(x * 0.5 + z * 0.3) * 0.5 + 0.5) * 0.1;

      // Verde escuro de floresta com variação
      colors[i * 3] = 0.10 + corruption * 0.06 + noise * 0.5;
      colors[i * 3 + 1] = 0.22 + noise - corruption * 0.04;
      colors[i * 3 + 2] = 0.08 + corruption * 0.10 + noise * 0.3;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    this.terrain = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.8, metalness: 0.05,
    }));
    this.scene.add(this.terrain);

  }

  createDecorations() {
    // Arbustos e moitas (formato orgânico, não cubos)
    const bushColors = [0x2a5a22, 0x1a4018, 0x2a4a1a, 0x1a5020];
    for (let i = 0; i < 40; i++) {
      const bx = (Math.random() - 0.5) * 70;
      const bz = (Math.random() - 0.5) * 70;
      const by = Math.sin(bx * 0.1) * Math.cos(bz * 0.1) * 2;
      const color = bushColors[Math.floor(Math.random() * bushColors.length)];
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true });

      // Cada arbusto = 2-3 esferas agrupadas
      const bushGroup = new THREE.Group();
      const count = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < count; j++) {
        const size = 0.15 + Math.random() * 0.2;
        const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), mat);
        sphere.position.set((Math.random() - 0.5) * 0.2, size * 0.5 + j * 0.05, (Math.random() - 0.5) * 0.2);
        bushGroup.add(sphere);
      }
      bushGroup.position.set(bx, by, bz);
      this.scene.add(bushGroup);
    }

    // Árvores mortas
    const treePositions = [
      [-15, 8], [20, -12], [-30, 25], [35, -30], [-8, -20],
      [12, 35], [-25, -15], [40, 15], [-35, -35], [5, -40],
    ];

    for (const [x, z] of treePositions) {
      const y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
      const h = 4 + Math.random() * 2;

      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.9, flatShading: true });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, h, 6), trunkMat);
      trunk.position.set(x, y + h / 2, z);
      this.scene.add(trunk);

      // Galhos + folhagem morta
      const branchMat = new THREE.MeshStandardMaterial({ color: 0x4a2a15, roughness: 1, flatShading: true });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x2a3a18, roughness: 0.9, flatShading: true });
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + Math.random();
        const bLen = 1 + Math.random();
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, bLen, 4), branchMat);
        const bx = x + Math.cos(angle) * 0.6;
        const bz2 = z + Math.sin(angle) * 0.6;
        const bh = y + h * (0.55 + i * 0.12);
        branch.position.set(bx, bh, bz2);
        branch.rotation.z = Math.cos(angle) * 0.7;
        branch.rotation.x = Math.sin(angle) * 0.7;
        this.scene.add(branch);

        // Massa de folhas no fim do galho (50% chance)
        if (Math.random() > 0.3) {
          const leafSize = 0.4 + Math.random() * 0.4;
          const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(leafSize, 0), leafMat);
          leaf.position.set(
            bx + Math.cos(angle) * 0.5,
            bh + 0.3,
            bz2 + Math.sin(angle) * 0.5
          );
          this.scene.add(leaf);
        }
      }

      // Copa central escassa no topo
      if (Math.random() > 0.3) {
        const canopy = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.4, 0),
          new THREE.MeshStandardMaterial({ color: 0x1a3012, roughness: 0.9, flatShading: true })
        );
        canopy.position.set(x, y + h + 0.3, z);
        canopy.scale.y = 0.6;
        this.scene.add(canopy);
      }
    }

    // Pedras mais claras e visíveis
    for (let i = 0; i < 15; i++) {
      const size = 0.3 + Math.random() * 0.5;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(size, 0),
        new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.85, flatShading: true })
      );
      const rx = (Math.random() - 0.5) * 80;
      const rz = (Math.random() - 0.5) * 80;
      rock.position.set(rx, Math.sin(rx * 0.1) * Math.cos(rz * 0.1) * 2 + size * 0.3, rz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.scale.y = 0.6;
      this.scene.add(rock);
    }

    // Tochas com luz
    const torchData = [[20, -15], [-25, 20], [10, 30], [-15, -30]];
    for (const [tx, tz] of torchData) {
      const ty = Math.sin(tx * 0.1) * Math.cos(tz * 0.1) * 2;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 1.8, 5),
        new THREE.MeshStandardMaterial({ color: 0x6a4a2a })
      );
      pole.position.set(tx, ty + 0.9, tz);
      this.scene.add(pole);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.2, 5),
        new THREE.MeshBasicMaterial({ color: 0xff9933 })
      );
      flame.position.set(tx, ty + 1.9, tz);
      this.scene.add(flame);

      const light = new THREE.PointLight(0xff7722, 0.6, 10, 2);
      light.position.set(tx, ty + 2, tz);
      this.scene.add(light);
    }
  }

  createParticles() {
    const count = 40;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = 1 + Math.random() * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 0.1,
      color: 0xaa66ff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    this.scene.add(this.particles);
  }

  update(time) {
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + Math.sin(time * 0.0008 + i) * 0.002;
        if (y > 5.5) y = 1;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
  }

  // ========== PERSONAGEM JOGADOR (estilo low-poly angular) ==========
  createPlayerMesh(color = 0x3366aa) {
    const group = new THREE.Group();

    // --- Tronco (retangular, com peito mais largo) ---
    const torsoMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.15, flatShading: true });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.3), torsoMat);
    torso.position.y = 1.15;
    torso.name = 'torso';
    group.add(torso);

    // Ombreiras/armadura (detalhes)
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.4, metalness: 0.5, flatShading: true });
    for (const side of [-0.32, 0.32]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.22), armorMat);
      pad.position.set(side, 1.45, 0);
      group.add(pad);
    }

    // Cinto
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.7, flatShading: true });
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.33), beltMat);
    belt.position.y = 0.85;
    group.add(belt);

    // Fivela do cinto
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.05), new THREE.MeshStandardMaterial({ color: 0xccaa44, metalness: 0.7, flatShading: true }));
    buckle.position.set(0, 0.85, 0.17);
    group.add(buckle);

    // --- Cabeça ---
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xddc8a0, roughness: 0.7, flatShading: true });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.38, 0.35), skinMat);
    head.position.y = 1.7;
    group.add(head);

    // Olhos
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x223344 });
    for (const side of [-0.08, 0.08]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), eyeMat);
      eye.position.set(side, 1.73, 0.18);
      group.add(eye);
    }

    // Cabelo
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9, flatShading: true });
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.15, 0.38), hairMat);
    hair.position.y = 1.93;
    group.add(hair);

    // --- Braço esquerdo ---
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.38, 1.35, 0);
    leftArmPivot.name = 'leftArm';
    // Upper arm
    const lUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.16), torsoMat);
    lUpperArm.position.y = -0.18;
    leftArmPivot.add(lUpperArm);
    // Forearm
    const lForearm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.14), skinMat);
    lForearm.position.y = -0.45;
    leftArmPivot.add(lForearm);
    group.add(leftArmPivot);

    // --- Braço direito + arma ---
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.38, 1.35, 0);
    rightArmPivot.name = 'rightArm';
    const rUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.16), torsoMat);
    rUpperArm.position.y = -0.18;
    rightArmPivot.add(rUpperArm);
    const rForearm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.14), skinMat);
    rForearm.position.y = -0.45;
    rightArmPivot.add(rForearm);

    // Espada visível
    const swordBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.8, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xbbbbcc, metalness: 0.9, roughness: 0.15, flatShading: true })
    );
    swordBlade.position.set(0, -0.7, 0.12);
    rightArmPivot.add(swordBlade);
    const swordGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.04, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.6, flatShading: true })
    );
    swordGuard.position.set(0, -0.35, 0.12);
    rightArmPivot.add(swordGuard);
    const swordGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.15, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x4a2a1a, flatShading: true })
    );
    swordGrip.position.set(0, -0.25, 0.12);
    rightArmPivot.add(swordGrip);
    group.add(rightArmPivot);

    // --- Perna esquerda ---
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.14, 0.72, 0);
    leftLegPivot.name = 'leftLeg';
    const lThigh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.7, flatShading: true }));
    lThigh.position.y = -0.18;
    leftLegPivot.add(lThigh);
    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8, flatShading: true }));
    lBoot.position.set(0, -0.48, 0.02);
    leftLegPivot.add(lBoot);
    group.add(leftLegPivot);

    // --- Perna direita ---
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.14, 0.72, 0);
    rightLegPivot.name = 'rightLeg';
    const rThigh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.7, flatShading: true }));
    rThigh.position.y = -0.18;
    rightLegPivot.add(rThigh);
    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8, flatShading: true }));
    rBoot.position.set(0, -0.48, 0.02);
    rightLegPivot.add(rBoot);
    group.add(rightLegPivot);

    // Círculo no chão
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.42, 24),
      new THREE.MeshBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    return group;
  }

  // ========== MONSTROS ==========
  createMonsterMesh(type) {
    const group = new THREE.Group();

    if (type === 'hollow_knight') {
      // Cavaleiro grande com armadura
      const armorMat = new THREE.MeshStandardMaterial({ color: 0x6a5030, roughness: 0.4, metalness: 0.5, flatShading: true });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.6, metalness: 0.3, flatShading: true });

      // Corpo
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.45), armorMat);
      body.position.y = 1.4;
      body.name = 'body';
      group.add(body);

      // Elmo
      const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.45), darkMat);
      helmet.position.y = 2.1;
      group.add(helmet);
      // Visor do elmo
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xff2200 }));
      visor.position.set(0, 2.1, 0.23);
      group.add(visor);

      // Ombros grandes
      for (const side of [-0.45, 0.45]) {
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.3), armorMat);
        pad.position.set(side, 1.8, 0);
        group.add(pad);
      }

      // Pernas
      for (const side of [-0.18, 0.18]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.25), darkMat);
        leg.position.set(side, 0.6, 0);
        group.add(leg);
      }

      // Espada grande
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.1, flatShading: true }));
      blade.position.set(0.5, 1.3, 0.2);
      blade.rotation.z = -0.15;
      blade.name = 'weapon';
      group.add(blade);

      // Escudo
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.5, metalness: 0.3, flatShading: true }));
      shield.position.set(-0.45, 1.2, 0.15);
      group.add(shield);

      // Maior que os outros
      group.scale.setScalar(1.15);

    } else if (type === 'corrupted_wolf') {
      // Lobo corrompido
      const furMat = new THREE.MeshStandardMaterial({ color: 0x5a3a5a, roughness: 0.8, flatShading: true });

      // Corpo (retangular achatado, mais longo)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.9), furMat);
      body.position.y = 0.55;
      body.name = 'body';
      group.add(body);

      // Cabeça
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), furMat);
      head.position.set(0, 0.65, 0.55);
      group.add(head);

      // Focinho
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.2), furMat);
      snout.position.set(0, 0.57, 0.78);
      group.add(snout);

      // Orelhas pontudas
      for (const side of [-0.12, 0.12]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4),
          new THREE.MeshStandardMaterial({ color: 0x4a2a4a, flatShading: true }));
        ear.position.set(side, 0.85, 0.5);
        group.add(ear);
      }

      // Olhos roxos brilhantes
      for (const side of [-0.08, 0.08]) {
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.03),
          new THREE.MeshBasicMaterial({ color: 0xcc44ff }));
        eye.position.set(side, 0.68, 0.73);
        group.add(eye);
      }

      // Patas
      for (const [lx, lz] of [[-0.18, 0.25], [0.18, 0.25], [-0.18, -0.25], [0.18, -0.25]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x4a2a4a, flatShading: true }));
        leg.position.set(lx, 0.18, lz);
        group.add(leg);
      }

      // Cauda
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.4), furMat);
      tail.position.set(0, 0.6, -0.6);
      tail.rotation.x = -0.4;
      group.add(tail);

    } else {
      // Shadow spider
      const spiderMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.7, flatShading: true });

      // Abdômen
      const abdomen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.6), spiderMat);
      abdomen.position.y = 0.4;
      abdomen.name = 'body';
      group.add(abdomen);

      // Cefalotórax
      const ceph = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.3), spiderMat);
      ceph.position.set(0, 0.45, 0.4);
      group.add(ceph);

      // Olhos (múltiplos, aranha)
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x44aaff });
      const eyePositions = [[-0.08, 0.55, 0.55], [0.08, 0.55, 0.55], [-0.04, 0.5, 0.56], [0.04, 0.5, 0.56]];
      for (const [ex, ey, ez] of eyePositions) {
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), eyeMat);
        eye.position.set(ex, ey, ez);
        group.add(eye);
      }

      // 8 patas
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a3a, flatShading: true });
      for (let i = 0; i < 4; i++) {
        for (const side of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), legMat);
          const zOff = -0.2 + i * 0.15;
          leg.position.set(side * 0.35, 0.25, zOff);
          leg.rotation.z = side * 0.6;
          leg.rotation.y = (i - 1.5) * 0.15 * side;
          group.add(leg);
        }
      }

      // Mandíbulas
      for (const side of [-0.06, 0.06]) {
        const fang = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.12, 4),
          new THREE.MeshStandardMaterial({ color: 0x666688, flatShading: true }));
        fang.position.set(side, 0.38, 0.57);
        fang.rotation.x = 0.3;
        group.add(fang);
      }

      group.scale.setScalar(0.9);
    }

    // Círculo de aggro
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.52, 20),
      new THREE.MeshBasicMaterial({ color: 0xcc3333, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    return group;
  }

  // ========== NPC ==========
  createNpcMesh() {
    const group = new THREE.Group();
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.7, flatShading: true });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xccbbaa, roughness: 0.7, flatShading: true });

    // Robe (corpo inteiro, mais largo embaixo)
    const robeBottom = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.4), robeMat);
    robeBottom.position.y = 0.45;
    group.add(robeBottom);
    const robeTop = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.35), robeMat);
    robeTop.position.y = 1.1;
    group.add(robeTop);

    // Capuz
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.8, flatShading: true });
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.4), hoodMat);
    hood.position.y = 1.55;
    group.add(hood);

    // Rosto (parcialmente visível sob capuz)
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.1), skinMat);
    face.position.set(0, 1.48, 0.18);
    group.add(face);

    // Olhos do NPC (sábios)
    for (const side of [-0.06, 0.06]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x88aacc }));
      eye.position.set(side, 1.5, 0.24);
      group.add(eye);
    }

    // Barba longa e branca
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9, flatShading: true }));
    beard.position.set(0, 1.25, 0.18);
    group.add(beard);

    // Cajado
    const staff = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 2.2, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x5a3a18, roughness: 0.8, flatShading: true })
    );
    staff.position.set(0.35, 1.1, 0);
    group.add(staff);

    // Cristal no topo do cajado
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.1, 0),
      new THREE.MeshBasicMaterial({ color: 0xf0c040 })
    );
    crystal.position.set(0.35, 2.25, 0);
    group.add(crystal);

    // Luz do cristal
    const orbLight = new THREE.PointLight(0xf0c040, 0.4, 6);
    orbLight.position.set(0.35, 2.25, 0);
    group.add(orbLight);

    // Quest marker
    const marker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.15, 0),
      new THREE.MeshBasicMaterial({ color: 0xf0c040 })
    );
    marker.position.y = 2.5;
    marker.name = 'questMarker';
    group.add(marker);

    // Círculo dourado
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.48, 24),
      new THREE.MeshBasicMaterial({ color: 0xf0c040, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    return group;
  }

  // ========== EFEITOS ==========
  createAttackFlash(position) {
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.6 })
    );
    flash.position.copy(position);
    flash.position.y += 1;
    this.scene.add(flash);

    let scale = 1;
    const animate = () => {
      scale += 0.15;
      flash.scale.setScalar(scale);
      flash.material.opacity -= 0.08;
      if (flash.material.opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(flash);
        flash.geometry.dispose();
        flash.material.dispose();
      }
    };
    requestAnimationFrame(animate);
  }

  createDamageFlash(position) {
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.5 })
    );
    flash.position.copy(position);
    flash.position.y += 1;
    this.scene.add(flash);

    let scale = 1;
    const animate = () => {
      scale += 0.1;
      flash.scale.setScalar(scale);
      flash.material.opacity -= 0.07;
      if (flash.material.opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(flash);
        flash.geometry.dispose();
        flash.material.dispose();
      }
    };
    requestAnimationFrame(animate);
  }

  // ========== CARREGAMENTO DE MODELOS 3D ==========
  initModelLoader() {
    this.modelLoader = new ModelLoader(this.scene);
  }

  // Tenta carregar modelo, retorna { mesh, model } ou { mesh, model: null }
  async createPlayerMeshWithModel(color) {
    if (!this.modelLoader) this.initModelLoader();

    const cfg = MODEL_CONFIG.player;
    const model = await this.modelLoader.tryLoad(cfg.path);

    if (model) {
      model.setScale(cfg.scale);

      // Carregar animações extras de arquivos separados
      if (cfg.animations) {
        await this.modelLoader.loadExtraAnimations(model, cfg.animations);
        model.resetCurrentAction(); // Limpar referência da animação antiga
      }

      // Tocar idle por padrão (se existir)
      if (model.actions.idle) {
        model.playAnimation('idle');
      }

      return { mesh: model.mesh, model };
    }

    // Fallback geométrico
    return { mesh: this.createPlayerMesh(color), model: null };
  }

  async createMonsterMeshWithModel(type) {
    if (!this.modelLoader) this.initModelLoader();

    const cfg = MODEL_CONFIG[type];
    if (cfg) {
      const model = await this.modelLoader.tryLoad(cfg.path);
      if (model) {
        model.setScale(cfg.scale);
        if (model.actions.idle) model.playAnimation('idle');
        return { mesh: model.mesh, model };
      }
    }

    // Fallback geométrico
    return { mesh: this.createMonsterMesh(type), model: null };
  }

  async createNpcMeshWithModel() {
    if (!this.modelLoader) this.initModelLoader();

    const cfg = MODEL_CONFIG.npc_elder;
    const model = await this.modelLoader.tryLoad(cfg.path);

    if (model) {
      model.setScale(cfg.scale);
      if (model.actions.idle) model.playAnimation('idle');
      return { mesh: model.mesh, model };
    }

    // Fallback geométrico
    return { mesh: this.createNpcMesh(), model: null };
  }

  // Atualizar animações dos modelos (chamar no game loop)
  updateModels(deltaTime) {
    if (this.modelLoader) {
      this.modelLoader.update(deltaTime);
    }
  }

  render(camera) {
    this.renderer.render(this.scene, camera);
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
