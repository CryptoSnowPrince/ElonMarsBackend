import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
        walletAddress: {type: String, required: true},
        gbaks: {type: Number, default: 0 },

        eggsRequest: {type: Number, default: 0 },
        resourceRequest: {type: Number, default: 0 },
        eggs: {type: Number, default: 0 },
        resource: {type: Number, default: 0 },

        blockNumber: {type: Number, default: 10},
        premium: {type: Date, default:0},
        opendPlace: { type: Array, default: [] },

        stakedDiamond: [{
            position: {type:Number, required: true},
            diamond: {type:Number, default:10, required: true},
            staked_at: {type:Date, default: new Date()}
        }],

        stakedBirds: [{
            position: {type:Number, required: true},
            staked_at: {type:Date, default: new Date()}
        }],

        miningModule:{type:Date, default: 0},
        miningRequest: {type:Number, required: true, default: 0},

        goldMine:{type:Date, default: 0},
        goldMineRequest: {type:Number, required: true, default: 0},

        uraniumMine:{type:Date, default: 0},
        uraniumMineRequest: {type:Number, required: true, default: 0},

        powerMine:{type:Date, default: 0},
        powerMineRequest: {type:Number, required: true, default: 0},

        withdrawLimit: {type: Number, required: true, default: 0},
        withdrawDays: {type: Number, required: true, default: 0},
        lastWithdraw: {type:Date, default: 0},

        userRef: {type:String, default:""},
        parent: {type:String, default:""},

        earned: {type:Number, default: 0},
        referrals: {type:Number, default: 0},

        isblock: {type: Number, default: 0},

        ipAddress: {type: String, default: ""},

        discord:{type:String, default:""},

        isvip: {type: Number, default: 0},

        exp: {type: Number, default: 0, min: 0},
    },
    { timestamps: true},
);

const User = mongoose.model("User", userSchema);

export default User;
