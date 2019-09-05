const { admin, db } = require('../util/admin');
const config = require('../config');
const firebase = require('firebase');
firebase.initializeApp(config);
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');

exports.signUp = (req, res) => {
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle
	};

	const { errors, valid } = validateSignupData(newUser);
	if (!valid) {
		return res.status(400).json({ errors });
	}

	const defaultImage = 'default-pp.png';

	let token, userId;
	db
		.doc(`/users/${newUser.handle}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return res.status(400).json({ handle: 'This handle is already taken' });
			} else {
				return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
			}
		})
		.then((data) => {
			userId = data.user.uid;
			return data.user.getIdToken();
		})
		.then((userToken) => {
			token = userToken;
			const userCredentials = {
				handle: newUser.handle,
				email: newUser.email,
				createdAt: new Date().toISOString(),
				imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultImage}?alt=media`,
				userId
			};
			return db.doc(`/users/${newUser.handle}`).set(userCredentials);
		})
		.then(() => {
			return res.status(201).json({ token });
		})
		.catch((e) => {
			console.error(e);
			if (e.code === 'auth/email-already-in-use') {
				return res.status(400).json({ email: 'Email already in use' });
			} else {
				return res.status(500).json({ error: e.code });
			}
		});
};

exports.login = (req, res) => {
	const user = {
		email: req.body.email,
		password: req.body.password
	};

	const { errors, valid } = validateLoginData(user);
	if (!valid) {
		return res.status(400).json({ errors });
	}

	firebase
		.auth()
		.signInWithEmailAndPassword(user.email, user.password)
		.then((data) => {
			return data.user.getIdToken();
		})
		.then((token) => {
			return res.status(200).json({ token });
		})
		.catch((e) => {
			console.error(e.code);
			if (e.code === 'auth/wrong-password') {
				return res.status(403).json({ general: 'Wrong credentials, please try again' });
			} else if (e.code === 'auth/user-not-found') {
				return res.status(403).json({ general: 'Wrong credentials, please try again' });
			} else {
				return res.status(500).json({ error: e.code });
			}
		});
};

exports.addUserDetails = (req, res) => {
	let userDetails = reduceUserDetails(req.body);
	db
		.doc(`/users/${req.user.handle}`)
		.update(userDetails)
		.then(() => {
			return res.json({ message: 'Details added successfully' });
		})
		.catch((e) => {
			console.error(e);
			return res.status(500).json({ e });
		});
};

exports.getAuthenticatedUser = (req, res) => {
	let userData = {};
	db
		.doc(`/users/${req.user.handle}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				userData.credentials = doc.data();
				return db.collection('likes').where('userHandle', '==', req.user.handle).get();
			}
		})
		.then((data) => {
			userData.likes = [];
			data.forEach((doc) => {
				userData.likes.push(doc.data());
			});
			return res.json(userData);
		})
		.catch((e) => {
			console.error(e);
			return res.status(500).json({ e });
		});
};

exports.uploadImage = (req, res) => {
	const BusBoy = require('busboy');
	const path = require('path');
	const os = require('os');
	const fs = require('fs');
	const busboy = new BusBoy({ headers: req.headers });
	let imageToBeUploaded = {};
	let imageFileName;

	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
		console.log(fieldname, file, filename, encoding, mimetype);
		if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
			return res.status(400).json({ error: 'Wrong file type submitted' });
		}
		const imageExtension = filename.split('.')[filename.split('.').length - 1];
		imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`;
		const filepath = path.join(os.tmpdir(), imageFileName);
		imageToBeUploaded = { filepath, mimetype };
		file.pipe(fs.createWriteStream(filepath));
	});
	busboy.on('finish', () => {
		admin
			.storage()
			.bucket()
			.upload(imageToBeUploaded.filepath, {
				resumable: false,
				metadata: {
					metadata: {
						contentType: imageToBeUploaded.mimetype
					}
				}
			})
			.then(() => {
				const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
				return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
			})
			.then(() => {
				return res.json({ message: 'Image successfully loaded' });
			})
			.catch((e) => {
				console.error(e);
				return res.status(500).json({ e });
			});
	});
	busboy.end(req.rawBody);
};