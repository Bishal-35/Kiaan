# Kiaan Voice Orb Widget

A production-ready, embeddable floating draggable Voice Orb Widget for any website. The widget provides voice chat, meeting assistant, and text chat functionalities in a sleek, modern UI.

## Features

- Draggable floating orb UI with smooth animations
- Glassmorphic full-screen panel with multiple interaction modes
- Voice Chat mode using ElevenLabs voice AI
- Meeting mode with specialized voice agent
- Text Chat mode with file attachment support
- Secure configuration via PHP backend
- Mobile responsive design
- Cross-browser compatibility

## Project Structure

```
Kiaan/
├── src/
│   ├── js/
│   │   └── kiaan-voice-orb.js
│   ├── css/
│   │   └── styles.css
│   └── assets/
├── dist/
│   └── kiaan-voice-orb.min.js
├── config/
│   └── config.php
├── examples/
│   └── index.html
├── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PHP server (for configuration endpoint)
- ElevenLabs API account
- Modern web browser

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Kiaan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure ElevenLabs**
   - Create an account at [ElevenLabs](https://elevenlabs.io)
   - Get your API key and agent IDs
   - Note down voice IDs you want to use

4. **Set up configuration**
   
   Copy and modify the configuration file:
   ```bash
   cp config/config.example.php config/config.php
   ```
   
   Edit `config/config.php` with your credentials:
   ```php
   <?php
   // Prevent direct access
   if (!defined('ALLOWED_ACCESS') && 
       (!isset($_SERVER['HTTP_REFERER']) || 
        !preg_match('/^https?:\/\/(localhost|your-domain\.com)/', $_SERVER['HTTP_REFERER']))) {
       header('HTTP/1.0 403 Forbidden');
       exit('Direct access forbidden');
   }

   $config = [
       'agents' => [
           'chat' => [
               'id' => 'YOUR_ELEVENLABS_CHAT_AGENT_ID',
               'voice_id' => 'YOUR_VOICE_ID_A'
           ],
           'meeting' => [
               'id' => 'YOUR_ELEVENLABS_MEETING_AGENT_ID',
               'voice_id' => 'YOUR_VOICE_ID_B'
           ]
       ],
       'api_key' => 'YOUR_ELEVENLABS_API_KEY',
       'webhooks' => [
           'text_chat' => 'https://api.yourdomain.com/kiaan/chat',
           'file_upload' => 'https://api.yourdomain.com/kiaan/upload'
       ],
       'settings' => [
           'max_file_size' => 10485760, // 10MB
           'allowed_file_types' => ['.jpg', '.jpeg', '.png', '.pdf', '.csv', '.doc', '.docx']
       ]
   ];

   header('Content-Type: application/json');
   echo json_encode($config);
   ?>
   ```

## Development

### Running Development Server

1. **Start the development environment**
   ```bash
   npm run dev
   ```
   This will:
   - Start a local development server
   - Enable hot reloading
   - Serve files from the `src` directory

2. **Start PHP server (in another terminal)**
   ```bash
   cd config
   php -S localhost:8080
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000` to see the widget in action

### Building for Production

1. **Create production build**
   ```bash
   npm run build
   ```
   This generates `dist/kiaan-voice-orb.min.js`

2. **Test production build**
   ```bash
   npm run serve
   ```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run serve` - Serve production build locally
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Usage

### Basic Implementation

Include the widget in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
</head>
<body>
    <!-- Your website content -->
    
    <!-- Include the Kiaan Voice Orb Widget -->
    <script src="path/to/kiaan-voice-orb.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            KiaanVoiceOrb.init({
                configUrl: 'https://yourdomain.com/config/config.php',
                position: 'bottom-right', // bottom-left, top-right, top-left
                theme: 'dark' // dark, light, auto
            });
        });
    </script>
</body>
</html>
```

### Advanced Configuration

```javascript
KiaanVoiceOrb.init({
    configUrl: 'https://yourdomain.com/config/config.php',
    position: 'bottom-right',
    theme: 'auto',
    size: 'medium', // small, medium, large
    autoStart: false,
    customStyles: {
        primaryColor: '#6366f1',
        accentColor: '#8b5cf6'
    },
    callbacks: {
        onOpen: function() { console.log('Widget opened'); },
        onClose: function() { console.log('Widget closed'); },
        onVoiceStart: function() { console.log('Voice interaction started'); },
        onVoiceEnd: function() { console.log('Voice interaction ended'); }
    }
});
```

## Deployment

### Production Checklist

1. **Security**
   - Update `config.php` with your production domain
   - Use HTTPS for all endpoints
   - Validate file uploads server-side
   - Implement rate limiting

2. **Performance**
   - Use CDN for static assets
   - Enable gzip compression
   - Implement caching headers

3. **Testing**
   - Test across different browsers
   - Verify mobile responsiveness
   - Test voice functionality
   - Validate file upload limits

### Server Requirements

- PHP 7.4+ (for configuration endpoint)
- HTTPS enabled
- File upload permissions configured
- CORS headers properly set

## Troubleshooting

### Common Issues

1. **Widget not loading**
   - Check console for JavaScript errors
   - Verify config.php is accessible
   - Ensure CORS is properly configured

2. **Voice features not working**
   - Verify ElevenLabs API credentials
   - Check browser microphone permissions
   - Ensure HTTPS is enabled

3. **File upload failing**
   - Check file size limits
   - Verify allowed file types
   - Ensure upload endpoint is accessible

### Debug Mode

Enable debug mode for detailed logging:

```javascript
KiaanVoiceOrb.init({
    configUrl: 'path/to/config.php',
    debug: true
});
```

## API Reference

### Methods

- `KiaanVoiceOrb.init(options)` - Initialize the widget
- `KiaanVoiceOrb.show()` - Show the widget
- `KiaanVoiceOrb.hide()` - Hide the widget
- `KiaanVoiceOrb.destroy()` - Remove the widget completely

### Events

- `kiaan:open` - Widget panel opened
- `kiaan:close` - Widget panel closed
- `kiaan:voice-start` - Voice interaction started
- `kiaan:voice-end` - Voice interaction ended

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- iOS Safari 13+
- Android Chrome 80+

