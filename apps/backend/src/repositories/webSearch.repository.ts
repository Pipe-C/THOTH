export interface IWebSearchRepository {
  searchWeb(query: string): Promise<string>;
}

export class WebSearchRepository implements IWebSearchRepository {
  async searchWeb(query: string): Promise<string> {
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (!tavilyKey) return '';

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: 'basic',
          max_results: 3,
          include_answer: true,
        }),
      });

      if (!response.ok) return '';

      const data = (await response.json()) as {
        answer?: string;
        results?: Array<{ content: string; url: string }>;
      };

      const parts: string[] = [];
      if (data.answer) parts.push(data.answer);
      if (data.results) {
        parts.push(...data.results.map((r) => `Fuente: ${r.url}\n${r.content}`));
      }
      return parts.join('\n\n');
    } catch {
      return '';
    }
  }
}

export const webSearchRepository = new WebSearchRepository();
