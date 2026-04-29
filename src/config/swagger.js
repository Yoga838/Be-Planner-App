// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pixel Task Quest API',
      version: '1.0.0',
      description: `
## 🎮 RPG Planner Backend API

Transform your tasks into epic quests! Complete quests, earn XP, level up, and maintain your streak.

### Features
- ⚔️ **Quest System** - Create & manage RPG-style tasks
- 📊 **Stats Tracking** - XP, Level, Streak system
- 🎒 **Inventory** - Collect items from completed quests
- 🏆 **Achievements** - Unlock milestones
- 🔔 **Notifications** - Push (FCM) & Real-time (Socket.io)
- ⏰ **Smart Reminders** - Nagging notifications on free days

### Authentication
This API uses **Supabase JWT** tokens. 
1. Register/Login to get your token
2. Click "Authorize" button and paste your token
3. All authenticated endpoints need: \`Bearer YOUR_TOKEN\`

### RPG Mechanics
- **XP Formula**: \`Level = sqrt(XP/100) + 1\`
- **Streak**: Complete at least 1 quest daily
- **Quest Priority**: low (50 XP), medium (100 XP), high (200 XP), urgent (500 XP)
      `,
      contact: {
        name: 'Pixel Task Quest Support',
        url: 'https://github.com/yourusername/pixel-task-quest',
        email: 'support@pixelquest.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.pixelquest.com',
        description: 'Production server (coming soon)',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints (Register, Login)',
      },
      {
        name: 'Quests',
        description: 'Quest management - Create, Complete, Track your quests',
      },
      {
        name: 'User',
        description: 'User profile, stats, inventory, and preferences',
      },
      {
        name: 'Notifications',
        description: 'FCM token management and notification history',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Supabase JWT token',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'User ID' },
            email: { type: 'string', format: 'email', example: 'hero@pixelquest.com' },
            username: { type: 'string', example: 'PixelHero' },
            fcm_token: { type: 'string', nullable: true, description: 'Firebase Cloud Messaging token' },
            device_platform: { 
              type: 'string', 
              enum: ['mobile', 'desktop', 'web'],
              default: 'web' 
            },
            free_days: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['Saturday', 'Sunday'] 
            },
            notification_preferences: {
              type: 'object',
              properties: {
                pushEnabled: { type: 'boolean', default: true },
                socketEnabled: { type: 'boolean', default: true },
                naggingEnabled: { type: 'boolean', default: true },
              },
            },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        
        // Quest schemas
        Quest: {
          type: 'object',
          required: ['title', 'deadline'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            title: { 
              type: 'string', 
              maxLength: 100,
              example: 'Defeat the Bug Dragon 🐉',
              description: 'Quest title (max 100 characters)'
            },
            description: { 
              type: 'string',
              example: 'Fix all critical bugs before the next release'
            },
            status: { 
              type: 'string', 
              enum: ['active', 'completed', 'failed', 'abandoned'],
              default: 'active'
            },
            priority: { 
              type: 'string', 
              enum: ['low', 'medium', 'high', 'urgent'],
              default: 'medium',
              description: 'Priority affects XP reward'
            },
            deadline: { 
              type: 'string', 
              format: 'date-time',
              example: '2026-05-05T23:59:59Z'
            },
            xp_reward: { 
              type: 'integer',
              default: 100,
              minimum: 10,
              maximum: 1000,
              description: 'XP earned upon completion'
            },
            tags: { 
              type: 'array',
              items: { type: 'string' },
              example: ['coding', 'urgent', 'bug-fix']
            },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        
        CreateQuest: {
          type: 'object',
          required: ['title', 'deadline'],
          properties: {
            title: { 
              type: 'string', 
              maxLength: 100,
              example: 'Complete Project Documentation'
            },
            description: { 
              type: 'string',
              example: 'Write comprehensive API documentation'
            },
            priority: { 
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              default: 'medium'
            },
            deadline: { 
              type: 'string',
              format: 'date-time',
              example: '2026-05-01T23:59:59Z'
            },
            xp_reward: { 
              type: 'integer',
              default: 100,
              example: 200
            },
            tags: { 
              type: 'array',
              items: { type: 'string' },
              example: ['documentation', 'work']
            },
          },
        },
        
        UpdateQuestStatus: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['active', 'completed', 'failed', 'abandoned'],
              description: 'New quest status'
            },
          },
        },
        
        // Stats schemas
        UserStats: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            xp: { type: 'integer', example: 2500 },
            level: { type: 'integer', example: 6 },
            streak_current: { type: 'integer', example: 7 },
            streak_longest: { type: 'integer', example: 14 },
            streak_last_active_date: { type: 'string', format: 'date' },
            total_quests_completed: { type: 'integer', example: 45 },
            total_quests_failed: { type: 'integer', example: 3 },
            total_xp_earned: { type: 'integer', example: 5000 },
          },
        },
        
        // Inventory schemas
        InventoryItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            item_id: { type: 'string', example: 'health_potion' },
            name: { type: 'string', example: 'Health Potion' },
            type: { 
              type: 'string',
              enum: ['consumable', 'equipment', 'cosmetic', 'booster']
            },
            quantity: { type: 'integer', minimum: 0, example: 5 },
            metadata: { type: 'object' },
            acquired_at: { type: 'string', format: 'date-time' },
          },
        },
        
        // Error schema
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message description' },
          },
        },
        
        // Success response
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;