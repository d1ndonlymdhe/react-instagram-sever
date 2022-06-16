import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    following: {
        type: Number,
        default: 0,
    },
    followerCount: {
        type: Number,
        default: 0,
    },
    firstLogin: {
        type: Boolean,
        default: true
    },
    hash: {
        type: String,
    }
})

const User = mongoose.model("User", userSchema);

export default User;