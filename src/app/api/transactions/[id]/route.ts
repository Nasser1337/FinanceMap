export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
      with: {
        category: true,
        account: true,
        toAccount: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

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

    const result = await db
      .update(transactions)
      .set({
        description: description || undefined,
        amount: amount || undefined,
        type: type || undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        accountId: accountId || undefined,
        toAccountId: toAccountId !== undefined ? toAccountId : undefined,
        date: date ? new Date(date) : undefined,
        notes: notes !== undefined ? notes : undefined,
        tags: tags !== undefined ? tags : undefined,
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const fullTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
      with: {
        category: true,
        account: true,
        toAccount: true,
      },
    });

    return NextResponse.json(fullTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(transactions)
      .where(eq(transactions.id, transactionId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
