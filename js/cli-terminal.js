/**
 * Simulated CLI Terminal Component
 * Think Different. Break the Meta. Be OP.
 * 
 * Features:
 * - Simulated command-line interface with typing effects
 * - API call simulations with loading states
 * - Auto-complete functionality
 * - Command history
 * - Gaming-style prompt and aesthetics
 */

(function() {
    'use strict';

    // CLI Commands and API simulations
    const COMMANDS = {
        help: {
            description: 'Show available commands',
            usage: 'help [command]',
            execute: function(args, terminal) {
                if (args.length > 0) {
                    const cmd = COMMANDS[args[0]];
                    if (cmd) {
                        return `<div class="text-accent">${args[0]}</div><div class="text-base-content/80">${cmd.description}</div><div class="text-base-content/60">Usage: ${cmd.usage}</div>`;
                    }
                    return `<span class="text-error">Command not found: ${args[0]}</span>`;
                }
                let output = '<div class="text-primary font-bold mb-2">[AVAILABLE COMMANDS]</div>';
                for (const [name, cmd] of Object.entries(COMMANDS)) {
                    output += `<div class="ml-2 mb-1"><span class="text-accent">${name}</span> - ${cmd.description}</div>`;
                }
                output += '<div class="mt-2 text-base-content/60">Type "help [command]" for more info</div>';
                return output;
            }
        },
        status: {
            description: 'Check system status',
            usage: 'status',
            execute: async function(args, terminal) {
                terminal.simulateLoading('Querying system status...');
                await terminal.delay(1500);
                
                const stats = {
                    'Power Level': 'MAX ★★★★★',
                    'Meta Status': 'BROKEN',
                    'AI Engine': 'ONLINE',
                    'Game Mode': 'HARD MODE',
                    'Players Connected': '3.42B',
                    'Studio Status': 'OP'
                };
                
                let output = '<div class="text-success font-bold">[STATUS: OPERATIONAL]</div>';
                for (const [key, value] of Object.entries(stats)) {
                    output += `<div class="ml-2"><span class="text-secondary">${key}:</span> <span class="text-primary">${value}</span></div>`;
                }
                return output;
            }
        },
        api: {
            description: 'Simulate API calls to studio systems',
            usage: 'api [endpoint]',
            execute: async function(args, terminal) {
                if (args.length === 0) {
                    return '<span class="text-error">Error: Endpoint required</span>\n<span class="text-base-content/60">Available: /projects, /team, /stats, /ai-engine</span>';
                }
                
                const endpoint = args[0];
                terminal.simulateLoading(`Calling API: ${endpoint}...`);
                await terminal.delay(2000);
                
                const responses = {
                    '/projects': {
                        status: 200,
                        data: {
                            projects: [
                                { name: 'Project Cobalt', status: 'ALPHA', power: 'MAX' },
                                { name: 'HazAI', status: 'BETA', market: '$155B' }
                            ]
                        }
                    },
                    '/team': {
                        status: 200,
                        data: {
                            members: 14,
                            experience: 'Riot, Disney, Marvel, DC, Activision, Naughty Dog, Pixar',
                            class: 'Artisan'
                        }
                    },
                    '/stats': {
                        status: 200,
                        data: {
                            market: '$177.9B',
                            ai_adoption: '52%',
                            dev_cost: '$200M+',
                            target_market: '$155B'
                        }
                    },
                    '/ai-engine': {
                        status: 200,
                        data: {
                            name: 'HazardForge',
                            status: 'ONLINE',
                            features: ['Real-time generation', 'Artist-centric', 'Production-ready']
                        }
                    }
                };
                
                const response = responses[endpoint] || {
                    status: 404,
                    error: 'Endpoint not found'
                };
                
                let output = `<div class="text-accent">HTTP ${response.status}</div>`;
                if (response.data) {
                    output += `<pre class="text-success ml-2">${JSON.stringify(response.data, null, 2)}</pre>`;
                } else {
                    output += `<div class="text-error">${response.error}</div>`;
                }
                return output;
            }
        },
        hack: {
            description: 'Break the system (Easter egg)',
            usage: 'hack [target]',
            execute: async function(args, terminal) {
                terminal.simulateLoading('Initiating hack sequence...');
                await terminal.delay(1000);
                
                const messages = [
                    'Bypassing firewall...',
                    'Exploiting vulnerability...',
                    'Gaining root access...',
                    'Breaking the meta...'
                ];
                
                for (const msg of messages) {
                    terminal.addLine(`<span class="text-warning">${msg}</span>`);
                    await terminal.delay(800);
                }
                
                // Award points
                if (window.game && window.game.foundEasterEgg) {
                    window.game.foundEasterEgg('cli-hacker', 'Master Hacker', 500);
                }
                
                return '<div class="text-success font-bold animate-pulse">[SUCCESS] System compromised. You are now OP.</div>';
            }
        },
        clear: {
            description: 'Clear terminal',
            usage: 'clear',
            execute: function(args, terminal) {
                terminal.clear();
                return null;
            }
        },
        echo: {
            description: 'Echo text',
            usage: 'echo [text]',
            execute: function(args) {
                return args.join(' ');
            }
        },
        launch: {
            description: 'Launch game or feature',
            usage: 'launch [game|deck]',
            execute: async function(args, terminal) {
                if (args.length === 0) {
                    return '<span class="text-error">Specify what to launch: game, deck</span>';
                }
                
                terminal.simulateLoading(`Launching ${args[0]}...`);
                await terminal.delay(1500);
                
                if (args[0] === 'game') {
                    const gameModal = document.getElementById('gameModal');
                    if (gameModal) {
                        gameModal.showModal();
                        return '<span class="text-success">Game launched!</span>';
                    }
                    return '<span class="text-error">Game not available</span>';
                } else if (args[0] === 'deck') {
                    window.location.href = 'present.html';
                    return '<span class="text-success">Redirecting to pitch deck...</span>';
                }
                
                return `<span class="text-error">Unknown target: ${args[0]}</span>`;
            }
        },
        stats: {
            description: 'Show your stats',
            usage: 'stats',
            execute: function(args, terminal) {
                const points = localStorage.getItem(window.CONFIG?.STORAGE?.POINTS) || 0;
                const level = localStorage.getItem(window.CONFIG?.STORAGE?.LEVEL) || 1;
                const badges = JSON.parse(localStorage.getItem(window.CONFIG?.STORAGE?.BADGES) || '[]');
                
                let output = '<div class="text-primary font-bold">[YOUR STATS]</div>';
                output += `<div class="ml-2"><span class="text-accent">Level:</span> ${level}</div>`;
                output += `<div class="ml-2"><span class="text-accent">Points:</span> ${points}</div>`;
                output += `<div class="ml-2"><span class="text-accent">Badges:</span> ${badges.length}</div>`;
                output += `<div class="ml-2"><span class="text-accent">Status:</span> <span class="text-success">PLAYER</span></div>`;
                
                return output;
            }
        }
    };

    class CLITerminal {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error('[CLI] Container not found:', containerId);
                return;
            }
            
            this.history = [];
            this.historyIndex = -1;
            this.isProcessing = false;
            
            this.init();
        }
        
        init() {
            this.render();
            this.attachEventListeners();
            this.showWelcome();
        }
        
        render() {
            this.container.innerHTML = `
                <div class="cli-terminal bg-base-300/90 backdrop-blur-xl rounded-xl border-2 border-primary/50 shadow-2xl overflow-hidden font-mono">
                    <div class="cli-header bg-base-100/50 px-4 py-2 border-b border-primary/30 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-error"></div>
                            <div class="w-3 h-3 rounded-full bg-warning"></div>
                            <div class="w-3 h-3 rounded-full bg-success"></div>
                        </div>
                        <div class="text-primary text-sm font-bold">DIGITAL_HAZARD://TERMINAL</div>
                        <button class="btn btn-xs btn-ghost" onclick="window.cliTerminal?.toggle()">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                    <div class="cli-output p-4 h-96 overflow-y-auto" id="cliOutput"></div>
                    <div class="cli-input-container bg-base-100/50 px-4 py-2 border-t border-primary/30 flex items-center gap-2">
                        <span class="text-primary">$</span>
                        <input 
                            type="text" 
                            class="cli-input flex-1 bg-transparent border-none outline-none text-base-content" 
                            id="cliInput"
                            placeholder="Type 'help' for available commands..."
                            autocomplete="off"
                            spellcheck="false"
                        />
                    </div>
                </div>
            `;
            
            this.output = document.getElementById('cliOutput');
            this.input = document.getElementById('cliInput');
        }
        
        attachEventListeners() {
            if (!this.input) return;
            
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !this.isProcessing) {
                    this.executeCommand(this.input.value.trim());
                    this.input.value = '';
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateHistory(-1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateHistory(1);
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.autoComplete();
                }
            });
        }
        
        showWelcome() {
            const welcome = `
                <div class="text-primary font-bold text-lg mb-2 animate-pulse">
                ██████╗ ██╗ ██████╗ ██╗████████╗ █████╗ ██╗     
                ██╔══██╗██║██╔════╝ ██║╚══██╔══╝██╔══██╗██║     
                ██║  ██║██║██║  ███╗██║   ██║   ███████║██║     
                ██║  ██║██║██║   ██║██║   ██║   ██╔══██║██║     
                ██████╔╝██║╚██████╔╝██║   ██║   ██║  ██║███████╗
                ╚═════╝ ╚═╝ ╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝
                </div>
                <div class="text-secondary mb-2">HAZARD TERMINAL v2.0.25</div>
                <div class="text-base-content/70 mb-4">Break the Meta. Be OP. Think Different.</div>
                <div class="text-accent">Type 'help' to see available commands</div>
                <div class="my-2 border-t border-primary/20"></div>
            `;
            
            this.output.innerHTML = welcome;
        }
        
        async executeCommand(cmdString) {
            if (!cmdString) return;
            
            // Add to history
            this.history.push(cmdString);
            this.historyIndex = this.history.length;
            
            // Display command (escape user input)
            const escapedCmd = this.escapeHTML(cmdString);
            this.addLine(`<span class="text-primary">$</span> ${escapedCmd}`);
            
            // Parse command
            const parts = cmdString.trim().split(/\s+/);
            const cmd = parts[0].toLowerCase();
            const args = parts.slice(1);
            
            // Execute command
            const command = COMMANDS[cmd];
            if (command) {
                this.isProcessing = true;
                try {
                    const result = await command.execute(args, this);
                    if (result !== null) {
                        this.addLine(result);
                    }
                } catch (error) {
                    this.addLine(`<span class="text-error">Error: ${error.message}</span>`);
                }
                this.isProcessing = false;
            } else {
                this.addLine(`<span class="text-error">Command not found: ${cmd}</span>`);
                this.addLine('<span class="text-base-content/60">Type "help" for available commands</span>');
            }
            
            // Scroll to bottom
            this.scrollToBottom();
        }
        
        addLine(html) {
            const line = document.createElement('div');
            line.className = 'cli-line mb-1';
            // Sanitize HTML to prevent XSS - only allow safe HTML from trusted command outputs
            line.innerHTML = this.sanitizeHTML(html);
            this.output.appendChild(line);
        }
        
        sanitizeHTML(html) {
            // Create a temporary div to parse HTML
            const temp = document.createElement('div');
            temp.textContent = html; // This escapes all HTML
            
            // For command output formatting, we use a strict allowlist approach
            // Only allow specific safe patterns from our trusted command outputs
            const dangerousPatterns = [
                /<script/i,
                /<iframe/i,
                /javascript:/i,
                /data:/i,
                /on\w+\s*=/i, // Event handlers (onclick, onerror, onload, etc.)
                /<embed/i,
                /<object/i,
                /<link/i,
                /<meta/i,
                /<form/i,
                /<input/i,
                /<button/i
            ];
            
            // Check for any dangerous patterns
            const hasDangerousContent = dangerousPatterns.some(pattern => pattern.test(html));
            
            if (hasDangerousContent) {
                // Return escaped text for any suspicious content
                return temp.innerHTML;
            }
            
            // Only allow very specific safe tags for formatting
            const allowedTags = /<\/?(?:div|span|pre|br)[^>]*>/i;
            const hasOnlySafeTags = allowedTags.test(html) && !/<\w+\s+\w+=/i.test(html); // No attributes except class
            
            if (hasOnlySafeTags && /class="[^"]*"/.test(html)) {
                // Allow only class attributes on safe tags
                return html;
            } else if (html.includes('<') || html.includes('>')) {
                // If it looks like HTML but doesn't match safe patterns, escape it
                return temp.innerHTML;
            }
            
            // Plain text, return as-is
            return html;
        }
        
        escapeHTML(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        simulateLoading(message) {
            const loader = document.createElement('div');
            loader.className = 'cli-loading text-warning flex items-center gap-2';
            
            const spinner = document.createElement('span');
            spinner.className = 'loading loading-spinner loading-xs';
            
            const messageSpan = document.createElement('span');
            messageSpan.textContent = message; // Safe - uses textContent
            
            loader.appendChild(spinner);
            loader.appendChild(messageSpan);
            this.output.appendChild(loader);
            this.scrollToBottom();
        }
        
        clear() {
            this.output.innerHTML = '';
        }
        
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        navigateHistory(direction) {
            const newIndex = this.historyIndex + direction;
            if (newIndex >= 0 && newIndex < this.history.length) {
                this.historyIndex = newIndex;
                this.input.value = this.history[this.historyIndex];
            } else if (newIndex === this.history.length) {
                this.historyIndex = newIndex;
                this.input.value = '';
            }
        }
        
        autoComplete() {
            const partial = this.input.value.trim().toLowerCase();
            if (!partial) return;
            
            const matches = Object.keys(COMMANDS).filter(cmd => cmd.startsWith(partial));
            if (matches.length === 1) {
                this.input.value = matches[0] + ' ';
            } else if (matches.length > 1) {
                this.addLine(`<span class="text-accent">Suggestions:</span> ${matches.join(', ')}`);
                this.scrollToBottom();
            }
        }
        
        scrollToBottom() {
            this.output.scrollTop = this.output.scrollHeight;
        }
        
        toggle() {
            this.container.classList.toggle('hidden');
        }
    }

    // Initialize CLI when DOM is ready
    function initCLI() {
        // Create CLI container if it doesn't exist
        let cliContainer = document.getElementById('cliTerminalContainer');
        if (!cliContainer) {
            cliContainer = document.createElement('div');
            cliContainer.id = 'cliTerminalContainer';
            cliContainer.className = 'fixed bottom-4 right-4 z-50 w-full max-w-2xl hidden';
            cliContainer.style.maxHeight = '600px';
            document.body.appendChild(cliContainer);
        }
        
        window.cliTerminal = new CLITerminal('cliTerminalContainer');
        
        // Add toggle button to navbar
        addCLIToggleButton();
        
        console.log('[CLI] Terminal initialized');
    }
    
    function addCLIToggleButton() {
        // Find the powerup container or navigation area
        const powerupContainer = document.getElementById('powerupContainer');
        const navArea = document.querySelector('.site-footer') || document.querySelector('nav');
        
        if (powerupContainer) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-circle btn-info btn-lg shadow-xl relative tooltip tooltip-left hover:animate__animated hover:animate__pulse';
            btn.setAttribute('data-tip', 'Terminal: Open CLI');
            btn.setAttribute('aria-label', 'Open Terminal');
            btn.innerHTML = `<i class="fas fa-terminal text-2xl"></i>`;
            btn.onclick = () => {
                window.cliTerminal?.toggle();
                // Award points for discovering CLI
                if (window.game && window.game.foundEasterEgg) {
                    window.game.foundEasterEgg('cli-discoverer', 'Terminal Explorer', 250);
                }
            };
            powerupContainer.appendChild(btn);
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCLI);
    } else {
        initCLI();
    }
    
    // Export for external access
    window.CLITerminal = CLITerminal;
    window.CLI_COMMANDS = COMMANDS;
})();
