import express from "express";
const router = express.Router();

import { authUser } from '../middleWare/authorization.js';

import { 
    getBalance,
    swapResource, 
    swapEgg, 
    deposit,
    withdraw,

    stakebird,
    stakediamond,
    claimbird,
    claimdiamond,

    getPremium,
    buyLand,

    buyMining,
    claimMining,
    requestMining,
    saveDiscord,

    myAction,

    plantResource,
    getResource,

    getWithdrawLimit,

    getExperience

} from '../controllers/userActions.js';


/* Working with the route. */
router.post('/', getBalance);
router.post('/swap/resource', swapResource);
router.post('/swap/egg', swapEgg);
router.post('/myaction', myAction);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);

router.post('/stake/bird', stakebird);
router.post('/stake/diamond', stakediamond);

router.post('/claim/bird', claimbird);
router.post('/claim/diamond', claimdiamond);

router.post('/buypremium', getPremium);
router.post('/buymap', buyLand);
router.post('/buymining', buyMining);
router.post('/requestmining', requestMining);
router.post('/claimmining', claimMining);

router.post('/plant/set', plantResource);
router.post('/plant/get', getResource);

router.post('/discord', saveDiscord);

router.post('/withdraw-limit', getWithdrawLimit);

router.get('/exp', getExperience);

export default router;
