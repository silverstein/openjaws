# API Keys Explained for Beach Panic

## What API Keys Do I Need?

### Required for Full AI Features:
1. **ANTHROPIC_API_KEY** - Powers the intelligent shark AI with Claude 4
2. **GOOGLE_GENERATIVE_AI_API_KEY** - Powers beach NPCs with Gemini 2.0 Flash

### NOT Required:
- **VERCEL_AI_GATEWAY_API_KEY** - This is an optional alternative that could replace both keys above

## How the AI System Works

### With API Keys:
- **Shark AI** uses Claude 4 for complex decision making
- **NPCs** use Gemini 2.0 Flash for cost-efficient dialogue
- Real-time responses with genuine AI intelligence

### Without API Keys (Mock Mode):
- Clever pre-written responses based on game context
- Pattern matching for believable shark behavior
- Still feels intelligent thanks to our mock system
- Perfect for testing or playing without costs

## AI Usage Limits

The game tracks API usage and has three modes:
1. **Real AI** (🟢) - Full intelligence with API calls
2. **Cached** (🟡) - Reuses similar previous responses
3. **Mock** (🔵) - Pre-written intelligent responses

After 100 API calls (configurable), the system switches to mock mode automatically.

## Getting Your API Keys

### Anthropic (Claude 4)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy and paste into `.env.local`

### Google (Gemini)
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create API key (it's free!)
4. Copy and paste into `.env.local`

## Cost Estimates

With normal gameplay:
- **Anthropic**: ~$0.01-0.03 per game session
- **Google**: ~$0.001-0.005 per game session
- **Total**: Less than $0.05 per game

The caching system and mock mode keep costs very low!

## Vercel AI SDK v5

The game uses Vercel AI SDK v5 (beta) which provides:
- Unified API for all AI providers
- Automatic streaming responses
- Built-in error handling
- Easy provider switching

You do NOT need a Vercel account or AI Gateway access - just the API keys from the providers directly.