import { getUnitHealth, handleAttack, handleCloseSocket, handleUnitAttack } from "./controllers/socket/BattleController.js";
import { checkRoomCreatedTransaction } from "./controllers/web3Helper.js";
import { decryptData } from "./helper/cryptoHelper.js";
import { sendBroadCasetAllEvent, sendBroadCastEvent, sendEvent } from "./helper/socketHelper.js";
import BattleModel from "./models/battleModel.js";

import User from "./models/userModels.js";
import { pvpLog } from "./utiles/logController.js";
import { UNIT_SOCKET, PLAYER_SOCKET, ROOM_SOCKET } from "./utiles/socket_api.js";

global.onlineUsers = new Map();
global.onlineSupports = new Map();

const socketConnectionManager = function (socket, io) {

    socket.on(PLAYER_SOCKET.CREATE_ROOM, async (roomData) => {

        const resData = decryptData(roomData);
        const {roomid, price} = resData;
        let result = await checkRoomCreatedTransaction(roomid, price, "EvtRoomCreated");
        result = true;
        console.log(roomid, price, result);
        
        if(!result) {
            console.log("didn't create the room!");
            sendEvent(socket, PLAYER_SOCKET.ERROR, {error: "You didn't send BUSD to create the room"});
            return;
        }
        console.log("send successfully");

        // If room is already created, don't create room
        if (io.sockets.adapter.rooms.has(roomid)) {
            const numberOfPlayers = io.sockets.adapter.rooms.get(roomid).size;
            if(numberOfPlayers == 2) {
                console.log('Can\'t create same room');
                return ;   
            }
        }
        socket.join(roomid);

        if(BattleModel.findOne({roomid})) {
            await BattleModel.findOneAndUpdate({ roomid }, { 
                price: price,
                localSocketId: socket.id,

                localUnit: "",
                localAbility: [],
                localHp: 1000,
                localBonusDamage: 0,
                
                remoteAddress: "",
                remoteUnit: "",
                remoteAbility: [],
                remoteHp: 1000,
                remoteBonusDamage: 0,

                status: 1
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
        } else {
            const battle = new BattleModel({
                roomid: roomid, 
                price: price,
                localSocketId: socket.id,
                status: 1
            });
            await battle.save();
        }

        sendEvent(socket, PLAYER_SOCKET.CREATE_ROOM, resData);
        
    });

    socket.on(PLAYER_SOCKET.JOIN_ROOM, async (roomData) => {

        const resData = decryptData(roomData);
        const {roomid, address, price} = resData;
        console.log("join room", resData);

        let turn = "local";

        if(Math.random() >= 0.5) {
            turn = "remote";
        }

        turn = "remote";

        let result = await checkRoomCreatedTransaction(address, price, "EvtJoinedRoom");
        result = true;
        if(!result) {
            console.log("can't join the room!");
            sendEvent(socket, PLAYER_SOCKET.ERROR, {error: "You didn't send BUSD to join this room"});
            return;
        }


        // If room does not exist, can't join the room
        console.log(io.sockets.adapter.rooms);
        if (!io.sockets.adapter.rooms.has(roomid)) {
            console.log('Room does not exist that you want to join');
            return ;
        } 
        
        const roomUsers = io.sockets.adapter.rooms.get(roomid);
        if(roomUsers.size > 1) {
            console.log('Someone already joined the room');
            return;
        }         
        socket.join(roomid);

        let results = await BattleModel.findOneAndUpdate({ roomid }, { 
            remoteAddress: address,
            remoteSocketId: socket.id,
            turn: turn,
            unitTurn: turn,
            status: 11,
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });
        
        resData["turn"] = turn;
        sendEvent(socket, PLAYER_SOCKET.JOIN_ROOM, resData);
        sendBroadCastEvent(socket, roomid, PLAYER_SOCKET.JOIN_ROOM, resData);

        pvpLog(roomid, address, "", "", [], [], price, "Pvp Started...");
    });

    socket.on(PLAYER_SOCKET.SELECT_UNIT, async (data) => {
        
        const resData = decryptData(data);
        const {roomid, address, unit} = resData;
        console.log("select unit", {roomid, address, unit});

        if(roomid == address) {
            await BattleModel.findOneAndUpdate({ roomid }, { 
                localUnit: unit,
                localUnitHp: getUnitHealth(unit),
                status: 2,
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
        } else {
            await BattleModel.findOneAndUpdate({ roomid }, { 
                remoteUnit: unit,
                remoteUnitHp: getUnitHealth(unit),
                status: 12,
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
        }
        
        sendEvent(socket, PLAYER_SOCKET.SELECT_UNIT, resData);
        sendBroadCastEvent(socket, roomid, PLAYER_SOCKET.SELECT_UNIT, resData);
    });

    socket.on(PLAYER_SOCKET.SELECT_ABILITY, async (data) => {
        
        const resData = decryptData(data);
        const {roomid, address, ability} = resData;

        if(roomid == address) {
            await BattleModel.findOneAndUpdate({ roomid }, { 
                localAbility: ability,
                status: 3,
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
        } else {
            await BattleModel.findOneAndUpdate({ roomid }, { 
                remoteAbility: ability,
                status: 13,
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });


            /// Start the game 
        }

        sendEvent(socket, PLAYER_SOCKET.SELECT_ABILITY, resData);
        sendBroadCastEvent(socket, roomid, PLAYER_SOCKET.SELECT_ABILITY, resData);
    });

    socket.on(ROOM_SOCKET.RESERVING_ROOM, async (data) => {
    
        const {roomid, address, type} = decryptData(data);

        let battle = BattleModel.findOne({ roomid });
        if(battle.status == 10) {
            return;
        }

        if(type == 1) {
            await BattleModel.findOneAndUpdate({ roomid }, { 
                status: 5,
                remoteAddress: address,
                remoteSocketId: socket.id,
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
            sendBroadCasetAllEvent(socket, ROOM_SOCKET.ROOM_STATUS, {roomid: roomid, status:2});
        }
        else if(type == 2) {
            await BattleModel.findOneAndUpdate({ roomid }, { 
                status: 3,
                remoteAddress: "",
                remoteSocketId: "",
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
        }
    });

    socket.on(ROOM_SOCKET.CLOSE_ROOM, async (data) => {
    
        const {roomid, address} = decryptData(data);

        if(roomid == address) {
            await BattleModel.findOneAndUpdate({ roomid }, { 
                status: 10,
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
            sendBroadCasetAllEvent(socket, ROOM_SOCKET.ROOM_STATUS, {roomid: roomid, status:2});
        }
    });

    socket.on(PLAYER_SOCKET.ATTACK, async (data) => {
        let resData = decryptData(data);
        handleAttack(socket, resData);
    });

    socket.on(UNIT_SOCKET.ATTACK, async (data) => {
        console.log("unit attack", data)
        let resData = decryptData(data);
        handleUnitAttack(socket, resData);
    });

    socket.on(PLAYER_SOCKET.READY, async (data) => {

        const resData = decryptData(data);
        const {roomid} = resData;

        sendEvent(socket, PLAYER_SOCKET.READY, resData);
        sendBroadCastEvent(socket, roomid, PLAYER_SOCKET.READY, resData);
    })

    socket.on('getBattleData', async(data)=>{

        const resData = decryptData(data);
        const {roomid} = resData;
    
        const room = await BattleModel.findOne({roomid}, {
            localUnit: 1,
            localAbility: 1,
            remoteAddress: 1,
            remoteUnit: 1,
            remoteAbility: 1,
            _id: 0
        });

        console.log("get battle data = ", room);

        sendEvent(socket, "getBattleData", room);
        
    })

    socket.on('disconnect', handleCloseSocket);
};

export default socketConnectionManager;
