const { OpenAI } = require('openai');
const Document = require('../models/Document');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function processQuery(question, documentId) {
    try {
        // Get the document
        const document = await Document.findById(documentId);
        if (!document) {
            throw new Error('Document not found');
        }

        // Find the most relevant page (simplified - in production use vector search)
        const relevantPage = document.pages.find(page =>
            page.text.toLowerCase().includes(question.toLowerCase())
        ) || document.pages[0];

        // Create prompt for OpenAI
        const prompt = `
      You are an AI assistant helping users with their documents.
      The user has asked: "${question}"
      
      Here is the relevant content from the document (Page ${relevantPage.pageNumber}):
      ${relevantPage.text.substring(0, 2000)}
      
      Please provide a concise answer based on this content. If the answer isn't in the document,
      say "I couldn't find this information in the document."
    `;

        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful document assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500
        });

        return {
            answer: response.choices[0].message.content,
            citations: [{
                pageNumber: relevantPage.pageNumber,
                textExcerpt: relevantPage.text.substring(0, 200) + '...'
            }]
        };
    } catch (error) {
        console.error('AI processing error:', error);
        return {
            answer: "I encountered an error processing your question. Please try again.",
            citations: []
        };
    }
}

module.exports = { processQuery };