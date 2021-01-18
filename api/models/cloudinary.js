const cloudinary = require('cloudinary').v2;

require('dotenv').config();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const self = (module.exports = {
	uploadMultiple: (file) => {
		return new Promise((resolve) => {
			cloudinary.uploader
				.upload(file, {
					folder: 'home',
				})
				.then((result) => {
					if (result) {
						const fs = require('fs');
						fs.unlinkSync(file);
						resolve({
							url: result.secure_url,
							path: result.public_id,
						});
					}
				});
		});
	},

	reSizeImage: (id, h, w) => {
		return cloudinary.url(id, {
			height: h,
			width: w,
			crop: 'scale',
			format: 'jpg',
		});
	},
});
