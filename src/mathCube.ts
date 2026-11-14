import * as THREE from 'three';

// A deterministic local math coach, not a connection to an AI service.
export function createMathCube() {
  const group = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The math diagram requires a 2D canvas.');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const panelGeometry = new THREE.PlaneGeometry(0.96, 0.96);
  const panelMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  group.add(panel);

  const boxGeometry = new THREE.BoxGeometry();
  const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
  boxGeometry.dispose();
  const edgesMaterial = new THREE.LineBasicMaterial({ color: '#9deaff' });
  group.add(new THREE.LineSegments(edgesGeometry, edgesMaterial));

  const update = (degrees: number) => {
    const radians = degrees * Math.PI / 180;
    const sine = Math.sin(radians);
    const cosine = Math.cos(radians);
    const tangent = Math.abs(cosine) < 1e-10 ? 'undefined' : (sine / cosine).toFixed(3);
    const ctx = context;
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.fillStyle = '#081823';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a4f4ff';
    ctx.font = 'bold 54px monospace';
    ctx.fillText('MATH AI / TRIG LAB', 512, 80);
    ctx.font = '28px monospace';
    ctx.fillText('LOCAL RULE-BASED COACH · NO AI SERVICE', 512, 128);

    const cx = 512, cy = 430, radius = 220;
    const x = cx + cosine * radius, y = cy - sine * radius;
    ctx.strokeStyle = '#32515f';
    ctx.lineWidth = 3;
    for (let step = -2; step <= 2; step++) {
      const offset = step * radius / 2;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy + offset);
      ctx.lineTo(cx + radius, cy + offset);
      ctx.moveTo(cx + offset, cy - radius);
      ctx.lineTo(cx + offset, cy + radius);
      ctx.stroke();
    }
    ctx.strokeStyle = '#9deaff';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#22d3ee33';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, cy);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fcd34d';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = '#f0abfc';
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, -radians, true);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 42px monospace';
    ctx.fillText('θ = ' + degrees + '°   r = 1', 512, 720);
    ctx.font = '36px monospace';
    ctx.fillText('sin θ = y/r = ' + sine.toFixed(3), 512, 776);
    ctx.fillText('cos θ = x/r = ' + cosine.toFixed(3), 512, 826);
    ctx.fillText('tan θ = y/x = ' + tangent, 512, 876);
    ctx.font = '27px monospace';
    ctx.fillStyle = '#a4f4ff';
    ctx.fillText(Math.abs(cosine) < 1e-10
      ? 'x = 0: division by zero is undefined.'
      : 'Unit circle: x² + y² = 1; sin²θ + cos²θ = 1.', 512, 940);
    ctx.fillText('Click / ← →: change θ by 15°', 512, 990);
    texture.needsUpdate = true;
    return 'Math AI trig lab, local rule-based coach. Angle ' + degrees
      + ' degrees. Sine ' + sine.toFixed(3) + ', cosine ' + cosine.toFixed(3)
      + ', tangent ' + tangent + '. Click or use left and right arrows to change the angle.';
  };

  return {
    group,
    update,
    dispose() {
      panelGeometry.dispose();
      panelMaterial.dispose();
      texture.dispose();
      edgesGeometry.dispose();
      edgesMaterial.dispose();
    },
  };
}
