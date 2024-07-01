import { Types } from "mongoose";

export class CreateTransactionDto {
    category: Types.ObjectId;
    amount: number;
    paymentMethod: string;
    transactionType: string;
    createdAt: Date;
}