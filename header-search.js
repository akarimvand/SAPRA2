// Header Search Functionality - Same as Quick Search Modal
let headerSearchTimeout;

// Initialize header search
document.addEventListener('DOMContentLoaded', function() {
    const headerSearchInput = document.getElementById('headerSearchInput');
    const headerSearchResultsDiv = document.getElementById('headerSearchResults');
    
    if (headerSearchInput) {
        headerSearchInput.addEventListener('input', function() {
            clearTimeout(headerSearchTimeout);
            const query = this.value.trim();
            
            if (query.length < 2) {
                hideHeaderSearchResults();
                return;
            }
            
            headerSearchTimeout = setTimeout(() => {
                performHeaderSearch(query);
            }, 300);
        });
        
        // Hide results when clicking outside
        document.addEventListener('click', function(e) {
            if (!headerSearchInput.contains(e.target) && !headerSearchResultsDiv.contains(e.target)) {
                hideHeaderSearchResults();
            }
        });
        
        // Handle keyboard navigation
        headerSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideHeaderSearchResults();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const firstResult = headerSearchResultsDiv.querySelector('.search-result-item');
                if (firstResult) {
                    firstResult.click();
                }
            }
        });
        
        // Focus handling
        headerSearchInput.addEventListener('focus', function() {
            if (this.value.trim().length >= 2) {
                performHeaderSearch(this.value.trim());
            }
        });
    }
});

function performHeaderSearch(query) {
    // Use the same search logic as the quick search modal
    if (typeof window.performQuickSearch === 'function') {
        const results = window.performQuickSearch(query);
        displayHeaderSearchResults(results, query);
    } else {
        // Fallback to direct search if performQuickSearch is not available
        const results = searchInDetailedItems(query);
        displayHeaderSearchResults(results, query);
    }
}

function searchInDetailedItems(query) {
    // Access the same data as quick search modal
    if (!window.detailedItemsData || !Array.isArray(window.detailedItemsData)) {
        return [];
    }
    
    const searchQuery = query.toLowerCase();
    
    return window.detailedItemsData.filter(item => {
        return item.tagNo.toLowerCase().includes(searchQuery) ||
               item.description.toLowerCase().includes(searchQuery) ||
               item.typeCode.toLowerCase().includes(searchQuery) ||
               item.subsystem.toLowerCase().includes(searchQuery) ||
               item.discipline.toLowerCase().includes(searchQuery);
    }).slice(0, 10); // Limit to 10 results for header search
}

function displayHeaderSearchResults(results, query) {
    const resultsDiv = document.getElementById('headerSearchResults');
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<div class="search-result-item text-center text-muted py-3"><i class="bi bi-search me-2"></i>No items found for "' + query + '"</div>';
    } else {
        resultsDiv.innerHTML = results.map(result => `
            <div class="search-result-item" data-tag-no="${result.tagNo}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="search-result-title fw-bold text-primary">${result.tagNo}</div>
                        <div class="search-result-subtitle text-muted small">${result.description}</div>
                        <div class="small text-secondary">
                            <span class="badge bg-primary text-white me-1 subsystem-badge" data-subsystem="${result.subsystem}" style="cursor: pointer;">${result.subsystem}</span>
                            <span class="badge bg-light text-dark me-1">${result.discipline}</span>
                            <span class="badge bg-light text-dark">${result.typeCode}</span>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="badge ${result.status?.toLowerCase() === 'done' ? 'bg-success' : 'bg-warning'}">
                            ${result.status || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers for items (same as quick search modal)
        resultsDiv.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Check if clicked on subsystem badge
                if (e.target.classList.contains('subsystem-badge')) {
                    e.stopPropagation();
                    const subsystemId = e.target.dataset.subsystem;
                    const subsystemData = window.processedData?.subSystemMap[subsystemId];
                    
                    if (subsystemData && typeof window.handleNodeSelect === 'function') {
                        hideHeaderSearchResults();
                        window.handleNodeSelect('subsystem', subsystemId, subsystemData.title || subsystemId, subsystemData.systemId);
                        if (typeof window.showToast === 'function') {
                            window.showToast(`Filtered to subsystem: ${subsystemId}`, 'success');
                        }
                    }
                    return;
                }
                
                // Default behavior - show activities
                const tagNo = item.dataset.tagNo;
                hideHeaderSearchResults();
                
                // Load activities for the selected tag (same as quick search modal)
                if (typeof window.loadActivitiesForTag === 'function' && typeof window.activitiesModal !== 'undefined') {
                    window.loadActivitiesForTag(tagNo);
                    window.activitiesModal.show();
                    
                    if (typeof window.showToast === 'function') {
                        window.showToast(`Showing activities for ${tagNo}`, 'success');
                    }
                }
            });
        });
        
        // Add hover effect for subsystem badges (same as quick search modal)
        resultsDiv.querySelectorAll('.subsystem-badge').forEach(badge => {
            badge.addEventListener('mouseenter', () => {
                badge.style.opacity = '0.8';
            });
            badge.addEventListener('mouseleave', () => {
                badge.style.opacity = '1';
            });
        });
    }
    
    resultsDiv.classList.remove('d-none');
}

function hideHeaderSearchResults() {
    const resultsDiv = document.getElementById('headerSearchResults');
    if (resultsDiv) {
        resultsDiv.classList.add('d-none');
    }
}