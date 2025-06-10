const axios = require('axios');
const AUTH_BASE_URL = "https://api.shapes.inc/auth";

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed. This function only accepts POST requests.",
        };
    }

    try {
        const shapesApiKey = process.env.SHAPESINC_API_KEY;
        const shapesAppId = process.env.SHAPESINC_APP_ID;

        if (!shapesApiKey || !shapesAppId) {
            console.error("Missing SHAPESINC_API_KEY or SHAPESINC_APP_ID environment variables.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server configuration error: Shapes API credentials or App ID not found." }),
            };
        }

        const body = JSON.parse(event.body);
        const oneTimeCode = body.oneTimeCode;

        console.log('Exchange-token function - Received oneTimeCode:', oneTimeCode);
        console.log('Exchange-token function - Using App ID:', shapesAppId);

        if (!oneTimeCode) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing oneTimeCode' }),
            };
        }

        const response = await axios.post(`${AUTH_BASE_URL}/nonce`, {
            app_id: shapesAppId,
            code: oneTimeCode,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${shapesApiKey}`
            }
        });

        const data = response.data;

        if (response.status === 200 && data.auth_token) {
            console.log('Successfully exchanged code for auth_token.');
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auth_token: data.auth_token }),
            };
        } else {
            console.error('Failed to exchange code for token:', data.message || 'Unknown error');
            return {
                statusCode: response.status || 500,
                body: JSON.stringify({ message: data.message || 'Failed to exchange code for token.' }),
            };
        }
    } catch (error) {
        console.error('Error in Shapes API Netlify Function (exchange-token):', error.message);
        const errorMessage = error.response ? error.response.data.message : error.message;
        return {
            statusCode: error.response ? error.response.status : 500,
            body: JSON.stringify({ message: `Server error: ${errorMessage}` }),
        };
    }
};
