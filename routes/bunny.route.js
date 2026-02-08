import express from 'express';
import { generateSecureBunnyUrl } from '../controllers/bunny.controller.js';

const router = express.Router();
router.get('/bunny-token', generateSecureBunnyUrl);

export default router;
