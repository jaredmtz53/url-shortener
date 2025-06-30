import {rateLimit} from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 50, // Limit each IP to 30 requests per windowMs
    message: "Too many requests, please try again later.",
})

export default limiter;