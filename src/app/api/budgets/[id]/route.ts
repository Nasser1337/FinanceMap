export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const budgetId = parseInt(id);

    if (isNaN(budgetId)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const budget = await db.query.budgets.findFirst({
      where: eq(budgets.id, budgetId),
      with: {
        category: true,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
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
    const budgetId = parseInt(id);

    if (isNaN(budgetId)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, amount, categoryId, period, color } = body;

    const result = await db
      .update(budgets)
      .set({
        name: name || undefined,
        amount: amount !== undefined ? amount : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        period: period || undefined,
        color: color || undefined,
      })
      .where(eq(budgets.id, budgetId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const fullBudget = await db.query.budgets.findFirst({
      where: eq(budgets.id, budgetId),
      with: {
        category: true,
      },
    });

    return NextResponse.json(fullBudget);
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
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
    const budgetId = parseInt(id);

    if (isNaN(budgetId)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const result = await db
      .delete(budgets)
      .where(eq(budgets.id, budgetId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    );
  }
}
