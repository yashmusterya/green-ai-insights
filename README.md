# Sustainify AI — Intelligence with a Lighter Carbon Footprint

Sustainify AI is a comprehensive dashboard designed to measure, analyze, and reduce the environmental impact of Generative AI systems. As AI adoption grows, so does its carbon footprint. This tool empowers developers and organizations to make data-driven decisions for greener AI implementations.

![Sustainify AI Banner](public/og-image.png)

## 🚀 Features

- **📊 Carbon Footprint Calculator**
  - Estimate CO2 emissions based on model type (GPT-4, Claude 3, etc.), token usage, and cloud region.
  - Visualizes energy consumption in kWh and carbon impact in kg.

- **✨ Prompt Optimizer**
  - AI-powered tool (powered by Gemini) that refines your prompts to be more concise.
  - Reduces token usage which directly lowers computational cost and energy consumption.
  - Displays estimate CO2 savings per prompt.

- **🌱 Sustainability Recommendations**
  - Get tailored, actionable advice to optimize your AI infrastructure.
  - Recommendations cover model selection, region shifting, and batch processing strategies.

- **💬 Green AI Assistant**
  - An interactive chatbot to answer questions about sustainable AI practices.
  - Powered by Google's Gemini Flash model for low-latency, efficient responses.

- **📈 Real-time Analytics Dashboard**
  - Track total emissions, energy usage, and sustainability scores over time.
  - Visualize trends with interactive charts.

## 🛠️ Tech Stack

- **Frontend**: 
  - [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vitejs.dev/) (Build tool)
  - [Tailwind CSS](https://tailwindcss.com/) (Styling)
  - [shadcn/ui](https://ui.shadcn.com/) (Component Library)
  - [Recharts](https://recharts.org/) (Data Visualization)

- **Backend**: 
  - [Supabase](https://supabase.com/) (Database, Auth, Edge Functions)
  - [Deno](https://deno.com/) (Runtime for Edge Functions)

- **AI**: 
  - [Google Gemini API](https://ai.google.dev/) (LLM for optimization and chat)

## 📂 Project Structure

```
green-ai-insights/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Main application pages (Dashboard, Calculator, etc.)
│   ├── contexts/        # React Contexts (Auth, Theme)
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Supabase client configuration
│   └── lib/             # Utilities and helpers
├── supabase/
│   └── functions/       # Edge functions (chat, calculate-emissions, etc.)
└── public/              # Static assets
```

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **bun**
- **Supabase CLI** (optional, for local backend development)
- A **Supabase** project
- A **Google Gemini API Key**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashmusterya/green-ai-insights.git
   cd green-ai-insights
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:8080`.

### Backend Setup (Supabase)

The backend logic resides in Supabase Edge Functions.

1. **Link your Supabase project**
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

2. **Set Secrets**
   Set your Google Gemini API key for the edge functions:
   ```bash
   npx supabase secrets set GEMINI_API_KEY=your_gemini_key
   ```

3. **Deploy Functions**
   ```bash
   npx supabase functions deploy
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
