export class InputHandler {
  constructor() {
    this.keys = {};
    this.chatFocused = false;

    document.addEventListener('keydown', (e) => {
      if (this.chatFocused) return;
      if (e.code === 'Tab') e.preventDefault();
      this.keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('focus', () => { this.chatFocused = true; });
      chatInput.addEventListener('blur', () => { this.chatFocused = false; });
    }
  }

  getMovement(cameraYaw) {
    let dx = 0;
    let dz = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) dz -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) dz += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

    if (dx === 0 && dz === 0) return { dx: 0, dz: 0 };

    const len = Math.sqrt(dx * dx + dz * dz);
    dx /= len;
    dz /= len;

    const sin = Math.sin(cameraYaw);
    const cos = Math.cos(cameraYaw);
    const rotatedX = dx * cos + dz * sin;
    const rotatedZ = -dx * sin + dz * cos;

    const speed = 0.25;
    return { dx: rotatedX * speed, dz: rotatedZ * speed };
  }

  isKeyPressed(code) {
    return !!this.keys[code];
  }
}
