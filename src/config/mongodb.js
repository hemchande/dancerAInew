import { MongoClient } from 'mongodb';

const MONGO_URI = "mongodb+srv://hemchande:He10072638@cluster0.r51ez.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Database schemas
const schemas = {
  users: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["email", "password", "role", "createdAt"],
        properties: {
          email: {
            bsonType: "string",
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
          },
          password: {
            bsonType: "string",
            minLength: 6
          },
          role: {
            enum: ["instructor", "performer"]
          },
          name: {
            bsonType: "string"
          },
          profilePicture: {
            bsonType: "string"
          },
          createdAt: {
            bsonType: "date"
          },
          lastLogin: {
            bsonType: "date"
          }
        }
      }
    }
  },
  aiReports: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "videoId", "transcript", "feedback", "createdAt"],
        properties: {
          userId: {
            bsonType: "objectId"
          },
          videoId: {
            bsonType: "string"
          },
          transcript: {
            bsonType: "string"
          },
          feedback: {
            bsonType: "array",
            items: {
              bsonType: "object",
              required: ["role", "message", "timestamp"],
              properties: {
                role: {
                  enum: ["user", "ai"]
                },
                message: {
                  bsonType: "string"
                },
                timestamp: {
                  bsonType: "date"
                }
              }
            }
          },
          createdAt: {
            bsonType: "date"
          },
          updatedAt: {
            bsonType: "date"
          }
        }
      }
    }
  },
  chatSessions: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "messages", "createdAt"],
        properties: {
          userId: {
            bsonType: "objectId"
          },
          title: {
            bsonType: "string"
          },
          messages: {
            bsonType: "array",
            items: {
              bsonType: "object",
              required: ["role", "content", "timestamp"],
              properties: {
                role: {
                  enum: ["user", "assistant", "system"]
                },
                content: {
                  bsonType: "string"
                },
                timestamp: {
                  bsonType: "date"
                }
              }
            }
          },
          createdAt: {
            bsonType: "date"
          },
          updatedAt: {
            bsonType: "date"
          }
        }
      }
    }
  }
};

// Create indexes for better query performance
const indexes = {
  users: [
    { key: { email: 1 }, unique: true },
    { key: { role: 1 } }
  ],
  aiReports: [
    { key: { userId: 1 } },
    { key: { videoId: 1 } },
    { key: { createdAt: -1 } }
  ],
  chatSessions: [
    { key: { userId: 1 } },
    { key: { createdAt: -1 } }
  ]
};

let client;
let db;

export const connectToDatabase = async () => {
  try {
    client = await MongoClient.connect(MONGO_URI);
    db = client.db("dance_ai_assistant");
    
    // Create collections with schemas
    for (const [collectionName, schema] of Object.entries(schemas)) {
      await db.createCollection(collectionName, schema);
    }
    
    // Create indexes
    for (const [collectionName, collectionIndexes] of Object.entries(indexes)) {
      const collection = db.collection(collectionName);
      for (const index of collectionIndexes) {
        await collection.createIndex(index.key, { unique: index.unique });
      }
    }
    
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export const getDb = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase first.");
  }
  return db;
};

export const closeDatabase = async () => {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
}; 