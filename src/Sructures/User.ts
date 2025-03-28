import { Schema, model, connect } from 'mongoose';

interface IUser {
    id: string;
    spotifyToken: string;
    refreshToken: string;
    expires_in: number;
    generatedTime: number;
}

const UserSchema = new Schema<IUser>({
    id: { type: String, required: true, unique: true },
    spotifyToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expires_in: { type: Number, required: true },
    generatedTime: { type: Number, required: true }
})


const User = model<IUser>('User', UserSchema)

export { User }