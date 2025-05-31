class VoiceOrb {
  constructor() {
    this.isDragging = false;
    this.dragThreshold = 5;
    this.startX = 0;
    this.startY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.orbElement = null;
    this.clickHandler = null;
    this.orbSize = 64;
    
    this.init();
  }
  
  init() {
    // Create orb element
    this.orbElement = document.createElement('div');
    this.orbElement.className = 'kiaan-voice-orb';
    
    // Add SVG icon directly with improved design
    this.orbElement.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4C17.1046 4 18 4.89543 18 6V26C18 27.1046 17.1046 28 16 28C14.8954 28 14 27.1046 14 26V6C14 4.89543 14.8954 4 16 4Z" fill="white"/>
      <path d="M8 12C9.10457 12 10 12.8954 10 14V18C10 19.1046 9.10457 20 8 20C6.89543 20 6 19.1046 6 18V14C6 12.8954 6.89543 12 8 12Z" fill="white"/>
      <path d="M24 10C25.1046 10 26 10.8954 26 12V20C26 21.1046 25.1046 22 24 22C22.8954 22 22 21.1046 22 20V12C22 10.8954 22.8954 10 24 10Z" fill="white"/>
    </svg>`;
    
    // Set default position
    this.setDefaultPosition();
    
    // Add event listeners for drag
    this.orbElement.addEventListener('mousedown', this.handleDragStart.bind(this));
    this.orbElement.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: false });
    
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: false });
    
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));
    document.addEventListener('touchend', this.handleDragEnd.bind(this));
    
    // Handle window resize to ensure orb stays in viewport
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Append to DOM
    document.body.appendChild(this.orbElement);
  }
  
  setDefaultPosition() {
    // Default positioning (bottom-right corner)
    const defaultX = window.innerWidth - this.orbSize - 20;
    const defaultY = window.innerHeight - this.orbSize - 20;
    
    // Apply position
    this.orbElement.style.right = '20px';
    this.orbElement.style.bottom = '20px';
    this.orbElement.style.left = 'auto';
    this.orbElement.style.top = 'auto';
  }
  
  handleResize() {
    // If the orb has been manually positioned (not using right/bottom)
    if (this.orbElement.style.left !== 'auto') {
      const rect = this.orbElement.getBoundingClientRect();
      let x = rect.left;
      let y = rect.top;
      
      // Positioning constraints
      const maxX = window.innerWidth - this.orbSize;
      const maxY = window.innerHeight - this.orbSize;
      
      // Ensure orb stays within viewport after resize
      if (x > maxX) x = maxX;
      if (y > maxY) y = maxY;
      
      this.orbElement.style.left = `${x}px`;
      this.orbElement.style.top = `${y}px`;
    }
  }
  
  handleDragStart(e) {
    e.preventDefault();
    
    // Get event position
    const pos = e.type === 'touchstart' ? e.touches[0] : e;
    this.startX = pos.clientX;
    this.startY = pos.clientY;
    
    // Get current position of orb
    const rect = this.orbElement.getBoundingClientRect();
    this.offsetX = this.startX - rect.left;
    this.offsetY = this.startY - rect.top;
    
    // Reset drag state
    this.isDragging = false;
    this.hasMoved = false;
  }
  
  handleDragMove(e) {
    if (this.startX === 0 && this.startY === 0) return;
    
    const pos = e.type === 'touchmove' ? e.touches[0] : e;
    const deltaX = pos.clientX - this.startX;
    const deltaY = pos.clientY - this.startY;
    
    // Check if we've moved past the drag threshold (5px)
    if (!this.isDragging && (Math.abs(deltaX) > this.dragThreshold || Math.abs(deltaY) > this.dragThreshold)) {
      this.isDragging = true;
      this.orbElement.classList.add('dragging');
    }
    
    if (this.isDragging) {
      e.preventDefault();
      this.hasMoved = true;
      
      // Calculate new position
      let newX = pos.clientX - this.offsetX;
      let newY = pos.clientY - this.offsetY;
      
      // Positioning constraints - cannot be dragged outside viewport
      const maxX = window.innerWidth - this.orbSize;
      const maxY = window.innerHeight - this.orbSize;
      
      // Constrain to viewport
      newX = Math.max(0, Math.min(maxX, newX));
      newY = Math.max(0, Math.min(maxY, newY));
      
      // Apply new position
      this.orbElement.style.right = 'auto';
      this.orbElement.style.bottom = 'auto';
      this.orbElement.style.left = `${newX}px`;
      this.orbElement.style.top = `${newY}px`;
    }
  }
  
  handleDragEnd(e) {
    if (this.isDragging) {
      this.orbElement.classList.remove('dragging');
    } else if (!this.hasMoved && this.clickHandler) {
      // It was a click, not a drag - only open panel if orb wasn't being dragged
      this.clickHandler();
    }
    
    // Reset state
    this.startX = 0;
    this.startY = 0;
    this.isDragging = false;
  }
  
  setClickHandler(handler) {
    this.clickHandler = handler;
  }
  
  showOrb() {
    this.orbElement.classList.remove('panel-open');
  }
  
  hideOrb() {
    this.orbElement.classList.add('panel-open');
  }
}

export default VoiceOrb;
