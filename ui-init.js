// Enhanced UI Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize enhanced tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip, {
            customClass: 'tooltip-enhanced'
        });
    });

    // Initialize enhanced dropdowns
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.classList.add('dropdown-enhanced');
    });

    // Initialize enhanced form controls
    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach(control => {
        control.classList.add('form-control-enhanced');
    });

    // Add enhanced classes to existing elements
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        alert.classList.add('alert-enhanced');
    });

    // Add slide-in animation to sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.add('sidebar-enhanced');
    }

    // Add enhanced classes to tree nodes when they're created
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    // Add enhanced classes to tree nodes
                    const treeNodes = node.querySelectorAll ? node.querySelectorAll('.tree-node') : [];
                    treeNodes.forEach(treeNode => {
                        treeNode.classList.add('tree-node-enhanced');
                    });

                    // Add enhanced classes to charts
                    const chartContainers = node.querySelectorAll ? node.querySelectorAll('.chart-container') : [];
                    chartContainers.forEach(container => {
                        const parent = container.closest('.card-body');
                        if (parent) {
                            parent.classList.add('chart-container-enhanced');
                        }
                    });
                }
            });
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Add enhanced animations to summary cards
    const summaryCards = document.querySelectorAll('.summary-card');
    summaryCards.forEach((card, index) => {
        card.classList.add('fade-in');
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Enhanced button hover effects
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-enhanced')) {
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            e.target.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        }
    });

    // Add loading states to buttons
    const enhancedButtons = document.querySelectorAll('.btn-enhanced');
    enhancedButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Processing...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 2000);
            }
        });
    });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);