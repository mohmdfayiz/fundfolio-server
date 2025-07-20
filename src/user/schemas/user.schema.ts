import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class User extends Document {

    @Prop({ required: true, trim: true })
    username: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop()
    profilePic: string;

    @Prop()
    currency: string;

    @Prop({ select: false })
    password: string;

    @Prop({ default: false })
    isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);