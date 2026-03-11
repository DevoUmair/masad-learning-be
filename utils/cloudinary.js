import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const uploadToCloudinary = async (localFilePath, folderName = "masad_learning") => {
    try {
        if (!localFilePath) return null;

        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: folderName,
        });

        // File has been uploaded securely
        console.log("File is uploaded on cloudinary", response.url);

        return {
            url: response.secure_url,
            publicId: response.public_id
        };

    } catch (error) {
        console.error("Cloudinary Upload Error", error);
        return null;
    }
};

export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null;

        // Delete the file from cloudinary
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        console.log("Deleted from cloudinary", response);
        return response;
    } catch (error) {
        console.error("Cloudinary Delete Error", error);
        return null;
    }
};
