export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, categories, accounts } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month"); // YYYY-MM format
    const type = searchParams.get("type"); // income, expense, transfer

    let where = [];

    if (month) {
      const [year, monthStr] = month.split("-");
      const startDate = new Date(`${year}-${monthStr}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);

      where.push(gte(transactions.date, startDate));
      where.push(lte(transactions.date, endDate));
    }

    if (type && ["income", "expense", "transfer"].includes(type)) {
      where.push(eq(transactions.type, type as any));
    }

    const allTransactions = await db.query.transactions.findMany({
      where: where.length > 0 ? and(...where) : undefined,
      with: {
        category: true,
        account: true,
        toAccount: true,
      },
      orderBy: desc(transactions.date),
    });

    return NextResponse.json(allTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      description,
      amount,
      type,
      categoryId,
      accountId,
      toAccountId,
      date,
      notes,
      tags,
    } = body;

    if (!description || !amount || !type || !accountId || !date) {
      return NextResponse.json(
        { error: "description, amount, type, accountId, and date are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(transactions)
      .values({
        description,
        amount,
        type,
        categoryId: categoryId || null,
        accountId,
        toAccountId: toAccountId || null,
        date: new Date(date),
        notes: notes || null,
        tags: tags || null,
      })
      .returning();

    const fullTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, result[0].id),
      with: {
        category: true,
        account: true,
        toAccount: true,
      },
    });

    return NextResponse.json(fullTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
