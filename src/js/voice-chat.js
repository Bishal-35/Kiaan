class VoiceChat {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.conversationState = {
      status: 'disconnected', // disconnected, connecting, connected, error
      isListening: false,
      isSpeaking: false,
      error: null
    };
    this.transcript = [];
    this.micPermissionGranted = false;
    this.isWaitingForMicPermission = false;
    
    this.init();
  }
  
  init() {
    // Clear container and create UI
    this.container.innerHTML = '';
    this.createUI();
    
    // Try to load ElevenLabs SDK 
    this.loadElevenLabsSDK()
      .then(() => {
        this.initializeVoiceConversation();
      })
      .catch(error => {
        this.handleError('Failed to load ElevenLabs SDK. Using fallback implementation.', error);
        this.initializeFallbackVoiceConversation();
      });
  }
  
  loadElevenLabsSDK() {
    return new Promise((resolve, reject) => {
      // Check if SDK is already loaded
      if (window.ElevenLabs) {
        resolve();
        return;
      }
      
      // Create script element with the official SDK URL
      const script = document.createElement('script');
      script.src = 'https://api.elevenlabs.io/v1/speech-to-speech/stream'; // Updated SDK URL
      script.async = true;
      
      script.onload = () => {
        console.log('ElevenLabs SDK loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load ElevenLabs SDK');
        reject(new Error('Failed to load ElevenLabs SDK'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  createUI() {
    // Create main container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'kiaan-voice-chat-container';
    
    // Create status area
    const statusArea = document.createElement('div');
    statusArea.className = 'kiaan-voice-status';
    
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'kiaan-status-indicator status-disconnected';
    this.statusIndicator = statusIndicator;
    
    const statusText = document.createElement('div');
    statusText.className = 'kiaan-status-text';
    statusText.textContent = 'Disconnected';
    this.statusText = statusText;
    
    statusArea.appendChild(statusIndicator);
    statusArea.appendChild(statusText);
    
    // Create transcript/messages area
    const messagesArea = document.createElement('div');
    messagesArea.className = 'kiaan-voice-messages';
    this.messagesArea = messagesArea;
    
    // Create interim transcript display
    const interimDisplay = document.createElement('div');
    interimDisplay.className = 'kiaan-interim-transcription';
    interimDisplay.style.display = 'none';
    this.interimDisplay = interimDisplay;
    
    // Create control button
    const controlButton = document.createElement('button');
    controlButton.className = 'kiaan-voice-control-button';
    controlButton.textContent = 'Start Conversation';
    controlButton.addEventListener('click', () => this.toggleConversation());
    this.controlButton = controlButton;
    
    // Assemble the UI
    chatContainer.appendChild(statusArea);
    chatContainer.appendChild(messagesArea);
    chatContainer.appendChild(interimDisplay);
    chatContainer.appendChild(controlButton);
    
    this.container.appendChild(chatContainer);
    
    // Add styles
    this.addStyles();
  }
  
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .kiaan-voice-chat-container {
        font-family: Arial, sans-serif;
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
        background: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      .kiaan-voice-status {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      
      .kiaan-status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ff3b3b;
        margin-right: 10px;
      }
      
      .kiaan-status-text {
        font-size: 14px;
        color: #333;
      }
      
      .kiaan-voice-messages {
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 10px;
        padding: 10px;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .kiaan-message {
        display: flex;
        margin-bottom: 10px;
      }
      
      .kiaan-message-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #007bff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
      }
      
      .kiaan-message-bubble {
        max-width: 70%;
        padding: 10px;
        border-radius: 4px;
        background: #e9ecef;
        color: #333;
        position: relative;
      }
      
      .kiaan-message-bubble:after {
        content: '';
        position: absolute;
        top: 10px;
        left: 100%;
        margin-left: 8px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent transparent #e9ecef;
      }
      
      .kiaan-interim-transcription {
        font-size: 14px;
        color: #666;
        margin-bottom: 10px;
      }
      
      .kiaan-voice-control-button {
        width: 100%;
        padding: 10px;
        border: none;
        border-radius: 4px;
        background: #007bff;
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.3s ease;
      }
      
      .kiaan-voice-control-button:hover {
        background: #0056b3;
      }
      
      .kiaan-mic-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3a8ffe 0%, #9259fe 100%);
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(59, 143, 254, 0.4);
      }
      
      .kiaan-mic-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(59, 143, 254, 0.6);
      }
      
      .kiaan-mic-button.listening {
        animation: pulse-recording 1.5s infinite;
        background: linear-gradient(135deg, #ff3b3b 0%, #ff6e6e 100%);
      }
      
      @keyframes pulse-recording {
        0% {
          box-shadow: 0 0 0 0 rgba(255, 59, 59, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(255, 59, 59, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(255, 59, 59, 0);
        }
      }
      
      .kiaan-status-indicator.status-connected {
        background: #4CAF50;
      }
      
      .kiaan-status-indicator.status-disconnected {
        background: #9e9e9e;
      }
      
      .kiaan-status-indicator.status-connecting {
        background: #FFC107;
        animation: blink 1s infinite;
      }
      
      .kiaan-status-indicator.status-error {
        background: #F44336;
      }
      
      .kiaan-status-indicator.status-waiting {
        background: #2196F3;
        animation: blink 1s infinite;
      }
      
      @keyframes blink {
        0% { opacity: 0.4; }
        50% { opacity: 1; }
        100% { opacity: 0.4; }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  initializeFallbackVoiceConversation() {
    console.log('Using fallback voice conversation implementation');
    
    // Initialize speech recognition for the fallback mode
    this.initializeSpeechRecognition();
    
    // Create a simpler conversation handler
    this.voiceStream = null;
    
    // Add welcome message
    this.handleTranscript({
      role: 'assistant',
      content: 'I\'m using a simplified voice conversation mode. How can I help you today?'
    });
    
    this.updateStatus('disconnected', 'Ready to start. Click the button below.');
  }
  
  initializeVoiceConversation() {
    // Check if ElevenLabs SDK is available
    if (window.ElevenLabs) {
      try {
        // Get agent and API configuration from config
        const agentConfig = this.config?.agents?.chat || {};
        const apiKey = this.config?.elevenlabs?.api_key;
        
        console.log('Initializing ElevenLabs with agent ID:', agentConfig.id);
        console.log('Using voice ID:', agentConfig.voice_id || 'default');
        
        // Create ElevenLabs voice stream with API key
        // Updated to match the official API structure
        this.voiceStream = new window.ElevenLabs.SpeechStream({
          apiKey: apiKey,
          voiceId: agentConfig.voice_id || '21m00Tcm4TlvDq8ikWAM', // Default to a standard voice if not specified
          stability: 0.5,
          similarityBoost: 0.8,
          style: 0, // Default style
          useSSML: false,
          
          // Set callbacks
          onStarted: () => {
            console.log('ElevenLabs stream started');
            this.conversationState.isSpeaking = true;
            this.updateStatus('connected', 'Assistant is speaking...');
            this.updateUIForStatus();
          },
          onStopped: () => {
            console.log('ElevenLabs stream stopped');
            this.conversationState.isSpeaking = false;
            this.updateStatus('connected', 'Ready for your response');
            this.updateUIForStatus();
          },
          onError: (error) => {
            console.error('ElevenLabs stream error:', error);
            this.handleError('Error in voice stream: ' + error.message);
          }
        });
        
        // Initialize speech recognition
        this.initializeSpeechRecognition();
        
        this.updateStatus('disconnected', 'Ready to start. Click the button below.');
      } catch (error) {
        console.error('Failed to initialize ElevenLabs voice stream:', error);
        this.handleError('Failed to initialize ElevenLabs voice. Using fallback implementation.');
        this.initializeFallbackVoiceConversation();
      }
    } else {
      console.warn('ElevenLabs SDK not available. Using fallback.');
      this.initializeFallbackVoiceConversation();
    }
  }
  
  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      
      this.recognition.onstart = () => {
        this.conversationState.isListening = true;
        this.updateStatus('connected', 'Listening...');
      };
      
      this.recognition.onend = () => {
        this.conversationState.isListening = false;
        this.updateStatus('connected', 'Processing...');
      };
      
      this.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
          
        // Handle interim results
        if (!event.results[0].isFinal) {
          this.updateInterimTranscription(transcript);
          return;
        }
        
        // Clear interim display
        this.updateInterimTranscription('');
        
        // Handle final result
        this.handleTranscript({
          role: 'user',
          content: transcript
        });
        
        // Process with ElevenLabs
        this.processWithElevenLabs(transcript);
      };
      
      this.recognition.onerror = (event) => {
        this.handleError(`Speech recognition error: ${event.error}`);
      };
    } else {
      this.handleError('Speech recognition not supported in this browser');
      this.controlButton.disabled = true;
    }
  }
  
  processWithElevenLabs(userInput) {
    // If we have a voice stream from ElevenLabs
    if (this.voiceStream) {
      this.conversationState.isSpeaking = true;
      this.updateStatus('connected', 'Processing your request...');
      this.updateUIForStatus();
      
      // Use the ElevenLabs API to generate a response
      try {
        // Create request options according to ElevenLabs API
        const options = {
          text: userInput,
          modelId: this.config?.elevenlabs?.model_id || 'eleven_turbo_v2',
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.8
          }
        };
        
        // Send the text to ElevenLabs for processing with proper API call
        this.voiceStream.start(options).then(response => {
          // Handle the response from the AI
          if (response && response.text) {
            this.handleTranscript({
              role: 'assistant',
              content: response.text
            });
          }
        }).catch(error => {
          console.error('ElevenLabs API error:', error);
          this.handleError('Failed to process with ElevenLabs API: ' + error.message);
          // Fallback to local response
          this.generateLocalResponse(userInput);
        });
      } catch (error) {
        console.error('Error submitting text to ElevenLabs:', error);
        this.handleError('Failed to process with ElevenLabs: ' + error.message);
        
        // Fallback to local response
        this.generateLocalResponse(userInput);
      }
    } else {
      // If no voice stream, use fallback
      this.generateLocalResponse(userInput);
    }
  }
  
  generateLocalResponse(userInput) {
    setTimeout(() => {
      // Use the same responses as in the fallback method
      const responses = [
        "I understand what you're saying. How can I help you further?",
        "That's interesting. Let me think about that for a moment.",
        "I appreciate your input. Is there anything specific you'd like to know?",
        "Thanks for sharing that. Would you like me to elaborate on any particular aspect?",
        "I've processed your message. What would you like me to do next?"
      ];
      
      const responseText = responses[Math.floor(Math.random() * responses.length)];
      
      this.handleTranscript({
        role: 'assistant',
        content: responseText
      });
      
      // Use speech synthesis as a fallback
      this.speakResponse(responseText);
    }, 1000);
  }
  
  async toggleConversation() {
    if (this.conversationState.status === 'connected' || this.conversationState.isListening) {
      this.stopConversation();
    } else {
      this.startConversation();
    }
  }
  
  async startConversation() {
    this.updateStatus('connecting', 'Connecting...');
    this.controlButton.disabled = true;
    
    try {
      this.isWaitingForMicPermission = true;
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      this.micPermissionGranted = true;
      this.isWaitingForMicPermission = false;
      
      if (this.voiceStream) {
        // ElevenLabs implementation
        console.log('Starting ElevenLabs conversation');
        // Start the voice stream
        this.voiceStream.start();
        
        // Start speech recognition
        if (this.recognition) {
          this.recognition.start();
        }
        
        this.controlButton.textContent = 'End Conversation';
        this.updateStatus('connected', 'Conversation started');
      } else if (this.recognition) {
        // Fallback implementation
        this.recognition.start();
        this.updateStatus('connected', 'Listening...');
        this.controlButton.textContent = 'End Conversation';
      }
    } catch (error) {
      this.isWaitingForMicPermission = false;
      this.handleError('Error starting conversation: ' + (error.message || 'Microphone access denied'), error);
      this.updateStatus('error', 'Failed to start: ' + (error.message || 'Microphone access denied'));
    } finally {
      this.controlButton.disabled = false;
    }
  }
  
  stopConversation() {
    try {
      if (this.voiceStream) {
        // Stop ElevenLabs voice stream
        this.voiceStream.stop();
      }
      
      if (this.recognition) {
        // Stop speech recognition
        this.recognition.stop();
      }
      
      // Stop any ongoing speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      this.updateInterimTranscription('');
      this.controlButton.textContent = 'Start Conversation';
      this.updateStatus('disconnected', 'Conversation ended');
    } catch (error) {
      this.handleError('Error stopping conversation', error);
    }
  }
  
  handleTranscript(message) {
    this.transcript.push(message);
    
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = `kiaan-message ${message.role}-message`;
    
    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = 'kiaan-message-avatar';
    avatar.textContent = message.role === 'user' ? 'U' : 'AI';
    
    // Create message bubble
    const bubble = document.createElement('div');
    bubble.className = 'kiaan-message-bubble';
    bubble.textContent = message.content;
    
    // Assemble message
    messageContainer.appendChild(avatar);
    messageContainer.appendChild(bubble);
    
    this.messagesArea.appendChild(messageContainer);
    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
  }
  
  updateInterimTranscription(text) {
    if (!text) {
      this.interimDisplay.style.display = 'none';
      this.interimDisplay.textContent = '';
      return;
    }
    
    this.interimDisplay.style.display = 'block';
    this.interimDisplay.textContent = text;
    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
  }
  
  updateStatus(status, message) {
    this.conversationState.status = status;
    this.statusText.textContent = message;
    
    // Update status indicator
    this.statusIndicator.className = `kiaan-status-indicator status-${status}`;
    
    // Update UI elements based on status
    this.updateUIForStatus();
  }
  
  updateUIForStatus() {
    // Update button state based on status
    if (this.conversationState.status === 'connected' || this.conversationState.isListening) {
      this.controlButton.textContent = 'End Conversation';
    } else if (this.conversationState.status === 'connecting' || this.isWaitingForMicPermission) {
      this.controlButton.textContent = 'Connecting...';
      this.controlButton.disabled = true;
    } else {
      this.controlButton.textContent = 'Start Conversation';
      this.controlButton.disabled = false;
    }
    
    // Update status text based on speaking/listening state
    if (this.conversationState.isSpeaking) {
      this.statusText.textContent = 'Assistant is speaking...';
      this.statusIndicator.className = 'kiaan-status-indicator status-connected';
    } else if (this.conversationState.isListening) {
      this.statusText.textContent = 'Listening...';
      this.statusIndicator.className = 'kiaan-status-indicator status-waiting';
    }
  }
  
  handleError(message, error = null) {
    console.error('Voice Chat Error:', message, error);
    this.conversationState.error = message;
    this.updateStatus('error', `Error: ${message}`);
    this.controlButton.disabled = false;
  }
  
  destroy() {
    if (this.voiceStream) {
      try {
        this.voiceStream.stop();
      } catch (e) {
        console.error('Error stopping voice stream:', e);
      }
    }
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
  }
  
  speakResponse(text) {
    if ('speechSynthesis' in window) {
      this.conversationState.isSpeaking = true;
      this.updateStatus('connected', 'Assistant is speaking...');
      
      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Load voices and select a good one
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // If voices aren't loaded yet, wait for them
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          this.setVoiceForUtterance(utterance, voices);
        };
      } else {
        this.setVoiceForUtterance(utterance, voices);
      }
      
      // Handle events
      utterance.onstart = () => {
        console.log('Speech started');
        this.conversationState.isSpeaking = true;
        this.updateUIForStatus();
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        this.conversationState.isSpeaking = false;
        this.updateStatus('connected', 'Ready for your response');
        this.updateUIForStatus();
      };
      
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        this.conversationState.isSpeaking = false;
        this.updateUIForStatus();
      };
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  }
  
  setVoiceForUtterance(utterance, voices) {
    // Try to find a good female English voice
    const preferredVoices = voices.filter(voice => 
      voice.lang.includes('en') && 
      (voice.name.includes('Female') || 
       voice.name.includes('Samantha') || 
       voice.name.includes('Google'))
    );
    
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
      console.log('Using voice:', preferredVoices[0].name);
    }
    
    // Set other speech properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
  }
}

export default VoiceChat;
