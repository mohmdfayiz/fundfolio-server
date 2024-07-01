import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction } from './schemas/transaction.schema';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/category.dto';
import { CreateTransactionDto } from './dto/transaction.dto';

@Controller('transaction')
export class TransactionController {

    constructor(private transactionService: TransactionService) { }

    @Get()
    async getGroupTransactions(@Request() req): Promise<Transaction[]> {
        const userId = req.user.userId;
        return await this.transactionService.getTransactionsGroup(userId);
    }

    @Get('recent')
    async getTransactions(@Request() req): Promise<Transaction[]> {
        const userId = req.user.userId;
        return await this.transactionService.getRecentTransactions(userId);
    }

    @Get('total')
    async getBalance(@Request() req) {
        const userId = req.user.userId;
        return await this.transactionService.getBalance(userId);
    }

    @Get('stats/:month/:year')
    async getStats(@Request() req, @Param('month') month: string, @Param('year') year: string) {
        const userId = req.user.userId;
        return await this.transactionService.getStats(userId, parseInt(month), parseInt(year));
    }

    @Post()
    async createTransaction(@Request() req, @Body() transaction: CreateTransactionDto): Promise<Transaction> {
        const userId = req.user.userId;
        return await this.transactionService.create(userId, transaction);
    }

    @Delete(':id')
    async deleteTransaction(@Body() id: string): Promise<Transaction> {
        return await this.transactionService.delete(id);
    }

    @Get('category')
    async getTransactionCategories(@Request() req): Promise<Category[]> {
        const userId = req.user.userId;
        return await this.transactionService.getCategories(userId);
    }

    @Post('category')
    async createCategory(@Request() req, @Body() category: CreateCategoryDto): Promise<Category> {
        const userId = req.user.userId;
        return await this.transactionService.createCategory(userId, category);
    }

    @Patch('category/:id')
    async updateCategory(@Param('id') id: string, @Body() category: Category): Promise<Category> {
        return await this.transactionService.updateCategory(id, category);
    }

    @Delete('category/:id')
    async deleteCategory(@Param('id') id: string): Promise<Category> {
        return await this.transactionService.deleteCategory(id);
    }
}
