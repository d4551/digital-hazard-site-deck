/**
 * DaisyUI Component Utilities
 * DRY principles: Centralized DaisyUI component creation and manipulation
 * Based on DaisyUI Blueprint patterns from MCP
 */

(function() {
    'use strict';
    
    if (!window.DHUI) {
        window.DHUI = {};
    }
    
    const DHUI = window.DHUI;
    
    /**
     * Create a DaisyUI button component
     * @param {Object} options - Button configuration
     * @returns {HTMLButtonElement|HTMLAnchorElement} Button element
     */
    DHUI.createButton = function(options = {}) {
        const {
            text = '',
            icon = null,
            iconPosition = 'left',
            variant = 'primary',
            size = 'md',
            style = 'btn',
            href = null,
            onclick = null,
            ariaLabel = null,
            loading = false,
            disabled = false,
            classes = '',
            id = null
        } = options;
        
        const element = href ? document.createElement('a') : document.createElement('button');
        const tag = href ? 'a' : 'button';
        
        // Base classes
        const baseClasses = [
            'btn',
            `btn-${variant}`,
            `btn-${size}`,
            style !== 'btn' ? `btn-${style}` : '',
            classes
        ].filter(Boolean).join(' ');
        
        element.className = baseClasses;
        
        if (href) {
            element.href = href;
        }
        
        if (onclick) {
            element.onclick = onclick;
        }
        
        if (ariaLabel) {
            element.setAttribute('aria-label', ariaLabel);
        }
        
        if (disabled) {
            element.disabled = true;
            element.classList.add('btn-disabled');
        }
        
        if (id) {
            element.id = id;
        }
        
        // Add shadow and hover effects (consistent pattern)
        if (variant === 'primary' || variant === 'secondary') {
            element.classList.add('shadow-lg', 'hover:shadow-xl', 'transition-all', 'duration-300', 'hover:scale-105');
        }
        
        // Build content
        const iconEl = icon ? createIcon(icon) : null;
        
        if (loading) {
            element.innerHTML = `<span class="loading loading-spinner loading-sm"></span>`;
            if (text) element.innerHTML += ` ${text}`;
        } else {
            if (iconEl && iconPosition === 'left') {
                element.appendChild(iconEl);
                element.appendChild(document.createTextNode(text ? ` ${text}` : ''));
            } else if (iconEl && iconPosition === 'right') {
                element.appendChild(document.createTextNode(text));
                element.appendChild(iconEl);
            } else {
                element.textContent = text;
            }
        }
        
        return element;
    };
    
    /**
     * Create a DaisyUI badge component
     * @param {Object} options - Badge configuration
     * @returns {HTMLElement} Badge element
     */
    DHUI.createBadge = function(options = {}) {
        const {
            text = '',
            variant = 'primary',
            size = 'md',
            style = 'badge',
            icon = null,
            iconPosition = 'left',
            outline = false,
            classes = '',
            id = null
        } = options;
        
        const element = document.createElement('span');
        element.className = [
            'badge',
            `badge-${variant}`,
            `badge-${size}`,
            outline ? 'badge-outline' : '',
            classes
        ].filter(Boolean).join(' ');
        
        if (id) {
            element.id = id;
        }
        
        if (icon) {
            const iconEl = createIcon(icon);
            if (iconPosition === 'left') {
                element.appendChild(iconEl);
                element.appendChild(document.createTextNode(` ${text}`));
            } else {
                element.appendChild(document.createTextNode(`${text} `));
                element.appendChild(iconEl);
            }
        } else {
            element.textContent = text;
        }
        
        return element;
    };
    
    /**
     * Create a DaisyUI card component
     * @param {Object} options - Card configuration
     * @returns {HTMLElement} Card element
     */
    DHUI.createCard = function(options = {}) {
        const {
            title = null,
            content = '',
            actions = null,
            image = null,
            compact = false,
            bordered = false,
            bgVariant = 'base-100',
            classes = '',
            id = null,
            hover = true
        } = options;
        
        const card = document.createElement('div');
        card.className = [
            'card',
            compact ? 'card-compact' : '',
            bordered ? 'card-bordered' : '',
            `bg-${bgVariant}`,
            hover ? 'hover:shadow-xl transition-all duration-300' : '',
            classes
        ].filter(Boolean).join(' ');
        
        if (id) {
            card.id = id;
        }
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        if (image) {
            const figure = document.createElement('figure');
            const img = document.createElement('img');
            img.src = image.src || image;
            img.alt = image.alt || '';
            figure.appendChild(img);
            card.appendChild(figure);
        }
        
        if (title) {
            const titleEl = document.createElement('h3');
            titleEl.className = 'card-title';
            titleEl.textContent = title;
            cardBody.appendChild(titleEl);
        }
        
        if (content) {
            if (typeof content === 'string') {
                const p = document.createElement('p');
                p.textContent = content;
                cardBody.appendChild(p);
            } else {
                cardBody.appendChild(content);
            }
        }
        
        if (actions) {
            const actionsEl = document.createElement('div');
            actionsEl.className = 'card-actions';
            if (Array.isArray(actions)) {
                actions.forEach(action => {
                    if (typeof action === 'string') {
                        actionsEl.appendChild(action);
                    } else {
                        actionsEl.appendChild(action);
                    }
                });
            } else {
                actionsEl.appendChild(actions);
            }
            cardBody.appendChild(actionsEl);
        }
        
        card.appendChild(cardBody);
        return card;
    };
    
    /**
     * Create a DaisyUI modal dialog
     * @param {Object} options - Modal configuration
     * @returns {HTMLDialogElement} Modal element
     */
    DHUI.createModal = function(options = {}) {
        const {
            id,
            title = '',
            content = '',
            actions = [],
            size = 'md',
            showClose = true,
            backdropClose = true,
            classes = ''
        } = options;
        
        const modal = document.createElement('dialog');
        modal.id = id;
        modal.className = `modal modal-middle ${classes}`;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `${id}-title`);
        
        const modalBox = document.createElement('div');
        modalBox.className = `modal-box bg-base-100 border-2 border-primary/50 shadow-2xl w-11/12 max-w-${size}`;
        
        // Header
        if (title || showClose) {
            const header = document.createElement('div');
            header.className = 'flex items-center justify-between p-4 sm:p-6 border-b border-base-300 bg-base-200/50';
            
            if (title) {
                const titleEl = document.createElement('h3');
                titleEl.id = `${id}-title`;
                titleEl.className = 'font-bold text-xl sm:text-2xl';
                titleEl.textContent = title;
                header.appendChild(titleEl);
            }
            
            if (showClose) {
                const closeBtn = DHUI.createButton({
                    text: '',
                    icon: 'fa-times',
                    variant: 'ghost',
                    size: 'sm',
                    style: 'circle',
                    onclick: () => modal.close(),
                    ariaLabel: 'Close modal'
                });
                header.appendChild(closeBtn);
            }
            
            modalBox.appendChild(header);
        }
        
        // Content
        const contentEl = document.createElement('div');
        contentEl.className = 'p-4 sm:p-6';
        if (typeof content === 'string') {
            contentEl.textContent = content;
        } else {
            contentEl.appendChild(content);
        }
        modalBox.appendChild(contentEl);
        
        // Actions
        if (actions.length > 0) {
            const actionsEl = document.createElement('div');
            actionsEl.className = 'modal-action p-4 sm:p-6';
            actions.forEach(action => {
                actionsEl.appendChild(action);
            });
            modalBox.appendChild(actionsEl);
        }
        
        modal.appendChild(modalBox);
        
        // Backdrop
        if (backdropClose) {
            const backdrop = document.createElement('form');
            backdrop.method = 'dialog';
            backdrop.className = 'modal-backdrop';
            const backdropBtn = document.createElement('button');
            backdropBtn.textContent = 'close';
            backdropBtn.setAttribute('aria-label', 'Close modal');
            backdrop.appendChild(backdropBtn);
            modal.appendChild(backdrop);
        }
        
        return modal;
    };
    
    /**
     * Create a DaisyUI alert component
     * @param {Object} options - Alert configuration
     * @returns {HTMLElement} Alert element
     */
    DHUI.createAlert = function(options = {}) {
        const {
            message = '',
            variant = 'info',
            title = null,
            icon = null,
            dismissible = false,
            classes = '',
            id = null
        } = options;
        
        const alert = document.createElement('div');
        alert.className = [
            'alert',
            `alert-${variant}`,
            'shadow-sm',
            classes
        ].filter(Boolean).join(' ');
        alert.setAttribute('role', 'alert');
        
        if (id) {
            alert.id = id;
        }
        
        if (icon) {
            const iconEl = createIcon(icon, 'stroke-current shrink-0 h-5 w-5');
            alert.appendChild(iconEl);
        }
        
        const content = document.createElement('div');
        if (title) {
            const titleEl = document.createElement('strong');
            titleEl.className = 'font-bold';
            titleEl.textContent = title;
            content.appendChild(titleEl);
            content.appendChild(document.createElement('br'));
        }
        content.appendChild(document.createTextNode(message));
        alert.appendChild(content);
        
        if (dismissible) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn btn-sm btn-circle btn-ghost';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.onclick = () => alert.remove();
            alert.appendChild(closeBtn);
        }
        
        return alert;
    };
    
    /**
     * Create a DaisyUI loading spinner
     * @param {Object} options - Loading configuration
     * @returns {HTMLElement} Loading element
     */
    DHUI.createLoading = function(options = {}) {
        const {
            size = 'md',
            style = 'spinner',
            color = 'primary',
            text = null,
            classes = ''
        } = options;
        
        const container = document.createElement('div');
        container.className = `flex items-center gap-2 ${classes}`;
        
        const spinner = document.createElement('span');
        spinner.className = [
            'loading',
            `loading-${style}`,
            `loading-${size}`,
            `text-${color}`
        ].join(' ');
        container.appendChild(spinner);
        
        if (text) {
            const textEl = document.createElement('span');
            textEl.textContent = text;
            container.appendChild(textEl);
        }
        
        return container;
    };
    
    /**
     * Helper: Create icon element
     * @param {string} icon - Icon class (e.g., 'fa-check', 'fas fa-star')
     * @param {string} classes - Additional classes
     * @returns {HTMLElement} Icon element
     */
    function createIcon(icon, classes = '') {
        const iconEl = document.createElement('i');
        const iconClass = icon.startsWith('fa') ? icon : `fas fa-${icon}`;
        iconEl.className = `${iconClass} ${classes}`.trim();
        iconEl.setAttribute('aria-hidden', 'true');
        return iconEl;
    }
    
    /**
     * Update button loading state
     * @param {HTMLElement} button - Button element
     * @param {boolean} loading - Loading state
     */
    DHUI.setButtonLoading = function(button, loading) {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<span class="loading loading-spinner loading-sm"></span>';
        } else {
            button.disabled = false;
            // Restore original content - would need to store it
        }
    };
    
    /**
     * Show toast notification (DaisyUI pattern)
     * @param {Object} options - Toast configuration
     */
    DHUI.showToast = function(options = {}) {
        const {
            message = '',
            variant = 'info',
            title = null,
            duration = 3000,
            position = 'toast-top toast-end'
        } = options;
        
        const toastContainer = document.querySelector('.toast-container') || createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${position}`;
        
        const alert = DHUI.createAlert({
            message,
            variant,
            title,
            dismissible: true
        });
        
        toast.appendChild(alert);
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after duration
        if (duration > 0) {
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        return toast;
    };
    
    /**
     * Create toast container if it doesn't exist
     * @returns {HTMLElement} Toast container
     */
    function createToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container fixed z-toast';
            container.style.zIndex = 'var(--z-hud-notifications)';
            document.body.appendChild(container);
        }
        return container;
    }
    
    // Export
    window.DHUI = DHUI;
})();
