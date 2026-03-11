
import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema({
    title: String,
    url: String,
    publicId: String,
});

export default mongoose.model("Resource", ResourceSchema);
