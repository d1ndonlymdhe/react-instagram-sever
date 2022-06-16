import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import User from "./User";
import cookieParser from "cookie-parser";
import sum from "hash-sum";
mongoose.connect("mongodb://127.0.0.1:27017/instagram")
const app = express();
const PORT = process.env.port || 4000;
app.use(bodyParser.json());
app.use(cookieParser());
const whiteList = ["http://localhost:3000", "http://127.0.0.1:300", "http://192.168.0.65:3000"];
const corsOptions = {
    credentials: true,
    origin: function (origin: any, callback: any) {
        if (whiteList.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}
app.use(cors(corsOptions))
app.listen(PORT, () => {
    console.log("listening on port " + PORT);
})

type messageType = {
    text: string;
    hash?: any;
}
app.post("/userInfo", (req, res) => {
    const { hash } = <userInfoReq>req.body;
    findUser(undefined, hash).then((user: user) => {
        if (user !== null) {
            res.send(JSON.stringify({
                status: "ok",
                message: {
                    username: user.username,
                    following: user.following,
                    followersCount: user.followersCount,
                    firstLogin: user.firstLogin
                }
            }))
        } else {
            res.send(JSON.stringify({
                status: "error",
                message: {
                    text: "No such user"
                }
            }))
        }
    })

})
app.post("/login", (req, res) => {
    const { username, password } = <signUpReq>req.body;
    let status = "error";
    let message: messageType = {
        text: "unknown error"
    }
    findUser(username).then(user => {
        console.log(user);
        if (user == null) {
            message = {
                text: "Incorrect Username"
            }
        } else {
            if (user.password === password) {
                status = "ok";
                const uniqueHash = sum(user._id);
                message = {
                    text: "ok",
                    hash: uniqueHash,
                }
                updateUser(username, { hash: uniqueHash })
                res.send(JSON.stringify({ status, message }));
                return;

            } else {
                message = {
                    text: "Incorrect Username"
                }
                res.send(JSON.stringify({ status, message }));
                return;
            }
        }
        res.send(JSON.stringify({ status, message }));
        return;
    })
})
app.post("/signup", (req, res) => {
    const { username, password } = <signUpReq>req.body;
    let status = "error";
    let message: messageType = {
        text: "Unknown error occured"
    }
    findUser(username).then(user => {
        console.log(user);
        if (user == null) {
            status = "ok";
            message = {
                text: "ok"
            }
            newUser(username, password)
        } else {
            status = "error";
            message = {
                text: "Username Taken"
            }
        }
        res.send(JSON.stringify({ status, message }));
    })
})
async function newUser(username: string, password: string) {
    const user = new User({ username: username, password: password });
    await user.save();
}
type updateUserOptionsType = {
    following?: number, followersCount?: number, password?: string, newUsername?: string, hash?: string
}
async function updateUser(username: string, options: updateUserOptionsType) {
    const { following, followersCount, password, newUsername, hash } = options
    const user = await User.findOne({ username: username });
    if (following !== undefined) {
        user.following = following;
    }
    if (followersCount !== undefined) {
        user.followersCount = followersCount;
    }
    if (password !== undefined) {
        user.password = password;
    }
    if (newUsername !== undefined) {
        user.username = newUsername;
    }
    if (hash !== undefined) {
        user.hash = hash;
    }
    await user.save()

}
async function findUser(username?: string, hash?: string) {
    if (username !== undefined) {
        const user = await User.findOne({ username: username });
        return user;
    } else if (hash !== undefined) {
        const user = await User.findOne({ hash: hash });
        return user;
    }

}