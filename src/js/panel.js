import VoiceChat from './voice-chat';
import MeetingMode from './meeting-mode';
import TextChat from './text-chat';

class Panel {
  constructor() {
    this.panelContainer = null;
    this.panel = null;
    this.activeMode = 'voice-chat';
    this.config = null;
    this.modeInstances = {};
    this.init();
  }
  
  init() {
    // Create panel container
    this.panelContainer = document.createElement('div');
    this.panelContainer.className = 'kiaan-panel-container';
    
    // Create panel
    this.panel = document.createElement('div');
    this.panel.className = 'kiaan-panel';
    
    // Create panel header
    const panelHeader = document.createElement('div');
    panelHeader.className = 'kiaan-panel-header';
    
    const panelTitle = document.createElement('div');
    panelTitle.className = 'kiaan-panel-title';
    panelTitle.textContent = 'Kiaan Voice Assistant';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'kiaan-panel-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.close());
    
    panelHeader.appendChild(panelTitle);
    panelHeader.appendChild(closeButton);
    
    // Create tabs with more explicit click handling
    const tabs = document.createElement('div');
    tabs.className = 'kiaan-panel-tabs';
    
    const modes = [
      { id: 'voice-chat', label: 'Voice Chat' },
      { id: 'meeting', label: 'Meeting' },
      { id: 'text-chat', label: 'Text Chat' }
    ];
    
    modes.forEach(mode => {
      const tab = document.createElement('div');
      tab.className = `kiaan-panel-tab ${mode.id === this.activeMode ? 'active' : ''}`;
      tab.textContent = mode.label;
      tab.dataset.mode = mode.id;
      
      // Add an explicit onclick handler
      tab.onclick = (e) => {
        console.log(`Tab clicked: ${mode.id}`);
        e.preventDefault();
        e.stopPropagation();
        this.switchMode(mode.id);
        return false;
      };
      
      tabs.appendChild(tab);
    });
    
    // Create content area
    const content = document.createElement('div');
    content.className = 'kiaan-panel-content';
    
    // Create mode containers
    modes.forEach(mode => {
      const modeContainer = document.createElement('div');
      modeContainer.className = `kiaan-mode ${mode.id === this.activeMode ? 'active' : ''}`;
      modeContainer.id = `kiaan-${mode.id}-mode`;
      content.appendChild(modeContainer);
    });
    
    // Assemble panel
    this.panel.appendChild(panelHeader);
    this.panel.appendChild(tabs);
    this.panel.appendChild(content);
    
    // Add to DOM
    this.panelContainer.appendChild(this.panel);
    document.body.appendChild(this.panelContainer);
    
    // Add event listener to close panel when clicking outside
    this.panelContainer.addEventListener('click', (e) => {
      if (e.target === this.panelContainer) {
        this.close();
      }
    });
  }
  
  setConfig(config) {
    console.log('Setting panel config:', config);
    this.config = config;
    
    // Initialize active mode if config is available
    if (config) {
      this.initializeMode(this.activeMode);
    }
  }
  
  initializeMode(modeId) {
    console.log(`Initializing mode: ${modeId}`);
    if (!this.config) {
      console.log('No config available, using dummy config');
      // Create dummy config for testing
      this.config = {
        agents: {
          chat: { id: 'test-chat-id', voice_id: 'voice-id-a' },
          meeting: { id: 'test-meeting-id', voice_id: 'voice-id-b' }
        },
        webhooks: {
          text_chat: '/api/chat',
          file_upload: '/api/upload'
        }
      };
    }
    
    // Get container for this mode
    const container = document.getElementById(`kiaan-${modeId}-mode`);
    if (!container) {
      console.error(`Container not found for mode: ${modeId}`);
      return;
    }
    
    // Clean up existing instance if any
    if (this.modeInstances[modeId]) {
      if (typeof this.modeInstances[modeId].destroy === 'function') {
        this.modeInstances[modeId].destroy();
      }
      delete this.modeInstances[modeId];
    }
    
    // Initialize based on mode
    try {
      switch (modeId) {
        case 'voice-chat':
          console.log('Creating voice chat instance');
          this.modeInstances[modeId] = new VoiceChat(container, this.config);
          break;
        case 'meeting':
          console.log('Creating meeting instance');
          this.modeInstances[modeId] = new MeetingMode(container, this.config);
          break;
        case 'text-chat':
          console.log('Creating text chat instance');
          this.modeInstances[modeId] = new TextChat(container, this.config);
          break;
      }
    } catch (error) {
      console.error(`Error initializing ${modeId} mode:`, error);
    }
  }
  
  open() {
    // Prevent page scrolling
    document.body.style.overflow = 'hidden';
    
    // Show panel with animation
    this.panelContainer.classList.add('active');
    
    // Hide the orb while panel is open
    if (window.KiaanVoiceOrb && window.KiaanVoiceOrb.orb) {
      window.KiaanVoiceOrb.orb.hideOrb();
    }
    
    // Initialize the active mode if not already initialized
    if (!this.modeInstances[this.activeMode] && this.config) {
      this.initializeMode(this.activeMode);
    }
  }
  
  close() {
    // Re-enable page scrolling
    document.body.style.overflow = '';
    
    // Hide panel with animation
    this.panelContainer.classList.remove('active');
    
    // Show the orb again
    if (window.KiaanVoiceOrb && window.KiaanVoiceOrb.orb) {
      window.KiaanVoiceOrb.orb.showOrb();
    }
  }
  
  // Add a more robust switchMode method
  switchMode(modeId) {
    console.log(`Switching to mode: ${modeId}`);
    
    // Update active tab
    const tabs = this.panel.querySelectorAll('.kiaan-panel-tab');
    tabs.forEach(tab => {
      if (tab.dataset.mode === modeId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update active mode content
    const modes = this.panel.querySelectorAll('.kiaan-mode');
    modes.forEach(mode => {
      if (mode.id === `kiaan-${modeId}-mode`) {
        mode.classList.add('active');
      } else {
        mode.classList.remove('active');
      }
    });
    
    this.activeMode = modeId;
    
    // Initialize the mode if not already initialized
    if (!this.modeInstances[modeId]) {
      this.initializeMode(modeId);
    }
  }
}

export default Panel;
