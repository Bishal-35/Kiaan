<?php
// Allow local development access
define('ALLOWED_ACCESS', true);

// Add CORS headers for cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Prevent direct access to this file
if (!defined('ALLOWED_ACCESS') && 
    (!isset($_SERVER['HTTP_REFERER']) || 
     !preg_match('/^https?:\/\/(localhost|your-domain\.com)/', $_SERVER['HTTP_REFERER']))) {
    header('HTTP/1.0 403 Forbidden');
    exit('Direct access forbidden');
}

// Get authentication token if provided
$token = isset($_GET['token']) ? $_GET['token'] : null;

// In a production environment, you would validate the token here
// This is a placeholder for token validation
function validateToken($token) {
    // Replace with actual token validation logic
    return true; // For demonstration purposes
}

if ($token && !validateToken($token)) {
    header('HTTP/1.0 403 Forbidden');
    exit(json_encode(['error' => 'Invalid token']));
}

// Store sensitive configuration that should not be visible in client code
$config = [
    'agents' => [
        'chat' => [
            'id' => 'agent_01jwh5qp13ewctpvnsfgbcghpg', 
            'voice_id' => '21m00Tcm4TlvDq8ikWAM' // Jessica voice ID (replace with your preferred voice)
        ],
        'meeting' => [
            'id' => 'agent_01jwh5tte5eejsj2z4hsrhf889',
            'voice_id' => 'AZnzlk1XvdvUeBnXmlld' // Eric voice ID (replace with your preferred voice)
        ]
    ],
    'webhooks' => [
        // Use httpbin for both endpoints to ensure proper JSON responses
        'text_chat' => 'https://httpbin.org/post', // This endpoint returns JSON for any POST request
        'file_upload' => 'https://httpbin.org/post' // Same endpoint for file uploads
    ],
    'elevenlabs' => [
        'api_key' => 'sk_0488d94454e64793c39fb9faa17f6bf88f32c93d43ab50f0', // Replace with your actual ElevenLabs API key
    ],
    'settings' => [
        'max_file_size' => 10485760, // 10MB
        'allowed_file_types' => ['.jpg', '.jpeg', '.png', '.pdf', '.csv', '.doc', '.docx']
    ],
    // Enable development mode by default for testing
    'devMode' => true
];

// Output the configuration as JSON with proper error handling
try {
    echo json_encode($config, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Configuration encoding failed']);
}
?>
