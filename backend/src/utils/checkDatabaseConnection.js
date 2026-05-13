const { connectDatabase, mongoose } = require("../config/db");

const checkDatabaseConnection = async () => {
  try {
    await connectDatabase();
    console.log("Verification MongoDB reussie");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Verification MongoDB echouee");
    process.exit(1);
  }
};

checkDatabaseConnection();
