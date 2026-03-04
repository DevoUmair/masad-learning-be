import fs from "fs";


export const uploadToBunny = async (filePath, videoTitle) => {
    const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
    const API_KEY = process.env.BUNNY_TOKEN_KEY;
    try {
        // 1. Create the video object in Bunny to get a Video ID (guid)
        const createRes = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`, {
            method: 'POST',
            headers: {
                'AccessKey': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: videoTitle }),
        });

        if (!createRes.ok) {
            const errorText = await createRes.text();
            console.error("BunnyCDN Create Video Error:", errorText);
            throw new Error(`Failed to create video in Bunny: ${errorText}`);
        }
        const videoData = await createRes.json();
        const videoId = videoData.guid;

        // 2. Upload the actual video file to that ID
        const fileStream = fs.createReadStream(filePath);

        const uploadRes = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`, {
            method: 'PUT',
            headers: {
                'AccessKey': API_KEY,
                'Content-Type': 'application/octet-stream',
            },
            body: fileStream,
            duplex: 'half' // Required for streaming bodies in Node's native fetch
        });

        if (!uploadRes.ok) throw new Error("Failed to upload video file to Bunny");

        return {
            videoId,
            libraryId: LIBRARY_ID
        };
    } catch (error) {
        console.error("Bunny Upload Error:", error);
        throw error;
    }
};

export const cleanupLocalFiles = (files) => {
    if (files && files.length > 0) {
        files.forEach((file) => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                console.log(`🧹 Cleaned up file: ${file.path}`);
            }
        });
    }
};