import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const modelCache = new Map();

export class ModelLoader {
  constructor(scene) {
    this.scene = scene;
    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();
    this.mixers = [];
  }

  async load(path) {
    if (modelCache.has(path)) {
      return this.cloneResult(modelCache.get(path));
    }

    const isFbx = path.toLowerCase().endsWith('.fbx');

    return new Promise((resolve) => {
      if (isFbx) {
        this.fbxLoader.load(
          path,
          (fbx) => {
            // FBXLoader retorna o grupo direto (não tem .scene)
            const result = { scene: fbx, animations: fbx.animations || [] };
            modelCache.set(path, result);
            resolve(this.createModel(fbx, result.animations));
          },
          undefined,
          (error) => {
            console.warn(`Modelo não encontrado: ${path}`, error);
            resolve(null);
          }
        );
      } else {
        this.gltfLoader.load(
          path,
          (gltf) => {
            const result = { scene: gltf.scene, animations: gltf.animations || [] };
            modelCache.set(path, result);
            resolve(this.createModel(gltf.scene.clone(), result.animations));
          },
          undefined,
          (error) => {
            console.warn(`Modelo não encontrado: ${path}`, error);
            resolve(null);
          }
        );
      }
    });
  }

  cloneResult(cached) {
    const mesh = cached.scene.clone();
    return this.createModel(mesh, cached.animations);
  }

  createModel(mesh, animClips) {
    // Ajustar materiais
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Garantir que materiais funcionem bem
        if (child.material) {
          child.material.side = THREE.FrontSide;
        }
      }
    });

    // AnimationMixer
    let mixer = null;
    const animations = {};
    const actions = {};

    if (animClips && animClips.length > 0) {
      mixer = new THREE.AnimationMixer(mesh);
      this.mixers.push(mixer);

      for (const clip of animClips) {
        const name = this.normalizeAnimName(clip.name);
        animations[name] = clip;
        actions[name] = mixer.clipAction(clip);
      }
    }

    let currentAction = null;
    const self = this;

    const model = {
      mesh,
      mixer,
      animations,
      actions,

      playAnimation(name, options = {}) {
        const action = actions[name];
        if (!action) return;

        const { loop = true, fadeTime = 0.2 } = options;

        if (currentAction === action) return;

        if (!loop) {
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
        } else {
          action.setLoop(THREE.LoopRepeat);
        }

        if (currentAction) {
          currentAction.fadeOut(fadeTime);
        }

        action.reset().fadeIn(fadeTime).play();
        currentAction = action;
      },

      getAnimationNames() {
        return Object.keys(animations);
      },

      // Reseta o tracking de animação atual (chamar depois de loadExtraAnimations)
      resetCurrentAction() {
        currentAction = null;
      },

      setScale(s) {
        mesh.scale.setScalar(s);
      },

      dispose() {
        if (mixer) {
          const idx = self.mixers.indexOf(mixer);
          if (idx > -1) self.mixers.splice(idx, 1);
          mixer.stopAllAction();
        }
      }
    };

    return model;
  }

  normalizeAnimName(name) {
    const lower = name.toLowerCase();

    if (lower.includes('idle') || lower.includes('breathing') || lower.includes('standing')) return 'idle';
    if (lower.includes('walk') || lower.includes('locomotion')) return 'walk';
    if (lower.includes('run') || lower.includes('jog')) return 'run';
    if (lower.includes('attack') || lower.includes('slash') || lower.includes('swing') || lower.includes('melee')) return 'attack';
    if (lower.includes('die') || lower.includes('death') || lower.includes('fall')) return 'die';
    if (lower.includes('hit') || lower.includes('damage') || lower.includes('react')) return 'hit';
    if (lower.includes('cast') || lower.includes('spell') || lower.includes('magic')) return 'cast';
    if (lower.includes('jump')) return 'jump';

    // Mixamo costuma usar o nome da animação como "mixamo.com"
    if (lower.includes('mixamo')) return 'idle';

    return lower.replace(/\s+/g, '_');
  }

  update(deltaTime) {
    for (const mixer of this.mixers) {
      mixer.update(deltaTime);
    }
  }

  async tryLoad(path) {
    try {
      return await this.load(path);
    } catch {
      return null;
    }
  }

  // Carrega animações extras de arquivos separados e adiciona ao modelo
  async loadExtraAnimations(model, animationFiles) {
    if (!model || !model.mixer) return;

    // Primeiro: parar e limpar TODAS as animações originais do FBX base
    model.mixer.stopAllAction();
    for (const name of Object.keys(model.actions)) {
      model.actions[name].stop();
      delete model.actions[name];
      delete model.animations[name];
    }

    // Carregar cada animação de arquivo separado
    for (const [name, path] of Object.entries(animationFiles)) {
      try {
        const result = await this.loadAnimationFile(path);
        if (result && result.length > 0) {
          const clip = result[0];
          clip.name = name;
          model.animations[name] = clip;
          model.actions[name] = model.mixer.clipAction(clip);
          console.log(`Animação "${name}" carregada de ${path}`);
        }
      } catch (e) {
        console.warn(`Animação não encontrada: ${path}`);
      }
    }
  }

  // Carrega só as animações de um arquivo FBX/GLB
  loadAnimationFile(path) {
    return new Promise((resolve) => {
      const isFbx = path.toLowerCase().endsWith('.fbx');
      const loader = isFbx ? this.fbxLoader : this.gltfLoader;

      loader.load(
        path,
        (result) => {
          if (isFbx) {
            resolve(result.animations || []);
          } else {
            resolve(result.animations || []);
          }
        },
        undefined,
        () => resolve([])
      );
    });
  }
}

// Configuração dos modelos
// Coloque os arquivos .fbx ou .glb na pasta client/models/
export const MODEL_CONFIG = {
  player: {
    path: 'models/player.fbx',
    scale: 0.01,
    // Animações extras (arquivos separados do Mixamo)
    animations: {
      idle: 'models/player_idle.fbx',
      walk: 'models/player_walk.fbx',
      attack: 'models/player_attack.fbx',
      die: 'models/player_die.fbx',
    },
  },
  corrupted_wolf: {
    path: 'models/corrupted_wolf.glb',
    scale: 1.0,
    animations: {},
  },
  shadow_spider: {
    path: 'models/shadow_spider.glb',
    scale: 0.8,
    animations: {},
  },
  hollow_knight: {
    path: 'models/hollow_knight.glb',
    scale: 1.2,
    animations: {},
  },
  npc_elder: {
    path: 'models/npc_elder.glb',
    scale: 1.0,
    animations: {},
  },
};
