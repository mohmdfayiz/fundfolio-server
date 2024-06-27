import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class Category {

    @Prop({ required: true, ref: 'User' })
    userId: Types.ObjectId

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    icon: string;

    @Prop({ required: true })
    bgColour: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category)