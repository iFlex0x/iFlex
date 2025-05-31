// netlify/functions/shapes-chat.js
const { OpenAI } = require("openai");

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed. This function only accepts POST requests.",
        };
    }

    try {
        // Retrieve API key and shape username from Netlify environment variables
        const shapesApiKey = process.env.SHAPESINC_API_KEY;
        const shapesShapeUsername = process.env.SHAPESINC_SHAPE_USERNAME;

        if (!shapesApiKey || !shapesShapeUsername) {
            console.error("Missing SHAPESINC_API_KEY or SHAPESINC_SHAPE_USERNAME environment variables.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server configuration error: Shapes API credentials not found." }),
            };
        }

        const body = JSON.parse(event.body);
        const userMessage = body.message;
        const userId = event.headers['x-user-id']; // Get X-User-Id from request headers
        const channelId = event.headers['x-channel-id']; // Get X-Channel-Id from request headers

        if (!userMessage || !userId || !channelId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing message, X-User-Id, or X-Channel-Id in request." }),
            };
        }

        // Initialize Shapes API client
        const shapes_client = new OpenAI({
            apiKey: shapesApiKey,
            baseURL: "https://api.shapes.inc/v1",
        });

        // Make the API call to Shapes.inc
        const response = await shapes_client.chat.completions.create({
            model: `shapesinc/${shapesShapeUsername}`, // Use the configured shape username
            messages: [
                { role: "user", content: userMessage }
            ],
            // Pass custom headers for user identification and conversation context
            extra_headers: {
                "X-User-Id": userId,
                "X-Channel-Id": channelId,
            }
        });

        // Extract the bot's response
        const botResponse = response.choices[0].message.content;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ response: botResponse }),
        };

    } catch (error) {
        console.error("Error in Shapes API Netlify Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "An unexpected error occurred with the AI bot." }),
        };
    }
};
