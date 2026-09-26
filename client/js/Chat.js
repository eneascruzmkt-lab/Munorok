export class Chat {
  constructor(network) {
    this.network = network;
    this.messages = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input');

    this.input.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') {
        e.preventDefault();
        const text = this.input.value.trim();
        if (text) {
          this.network.send('chat', { text });
          this.input.value = '';
        }
        this.input.blur();
      } else if (e.code === 'Escape') {
        this.input.blur();
      }
      e.stopPropagation();
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' && document.activeElement !== this.input) {
        this.input.focus();
      }
    });
  }

  addMessage(name, text) {
    const div = document.createElement('div');
    div.classList.add('msg');
    div.innerHTML = `<span class="msg-name">${this.escapeHtml(name)}:</span> ${this.escapeHtml(text)}`;
    this.messages.appendChild(div);
    this.messages.scrollTop = this.messages.scrollHeight;

    while (this.messages.children.length > 50) {
      this.messages.removeChild(this.messages.firstChild);
    }
  }

  addSystemMessage(text) {
    const div = document.createElement('div');
    div.classList.add('msg');
    div.style.color = '#f0c040';
    div.textContent = text;
    this.messages.appendChild(div);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
