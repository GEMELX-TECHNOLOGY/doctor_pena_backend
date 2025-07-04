const multer = require("multer");
const path = require("node:path");

const storage = multer.diskStorage({
	destination: "public/uploads/",
	filename: (_req, file, cb) => {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});

const upload = multer({ storage });

module.exports = upload;
