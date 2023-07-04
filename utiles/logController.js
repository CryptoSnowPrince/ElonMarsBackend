import fs from 'fs';

export const writeLog = (address, title, msg, type) => {
    
    let filename = "./logs/" + address.toLowerCase() + ".txt";

    let time = new Date();
    var logger = fs.createWriteStream(filename, {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });

    logger.write(`[${time}]  [${type}] (${title}) ${msg} \n`);
}

export const writePriceLog = (address, title, type, amount, txId = "") => {
    
    let filename = "./logs/P_" + address.toLowerCase() + ".txt";

    var logger = fs.createWriteStream(filename, {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });

    let time = new Date();

    logger.write(`[${time}] (${title}:${type}) amount: ${amount} \n`);
    if(txId != "") {
        logger.write(`Transaction ID: ${txId} \n`);
    }
}

export const withdrawLog = (address, title, type, amount, txId = "") => {
    
    let filename = "./logs/W_" + address.toLowerCase() + ".txt";

    var logger = fs.createWriteStream(filename, {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });

    let time = new Date();

    logger.write(`[${time}] (${title}:${type}) amount: ${amount} \n`);
    if(txId != "") {
        logger.write(`1 BUSD transaction ID: ${txId} \n`);
    }
}

export const writeSwapLog = (address, title, type, amount) => {
    
    let filename = "./logs/S_" + address.toLowerCase() + ".txt";

    var logger = fs.createWriteStream(filename, {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });

    let time = new Date();

    logger.write(`[${time}] (${title}:${type}) amount: ${amount} \n`);
}

export const pvpLog = (roomid, address, localUnit, remoteUnit, localAbility, remoteAbility, roomPrice, winner) => {
    let filename = "./pvplogs/pvp_" + roomid.toLowerCase() + ".txt";

    var logger = fs.createWriteStream(filename, {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });

    let time = new Date();

    let localAbilityStr = "";
    let remoteAbilityStr = "";

    for (let item of localAbility) localAbilityStr += item+", ";
    for (let item of remoteAbility) remoteAbilityStr += item+", ";


    logger.write(`winner: [${winner}]\n`);
    logger.write(`[${time}]: (${roomPrice} BUSD)  (${roomid} vs ${address}) unit: [${localUnit} vs ${remoteUnit}]  ability: [${localAbilityStr} vs ${remoteAbilityStr}]\n`);

}