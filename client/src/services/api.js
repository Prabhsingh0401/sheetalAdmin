// export const BASE_URL = "https://node.sheetal.codenap.in";
export const BASE_URL = "https://sheetaladmin.onrender.com";
// export const BASE_URL = "http://localhost:8000";

export const API_BASE_URL = `${BASE_URL}/api/v1`;

export const IMAGE_BASE_URL = BASE_URL;

export const getApiImageUrl = (
    path,
    fallback = "/assets/default-image.png"
) => {
    if (!path) return fallback;
    if (typeof path === "string") {
        // If it's already a full URL (S3), return as-is
        if (path.startsWith("http")) return path;
        // Otherwise, prepend IMAGE_BASE_URL for local files
        return `${IMAGE_BASE_URL}/${path.startsWith("/") ? path.substring(1) : path}`;
    }
    // Handle S3 object format { url, public_id }
    if (path.url) {
        return path.url;
    }
    return fallback;
};
