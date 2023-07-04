import { decryptData } from "../../helper/cryptoHelper.js";
import { sendBroadCasetAllEvent, sendBroadCastEvent, sendDataToAllSocket, sendEvent } from "../../helper/socketHelper.js";
import BattleModel from "../../models/battleModel.js";
import User from "../../models/userModels.js";
import VIPUser from "../../models/vipModal.js";
import { pvpLog } from "../../utiles/logController.js";
import { PLAYER_SOCKET, ROOM_SOCKET, UNIT_SOCKET } from "../../utiles/socket_api.js";
import { bonusDamage, spellTypes, unitTypes } from "../../utiles/weapon.js";
import { removeCreatedUserRoom, sendPvpReward } from "../web3Helper.js";

const attackRequestCountByClientId = {};
const unitAttackRequestCountByClientId = {};

export const handleAttack = async function (socket, data) {

    try{
        const clientId = socket.id;
        const now = Date.now();
        const lastRequestTime = attackRequestCountByClientId[clientId] || 0;

        if (lastRequestTime + 200 > now) {
            //Impossible request;
            console.log("fack detected!!!");
            return;
        } else {
            attackRequestCountByClientId[clientId] = now;
        }

        const {
            roomid,
            address,
            type
        } = data;

        let battle = await BattleModel.findOne({roomid});
        let localHp = battle.localHp, remoteHp = battle.remoteHp;

        let remoteUnitHp = battle.remoteUnitHp;
        let localUnitHp = battle.localUnitHp;

        let localBonusDamage = battle.localBonusDamage;
        if(!localBonusDamage) localBonusDamage = 0;

        let remoteBonusDamage = battle.remoteBonusDamage;
        if(!remoteBonusDamage) remoteBonusDamage = 0;

        const {damage, health, bonus} = await getAttackDetail(type, roomid == address ? localBonusDamage : remoteBonusDamage, address);

        data['damage'] = damage;
        data['health'] = health;

        if(roomid == address) localBonusDamage = bonus;
        else remoteBonusDamage = bonus;


        // Bonus Damage when Next Round
        let next_turn = nextTurn(battle.turn);

        if(roomid == address) { // local player attack remote player
            
            if(battle.turn != "local") {
                console.log("scam attack detected(local player)!");
                return;
            }

            remoteHp = battle.remoteUnitHp > 0 ? battle.remoteHp : Math.max(0, battle.remoteHp - damage);
            localHp = Math.min(1000, battle.localHp + health);
            remoteUnitHp = Math.max(0, battle.remoteUnitHp - damage);

            await BattleModel.findOneAndUpdate({ roomid }, { 
                localHp: localHp,
                remoteHp: remoteHp,
                remoteUnitHp: remoteUnitHp,
                localBonusDamage: bonus,

                turn: next_turn
            }, { new: true, upsert: true });

        } else { // remote player attack local player

            if(battle.turn != "remote") {
                console.log("scam attack detected(remote player)!");
                return;
            }

            localHp = battle.localUnitHp > 0 ? battle.localHp : Math.max(0, battle.localHp - damage);
            remoteHp = Math.min(1000, battle.remoteHp + health);
            localUnitHp = Math.max(0, battle.localUnitHp - damage);

            await BattleModel.findOneAndUpdate({ roomid }, { 
                remoteHp: remoteHp,
                localHp: localHp,
                localUnitHp: localUnitHp,
                remoteBonusDamage: bonus,

                turn: next_turn
            }, { new: true, upsert: true });
        }

        let ldamage = getDamageFromBit(localBonusDamage);
        let rdamage = getDamageFromBit(remoteBonusDamage);

        console.log("update bonus damage", ldamage, rdamage);
        sendEvent(socket, PLAYER_SOCKET.UPDATE_BONUS_DAMAGE, {localDamage: ldamage, remoteDamage: rdamage});
        sendBroadCastEvent(socket, roomid, PLAYER_SOCKET.UPDATE_BONUS_DAMAGE, {localDamage: ldamage, remoteDamage: rdamage});

        console.log("player attack", data);
        sendEvent(socket, PLAYER_SOCKET.ATTACK, data);
        sendBroadCastEvent(socket, roomid, PLAYER_SOCKET.ATTACK, data);

        if(remoteHp == 0 || localHp == 0) {
            sendEvent(socket, PLAYER_SOCKET.FINISHED, {winner:localHp == 0 ? battle.remoteAddress : battle.roomid});
            sendBroadCastEvent(socket, roomid, PLAYER_SOCKET.FINISHED, {winner:localHp == 0 ? battle.remoteAddress : battle.roomid});

            let winner = localHp == 0 ? battle.remoteAddress : roomid;
            let loser = localHp == 0 ? roomid : battle.remoteAddress;

            console.log("send reward to winner", winner, roomid);

            await updateUserExperience(winner.toLowerCase(), loser.toLowerCase());

            await BattleModel.findOneAndUpdate({ roomid }, { 
                status: 10,
            }, { new: true, upsert: true });

            pvpLog(battle.roomid, battle.remoteAddress, battle.localUnit, battle.remoteUnit, battle.localAbility, battle.remoteAbility, battle.price, winner);
            sendPvpReward(roomid, winner, battle.price);
            
            closeRoom(socket, roomid);

            let resReward = (Number(battle.price) * 6 / 5);
            sendResourceReward(resReward, battle);


            return;
        }

        
        if(next_turn == 'local'){
            
            if(remoteUnitHp == 0) remoteHp = Math.max(0, remoteHp-ldamage);
            else remoteUnitHp = Math.max(0, remoteUnitHp-ldamage);
            
        } else if (next_turn == 'remote') {
            
            if(localUnitHp == 0) localHp = Math.max(0, localHp-rdamage);
            else localUnitHp = Math.max(0, localUnitHp-rdamage);
        }
        console.log("battle status = ",  localHp, localUnitHp, remoteHp, remoteUnitHp);

        // update Database
        await BattleModel.findOneAndUpdate({ roomid }, { 
            remoteHp,
            localHp,
            remoteUnitHp,
            localUnitHp,
            unitTurn: next_turn
        }, { new: true, upsert: true });

        if(remoteHp == 0 || localHp == 0) {
            sendEvent(socket, PLAYER_SOCKET.FINISHED, {winner:localHp == 0 ? battle.remoteAddress : battle.roomid});
            sendBroadCastEvent(socket, roomid, PLAYER_SOCKET.FINISHED, {winner:localHp == 0 ? battle.remoteAddress : battle.roomid});

            let winner = localHp == 0 ? battle.remoteAddress : roomid;
            let loser = localHp == 0 ? roomid : battle.remoteAddress;


            console.log("send reward to winner", winner, roomid);

            await updateUserExperience(winner.toLowerCase(), loser.toLowerCase());

            await BattleModel.findOneAndUpdate({ roomid }, { 
                status: 10,
            }, { new: true, upsert: true });



            pvpLog(battle.roomid, battle.remoteAddress, battle.localUnit, battle.remoteUnit, battle.localAbility, battle.remoteAbility, battle.price, winner);
            sendPvpReward(roomid, winner, battle.price);

            closeRoom(socket, roomid);

            let resReward = (Number(battle.price) * 6 / 5);
            sendResourceReward(resReward, battle);

        }
    
    } catch(e) {
        console.log("BattleController.js/handleAttack function, ", e);
    }

    return;
};

export const handleUnitAttack = async function (socket, data) {

    try{
        const clientId = socket.id;
        const now = Date.now();
        const lastRequestTime = unitAttackRequestCountByClientId[clientId] || 0;

        if (lastRequestTime + 200 > now) {
            //Impossible request;
            console.log("fack detected!!!");
            return;
        } else {
            unitAttackRequestCountByClientId[clientId] = now;
        }

        const {
            roomid,
            address,
            type
        } =  data;
        const {damage, isBattle, health} = getUnitDamage(type);

        if(damage == 0) return;

        let battle = await BattleModel.findOne({roomid});
        let localHp = battle.localHp, remoteHp = battle.remoteHp;

        data['damage'] = damage;
        data['health'] = health;


        if(roomid == address) { // local player attack remote player
            
            if(battle.unitTurn != "local") {
                console.log("scam attack detected(local)!");
                return;
            }

            if(battle.remoteUnitHp == 0 || isBattle) {
                remoteHp = Math.max(0, remoteHp - damage);
            }

            await BattleModel.findOneAndUpdate({ roomid }, { 
                remoteHp: remoteHp,
                remoteUnitHp: Math.max(0, battle.remoteUnitHp - damage),

                unitTurn: nextTurn(battle.unitTurn)
            }, { new: true, upsert: true });

        } else { // remote player attack local player

            if(battle.unitTurn != "remote") {
                console.log("scam attack detected (remote)!");
                return;
            }
            if(battle.localUnitHp == 0 || isBattle) {
                localHp = Math.max(0, localHp - damage);
            }

            await BattleModel.findOneAndUpdate({ roomid }, { 
                localHp: localHp,
                localUnitHp: Math.max(0, battle.localUnitHp - damage),

                unitTurn: nextTurn(battle.unitTurn)
            }, { new: true, upsert: true });
        }


        if(remoteHp == 0 || localHp == 0) {
            sendEvent(socket, PLAYER_SOCKET.FINISHED, {winner:localHp == 0 ? battle.remoteAddress : battle.roomid});
            sendBroadCastEvent(socket, roomid, PLAYER_SOCKET.FINISHED, {winner:localHp == 0 ? battle.remoteAddress : battle.roomid});

            let winner = localHp == 0 ? battle.remoteAddress : roomid;
            let loser = localHp == 0 ? roomid : battle.remoteAddress;

            console.log("send reward to winner", winner, roomid);

            await updateUserExperience(winner.toLowerCase(), loser.toLowerCase());

            await BattleModel.findOneAndUpdate({ roomid }, { 
                status: 10,
            }, { new: true, upsert: true });

            pvpLog(battle.roomid, battle.remoteAddress, battle.localUnit, battle.remoteUnit, battle.localAbility, battle.remoteAbility, battle.price, winner);
            sendPvpReward(roomid, winner, battle.price);
            closeRoom(socket, roomid);

            let resReward = (Number(battle.price) * 6 / 5);
            sendResourceReward(resReward, battle);

        } else {

            console.log("attack unit", data);

            sendEvent(socket, UNIT_SOCKET.ATTACK, data);
            sendBroadCastEvent(socket, roomid, UNIT_SOCKET.ATTACK, data);
        }


    } catch(e) {
        console.log("BattleController.js/handleUnitAttack function, ", e);
    }

}

export const handleCloseSocket = async function (data) {

    try{
        let socket = this;
        let socketId = socket.id;

        let closedPlayer = "local";
        let battle = await BattleModel.findOne({localSocketId:socketId});

        if(!battle) {
            battle = await BattleModel.findOne({remoteSocketId:socketId});
            closedPlayer = "remote";
        }
         
        if(!battle) {
            // console.log("battle is null, ", socketId);
            // removeCreatedUserRoom("0xaa12317fa8bbd3d02187aa7b17d9985eda371059");
            return;
        }

        if(battle.status == 10) {
            console.log("already sent reward");
            return;
        }
        

        let winner = closedPlayer == 'local' ? battle.remoteAddress : battle.roomid;
        let loser = closedPlayer == 'local' ? battle.roomid : battle.remoteAddress;

        const roomid = battle.roomid;

        console.log("disconnecting winner ", winner);
        console.log("disconnecting loser ", loser);

        if(battle.status == 5) {
            await BattleModel.findOneAndUpdate({ roomid }, { 
                status: 3,
                remoteAddress: "",
                remoteSocketId: "",
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
        } else {
            await BattleModel.findOneAndUpdate({ roomid }, { 
                status: 10,
                remoteAddress: "",
                remoteSocketId: "",
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
            sendBroadCasetAllEvent(socket, ROOM_SOCKET.ROOM_STATUS, {roomid: roomid, status:2});
        }

        if(winner) {
            pvpLog(roomid, winner, "", "", [], [], battle.price, "Disconnect Win, " + winner);
            sendBroadCastEvent(socket, roomid, PLAYER_SOCKET.FINISHED, {winner: winner});
            sendPvpReward(roomid, winner, battle.price);

            await updateUserExperience(winner.toLowerCase(), loser.toLowerCase());

            closeRoom(socket, roomid);

        } else {
            console.log("winner does not exist")
            removeCreatedUserRoom(roomid);
            closeRoom(socket, roomid);
        }
    }catch(e){
        console.log(e);
    }
}

const getAttackDetail = async (type, stakedDamage, user) => {

    try{
        let dRand = Math.floor(Math.random() * spellTypes[type].damage.length);
        let hRand = Math.floor(Math.random() * spellTypes[type].health.length);

        if(type == "bless") {
            let result = await VIPUser.findOne({walletAddress:user.toLowerCase()});

            console.log(result);
            if(result && Object.keys(result).length !== 0) {
                dRand = spellTypes[type].damage.length - 1;
                hRand = spellTypes[type].health.length - 1;
            }
        }

        
        let damage = spellTypes[type].damage[dRand];
        let health = spellTypes[type].health[hRand];
        let bonus  = spellTypes[type].bonus;

        if(bonus >= 0) {
            bonus = stakedDamage | (1<<bonus);
        } else {
            bonus = stakedDamage;
        }

        if(bonus != stakedDamage) damage += bonusDamage[spellTypes[type].bonus];

        return {damage, health, bonus};
    } catch(e) {
        return {damage:0, health:0, bonus:0};
    }
}

export const getUnitHealth = (type) => {
    if(unitTypes[type]) return unitTypes[type].health;
    return 0;
}

export const getUnitDamage = (type) => {
    
    let damage = 0;
    let isBattle = false;

    if(unitTypes[type]) {
        damage = unitTypes[type].attack;
        isBattle = unitTypes[type].isBattle;
    }

    return {damage: damage, isBattle: isBattle, health: 0};
}

export const nextTurn = (currentTurn) => {

    if(currentTurn == "local") return "remote";
    return 'local';
}

export const getDamageFromBit = (bonus) => {

    let damage = 0;

    for (let i = 0; i < bonusDamage.length; i ++) {
        if((1<<i)&bonus) damage += bonusDamage[i];
    }

    return damage;
}

export const closeRoom = (socket, roomid) => {
    socket.broadcast.emit(ROOM_SOCKET.ROOM_STATUS, {roomid: roomid, status: 1});
    socket.leave(roomid);
}

const sendResourceReward = async (resReward, battle) => {

    try{
        await User.findOneAndUpdate({ walletAddress: battle.roomid.toLowerCase() }, { 
            $inc: {resource: resReward},
        }, { new: true, upsert: true });

        await User.findOneAndUpdate({ walletAddress: battle.remoteAddress.toLowerCase() }, { 
            $inc: {resource: resReward},
        }, { new: true, upsert: true });
    } catch(e) {
        console.log("BattleController.js/sendResourceReward function, ", e);
    }
}

const updateUserExperience = async (winner, loser) => {

    try{
        await User.findOneAndUpdate({ walletAddress: winner }, { 
            $inc: {exp: 10},
        }, { new: true, upsert: true });
    
        await User.findOneAndUpdate({ walletAddress: loser, exp: { $gte: 10 } }, { 
            $inc: {exp: -10},
        }, { new: true });
    }
    catch(e) {
        
    }
}