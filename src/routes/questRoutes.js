// src/routes/questRoutes.js (UPDATED with Swagger docs)
const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Quest:
 *       type: object
 *       required:
 *         - title
 *         - deadline
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated UUID
 *         user_id:
 *           type: string
 *           description: Owner user ID
 *         title:
 *           type: string
 *           maxLength: 100
 *           description: Quest title
 *         description:
 *           type: string
 *           description: Quest details
 *         status:
 *           type: string
 *           enum: [active, completed, failed, abandoned]
 *           default: active
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *         deadline:
 *           type: string
 *           format: date-time
 *         xp_reward:
 *           type: integer
 *           minimum: 10
 *           maximum: 1000
 *           default: 100
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         completed_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/v1/quests:
 *   get:
 *     tags: [Quests]
 *     summary: Get all quests for current user
 *     description: Retrieve all quests. Optional filters by status and priority.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, failed, abandoned]
 *         description: Filter by quest status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by quest priority
 *     responses:
 *       200:
 *         description: List of quests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quest'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/', questController.getQuests);

/**
 * @swagger
 * /api/v1/quests:
 *   post:
 *     tags: [Quests]
 *     summary: Create a new quest
 *     description: Create a new RPG-style quest/task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: Defeat the Bug Dragon
 *               description:
 *                 type: string
 *                 example: Fix all critical bugs before release
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 example: urgent
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-05T23:59:59Z"
 *               xp_reward:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 1000
 *                 default: 100
 *                 example: 500
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["coding", "bug-fixing"]
 *     responses:
 *       201:
 *         description: Quest created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Quest'
 *       400:
 *         description: Bad request - Invalid data
 *       401:
 *         description: Unauthorized
 */
router.post('/', questController.createQuest);

/**
 * @swagger
 * /api/v1/quests/{id}:
 *   get:
 *     tags: [Quests]
 *     summary: Get quest by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Quest ID
 *     responses:
 *       200:
 *         description: Quest details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Quest'
 *       404:
 *         description: Quest not found
 */
router.get('/:id', questController.getQuestById);

/**
 * @swagger
 * /api/v1/quests/{id}:
 *   put:
 *     tags: [Quests]
 *     summary: Update quest status
 *     description: Complete, fail, or update quest status. Completing quests grants XP!
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Quest ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, completed, failed, abandoned]
 *                 description: |
 *                   New quest status:
 *                   - **completed**: Grants XP and updates streak
 *                   - **failed**: Resets your streak
 *                   - **abandoned**: No penalties
 *                 example: completed
 *     responses:
 *       200:
 *         description: Quest updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Quest'
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Quest not found
 */
router.put('/:id', questController.updateQuestStatus);

/**
 * @swagger
 * /api/v1/quests/{id}:
 *   delete:
 *     tags: [Quests]
 *     summary: Delete a quest
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Quest ID
 *     responses:
 *       200:
 *         description: Quest deleted
 *       404:
 *         description: Quest not found
 */
router.delete('/:id', questController.deleteQuest);

module.exports = router;