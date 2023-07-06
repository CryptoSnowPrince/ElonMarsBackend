import { encryptData } from "./cryptoHelper.js";


export const sendEvent = (socket, eventName, data = {}) => {
    try {

      const encData = encryptData(data);
      socket.emit(eventName, encData);
    } catch (error) {
      console.error('Socket Send Error : ' + error);
    }
};

export const sendBroadCastEvent = (socket, roomid, eventName, data = {}) => {
    try {
      const encData = encryptData(data);
      socket.broadcast.to(roomid).emit(eventName, encData);
    } catch (error) {
      console.error('Socket BroadCast Error : ' + error);
    }
};

export const sendDataToAllSocket = (socket, roomid, eventName, data = {}) => {
  try {
    const encData = encryptData(data);
    socket.to(roomid).emit(eventName, encData);
  } catch (error) {
    console.error('Socket BroadCast Error : ' + error);
  }
};

export const sendBroadCasetAllEvent = (socket, eventName, data = {}) => {
  
  try {
    const encData = encryptData(data);
    socket.broadcast.emit(eventName, encData);
  } catch (error) {
    console.error('Socket BroadCast Error : ' + error);
  }
}