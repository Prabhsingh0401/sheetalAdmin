import sanitizeHtml from "sanitize-html";

const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        for (const key in req.body) {
            if (typeof req.body[key] === "string") {
                req.body[key] = sanitizeHtml(req.body[key], {
                    allowedTags: [],
                    allowedAttributes: {}
                });
            }
        }
    }
    next();
};

export default sanitizeBody;
