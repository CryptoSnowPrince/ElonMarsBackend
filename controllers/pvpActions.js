import asyncHandler from 'express-async-handler';
import BattleModel from '../models/battleModel.js';

export const getRoomList = asyncHandler(async(req, res) =>{
    
    try{
        let room = await BattleModel.find({status: 3}, {
            roomid: 1,
            price: 1,
            _id: 0
        });
    
        if(!room) room = [];
    
        return res.json(room);
    } catch(e) {

        console.log("pvpAction/getRoomList.js", e);
    }
});