export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, categories, accounts } from "@/db/schema";
import { eq, and, gte, lte, desc, sum } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month") || getCurrentMonth();

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

    // Get all categories for parent path resolution
    const allCategories = await db.query.categories.findMany();
    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

    // Build category path: "Parent > Child > Grandchild"
    const getCategoryPath = (catId: number | null): string => {
      if (!catId) return "";
      const parts: string[] = [];
      let current = categoryMap.get(catId);
      while (current) {
        parts.unshift(current.name);
        current = current.parentId ? categoryMap.get(current.parentId) : undefined;
      }
      return parts.join(" › ");
    };

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
      if (tx.type === "income") totalIncome += amount;
      else if (tx.type === "expense") totalExpenses += amount;
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
      with: { category: true, account: true, toAccount: true },
    });

    // Spending by category with count and descriptions
    const spendingMap: Record<string, { total: number; count: number; color: string; descriptions: string[] }> = {};
    monthTransactions.forEach((tx) => {
      if (tx.type === "expense" && tx.category) {
        const name = getCategoryPath(tx.categoryId) || tx.category.name;
        if (!spendingMap[name]) {
          spendingMap[name] = { total: 0, count: 0, color: tx.category.color || "#DC2626", descriptions: [] };
        }
        const amount = parseFloat(String(tx.amount));
        spendingMap[name].total += amount;
        spendingMap[name].count += 1;
        if (spendingMap[name].descriptions.length < 5) {
          spendingMap[name].descriptions.push(tx.description);
        }
      }
    });

    const spendingByCategoryArray = Object.entries(spendingMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    // Income by category for pie chart
    const incomeMap: Record<string, { total: number; count: number; color: string }> = {};
    monthTransactions.forEach((tx) => {
      if (tx.type === "income" && tx.category) {
        const name = getCategoryPath(tx.categoryId) || tx.category.name;
        if (!incomeMap[name]) {
          incomeMap[name] = { total: 0, count: 0, color: tx.category.color || "#22c55e" };
        }
        incomeMap[name].total += parseFloat(String(tx.amount));
        incomeMap[name].count += 1;
      }
    });
    const incomeByCategoryArray = Object.entries(incomeMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    // Monthly trend: last 6 months including current
    const trendData: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(monthStart);
      d.setMonth(d.getMonth() - i);
      const trendStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const trendEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const trendTx = await db.query.transactions.findMany({
        where: and(gte(transactions.date, trendStart), lte(transactions.date, trendEnd)),
      });

      let inc = 0, exp = 0;
      trendTx.forEach((tx) => {
        const a = parseFloat(String(tx.amount));
        if (tx.type === "income") inc += a;
        else if (tx.type === "expense") exp += a;
      });

      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      trendData.push({ month: label, income: inc, expenses: exp });
    }

    // Generate Sankey diagram data with parent category paths
    const sankeyData = generateSankeyData(monthTransactions, getCategoryPath);

    // Stats for the dashboard
    const expenseAmounts = monthTransactions
      .filter((tx) => tx.type === "expense")
      .map((tx) => parseFloat(String(tx.amount)));
    const incomeAmounts = monthTransactions
      .filter((tx) => tx.type === "income")
      .map((tx) => parseFloat(String(tx.amount)));

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
        categoryName: tx.category ? getCategoryPath(tx.categoryId) || tx.category.name : null,
        accountName: tx.account?.name || null,
      })),
      spendingByCategory: spendingByCategoryArray,
      incomeByCategory: incomeByCategoryArray,
      sankeyData,
      trendData,
      stats: {
        avgExpense: expenseAmounts.length > 0 ? expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length : 0,
        avgIncome: incomeAmounts.length > 0 ? incomeAmounts.reduce((a, b) => a + b, 0) / incomeAmounts.length : 0,
        largestExpense: expenseAmounts.length > 0 ? Math.max(...expenseAmounts) : 0,
        largestIncome: incomeAmounts.length > 0 ? Math.max(...incomeAmounts) : 0,
        expenseCount: expenseAmounts.length,
        incomeCount: incomeAmounts.length,
      },
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

function generateSankeyData(
  transactionList: any[],
  getCategoryPath: (catId: number | null) => string
) {
  const nodeNames: string[] = ["Omzet"];
  const nodeSet = new Set<string>();
  nodeSet.add("Omzet");

  const incomeByCategory: Record<string, { value: number; count: number; descriptions: string[] }> = {};
  const expenseByCategory: Record<string, { value: number; count: number; descriptions: string[] }> = {};

  transactionList.forEach((tx) => {
    const amount = parseFloat(String(tx.amount));

    if (tx.type === "income" && tx.category) {
      const categoryName = getCategoryPath(tx.categoryId) || tx.category.name;
      if (!nodeSet.has(categoryName)) {
        nodeNames.push(categoryName);
        nodeSet.add(categoryName);
      }
      if (!incomeByCategory[categoryName]) {
        incomeByCategory[categoryName] = { value: 0, count: 0, descriptions: [] };
      }
      incomeByCategory[categoryName].value += amount;
      incomeByCategory[categoryName].count += 1;
      if (incomeByCategory[categoryName].descriptions.length < 3) {
        incomeByCategory[categoryName].descriptions.push(tx.description);
      }
    } else if (tx.type === "expense" && tx.category) {
      const categoryName = getCategoryPath(tx.categoryId) || tx.category.name;
      if (!nodeSet.has(categoryName)) {
        nodeNames.push(categoryName);
        nodeSet.add(categoryName);
      }
      if (!expenseByCategory[categoryName]) {
        expenseByCategory[categoryName] = { value: 0, count: 0, descriptions: [] };
      }
      expenseByCategory[categoryName].value += amount;
      expenseByCategory[categoryName].count += 1;
      if (expenseByCategory[categoryName].descriptions.length < 3) {
        expenseByCategory[categoryName].descriptions.push(tx.description);
      }
    }
  });

  const nodes = nodeNames.map((name) => ({ name }));
  const links: { source: number; target: number; value: number; count: number; descriptions: string[] }[] = [];
  const revenueIndex = 0;

  Object.entries(incomeByCategory).forEach(([category, data]) => {
    const sourceIndex = nodeNames.indexOf(category);
    if (sourceIndex !== -1) {
      links.push({
        source: sourceIndex,
        target: revenueIndex,
        value: data.value,
        count: data.count,
        descriptions: data.descriptions,
      });
    }
  });

  Object.entries(expenseByCategory).forEach(([category, data]) => {
    const targetIndex = nodeNames.indexOf(category);
    if (targetIndex !== -1) {
      links.push({
        source: revenueIndex,
        target: targetIndex,
        value: data.value,
        count: data.count,
        descriptions: data.descriptions,
      });
    }
  });

  return { nodes, links };
}
