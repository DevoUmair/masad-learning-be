import axios from 'axios';
import crypto from 'crypto';
import Library from '../models/library.model.js';
import dotenv from 'dotenv';

dotenv.config();

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_API_KEY = process.env.BUNNY_TOKEN_KEY;

export const generateTusSignature = async (req, res) => {
    try {
        const { title } = req.body;
        const instructorId = req.user.id; // Assuming auth middleware adds user to req

        // 1. Create Video Object in Bunny.net to get VideoID
        const createVideoRes = await axios.post(
            `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
            { title },
            {
                headers: {
                    AccessKey: BUNNY_API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        const videoId = createVideoRes.data.guid;

        // 2. Generate Signature for TUS
        // Signature = SHA256(library_id + api_key + expiration_time + video_id)
        const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry
        const signatureBase = BUNNY_LIBRARY_ID + BUNNY_API_KEY + expirationTime + videoId;
        const signature = crypto.createHash('sha256').update(signatureBase).digest('hex');

        // 3. Create Library Record in DB immediately
        const libraryRecord = new Library({
            title,
            bunnyVideoId: videoId,
            bunnyLibraryId: BUNNY_LIBRARY_ID,
            instructor: instructorId,
            status: 'uploading',
            duration: req.body.duration || 0,
        });
        await libraryRecord.save();

        res.status(200).json({
            success: true,
            signature,
            expirationTime,
            libraryId: BUNNY_LIBRARY_ID,
            videoId,
            video: libraryRecord,
        });
    } catch (error) {
        console.error('Error generating TUS signature:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Failed to initialize upload' });
    }
};

export const saveLibraryVideo = async (req, res) => {
    try {
        const { videoId, duration } = req.body;

        const updatedVideo = await Library.findOneAndUpdate(
            { bunnyVideoId: videoId },
            {
                status: 'processing',
                duration: duration || 0
            },
            { new: true }
        );

        res.status(200).json({ success: true, data: updatedVideo });
    } catch (error) {
        console.error('Error saving library video:', error);
        res.status(500).json({ success: false, message: 'Failed to save video metadata' });
    }
};

export const getLibraryVideos = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const videos = await Library.find({ instructor: instructorId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: videos });
    } catch (error) {
        console.error('Error fetching library videos:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch videos' });
    }
};

export const deleteLibraryVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await Library.findById(id);

        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        // 1. Delete from Bunny.net
        await axios.delete(
            `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${video.bunnyVideoId}`,
            {
                headers: {
                    AccessKey: BUNNY_API_KEY,
                },
            }
        );

        // 2. Delete from DB
        await Library.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Failed to delete video' });
    }
};
