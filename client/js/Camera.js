import * as THREE from 'three';

export class Camera {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    this.distance = 8;
    this.minDistance = 3;
    this.maxDistance = 20;
    this.pitch = -0.4;
    this.yaw = 0;
    this.target = new THREE.Vector3(0, 1.5, 0);
    this.isRightMouseDown = false;

    this.setupControls();
    window.addEventListener('resize', () => this.onResize());
  }

  setupControls() {
    document.addEventListener('mousedown', (e) => {
      if (e.button === 2) this.isRightMouseDown = true;
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.isRightMouseDown = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isRightMouseDown) return;
      this.yaw -= e.movementX * 0.005;
      this.pitch -= e.movementY * 0.005;
      this.pitch = Math.max(-1.2, Math.min(-0.1, this.pitch));
    });

    document.addEventListener('wheel', (e) => {
      this.distance += e.deltaY * 0.01;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    });

    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  update(playerPosition) {
    if (playerPosition) {
      this.target.set(playerPosition.x, playerPosition.y + 1.5, playerPosition.z);
    }

    const offsetX = this.distance * Math.sin(this.yaw) * Math.cos(this.pitch);
    const offsetY = -this.distance * Math.sin(this.pitch);
    const offsetZ = this.distance * Math.cos(this.yaw) * Math.cos(this.pitch);

    this.camera.position.set(
      this.target.x + offsetX,
      this.target.y + offsetY,
      this.target.z + offsetZ
    );
    this.camera.lookAt(this.target);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  getYaw() {
    return this.yaw;
  }
}
