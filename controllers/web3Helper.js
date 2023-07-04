import Web3 from 'web3';
import SPX_ABI from "../utiles/spx_abi.js";
import Provider from '@truffle/hdwallet-provider';
import contract from '@truffle/contract';

import PVP_CONTRACT_ABI from "../utiles/pvp_abi.js"
import { pvpLog, withdrawLog, writeLog, writePriceLog, writeSwapLog } from '../utiles/logController.js';

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
    WEEKLY_SWAP_LIMIT,
    PVP_CONTRACT_ADDRESS
} from '../utiles/constants.js';
import { RESPONSE } from '../utiles/response.js';
import Withdraw from '../models/withdrawModels.js';

export const sendPvpReward = async (roomid, winner, rawAmount) => {

    let from = POOL_WALLET_ADDRESS[chainId];

    try {
        const provider = new Provider(POOL_WALLET_PVK[chainId], RPC_URL[chainId]);
        const web3 = new Web3(provider);
    
        var pvpContract = new web3.eth.Contract(PVP_CONTRACT_ABI, PVP_CONTRACT_ADDRESS[chainId]);

        let result = await pvpContract.methods.getRoomDetail(roomid).call();
        if(!result || result.price == 0) {
            pvpLog(roomid, winner, "", "", [], [], null, "sendPvpReward");
            return;
        }

        const tx = pvpContract.methods.sendReward(winner, roomid);

        const gas = await tx.estimateGas({ from: from });
        const gasPrice = await web3.eth.getGasPrice();
        const data = tx.encodeABI();
        const nonce = await web3.eth.getTransactionCount(from);
    
        const signedTx = await web3.eth.accounts.signTransaction({
          to: PVP_CONTRACT_ADDRESS[chainId],
          data,
          gas,
          gasPrice,
          nonce,
          chainId
        }, POOL_WALLET_PVK[chainId])

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;

    } catch (e) {
        console.log("SendToken Error:", rawAmount, e);
    }

    return true;
}

export const removeCreatedUserRoom = async (roomid) => {

    let from = POOL_WALLET_ADDRESS[chainId];

    try {
        const provider = new Provider(POOL_WALLET_PVK[chainId], "https://boldest-thrilling-seed.bsc.discover.quiknode.pro/e6aa175b1a36eaf4aa2a06bd3c2f42900569b2e6/");
        const web3 = new Web3(provider);
    
        var pvpContract = new web3.eth.Contract(PVP_CONTRACT_ABI, PVP_CONTRACT_ADDRESS[chainId]);

        let result = await pvpContract.methods.getRoomDetail(roomid).call();
        console.log("remove created room", result);
        if(!result || result.price == 0) {
            pvpLog(roomid, null, "", "", [], [], null, "removeCreatedUserRoom");
            
            return;
        }
        // let is_exist = false;

        // result.forEach(roomData => {
        //     console.log(roomData, roomid);
        //     if(roomData.roomid == roomid) is_exist = true;
        // });

        // if(!is_exist) {
        //     console.log("room does not exist");
        //     return;
        // }

        const tx = pvpContract.methods.removeLeftRoom(roomid);

        const gas = await tx.estimateGas({ from: from });
        const gasPrice = await web3.eth.getGasPrice();
        const data = tx.encodeABI();
        const nonce = await web3.eth.getTransactionCount(from);
    
        const signedTx = await web3.eth.accounts.signTransaction({
          to: PVP_CONTRACT_ADDRESS[chainId],
          data,
          gas,
          gasPrice,
          nonce,
          chainId
        }, POOL_WALLET_PVK[chainId])

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;

    } catch (e) {
        console.log("SendToken Error:", e);
    }

    return true;
}

export const checkRoomCreatedTransaction = async (wallet, price, eventName) => {

    try{
        const web3 = new Web3("https://boldest-thrilling-seed.bsc.discover.quiknode.pro/e6aa175b1a36eaf4aa2a06bd3c2f42900569b2e6/");
        
        console.log(RPC_URL[chainId]);
        const contract = new web3.eth.Contract(PVP_CONTRACT_ABI,  PVP_CONTRACT_ADDRESS[chainId]);

        const latestBlockNumber = await web3.eth.getBlockNumber();
        const fromBlock = latestBlockNumber - 10;

        const events = await contract.getPastEvents(eventName, {
            fromBlock: fromBlock,
            toBlock: "latest"
        });

        let flg = false;

        console.log(events);

        events.forEach(event => {
            const eventData = event.returnValues;
            console.log("Event data:", eventData.user, eventData.enterValue);

            if(eventData.user.toLowerCase() == wallet.toLowerCase() && eventData.enterValue == price) flg = true;
        });

        return flg;
    } catch(e) {
        console.log("checkRoomCreatedTransaction", e);
        return false;
    }

}