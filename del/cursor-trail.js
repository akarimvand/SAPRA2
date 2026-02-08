// Cursor Trail Effect
(function() {
    let lastX = 0, lastY = 0;
    
    document.addEventListener('mousemove', (e) => {
        if (lastX !== 0 && lastY !== 0) {
            const line = document.createElement('div');
            line.className = 'cursor-trail';
            
            const dx = e.pageX - lastX;
            const dy = e.pageY - lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            line.style.left = lastX + 'px';
            line.style.top = lastY + 'px';
            line.style.width = distance + 'px';
            line.style.transform = `rotate(${angle}deg)`;
            
            document.body.appendChild(line);
            
            setTimeout(() => line.remove(), 800);
        }
        
        lastX = e.pageX;
        lastY = e.pageY;
    });
})();
