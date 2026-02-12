import xlsx from "xlsx";

const data = [
    {
        "Name": "Sheetal Traditional Silk Saree",
        "SKU": "SBS-SILK-001",
        "Description": "A beautiful traditional silk saree with intricate zari work, perfect for weddings and festivals.",
        "ShortDescription": "Traditional Silk Saree",
        "MaterialCare": "Dry Clean Only",
        "Category": "Sarees",
        "SubCategory": "Silk Sarees",
        "Price": 4500,
        "Stock": 100,
        "Status": "Active",
        "WearType": "Traditional",
        "Occasion": "Wedding, Festival",
        "Tags": "Silk, Zari, Red",
        "MainImage": "silk_saree_main.jpg",
        "HoverImage": "silk_saree_hover.jpg",
        "Images": "silk_saree_1.jpg, silk_saree_2.jpg",
        "Variants": JSON.stringify([
            {
                "color": { "name": "Red", "code": "#FF0000" },
                "v_sku": "SBS-SILK-001-RED",
                "sizes": [
                    { "name": "Free Size", "stock": 50, "price": 4500, "discountPrice": 4000 }
                ],
                "imageFilename": "silk_saree_red.jpg"
            },
            {
                "color": { "name": "Blue", "code": "#0000FF" },
                "v_sku": "SBS-SILK-001-BLUE",
                "sizes": [
                    { "name": "Free Size", "stock": 50, "price": 4500, "discountPrice": 4000 }
                ],
                "imageFilename": "silk_saree_blue.jpg"
            }
        ])
    },
    {
        "Name": "Modern Georgette Print",
        "SKU": "SBS-GEO-002",
        "Description": "Lightweight georgette saree with modern digital prints.",
        "ShortDescription": "Modern Georgette Saree",
        "MaterialCare": "Hand Wash",
        "Category": "Sarees",
        "SubCategory": "Georgette",
        "Price": 2200,
        "Stock": 80,
        "Status": "Active",
        "WearType": "Casual, Party",
        "Occasion": "Party",
        "Tags": "Georgette, Print, Lightweight",
        "MainImage": "geo_print_main.jpg",
        "HoverImage": "geo_print_hover.jpg",
        "Images": "",
        "Variants": JSON.stringify([
            {
                "color": { "name": "Green", "code": "#008000" },
                "v_sku": "SBS-GEO-002-GRN",
                "sizes": [
                    { "name": "Free Size", "stock": 80, "price": 2200, "discountPrice": 1800 }
                ],
                "imageFilename": "geo_print_green.jpg"
            }
        ])
    }
];

const worksheet = xlsx.utils.json_to_sheet(data);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

const outputDetails = "dummy_product_upload.xlsx";
xlsx.writeFile(workbook, outputDetails);

console.log(`Dummy Excel file created at: ${outputDetails}`);
