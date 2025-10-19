import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles for code rain effect
    const codeCharacters = '01アイウエオカキクケコサシスセソタチツテト</>{}[]();';
    const codeDrops: Array<{ x: number; y: number; speed: number; char: string }> = [];
    
    for (let i = 0; i < 30; i++) {
      codeDrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 1 + Math.random() * 2,
        char: codeCharacters[Math.floor(Math.random() * codeCharacters.length)]
      });
    }

    // 3D Shapes
    class Shape3D {
      x: number;
      y: number;
      z: number;
      rotationX: number;
      rotationY: number;
      rotationZ: number;
      rotationSpeedX: number;
      rotationSpeedY: number;
      rotationSpeedZ: number;
      size: number;
      type: 'cube' | 'sphere' | 'torus' | 'pyramid';

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 1000;
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
        this.rotationSpeedX = (Math.random() - 0.5) * 0.02;
        this.rotationSpeedY = (Math.random() - 0.5) * 0.02;
        this.rotationSpeedZ = (Math.random() - 0.5) * 0.02;
        this.size = 30 + Math.random() * 50;
        this.type = ['cube', 'sphere', 'torus', 'pyramid'][Math.floor(Math.random() * 4)] as any;
      }

      update() {
        this.rotationX += this.rotationSpeedX;
        this.rotationY += this.rotationSpeedY;
        this.rotationZ += this.rotationSpeedZ;
        
        // Follow mouse with parallax effect
        const mouseX = mouseRef.current.x;
        const mouseY = mouseRef.current.y;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const parallaxStrength = 0.02;
        const targetX = this.x + (mouseX - centerX) * parallaxStrength;
        const targetY = this.y + (mouseY - centerY) * parallaxStrength;
        
        // Smooth follow
        this.x += (targetX - this.x) * 0.05;
        this.y += (targetY - this.y) * 0.05;
        
        // Slow drift
        this.y += Math.sin(Date.now() * 0.001 + this.x) * 0.3;
        this.x += Math.cos(Date.now() * 0.001 + this.y) * 0.2;
        
        // Wrap around
        if (this.x < -100) this.x = canvas.width + 100;
        if (this.x > canvas.width + 100) this.x = -100;
        if (this.y < -100) this.y = canvas.height + 100;
        if (this.y > canvas.height + 100) this.y = -100;
      }

      draw() {
        if (!ctx) return; // Fix TypeScript errors
        
        ctx.save();
        
        // Apply 3D camera rotation based on mouse position
        const mouseX = mouseRef.current.x;
        const mouseY = mouseRef.current.y;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Calculate rotation angles based on mouse distance from center
        const rotationStrength = 0.0003;
        const cameraRotX = (mouseY - centerY) * rotationStrength;
        const cameraRotY = (mouseX - centerX) * rotationStrength;
        
        ctx.translate(this.x, this.y);
        
        const scale = 1000 / (1000 + this.z);
        ctx.scale(scale, scale);
        
        // Apply camera rotation to the shape
        this.rotationX += cameraRotX * 0.5;
        this.rotationY += cameraRotY * 0.5;
        
        // Holographic glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(100, 200, 255, 0.5)';
        ctx.strokeStyle = `rgba(200, 230, 255, ${0.3 + Math.sin(Date.now() * 0.002 + this.x) * 0.2})`;
        ctx.lineWidth = 2;
        
        if (this.type === 'cube') {
          this.drawWireframeCube();
        } else if (this.type === 'sphere') {
          this.drawWireframeSphere();
        } else if (this.type === 'torus') {
          this.drawWireframeTorus();
        } else if (this.type === 'pyramid') {
          this.drawWireframePyramid();
        }
        
        ctx.restore();
      }

      drawWireframeCube() {
        const s = this.size;
        const vertices = [
          [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
          [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
        ];
        
        const rotated = vertices.map(v => this.rotateVertex(v));
        const edges = [
          [0,1], [1,2], [2,3], [3,0],
          [4,5], [5,6], [6,7], [7,4],
          [0,4], [1,5], [2,6], [3,7]
        ];
        
        edges.forEach(([i, j]) => {
          ctx.beginPath();
          ctx.moveTo(rotated[i][0], rotated[i][1]);
          ctx.lineTo(rotated[j][0], rotated[j][1]);
          ctx.stroke();
        });
      }

      drawWireframeSphere() {
        const rings = 8;
        const segments = 12;
        
        for (let i = 0; i <= rings; i++) {
          ctx.beginPath();
          for (let j = 0; j <= segments; j++) {
            const theta = (j / segments) * Math.PI * 2;
            const phi = (i / rings) * Math.PI;
            const x = this.size * Math.sin(phi) * Math.cos(theta);
            const y = this.size * Math.sin(phi) * Math.sin(theta);
            const z = this.size * Math.cos(phi);
            const [rx, ry] = this.rotateVertex([x, y, z]);
            if (j === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.stroke();
        }
      }

      drawWireframeTorus() {
        const majorRadius = this.size;
        const minorRadius = this.size * 0.3;
        const segments = 16;
        const sides = 8;
        
        for (let i = 0; i < segments; i++) {
          ctx.beginPath();
          for (let j = 0; j <= sides; j++) {
            const u = (i / segments) * Math.PI * 2;
            const v = (j / sides) * Math.PI * 2;
            const x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
            const y = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
            const z = minorRadius * Math.sin(v);
            const [rx, ry] = this.rotateVertex([x, y, z]);
            if (j === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.stroke();
        }
      }

      drawWireframePyramid() {
        const s = this.size;
        const vertices = [
          [0, -s, 0],
          [-s, s, -s], [s, s, -s],
          [s, s, s], [-s, s, s]
        ];
        
        const rotated = vertices.map(v => this.rotateVertex(v));
        const edges = [[0,1], [0,2], [0,3], [0,4], [1,2], [2,3], [3,4], [4,1]];
        
        edges.forEach(([i, j]) => {
          ctx.beginPath();
          ctx.moveTo(rotated[i][0], rotated[i][1]);
          ctx.lineTo(rotated[j][0], rotated[j][1]);
          ctx.stroke();
        });
      }

      rotateVertex([x, y, z]: number[]): [number, number] {
        // Rotate around X
        let y1 = y * Math.cos(this.rotationX) - z * Math.sin(this.rotationX);
        let z1 = y * Math.sin(this.rotationX) + z * Math.cos(this.rotationX);
        
        // Rotate around Y
        let x1 = x * Math.cos(this.rotationY) + z1 * Math.sin(this.rotationY);
        let z2 = -x * Math.sin(this.rotationY) + z1 * Math.cos(this.rotationY);
        
        // Rotate around Z
        let x2 = x1 * Math.cos(this.rotationZ) - y1 * Math.sin(this.rotationZ);
        let y2 = x1 * Math.sin(this.rotationZ) + y1 * Math.cos(this.rotationZ);
        
        return [x2, y2];
      }
    }

    const shapes: Shape3D[] = [];
    for (let i = 0; i < 8; i++) {
      shapes.push(new Shape3D());
    }

    // Particle connections
    const particles: Array<{ x: number; y: number; vx: number; vy: number }> = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }

    // Animation loop
    function animate() {
      // Dark background with slight transparency for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw code rain
      ctx.fillStyle = 'rgba(0, 255, 100, 0.1)';
      ctx.font = '14px monospace';
      codeDrops.forEach(drop => {
        ctx.fillText(drop.char, drop.x, drop.y);
        drop.y += drop.speed;
        if (drop.y > canvas.height) {
          drop.y = 0;
          drop.x = Math.random() * canvas.width;
        }
      });

      // Update and draw particles
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
      ctx.lineWidth = 1;
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        // Draw connections
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
        
        // Draw particle
        ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw 3D shapes
      shapes.forEach(shape => {
        shape.update();
        shape.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'black' }}
    />
  );
}