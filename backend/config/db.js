const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

    const uri = process.env.MONGO_URI;
    console.log(
      "URI starts with:",
      uri ? uri.substring(0, 40) : "undefined"
    );

    await mongoose.connect(uri);

    console.log("MongoDB Connected");
  } catch (err) {
    console.error("Mongo Error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
