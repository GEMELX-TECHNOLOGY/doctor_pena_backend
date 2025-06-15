async function queryHuggingFace(prompt) {
  
  const { InferenceClient } = await import('@huggingface/inference');

  const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

  const response = await client.chatCompletion({
    provider: "novita",
    model: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0].message.content; 
}

module.exports = { queryHuggingFace };
