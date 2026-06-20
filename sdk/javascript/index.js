// SCDL-RAG JavaScript SDK
const axios = require('axios');

class Client {
  constructor({ apiKey, baseURL = 'https://api.scdl-rag.com' }) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.http = axios.create({
      baseURL,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    });
  }

  async detect({ question, answer, documents, model = 'gpt-4' }) {
    const { data } = await this.http.post('/v1/detect', {
      question, answer,
      documents: documents.map(d => ({ id: d.id, content: d.content, title: d.title || '' })),
      model,
    });
    return data;
  }

  async detectAndFix({ question, answer, documents, documentPool = [], autoFix = true }) {
    const { data } = await this.http.post('/v1/detect-and-fix', {
      question, answer,
      documents: documents.map(d => ({ id: d.id, content: d.content, title: d.title || '' })),
      document_pool: documentPool.map(d => ({ id: d.id, content: d.content, title: d.title || '' })),
      auto_fix: autoFix,
    });
    return data;
  }

  async batchDetectAndFix({ cases, autoFix = true, batchId = null }) {
    const { data } = await this.http.post('/v1/batch/detect-and-fix', {
      batch_id: batchId,
      cases: cases.map(c => ({
        id: c.id,
        question: c.question,
        answer: c.answer,
        documents: (c.documents || []).map(d => ({ id: d.id, content: d.content, title: d.title || '' })),
      })),
      auto_fix: autoFix,
    });
    return data;
  }

  async health() {
    const { data } = await this.http.get('/v1/health');
    return data;
  }
}

module.exports = { Client };
