import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
const productSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.number(),
    stock: z.number(),
    rating: z.number(),
});
const productsSchema = z.array(productSchema);
const dataPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data.md");
async function loadProducts() {
    const rawData = await readFile(dataPath, "utf8");
    return productsSchema.parse(JSON.parse(rawData));
}
function toJsonText(data) {
    return JSON.stringify(data, null, 2);
}
export function createCatalogServer() {
    const server = new McpServer({
        name: "product-catalog-mcp",
        version: "0.1.0",
    });
    server.registerTool("list_products", {
        title: "List products",
        description: "List products from the local product catalog with optional filters.",
        inputSchema: {
            category: z.string().optional().describe("Filter by category, for example Elektronik."),
            minPrice: z.number().optional().describe("Only include products at or above this price."),
            maxPrice: z.number().optional().describe("Only include products at or below this price."),
            inStockOnly: z.boolean().optional().describe("Only include products with stock greater than 0."),
            sortBy: z.enum(["price", "rating", "stock", "name"]).optional().describe("Sort the result by a product field."),
        },
    }, async ({ category, minPrice, maxPrice, inStockOnly, sortBy }) => {
        let products = await loadProducts();
        if (category) {
            products = products.filter((product) => product.category.toLocaleLowerCase("tr-TR") === category.toLocaleLowerCase("tr-TR"));
        }
        if (minPrice !== undefined) {
            products = products.filter((product) => product.price >= minPrice);
        }
        if (maxPrice !== undefined) {
            products = products.filter((product) => product.price <= maxPrice);
        }
        if (inStockOnly) {
            products = products.filter((product) => product.stock > 0);
        }
        if (sortBy) {
            products = [...products].sort((left, right) => {
                if (sortBy === "name") {
                    return left.name.localeCompare(right.name, "tr-TR");
                }
                return right[sortBy] - left[sortBy];
            });
        }
        return {
            content: [{ type: "text", text: toJsonText(products) }],
        };
    });
    server.registerTool("get_product", {
        title: "Get product",
        description: "Get a single product by product id.",
        inputSchema: {
            id: z.string().describe("Product id, for example PRD-001."),
        },
    }, async ({ id }) => {
        const products = await loadProducts();
        const product = products.find((item) => item.id.toLocaleLowerCase("tr-TR") === id.toLocaleLowerCase("tr-TR"));
        if (!product) {
            return {
                isError: true,
                content: [{ type: "text", text: `Product not found: ${id}` }],
            };
        }
        return {
            content: [{ type: "text", text: toJsonText(product) }],
        };
    });
    server.registerTool("search_products", {
        title: "Search products",
        description: "Search products by name, category, or id.",
        inputSchema: {
            query: z.string().describe("Search text."),
        },
    }, async ({ query }) => {
        const normalizedQuery = query.toLocaleLowerCase("tr-TR");
        const products = (await loadProducts()).filter((product) => [product.id, product.name, product.category].some((value) => value.toLocaleLowerCase("tr-TR").includes(normalizedQuery)));
        return {
            content: [{ type: "text", text: toJsonText(products) }],
        };
    });
    server.registerResource("products", "products://all", {
        title: "Products",
        description: "All products loaded from data.md.",
        mimeType: "application/json",
    }, async (uri) => ({
        contents: [
            {
                uri: uri.href,
                mimeType: "application/json",
                text: toJsonText(await loadProducts()),
            },
        ],
    }));
    return server;
}
