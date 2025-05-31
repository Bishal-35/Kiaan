import VoiceOrb from './orb';
import Panel from './panel';
// Import CSS directly - these paths will be handled by webpack
import '../css/orb.css';
import '../css/panel.css';
import '../css/voice-chat.css';
import '../css/text-chat.css';

class KiaanVoiceOrbClass {
  constructor() {
    this.orb = null;
    this.panel = null;
    this.config = null;
    
    // Add version info
    this.version = '1.0.0';
    
    // Detect environment
    this.isProduction = process.env.NODE_ENV === 'production' || 
                       window.location.protocol === 'https:' ||
                       !window.location.hostname.includes('localhost');
  }
  
  init(options = {}) {
    const { configUrl, config } = options;
    
    // Always log initialization regardless of environment
    this.log(`Kiaan Voice Orb v${this.version} initializing...`);
    this.log(`Environment: ${this.isProduction ? 'Production' : 'Development'}`);
    
    // Create orb and panel
    this.orb = new VoiceOrb();
    this.panel = new Panel();
    
    // Set up orb click handler
    this.orb.setClickHandler(() => {
      this.panel.open();
    });
    
    // Use provided config directly if available
    if (config) {
      this.log('Using provided config');
      this.config = config;
      this.panel.setConfig(config);
    }
    // Otherwise fetch configuration if URL provided
    else if (configUrl) {
      this.fetchConfig(configUrl);
    }
    // Ensure panel has at least a dummy config with development mode enabled
    else {
      const dummyConfig = {
        agents: {
          chat: { id: 'dummy-chat-id', voice_id: 'voice-id-a' },
          meeting: { id: 'dummy-meeting-id', voice_id: 'voice-id-b' }
        },
        webhooks: {
          text_chat: 'https://httpbin.org/post',
          file_upload: 'https://httpbin.org/post'
        },
        // Enable development mode by default when no config is provided
        devMode: !this.isProduction
      };
      this.log('Using dummy config with development mode:', !this.isProduction);
      this.panel.setConfig(dummyConfig);
    }
    
    // Handle window resize events for responsive positioning
    window.addEventListener('resize', () => {
      if (this.orb) {
        this.orb.handleResize();
      }
    });
    
    this.log('Kiaan Voice Orb initialized successfully');
    return this; // Return instance for chaining
  }
  
  // Custom logging method that works in both environments
  log(message, ...args) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [KiaanVoiceOrb]`, message, ...args);
  }
  
  fetchConfig(configUrl) {
    this.log('Fetching configuration from:', configUrl);
    
    fetch(configUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(config => {
        this.log('Configuration loaded successfully');
        this.config = config;
        this.initializeWithConfig(config);
      })
      .catch(error => {
        this.log('Failed to load Kiaan Voice Orb config:', error);
      });
  }
  
  initializeWithConfig(config) {
    // Pass config to panel for initializing modes
    this.panel.setConfig(config);
    this.log('Kiaan Voice Orb initialized with config:', config);
  }
}

// Create a single instance
const KiaanVoiceOrb = new KiaanVoiceOrbClass();

// Expose to global scope
window.KiaanVoiceOrb = KiaanVoiceOrb;

export default KiaanVoiceOrb;
