# VoiceUp

> A public, AI-powered accountability layer between citizens and their MPs.

Citizens report and upvote local problems by constituency. Claude clusters the noise into a ranked brief. Every MP gets a public scorecard — and silence becomes a data point.

---

## Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Nuxt_3-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white" alt="Nuxt 3" />
  <img src="https://img.shields.io/badge/Vue_3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Claude_AI-D97757?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude AI" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Pinia-FFD859?style=for-the-badge&logo=pinia&logoColor=black" alt="Pinia" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
</p>

| Layer | Choice |
|---|---|
| Frontend | Nuxt 3 (Vue 3) + TypeScript, Tailwind, shadcn-vue, Pinia |
| Backend | Node.js + Express + Mongoose (MongoDB Atlas) |
| AI | Claude API (Anthropic)  summarization, clustering, categorization |
| Voice / Local Language | GhanaNLP (Khaya) API  ASR + translation for Twi, Ewe, Ga |
| Auth | JWT (7-day access token) |
| Storage | MongoDB Atlas + Cloudinary (audio files) |

