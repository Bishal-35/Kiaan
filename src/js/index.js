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
    
    // Improved environment detection
    this.isProduction = this.detectEnvironment();
  }
  
  detectEnvironment() {
    // More reliable production detection
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Consider it production if:
    // - Not localhost/127.0.0.1
    // - Using HTTPS
    // - NODE_ENV is production (if available)
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname.includes('.local');
    
    const hasProductionEnv = typeof process !== 'undefined' && 
                            process.env && 
                            process.env.NODE_ENV === 'production';
    
    return !isLocalhost || protocol === 'https:' || hasProductionEnv;
  }
  
  init(options = {}) {
    const { configUrl, config } = options;
    
    // Always log initialization
    this.log(`Kiaan Voice Orb v${this.version} initializing...`);
    this.log(`Environment: ${this.isProduction ? 'Production' : 'Development'}`);
    this.log(`Location: ${window.location.href}`);
    
    try {
      // Create orb and panel with error handling
      this.orb = new VoiceOrb();
      this.panel = new Panel();
      
      // Set up orb click handler
      this.orb.setClickHandler(() => {
        this.log('Orb clicked, opening panel...');
        this.panel.open();
      });
      
      // Configuration handling with better fallbacks
      if (config) {
        this.log('Using provided config');
        this.config = config;
        this.panel.setConfig(config);
      } else if (configUrl) {
        this.fetchConfig(configUrl);
      } else {
        // Enhanced dummy config with production considerations
        const dummyConfig = {
          agents: {
            chat: { id: 'demo-chat-agent', voice_id: '21m00Tcm4TlvDq8ikWAM' },
            meeting: { id: 'demo-meeting-agent', voice_id: 'EXAVITQu4vr4xnSDxMaL' }
          },
          webhooks: {
            text_chat: 'https://httpbin.org/post',
            file_upload: 'https://httpbin.org/post'
          },
          settings: {
            max_file_size: 10485760,
            allowed_file_types: ['.jpg', '.jpeg', '.png', '.pdf', '.csv', '.doc', '.docx']
          },
          devMode: !this.isProduction,
          // Add greeting message for immediate feedback
          greeting: this.isProduction ? 
            'Welcome! Your voice assistant is ready to help.' :
            'Development mode: Voice assistant ready for testing.'
        };
        
        this.log('Using enhanced dummy config. Production mode:', this.isProduction);
        this.config = dummyConfig;
        this.panel.setConfig(dummyConfig);
      }
      
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        this.log('Post-initialization check - Orb visible:', !!document.querySelector('.kiaan-voice-orb'));
      }, 100);
      
    } catch (error) {
      this.log('Error during initialization:', error);
      // Try to show a basic orb even if there are errors
      this.createFallbackOrb();
    }
    
    this.log('Kiaan Voice Orb initialization completed');
    return this;
  }
  
  createFallbackOrb() {
    // Create a basic orb if main initialization fails
    if (!document.querySelector('.kiaan-voice-orb')) {
      this.log('Creating fallback orb...');
      const orbElement = document.createElement('div');
      orbElement.className = 'kiaan-voice-orb';
      orbElement.innerHTML = '🎤';
      orbElement.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        width: 64px !important;
        height: 64px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #3a8ffe 0%, #9259fe 100%) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        z-index: 999999 !important;
        font-size: 24px !important;
      `;
      orbElement.addEventListener('click', () => {
        alert('Voice Orb is in fallback mode. Please check console for errors.');
      });
      document.body.appendChild(orbElement);
    }
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
