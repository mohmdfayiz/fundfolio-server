import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction } from './schemas/transaction.schema';
import { Category } from './schemas/category.schema';
import mongoose, { Types } from 'mongoose';
import { CreateCategoryDto } from './dto/category.dto';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionService {

    constructor(
        @InjectModel(Transaction.name)
        private transactionModel: mongoose.Model<Transaction>,
        @InjectModel(Category.name)
        private categoryModel: mongoose.Model<Category>
    ) { }

    async getTransactionsGroup(userId: string): Promise<Transaction[]> {

        // Get first day of current month
        const currentDate = new Date();

        // Calculate first day of 3 months ago
        const threeMonthsAgo = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 2,
            1
        );

        const transactions = await this.transactionModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    createdAt: { $gte: threeMonthsAgo },
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    updatedAt: 0,
                    userId: 0,
                    __v: 0,
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [
                        { $project: { _id: 1, name: 1, icon: 1, bgColour: 1 } }
                    ]
                }
            },
            { $unwind: '$category' },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    totalAmount: { $sum: '$amount' },
                    data: { $push: '$$ROOT' },
                },
            },
            {
                $sort: { '_id.year': -1, '_id.month': -1 },
            },
        ])

        return transactions
    }

    async getRecentTransactions(userId: string): Promise<Transaction[]> {
        return await this.transactionModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(10).populate('category', 'name icon bgColour');
    }

    async getBalance(userId: string): Promise<any> {
        const balance = await this.transactionModel.aggregate([
            { $match: { userId: new Types.ObjectId(userId) } },
            { $group: { _id: null, income: { $sum: { $cond: [{ $eq: ["$transactionType", "Income"] }, "$amount", 0] } }, expense: { $sum: { $cond: [{ $eq: ["$transactionType", "Expense"] }, "$amount", 0] } } } },
        ])
        return { income: balance[0]?.income, expense: balance[0]?.expense, balance: balance[0]?.income + balance[0]?.expense }
    }

    async getStats(userId: string, month: number, year: number): Promise<any> {
        const stats = await this.transactionModel.aggregate([
            { $match: { userId: new Types.ObjectId(userId) } },
            { $match: { $expr: { $eq: [{ $month: "$createdAt" }, month] } } },
            { $match: { $expr: { $eq: [{ $year: "$createdAt" }, year] } } },
            { $group: { _id: null, totalAmount: { $sum: "$amount" }, income: { $sum: { $cond: [{ $eq: ["$transactionType", "Income"] }, "$amount", 0] } }, expense: { $sum: { $cond: [{ $eq: ["$transactionType", "Expense"] }, "$amount", 0] } } } },
        ])

        return stats[0]
    }

    async getTransactionsByMonth(userId: string, month: number, year: number) {
        const transactions = await this.transactionModel.aggregate([
            { $match: { userId: new Types.ObjectId(userId) } },
            { $match: { $expr: { $eq: [{ $month: "$createdAt" }, month] } } },
            { $match: { $expr: { $eq: [{ $year: "$createdAt" }, year] } } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [
                        { $project: { _id: 1, name: 1, icon: 1, bgColour: 1 } }
                    ]
                }
            },
            { $unwind: '$category' },
            { $sort: { createdAt: -1 } },
        ])

        return { transactions };
    }

    async create(userId: string, transaction: CreateTransactionDto): Promise<Transaction> {
        return await this.transactionModel.create({
            userId: new Types.ObjectId(userId),
            category: new Types.ObjectId(transaction.category),
            amount: transaction.transactionType === 'Income' ? transaction.amount : -transaction.amount,
            paymentMethod: transaction.paymentMethod,
            transactionType: transaction.transactionType,
            description: transaction?.description,
            createdAt: transaction.createdAt
        });
    }

    async updateTransaction(transactionId: string, transaction: UpdateTransactionDto): Promise<Transaction> {
        return await this.transactionModel.findOneAndUpdate(
            { _id: new Types.ObjectId(transactionId) },
            {
                $set: {
                    category: new Types.ObjectId(transaction.category),
                    amount: transaction.transactionType === 'Income' ? transaction.amount : -transaction.amount,
                    paymentMethod: transaction.paymentMethod,
                    transactionType: transaction.transactionType,
                    description: transaction?.description,
                    createdAt: new Date(transaction.createdAt)
                }
            },
            { new: true }
        );
    }

    async delete(ids: string[]) {
        return await this.transactionModel.deleteMany({
            _id: { $in: ids.map(id => new Types.ObjectId(id)) }
        });
    }

    async getCategories(userId: string): Promise<Category[]> {
        return await this.categoryModel.find({ userId: new Types.ObjectId(userId) }).sort({ name: 1 });
    }

    async createCategory(userId: string, category: CreateCategoryDto): Promise<Category> {
        const existingCategory = await this.categoryModel.exists({ userId: new Types.ObjectId(userId), name: category.name.trim() });
        if (existingCategory) throw new ForbiddenException('Category already exists');
        return await this.categoryModel.create({ userId: new Types.ObjectId(userId), ...category, name: category.name.trim() });
    }

    async updateCategory(id: string, category: Category): Promise<Category> {
        const existingCategory = await this.categoryModel.exists({ _id: { $ne: new Types.ObjectId(id) }, userId: new Types.ObjectId(category.userId), name: category.name.trim() });
        if (existingCategory) throw new ForbiddenException('Category already exists');
        return await this.categoryModel.findByIdAndUpdate(new Types.ObjectId(id), { $set: { ...category, userId: new Types.ObjectId(category.userId) } }, { new: true });
    }

    async deleteCategory(id: string): Promise<Category> {
        const transactionWithCategory = await this.transactionModel.findOne({ category: new Types.ObjectId(id) });
        if (transactionWithCategory) {
            throw new ForbiddenException('Cannot delete category with transactions');
        }
        return await this.categoryModel.findByIdAndDelete(new Types.ObjectId(id));
    }

    async deleteCategoriesAndTransactions(userId: string) {
        await this.categoryModel.deleteMany({ userId: new Types.ObjectId(userId) });
        await this.transactionModel.deleteMany({ userId: new Types.ObjectId(userId) });
        return { message: 'Categories and transactions deleted successfully' };
    }

}
