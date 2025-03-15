const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
const { helpers } = require('@google-cloud/aiplatform');

class EmbeddingService {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.location = 'asia-south1';
    this.modelId = 'text-embedding-005';
    this.client = new PredictionServiceClient({
      apiEndpoint: 'asia-south1-aiplatform.googleapis.com',
    });
    this.endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelId}`;
  }

  async getEmbeddings(text) {
    try {
      // Convert text to proper instance format
      const instance = helpers.toValue({
        content: text,
        task_type: 'SEMANTIC_SIMILARITY'
      });

      // Prepare the prediction request
      const request = {
        endpoint: this.endpoint,
        instances: [instance],
        parameters: helpers.toValue({})
      };

      // Make the prediction request
      const [response] = await this.client.predict(request);
      
      // Extract embeddings from response
      const embedding = response.predictions[0];
      const embeddingsProto = embedding.structValue.fields.embeddings;
      const valuesProto = embeddingsProto.structValue.fields.values;
      const embeddings = valuesProto.listValue.values.map(v => v.numberValue);

      return embeddings;
    } catch (error) {
      console.error('Error getting embeddings:', error);
      throw error;
    }
  }

  calculateCosineSimilarity(embeddings1, embeddings2) {
    if (!embeddings1 || !embeddings2 || embeddings1.length !== embeddings2.length) {
      return 0;
    }

    const dotProduct = embeddings1.reduce((sum, val, i) => sum + val * embeddings2[i], 0);
    const magnitude1 = Math.sqrt(embeddings1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embeddings2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  calculateSemanticScore(similarity) {
    // Convert similarity (-1 to 1) to a score (0 to 100)
    return Math.round(((similarity + 1) / 2) * 100);
  }
}

module.exports = new EmbeddingService();