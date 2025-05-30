const { GoogleGenerativeAI } = require("@google/generative-ai");
const marked = require("marked"); // Import the marked library

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed. This function only accepts POST requests.",
        };
    }

    try {
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

        // The prompt remains the same to ask for 3-5 concepts, expecting markdown formatting
        const prompt = `Generate 3-5 creative and engaging YouTube thumbnail concepts for a video about "${videoTopic}". For each concept, suggest:
        - **Visual Idea:** (what should be in the image)
        - **Dominant Color Palette/Mood:** (suggestions for colors and overall feeling)
        - **Potential Text Overlay:** (short and catchy text)

        Format the output clearly using markdown, including bolding for concept titles and sub-sections, and bullet points for lists.`;

        const chat = model.startChat({
            history: [{
                role: "user",
                parts: [{ text: prompt }],
            }],
            generationConfig: {
                maxOutputTokens: 1000, // Increased from 200 to 1000 to allow full response
            },
        });

        const result = await chat.sendMessage(prompt);
        const responseText = await result.response.text();

        // Convert the markdown response to HTML
        const htmlConcepts = marked.parse(responseText);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ concepts: htmlConcepts }), // Send HTML back to the client
        };

    } catch (error) {
        console.error("Error in Netlify Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "An unexpected error occurred." }),
        };
    }
};
