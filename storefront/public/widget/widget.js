/**
 * CtxCommerce Domain-Agnostic AI Widget
 * 
 * This script is encapsulated to prevent pollution of the host's global scope.
 * It provides the chat interface and the DOM Context Scanner to make the AI aware 
 * of the user's current environment.
 */
(() => {
    // ---- CONFIGURATION ----

    let cachedProductData = null;
    let productDataParsed = false;

    /**
     * DOM Scanner Logic
     * Extracts semantic product data, parses URL state, and indexes interactive elements.
     * @returns {Object} A structured representation of the current DOM context.
     */
    function scanDOMContext() {
        const context = {
            urlBase: window.location.origin + window.location.pathname,
            urlParams: {},
            productData: null,
            interactiveElements: [],
            browserLanguage: navigator.language || navigator.userLanguage || 'en-US'
        };

        // 1. Parse URL Parameters
        const params = new URLSearchParams(window.location.search);
        for (const [key, value] of params.entries()) {
            context.urlParams[key] = value;
        }

        // 2. Extract application/ld+json SEO data (Cached)
        if (!productDataParsed) {
            const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            jsonLdScripts.forEach(script => {
                try {
                    const data = JSON.parse(script.textContent);
                    // Simple heuristic: look for Product schema or offer types commonly found in ecommerce
                    if (data['@type'] && data['@type'].toLowerCase() === 'product') {
                        cachedProductData = data;
                    }
                } catch (e) {
                    console.warn('CtxScanner: Failed to parse ld+json block.', e);
                }
            });
            productDataParsed = true;
        }
        context.productData = cachedProductData;

        // 3. Map Interactive Elements
        // We find all buttons and links, giving them a unique identifier so the AI can reference them.
        let agentIdCounter = 1;
        const clickableSelectors = 'button, a[href]';
        const elements = document.querySelectorAll(clickableSelectors);

        elements.forEach(el => {
            // Avoid tagging the widget elements themselves
            if (el.closest('#ctx-widget-root')) return;

            // Generate a unique ID if not already present
            if (!el.hasAttribute('data-agent-id')) {
                el.setAttribute('data-agent-id', `ctx-el-${agentIdCounter++}`);
            }

            // Extract meaningful text or context from the element
            const textContent = el.innerText || el.value || el.getAttribute('aria-label') || '';
            const cleanedText = textContent.trim().replace(/\s+/g, ' ');

            if (cleanedText) {
                context.interactiveElements.push({
                    agentId: el.getAttribute('data-agent-id'),
                    type: el.tagName.toLowerCase(),
                    text: cleanedText
                });
            }
        });

        return context;
    }

    // ---- INTERNATIONALIZATION ----

    const i18n = {
        de: {
            greeting: 'Hallo! Ich sehe, du schaust dir unsere Produkte an. Wie kann ich dir heute helfen?',
            networkError: 'Es tut mir leid, ich habe gerade Verbindungsprobleme. Bitte versuche es später erneut.',
            refusal: 'Ich kann diese Anfrage nicht verarbeiten. Ich bin ein KI-Assistent für Produkte und Navigation in diesem Shop. Wie kann ich dir heute helfen?',
            redirecting: '⚙️ System: Weiterleitung zur Produktseite…',
            actionExecuted: '⚙️ System: Der Agent hat eine Aktion auf der Seite ausgeführt.',
            errorMalicious: 'Diese Anfrage kann ich leider nicht verarbeiten. Ich helfe dir gerne bei Produkten, Kategorien und der Navigation im Shop.',
            errorOutOfScope: 'Ich bin ausschließlich für Produktberatung und Shop-Navigation zuständig. Wie kann ich dir dabei helfen?',
            errorProcessing: 'Beim Verarbeiten deiner Anfrage ist leider ein Fehler aufgetreten. Bitte versuche es später erneut.',
            placeholder: 'Frag mich etwas über die Seite…',
            sendButton: 'Senden',
            headerTitle: 'KI-Verkaufsberater',
            headerSubtitle: 'Powered by CtxCommerce',
        },
        en: {
            greeting: 'Hello! I notice you are looking at our products. How can I assist you today?',
            networkError: "I'm sorry, I'm having trouble connecting to the network right now. Please try again later.",
            refusal: "I cannot process this request. I am an AI assistant dedicated to helping you with this store's products and navigation. How can I assist you today?",
            redirecting: '⚙️ System: Redirecting to product page…',
            actionExecuted: '⚙️ System: Agent executed an action on the page.',
            errorMalicious: "I'm unable to process that request. I'm here to help you with products, categories, and store navigation.",
            errorOutOfScope: "I'm dedicated to product advice and store navigation. How can I help you with that?",
            errorProcessing: 'An error occurred while processing your request. Please try again later.',
            placeholder: 'Ask anything about the page…',
            sendButton: 'Send',
            headerTitle: 'AI Sales Guide',
            headerSubtitle: 'Powered by CtxCommerce',
        },
        fr: {
            greeting: "Bonjour ! Je vois que vous regardez nos produits. Comment puis-je vous aider aujourd'hui ?",
            networkError: "Je suis désolé, j'ai des problèmes de connexion. Veuillez réessayer plus tard.",
            refusal: "Je ne peux pas traiter cette demande. Je suis un assistant IA dédié à vous aider avec les produits et la navigation de cette boutique. Comment puis-je vous aider aujourd'hui ?",
            redirecting: '⚙️ Système : Redirection vers la page produit…',
            actionExecuted: `⚙️ Système : L'agent a exécuté une action sur la page.`,
            errorMalicious: "Je ne suis pas en mesure de traiter cette demande. Je suis là pour vous aider avec les produits et la navigation.",
            errorOutOfScope: "Je suis dédié aux conseils produits et à la navigation en boutique. Comment puis-je vous aider ?",
            errorProcessing: "Une erreur s'est produite lors du traitement de votre demande. Veuillez réessayer plus tard.",
            placeholder: 'Posez une question sur la page…',
            sendButton: 'Envoyer',
            headerTitle: 'Guide de Vente IA',
            headerSubtitle: 'Powered by CtxCommerce',
        },
        es: {
            greeting: '¡Hola! Veo que estás mirando nuestros productos. ¿Cómo puedo ayudarte hoy?',
            networkError: 'Lo siento, tengo problemas de conexión. Por favor, inténtalo más tarde.',
            refusal: 'No puedo procesar esta solicitud. Soy un asistente de IA dedicado a ayudarle con los productos y la navegación de esta tienda. ¿Cómo puedo ayudarle hoy?',
            redirecting: '⚙️ Sistema: Redirigiendo a la página del producto…',
            actionExecuted: '⚙️ Sistema: El agente ejecutó una acción en la página.',
            errorMalicious: 'No puedo procesar esa solicitud. Estoy aquí para ayudarte con productos, categorías y navegación en la tienda.',
            errorOutOfScope: 'Me dedico exclusivamente al asesoramiento de productos y navegación en la tienda. ¿Cómo puedo ayudarte?',
            errorProcessing: 'Se ha producido un error al procesar tu solicitud. Por favor, inténtalo más tarde.',
            placeholder: 'Pregunta algo sobre la página…',
            sendButton: 'Enviar',
            headerTitle: 'Guía de Ventas IA',
            headerSubtitle: 'Powered by CtxCommerce',
        },
    };

    /**
     * Resolves the user's preferred UI language from the browser locale.
     * Falls back to 'en' for unsupported locales.
     */
    function resolveLanguage() {
        const raw = (navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase();
        return i18n[raw] ? raw : 'en';
    }

    // ---- ERROR KEY MAP ----
    // Backend returns machine-readable keys; the widget maps them to i18n.
    const ERROR_KEY_MAP = {
        'error_malicious': 'errorMalicious',
        'error_out_of_scope': 'errorOutOfScope',
        'error_processing': 'errorProcessing',
    };

    // ---- UI Component Logic ----

    class CtxAIAgent extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });

            this.isOpen = false;
            this.API_URL = "http://localhost:8000/api/chat";
            this.isWaitingForResponse = false;
            this.sessionId = this.initSession();
            this.lang = resolveLanguage();
            this.t = i18n[this.lang];
        }

        connectedCallback() {
            // Wait for element to be attached before actually building the DOM to prevent FOUC / lifecycle bugs
            this.initUI();
            this.attachEventListeners();
        }

        initSession() {
            let sid = localStorage.getItem('ctx_session_id');
            if (!sid) {
                // Generate a standard UUID v4 securely
                if (crypto && crypto.randomUUID) {
                    sid = crypto.randomUUID();
                } else {
                    sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                }
                localStorage.setItem('ctx_session_id', sid);
            }
            return sid;
        }

        async restoreHistory() {
            try {
                const response = await fetch(`${this.API_URL}/history`, {
                    headers: { 'X-Session-ID': this.sessionId }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.history && data.history.length > 0) {
                        data.history.forEach(item => {
                            this.addMessage(item.content, item.role === 'user');
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to restore chat history:", error);
            }
        }

        initUI() {
            // Inject foundational HTML Structure and CSS for the Chat elements into Shadow DOM
            this.shadowRoot.innerHTML = `
                <link rel="stylesheet" href="/widget/widget.css">
                <div id="ctx-widget-root" class="ctx-widget-container">
                    <!-- Expanded Chat Window -->
                    <div class="ctx-chat-window" id="ctx-chat-window">
                        <div class="ctx-chat-header">
                            <div>
                                <h3 class="ctx-chat-title">${this.t.headerTitle}</h3>
                                <p class="ctx-chat-subtitle">${this.t.headerSubtitle}</p>
                            </div>
                            <button class="ctx-close-btn" id="ctx-close-btn">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                        </div>
                        <div class="ctx-chat-messages" id="ctx-chat-messages">
                            <div class="ctx-message ctx-message-agent">
                                ${this.t.greeting}
                            </div>
                        </div>
                        <div class="ctx-input-area">
                            <input type="text" class="ctx-input" id="ctx-chat-input" placeholder="${this.t.placeholder}" autocomplete="off">
                            <button class="ctx-send-btn" id="ctx-send-btn">${this.t.sendButton}</button>
                        </div>
                    </div>

                    <!-- Collapsed Trigger Button -->
                    <button class="ctx-trigger-btn" id="ctx-trigger-btn" aria-label="Open AI Chat">
                        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
                    </button>
                </div>
            `;

            // Cache UI DOM elements for easy access
            this.chatWindow = this.shadowRoot.querySelector('#ctx-chat-window');
            this.messagesContainer = this.shadowRoot.querySelector('#ctx-chat-messages');
            this.inputField = this.shadowRoot.querySelector('#ctx-chat-input');
            this.sendBtn = this.shadowRoot.querySelector('#ctx-send-btn');
            this.triggerBtn = this.shadowRoot.querySelector('#ctx-trigger-btn');
            this.closeBtn = this.shadowRoot.querySelector('#ctx-close-btn');

            // Restore visual history from Redis
            this.restoreHistory();
        }

        attachEventListeners() {
            this.triggerBtn.addEventListener('click', () => this.toggleChat(true));
            this.closeBtn.addEventListener('click', () => this.toggleChat(false));

            this.sendBtn.addEventListener('click', () => this.handleSend());
            this.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSend();
            });
        }

        toggleChat(state) {
            this.isOpen = state;
            if (this.isOpen) {
                this.chatWindow.classList.add('ctx-active');
                this.inputField.focus();
                // We use setTimeout to allow display block transformation cycle to finish before scrolling
                setTimeout(() => {
                    this.scrollToBottom();
                }, 100);
            } else {
                this.chatWindow.classList.remove('ctx-active');
            }
        }

        addMessage(text, isUser = false) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `ctx-message ${isUser ? 'ctx-message-user' : 'ctx-message-agent'}`;

            // Simple markdown-to-html replacement for bold text and line breaks from the backend
            let formattedText = text.replace(/\\n/g, '<br>');
            formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            msgDiv.innerHTML = formattedText;
            this.messagesContainer.appendChild(msgDiv);
            this.scrollToBottom();
        }

        /**
         * Resolves an agent_reply string. If it matches an error key from
         * the backend, returns the localized translation. Otherwise returns
         * the original text unchanged (normal LLM response).
         */
        resolveReply(agentReply) {
            const i18nKey = ERROR_KEY_MAP[agentReply];
            if (i18nKey && this.t[i18nKey]) {
                return this.t[i18nKey];
            }
            return agentReply;
        }

        showLoading() {
            if (this.loadingIndicator) return;
            this.loadingIndicator = document.createElement('div');
            this.loadingIndicator.className = 'ctx-loading';
            this.loadingIndicator.innerHTML = `
                <div class="ctx-dot"></div>
                <div class="ctx-dot"></div>
                <div class="ctx-dot"></div>
            `;
            this.messagesContainer.appendChild(this.loadingIndicator);
            this.scrollToBottom();
        }

        removeLoading() {
            if (this.loadingIndicator) {
                this.loadingIndicator.remove();
                this.loadingIndicator = null;
            }
        }

        scrollToBottom() {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }

        async handleSend() {
            const messageStr = this.inputField.value.trim();
            if (!messageStr || this.isWaitingForResponse) return;

            // 1. Display User Message
            this.addMessage(messageStr, true);
            this.inputField.value = '';
            this.isWaitingForResponse = true;

            // 2. Extract context via our DOM Scanner core function
            const currentContext = scanDOMContext();

            // 3. Display Loading State
            this.showLoading();

            try {
                // 4. Dispatch the bundled payload to the FastAPI execution endpoint
                const response = await fetch(this.API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Session-ID': this.sessionId
                    },
                    body: JSON.stringify({
                        user_message: messageStr,
                        dom_context: currentContext
                    })
                });

                if (response.status === 422) {
                    this.removeLoading();
                    this.addMessage(this.t.refusal, false);
                    return;
                }

                if (!response.ok) {
                    throw new Error(`API returned status: ${response.status}`);
                }

                const data = await response.json();

                // 5. Present the Agent's Reply (resolving error keys to i18n)
                this.removeLoading();
                this.addMessage(this.resolveReply(data.agent_reply), false);

                // 6. Action Execution (Browser Control)
                if (data.redirect_url) {
                    this.addMessage(`<i>${this.t.redirecting}</i>`, false);
                    setTimeout(() => {
                        // The backend returns a root-relative path via build_url().
                        window.location.href = data.redirect_url;
                    }, 1500);
                } else if (data.action_target_id) {
                    const targetEl = document.querySelector(`[data-agent-id="${data.action_target_id}"]`);
                    if (targetEl) {
                        try {
                            targetEl.click();
                            // Visual feedback
                            this.addMessage(`<i>${this.t.actionExecuted}</i>`, false);
                        } catch (e) {
                            console.error(`CtxError: Failed to click element ${data.action_target_id}`, e);
                        }
                    } else {
                        console.warn(`CtxScanner: Agent tried to click ${data.action_target_id}, but it was not found in the DOM.`);
                    }
                }

            } catch (error) {
                console.error("CtxError processing chat:", error);
                this.removeLoading();
                this.addMessage(this.t.networkError, false);
            } finally {
                this.isWaitingForResponse = false;
                this.inputField.focus();
            }
        }
    }

    // Define the Web Component (guard against duplicate registration during hot-reload)
    if (!customElements.get('ctx-ai-agent')) {
        customElements.define('ctx-ai-agent', CtxAIAgent);
    }

    // Embed the widget actively into the layout whenever the document finishes loading.
    function injectWidget() {
        if (!document.querySelector('ctx-ai-agent')) {
            document.body.insertAdjacentHTML('beforeend', '<ctx-ai-agent></ctx-ai-agent>');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectWidget);
    } else {
        injectWidget();
    }

})();
