import { connect } from 'mongoose';


connect(process.env.MONGODB_URI as string).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error(err);
});