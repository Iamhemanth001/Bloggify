const {mongoose} = require("mongoose");
const authentication = require("../services/authentication.js");
const {crypto,randomBytes, createHmac} = require('node:crypto');

const userSchema  = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        unique : true,
        required : true
    },
    salt : {
        type : String
    },
    password : {
        type : String,
        required : true
    },
    confirmpassword : {
        type : String,
        required : true
    },
    profile : {
        type : String,
        default : "/images/user_avatar.jpg"
    },
    role : {
        type : String,
        enum : ["USER","ADMIN"],
        default : "USER"
    }
},{timestamps : true});

userSchema.pre("save",function (next){
    const user = this;
    if(!user.isModified("password")) return next();

    const salt = randomBytes(16).toString('hex');
    const hashedPassword = createHmac("sha256",salt).update(user.password).digest("hex");
    
    this.salt  = salt;
    this.password = hashedPassword;
    this.confirmpassword = hashedPassword;
    next();
})

userSchema.static("matchPasswordAndToken",async function(email,password){
    const user =await this.findOne({email});
    if(!user) throw new Error ("User not found");
    const salt = user.salt;
    const hashedPassword = user.password;

    const userProvidedHash = createHmac("sha256",salt)
        .update(password)
        .digest("hex");
    if(hashedPassword !== userProvidedHash)throw new Error ("Incorrect password");
    const token = authentication.createTokenForUser(user);
    return token;
})

const User = mongoose.model("User",userSchema);
module.exports = User;