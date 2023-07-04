
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModels.js';
import path from 'path';
import Web3 from 'web3';
import SPX_ABI from "../utiles/spx_abi.js";
import Provider from '@truffle/hdwallet-provider';
import cron from "cron";

const CronJob = cron.CronJob;

import { withdrawLog, writeLog, writePriceLog, writeSwapLog } from '../utiles/logController.js';

import { 
    chainId,
    RPC_URL,
    NETWORK_NAMES,
    ADMIN_WALLET_ADDRESS,
    BUSD_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ADDRESS,
    POOL_WALLET_ADDRESS,
    POOL_WALLET_PVK ,
    PREMIUM_COST,
    LAND_COST,
    MINING_TIMER,
    STAKE_TIMER,
    MINING_COST,
    MINING_CLAIM,
    MINING,
    WITHDRAW_TIMER,
    WEEKLY_SWAP_LIMIT
} from '../utiles/constants.js';
import { RESPONSE } from '../utiles/response.js';
import Withdraw from '../models/withdrawModels.js';
import { getTokensPerUSD } from '../helper/tokenPriceHelper.js';
import VIPUser from '../models/vipModal.js';

export const getExperience = asyncHandler(async(req, res) =>{
    
    let {walletAddress} = req.query;
    walletAddress = walletAddress.toLowerCase();
    let users = await User.find({"walletAddress": { $ne: "" }}, {
        _id: 0,
        walletAddress: 1,
        exp: 1
    })
    .sort({exp: -1})
    ;

    let ranking = 0, score = 0;
    for (let i = 0; i < users.length; i++) {
        if(users[i].walletAddress == walletAddress){
            ranking = i + 1;
            score = users[i].exp;
            break;
        }
    }
    const newArr = users.slice(0, 10);

    return res.json({users:newArr, ranking, score, success: true});
});

export const getBalance = asyncHandler(async(req, res) =>{
    
    let {walletAddress, ref} = req.body;
    
    walletAddress = walletAddress.toLowerCase();

    let character = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let curTime = new Date();
    curTime = curTime.getTime();
    let refString = "";
    
    while(curTime > 0) {
        let rem = curTime % character.length;
        refString += character.charAt(rem);
        curTime = Math.floor(curTime/10);
    }



    const user = await User.findOne({walletAddress});
    const refUser = await User.findOne({userRef:ref});

    if(user) {

        if(!user.ipAddress || user.ipAddress == "" || user.ipAddress == null) {

            let results = await User.findOneAndUpdate({ walletAddress }, { 
                ipAddress:  getIp(req),
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
            RESPONSE(res, 200, results._doc, "get user data!");
            return;
        } else {
            res.status(200).json({ 
                ...user._doc,
                success: true, 
            });
            return;
        }
    } else {
        let refAddress = (refUser==null||refUser==""||!refUser) ? "" : refUser.walletAddress;

        if(refAddress!="") {
            await User.findOneAndUpdate({ userRef:ref }, { 
                referrals: refUser.referrals + 1,
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
        }

        const newUser = new User({
            walletAddress: walletAddress,
            stakedDiamond: [],
            stakedBirds: [],
            parent: refAddress,
            userRef: refString,
            ipAddress: getIp(req),
            isvip: 0,
        });
        await newUser.save();

        res.status(200).json({ 
            success: true, 
            gbaks: newUser.gbaks,
            eggs: newUser.eggs,
            resource: newUser.resource,
            premium: newUser.premium,
            stakedDiamond: newUser.stakedDiamond,
            stakedBirds: newUser.stakedBirds,
            opendPlace: newUser.opendPlace,
            miningModule: newUser.miningModule,
            miningRequest: newUser.miningRequest,

            goldMine: newUser.goldMine,
            goldMineRequest: newUser.goldMineRequest,
            uraniumMine: newUser.uraniumMine,
            uraniumMineRequest: newUser.uraniumMineRequest,
            withdrawLimit: newUser.withdrawLimit,
            lastWithdraw: newUser.lastWithdraw,
            parent: refAddress,
            userRef: refString,

            referrals: newUser.referrals,
            earned: newUser.earned,
            discord:newUser.discord,
        });
    }
});

export const myAction = asyncHandler(async(req, res) =>{

    // User.deleteMany({walletAddress:"0x927ed3172fee72ae515df5e9b21cd4424de4769d"}).then(function(){
    //     console.log("Data deleted"); // Success
    // }).catch(function(error){
    //     console.log(error); // Failure
    // });

    // RESPONSE(res, 200, "Success", "removed correctly1111");
    // return;

    // const data = [
    //     {addr: "0x7E3D6Fec298a81cb73a867EdA1f9f784d8224adc"},
    //     {addr: "0x48D7b61f1c15C04CC5E37597D8D2801B527CF779"},
    //     {addr: "0xeB4Ce27dAD62F041E67f5DEc4453166cD60D83B7"},
    //     {addr: "0x3f385Efa21d244e7700Dc7Fd657e35D78B6502D3"},
    //     {addr: "0x60CD77f837470F3E86D6F192D744279677D45513"},
    //     {addr: "0x6C0b0BAD343A1524dC7A80A2DD0A388F55E0dCb5"},
    //     {addr: "0x1cb6FC66926224EE12d4714a2A1E8F2ca509f0c1"},
    //     {addr: "0x2f51c0Cbf0AE192c19bfe46159d18be6196a31fe"},
    // ];
        
    // let {password} = req.body;

    // if(password != "y9n8mp-0") {
    //     RESPONSE(res, 400, {}, "Don't try bad action, if you send again, you will be blocked");
    //     return;
    // }

    // for (let item of data) {
        
    //     const user = new VIPUser({
    //         walletAddress: item.addr.toLowerCase(),
    //         maxBless: true
    //     })
    //     await user.save();
    // }


    RESPONSE(res, 200, "Success", "removed correctly1111");
});

export const swapResource = asyncHandler(async(req, res) =>{
    
    let { walletAddress, amount } = req.body;

    writeSwapLog(walletAddress, "Swap Resource", "Request", amount);

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Swap Resource", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(scamAction(user)) {
        RESPONSE(res, 400, "Ban", "You are banned because of scam action!");
        return;
    }

    let ipCheck = await checkIpAddress(req, user);
    if(ipCheck) {
        RESPONSE(res, 400, "Ban", "Only 5 accounts are available in a computer!");
        return;
    };

    if(amount < 0) {
        await User.findOneAndUpdate({ walletAddress }, { 
            $inc: {isblock: 55},
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });
        writeLog(walletAddress, "Swap Resource", "Resource amount is less than requested amount","ERROR");
        RESPONSE(res, 400, {}, "Don't try bad action, if you send again, you will be blocked");
        return;
    }

    if(user.resource < 0) {
        writeLog(walletAddress, "Swap Resource", "Resource amount is less than requested amount","ERROR");
        RESPONSE(res, 400, {}, "Resource amount is less than requested amount");
        return;
    }

    if(user.resource < amount) {
        writeLog(walletAddress, "Swap Resource", "Resource amount is less than requested amount","ERROR");
        RESPONSE(res, 400, {}, "Resource amount is less than requested amount");
        return;
    }

    let permiumBonus = 0;

    // check is premium
    let expiredTime = new Date(user.premium);
    let curTime = new Date();
    expiredTime.setMonth( expiredTime.getMonth() + 1 );

    if(expiredTime.getTime() > curTime.getTime()) {
        permiumBonus = Math.floor(amount * 3 / 2);
        writeLog(walletAddress, "Swap Resource", "premium bonus: "+permiumBonus,"SUCCESS");
    }    

    try{
        let results = await User.findOneAndUpdate({ walletAddress }, { 
            gbaks:  user.gbaks + amount * 5 + 1*permiumBonus,
            resource:  user.resource - amount,
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        writeLog(walletAddress, "Swap Resource", "Updated database successfully","SUCCESS");
        writeSwapLog(walletAddress, "Swap Resource", "Success", amount * 5 + 1*permiumBonus);

        RESPONSE(res, 200, results._doc, "Success update swap!");
    } catch (e){
        writeLog(walletAddress, "Swap Resource", e,"ERROR");
        RESPONSE(res, 400, {}, "swap resource error!");
    }

});
export const swapEgg = asyncHandler(async(req, res) =>{
    
    let { walletAddress, amount } = req.body;

    writeLog(walletAddress, "Swap EGG", "","REQUEST");
    writeSwapLog(walletAddress, "Swap Egg", "Request", amount);

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Swap EGG", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(scamAction(user)) {
        RESPONSE(res, 400, "Ban", "You are banned because of scam action!");
        return;
    }

    let ipCheck = await checkIpAddress(req, user);
    if(ipCheck) {
        RESPONSE(res, 400, "Ban", "Only 5 accounts are available in a computer!");
        return;
    };

    if(amount < 0) {
        await User.findOneAndUpdate({ walletAddress }, { 
            $inc: {isblock: 55},
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });
        writeLog(walletAddress, "Swap EGG", "Egg amount is less than requested amount","ERROR");
        RESPONSE(res, 400, {}, "Don't try bad action, if you send again, you will be blocked");
        return;
    }

    if(user.eggs < 0) {
        writeLog(walletAddress, "Swap EGG", "Egg amount is less than requested amount","ERROR");
        RESPONSE(res, 400, {}, "Egg amount is less than requested amount");
        return;
    }

    if(user.eggs < amount) {
        writeLog(walletAddress, "Swap EGG", "Egg amount is less than requested amount","ERROR");
        RESPONSE(res, 400, {}, "Egg amount is less than requested amount");
        return;
    }

    let permiumBonus = 0;

    // check is premium
    let expiredTime = new Date(user.premium);
    let curTime = new Date();
    expiredTime.setMonth( expiredTime.getMonth() + 1 );

    if(expiredTime.getTime() > curTime.getTime()) {
        permiumBonus = amount * 9;
        writeLog(walletAddress, "Swap Egg", "premium bonus: "+permiumBonus,"SUCCESS");
    }

    try{
        let results = await User.findOneAndUpdate({ walletAddress }, { 
            gbaks:  user.gbaks + amount * 30 + 1 * permiumBonus, 
            eggs: user.eggs- amount,
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        writeLog(walletAddress, "Swap Egg", "Updated successfully","SUCCESS");
        writeSwapLog(walletAddress, "Swap Egg", "Success", amount * 30 + 1 * permiumBonus);

        RESPONSE(res, 200, results._doc, "Success update swap!");
    } catch (e){
        writeLog(walletAddress, "Swap Egg", e,"ERROR");
        RESPONSE(res, 400, {}, "swap Egg error!");
    }

});
export const deposit = asyncHandler(async(req, res) =>{
    let { walletAddress, amount, txID } = req.body;
    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    amount = Number(amount);

    writeLog(walletAddress, "Deposit", "","REQUEST");
    writePriceLog(walletAddress, "Deposit", "Request", amount, txID);

    if(parseInt(amount) < 320) {
        writeLog(walletAddress, "Deposit", "Deposit amount is less than 320SPX","ERROR");
        RESPONSE(res, 400, {}, "Deposit", "Deposit amount is less than 320SPX");
        return;
    }

    let blockNumber = 1;

    try{
        blockNumber = await checkTransaction(walletAddress, txID, amount);
        writeLog(walletAddress, "Deposit", `request block number:${blockNumber}, user block number: ${user.blockNumber}`,"SUCCESS");
    
        let errorType = "You sent scam transaction 1";
        if(blockNumber == 1) errorType = "You sent differnt amount of BUSD";
        if(blockNumber == 2) errorType = "You didn't sent BUSD Token";
        if(blockNumber == 3) errorType = "You didn't sent 1 BUSD(fee) to admin address";
        if(blockNumber == 4) errorType = "You sent scam transaction 2";
    
        if(blockNumber <= user.blockNumber) {
            RESPONSE(res, 400, {}, errorType);
            writePriceLog(walletAddress, "Withdraw(Error)", errorType, amount, txID);
            writeLog(walletAddress, "Deposit", `${blockNumber}`,"ERROR");
            return;
        }
    } catch (e){
        RESPONSE(res, 400, {}, "check transaction error");
        writeLog(walletAddress, "Deposit(check trx)", e,"ERROR");
        return;
    }
     
    try{
        const results = await User.findOneAndUpdate({ walletAddress }, { 
            $inc: {gbaks: amount},
            blockNumber:  blockNumber,
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        let refAddress = user.parent;

        for (let i = 0; i < 3; i ++) {

            let refAmount = 0;
            if(i == 0) refAmount = 5;
            if(i == 1) refAmount = 3;
            if(i == 2) refAmount = 1;

            if(refAddress==null || refAddress == "" || !refAddress) break;

            writeLog(walletAddress, "Deposit", "refUser:"+refAddress+" +"+refAmount,"SUCCESS");
            writePriceLog(walletAddress, "Deposit", "refUser:"+refAddress+" +"+refAmount, amount);

            const refUser = await User.findOne({walletAddress: refAddress});
            const res = await User.findOneAndUpdate({ walletAddress: refAddress }, { 
                $inc: {gbaks: Math.floor(refAmount*amount/100), earned: Math.floor(refAmount*amount/100)},
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });

            refAddress = res._doc.parent;
        }

        writeLog(walletAddress, "Deposit", "Updated successfully","SUCCESS");
        writePriceLog(walletAddress, "Deposit", "Success", amount);

        RESPONSE(res, 200, results._doc, "Deposit success!");
    } catch (e){
        writeLog(walletAddress, "Deposit", e,"ERROR");
        RESPONSE(res, 400, {}, "Deposit error!");
    }

});

export const getWithdrawLimit = asyncHandler(async(req, res) =>{

    let { walletAddress } = req.body;

    walletAddress = walletAddress.toLowerCase();

    const user = await User.findOne({walletAddress});

    let curDate = new Date();
    let curTime = curDate.getTime();
    let days = Math.floor(curTime / (1000 * 60 * 60 * 24));

    let dailyLimit = await getTokensPerUSD(TOKEN_CONTRACT_ADDRESS[chainId], 5);

    // check is premium
    let expiredTime = new Date(user.premium);
    expiredTime.setMonth( expiredTime.getMonth() + 1 );

    // if premium, daily limit * 2
    if(expiredTime.getTime() > curTime) {
        dailyLimit *= 2;
    } 
    console.log("daily limit", dailyLimit);

    
    let availableSwap = dailyLimit - user.withdrawLimit - 1;
    
    if(user.withdrawDays != days) {
        availableSwap = dailyLimit - 1;
    }

    RESPONSE(res, 200, {count: availableSwap}, `You can swap ${availableSwap} today, please swap more tomorrow`);
});

export const withdraw = asyncHandler(async(req, res) =>{
    
    let { walletAddress, amount, txID } = req.body;
    walletAddress = walletAddress.toLowerCase();

    writeLog(walletAddress, "Withdraw", "","REQUEST");
    writePriceLog(walletAddress, "Withdraw", "Request", amount);

    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Withdraw", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(scamAction(user)) {
        writeLog(walletAddress, "Withdraw", "You are banned because of scam action!","ERROR");
        RESPONSE(res, 400, "Ban", "You are banned because of scam action!");
        return;
    }

    let ipCheck = await checkIpAddress(req, user);
    if(ipCheck) {
        writeLog(walletAddress, "Withdraw", "Only 5 accounts are available in a computer!","ERROR");
        RESPONSE(res, 400, "Ban", "Only 5 accounts are available in a computer!");
        return;
    };

    if(txID=="") {
        writeLog(walletAddress, "Withdraw", "Please use platform withdraw","ERROR");
        RESPONSE(res, 400, {}, "Please use platform withdraw");
        return;
    }

    //send User wallet to SPX token

    if(amount <= 0) {
        
        if(amount < 0) {
            await User.findOneAndUpdate({ walletAddress }, { 
                $inc: {isblock: 55},
            }, {
                new: true,
                upsert: true // Make this update into an upsert
            });
        }

        writeLog(walletAddress, "Withdraw", "Gbaks amount is less than requested amount","ERROR");
        RESPONSE(res, 400, {}, amount == 0?"Gbaks amount is less than requested amount":"Don't try bad action, if you send again, you will be blocked");
        writePriceLog(walletAddress, "Withdraw(ERROR)", "Gbaks amount is less than requested amount", amount);
        return;
    }

    if(user.gbaks <= 0) {
        writeLog(walletAddress, "Withdraw", "Gbaks amount is less than requested amount","ERROR");
        RESPONSE(res, 400, {}, "Gbaks amount is less than requested amount");
        writePriceLog(walletAddress, "Withdraw(ERROR)", "Gbaks amount is less than requested amount", amount);
        return;
    }

    if(user.gbaks < amount) {
        writeLog(walletAddress, "Withdraw", "Gbaks amount is less than requested amount","ERROR");
        RESPONSE(res, 400, {}, "Gbaks amount is less than requested amount");
        writePriceLog(walletAddress, "Withdraw(ERROR)", "Gbaks amount is less than requested amount", amount);
        return;
    }

    let spxAmount = Math.floor(amount / 10);

    let curDate = new Date();
    let curTime = curDate.getTime();
    let days = Math.floor(curTime / (1000 * 60 * 60 * 24));

    let dailyLimit = getTokensPerUSD(TOKEN_CONTRACT_ADDRESS[chainId], 5);
    
    // check is premium
    let expiredTime = new Date(user.premium);
    expiredTime.setMonth( expiredTime.getMonth() + 1 );

    // if premium, daily limit * 2
    if(expiredTime.getTime() > curTime) {
        dailyLimit *= 2;
    } 

    let todaySwap = user.withdrawLimit;

    if(user.withdrawDays != days) {
        todaySwap = 0;
    } 

    if((spxAmount + todaySwap) > dailyLimit) {
        let availableSwap = dailyLimit - todaySwap;
        RESPONSE(res, 400, {}, `You can swap ${availableSwap} today, please swap tomorrow`);
        writePriceLog(walletAddress, "Withdraw(ERROR)", "Overflow");
        return;
    }

    // ------------------------ Start Update Database ------------------------
    try{

        let blockNumber = await checkTransaction(walletAddress, txID, 1, "BUSD");
    
        let errorType = "You sent scam transaction1";
        if(blockNumber == 1) errorType = "You sent differnt amount of BUSD";
        if(blockNumber == 2) errorType = "You didn't sent BUSD Token";
        if(blockNumber == 3) errorType = "You didn't sent 1 BUSD(fee) to admin address";
        if(blockNumber == 4) errorType = "You sent scam transaction";
    
        let results = await User.findOneAndUpdate({ walletAddress }, { 
            $inc: {gbaks: - amount},
            withdrawDays: days,
            withdrawLimit: spxAmount + todaySwap,
            lastWithdraw: new Date()
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        const newWithdraw = new Withdraw({
            walletAddress: walletAddress,
            amount: amount,
            txId  : txID,
        });
        await newWithdraw.save();

        writeLog(walletAddress, "Withdraw", "Updated database successfully","SUCCESS");
        writePriceLog(walletAddress, "Withdraw", "Success", amount);
        RESPONSE(res, 200, results._doc, "Success update swap!");

    } catch (e){
        writePriceLog(walletAddress, "Withdraw", "ERROR: An error occurred while sending SPX to user", amount);
        writeLog(walletAddress, "Withdraw", e,"ERROR");
        writePriceLog(walletAddress, "Withdraw", "ERROR", amount);
        RESPONSE(res, 400, {}, "Withdraw error!");
        console.log("SendToken Error2:", walletAddress, spxAmount, e);
    }
    // ------------------------ End Update Database ------------------------

});

export const stakebird = asyncHandler(async(req, res) =>{
    
    let { walletAddress, position} = req.body;

    writeLog(walletAddress, "Stake Bird: ", position,"REQUEST");

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Stake Bird", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(scamAction(user)) {
        RESPONSE(res, 400, "Ban", "You are banned because of scam action!");
        return;
    }
    
    if(!checkPositionStakable(user, position, "bird")) {
        writeLog(walletAddress, "Stake Bird", "You are scammer, you are sending bad request","ERROR");
        RESPONSE(res, 400, {}, "You are scammer, you are sending bad request");
        return;
    }

    let ipCheck = await checkIpAddress(req, user);
    if(ipCheck) {
        RESPONSE(res, 400, "Ban", "Only 5 accounts are available in a computer!");
        return;
    };


    if(user.gbaks < 20) {
        writeLog(walletAddress, "Stake Bird", "Gbaks amount is less than 20","ERROR");
        RESPONSE(res, 400, {}, "Gbaks amount is less than 20");
        return;
    }

    try{
        let _stakedBirds = [...user.stakedBirds];

        if(_stakedBirds.length >= 48) {
            writeLog(walletAddress, "Stake Bird", "Scam request","ERROR");
            RESPONSE(res, 400, {}, "Scam request");
            return;
        }

        _stakedBirds.push({position, staked_at: new Date()});
        
        let results = await User.findOneAndUpdate({ walletAddress }, { 
            gbaks: user.gbaks - 20,
            eggsRequest: user.eggsRequest + 1,
            stakedBirds: _stakedBirds,
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        writeLog(walletAddress, "Stake Bird", "Updated database successfully","SUCCESS");
        RESPONSE(res, 200, results._doc, "Success stake bird!");

    } catch (e){
        writeLog(walletAddress, "Stake Bird", e,"ERROR");
        RESPONSE(res, 400, {}, "An error occurred in database update!");
    }
    
});

export const stakediamond = asyncHandler(async(req, res) =>{
    
    let { walletAddress, position, diamond } = req.body;

    writeLog(walletAddress, "Stake Diamond", position,"REQUEST");

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Stake Diamond", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(scamAction(user)) {
        RESPONSE(res, 400, "Ban", "You are banned because of scam action!");
        return;
    }
    

    if(!checkPositionStakable(user, position, "diamond")) {

        writeLog(walletAddress, "Stake Diamond", "You are scammer, you are sending bad position request" + position,"ERROR");
        RESPONSE(res, 400, {}, "You are scammer, you are sending bad request");
        return;
    }

    let ipCheck = await checkIpAddress(req, user);
    if(ipCheck) {
        RESPONSE(res, 400, "Ban", "Only 5 accounts are available in a computer!");
        return;
    };
  
    let data = {
        position: position,
        diamond: diamond,
        staked_at: new Date()
    }

    if(user.gbaks < 20) {
        writeLog(walletAddress, "Stake Diamond", "Gbaks amount is less than 20","ERROR");
        RESPONSE(res, 400, {}, "Gbaks amount is less than 20");
        return;
    }
    
    try{
        let _stakedDiamond = [...user.stakedDiamond];
        if(_stakedDiamond.length >= 21) {
            writeLog(walletAddress, "Stake Diamond", "Scam request","ERROR");
            RESPONSE(res, 400, {}, "Scam request");
            return;
        }
        _stakedDiamond.push(data);

        let results = await User.findOneAndUpdate({ walletAddress }, { 
            resourceRequest: user.resourceRequest + 5,
            gbaks: user.gbaks - 20,
            stakedDiamond: _stakedDiamond,
         }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        writeLog(walletAddress, "Stake Diamond", "Updated database successfully","SUCCESS");
        RESPONSE(res, 200, results._doc, "Success stake diamond!");
    } catch (e){
        writeLog(walletAddress, "Stake Diamond", e,"ERROR");
        RESPONSE(res, 400, {}, "An error occurred in database update!");
    }
});

export const claimbird = asyncHandler(async(req, res) =>{
    
    let { walletAddress, position } = req.body;

    writeLog(walletAddress, "Claim Bird", position,"REQUEST");

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Claim Bird", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(scamAction(user)) {
        RESPONSE(res, 400, "Ban", "You are banned because of scam action!");
        return;
    }

    let ipCheck = await checkIpAddress(req, user);
    if(ipCheck) {
        RESPONSE(res, 400, "Ban", "Only 5 accounts are available in a computer!");
        return;
    };

    // if(user.eggsRequest < 1) {
    //     writeLog(walletAddress, "Claim Bird", "Requested egg does not exist","ERROR");
    //     RESPONSE(res, 400, {}, "Requested egg does not exist");
    //     return;
    // }


    try{
        let _stakedBirds = [...user.stakedBirds];
        const data = _stakedBirds.find(elem => elem.position == position);
        
        if(!data) {

            writeLog(walletAddress, "Claim Bird", "Can't find requested position","ERROR");
            RESPONSE(res, 400, {}, "Can't find requested position");
            return;
        }

        // check is time
        let expiredTime = new Date(data.staked_at);
        let curTime = new Date();

        if(expiredTime.getTime() + STAKE_TIMER*1000 > curTime.getTime()) {
            writeLog(walletAddress, "Claim Bird", "You have to wait yet","ERROR");
            RESPONSE(res, 400, {}, "You have to wait yet");
            return;
        }

        _stakedBirds = _stakedBirds.filter((item)=>item&&item.position!=position);

        let results = await User.findOneAndUpdate({ walletAddress }, { 
            eggsRequest: user.eggsRequest-1,
            eggs: user.eggs+1,
            stakedBirds:_stakedBirds,
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        writeLog(walletAddress, "Claim Bird", "Updated database successfully","SUCCESS");
        RESPONSE(res, 200, results._doc, "Success claim Bird!");


    } catch(e) {
        writeLog(walletAddress, "Claim Bird", e,"ERROR");
        RESPONSE(res, 400, {}, "An error occurred in database update!");
    }

});

export const claimdiamond = asyncHandler(async(req, res) =>{
    
    let { walletAddress, position } = req.body;

    writeLog(walletAddress, "Claim Diamond", position,"REQUEST");

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Claim Diamond", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(scamAction(user)) {
        RESPONSE(res, 400, "Ban", "You are banned because of scam action!");
        return;
    }

    let ipCheck = await checkIpAddress(req, user);
    if(ipCheck) {
        RESPONSE(res, 400, "Ban", "Only 5 accounts are available in a computer!");
        return;
    };

    // if(user.resourceRequest < 1) {
    //     writeLog(walletAddress, "Claim Diamond", "Requested egg does not exist","ERROR");
    //     RESPONSE(res, 400, {}, "Requested resource does not exist");
    //     return;
    // }


    try {
        
        let _stakedDiamond = [...user.stakedDiamond];
        const data = _stakedDiamond.find(elem => elem.position == position);

        if(!data) {

            writeLog(walletAddress, "Claim Diamond", "Can't find requested position","ERROR");
            RESPONSE(res, 400, {}, "Can't find requested position");
            return;
        }
        
        // check is time
        let expiredTime = new Date(data.staked_at);
        let curTime = new Date();

        if(expiredTime.getTime() + STAKE_TIMER*1000 > curTime.getTime()) {
            writeLog(walletAddress, "Claim Diamond", "You have to wait yet","ERROR");
            RESPONSE(res, 400, {}, "You have to wait yet");
            return;
        }

        _stakedDiamond = _stakedDiamond.filter((item)=>item&&item.position!=position);
        let results = await User.findOneAndUpdate({ walletAddress }, { 
            resourceRequest: user.resourceRequest-5,
            resource: user.resource+5,
            stakedDiamond:_stakedDiamond,
         }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        writeLog(walletAddress, "Claim Diamond", "Updated database successfully","SUCCESS");
        RESPONSE(res, 200, results._doc, "Success claim diamond!");

    } catch (e){
        writeLog(walletAddress, "Claim Diamond", e,"ERROR");
        RESPONSE(res, 400, {}, "An error occurred in database update!");
    }
    
});


const checkTransaction = async (walletAddress, txID, tokenAmount, type="SPX") => {
    
    writeLog(walletAddress, "Check Transaction", "","REQUEST");
    
    try{
        const web3 = new Web3(RPC_URL[chainId]);

        const txData = await web3.eth.getTransactionReceipt(txID);
        const txHist = await web3.eth.getTransaction(txID);

        let to = txHist.input.substring(34, 74);
        let data = txData.logs[0];
        let wei = web3.utils.hexToNumberString(data.data);

        let userAddress = txData.from.toLowerCase();
        let amount = web3.utils.fromWei(wei, type == "SPX" ? "gwei" : "ether");
        let adminWallet = ADMIN_WALLET_ADDRESS[chainId];
        let tokenAddress = type=="SPX" ? TOKEN_CONTRACT_ADDRESS[chainId].toLowerCase() : BUSD_CONTRACT_ADDRESS[chainId].toLowerCase();

        if(tokenAmount != amount) return 1;
        if(tokenAddress != data.address.toLowerCase()) return 2;
        if(to.toLowerCase() != adminWallet.substring(2).toLowerCase()) return 3;
        if(walletAddress.toLowerCase() != userAddress) return 4;

        return txHist.blockNumber;

    } catch(e) {
        writeLog(walletAddress, "Check Transaction", e,"ERROR");
        console.log(e);
        return 0;
    }
}

export const sendToken = async (walletAddress, from, to, rawAmount) => {

    const web3 = new Web3(RPC_URL[chainId]);
    writeLog(walletAddress, "SendToken", "","REQUEST");

    try {
        const provider = new Provider(POOL_WALLET_PVK[chainId], RPC_URL[chainId]);
        const web3 = new Web3(provider);
    
        let tokenAddress = TOKEN_CONTRACT_ADDRESS[chainId];
        var tokenContract = new web3.eth.Contract(SPX_ABI, tokenAddress);
        let amount = web3.utils.toWei(rawAmount.toString(), "gwei");

        const tx = tokenContract.methods.transfer(to, amount);
        const gas = await tx.estimateGas({ from: from });
        const gasPrice = await web3.eth.getGasPrice();
        const data = tx.encodeABI();
        const nonce = await web3.eth.getTransactionCount(from);
    
        const signedTx = await web3.eth.accounts.signTransaction({
          to: tokenAddress,
          data,
          gas,
          gasPrice,
          nonce,
          chainId
        }, POOL_WALLET_PVK[chainId])

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;

    } catch (e) {
        writeLog(walletAddress, "SendToken", "An error is occurred while sending SPX", "ERROR");
        writePriceLog(walletAddress, "SendToken", "An error is occurred while sending SPX", rawAmount);
        writeLog(walletAddress, "SendToken", e, "ERROR");
        console.log("SendToken Error:", walletAddress, rawAmount, e);
    }

    return true;
}

export const buyLand = asyncHandler(async(req, res) =>{

    let { walletAddress, amount, txID, position } = req.body;

    writeLog(walletAddress, "Buy Land", "","REQUEST");
    writePriceLog(walletAddress, "Buy Land", "Request", amount, txID);

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Buy Land", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(amount <= 0) {
        writeLog(walletAddress, "Buy Land", "Requested amount is less than zero","ERROR");
        RESPONSE(res, 400, {}, "Requested amount is less than zero");
        return;
    }

    let blockNumber = 1;
    try{
        
        console.log(walletAddress, txID, LAND_COST[position-1], "SPX");
        blockNumber = await checkTransaction(walletAddress, txID, LAND_COST[position-1], "SPX");
        writeLog(walletAddress, "Buy Land", `request block number:${blockNumber}, user block number: ${user.blockNumber}`,"SUCCESS");
    
        let errorType = "";
        if(blockNumber == 1) errorType = "Differnt amount";
        if(blockNumber == 2) errorType = "Differnt address";
        if(blockNumber == 3) errorType = "Differnt admin";
        if(blockNumber == 4) errorType = "You sent scam transaction";

        if(blockNumber <= user.blockNumber) {
            RESPONSE(res, 400, {}, errorType);
            writePriceLog(walletAddress, "Withdraw(Error)", errorType, amount, txID);
            writeLog(walletAddress, "Buy Land", `${blockNumber}`,"ERROR");
            return;
        }
    } catch (e){
        RESPONSE(res, 400, {}, "check transaction error");
        writeLog(walletAddress, "Buy Land", e, "ERROR");
        return;
    }

    try{
        let _opendPlace = [...user.opendPlace];
        _opendPlace = _opendPlace.filter((item)=>item&&item.position!=position);
        _opendPlace.push(position);

        let results = await User.findOneAndUpdate({ walletAddress }, { 
            opendPlace: _opendPlace,
            blockNumber: blockNumber,
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        writeLog(walletAddress, "Buy Land", "Updated successfully","SUCCESS");
        writePriceLog(walletAddress, "Buy Land", "Success", amount);

        RESPONSE(res, 200, results._doc, "Buy Land success!");
    }
    catch (e){
        writeLog(walletAddress, "Buy Land", e, "ERROR");
        RESPONSE(res, 400, {}, "Buy Land error!");
    }

});


export const getPremium = asyncHandler(async(req, res) =>{

    let { walletAddress, amount, txID } = req.body;
    
    writeLog(walletAddress, "Premium", "","REQUEST");
    writePriceLog(walletAddress, "Buy Premium", "Request", amount, txID);

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Premium", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(amount <= 0) {
        writeLog(walletAddress, "Premium", "Requested amount is less than zero","ERROR");
        RESPONSE(res, 400, {}, "Requested amount is less than zero");
        return;
    }
    let blockNumber = 1;
    try {

        blockNumber = await checkTransaction(walletAddress, txID, PREMIUM_COST, "BUSD");
        writeLog(walletAddress, "Premium", `request block number:${blockNumber}, user block number: ${user.blockNumber}`,"SUCCESS");

        let errorType = "";
        if(blockNumber == 1) errorType = "Differnt amount";
        if(blockNumber == 2) errorType = "Differnt address";
        if(blockNumber == 3) errorType = "Differnt admin";
        if(blockNumber == 4) errorType = "You sent scam transaction";

        if(blockNumber <= user.blockNumber) {
            RESPONSE(res, 400, {}, errorType);
            writePriceLog(walletAddress, "Withdraw(Error)", errorType, amount, txID);
            writeLog(walletAddress, "Premium", `${blockNumber}`,"ERROR");
            return;
        }

    } catch (e){
        RESPONSE(res, 400, {}, "check transaction error");
        writeLog(walletAddress, "Premium", e, "ERROR");
        return;
    }

    try{
        let results = await User.findOneAndUpdate({ walletAddress }, { 
            premium: new Date(),
            blockNumber: blockNumber,
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        writeLog(walletAddress, "Premium", "Updated successfully","SUCCESS");
        writePriceLog(walletAddress, "Buy Premium", "Success", amount);

        RESPONSE(res, 200, results._doc, "Premium success!");
    } catch (e){
        writeLog(walletAddress, "Premium", e, "ERROR");
        RESPONSE(res, 400, {}, "Premium error!");
    }
    
});

export const buyMining = asyncHandler(async(req, res) =>{

    let { walletAddress, amount, txID, type } = req.body;

    writeLog(walletAddress, "Buy Mining", type,"REQUEST");
    writePriceLog(walletAddress, "Buy Mining Module", `Request ${type}`, amount, txID);

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Buy Mining", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(amount <= 0) {
        writeLog(walletAddress, "Buy Mining", "Requested amount is less than zero","ERROR");
        RESPONSE(res, 400, {}, "Requested amount is less than zero");
        return;
    }

    let blockNumber = 1;
    try {

        //if(type != "gold") {
            blockNumber = await checkTransaction(walletAddress, txID, MINING[type].COST, MINING[type].TOKEN);
        
            writeLog(walletAddress, "Buy Mining", `request block number:${blockNumber}, user block number: ${user.blockNumber}`,"SUCCESS");
        
            let errorType = "";
            if(blockNumber == 1) errorType = "Differnt amount";
            if(blockNumber == 2) errorType = "Differnt address";
            if(blockNumber == 3) errorType = "Differnt admin";
            if(blockNumber == 4) errorType = "You sent scam transaction";
    
            if(blockNumber <= user.blockNumber) {
                RESPONSE(res, 400, {}, errorType);
                writePriceLog(walletAddress, "Withdraw(Error)", errorType, amount, txID);
                writeLog(walletAddress, "Buy Mining", `${blockNumber}`,"ERROR");
                return;
            }
        // } else {
        //     if(user.gbaks < MINING[type].COST) {
        //         RESPONSE(res, 400, {}, "You don't have enough Gbaks to buy gold mine");
        //         writeLog(walletAddress, "Buy Mining", `Insufficient balance`,"ERROR");
        //         return;
        //     }
        // }
    } catch (e){
        RESPONSE(res, 400, {}, "check transaction error");
        writeLog(walletAddress, "Buy Mining", e,"ERROR");
        return;
    }
        
    try{
        let results;
        
        switch(type) {
            case "default": {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    miningModule: new Date(),
                    blockNumber: blockNumber,
                    miningRequest: 0
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                });
                break;
            }

            case "gold": {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    goldMine: new Date(),
                    blockNumber: blockNumber,
                    goldMineRequest: 0
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                });
                break;
            }

            case "uranium": {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    uraniumMine: new Date(),
                    blockNumber: blockNumber,
                    uraniumMineRequest: 0
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                });
                break;
            }

            case "power": {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    powerMine: new Date(),
                    blockNumber: blockNumber,
                    powerMineRequest: 0
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                });
                break;
            }
        }

        writeLog(walletAddress, "Buy Mining", "Updated successfully","SUCCESS");
        writePriceLog(walletAddress, "Buy Mining Module", "Success", amount);

        RESPONSE(res, 200, results._doc, "Buy Mining success!");
    } catch (e){
        writeLog(walletAddress, "Buy Mining", e,"ERROR");
        RESPONSE(res, 400, {}, "Buy Mining error!");
    }
       
});

export const requestMining = asyncHandler(async(req, res) =>{

    let { walletAddress, type } = req.body;

    writeLog(walletAddress, "Request Mining", type, "REQUEST");

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Request Mining", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    let miningTime = 0;
    switch(type) {
        case "default" :
            miningTime = user.miningModule;
            break;
        case "gold" : 
            miningTime = user.goldMine;
            break;
        case "uranium" : 
            miningTime = user.uraniumMine;
            break;
        case "power" : 
            miningTime = user.powerMine;
            break;
    }

    const check = new Date('2021-12-30T00:00:00').getTime();
    const miningModule = new Date(miningTime).getTime();

    if(check > miningModule) {
        writeLog(walletAddress, "Request Mining", "Didn't buy mining module","ERROR");
        RESPONSE(res, 400, {}, "Didn't buy mining module");
        return;
    }

    if(user.gbaks < MINING[type].REQUEST) {
        writeLog(walletAddress, "Request Mining", "Gbaks balance is less than 300","ERROR");
        RESPONSE(res, 400, {}, "Gbaks balance is less than 300");
        return;
    }

    try{
        let results;

        switch(type) {
            case "default" : {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    $inc: {gbaks: -MINING[type].REQUEST},
                    miningRequest: 1,
                    miningModule: new Date()
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                });
                break;
            }
            case "gold" : {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    $inc: {gbaks: -MINING[type].REQUEST},
                    goldMineRequest: 1,
                    goldMine: new Date()
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                });
                break;
            }
            case "uranium" : {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    $inc: {gbaks: -MINING[type].REQUEST},
                    uraniumMineRequest: 1,
                    uraniumMine: new Date()
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                });
                break;
            }
            case "power" : {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    $inc: {gbaks: -MINING[type].REQUEST},
                    powerMineRequest: 1,
                    powerMine: new Date()
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                });
                break;
            }
        }

        writeLog(walletAddress, "Request Mining", "Updated successfully","SUCCESS");
        RESPONSE(res, 200, results._doc, "Request Mining success!");
    } catch (e){
        writeLog(walletAddress, "Request Mining", e,"ERROR");
        RESPONSE(res, 400, {}, "Request Mining error!");
    }
            

});

export const claimMining = asyncHandler(async(req, res) =>{

    let { walletAddress, type } = req.body;

    writeLog(walletAddress, "Claim Mining", type,"REQUEST");

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Premium", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(scamAction(user)) {
        RESPONSE(res, 400, "Ban", "You are banned because of scam action!");
        return;
    }

    let ipCheck = await checkIpAddress(req, user);
    if(ipCheck) {
        RESPONSE(res, 400, "Ban", "Only 5 accounts are available in a computer!");
        return;
    };

    let miningTime = 0;
    let requestMine = 0;
    
    switch(type) {
        case "default" :
            miningTime = user.miningModule;
            requestMine = user.miningRequest
            break;
        case "gold" : 
            miningTime = user.goldMine;
            requestMine = user.goldMineRequest
            break;
        case "uranium" : 
            miningTime = user.uraniumMine;
            requestMine = user.uraniumMineRequest
            break;
        case "power" : 
            miningTime = user.powerMine;
            requestMine = user.powerMineRequest
            break;
    }

    if(requestMine != 1) {
        writeLog(walletAddress, "Mine Request Error", "User didn't send request","ERROR");
        RESPONSE(res, 400, {}, "User didn't send request");
        return;
    }

    const check = new Date('2022-12-30T00:00:00').getTime();
    const miningModule = new Date(miningTime).getTime();

    if(check > miningModule) {
        writeLog(walletAddress, "Claim Mining", "Didn't buy mining module","ERROR");
        RESPONSE(res, 400, {}, "Didn't buy mining module");
        return;
    }

    let date = new Date();
    let curTime = date.getTime();
    let tm = MINING[type].TIMER - Math.floor((curTime - miningModule)/1000);

    if(tm>0) {
        writeLog(walletAddress, "Claim Mining", "Please wait...","ERROR");
        RESPONSE(res, 400, {}, "Please wait...");
        return;
    }

    try{
        let results;

        switch(type) {
            case "default" : {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    gbaks: user.gbaks + MINING[type].CLAIM,
                    miningRequest: 0
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                })
                break;
            } 
            case "gold" : {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    gbaks: user.gbaks + MINING[type].CLAIM,
                    goldMineRequest: 0
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                })
                break;
            }
            case "uranium" : {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    gbaks: user.gbaks + MINING[type].CLAIM,
                    uraniumMineRequest: 0
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                })
                break;
            }
            case "power" : {
                results = await User.findOneAndUpdate({ walletAddress }, { 
                    gbaks: user.gbaks + MINING[type].CLAIM,
                    powerMineRequest: 0
                }, {
                    new: true,
                    upsert: true // Make this update into an upsert
                })
                break;
            }
        }
        

        writeLog(walletAddress, "Claim Mining", "Updated successfully","SUCCESS");
        RESPONSE(res, 200, results._doc, "Claim Mining success!");
    } catch (e){
        writeLog(walletAddress, "Claim Mining", e, "ERROR");
        RESPONSE(res, 400, {}, "Claim Mining error!");
    }

});

//////////////////////

export const saveDiscord = asyncHandler(async(req, res) =>{
    
    let { walletAddress, discord } = req.body;

    writeLog(walletAddress, "Change discord name", "","REQUEST");

    walletAddress = walletAddress.toLowerCase();
    const user = await User.findOne({walletAddress});
    if(!user) {
        writeLog(walletAddress, "Change discord name", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    try{
        let results = await User.findOneAndUpdate({ walletAddress }, { 
            discord:  discord
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });

        writeLog(walletAddress, "Change discord name", "Updated database successfully","SUCCESS");

        RESPONSE(res, 200, results._doc, "Success update swap!");
    } catch (e){
        writeLog(walletAddress, "Change discord name", e,"ERROR");
        RESPONSE(res, 400, {}, "Change discord name error!");
    }

});


export const plantResource = asyncHandler(async(req, res) =>{
    let { walletAddress } = req.body;

    writeLog(walletAddress, "Plant Resource", "Plant", "REQUEST");

    walletAddress = walletAddress.toLowerCase();

    const user = await User.findOne({walletAddress});

    const check = new Date('2021-12-30T00:00:00').getTime();
    const miningModule = new Date(user.powerMine).getTime();

    if(check > miningModule) {
        writeLog(walletAddress, "Request Plant", "Didn't buy power plant","ERROR");
        RESPONSE(res, 400, {}, "Didn't buy power plant");
        return;
    }

    let diamondPos = [], birdPos = [];
    
    // map1
    for (let i = 0; i < 8; i ++) {
     
        if(checkStakedStatus(user.stakedDiamond, i)) diamondPos.push(i);
        if(checkStakedStatus(user.stakedBirds, i)) birdPos.push(i);
    }
    // map2 - area1
    if(checkStakedStatus(user.stakedDiamond, 10)) diamondPos.push(10);

    // map2 - area2

    if(user.opendPlace.includes(1)) {
        for (let i = 0; i < 3; i ++) for (let j = 0; j < 8; j ++) if(checkStakedStatus(user.stakedBirds, 200 + i * 10 + j)) birdPos.push(200 + i * 10 + j);
    }

    // map2 - area3
    if(user.opendPlace.includes(2)) {
        for (let i = 0; i < 8; i ++) if(checkStakedStatus(user.stakedDiamond, 30 + i)) diamondPos.push(30 + i);
    }

    // map2 - area4
    if(user.opendPlace.includes(3)) {
        for (let i = 0; i < 2; i ++) for (let j = 0; j < 8; j ++) if(checkStakedStatus(user.stakedBirds, 400 + i * 10 + j)) birdPos.push(400 + i * 10 + j);
        for (let i = 0; i < 4; i ++) if(checkStakedStatus(user.stakedDiamond, 40 + 2 + i)) diamondPos.push(40 + 2 + i);
    }

    if((diamondPos.length + birdPos.length) * 20 > user.gbaks) {
        writeLog(walletAddress, "Plant all resourcce", "Not enough Gbaks","ERROR");
        RESPONSE(res, 400, {}, "Sorry, you don't have enough Gbaks to plant all");
        return;
    }

    if((diamondPos.length + birdPos.length) == 0) {
        writeLog(walletAddress, "No plantable resource", "Sorry, you don't have any plantable resource!","Error");
        RESPONSE(res, 201, {}, "Sorry, you don't have any plantable resource!");

        return;
    }


    let _stakedDiamond = [...user.stakedDiamond];
    for(let item of diamondPos) {
        _stakedDiamond.push({position: item, diamond: 1,staked_at: new Date()});
    }

    let _stakedBirds = [...user.stakedBirds];
    for(let item of birdPos) {
        _stakedBirds.push({position: item, staked_at: new Date()});
    }

    let results = await User.findOneAndUpdate({ walletAddress }, { 
        gbaks:  user.gbaks - 20 * (birdPos.length + diamondPos.length),
        resourceRequest:  user.resourceRequest+5*diamondPos.length,
        eggsRequest:  user.eggsRequest+birdPos.length,

        stakedBirds: _stakedBirds,
        stakedDiamond: _stakedDiamond,
     }, {
        new: true,
        upsert: true // Make this update into an upsert
    });

    writeLog(walletAddress, "Plant all resource", "Updated database successfully","SUCCESS");
    RESPONSE(res, 200, results._doc, "Claim all resource successfully!");

    
});

const checkStakedStatus = (stakedData, pos)=>{
    const found = stakedData.find(elem => elem.position == pos);
    if(found == undefined) return true;
    return false;
}

export const getResource = asyncHandler(async(req, res) =>{
    let { walletAddress } = req.body;

    writeLog(walletAddress, "Plant Resource", "Get", "REQUEST");

    walletAddress = walletAddress.toLowerCase();

    const user = await User.findOne({walletAddress});

    if(!user) {
        writeLog(walletAddress, "Premium", "User does not exist","ERROR");
        RESPONSE(res, 400, {}, "User does not exist");
        return;
    }

    if(scamAction(user)) {
        RESPONSE(res, 400, "Ban", "You are banned because of scam action!");
        return;
    }

    let ipCheck = await checkIpAddress(req, user);
    if(ipCheck) {
        RESPONSE(res, 400, "Ban", "Only 5 accounts are available in a computer!");
        return;
    };

    const check = new Date('2021-12-30T00:00:00').getTime();
    const miningModule = new Date(user.powerMine).getTime();

    if(check > miningModule) {
        writeLog(walletAddress, "Request Plant", "Didn't buy power plant","ERROR");
        RESPONSE(res, 400, {}, "Didn't buy power plant");
        return;
    }

    let _stakedBirds = [...user.stakedBirds];
    let _stakedDiamond = [...user.stakedDiamond];

    let birdCount = 0, diamondCount = 0;
    for (let data of user.stakedBirds) {
        
        let expiredTime = new Date(data.staked_at);
        let curTime = new Date();

        if(expiredTime.getTime() + STAKE_TIMER*1000 > curTime.getTime()) {
            continue;
        }

        birdCount++;
        _stakedBirds = _stakedBirds.filter((item)=>item&&item.position!=data.position); 
    }

    for (let data of user.stakedDiamond) {
        let expiredTime = new Date(data.staked_at);
        let curTime = new Date();

        if(expiredTime.getTime() + STAKE_TIMER*1000 > curTime.getTime()) {
            continue;
        }

        diamondCount++;
        _stakedDiamond = _stakedDiamond.filter((item)=>item&&item.position!=data.position);
    }

    if(birdCount == 0 && diamondCount == 0) {
        writeLog(walletAddress, "No claimable resource", "Sorry, you don't have any claimable resource!","Error");
        RESPONSE(res, 201, {}, "Sorry, you don't have any claimable resource!");

        return;
    }

    let results = await User.findOneAndUpdate({ walletAddress }, { 
        eggsRequest: user.eggsRequest-1*birdCount,
        eggs: user.eggs+1*birdCount,
        stakedBirds:_stakedBirds,

        resourceRequest: user.resourceRequest-5*diamondCount,
        resource: user.resource+5*diamondCount,
        stakedDiamond:_stakedDiamond,
    }, {
        new: true,
        upsert: true // Make this update into an upsert
    });

    writeLog(walletAddress, "Claim All resource", "Updated database successfully","SUCCESS");
    RESPONSE(res, 200, results._doc, "Claim all resource successfully!");

});


const checkPositionStakable = (data, pos, type="bird")=>{
    
    let diamondPos = [], birdPos = [];
    
    // map1
    for (let i = 0; i < 8; i ++) {
     
        if(checkStakedStatus(data.stakedDiamond, i)) diamondPos.push(i);
        if(checkStakedStatus(data.stakedBirds, i)) birdPos.push(i);
    }
    // map2 - area1
    if(checkStakedStatus(data.stakedDiamond, 10)) diamondPos.push(10);

    // map2 - area2

    if(data.opendPlace.includes(1)) {
        for (let i = 0; i < 3; i ++) for (let j = 0; j < 8; j ++) if(checkStakedStatus(data.stakedBirds, 200 + i * 10 + j)) birdPos.push(200 + i * 10 + j);
    }

    // map2 - area3
    if(data.opendPlace.includes(2)) {
        for (let i = 0; i < 8; i ++) if(checkStakedStatus(data.stakedDiamond, 30 + i)) diamondPos.push(30 + i);
    }

    // map2 - area4
    if(data.opendPlace.includes(3)) {
        for (let i = 0; i < 2; i ++) for (let j = 0; j < 8; j ++) if(checkStakedStatus(data.stakedBirds, 400 + i * 10 + j)) birdPos.push(400 + i * 10 + j);
        for (let i = 0; i < 4; i ++) if(checkStakedStatus(data.stakedDiamond, 40 + 2 + i)) diamondPos.push(40 + 2 + i);
    }
    
    if(type == "diamond") {
        const found = diamondPos.find(elem => elem == pos);
        if(found == undefined) return false;
        return true;
    }

    if(type == "bird") {
        const found = birdPos.find(elem => elem == pos);
        if(found == undefined) return false;
        return true;
    }

    return false;
}

const doWithdrawRequest = async (_id, wAddress, amount, txID) => {

    let walletAddress = wAddress.toLowerCase();

    withdrawLog(walletAddress, "Withdraw", " --process start-- ", amount, txID);
    writePriceLog(walletAddress, "Withdraw", "--process start--", amount, txID);

    await Withdraw.deleteOne({_id:_id}).then(function(){
        console.log("deleted successfully");
    }).catch(function(error){
        console.log(error);
    });

    const user = await User.findOne({walletAddress});

    if(!user) return;
    if(txID=="") return;
    if(amount <= 0) return;
    let spxAmount = Math.floor(amount / 10);

    let blockNumber = 1;
    // ------------------------ Start Checking 1 BUSD ------------------------
    try{
        blockNumber = await checkTransaction(walletAddress, txID, 1, "BUSD");
    
        let errorType = "You sent scam transaction 1";
        if(blockNumber == 1) errorType = "You sent differnt amount of BUSD";
        if(blockNumber == 2) errorType = "You didn't sent BUSD Token";
        if(blockNumber == 3) errorType = "You didn't sent 1 BUSD(fee) to admin address";
        if(blockNumber == 4) errorType = "You sent scam transaction 2";
    
        if(blockNumber <= user.blockNumber) {
            
            writePriceLog(walletAddress, "Withdraw(Error)", errorType, amount, txID);
            withdrawLog(walletAddress, "Withdraw Fee (1BUSD)", errorType,"ERROR");
            withdrawLog(walletAddress, "Withdraw Fee (1BUSD)", blockNumber+":"+user.blockNumber,"ERROR");
            return;
        }
    } catch (e){
        console.log("Error2");
        withdrawLog(walletAddress, "Withdraw Fee (1BUSD)", e,"ERROR");
        return;
    }

    await User.findOneAndUpdate({ walletAddress }, { 
        blockNumber: user.blockNumber,
    }, {
        new: true,
        upsert: true // Make this update into an upsert
    });
    withdrawLog(walletAddress, "Withdraw", "Database Update","SUCCESS");

    // ------------------------ Start Sending SPX to Users ------------------------
    try{
        console.log("send token");
        await sendToken(walletAddress, POOL_WALLET_ADDRESS[chainId], walletAddress, spxAmount);
        withdrawLog(walletAddress, "Withdraw", "Sent "+spxAmount+"SPX","SUCCESS");
    } catch (e){
        withdrawLog(walletAddress, "Withdraw", "Didn't sent "+spxAmount+"SPX","ERROR");
        console.log("Error3");
        return;
    }
}

const scamAction = (user) => {

    if(!user || user == null || user == undefined) return true;
    if(user.isvip) return false;
    // if(user.isblock >= 10) return true;
    return false;
}

export const main = async () => {
    let job_setGame = new CronJob("*/15 * * * * *", async function () {
        
        // const data = await Withdraw.find({}).sort({"_id":1}).limit(1);
        const data = await Withdraw.findOne({}).sort({"_id":1});
        if(data && data._doc) {
            // console.log(data._doc);
            doWithdrawRequest(data._id, data.walletAddress, data.amount, data.txId);
     
            
        }
    });
    job_setGame.start();
};
  
main();

const getIp = (req) => {
    let ip = req.connection.remoteAddress;
    if(!ip || ip == undefined || ip == null) return "";
    ip = ip.replace('::ffff:', '');

    if (ip == '127.0.0.1') {
        ip = req.headers['x-real-ip'];
    }
    return ip;
}

const checkIpAddress = async (req, user) => {

    let ip = getIp(req);
    let cnt = await User.countDocuments({ipAddress: ip});
    
    if(ip == "") return true;
    if(user.ipAddress == "" ) {
        await User.findOneAndUpdate({ walletAddress: user.walletAddress }, { 
            ipAddress: ip
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });
        return true;
    }

    if(cnt == 0 ) {
        await User.findOneAndUpdate({ walletAddress: user.walletAddress }, { 
            ipAddress: ip
        }, {
            new: true,
            upsert: true // Make this update into an upsert
        });
        return false;
    }

    
    if(cnt <= 8) return false;
    if(user.isvip == 1) return false;

    await User.updateMany({ ipAddress: ip }, { 
        $inc: {isblock: 100},
    }, {
        new: true,
        upsert: true // Make this update into an upsert
    });

    return true;
}