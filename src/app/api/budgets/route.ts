export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { budgets } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    const allBudgets = await db.query.budgets.findMany({
      with: {
        category: true,
      },
    });
    return NextResponse.json(allBudgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, amount, categoryId, period, color } = body;

    if (!name || !amount) {
      return NextResponse.json(
        { error: "Name and amount are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(budgets)
      .values({
        name,
        amount,
        categoryId: categoryId || null,
        period: period || "monthly",
        color: color || "#DC2626",
      })
      .returning();

    const fullBudget = await db.query.budgets.findFirst({
      where: (b) => b.id === result[0].id,
      with: {
        category: true,
      },
    });

    return NextResponse.json(fullBudget, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
