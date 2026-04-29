// src/routes/swaggerRoutes.js
const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

// Custom Swagger UI options
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { 
      background-color: #1a1a2e; 
      padding: 15px 0;
    }
    .swagger-ui .topbar .download-url-wrapper .select-label {
      color: #e94560;
    }
    .swagger-ui .topbar a {
      display: none;
    }
    .swagger-ui .info .title {
      color: #1a1a2e;
      font-size: 36px;
      font-weight: bold;
    }
    .swagger-ui .info .description {
      font-size: 14px;
      line-height: 1.6;
    }
    .swagger-ui .scheme-container {
      background-color: #f8f9fa;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .swagger-ui .opblock-tag {
      font-size: 20px !important;
      font-weight: bold !important;
    }
    .swagger-ui .opblock.opblock-post {
      border-color: #49cc90;
      background: rgba(73,204,144,.1);
    }
    .swagger-ui .opblock.opblock-get {
      border-color: #61affe;
      background: rgba(97,175,254,.1);
    }
    .swagger-ui .opblock.opblock-put {
      border-color: #fca130;
      background: rgba(252,161,48,.1);
    }
    .swagger-ui .opblock.opblock-delete {
      border-color: #f93e3e;
      background: rgba(249,62,62,.1);
    }
    .swagger-ui .btn.authorize {
      background-color: #e94560;
      border-color: #e94560;
      color: white;
    }
    .swagger-ui .btn.authorize:hover {
      background-color: #c73e54;
    }
    /* RPG Theme */
    .swagger-ui::before {
      content: "⚔️ Pixel Task Quest API";
      display: block;
      text-align: center;
      padding: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 2px;
    }
  `,
  customSiteTitle: 'Pixel Task Quest API - Documentation',
  customfavIcon: 'https://emojicdn.elk.sh/⚔️',
  customJs: `
    // Add custom JS if needed
    console.log('⚔️ Pixel Task Quest API Docs Loaded!');
  `,
};

// Swagger JSON endpoint
router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger UI endpoint
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerOptions));

// Export swagger spec for programmatic use
router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

module.exports = router;