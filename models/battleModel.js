import mongoose from "mongoose";

const battleSchema = new mongoose.Schema({
        roomid: {type: String, required: true},
        localUnit: { type: String, default: "" },
        localAbility: { type: Array, default: [] },
        localSocketId: {type: String, default:""},
        localHp: {type: Number, deault: 1000},
        localUnitHp: {type: Number, deault: 500},
        localBonusDamage: {type: Number, deault: 0},

        remoteAddress: {type: String, deault: ""},
        remoteUnit: { type: String, default: "" },
        remoteAbility: { type: Array, default: [] },
        remoteSocketId: {type: String, default:""},
        remoteHp: {type: Number, deault: 1000},
        remoteUnitHp: {type: Number, deault: 500},
        remoteBonusDamage: {type: Number, deault: 0},
        
        turn: {type: String, deault: ''},
        unitTurn: {type: String, default: ''},
        price: {type: Number, default: 5},

        status: {type: Number, default: 0},
    },
    { timestamps: true},
);

const BattleModel = mongoose.model("BattleModel", battleSchema);

export default BattleModel;
