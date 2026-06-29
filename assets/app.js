(() => {
  const selectors = {
    payload: '#payload',
    tabButtons: '[data-tab-target]',
    tabPanels: '[data-tab-panel]',
    form: '#agent-form',
    input: '#agent-input',
    messages: '#agent-messages',
    status: '#agent-status',
    submitButton: '#agent-submit',
    refreshButton: '#refresh-dashboard',
    promptButtons: '.quick-btn[data-prompt]',
  };

  const state = {
    payload: null,
    isBusy: false,
  };

  const elements = {
    payloadEl: document.querySelector(selectors.payload),
    tabButtons: Array.from(document.querySelectorAll(selectors.tabButtons)),
    tabPanels: Array.from(document.querySelectorAll(selectors.tabPanels)),
    form: document.querySelector(selectors.form),
    input: document.querySelector(selectors.input),
    messages: document.querySelector(selectors.messages),
    status: document.querySelector(selectors.status),
    submitButton: document.querySelector(selectors.submitButton),
    refreshButton: document.querySelector(selectors.refreshButton),
    promptButtons: Array.from(document.querySelectorAll(selectors.promptButtons)),
  };

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const setStatus = (text = '') => {
    if (elements.status) {
      elements.status.textContent = text;
    }
  };

  const setBusy = (busy, text = '') => {
    state.isBusy = busy;

    if (elements.submitButton) {
      elements.submitButton.disabled = busy;
      elements.submitButton.textContent = busy ? 'Thinking...' : 'Ask agent';
    }

    setStatus(text);
  };

  const setActiveTab = (tabId) => {
    elements.tabButtons.forEach((button) => {
      const active = button.dataset.tabTarget === tabId;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    elements.tabPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.tabPanel === tabId);
    });
  };

  const appendMessage = ({ role, text, highlights = [] }) => {
    if (!elements.messages) return;

    const article = document.createElement('article');
    article.className = `msg ${role}`;

    const listMarkup = Array.isArray(highlights) && highlights.length
      ? `<ul>${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '';

    article.innerHTML = `
      <span class="role">${role === 'user' ? 'You' : 'Agent'}</span>
      <div>${escapeHtml(text)}</div>
      ${listMarkup}
    `;

    elements.messages.appendChild(article);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  };

  const seedWelcomeMessage = () => {
    if (!state.payload) return;

    appendMessage({
      role: 'agent',
      text: 'Dashboard ready. I can help you read Lens 1 and Lens 2 in plain language.',
      highlights: [
        `Coverage: ${state.payload.market.coverage} equities`,
        `Total liquidity: $${(state.payload.market.liquidity / 1e6).toFixed(1)}M`,
        `Top narrative: ${state.payload.narratives[0] ? state.payload.narratives[0].name : '-'}`,
      ],
    });
  };

  const bindTabs = () => {
    elements.tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        setActiveTab(button.dataset.tabTarget);
      });
    });
  };

  const bindPromptButtons = () => {
    elements.promptButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!elements.input) return;
        elements.input.value = button.dataset.prompt || '';
        elements.input.focus();
      });
    });
  };

  const handleAgentResponse = (data) => {
    appendMessage({
      role: 'agent',
      text: data.answer,
      highlights: data.highlights || [],
    });

    if (data.lens === 'lens1') {
      setActiveTab('lens1');
    }

    if (data.lens === 'lens2') {
      setActiveTab('lens2');
    }

    setBusy(false, 'Answer ready. Ask a follow-up or switch tabs.');
  };

  const submitQuestion = async (question) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  };

  const bindForm = () => {
    if (!elements.form || !elements.input) return;

    elements.form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const question = elements.input.value.trim();
      if (!question || state.isBusy) return;

      appendMessage({ role: 'user', text: question });
      elements.input.value = '';
      setBusy(true, 'Sending your question to the agent...');

      try {
        const data = await submitQuestion(question);
        handleAgentResponse(data);
      } catch (error) {
        appendMessage({
          role: 'agent',
          text: 'I could not process that request. Please try again or ask in a simpler way.',
        });
        setBusy(false, error.message || 'Request failed');
      }
    });
  };

  const bindRefreshButton = () => {
    if (!elements.refreshButton) return;

    elements.refreshButton.addEventListener('click', async () => {
      elements.refreshButton.disabled = true;
      setStatus('Refreshing dashboard data...');

      try {
        const response = await fetch('/api/payload');
        if (!response.ok) {
          throw new Error('Refresh failed');
        }

        state.payload = await response.json();
        setStatus('Latest payload fetched. Reload the page to fully rerender the dashboard.');
      } catch (error) {
        setStatus(error.message || 'Refresh failed');
      } finally {
        elements.refreshButton.disabled = false;
      }
    });
  };

  const init = () => {
    state.payload = elements.payloadEl ? JSON.parse(elements.payloadEl.textContent) : null;

    bindTabs();
    bindPromptButtons();
    bindForm();
    bindRefreshButton();
    seedWelcomeMessage();
  };

  init();
})();
