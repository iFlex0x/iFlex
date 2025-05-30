const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed. This function only accepts POST requests.",
        };
    }

    try {
        // Retrieve the API key from Netlify's environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY environment variable is not set.");
            return {
                statusCode: 500,
                body: "Server configuration error: API Key not found.",
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const body = JSON.parse(event.body);
        const videoTopic = body.topic;

        if (!videoTopic) {
            return {
                statusCode: 400,
                body: "Missing 'topic' in request body.",
            };
        }

        const prompt = `Generate 3-5 creative and engaging YouTube thumbnail concepts for a video about "${videoTopic}". For each concept, suggest:
        - A visual idea (what should be in the image)
        - A dominant color palette/mood
        - A potential text overlay (short and catchy)

        Format the output clearly with bullet points for each concept.`;

        const chat = model.startChat({
            history: [{
                role: "user",
                parts: [{ text: prompt }],
            }],
            generationConfig: {
                maxOutputTokens: 200,
            },
        });

        const result = await chat.sendMessage(prompt);
        const responseText = await result.response.text();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ concepts: responseText }),
        };

    } catch (error) {
        console.error("Error in Netlify Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "An unexpected error occurred." }),
        };
    }
};
