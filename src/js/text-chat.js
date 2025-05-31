class TextChat {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.messages = [];
    this.isProcessing = false;
    this.webhookUrl = config?.webhooks?.text_chat || null;
    this.uploadUrl = config?.webhooks?.file_upload || null;
    this.fileUploadSettings = config?.settings || {
      max_file_size: 10485760, // 10MB default
      allowed_file_types: ['.jpg', '.jpeg', '.png', '.pdf', '.csv', '.doc', '.docx']
    };
    this.pendingAttachments = [];
    
    // Add development mode flag
    this.devMode = config?.devMode || false;
    
    this.init();
  }
  
  init() {
    // Clear container and create UI
    this.container.innerHTML = '';
    this.createUI();
  }
  
  createUI() {
    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'kiaan-text-chat-container';
    
    // Create messages area
    const messagesArea = document.createElement('div');
    messagesArea.className = 'kiaan-text-messages';
    this.messagesArea = messagesArea;
    
    // Create attachment preview area
    const attachmentPreview = document.createElement('div');
    attachmentPreview.className = 'kiaan-attachment-preview';
    this.attachmentPreview = attachmentPreview;
    
    // Create upload progress container
    const uploadProgressContainer = document.createElement('div');
    uploadProgressContainer.className = 'kiaan-upload-progress-container';
    uploadProgressContainer.style.display = 'none';
    
    const uploadProgress = document.createElement('div');
    uploadProgress.className = 'kiaan-upload-progress';
    
    const uploadProgressText = document.createElement('div');
    uploadProgressText.className = 'kiaan-upload-progress-text';
    uploadProgressText.textContent = 'Uploading...';
    
    uploadProgressContainer.appendChild(uploadProgress);
    uploadProgressContainer.appendChild(uploadProgressText);
    this.uploadProgressContainer = uploadProgressContainer;
    this.uploadProgress = uploadProgress;
    this.uploadProgressText = uploadProgressText;
    
    // Create input area
    const inputArea = document.createElement('div');
    inputArea.className = 'kiaan-text-input-area';
    
    // Create attachment button
    const attachButton = document.createElement('button');
    attachButton.className = 'kiaan-attach-button';
    attachButton.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16.5,6V17.5A4,4 0 0,1 12.5,21.5A4,4 0 0,1 8.5,17.5V5A2.5,2.5 0 0,1 11,2.5A2.5,2.5 0 0,1 13.5,5V15.5A1,1 0 0,1 12.5,16.5A1,1 0 0,1 11.5,15.5V6H10V15.5A2.5,2.5 0 0,0 12.5,18A2.5,2.5 0 0,0 15,15.5V5A4,4 0 0,0 11,1A4,4 0 0,0 7,5V17.5A5.5,5.5 0 0,0 12.5,23A5.5,5.5 0 0,0 18,17.5V6H16.5Z"></path></svg>';
    
    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    fileInput.accept = this.fileUploadSettings.allowed_file_types.join(',');
    fileInput.addEventListener('change', () => this.handleFileSelection(fileInput.files));
    this.fileInput = fileInput;
    
    attachButton.addEventListener('click', () => fileInput.click());
    
    // Create text input
    const textInput = document.createElement('textarea');
    textInput.className = 'kiaan-text-input';
    textInput.placeholder = 'Type your message...';
    textInput.rows = 1;
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    textInput.addEventListener('input', this.autoResizeTextarea.bind(this));
    this.textInput = textInput;
    
    // Create send button
    const sendButton = document.createElement('button');
    sendButton.className = 'kiaan-send-button';
    sendButton.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z"></path></svg>';
    sendButton.addEventListener('click', () => this.sendMessage());
    this.sendButton = sendButton;
    
    // Assemble input area
    inputArea.appendChild(attachButton);
    inputArea.appendChild(textInput);
    inputArea.appendChild(sendButton);
    
    // Assemble chat container
    chatContainer.appendChild(messagesArea);
    chatContainer.appendChild(attachmentPreview);
    chatContainer.appendChild(uploadProgressContainer);
    chatContainer.appendChild(inputArea);
    
    // Add to container
    this.container.appendChild(chatContainer);
    this.container.appendChild(fileInput);
    
    // Add styles
    this.addStyles();
    
    // Add welcome message
    this.displaySystemMessage('How can I help you today?');
  }
  
  addStyles() {
    // Create style element directly instead of linking to external CSS
    const style = document.createElement('style');
    style.textContent = `
      .kiaan-text-chat-container {
        background: #f9f9f9;  /* Light gray background */
        font-family: Arial, sans-serif;
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .kiaan-text-messages {
        background: #fff;  /* White background */
        flex: 1;
        overflow-y: auto;
        margin-bottom: 10px;
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .kiaan-message {
        display: flex;
        margin-bottom: 10px;
      }
      
      .kiaan-message-avatar {
        background: #007bff;  /* Default blue */
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        flex-shrink: 0;
        font-weight: bold;
        font-size: 12px;
      }
      
      .user-message .kiaan-message-avatar {
        background:rgb(0, 0, 0);  /* Gray for user */
      }
      
      .assistant-message .kiaan-message-avatar {
        background: #28a745;  /* Green for AI */
      }
      
      .system-message .kiaan-message-avatar {
        background: #17a2b8;  /* Teal for system */
      }
      
      .kiaan-message-bubble {
        background:rgb(0, 0, 0);  /* Light gray bubble */
        color: #212529;       /* Dark text */
        max-width: 70%;
        padding: 10px;
        border-radius: 4px;
        position: relative;
        word-wrap: break-word;
        line-height: 1.4;
      }
      
      .user-message .kiaan-message-bubble {
        background: #007bff;  /* Blue bubble for user */
        color: #ffffff;       /* White text */
      }
      
      .assistant-message .kiaan-message-bubble {
        background: #f8f9fa;  /* Very light gray for AI */
        color: #212529;       /* Dark text */
        border: 1px solid #dee2e6;  /* Light border */
      }
      
      .system-message .kiaan-message-bubble {
        background: #d1ecf1;  /* Light blue for system */
        color: #0c5460;       /* Dark teal text */
        border: 1px solid #bee5eb;  /* Light blue border */
      }
      
      .kiaan-text-input-area {
        display: flex;
        align-items: center;
        border-radius: 4px;
        padding: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .kiaan-text-input {
        background: transparent;
        flex: 1;
        border: none;
        padding: 8px;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        outline: none;
      }
      
      
      
      .kiaan-attach-button, .kiaan-send-button {
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        transition: all 0.2s;
      }
      
      .kiaan-attach-button:hover, .kiaan-send-button:hover {
        color: #0056b3;       /* Darker blue on hover */
        background: #f8f9fa;  /* Light gray background on hover */
      }
      
      .kiaan-attach-button:disabled, .kiaan-send-button:disabled {
        color: #6c757d;
        cursor: not-allowed;
      }
      
      .kiaan-attachment-preview {
        display: none;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }
      
      .kiaan-attachment {
        display: flex;
        align-items: center;
        background: #000;
        border-radius: 4px;
        padding: 5px 10px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        max-width: 200px;
      }
      
      .kiaan-attachment-icon {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        background:rgb(0, 0, 0);
        border-radius: 4px;
        margin-right: 8px;
        overflow: hidden;
      }
      
      .kiaan-attachment-icon img {
        max-width: 100%;
        max-height: 100%;
      }
      
      .kiaan-attachment-name {
        flex: 1;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .kiaan-attachment-remove {
        background: none;
        border: none;
        color: #dc3545;
        cursor: pointer;
        font-size: 16px;
        margin-left: 5px;
      }
      
      .kiaan-upload-progress-container {
        margin-bottom: 10px;
        background: #fff;
        padding: 10px;
        border-radius: 4px;
      }
      
      .kiaan-upload-progress {
        height: 5px;
        background: #007bff;
        width: 0%;
        transition: width 0.3s;
        border-radius: 2px;
      }
      
      .kiaan-upload-progress-text {
        font-size: 12px;
        margin-top: 5px;
        color: #6c757d;
      }
      
      .kiaan-message-attachments {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      
      .attachment-message {
        font-size: 12px;
        padding: 5px 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .user-message .attachment-message {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
      }
      
      .assistant-message .attachment-message {
        background: #e9ecef;
        color: #495057;
      }
      
      .kiaan-config-warning {
        background-color: #fff3cd;
        color: #856404;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
        font-size: 14px;
        border: 1px solid #ffeaa7;
      }
      
      .kiaan-typing-indicator {
        display: flex;
        align-items: center;
      }
      .kiaan-typing-indicator span {
        height: 8px;
        width: 8px;
        background: #606060;
        border-radius: 50%;
        display: block;
        margin: 0 2px;
        opacity: 0.4;
        animation: kiaan-typing 1s infinite;
      }
      .kiaan-typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }
      .kiaan-typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes kiaan-typing {
        0% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 0.4; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
  
  autoResizeTextarea() {
    const textarea = this.textInput;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set new height based on scrollHeight, with a maximum height
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 24), 100);
    textarea.style.height = `${newHeight}px`;
  }
  
  handleFileSelection(files) {
    if (!files || files.length === 0) return;
    
    const allowedTypes = this.fileUploadSettings.allowed_file_types;
    const maxSize = this.fileUploadSettings.max_file_size;
    
    // Filter valid files
    const validFiles = Array.from(files).filter(file => {
      // Check file size
      if (file.size > maxSize) {
        this.showError(`File "${file.name}" exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`);
        return false;
      }
      
      // Check file type
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        this.showError(`File type "${fileExt}" is not allowed`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Process files for preview
    validFiles.forEach(file => this.addFileToPreview(file));
    
    // Show attachment preview
    if (this.pendingAttachments.length > 0) {
      this.attachmentPreview.style.display = 'flex';
    }
  }
  
  addFileToPreview(file) {
    // Create attachment preview element
    const attachment = document.createElement('div');
    attachment.className = 'kiaan-attachment';
    
    // Create icon based on file type
    const icon = document.createElement('div');
    icon.className = 'kiaan-attachment-icon';
    
    if (file.type.startsWith('image/')) {
      // For images, create thumbnail
      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      icon.appendChild(img);
    } else {
      // For other files, show extension
      const extension = file.name.split('.').pop().toUpperCase();
      icon.textContent = extension;
    }
    
    // Create file name
    const name = document.createElement('div');
    name.className = 'kiaan-attachment-name';
    name.textContent = file.name;
    
    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'kiaan-attachment-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      // Remove from pendingAttachments
      this.pendingAttachments = this.pendingAttachments.filter(a => a.file !== file);
      
      // Remove from UI
      attachment.remove();
      
      // Hide preview if empty
      if (this.pendingAttachments.length === 0) {
        this.attachmentPreview.style.display = 'none';
      }
    });
    
    // Assemble attachment preview
    attachment.appendChild(icon);
    attachment.appendChild(name);
    attachment.appendChild(removeBtn);
    
    // Add to preview container
    this.attachmentPreview.appendChild(attachment);
    
    // Add to pending attachments
    this.pendingAttachments.push({
      file,
      element: attachment
    });
  }
  
  // Add a new method to create mock responses in development mode
  createMockResponse(message, files = []) {
    return new Promise((resolve) => {
      console.log('Development mode active - creating mock response', { message, fileCount: files.length });
      
      // Simulate network delay
      setTimeout(() => {
        // Create a mock response based on the message
        let responseText = `This is a mock response to: "${message.content}"`;
        
        // If files were attached, acknowledge them
        if (files.length > 0) {
          responseText += `\n\nI received ${files.length} file(s):`;
          files.forEach((file, index) => {
            responseText += `\n- ${index + 1}. ${file.name} (${Math.round(file.size / 1024)} KB)`;
          });
        }
        
        resolve({
          message: responseText,
          timestamp: new Date().toISOString(),
          mock: true
        });
      }, 1500); // 1.5 second delay to simulate network
    });
  }
  
  sendToWebhook(message, files = []) {
    // If no webhook URL is configured and dev mode is active, use mock response
    if (!this.webhookUrl) {
      if (this.devMode) {
        console.warn('No webhook URL configured, using mock response (dev mode)');
        return this.createMockResponse(message, files);
      }
      return Promise.reject(new Error('Webhook URL not configured'));
    }
    
    // If in dev mode and URL contains problematic patterns, use mock
    if (this.devMode && (
      this.webhookUrl.includes('localhost') || 
      this.webhookUrl.endsWith('.html') || 
      this.webhookUrl.includes('/api/dummy/') ||
      this.webhookUrl.includes('httpbin.org')
    )) {
      console.warn('Development mode active - using mock response instead of webhook');
      return this.createMockResponse(message, files);
    }
    
    // Create FormData to send both message and files
    const formData = new FormData();
    formData.append('message', message.content);
    
    // Add any metadata as needed
    formData.append('timestamp', message.timestamp);
    formData.append('role', message.role);
    
    // Add files to the FormData
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });
    
    // Show upload progress container if files are being sent
    if (files.length > 0) {
      this.uploadProgressContainer.style.display = 'block';
      this.uploadProgress.style.width = '0%';
      this.uploadProgressText.textContent = `Sending message with ${files.length} file(s)...`;
    }
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          this.uploadProgress.style.width = `${percentComplete}%`;
          this.uploadProgressText.textContent = `Uploading: ${percentComplete}%`;
        }
      });
      
      xhr.addEventListener('load', () => {
        // Hide progress container
        this.uploadProgressContainer.style.display = 'none';
        
        if (xhr.status >= 200 && xhr.status < 300) {
          // Check content type to determine how to handle the response
          const contentType = xhr.getResponseHeader('Content-Type') || '';
          
          // Log response for debugging
          console.log('Webhook response:', {
            status: xhr.status,
            contentType: contentType,
            responseText: xhr.responseText.substring(0, 200) + (xhr.responseText.length > 200 ? '...' : '')
          });
          
          // Handle different response types
          if (contentType.includes('application/json')) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              console.error('Error parsing JSON response:', e, 'Response text:', xhr.responseText.substring(0, 200));
              
              // If in development mode, use mock response instead of failing
              if (this.devMode) {
                console.warn('Using mock response due to JSON parsing error');
                this.createMockResponse(message, files).then(resolve);
              } else {
                reject(new Error('Invalid JSON response from server'));
              }
            }
          } else if (contentType.includes('text/html')) {
            console.warn('Server returned HTML instead of JSON. This typically indicates an error or misconfiguration.');
            
            // If in development mode, use mock response
            if (this.devMode) {
              console.info('Development mode active - using mock response for HTML response');
              this.createMockResponse(message, files).then(resolve);
            } else {
              // Create a fallback response with helpful information
              resolve({
                message: "The server returned HTML instead of JSON. Please check your webhook configuration or enable development mode.",
                error: "html_response",
                fallback: true
              });
            }
          } else {
            // For text or other content types, create a simple response
            try {
              // Try to parse as JSON first, in case Content-Type header is incorrect
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              // If in development mode, use mock response
              if (this.devMode) {
                console.info('Development mode active - using mock response for non-JSON content');
                this.createMockResponse(message, files).then(resolve);
              } else {
                // If parsing fails, use the text as-is
                resolve({
                  message: xhr.responseText.substring(0, 500) || "Server responded with non-JSON content",
                  fallback: true
                });
              }
            }
          }
        } else {
          console.error('Server error response:', xhr.status, xhr.statusText, xhr.responseText.substring(0, 200));
          
          // If in development mode, use mock response instead of failing
          if (this.devMode) {
            console.warn('Using mock response due to server error');
            this.createMockResponse(message, files).then(resolve);
          } else {
            reject(new Error(`Server responded with ${xhr.status}: ${xhr.statusText}`));
          }
        }
      });
      
      xhr.addEventListener('error', () => {
        this.uploadProgressContainer.style.display = 'none';
        console.error('Network error during webhook request');
        
        // If in development mode, use mock response instead of failing
        if (this.devMode) {
          console.warn('Using mock response due to network error');
          this.createMockResponse(message, files).then(resolve);
        } else {
          reject(new Error('Network error occurred'));
        }
      });
      
      xhr.addEventListener('abort', () => {
        this.uploadProgressContainer.style.display = 'none';
        
        if (this.devMode) {
          console.warn('Using mock response due to aborted request');
          this.createMockResponse(message, files).then(resolve);
        } else {
          reject(new Error('Request was aborted'));
        }
      });
      
      xhr.open('POST', this.webhookUrl, true);
      xhr.send(formData);
    })
    .then(data => {
      console.log('Processed webhook response:', data);
      
      // Check if we need to show a configuration warning
      if (data.error === 'html_response' && data.fallback) {
        // Show a more helpful message in the UI
        this.displayConfigurationWarning();
      }
      
      // Extract the response message
      return {
        content: data.message || data.response || (data.fallback ? data.message : 'No response received'),
        timestamp: new Date().toISOString(),
        fallback: data.fallback || data.mock
      };
    })
    .catch(error => {
      console.error('Error sending message:', error);
      throw error;
    });
  }
  
  // Add a method to display configuration warnings
  displayConfigurationWarning() {
    // Create a warning message
    const warningEl = document.createElement('div');
    warningEl.className = 'kiaan-config-warning';
    warningEl.innerHTML = `
      <div style="background-color: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 14px;">
        <strong>Configuration Issue Detected:</strong> The webhook URL is returning HTML instead of JSON.
        <br><br>
        <strong>Possible solutions:</strong>
        <ul style="margin-top: 5px; padding-left: 20px;">
          <li>Check that your webhook URL points to an API endpoint, not a webpage</li>
          <li>Add <code>devMode: true</code> in your initialization config to use mock responses</li>
          <li>Configure a proper webhook that returns JSON responses</li>
        </ul>
      </div>
    `;
    
    // Add to DOM before the input area
    const inputArea = this.container.querySelector('.kiaan-text-input-area');
    if (inputArea) {
      inputArea.parentNode.insertBefore(warningEl, inputArea);
    } else {
      this.messagesArea.appendChild(warningEl);
    }
    
    // Remove after user interaction
    this.textInput.addEventListener('focus', () => {
      if (warningEl.parentNode) {
        warningEl.parentNode.removeChild(warningEl);
      }
    }, { once: true });
  }
  
  displayUserMessage(text, attachments = []) {
    this.displayMessage({
      role: 'user',
      content: text,
      attachments
    });
  }
  
  displayAssistantMessage(text) {
    this.displayMessage({
      role: 'assistant',
      content: text
    });
  }
  
  displaySystemMessage(text) {
    this.displayMessage({
      role: 'system',
      content: text
    });
  }
  
  displayMessage(message) {
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = `kiaan-message ${message.role}-message`;
    
    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = 'kiaan-message-avatar';
    
    switch (message.role) {
      case 'user':
        avatar.textContent = 'U';
        break;
      case 'assistant':
        avatar.textContent = 'AI';
        break;
      case 'system':
        avatar.textContent = 'S';
        break;
    }
    
    // Create message bubble
    const bubble = document.createElement('div');
    bubble.className = 'kiaan-message-bubble';
    
    // Add text content if present
    if (message.content) {
      const textContent = document.createElement('div');
      textContent.textContent = message.content;
      bubble.appendChild(textContent);
    }
    
    // Add attachments if any
    if (message.attachments && message.attachments.length > 0) {
      const attachmentsContainer = document.createElement('div');
      attachmentsContainer.className = 'kiaan-message-attachments';
      
      message.attachments.forEach(attachment => {
        const attachmentEl = document.createElement('div');
        attachmentEl.className = 'kiaan-attachment attachment-message';
        
        // Add appropriate icon based on file type
        let icon = '';
        const fileType = attachment.type || attachment.mime || '';
        
        if (fileType.startsWith('image/')) {
          icon = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z"></path></svg>';
        } else if (fileType.includes('pdf')) {
          icon = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12,9H15V15H12V9M10,9H7V11H10V9M10,13H7V15H10V13M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"></path></svg>';
        } else {
          icon = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"></path></svg>';
        }
        
        attachmentEl.innerHTML = `
          ${icon}
          <span>${attachment.name || 'Attachment'}</span>
        `;
        
        // If URL is available, make it clickable
        if (attachment.url) {
          const link = document.createElement('a');
          link.href = attachment.url;
          link.target = '_blank';
          link.appendChild(attachmentEl);
          attachmentsContainer.appendChild(link);
        } else {
          attachmentsContainer.appendChild(attachmentEl);
        }
      });
      
      bubble.appendChild(attachmentsContainer);
    }
    
    // Assemble message
    messageContainer.appendChild(avatar);
    messageContainer.appendChild(bubble);
    
    // Add to messages area
    this.messagesArea.appendChild(messageContainer);
    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
  }
  
  showError(message) {
    // Create an error toast
    const errorToast = document.createElement('div');
    errorToast.className = 'kiaan-error-toast';
    errorToast.textContent = message;
    
    // Add styles for the toast
    errorToast.style.position = 'absolute';
    errorToast.style.bottom = '60px';
    errorToast.style.left = '50%';
    errorToast.style.transform = 'translateX(-50%)';
    errorToast.style.backgroundColor = 'rgba(255, 59, 59, 0.9)';
    errorToast.style.color = 'white';
    errorToast.style.padding = '8px 16px';
    errorToast.style.borderRadius = '4px';
    errorToast.style.zIndex = '10000';
    
    // Add to DOM
    this.container.appendChild(errorToast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (errorToast.parentNode) {
        errorToast.parentNode.removeChild(errorToast);
      }
    }, 3000);
    
    console.error('Text Chat Error:', message);
  }
  
  // Improved sendMessage method with better error handling
  async sendMessage() {
    const text = this.textInput.value.trim();
    
    // Don't send if empty and no attachments
    if (!text && this.pendingAttachments.length === 0) return;
    
    // If development mode is enabled, show a notice
    if (this.devMode) {
      console.log('Development mode is active - using mock responses');
    }

    // Store the original text before clearing input
    const originalText = text;

    // Clear input and reset height
    this.textInput.value = '';
    this.textInput.style.height = 'auto';
    
    // Disable input during processing
    this.isProcessing = true;
    this.textInput.disabled = true;
    this.sendButton.disabled = true;
    
    try {
      // Create message object with original text
      const message = {
        content: originalText,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      
      // Extract actual file objects from pendingAttachments
      const files = this.pendingAttachments.map(a => a.file);
      
      // Display message with pending attachments info
      const attachmentInfos = this.pendingAttachments.map(a => ({
        name: a.file.name,
        type: a.file.type,
        size: a.file.size
      }));
      
      // Display user message immediately
      this.displayUserMessage(originalText, attachmentInfos);
      
      // Add message to history
      this.messages.push({
        ...message,
        attachments: attachmentInfos
      });
      
      // Clear attachment preview
      this.pendingAttachments = [];
      this.attachmentPreview.innerHTML = '';
      this.attachmentPreview.style.display = 'none';
      
      // Show typing indicator for assistant
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'kiaan-message assistant-message';
      typingIndicator.innerHTML = `
        <div class="kiaan-message-avatar">AI</div>
        <div class="kiaan-message-bubble" style="display: flex; align-items: center;">
          <div class="kiaan-typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      `;
      this.messagesArea.appendChild(typingIndicator);
      this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
      
      // Send to webhook with files and get response
      const response = await this.sendToWebhook(message, files);
      
      // Check if the response indicates a configuration issue and auto-enable dev mode
      if (response.fallback && !this.devMode) {
        console.warn('Webhook configuration issue detected. Auto-enabling development mode for better user experience.');
        this.devMode = true;
        this.displaySystemMessage('Development mode has been automatically enabled due to webhook configuration issues. You will now receive mock responses.');
      }
      
      // Remove typing indicator and display AI response
      setTimeout(() => {
        typingIndicator.remove();
        
        // Display AI response
        const aiMessage = {
          content: response.content || 'No response received',
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        
        this.messages.push(aiMessage);
        this.displayAssistantMessage(aiMessage.content);
      }, 1000);
      
    } catch (error) {
      // If this is a webhook configuration error, enable dev mode and retry
      if (error.message.includes('HTML') || error.message.includes('Invalid JSON') || error.message.includes('Network error')) {
        console.warn('Webhook error detected. Enabling development mode and retrying with mock response.');
        this.devMode = true;
        
        // Display system message about enabling dev mode
        this.displaySystemMessage('Webhook configuration issue detected. Development mode has been enabled. Retrying with mock response...');
        
        // Retry the message with dev mode enabled
        try {
          const message = {
            content: originalText,
            role: 'user',
            timestamp: new Date().toISOString()
          };
          
          const files = this.pendingAttachments.map(a => a.file);
          const response = await this.createMockResponse(message, files);
          
          // Display the mock response
          const aiMessage = {
            content: response.message || 'Mock response generated',
            role: 'assistant',
            timestamp: new Date().toISOString()
          };
          
          this.messages.push(aiMessage);
          this.displayAssistantMessage(aiMessage.content);
          
        } catch (retryError) {
          this.showError(`Failed to generate mock response: ${retryError.message}`);
          this.displaySystemMessage(`Error: ${retryError.message}`);
        }
      } else {
        this.showError(`Failed to send message: ${error.message}`);
        console.error('Send message error:', error);
        
        // Display error as system message
        this.displaySystemMessage(`Error: ${error.message}`);
      }
    } finally {
      // Re-enable input
      this.isProcessing = false;
      this.textInput.disabled = false;
      this.sendButton.disabled = false;
      this.textInput.focus();
    }
  }
}

export default TextChat;
