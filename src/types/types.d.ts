type signUpReq = {
    username: string,
    password: string
}
type userInfoReq = {
    hash: string;
}
type user = {
    username: string;
    password?: string;
    following: number;
    followersCount: number;
    firstLogin: boolean;
    hash: string;
    _id: string;
}