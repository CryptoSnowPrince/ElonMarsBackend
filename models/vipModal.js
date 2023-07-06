import mongoose from "mongoose";

const vipSchema = new mongoose.Schema({
        walletAddress: {type: String, required: true, unique: true},
        maxBless: {type: Boolean, required: true, default: true},
    },
    { timestamps: true},
);

const VIPUser = mongoose.model("VIPUser", vipSchema);

export default VIPUser;
