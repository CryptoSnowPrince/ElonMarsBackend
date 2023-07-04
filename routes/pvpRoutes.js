import express from "express";
const router = express.Router();

import { 
    getRoomList,
} from '../controllers/pvpActions.js';


/* Working with the route. */
router.post('/get_room_list', getRoomList);

export default router;
