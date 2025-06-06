(function(app) {
    'use strict';
    app.sidebarManager = {};

    app.sidebarManager.renderSidebar = function() {
        let html = '';
        const createNodeHTML = (node, level = 0, parentId = null) => {
            const isSelected = app.state.selectedView.type === node.type && app.state.selectedView.id === node.id;
            const hasChildren = node.children && node.children.length > 0;
            let childrenHTML = '';
            let isOpen = node.isOpen || false;
            let isExpanded = isOpen; // For ARIA

            if (app.state.searchTerm && node.children?.some(child => child.name.toLowerCase().includes(app.state.searchTerm))) {
                isOpen = true;
                isExpanded = true;
            }

            if (hasChildren && isOpen) {
                childrenHTML = `<div class="tree-children" role="group" style="display: block;">${node.children.map(child => createNodeHTML(child, level + 1, node.id)).join('')}</div>`;
            } else if (hasChildren) {
                childrenHTML = `<div class="tree-children" role="group" style="display: none;">${node.children.map(child => createNodeHTML(child, level + 1, node.id)).join('')}</div>`;
            }
            const paddingLeft = level * 12 + 12; // px
            const nodeId = `tree-node-${node.type}-${node.id.replace(/[^a-zA-Z0-9-_]/g, '')}`;
            let subtitle = '';
            if (node.type === 'system' && app.state.processedData.systemMap[node.id]) {
                subtitle = `<div class='small' style='font-size:0.78em; color: #ced4da !important;'>${app.state.processedData.systemMap[node.id].name}</div>`;
            }
            if (node.type === 'subsystem' && app.state.processedData.subSystemMap[node.id]) {
                subtitle = `<div class='small' style='font-size:0.78em; color: #ced4da !important;'>${app.state.processedData.subSystemMap[node.id].name}</div>`;
            }
            return `
                <div id="${nodeId}" class="tree-node ${isSelected ? 'selected' : ''} ${isOpen ? 'open' : ''}"
                     role="treeitem" aria-selected="${isSelected}" ${hasChildren ? `aria-expanded="${isExpanded}"` : ''}
                     data-type="${node.type}" data-id="${node.id}" data-name="${node.name}"
                     data-parent-id="${parentId || ''}" style="padding-left: ${paddingLeft}px;" tabindex="${isSelected || (level === 0 && !document.querySelector('.tree-node.selected')) ? '0' : '-1'}">
                    ${node.icon || ''}
                    <span class="flex-grow-1 text-truncate me-2">${node.name}${subtitle}</span>
                    ${hasChildren ? app.constants.ICONS.ChevronRight : ''}
            </div>
                ${childrenHTML}
            `;
        };

        const treeNodes = [
            { id: 'all', name: 'All Systems', type: 'all', icon: app.constants.ICONS.Collection, isOpen: app.state.selectedView.id === 'all' ? true : app.state.processedData.systemMap[app.state.selectedView.parentId]?.isOpenOnSearch }
        ];

        Object.values(app.state.processedData.systemMap).forEach(system => {
            const systemNode = {
                id: system.id,
                name: system.id,
                type: 'system',
                icon: app.constants.ICONS.Folder,
                children: system.subs.map(sub => ({
                    id: sub.id,
                    name: sub.id,
                    type: 'subsystem',
                    icon: app.constants.ICONS.Puzzle,
                    parentId: system.id,
                    isOpen: app.state.selectedView.id === sub.id
                })),
                isOpen: app.state.selectedView.id === system.id || app.state.selectedView.parentId === system.id || (app.state.searchTerm && system.subs.some(s => s.id.toLowerCase().includes(app.state.searchTerm)))
            };
            treeNodes.push(systemNode);
        });

        const filterNodes = (nodes) => {
            if (!app.state.searchTerm) return nodes;
            return nodes.map(node => {
                const isMatch = node.name.toLowerCase().includes(app.state.searchTerm);
                const filteredChildren = node.children ? filterNodes(node.children) : null;
                if (isMatch || (filteredChildren && filteredChildren.length > 0)) {
                    return { ...node, children: filteredChildren, isOpen: true };
                }
                return null;
            }).filter(Boolean);
        };

        const finalTreeNodes = filterNodes(treeNodes);
        html = finalTreeNodes.map(node => createNodeHTML(node)).join('');
         if (finalTreeNodes.length === 0 && app.state.searchTerm) {
            html = `<p class="text-muted text-center small p-3">No matching items found.</p>`;
        }

        app.DOMElements.treeView.innerHTML = `<div role="tree" aria-label="System and Subsystem Navigation">${html}</div>`;
        app.sidebarManager.attachSidebarEventListeners(); // Call namespaced function
    };

    app.sidebarManager.attachSidebarEventListeners = function() {
        app.DOMElements.treeView.querySelectorAll('.tree-node').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const type = this.dataset.type;
                const id = this.dataset.id;
                const name = this.dataset.name;
                const parentId = this.dataset.parentId;

                const targetIsChevron = e.target.classList.contains('chevron-toggle') || e.target.closest('.chevron-toggle');
                const hasChildren = this.hasAttribute('aria-expanded');

                if (targetIsChevron && hasChildren) { // Toggle children
                    const isOpen = this.classList.toggle('open');
                    this.setAttribute('aria-expanded', isOpen);
                    const childrenContainer = this.nextElementSibling;
                    if (childrenContainer && childrenContainer.classList.contains('tree-children')) {
                        childrenContainer.style.display = isOpen ? 'block' : 'none';
                    }
                } else { // Select node
                     app.sidebarManager.handleNodeSelect(type, id, name, parentId); // Call namespaced function
                     if (window.innerWidth < 992) { // Close sidebar on mobile after selection
                        app.DOMElements.sidebar.classList.remove('open');
                        app.DOMElements.mainContent.classList.remove('sidebar-open');
                        app.DOMElements.sidebarOverlay.style.display = 'none';
                        app.DOMElements.sidebarToggle.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });
    };

    app.sidebarManager.handleNodeSelect = function(type, id, name, parentId = null) {
        app.state.selectedView = { type, id, name, parentId };
        // Update aggregatedStats based on the new view
        app.state.aggregatedStats = app.dataLoader._aggregateStatsForView(app.state.selectedView, app.state.processedData.systemMap, app.state.processedData.subSystemMap);
        app.main.updateView(); // Call namespaced function
    };

})(window.SAPRA_APP);
