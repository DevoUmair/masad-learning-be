import fs from "fs";

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