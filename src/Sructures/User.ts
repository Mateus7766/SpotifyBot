import { Schema, model, connect } from 'mongoose';

interface IUser {
    id: string;
    spotifyToken: string;
}

const UserSchema = new Schema<IUser>({
    id: { type: String, required: true, unique: true },
    spotifyToken: { type: String, required: true }
})


const User = model<IUser>('User', UserSchema)

export { User }