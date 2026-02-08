import crypto from "crypto";
import axiosInstance from "../utils/axios.js";

export const generateSecureBunnyUrl = async (req, res) => {
  try {
    const { videoId, libraryId } = req.query;

    if (!videoId || !libraryId) {
      return res.status(400).json({ error: "Missing videoId or libraryId" });
    }

    const tokenKey = process.env.BUNNY_TOKEN_KEY;
    const apiKey = process.env.BUNNY_API_KEY;     

    const expires = Math.floor(Date.now() / 1000) + 60 * 5; 
    const token = crypto
      .createHash("sha256")
      .update(tokenKey + videoId + expires)
      .digest("hex");

    const secureUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;

    const response = await axiosInstance.get(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        headers: {
          AccessKey: apiKey,
        },
      }
    );

    const videoData = response.data;

    return res.status(200).json({
      url: secureUrl,
      video: videoData,
    });
  } catch (error) {
    console.error("Error generating secure Bunny URL:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
