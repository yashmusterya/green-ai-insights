# Sustainify AI — Intelligence with a Lighter Carbon Footprint

Sustainify AI helps you measure, analyze, and reduce the environmental impact of your Generative AI systems. Calculate carbon footprint, optimize prompts, and get AI-powered sustainability recommendations.

## Features

- **Carbon Calculator**: Estimate the carbon emissions of your AI models based on token usage, model type, and cloud region.
- **Prompt Optimizer**: AI-powered tool to refine your prompts, reducing token count and energy consumption while maintaining intent.
- **Sustainability Recommendations**: Get tailored actionable advice to lower your AI infrastructure's carbon footprint.
- **Interactive Chat**: Ask questions about Green AI practices and receive expert guidance.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Edge Functions, Database, Auth)
- **AI Integration**: Google Gemini (via Supabase Edge Functions)
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js & npm installed
- Supabase account and project
- Google Gemini API Key

### Installation

1. Clone the repository:
   ```sh
   git clone <YOUR_GIT_URL>
   cd green-ai-insights
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up Environment Variables:
   - Create a `.env` file based on `.env.example` (if available) or ensure your Supabase project is linked.
   - Set `GEMINI_API_KEY` in your Supabase Edge Functions secrets.

4. Start the development server:
   ```sh
   npm run dev
   ```

## Deployment

This project is configured for deployment on platforms like Vercel or Netlify. Ensure you also deploy the Supabase Edge Functions.

```sh
supabase functions deploy
```
