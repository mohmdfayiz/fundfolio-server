import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from "mongoose";

@Schema({ timestamps: { createdAt: false, updatedAt: true } })
export class Transaction extends Document {

    @Prop({ required: true, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true, ref: 'Category' })
    category: Types.ObjectId;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    paymentMethod: string;

    @Prop({ required: true })
    transactionType: string;

    @Prop()
    description: string;

    @Prop({ type: Date, required: true })
    createdAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction)