const initMongo = async () => {
  try {
    const geneticDataSchema = new mongoose.Schema({
      userId: { type: String, required: true },
      geneticData: {
        geneticTestDate: { type: Date, required: true },
        fileUrl: { type: String, required: true },
        processedResults: {
          pharmcatReport: { type: String, required: true },
          geneVariants: { type: [String], required: true },
        },
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    });

    mongoose.model("GeneticData", geneticDataSchema);
    console.log("MongoDB collections are set up.");
  } catch (error) {
    console.error("Error setting up MongoDB collections:", error);
    throw error;
  }
};

export default initMongo;
