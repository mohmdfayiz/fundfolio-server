import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction } from './schemas/transaction.schema';
import { User } from 'src/user/schemas/user.schema';
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
        private categoryModel: mongoose.Model<Category>,
        @InjectModel(User.name)
        private userModel: mongoose.Model<User>
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
        return {
            income: parseFloat(balance[0]?.income.toFixed(2)),
            expense: parseFloat(balance[0]?.expense.toFixed(2)),
            balance: parseFloat((balance[0]?.income + balance[0]?.expense).toFixed(2))
        }
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

        const getStats = this.transactionModel.aggregate([
            { $match: { userId: new Types.ObjectId(userId) } },
            { $match: { $expr: { $eq: [{ $month: "$createdAt" }, month] } } },
            { $match: { $expr: { $eq: [{ $year: "$createdAt" }, year] } } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    income: { $sum: { $cond: [{ $eq: ["$transactionType", "Income"] }, "$amount", 0] } },
                    expense: { $sum: { $cond: [{ $eq: ["$transactionType", "Expense"] }, "$amount", 0] } }
                }
            },
            { $project: { _id: 0, totalAmount: 1, income: 1, expense: 1 } }
        ])

        const getTransactions = this.transactionModel.aggregate([
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

        const groupByCategories = this.transactionModel.aggregate([
            { $match: { userId: new Types.ObjectId(userId) } },
            { $match: { $expr: { $eq: [{ $month: "$createdAt" }, month] } } },
            { $match: { $expr: { $eq: [{ $year: "$createdAt" }, year] } } },
            { $group: { _id: "$category", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [
                        { $project: { _id: 1, name: 1, icon: 1, bgColour: 1 } }
                    ]
                }
            },
            { $unwind: '$category' },
            {
                $project: {
                    _id: 1,
                    name: '$category.name',
                    icon: '$category.icon',
                    bgColour: '$category.bgColour',
                    totalAmount: 1,
                    count: 1
                }
            },
            { $sort: { totalAmount: 1 } }
        ])

        const [stats, transactions, categories] = await Promise.all([getStats, getTransactions, groupByCategories]);

        const categoriesWithPercentage = categories.map(category => {
            category.percentageOfIncome = stats[0].income === 0 ? 0 : ((category.totalAmount * -1 / stats[0].income) * 100).toFixed(2);
            category.percentageOfExpense = stats[0].expense === 0 ? 0 : ((category.totalAmount / stats[0].expense) * 100).toFixed(2);
            return category;
        })

        return {
            stats: stats[0],
            transactions: transactions,
            categories: categoriesWithPercentage
        };
    }

    async getSummary(userId: string, month: number, year: number) {

        const commonStatsPipeline = (month: number, year: number) => [
            { $match: { userId: new Types.ObjectId(userId) } },
            { $match: { $expr: { $eq: [{ $month: "$createdAt" }, month] } } },
            { $match: { $expr: { $eq: [{ $year: "$createdAt" }, year] } } },
            {
                $group: {
                    _id: null,
                    balance: { $sum: "$amount" },
                    income: { $sum: { $cond: [{ $eq: ["$transactionType", "Income"] }, "$amount", 0] } },
                    expense: { $sum: { $cond: [{ $eq: ["$transactionType", "Expense"] }, "$amount", 0] } }
                }
            },
            { $project: { _id: 0, balance: 1, income: 1, expense: 1 } }
        ]

        const commonCategoriesPipeline = (month: number, year: number) => [
            { $match: { userId: new Types.ObjectId(userId) } },
            { $match: { $expr: { $eq: [{ $month: "$createdAt" }, month] } } },
            { $match: { $expr: { $eq: [{ $year: "$createdAt" }, year] } } },
            { $group: { _id: "$category", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [
                        { $project: { _id: 1, name: 1, icon: 1, bgColour: 1 } }
                    ]
                }
            },
            { $unwind: '$category' },
            {
                $project: {
                    _id: 1,
                    name: '$category.name',
                    icon: '$category.icon',
                    bgColour: '$category.bgColour',
                    totalAmount: 1,
                    count: 1
                }
            },
            { $sort: { totalAmount: 1 } } as any
        ]

        const getUser = this.userModel.findById(userId)
        const getThisMonthStats = this.transactionModel.aggregate(commonStatsPipeline(month, year))
        const getLastMonthStats = this.transactionModel.aggregate(commonStatsPipeline(month - 1 > 0 ? month - 1 : 12, month - 1 > 0 ? year : year - 1))

        const getThisMonthGroupByCategories = this.transactionModel.aggregate(commonCategoriesPipeline(month, year))
        const getLastMonthGroupByCategories = this.transactionModel.aggregate(commonCategoriesPipeline(month - 1 > 0 ? month - 1 : 12, month - 1 > 0 ? year : year - 1))

        const [
            user,
            thisMonthStats,
            lastMonthStats,
            thisMonthGroupByCategories,
            lastMonthGroupByCategories
        ] = await Promise.all([getUser, getThisMonthStats, getLastMonthStats, getThisMonthGroupByCategories, getLastMonthGroupByCategories])

        // Handle case where there's no data for this month
        const thisMonthData = thisMonthStats[0] || { balance: 0, income: 0, expense: 0 };

        // Handle case where there's no data for last month
        const lastMonthData = lastMonthStats[0] || { balance: 0, income: 0, expense: 0 };

        const thisMonthCategoriesWithPercentage = thisMonthGroupByCategories.map(category => {
            category.percentageOfIncome = thisMonthData.income === 0 ? 0 : ((category.totalAmount * -1 / thisMonthData.income) * 100).toFixed(2);
            category.percentageOfExpense = thisMonthData.expense === 0 ? 0 : ((category.totalAmount / thisMonthData.expense) * 100).toFixed(2);
            return category;
        })

        const lastMonthCategoriesWithPercentage = lastMonthGroupByCategories.map(category => {
            category.percentageOfIncome = lastMonthData.income === 0 ? 0 : ((category.totalAmount * -1 / lastMonthData.income) * 100).toFixed(2);
            category.percentageOfExpense = lastMonthData.expense === 0 ? 0 : ((category.totalAmount / lastMonthData.expense) * 100).toFixed(2);
            return category;
        })

        // Determine if we have data for comparison
        const hasLastMonthData = lastMonthStats.length > 0;
        const hasThisMonthData = thisMonthStats.length > 0;

        const data = {
            thisMonth: {
                month: month,
                balance: thisMonthData.balance,
                income: thisMonthData.income,
                expense: thisMonthData.expense,
                categories: thisMonthCategoriesWithPercentage,
                hasData: hasThisMonthData
            },
            lastMonth: {
                month: month - 1 > 0 ? month - 1 : 12,
                balance: lastMonthData.balance,
                income: lastMonthData.income,
                expense: lastMonthData.expense,
                categories: lastMonthCategoriesWithPercentage,
                hasData: hasLastMonthData
            }
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `
                            ## Context
                            You are a financial assistant helping a user understand their monthly spending.

                            ## Task
                            Generate a concise and insightful summary of the user's financial transactions for the current month, based on the provided JSON data.

                            ## Data
                            Here is the JSON data of the user's transactions for the current month and the previous month:
                            ${JSON.stringify(data, null, 2)}

                            ## Instructions

                            1.  **Focus on Key Metrics:** Analyze the data and highlight important trends, such as total income, total expenses, key spending categories (e.g., groceries, entertainment, utilities), and any significant changes in these categories compared to the previous month.
                            2.  **Comparative Analysis:**  Compare the current month's spending and income with the previous month's ONLY if lastMonth.hasData is true. If there's no previous month data, focus on the current month's performance and mention that this appears to be the first month of tracking or no previous data is available.
                            3.  **Handle Missing Data:** If thisMonth.hasData is false, indicate that no transactions were recorded for this month. If lastMonth.hasData is false, mention that no previous month data is available for comparison.
                            4.  **Insights & Explanations:** Provide context and potential explanations for significant changes.  Don't assume knowledge the user doesn't have. For example, If there is a big income then explain that the user received a bonus of x amount.
                            5.  **Concise Summary:** Keep the summary brief and to the point. Aim for 3-4 short/medium paragraphs.
                            6.  **Currency:** Use the symbol "${user?.currency || '$'}" to represent currency in the summary. Do not use '-' to represent expenses (e.g., use $10,000 instead of -$10,000).
                            7.  **Month:** month field in the json data is a number from 1 to 12 representing the month. Use the month name in the summary.
                            8.  **Count:** count field in the json data is a number representing the number of transactions made in a particular category.
                            9.  **Plain Text Output:**  The summary should be plain text only, formatted into paragraphs.  Do *not* include any special characters like "#", "*", or markdown formatting. It should be directly renderable in a user interface.
                            10.  **Don't:** Do not provide any investment advice or personal opinions. Stick to reporting on the data. Do not include any HTML elements. Do not repeat the data already provided in the json.
                        `
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.5,
                        maxOutputTokens: 1000,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API request failed: ${response.status}`);
            }

            const result = await response.json();
            const summaryText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary';

            return { summary: summaryText };
        } catch (aiError) {
            console.error('AI generation failed:', aiError);
            throw new Error('Failed to generate financial summary');
        }
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
