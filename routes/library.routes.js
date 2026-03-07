import express from 'express';
import {
    generateTusSignature,
    saveLibraryVideo,
    getLibraryVideos,
    deleteLibraryVideo
} from '../controllers/library.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(isAuthenticated);

router.post('/signature', generateTusSignature);
router.post('/save', saveLibraryVideo);
router.get('/', getLibraryVideos);
router.delete('/:id', deleteLibraryVideo);

export default router;
