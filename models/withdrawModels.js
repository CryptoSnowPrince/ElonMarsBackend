import mongoose from "mongoose";

const withdrawSchema = new mongoose.Schema({
        walletAddress: {type: String, required: true},
        amount: {type:String, required: true},
        txId: {type: String, required: true},
    },
    { timestamps: true},
);

const Withdraw = mongoose.model("Withdraw", withdrawSchema);

export default Withdraw;
