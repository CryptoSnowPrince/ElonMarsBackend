import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModels.js';

export const auth = asyncHandler(async( req, res, next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try {
            //getting the token............................
            token = req.headers.authorization.split(' ')[1];

            //Verifying the token ........................
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            //get admin or user from the token....................
            req.user = await User.findOne(decoded.email);
        next();
        } catch (error) {
            console.log(error);
            res.status(401);
            throw new Error("Not Authorized  !");
        };
    }

    if(!token){
        res.status(401)
        throw new Error("Not Authorized, No token !");
    };

});


//user authentication.........................
export const authUser = asyncHandler(async( req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try {
            //getting the token............................
            token = req.headers.authorization.split(' ')[1];
            
            //Verifying the token ........................
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            //get admin or user from the token....................
            req.user = await User.findById(decoded.id).select('-password');
            
            if(req.user.status == "blocked") {
                res.status(401);
                throw new Error("You are blocked from Admin!");                
            }
            else {
                next();
            }
        } catch (error) {
            console.log(error);
            res.status(401);
            throw new Error("Not Authorized  !");
        };
    }

    if(!token){
        res.status(401)
        throw new Error("Not Authorized, No token !");
    };

});

//user authentication.........................
export const authSupport = asyncHandler(async( req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try {
            //getting the token............................
            token = req.headers.authorization.split(' ')[1];
            
            //Verifying the token ........................
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            //get admin or user from the token....................
            req.user = await User.findById(decoded.id).select('-password');
            if(req.user.role > 0) {
                next();
            }
            else {
                res.status(401);
                throw new Error("Not Support Authorized  !");
            }
        } catch (error) {
            console.log(error);
            res.status(401);
            throw new Error("Not Authorized  !");
        };
    }

    if(!token){
        res.status(401)
        throw new Error("Not Authorized, No token !");
    };
});

export const authAdmin = asyncHandler(async( req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try {
            //getting the token............................
            token = req.headers.authorization.split(' ')[1];
            
            //Verifying the token ........................
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            //get admin or user from the token....................
            req.user = await User.findById(decoded.id).select('-password');
            if(req.user.role == 1) {
                next();
            }
            else {
                res.status(401);
                throw new Error("Not Admin Authorized  !");
            }
        } catch (error) {
            console.log(error);
            res.status(401);
            throw new Error("Not Authorized  !");
        };
    }

    if(!token){
        res.status(401)
        throw new Error("Not Authorized, No token !");
    };
});

