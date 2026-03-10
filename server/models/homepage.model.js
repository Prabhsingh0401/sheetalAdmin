import mongoose from "mongoose";

const homepageSchema = new mongoose.Schema(
    {
        sections: {
            topInfo:                { type: Boolean, default: true },
            homeBanner:             { type: Boolean, default: true },
            aboutSBS:               { type: Boolean, default: true },
            hiddenBeauty:           { type: Boolean, default: true },
            trendingThisWeek:       { type: Boolean, default: true },
            newArrivals:            { type: Boolean, default: true },
            collections:            { type: Boolean, default: true },
            timelessWomenCollection:{ type: Boolean, default: true },
            instagramDiaries:       { type: Boolean, default: true },
            testimonials:           { type: Boolean, default: true },
            blogs:                  { type: Boolean, default: true },
            bookAppointmentWidget:  { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

const Homepage = mongoose.model("Homepage", homepageSchema);
export default Homepage;