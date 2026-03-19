export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, accounts, budgets } from "@/db/schema";

const INCOME_CATEGORIES = [
  "Consultaties",
  "Vullingen",
  "Kronen & Bruggen",
  "Wortelkanaalbehandeling",
  "Extracties",
  "Orthodontie",
  "Implantaten",
  "Prothesen",
  "Parodontologie",
  "Cosmetische Tandheelkunde",
  "Bleken",
  "Noodgevallen",
  "Preventie & Mondhygiëne",
  "RIZIV Terugbetalingen",
  "Verzekeringen",
];

const EXPENSE_CATEGORIES = [
  "Lonen & Salarissen",
  "Sociale Bijdragen (RSZ)",
  "Opleiding Personeel",
  "Tandheelkundig Materiaal",
  "Handschoenen & Bescherming",
  "Sterilisatie & Hygiëne",
  "Röntgen & Beeldvorming",
  "Laboratoriumkosten",
  "Implantaat Componenten",
  "Apparatuur Onderhoud",
  "Nieuwe Apparatuur",
  "Huur/Hypotheek",
  "Elektriciteit & Gas",
  "Water",
  "Internet & Telefoon",
  "Schoonmaak",
  "Medisch Afval",
  "Software & IT",
  "Verzekeringen",
  "BTW",
  "Vennootschapsbelasting",
  "Boekhouder",
  "Marketing",
  "Vervoer",
  "Bankkosten",
  "Lidmaatschappen",
  "Kantoorbenodigdheden",
];

const DEFAULT_ACCOUNTS = [
  {
    name: "Zakelijke Rekening",
    type: "checking",
    balance: "0",
    currency: "EUR",
    description: "Zakelijke betaalrekening",
  },
  {
    name: "Spaarrekening",
    type: "savings",
    balance: "0",
    currency: "EUR",
    description: "Zakelijke spaarrekening",
  },
  {
    name: "Kas Contanten",
    type: "cash",
    balance: "0",
    currency: "EUR",
    description: "Contante kas",
  },
  {
    name: "Kredietkaart",
    type: "credit_card",
    balance: "0",
    currency: "EUR",
    description: "Zakelijke kredietkaart",
  },
];

const EXPENSE_GROUPS: Record<string, string[]> = {
  Personeelskosten: ["Lonen & Salarissen", "Sociale Bijdragen (RSZ)"],
  "Materialen & Hygiëne": [
    "Tandheelkundig Materiaal",
    "Handschoenen & Bescherming",
    "Sterilisatie & Hygiëne",
  ],
  "Apparatuur & Onderhoud": [
    "Röntgen & Beeldvorming",
    "Apparatuur Onderhoud",
    "Nieuwe Apparatuur",
    "Implantaat Componenten",
  ],
  "Huishouding & Overhead": [
    "Huur/Hypotheek",
    "Elektriciteit & Gas",
    "Water",
    "Internet & Telefoon",
    "Schoonmaak",
  ],
  Administratie: [
    "Software & IT",
    "Boekhouder",
    "Kantoorbenodigdheden",
    "Bankkosten",
    "Medisch Afval",
  ],
  Belastingen: ["BTW", "Vennootschapsbelasting"],
  Overig: [
    "Opleiding Personeel",
    "Laboratoriumkosten",
    "Verzekeringen",
    "Marketing",
    "Vervoer",
    "Lidmaatschappen",
  ],
};

export async function POST(request: NextRequest) {
  try {
    // Check if data already exists
    const existingCategories = await db.query.categories.findMany();
    if (existingCategories.length > 0) {
      return NextResponse.json(
        { message: "Database already seeded" },
        { status: 400 }
      );
    }

    // Insert income categories
    const insertedIncomeCategories = await db
      .insert(categories)
      .values(
        INCOME_CATEGORIES.map((name) => ({
          name,
          type: "income" as const,
          color: "#10B981",
          icon: "TrendingUp",
        }))
      )
      .returning();

    // Insert expense categories
    const insertedExpenseCategories = await db
      .insert(categories)
      .values(
        EXPENSE_CATEGORIES.map((name) => ({
          name,
          type: "expense" as const,
          color: "#EF4444",
          icon: "TrendingDown",
        }))
      )
      .returning();

    // Insert default accounts
    const insertedAccounts = await db
      .insert(accounts)
      .values(DEFAULT_ACCOUNTS as any)
      .returning();

    // Insert sample budgets for expense groups
    const budgetInserts = [];
    for (const [groupName, categoryNames] of Object.entries(EXPENSE_GROUPS)) {
      // Find the first category in this group to get the ID
      const firstCategoryName = categoryNames[0];
      const category = insertedExpenseCategories.find(
        (c) => c.name === firstCategoryName
      );

      if (category) {
        budgetInserts.push({
          name: groupName,
          amount: "5000",
          categoryId: category.id,
          period: "monthly",
          color: "#DC2626",
        });
      }
    }

    const insertedBudgets = await db
      .insert(budgets)
      .values(budgetInserts as any)
      .returning();

    return NextResponse.json(
      {
        message: "Database seeded successfully",
        counts: {
          incomeCategories: insertedIncomeCategories.length,
          expenseCategories: insertedExpenseCategories.length,
          accounts: insertedAccounts.length,
          budgets: insertedBudgets.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
