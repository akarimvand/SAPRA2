// Presentation Mode Tools
let presentationMode = false;
let drawingMode = false;
let magnifierMode = false;
let laserMode = false;
let canvas, ctx;
let drawings = [];
let scrollOffset = { x: 0, y: 0 };
let drawTimeout;

// Initialize Presentation Mode
function initPresentationMode() {
    const widget = document.getElementById('presentationWidget');
    widget.classList.toggle('show');
    presentationMode = !presentationMode;
    
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'drawingCanvas';
        canvas.width = document.documentElement.scrollWidth;
        canvas.height = document.documentElement.scrollHeight;
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        
        let isDrawing = false;
        let lastX = 0, lastY = 0;
        
        canvas.addEventListener('mousedown', (e) => {
            if (drawingMode) {
                drawTimeout = setTimeout(() => {
                    isDrawing = true;
                    lastX = e.pageX;
                    lastY = e.pageY;
                }, 150);
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (drawingMode && isDrawing) {
                const color = document.getElementById('drawColor').value;
                drawings.push({
                    x1: lastX,
                    y1: lastY,
                    x2: e.pageX,
                    y2: e.pageY,
                    color: color
                });
                redrawCanvas();
                lastX = e.pageX;
                lastY = e.pageY;
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            clearTimeout(drawTimeout);
            if (!isDrawing && drawingMode) {
                e.target.style.pointerEvents = 'none';
                const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
                if (elementBelow) {
                    elementBelow.click();
                }
                setTimeout(() => {
                    e.target.style.pointerEvents = 'auto';
                }, 10);
            }
            isDrawing = false;
        });
    }
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawings.forEach(line => {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
    });
}

// Toggle Drawing Mode
function toggleDrawing() {
    drawingMode = !drawingMode;
    canvas.style.display = drawingMode ? 'block' : 'none';
    canvas.style.pointerEvents = drawingMode ? 'auto' : 'none';
    document.getElementById('drawBtn').classList.toggle('active', drawingMode);
}

// Clear Canvas
function clearDrawing() {
    drawings = [];
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Toggle Laser Pointer
function toggleLaser() {
    laserMode = !laserMode;
    document.getElementById('laserBtn').classList.toggle('active', laserMode);
    
    const laser = document.getElementById('laserPointer') || createLaser();
    laser.style.display = laserMode ? 'block' : 'none';
    
    if (laserMode) {
        document.addEventListener('mousemove', moveLaser);
    } else {
        document.removeEventListener('mousemove', moveLaser);
    }
}

function createLaser() {
    const laser = document.createElement('div');
    laser.id = 'laserPointer';
    document.body.appendChild(laser);
    return laser;
}

function moveLaser(e) {
    const laser = document.getElementById('laserPointer');
    if (laser) {
        laser.style.left = e.pageX + 'px';
        laser.style.top = e.pageY + 'px';
    }
}

// Toggle Spotlight
function toggleSpotlight() {
    const spotlight = document.getElementById('spotlightOverlay') || createSpotlight();
    spotlight.classList.toggle('active');
    document.getElementById('spotlightBtn').classList.toggle('active');
    
    if (spotlight.classList.contains('active')) {
        document.addEventListener('mousemove', moveSpotlight);
    } else {
        document.removeEventListener('mousemove', moveSpotlight);
    }
}

function createSpotlight() {
    const spotlight = document.createElement('div');
    spotlight.id = 'spotlightOverlay';
    document.body.appendChild(spotlight);
    return spotlight;
}

function moveSpotlight(e) {
    const spotlight = document.getElementById('spotlightOverlay');
    if (spotlight) {
        spotlight.style.background = `radial-gradient(circle 150px at ${e.clientX}px ${e.clientY}px, transparent 0%, rgba(0,0,0,0.7) 100%)`;
    }
}

// Magnifier Tool
function toggleMagnifier() {
    magnifierMode = !magnifierMode;
    document.getElementById('magnifierBtn').classList.toggle('active', magnifierMode);
    
    let magnifier = document.getElementById('magnifierLens');
    if (!magnifier) {
        magnifier = createMagnifier();
    }
    magnifier.style.display = magnifierMode ? 'block' : 'none';
    
    if (magnifierMode) {
        document.addEventListener('mousemove', moveMagnifier);
    } else {
        document.removeEventListener('mousemove', moveMagnifier);
    }
}

function createMagnifier() {
    const magnifier = document.createElement('div');
    magnifier.id = 'magnifierLens';
    document.body.appendChild(magnifier);
    return magnifier;
}

function moveMagnifier(e) {
    const magnifier = document.getElementById('magnifierLens');
    if (magnifier) {
        magnifier.style.left = e.clientX + 'px';
        magnifier.style.top = e.clientY + 'px';
        magnifier.style.transform = 'translate(-50%, -50%)';
    }
}

// Close Presentation Mode
function closePresentationMode() {
    presentationMode = false;
    document.getElementById('presentationWidget').classList.remove('show');
    
    if (drawingMode) toggleDrawing();
    if (laserMode) toggleLaser();
    if (magnifierMode) toggleMagnifier();
    
    const spotlight = document.getElementById('spotlightOverlay');
    if (spotlight && spotlight.classList.contains('active')) {
        spotlight.classList.remove('active');
        document.removeEventListener('mousemove', moveSpotlight);
    }
}

// Window resize handler
window.addEventListener('resize', () => {
    if (canvas) {
        canvas.width = document.documentElement.scrollWidth;
        canvas.height = document.documentElement.scrollHeight;
        redrawCanvas();
    }
});

// Clear drawings on modal close
document.addEventListener('hidden.bs.modal', () => {
    clearDrawing();
});

// Clear drawings on tab change
document.addEventListener('shown.bs.tab', () => {
    clearDrawing();
});
