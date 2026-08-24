require("dotenv").config();

const mongoose = require("mongoose");
const Waitlist = require("./models/Waitlist");

const fixWaitlistPositions = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI;

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected.");

    const eventId =
      "6a89d70b506b86f7f00ef7aa";

    const seatCategory =
      "Premium";

    const entries =
      await Waitlist.find({
        eventId,
        seatCategory,
        status: {
          $in: [
            "waiting",
            "notified",
          ],
        },
      }).sort({
        createdAt: 1,
      });

    console.log(
      `Found ${entries.length} active Premium waitlist entry(s).`
    );

    for (
      let i = 0;
      i < entries.length;
      i++
    ) {
      entries[i].position =
        i + 1;

      await entries[i].save();

      console.log(
        `${entries[i]._id} -> position #${i + 1}`
      );
    }

    console.log(
      "\nWaitlist positions fixed successfully."
    );

    await mongoose.disconnect();

    console.log(
      "MongoDB disconnected."
    );

  } catch (error) {
    console.error(
      "ERROR:",
      error.message
    );

    try {
      await mongoose.disconnect();
    } catch (e) {}
  }
};

fixWaitlistPositions();