import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import User from "./User";
import cookieParser from "cookie-parser";
import sum from "hash-sum";
import fileUpload, { UploadedFile } from "express-fileupload";
import fs from "fs";
import { ApolloServer, gql } from 'apollo-server-express';
// import User from "./Schema";
mongoose.connect("mongodb://127.0.0.1:27017/instagram")

const typeDefs = gql`
type Query {
    userFromUsername(username: String!): User,
    userFromHash(hash: String!): User,
}
type User {
    username: String,
    password: String,
    hash:String,
    bio:String,
    following: Int,
    followersCount: Int,
    firstLogin: Boolean,
    _id: String,
}
`


const resolvers = {
    Query: {
        //@ts-ignore
        async userFromUsername(obj, args, context, info) {
            const username = args.username;
            console.log(username);
            const user = await findUser(username);
            return user;
        },
        //@ts-ignore
        async userFromHash(obj, args, context, info) {
            const hash = args.hash;
            const user = await findUser(undefined, hash);
            return user;
        }
    }
}
const app = express();
const server = new ApolloServer({ typeDefs, resolvers });
server.start().then(res => {
    server.applyMiddleware({ app });
    app.listen(PORT, () => {
        console.log("listening on port " + PORT);
    })
})
const PORT = process.env.port || 4000;
app.use(bodyParser.json());
app.use(cookieParser());
app.use(fileUpload());
const whiteList = ["http://localhost:3000", "http://127.0.0.1:300", "http://192.168.100.65:3000", "http://localhost:4000", "*"];
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


type messageType = {
    text: string;
    hash?: any;
}
app.post("/userInfo", (req, res) => {
    const { hash } = <userInfoReq>req.body;
    findUser(undefined, hash).then((user) => {
        if (user !== null && user !== undefined) {
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
            newUser(username, password).then(user => {
                fs.mkdir(`./files/${user._id}`, (err) => {
                    console.log(err);
                });
            })

        } else {
            status = "error";
            message = {
                text: "Username Taken"
            }
        }
        res.send(JSON.stringify({ status, message }));
    })
})

app.post("/setProfile", (req, res) => {
    if (req.files) {
        // const fileStream = fs.createWriteStream()
        const { hash, bio } = req.body;
        const picture = <UploadedFile>req.files?.profilePicture
        // const pictureName = picture.name;
        const pictureBuffer = picture.data;
        findUser(undefined, hash).then(user => {
            if (user) {
                const id = user._id;
                const filePath = `./files/${id}/profilePicture.${getExtension(picture.name)}`;
                fs.writeFile(filePath, pictureBuffer, (err) => {
                    if (err) {
                        console.log(err);
                    }
                })
                updateUser(user.username, { bio: bio })
                res.send("ok")
            }
        })
        console.log(picture);
    }
})

async function newUser(username: string, password: string) {
    const user = new User({ username: username, password: password });
    await user.save();
    return user;
}

type updateUserOptionsType = {
    following?: number;
    followersCount?: number;
    password?: string;
    newUsername?: string;
    hash?: string;
    bio?: string;
}

async function updateUser(username: string, options: updateUserOptionsType) {
    const { following, followersCount, password, newUsername, hash, bio } = options
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
    if (bio !== undefined) {
        user.bio = bio;
    }
    await user.save()

}

async function findUser(username?: string, hash?: string) {
    // console.log(username)
    if (username !== undefined) {
        const user = await User.findOne({ username: username }) as user;
        return user;
    } else if (hash !== undefined) {
        const user = await User.findOne({ hash: hash }) as user;
        return user;
    }
}
function getExtension(fileName: string) {
    const splits = fileName.split(".");
    return splits[splits.length - 1]
}
