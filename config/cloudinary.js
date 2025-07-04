const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("node:path");
require("dotenv").config();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage para documentos
const documentsStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "documents",
		allowed_formats: ["jpg", "png", "jpeg", "pdf"],
		public_id: (_req, file) =>
			`${Date.now()}-${path.parse(file.originalname).name}`,
	},
});

// Storage para fotos de perfil
const profileStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "profile_pictures",
		allowed_formats: ["jpg", "png", "jpeg"],
		public_id: (_req, file) =>
			`${Date.now()}-${path.parse(file.originalname).name}`,
	},
});

const uploadDocuments = multer({ storage: documentsStorage });
const uploadProfile = multer({ storage: profileStorage });

module.exports = { cloudinary, uploadDocuments, uploadProfile };
