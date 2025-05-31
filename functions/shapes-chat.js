// netlify/functions/shapes-chat.js
const { OpenAI } = require("openai");

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed. This function only accepts POST requests.",
        };
    }

    try {
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
        const userId = event.headers['x-user-id'];
        const channelId = event.headers['x-channel-id'];

        // Debugging: Log received headers
        console.log('Netlify Function - Received X-User-Id:', userId);
        console.log('Netlify Function - Received X-Channel-Id:', channelId);

        if (!userMessage || !userId || !channelId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing message, X-User-Id, or X-Channel-Id in request." }),
            };
        }

        const shapes_client = new OpenAI({
            apiKey: shapesApiKey,
            baseURL: "https://api.shapes.inc/v1",
        });

        const response = await shapes_client.chat.completions.create({
            model: `shapesinc/${shapesShapeUsername}`,
            messages: [
                { role: "user", content: userMessage }
            ],
            extra_headers: {
                "X-User-Id": userId,
                "X-Channel-Id": channelId,
            }
        });

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
