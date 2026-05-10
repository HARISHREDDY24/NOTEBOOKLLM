import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import {
    RecursiveCharacterTextSplitter,
} from "@langchain/textsplitters";

import { HuggingFaceInferenceEmbeddings }
    from "@langchain/community/embeddings/hf";

import { QdrantVectorStore } from "@langchain/qdrant";

import Groq from "groq-sdk";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
    dest: "uploads/",
});

const PORT = 3000;




// ================= FREE EMBEDDINGS =================

const embeddings =
    new HuggingFaceInferenceEmbeddings({
        model: "sentence-transformers/all-MiniLM-L6-v2",
    });




// ================= ROOT =================

app.get("/", (req, res) => {
    res.send("Backend running successfully");
});




// ================= UPLOAD =================

app.post("/upload", upload.single("pdf"), async (req, res) => {

    try {

        const filePath = req.file.path;




        // ================= LOAD PDF =================

        const loader = new PDFLoader(filePath);

        const docs = await loader.load();




        // ================= CHUNKING =================

        const splitter =
            new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });

        const splitDocs =
            await splitter.splitDocuments(docs);




        // ================= VECTOR STORE =================

        await QdrantVectorStore.fromDocuments(
            splitDocs,
            embeddings,
            {
                url: process.env.QDRANT_URL,
                collectionName: "notebooklm",
            }
        );




        res.json({
            message:
                "PDF uploaded and indexed successfully",
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message,
        });
    }
});








// ================= ASK =================

app.post("/ask", async (req, res) => {

    try {

        const { question } = req.body;




        // ================= VECTOR STORE =================

        const vectorStore =
            await QdrantVectorStore.fromExistingCollection(
                embeddings,
                {
                    url: process.env.QDRANT_URL,
                    collectionName: "notebooklm",
                }
            );




        // ================= RETRIEVAL =================

        const retriever = vectorStore.asRetriever({
            k: 3,
        });

        const result =
            await retriever.invoke(question);




        // ================= CONTEXT =================

        const context = result
            .map((doc) => doc.pageContent)
            .join("\n\n");




        // ================= GROQ =================

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });




        // ================= LLM =================

        const response =
            await groq.chat.completions.create({

                model: "llama3-8b-8192",

                messages: [
                    {
                        role: "system",
                        content: `
You are a helpful AI assistant.

Answer ONLY using the provided context.

If answer is not present,
say:
"I could not find this in the uploaded document."

Context:
${context}
            `,
                    },

                    {
                        role: "user",
                        content: question,
                    },
                ],
            });




        res.json({
            answer:
                response.choices[0].message.content,
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message,
        });
    }
});








app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});