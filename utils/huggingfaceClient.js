async function queryHuggingFace(prompt) {
	const { InferenceClient } = await import("@huggingface/inference");

	const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

	const response = await client.chatCompletion({
		provider: "novita",
		model: "meta-llama/Meta-Llama-3-70B-Instruct",
		messages: [
			{
				role: "user",
				content: prompt,
			},
		],
	});

	// Devuelve directamente el mensaje generado por la IA
	return response.choices[0].message.content;
}

module.exports = { queryHuggingFace };
