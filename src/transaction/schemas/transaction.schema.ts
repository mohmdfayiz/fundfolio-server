import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class Transaction {

    @Prop({ required: true, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true, ref: 'Category' })
    category: Types.ObjectId;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    paymentMethod: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction)