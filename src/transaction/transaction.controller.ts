import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction } from './schemas/transaction.schema';
import { Category } from './schemas/category.schema';

@Controller('transaction')
export class TransactionController {

    constructor(private transactionService: TransactionService) { }

    @Get()
    async getTransactions(): Promise<Transaction[]> {
        return await this.transactionService.get();
    }

    @Post()
    async createTransaction(@Body() transaction: Transaction): Promise<Transaction> {
        return await this.transactionService.create(transaction);
    }

    @Delete(':id')
    async deleteTransaction(@Body() id: string): Promise<Transaction> {
        return await this.transactionService.delete(id);
    }

    @Get('/category')
    async getTransactionCategories(): Promise<Category[]> {
        return await this.transactionService.getCategories();
    }

    @Post('/category')
    async createCategory(@Body() category: Category): Promise<Category> {
        return await this.transactionService.createCategory(category);
    }

    @Patch('/category/:id')
    async updateCategory(@Param('id') id: string, @Body() category: Category): Promise<Category> {
        return await this.transactionService.updateCategory(id, category);
    }
}
