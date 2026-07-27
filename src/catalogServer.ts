import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const creditOfferSchema = z.object({
  id: z.string(),
  bank: z.string(),
  title: z.string(),
  loanType: z.string(),
  minAmount: z.number().nullable(),
  maxAmount: z.number().nullable(),
  minTermMonths: z.number().nullable(),
  maxTermMonths: z.number().nullable(),
  interestRate: z.number().nullable(),
  annualCostRate: z.number().nullable(),
  fees: z.array(z.string()),
  requirements: z.array(z.string()),
  applicationChannels: z.array(z.string()),
  validUntil: z.string().nullable(),
  url: z.string().url(),
  notes: z.string(),
});

const creditOffersSchema = z.array(creditOfferSchema);

type CreditOffer = z.infer<typeof creditOfferSchema>;

const dataPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data.md");

async function loadCreditOffers(): Promise<CreditOffer[]> {
  const rawData = await readFile(dataPath, "utf8");
  return creditOffersSchema.parse(JSON.parse(rawData));
}

function toJsonText(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase("tr-TR");
}

export function createCatalogServer(): McpServer {
  const server = new McpServer({
    name: "akbank-credit-offers-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "list_credit_offers",
    {
      title: "List credit offers",
      description: "List Akbank credit offers with optional loan type, amount, term, channel, and sorting filters.",
      inputSchema: {
        loanType: z.string().optional().describe("Filter by loan type, for example İhtiyaç Kredisi."),
        minAmount: z.number().optional().describe("Only include offers whose maximum amount can cover this amount."),
        maxAmount: z.number().optional().describe("Only include offers whose minimum amount is at or below this amount."),
        minTermMonths: z.number().optional().describe("Only include offers whose maximum term can cover this term."),
        maxTermMonths: z.number().optional().describe("Only include offers whose minimum term is at or below this term."),
        channel: z.string().optional().describe("Filter by application channel, for example Akbank Mobil."),
        sortBy: z.enum(["title", "loanType", "maxAmount", "maxTermMonths"]).optional().describe("Sort the result by an offer field."),
      },
    },
    async ({ loanType, minAmount, maxAmount, minTermMonths, maxTermMonths, channel, sortBy }) => {
      let offers = await loadCreditOffers();

      if (loanType) {
        offers = offers.filter((offer) => normalizeText(offer.loanType) === normalizeText(loanType));
      }

      if (minAmount !== undefined) {
        offers = offers.filter((offer) => offer.maxAmount === null || offer.maxAmount >= minAmount);
      }

      if (maxAmount !== undefined) {
        offers = offers.filter((offer) => offer.minAmount === null || offer.minAmount <= maxAmount);
      }

      if (minTermMonths !== undefined) {
        offers = offers.filter((offer) => offer.maxTermMonths === null || offer.maxTermMonths >= minTermMonths);
      }

      if (maxTermMonths !== undefined) {
        offers = offers.filter((offer) => offer.minTermMonths === null || offer.minTermMonths <= maxTermMonths);
      }

      if (channel) {
        offers = offers.filter((offer) => offer.applicationChannels.some((applicationChannel) => normalizeText(applicationChannel).includes(normalizeText(channel))));
      }

      if (sortBy) {
        offers = [...offers].sort((left, right) => {
          if (sortBy === "title" || sortBy === "loanType") {
            return left[sortBy].localeCompare(right[sortBy], "tr-TR");
          }

          return (right[sortBy] ?? 0) - (left[sortBy] ?? 0);
        });
      }

      return {
        content: [{ type: "text", text: toJsonText(offers) }],
      };
    },
  );

  server.registerTool(
    "get_credit_offer",
    {
      title: "Get credit offer",
      description: "Get a single Akbank credit offer by id.",
      inputSchema: {
        id: z.string().describe("Credit offer id, for example AKB-KRD-001."),
      },
    },
    async ({ id }) => {
      const offers = await loadCreditOffers();
      const offer = offers.find((item) => normalizeText(item.id) === normalizeText(id));

      if (!offer) {
        return {
          isError: true,
          content: [{ type: "text", text: `Credit offer not found: ${id}` }],
        };
      }

      return {
        content: [{ type: "text", text: toJsonText(offer) }],
      };
    },
  );

  server.registerTool(
    "search_credit_offers",
    {
      title: "Search credit offers",
      description: "Search Akbank credit offers by title, loan type, channel, requirement, note, or id.",
      inputSchema: {
        query: z.string().describe("Search text."),
      },
    },
    async ({ query }) => {
      const normalizedQuery = normalizeText(query);
      const offers = (await loadCreditOffers()).filter((offer) => {
        const searchableValues = [
          offer.id,
          offer.bank,
          offer.title,
          offer.loanType,
          offer.notes,
          offer.url,
          ...offer.fees,
          ...offer.requirements,
          ...offer.applicationChannels,
        ];

        return searchableValues.some((value) => normalizeText(value).includes(normalizedQuery));
      });

      return {
        content: [{ type: "text", text: toJsonText(offers) }],
      };
    },
  );

  server.registerResource(
    "credit_offers",
    "credit-offers://all",
    {
      title: "Akbank credit offers",
      description: "All Akbank credit offers loaded from data.md.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: toJsonText(await loadCreditOffers()),
        },
      ],
    }),
  );

  return server;
}