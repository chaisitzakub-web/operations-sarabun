/**
 * e-Signature & Note/Order Stamping Engine
 * Digital Signature Canvas, Stamping & Responsive Annotation
 */

class SignatureEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
  }

  initCanvas(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#002B66'; // Navy Blue Official Ink

    this.clearCanvas();

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

    // Touch events for Mobile / Tablet
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchend', () => {
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  draw(e) {
    if (!this.isDrawing) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearCanvas() {
    if (!this.ctx) return;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw baseline guide
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#E2E8F0';
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(20, this.canvas.height - 20);
    this.ctx.lineTo(this.canvas.width - 20, this.canvas.height - 20);
    this.ctx.stroke();
    this.ctx.strokeStyle = '#002B66';
    this.ctx.lineWidth = 2.5;
  }

  getSignatureDataUrl() {
    if (!this.canvas) return null;
    return this.canvas.toDataURL('image/png');
  }

  static createStampBadge(text, color = 'green') {
    const timeStr = new Date().toLocaleString('th-TH');
    return `
      <div class="e-stamp stamp-${color}">
        <div class="stamp-header">✓ ลงนามและเกษียนหนังสือแล้ว</div>
        <div class="stamp-text">"${text}"</div>
        <div class="stamp-footer">เกษียนโดย: ผู้อำนวยการสำนัก | ${timeStr}</div>
      </div>
    `;
  }
}

window.signatureEngine = new SignatureEngine();
