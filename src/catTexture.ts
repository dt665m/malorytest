import * as THREE from 'three';

// Draw locally so every face has a cat immediately, even offline. The texture
// is independent of geometry and can also be used on a rounded surface.
export function createCatTexture(face: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const refresh = (turn: number) => {
    const identity = face + turn * 6;
    const hue = (identity * 137.508) % 360;
    const fur = `hsl(${hue}, 38%, 68%)`;
    const ink = '#20232d';
    const ellipse = (x: number, y: number, rx: number, ry: number, fill: string) => {
      context.beginPath();
      context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      context.fillStyle = fill;
      context.fill();
    };
    const triangle = (points: number[], fill: string) => {
      context.beginPath();
      context.moveTo(points[0], points[1]);
      context.lineTo(points[2], points[3]);
      context.lineTo(points[4], points[5]);
      context.closePath();
      context.fillStyle = fill;
      context.fill();
    };

    context.fillStyle = `hsl(${(hue + 170) % 360}, 45%, 88%)`;
    context.fillRect(0, 0, 512, 512);
    // Shoulders, ears and head fill the face while leaving a safe edge margin.
    ellipse(256, 492, 175, 132, fur);
    triangle([108, 229, 99, 69, 235, 173], fur);
    triangle([277, 173, 413, 69, 404, 229], fur);
    triangle([128, 182, 120, 109, 183, 172], '#eaa5af');
    triangle([329, 172, 392, 109, 384, 182], '#eaa5af');
    ellipse(256, 270, 168, 145, fur);

    // Alternate tabby stripes and a contrasting patch for distinct cats.
    if (identity % 2 === 0) {
      context.strokeStyle = `hsl(${hue}, 32%, 43%)`;
      context.lineWidth = 17;
      context.lineCap = 'round';
      for (const x of [218, 256, 294]) {
        context.beginPath();
        context.moveTo(x, 142);
        context.lineTo(x + (256 - x) * 0.3, 185);
        context.stroke();
      }
    } else {
      ellipse(190, 252, 61, 73, `hsl(${hue}, 25%, 40%)`);
    }

    const eyeColor = `hsl(${(hue + 80) % 360}, 65%, 61%)`;
    for (const x of [190, 322]) {
      ellipse(x, 265, 34, 39, ink);
      ellipse(x, 265, 27, 31, eyeColor);
      ellipse(x, 266, 8 + identity % 5, 29, ink);
      ellipse(x - 9, 253, 6, 7, '#ffffff');
    }
    ellipse(227, 329, 44, 31, '#fff4e4');
    ellipse(285, 329, 44, 31, '#fff4e4');
    triangle([240, 313, 272, 313, 256, 333], '#a95568');
    context.strokeStyle = ink;
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(256, 332);
    context.lineTo(256, 345);
    context.moveTo(256, 345);
    context.quadraticCurveTo(239, 361, 226, 346);
    context.moveTo(256, 345);
    context.quadraticCurveTo(273, 361, 286, 346);
    for (const direction of [-1, 1]) {
      for (let whisker = 0; whisker < 3; whisker++) {
        context.moveTo(256 + direction * 66, 322 + whisker * 13);
        context.lineTo(256 + direction * 147, 308 + whisker * 26);
      }
    }
    context.stroke();
    texture.needsUpdate = true;
  };

  refresh(0);
  return { texture, refresh };
}
