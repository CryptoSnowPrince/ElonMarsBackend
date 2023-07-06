import User from "../../models/userModels.js";

export const handleMessage = async function (payload, callback) {
    const socket = this;
    const {
        from,
        message,
        type,
        to,
        senderSocketId,
        date,
        senderName,
    } = payload;
    let newMessage;
    let newUserData = null;
    try {

        const user = await User.findById(from);
        if(user.status!="active") {
            return callback({ error: "User blocked!" });
        }

        const userData = await Message.findOne({user:to});

        if(userData) {
            userData.messageList.push({
                from: from,
                to: to,
                message: message,
                type: type,
                senderName: senderName,
            });
            userData.isnew = from == to ? true : false;
            userData.save();
        } else {
            newUserData = await User.findById(to).select('-password -role -verify');
            console.log("----------New User Data------------");
            console.log(newUserData);
            newMessage.save();
        }

    } catch (error) {
        console.info(error);
        return callback({ error: "Database error!" });
    }

    callback({ data: {
        from: from,
        to: to,
        message: message,
        type: type,
        senderName: senderName,
    } });

    let receivers = [];

    let userSocket = onlineUsers.get(to);
    if(userSocket) {
        receivers.push(userSocket);
    }
    
    for (var entry of onlineSupports.entries()) {
        var key = entry[0], value = entry[1];
        receivers.push(value);
    }

    if(receivers.length > 0) {
        for(let item of receivers) {
            console.log("send to receiver " + item);
            socket.to(item).emit("message:created", {
                from: from,
                to: to,
                message: message,
                type: type,
                senderName: senderName,
                date: date,
                roomId: to,
                newUser: newUserData,
            });
        }
    }

    return;
};