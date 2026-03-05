
import crypto from "crypto";

export const generateSecureBunnyUrl = async (req, res) => {
  try {
    const { videoId, libraryId } = req.query;

    if (!videoId || !libraryId) {
      return res.status(400).json({ error: "Missing videoId or libraryId" });
    }

    const tokenKey = process.env.BUNNY_TOKEN_KEY;

    // Set expiration to 5 minutes from now
    const expires = Math.floor(Date.now() / 1000) + 60 * 5;

    // Generate the SHA256 hash
    const token = crypto
      .createHash("sha256")
      .update(tokenKey + videoId + expires)
      .digest("hex");

    const secureUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;

    return res.status(200).json({
      url: secureUrl,
    });

  } catch (error) {
    console.error("Error generating secure Bunny URL:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};