export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, categories, accounts } from "@/db/schema";
import { eq, and, gte, lte, desc, sum } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month") || getCurrentMonth(); // YYYY-MM format

    const [year, monthStr] = month.split("-");
    const monthStart = new Date(`${year}-${monthStr}-01`);
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Get all transactions for the month
    const monthTransactions = await db.query.transactions.findMany({
      where: and(
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd)
      ),
      with: {
        category: true,
        account: true,
        toAccount: true,
      },
      orderBy: desc(transactions.date),
    });

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;

    monthTransactions.forEach((tx) => {
      const amount = parseFloat(String(tx.amount));
      if (tx.type === "income") {
        totalIncome += amount;
      } else if (tx.type === "expense") {
        totalExpenses += amount;
      }
    });

    // Get all accounts for balance
    const allAccounts = await db.query.accounts.findMany();
    const totalBalance = allAccounts.reduce(
      (sum, acc) => sum + parseFloat(String(acc.balance)),
      0
    );

    // Get recent transactions (last 10 across all time)
    const recentTransactions = await db.query.transactions.findMany({
      limit: 10,
      orderBy: desc(transactions.date),
      with: {
        category: true,
        account: true,
        toAccount: true,
      },
    });

    // Calculate spending by category for current month
    const spendingByCategory: Record<string, number> = {};
    monthTransactions.forEach((tx) => {
      if (tx.type === "expense" && tx.category) {
        const amount = parseFloat(String(tx.amount));
        spendingByCategory[tx.category.name] =
          (spendingByCategory[tx.category.name] || 0) + amount;
      }
    });

    // Generate Sankey diagram data
    const sankeyData = generateSankeyData(monthTransactions);

    // Spending by category as array with color
    const spendingByCategoryArray = Object.entries(spendingByCategory).map(([name, total]) => {
      const cat = monthTransactions.find((tx) => tx.category?.name === name)?.category;
      return { name, total, color: cat?.color || "#DC2626" };
    }).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      balance: totalBalance,
      transactionCount: monthTransactions.length,
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        categoryName: tx.category?.name || null,
        accountName: tx.account?.name || null,
      })),
      spendingByCategory: spendingByCategoryArray,
      sankeyData,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function generateSankeyData(transactionList: any[]) {
  const nodeNames: string[] = ["Omzet"];
  const nodeSet = new Set<string>();
  nodeSet.add("Omzet");

  const incomeByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};

  // Process transactions
  transactionList.forEach((tx) => {
    const amount = parseFloat(String(tx.amount));

    if (tx.type === "income" && tx.category) {
      const categoryName = tx.category.name;
      if (!nodeSet.has(categoryName)) {
        nodeNames.push(categoryName);
        nodeSet.add(categoryName);
      }
      incomeByCategory[categoryName] =
        (incomeByCategory[categoryName] || 0) + amount;
    } else if (tx.type === "expense" && tx.category) {
      const categoryName = tx.category.name;
      if (!nodeSet.has(categoryName)) {
        nodeNames.push(categoryName);
        nodeSet.add(categoryName);
      }
      expenseByCategory[categoryName] =
        (expenseByCategory[categoryName] || 0) + amount;
    }
  });

  const nodes = nodeNames.map((name) => ({ name }));
  const links: { source: number; target: number; value: number }[] = [];
  const revenueIndex = 0;

  // Create links: income categories -> Omzet
  Object.entries(incomeByCategory).forEach(([category, amount]) => {
    const sourceIndex = nodeNames.indexOf(category);
    if (sourceIndex !== -1) {
      links.push({ source: sourceIndex, target: revenueIndex, value: amount });
    }
  });

  // Create links: Omzet -> expense categories
  Object.entries(expenseByCategory).forEach(([category, amount]) => {
    const targetIndex = nodeNames.indexOf(category);
    if (targetIndex !== -1) {
      links.push({ source: revenueIndex, target: targetIndex, value: amount });
    }
  });

  return { nodes, links };
}
