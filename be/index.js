const app = require('./src/app');
require('dotenv').config();
const autoGenerateTrips = require('./src/tripAutoGenerator'); // 1. Import hàm vào

const PORT = process.env.PORT || 3036;
app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);

    await autoGenerateTrips();
});
