import { Types } from "mongoose";

export class CreateTransactionDto {
    category: Types.ObjectId;
    amount: number;
    paymentMethod: string;
    transactionType: string;
    description?: string;
    createdAt: Date;
}

export class UpdateTransactionDto {
    category: Types.ObjectId;
    amount: number;
    paymentMethod: string;
    transactionType: string;
    description?: string;
    createdAt: Date;
}