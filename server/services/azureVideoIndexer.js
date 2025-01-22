const axios = require('axios');

class AzureVideoIndexer {
  constructor() {
    this.accountId = process.env.AZURE_ACCOUNT_ID;
    this.apiKey = process.env.AZURE_API_KEY;
    this.location = process.env.AZURE_LOCATION;
  }

  async getAccessToken() {
    const tokenUrl = `https://api.videoindexer.ai/auth/${this.location}/Accounts/${this.accountId}/AccessToken?allowEdit=true`;
    const { data } = await axios.get(tokenUrl, {
      headers: { 'Ocp-Apim-Subscription-Key': this.apiKey },
    });
    console.log('token: ', data);
    return data;
  }

  async uploadVideo(videoUrl, videoName = 'submission') {
    const token = await this.getAccessToken();
    const uploadUrl = `https://api.videoindexer.ai/${this.location}/Accounts/${this.accountId}/Videos?name=${videoName}&videoUrl=${encodeURIComponent(videoUrl)}&accessToken=${token}&sendSuccessEmail=false`;
    const { data } = await axios.post(uploadUrl, null, {
      headers: { 'Ocp-Apim-Subscription-Key': this.apiKey },
    });
    console.log('upload: ', data);
    return data;
  }

  async getVideoInsights(videoId) {
    const token = await this.getAccessToken();
    const insightsUrl = `https://api.videoindexer.ai/${this.location}/Accounts/${this.accountId}/Videos/${videoId}/Index?accessToken=${token}`;
    const { data } = await axios.get(insightsUrl, {
      headers: { 'Ocp-Apim-Subscription-Key': this.apiKey },
    });
    console.log('insights: ', data);
    return data;
  }
}

module.exports = new AzureVideoIndexer();