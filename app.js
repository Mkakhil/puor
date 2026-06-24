/* -------------------------------------------------------------
 * PUOR - Interactive Javascript Controller
 * Handles themes, canvas waves, physics droplet & countdown.
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- DOM Elements ---
  const htmlElement = document.documentElement;

  const fluidCanvas = document.getElementById('fluid-canvas');
  const droplet = document.getElementById('droplet');



  // --- Theme Toggle Logic ---
  const activeThemeColors = {
    dark: {
      wave1: 'rgba(0, 210, 255, 0.06)',
      wave2: 'rgba(0, 245, 212, 0.05)',
      wave3: 'rgba(9, 13, 22, 0.5)'
    },
    light: {
      wave1: 'rgba(2, 132, 199, 0.06)',
      wave2: 'rgba(13, 148, 136, 0.05)',
      wave3: 'rgba(238, 242, 245, 0.6)'
    }
  };

  let currentColors = activeThemeColors.light;

  const setTheme = (theme) => {
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('puor-theme', theme);
    currentColors = activeThemeColors[theme];
  };

  // Check saved theme
  const savedTheme = localStorage.getItem('puor-theme');
  
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    setTheme('light');
  }





  // --- Fluid Background Canvas Wave Logic ---
  const ctx = fluidCanvas.getContext('2d');
  let animationFrameId;

  const resizeCanvas = () => {
    const scale = window.devicePixelRatio || 1;
    fluidCanvas.width = window.innerWidth * scale;
    fluidCanvas.height = window.innerHeight * scale;
    ctx.scale(scale, scale);
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Wave configurations
  const waves = [
    {
      amplitude: 45,
      frequency: 0.003,
      speed: 0.008,
      offset: 0,
      colorKey: 'wave3' // bottom backing wave
    },
    {
      amplitude: 28,
      frequency: 0.006,
      speed: -0.012,
      offset: 0,
      colorKey: 'wave2' // mid wave
    },
    {
      amplitude: 20,
      frequency: 0.009,
      speed: 0.018,
      offset: 0,
      colorKey: 'wave1' // front wave
    }
  ];

  const animateWaves = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    waves.forEach((wave, idx) => {
      ctx.beginPath();
      wave.offset += wave.speed;

      const yOffset = window.innerHeight * 0.65 + (idx * 30); // Wave base height distribution

      // Draw wave path
      for (let x = 0; x <= window.innerWidth; x += 5) {
        const y = Math.sin(x * wave.frequency + wave.offset) * wave.amplitude + yOffset;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineTo(window.innerWidth, window.innerHeight);
      ctx.lineTo(0, window.innerHeight);
      ctx.closePath();

      // Retrieve dynamic theme color
      ctx.fillStyle = currentColors[wave.colorKey];
      ctx.fill();
    });

    animationFrameId = requestAnimationFrame(animateWaves);
  };
  animateWaves();


  // --- Interactive Droplet Physics Engine ---
  const dropletState = {
    currentX: window.innerWidth / 2,
    currentY: window.innerHeight / 2,
    targetX: window.innerWidth * 0.8,
    targetY: window.innerHeight * 0.3,
    vx: 0,
    vy: 0,
    ease: 0.06,
    spring: 0.025,
    friction: 0.85,
    isDragging: false,
    mouseActive: false
  };

  const dropletWidth = 120;
  const dropletHeight = 120;

  // Let droplet float gently when mouse is inactive
  let floatTime = 0;
  const gentleFloat = () => {
    if (!dropletState.mouseActive && !dropletState.isDragging) {
      floatTime += 0.005;
      const centerX = window.innerWidth * 0.8;
      const centerY = window.innerHeight * 0.3;
      // Lissajous curve motion
      dropletState.targetX = centerX + Math.sin(floatTime * 2.5) * 60;
      dropletState.targetY = centerY + Math.cos(floatTime * 1.5) * 40;
    }
  };

  const updateDropletPhysics = () => {
    gentleFloat();

    if (dropletState.isDragging) {
      // Direct tracking during drag
      dropletState.currentX += (dropletState.targetX - dropletState.currentX) * 0.25;
      dropletState.currentY += (dropletState.targetY - dropletState.currentY) * 0.25;
      dropletState.vx = 0;
      dropletState.vy = 0;
    } else {
      // Spring physics
      const ax = (dropletState.targetX - dropletState.currentX) * dropletState.spring;
      const ay = (dropletState.targetY - dropletState.currentY) * dropletState.spring;
      
      dropletState.vx += ax;
      dropletState.vy += ay;
      dropletState.vx *= dropletState.friction;
      dropletState.vy *= dropletState.friction;
      
      dropletState.currentX += dropletState.vx;
      dropletState.currentY += dropletState.vy;
    }

    // Boundaries checking
    const padding = 20;
    if (dropletState.currentX < padding) dropletState.currentX = padding;
    if (dropletState.currentX > window.innerWidth - padding) dropletState.currentX = window.innerWidth - padding;
    if (dropletState.currentY < padding) dropletState.currentY = padding;
    if (dropletState.currentY > window.innerHeight - padding) dropletState.currentY = window.innerHeight - padding;

    // Velocity-based stretching/squashing
    const velocity = Math.sqrt(dropletState.vx * dropletState.vx + dropletState.vy * dropletState.vy);
    const maxStretch = 0.25;
    const stretch = Math.min(velocity * 0.012, maxStretch);
    
    const scaleX = 1 + stretch;
    const scaleY = 1 - stretch;
    
    // Rotate to face direction of travel
    let rotation = 0;
    if (velocity > 0.2) {
      rotation = Math.atan2(dropletState.vy, dropletState.vx) * (180 / Math.PI) - 90;
    }

    // Apply transform
    droplet.style.transform = `translate3d(${dropletState.currentX - dropletWidth/2}px, ${dropletState.currentY - dropletHeight/2}px, 0) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;

    requestAnimationFrame(updateDropletPhysics);
  };
  requestAnimationFrame(updateDropletPhysics);

  // Mouse Move Event Listener
  window.addEventListener('mousemove', (e) => {
    dropletState.mouseActive = true;
    if (!dropletState.isDragging) {
      // Attract droplet towards mouse but keep it somewhat in its quadrant unless close
      const dx = e.clientX - dropletState.currentX;
      const dy = e.clientY - dropletState.currentY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 280) {
        // High attraction if close
        dropletState.targetX = e.clientX;
        dropletState.targetY = e.clientY;
      } else {
        // Soft pull if far, returning slowly to its right-quadrant float zone
        const floatCenterX = window.innerWidth * 0.8;
        const floatCenterY = window.innerHeight * 0.3;
        dropletState.targetX = floatCenterX + dx * 0.15;
        dropletState.targetY = floatCenterY + dy * 0.15;
      }
    } else {
      dropletState.targetX = e.clientX;
      dropletState.targetY = e.clientY;
    }
  });

  // Touch Move Support
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      dropletState.mouseActive = true;
      const touch = e.touches[0];
      dropletState.targetX = touch.clientX;
      dropletState.targetY = touch.clientY;
    }
  }, { passive: true });

  // Handle idle states
  window.addEventListener('mouseout', () => {
    dropletState.mouseActive = false;
  });

  // Drag handlers
  droplet.addEventListener('mousedown', (e) => {
    dropletState.isDragging = true;
    dropletState.targetX = e.clientX;
    dropletState.targetY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    dropletState.isDragging = false;
  });

  droplet.addEventListener('touchstart', (e) => {
    dropletState.isDragging = true;
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      dropletState.targetX = touch.clientX;
      dropletState.targetY = touch.clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    dropletState.isDragging = false;
  });




});

// --- Dynamic CSS Keyframes via JS for Micro-effects ---
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .success-splash-icon {
    animation: success-pulse 1.5s infinite alternate ease-in-out;
  }
  @keyframes success-pulse {
    0% { transform: scale(1); filter: drop-shadow(0 0 0px var(--accent-glow)); }
    100% { transform: scale(1.1); filter: drop-shadow(0 0 8px var(--accent-glow)); }
  }
`;
document.head.appendChild(styleSheet);
