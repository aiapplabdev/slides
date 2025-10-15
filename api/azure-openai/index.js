const { DefaultAzureCredential, getBearerTokenProvider } = require('@azure/identity')

let azureClientPromise
async function getAzureClient(config) {
  if (!azureClientPromise) {
    azureClientPromise = import('openai').then((mod) => {
      if (!mod?.AzureOpenAI) {
        throw new Error('AzureOpenAI export not found in openai package.')
      }
      const credential = new DefaultAzureCredential()
      const tokenProvider = getBearerTokenProvider(credential, 'https://cognitiveservices.azure.com/.default')

      return new mod.AzureOpenAI({
        azureADTokenProvider: tokenProvider,
        endpoint: config.endpoint,
        apiVersion: config.apiVersion,
      })
    })
  }

  return azureClientPromise
}

module.exports = async function (context, req) {
  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2023-05-15'
    const chatDeployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT
    const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT

    if (!endpoint || !chatDeployment || !embeddingDeployment) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Missing Azure OpenAI configuration. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_CHAT_DEPLOYMENT, and AZURE_OPENAI_EMBEDDING_DEPLOYMENT.',
        },
      }
    }

    const { question, history, contextSections, mode, input, systemPrompt } = req.body || {}

    const client = await getAzureClient({ endpoint, apiVersion })

    if (mode === 'embedding') {
      const inputs = Array.isArray(input) && input.length > 0 ? input : [question]
      const embeddings = await client.embeddings.create({
        model: embeddingDeployment,
        input: inputs,
      })
      return { status: 200, headers: { 'Content-Type': 'application/json' }, body: embeddings }
    }

    if (!question || typeof question !== 'string') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Request must include a `question` string when requesting chat completions.' },
      }
    }

    const messages = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    if (contextSections) {
      messages.push({ role: 'system', content: contextSections })
    }
    if (Array.isArray(history)) {
      history.forEach((message) => {
        if (message?.role && message?.content) {
          messages.push({ role: message.role, content: message.content })
        }
      })
    }
    messages.push({ role: 'user', content: question })

    const completion = await client.chat.completions.create({
      model: chatDeployment,
      messages,
    })

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        answer: completion.choices[0]?.message?.content ?? '',
        usage: completion.usage,
      },
    }
  } catch (error) {
    context.log.error('Azure OpenAI function error', error)
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: error?.message || 'Azure OpenAI request failed.' },
    }
  }
}
