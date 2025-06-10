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
        // Retrieve SHAPESINC_SHAPE_USERNAME from environment variables
        const shapesShapeUsername = process.env.SHAPESINC_SHAPE_USERNAME;

        if (!shapesShapeUsername) {
            console.error("Missing SHAPESINC_SHAPE_USERNAME environment variable.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server configuration error: Shape username not found." }),
            };
        }

        const body = JSON.parse(event.body);
        const userMessage = body.message;

        // Retrieve authentication headers passed from the frontend
        const appId = event.headers['x-app-id'];       // Application ID for Shapes.inc
        const userAuthToken = event.headers['x-user-auth']; // User's authentication token from Shapes.inc
        const channelId = event.headers['x-channel-id']; // Channel ID for conversation context

        // Debugging: Log received headers and message
        console.log('Shapes-chat function - Received Message:', userMessage);
        console.log('Shapes-chat function - Received X-App-ID:', appId);
        console.log('Shapes-chat function - Received X-User-Auth (partial):', userAuthToken ? userAuthToken.substring(0, 10) + '...' : 'N/A');
        console.log('Shapes-chat function - Received X-Channel-Id:', channelId);

        if (!userMessage || !appId || !userAuthToken || !channelId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing message, X-App-ID, X-User-Auth, or X-Channel-Id in request." }),
            };
        }

        // Initialize OpenAI client.
        // When X-App-ID and X-User-Auth are provided in defaultHeaders,
        // the apiKey can be "not-needed" or empty string as authentication is via the user token.
        const shapes_client = new OpenAI({
            apiKey: "not-needed", // API key not required here if authenticated via X-User-Auth
            baseURL: "https://api.shapes.inc/v1",
            defaultHeaders: {
                "X-App-ID": appId,
                "X-User-Auth": userAuthToken,
            },
        });

        // The 'store: false' parameter instructs the API not to persist chat history server-side.
        // This is still good practice to explicitly state, though user auth handles much of it.
        console.log('Calling Shapes.inc API with user auth and store: false');
        const response = await shapes_client.chat.completions.create({
            model: `shapesinc/${shapesShapeUsername}`,
            messages: [
                { role: "user", content: userMessage }
            ],
            extra_headers: {
                // X-Channel-Id is still useful for distinguishing multiple concurrent chats
                // from the same authenticated user.
                "X-Channel-Id": channelId,
                "store": "false" // Shapes API documentation implies this for explicit storage control
            }
        });

        const botResponse = response.choices[0].message.content;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ response: botResponse }),
        };

    } catch (error) {
        console.error("Error in Shapes API Netlify Function (shapes-chat):", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "An unexpected error occurred with the AI bot." }),
        };
    }
};
