const canvas = document.getElementById('stars');
const ctx = canvas ? canvas.getContext('2d') : null;

// Check if canvas and 2D context exist
if (!canvas || !ctx) {
    console.error('Error: Canvas or 2D context not found. Ensure <canvas id="stars"> is in the HTML.');
} else {
    // Star field configuration
    const STAR_CONFIG = {
        starCount: window.innerWidth <= 770 ? 600 : 1000, // Stars total. Up: more, denser. Down: fewer, sparser. fix for small screens
        minSize: window.innerWidth <= 770 ? 0.5 : 0.3, // Min star size (px). Up: bigger. Down: smaller.
        maxSize: window.innerWidth <= 770 ? 0.9 : 0.77, // Max star size (px). Up: bigger. Down: smaller.
        giantStarProbability: 0.03, // Chance for a star to be double maxSize (0.003 = 0.3%)
        twinkleProbability: 0.0005, // Twinkle chance per frame. Up: more twinkles. Down: fewer.
        twinkleDuration: 20,     // Twinkle frames. Up: longer. Down: shorter.
        maxOpacity: 0.9,         // Max brightness. Up: brighter. Down: dimmer.
        minOpacity: 0.3,         // Min brightness. Up: brighter. Down: dimmer.
        lensRadius: 100,         // Mouse effect radius (px). Up: larger area. Down: smaller.
        maxArcStretch: 30,       // Arc stretch. Up: longer arcs. Down: shorter.
        minDisplacementRadius: 50, // Black space radius (px). Up: larger. Down: smaller.
        maxDisplacementOffset: 100, // Star movement (px). Up: farther. Down: less.
        arcCurvature: 0.1,      // Arc curve. Up: more curved. Down: straighter.
        returnSpeed: 0.05,       // Interaction speed. Up: faster. Down: slower.
        returnToOriginSpeed: 0.3, // Return to original position speed. Up: faster. Down: slower.
        clusterCount: 20,        // Cluster count. Up: more clusters. Down: fewer, emptier.
        clusterRadius: 170,      // Cluster size (px). Up: larger. Down: smaller.
        jitterFactor: 0.3,       // Placement randomness (0-1). Up: more random. Down: more orderly.
        stdFactor: 2,            // Cluster spread. Up: more central. Down: more edge clusters.
        bufferMultiplier: 0.3    // Edge avoidance. Up: larger safe zone. Down: smaller
    };

    // Generate Gaussian random number for cluster placement
    function gaussianRandom(mean, stdDev) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + z * stdDev;
    }

    // Mouse position
    let mouse = { x: -1000, y: -1000 };

    // Class representing a star
    class Star {
        constructor(x, y) {
            this.x = x; // Original cluster position X
            this.y = y; // Original cluster position Y
            this.currentX = this.x; // Current position X
            this.currentY = this.y; // Current position Y

            // Rare chance for giant stars (double maxSize)
            const isGiant = Math.random() < STAR_CONFIG.giantStarProbability;
            const baseSize = STAR_CONFIG.minSize + Math.random() * (STAR_CONFIG.maxSize - STAR_CONFIG.minSize);
            this.size = isGiant ? baseSize * 2 : baseSize;

            this.opacity = STAR_CONFIG.minOpacity + Math.random() * (STAR_CONFIG.maxOpacity - STAR_CONFIG.minOpacity);
            this.twinkleSpeed = 0.02 + Math.random() * 0.03;
            this.twinkleFrame = 0;
            this.isTwinkling = false;
            this.isInteracting = false; // Interaction state
            this.isGiant = isGiant; // Track if star is giant
        }

        update() {
            // Calculate distance to mouse
            let dx, dy, distance;
            const isNearMouse = () => {
                dx = this.currentX - mouse.x;
                dy = this.currentY - mouse.y;
                distance = Math.sqrt(dx * dx + dy * dy);
                return distance < STAR_CONFIG.lensRadius;
            };

            // Handle twinkling for all stars
            if (!this.isTwinkling && Math.random() < STAR_CONFIG.twinkleProbability) {
                this.isTwinkling = true;
                this.twinkleFrame = 0;
            }

            if (this.isTwinkling) {
                this.twinkleFrame++;
                this.opacity = STAR_CONFIG.minOpacity + (Math.sin(this.twinkleFrame * this.twinkleSpeed) + 1) / 2 * (STAR_CONFIG.maxOpacity - STAR_CONFIG.minOpacity);
                if (this.twinkleFrame >= STAR_CONFIG.twinkleDuration) {
                    this.isTwinkling = false;
                    this.opacity = STAR_CONFIG.minOpacity + Math.random() * (STAR_CONFIG.maxOpacity - STAR_CONFIG.minOpacity);
                }
            }

            // Update position if near mouse
            if (isNearMouse()) {
                this.isInteracting = true;
                // Calculate displacement
                let targetX = this.x;
                let targetY = this.y;

                // Update position based on mouse distance and angle
                // If too close or too far, use max or min displacement
                if (distance < STAR_CONFIG.lensRadius && distance > 0) {
                    const angle = Math.atan2(dy, dx);
                    const effectiveDistance = Math.max(distance, STAR_CONFIG.minDisplacementRadius);
                    const force = (STAR_CONFIG.lensRadius - effectiveDistance) / STAR_CONFIG.lensRadius;
                    targetX = this.x + Math.cos(angle) * force * STAR_CONFIG.maxDisplacementOffset;
                    targetY = this.y + Math.sin(angle) * force * STAR_CONFIG.maxDisplacementOffset;
                }

                // Smooth interpolation during interaction
                this.currentX += (targetX - this.currentX) * STAR_CONFIG.returnSpeed;
                this.currentY += (targetY - this.currentY) * STAR_CONFIG.returnSpeed;
            } else if (this.isInteracting) {
                // Gradually return to original position when interaction ends
                this.isInteracting = false;
                // Interpolate back to original position
                this.currentX += (this.x - this.currentX) * STAR_CONFIG.returnToOriginSpeed;
                this.currentY += (this.y - this.currentY) * STAR_CONFIG.returnToOriginSpeed;
            } else {
                // Continue returning to original position if not yet at origin
                if (Math.abs(this.currentX - this.x) > 0.1 || Math.abs(this.currentY - this.y) > 0.1) {
                    this.currentX += (this.x - this.currentX) * STAR_CONFIG.returnToOriginSpeed;
                    this.currentY += (this.y - this.currentY) * STAR_CONFIG.returnToOriginSpeed;
                } else {
                    // Snap to exact position to prevent drift
                    this.currentX = this.x;
                    this.currentY = this.y;
                }
            }
        }

        drawArc() {
            const dx = this.currentX - mouse.x;
            const dy = this.currentY - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If star is outside lens radius or exactly at center, skip drawing arc
            if (distance >= STAR_CONFIG.lensRadius || distance === 0) return null;

            const effectiveDistance = Math.max(distance, STAR_CONFIG.minDisplacementRadius);
            const force = (STAR_CONFIG.lensRadius - effectiveDistance) / STAR_CONFIG.lensRadius;
            const stretch = 1 + force * (STAR_CONFIG.maxArcStretch - 1);
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            const arcLength = this.size * stretch;
            const halfArc = arcLength / 2;
            const curveOffset = arcLength * STAR_CONFIG.arcCurvature;

            return { x: this.currentX, y: this.currentY, angle, halfArc, curveOffset, opacity: this.opacity, size: this.size };
        }

        drawPoint() {
            ctx.beginPath();
            ctx.arc(this.currentX, this.currentY, this.size, 0, Math.PI * 2);
            // Giant stars are slightly brighter
            const opacity = this.isGiant ? Math.min(this.opacity * 1.2, 1) : this.opacity;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fill();
        }
    }

    // Array of stars
    let stars = [];

    // Initialize canvas
    function initCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Calculate mean and standard deviation for Gaussian distribution
        const meanX = canvas.width / 2;
        const meanY = canvas.height / 2;
        const stdX = canvas.width / STAR_CONFIG.stdFactor;
        const stdY = canvas.height / STAR_CONFIG.stdFactor;

        const bufferX = STAR_CONFIG.clusterRadius * (1 + STAR_CONFIG.bufferMultiplier * STAR_CONFIG.jitterFactor);
        const bufferY = STAR_CONFIG.clusterRadius * (1 + STAR_CONFIG.bufferMultiplier * STAR_CONFIG.jitterFactor);

        // Generate cluster centers with Gaussian distribution
        const clusterCenters = Array.from({ length: STAR_CONFIG.clusterCount }, () => {
            let x = gaussianRandom(meanX, stdX);
            let y = gaussianRandom(meanY, stdY);
            x = Math.max(bufferX, Math.min(x, canvas.width - bufferX));
            y = Math.max(bufferY, Math.min(y, canvas.height - bufferY));
            return { x, y };
        });

        // Generate star positions
        const points = [];
        for (let i = 0; i < STAR_CONFIG.starCount; i++) {
            // Select random cluster
            const cluster = clusterCenters[Math.floor(Math.random() * STAR_CONFIG.clusterCount)];
            // Generate position within cluster radius with jitter
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * STAR_CONFIG.clusterRadius;
            const jitterX = (Math.random() - 0.5) * STAR_CONFIG.clusterRadius * STAR_CONFIG.jitterFactor;
            const jitterY = (Math.random() - 0.5) * STAR_CONFIG.clusterRadius * STAR_CONFIG.jitterFactor;
            let x = cluster.x + Math.cos(angle) * radius + jitterX;
            let y = cluster.y + Math.sin(angle) * radius + jitterY;
            points.push({ x, y });
        }

        // Create stars with generated positions
        stars = points.map(point => new Star(point.x, point.y));
        ctx.imageSmoothingEnabled = false; // Disable smoothing for small stars
    }

    // Optimized animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Separate stars into arcs and points
        const arcs = [];
        ctx.beginPath(); // Start path for points
        stars.forEach(star => {
            star.update();
            const arcData = star.drawArc();
            if (arcData) {
                arcs.push(arcData);
            } else {
                star.drawPoint();
            }
        });
        ctx.fill(); // Draw all points in one pass

        // Draw arcs in batch
        arcs.forEach(({ x, y, angle, halfArc, curveOffset, opacity, size }) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // Define the maximum and minimum thickness
            const maxThickness = size; // Middle thickness
            const minThickness = size * 0.25; // Ends are 1/4 of middle thickness

            // Create a custom path for the arc with varying thickness
            ctx.beginPath();

            // Top curve (from left to right)
            for (let t = 0; t <= 1; t += 0.01) {
                const x = -halfArc + 2 * halfArc * t; // Linearly interpolate x from -halfArc to halfArc
                const curveT = Math.sin(Math.PI * t); // Smooth curve for y (peaks at t=0.5)
                const y = -curveOffset * curveT; // Quadratic-like curve
                const thickness = minThickness + (maxThickness - minThickness) * (1 - Math.abs(0.5 - t) * 2); // Linear taper

                // Top edge of the arc
                if (t === 0) {
                    ctx.moveTo(x, y - thickness / 2);
                } else {
                    ctx.lineTo(x, y - thickness / 2);
                }
            }

            // Bottom curve (from right to left)
            for (let t = 1; t >= 0; t -= 0.01) {
                const x = -halfArc + 2 * halfArc * t;
                const curveT = Math.sin(Math.PI * t);
                const y = -curveOffset * curveT;
                const thickness = minThickness + (maxThickness - minThickness) * (1 - Math.abs(0.5 - t) * 2);

                // Bottom edge of the arc
                ctx.lineTo(x, y + thickness / 2);
            }

            // Close the path and fill
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`; // Use fill instead of stroke
            ctx.fill();

            ctx.restore();
        });
        requestAnimationFrame(animate);
    }

    // Handle window resize
    if (window.innerWidth >= 770) {
        window.addEventListener('resize', initCanvas);
    }

    // Track mouse movement
    // Handle mouse and touch movement
    window.addEventListener('mousemove', (event) => {
        console.log('mousemove event');
        const rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
    });

    window.addEventListener('touchstart', (event) => {
        console.log('touchstart event');
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        mouse.x = touch.clientX - rect.left;
        mouse.y = touch.clientY - rect.top;
    });

    // Handle mouse/touch leaving canvas
    canvas.addEventListener('mouseout', (event) => {
        if (!event.relatedTarget || event.relatedTarget === window) {
            mouse.x = -1000;
            mouse.y = -1000;
        }
    });

    canvas.addEventListener('touchend', (event) => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Handle slider input
    const starCountSlider = document.getElementById('starCount');
    const starCountValue = document.getElementById('starCountValue');
    if (starCountSlider && starCountValue) {
        starCountSlider.addEventListener('input', () => {
            STAR_CONFIG.starCount = parseInt(starCountSlider.value);
            starCountValue.textContent = STAR_CONFIG.starCount;
            initCanvas();
        });
    }

    // Initialize and start animation
    initCanvas();
    animate();
}