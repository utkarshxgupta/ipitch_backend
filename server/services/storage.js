const { Storage } = require("@google-cloud/storage");
const path = require("path");

// Initialize storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);

class StorageService {
  async uploadFile(file) {
    try {
      // Create a unique filename
      const fileName = `${Date.now()}-${file.originalname}`;

      // Create a reference to the new file
      const blob = bucket.file(fileName);

      // Create a write stream
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
        },
      });

      // Return promise
      return new Promise((resolve, reject) => {
        blobStream.on("error", (error) => {
          reject(error);
        });
        blobStream.on("finish", async () => {
          // Get the public URL
          const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

          resolve({
            fileName: fileName,
            fileUrl: url,
          });
        });
        // Add timeout handling
        blobStream.on("timeout", () => {
          reject(new Error("Upload timeout"));
        });

        // Send the file to Google Cloud Storage
        blobStream.end(file.buffer);
      });
    } catch (error) {
      console.error("Storage service error:", error);
      throw error;
    }
  }

  /**
   * Upload audio file specifically for transcription
   * @param {Object} file File object with buffer, originalname, and mimetype
   * @param {string} prefix Optional folder prefix for organizing files
   * @returns {Promise<Object>} Object with fileName and fileUrl
   */
  async uploadAudioFile(file, prefix = '') {
    try {
      // Create a unique filename
      const fileName = prefix 
        ? `${prefix}/${Date.now()}-${file.originalname}`
        : `${Date.now()}-${file.originalname}`;

      // Create a reference to the new file
      const blob = bucket.file(fileName);

      // Create a write stream
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
        },
      });

      // Return promise
      return new Promise((resolve, reject) => {
        blobStream.on("error", (error) => {
          reject(error);
        });
        blobStream.on("finish", async () => {
          // Get the public URL
          const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

          resolve({
            fileName: fileName,
            fileUrl: url,
          });
        });
        // Add timeout handling
        blobStream.on("timeout", () => {
          reject(new Error("Upload timeout"));
        });

        // Send the file to Google Cloud Storage
        blobStream.end(file.buffer);
      });
    } catch (error) {
      console.error("Storage service error:", error);
      throw error;
    }
  }

  async deleteFile(fileName) {
    try {
      await bucket.file(fileName).delete();
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  }
}

module.exports = new StorageService();
