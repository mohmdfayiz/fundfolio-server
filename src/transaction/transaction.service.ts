import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction } from './schemas/transaction.schema';
import { Category } from './schemas/category.schema';
import mongoose from 'mongoose';

@Injectable()
export class TransactionService {

    constructor(
        @InjectModel(Transaction.name)
        private transactionModel: mongoose.Model<Transaction>,
        @InjectModel(Category.name)
        private categoryModel: mongoose.Model<Category>
    ) { }

    async get(): Promise<Transaction[]> {
        return await this.transactionModel.find().populate('category', 'bgColour icon name');
    }

    async create(transaction: Transaction): Promise<Transaction> {
        return await this.transactionModel.create(transaction);
    }

    async delete(id: string): Promise<Transaction> {
        return await this.transactionModel.findByIdAndDelete(id);
    }

    async getCategories(): Promise<Category[]> {
        return await this.categoryModel.find();
    }

    async createCategory(category: Category): Promise<Category> {
        return await this.categoryModel.create(category);
    }

    async updateCategory(id: string, category: Category): Promise<Category> {
        return await this.categoryModel.findByIdAndUpdate(id, { $set: category }, { new: true });
    }

}
