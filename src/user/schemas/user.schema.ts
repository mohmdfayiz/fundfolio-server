import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class User extends Document {

    @Prop({ required: true })
    username: string;

    @Prop({ unique: [true, 'Duplicate email entered'] })
    email: string;

    @Prop()
    profilePic: string;

    @Prop({ select: false })
    password: string;

    @Prop({ default: false })
    isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);