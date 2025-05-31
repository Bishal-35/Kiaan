import VoiceChat from './voice-chat';

class MeetingMode extends VoiceChat {
  constructor(container, config) {
    // Call the parent constructor first
    super(container, config);
    
    // Then override the config to use meeting agent instead of chat agent
    if (config && config.agents && config.agents.meeting) {
      this.config = {
        ...config,
        agents: {
          chat: config.agents.meeting // Use meeting agent
        }
      };
      
      // Remove this line - it's causing the duplicate message
      // this.initializeVoiceConversation();
    }
    
    // Override UI elements with meeting-specific UI
    this.customizeMeetingUI();
  }
  
  customizeMeetingUI() {
    // Add meeting-specific UI elements
    const meetingHeader = document.createElement('div');
    meetingHeader.className = 'kiaan-meeting-header';
    meetingHeader.innerHTML = `
      <h3>Meeting Assistant</h3>
      <p>Use your voice to interact with the meeting assistant.</p>
    `;
    
    // Insert at the beginning of the container
    this.container.insertBefore(meetingHeader, this.container.firstChild);
    
    // Update status message - this will override any existing status
    this.updateStatus('Meeting assistant ready. Click the microphone to start.');
  }
  
  // Override the transcript handler to customize the meeting experience
  handleTranscript(message) {
    // Call parent method first
    super.handleTranscript(message);
    
    // Additional meeting-specific functionality
    if (message.role === 'assistant') {
      // For example, we could extract action items or meeting notes
      this.extractMeetingData(message.content);
    }
  }
  
  extractMeetingData(content) {
    // This is a placeholder for meeting-specific functionality
    // In a real implementation, this could extract action items, dates, etc.
    console.log('Meeting data extracted:', content);
  }
}

export default MeetingMode;
