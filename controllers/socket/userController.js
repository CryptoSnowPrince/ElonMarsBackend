import User from "../../models/userModels.js";

export const addDMHandler = async function (props, callback) {
    const { userId, requestedUserId } = props;
    const socket = this;

    try {
        const user = await User.findById(userId)
            .populate("dms", "name email avatar")
            .populate("archives", "name email avatar");

        const dm = await User.findById(requestedUserId)
            .populate("dms", "name email avatar")
            .populate("archives", "name email avatar");

        if (dm && user) {
            if (!user.dms.some((x) => x._id.toString() === dm._id.toString())) {
                user.dms.push(dm._id);
                await user.save();
            }
            
            if (!dm.dms.some((x) => x._id.toString() === user._id.toString())) {
                dm.dms.push(user._id);
                await dm.save();
            }

            callback({ success: true });

            // const receiver = onlineUsers.get(requestedUserId);

            let receivers = [];
            for (var entry of onlineSupports.entries()) {
                var key = entry[0], value = entry[1];
                console.log("create DMs => ", key + " = " + value);
                receivers.push(value);
            }


            for (let item of receivers) {
                console.log("DM updated to supports", item);
                if (receiver) socket.to(item).emit("DMs:updated");
            }

        } else {
            callback({ error: "User not found!" });
        }
    } catch (error) {
        callback({ error });
    }
};

export const getDMsHandler = async function (props, callback) {
    try {

        const userData = await User.findById(props.userId);
        let user;

        if(userData.permission != "User") {
            user = await User.findById(process.env.SUPPORT_ID).populate(
                "dms",
                "name email avatar"
            );
        } else {
            user = await User.findById(props.userId).populate(
                "dms",
                "name email avatar"
            );
        }

        console.log(user);

        if (user) {

            const dms = user.dms.filter((item)=>item._id!=props.userId);
            callback({ data: dms });
        }
    } catch (error) {
        callback({ error });
    }
};
