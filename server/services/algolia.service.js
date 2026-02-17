import { algoliasearch } from "algoliasearch";
import dotenv from "dotenv";

dotenv.config();

const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
);

const indexName = process.env.ALGOLIA_INDEX_NAME || "sheetal_products";

export const syncToAlgolia = async (item, type) => {
    try {
        if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_API_KEY) {
            console.warn("Algolia credentials missing, skipping sync.");
            return;
        }

        let record = {};

        if (type === "product") {
            // Flatten product structure for search
            record = {
                objectID: item._id.toString(),
                type: "product",
                name: item.name,
                slug: item.slug,
                description: item.description,
                shortDescription: item.shortDescription,
                mainImage: item.mainImage,
                category: item.category ? item.category.name : "",
                tags: item.tags || [],
                fabric: item.fabric || [],
                style: item.style || [],
                work: item.work || [],
                occasion: item.occasion || [],
                wearType: item.wearType || [],
                stock: item.stock,
                status: item.status,
                updatedAt: item.updatedAt,
                colors: item.variants ? [...new Set(item.variants.map(v => v.color?.name).filter(Boolean))] : []
            };

            // Calculate Price Logic (Min Effective Price)
            if (item.variants && item.variants.length > 0) {
                let minPrice = Infinity;
                let relatedMrp = 0;

                item.variants.forEach(v => {
                    v.sizes?.forEach(s => {
                        const effective = (s.discountPrice && s.discountPrice > 0) ? s.discountPrice : s.price;
                        if (effective < minPrice) {
                            minPrice = effective;
                            relatedMrp = s.price;
                        }
                    });
                });

                if (minPrice !== Infinity) {
                    record.minPrice = minPrice;
                    record.mrp = relatedMrp;
                    if (relatedMrp > minPrice) {
                        record.discount = Math.round(((relatedMrp - minPrice) / relatedMrp) * 100);
                    }
                }
            }
        } else if (type === "category") {
            record = {
                objectID: item._id.toString(),
                type: "category",
                name: item.name,
                slug: item.slug,
                description: item.description,
                image: item.mainImage, // Category mainImage
                status: item.status,
                updatedAt: item.updatedAt
            };
        } else {
            return;
        }

        // Save object
        await client.saveObject({ indexName, body: record });
        console.log(`Synced ${type}: ${item.name} to Algolia`);

    } catch (error) {
        console.error("Error syncing to Algolia:", error);
    }
};

export const deleteFromAlgolia = async (objectId) => {
    try {
        if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_API_KEY) return;
        await client.deleteObject({ indexName, objectID: objectId });
        console.log(`Deleted object ${objectId} from Algolia`);
    } catch (error) {
        console.error("Error deleting from Algolia:", error);
    }
};

export const searchAlgolia = async (query, options = {}) => {
    try {
        if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_API_KEY) {
            throw new Error("Algolia credentials not configured.");
        }

        const params = {
            hitsPerPage: options.limit || 20,
            page: (options.page || 1) - 1,
            typoTolerance: true,
            minWordSizefor1Typo: 3,
            minWordSizefor2Typos: 3, // Relaxed
            ignorePlurals: true,
        };

        if (options.filters) {
            params.filters = options.filters;
        }

        // Algolia search
        const { results } = await client.search({
            requests: [
                {
                    indexName,
                    query,
                    ...params,
                },
            ],
        });

        return results[0]; // First request result
    } catch (error) {
        console.error("Algolia Search Error:", error);
        throw error;
    }
};
