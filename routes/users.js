const express = require("express");
const { isEmpty } = require("lodash");
const multer = require("multer");
const { v4: uuidv4 } = require('uuid');
const { checkAuth, db, firebaseStorage } = require("../firebase/helpers");
const { emailFormat } = require("../helpers/validations");
const routes = express.Router();

routes.get("/",
  (req, res, next) => checkAuth(req, res, next),
  (_, res) => {
    let users = [];
    db.collection("users").get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          users = [...users, {
              userId: doc.id,
              role: doc.data()?.role,
              email: doc.data()?.email,
              photoURL: doc.data()?.photoURL,
              display_name: doc.data()?.display_name,
            }];
        });
        res.status(200).json({ users });
      });
  }
);

routes.post("/add",
  (req, res, next) => checkAuth(req, res, next),
  (req, res) => {
    const { email, password, password_confirm, display_name } = req.body;
    if (!emailFormat(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (!email || !password || !display_name) {
      return res.status(400).json({ message: "Email Password and Display Name are Required" });
    }
    if (password !== password_confirm) {
      return res.status(400).json({ message: "Password does not match" });
    }

    const usersDb = db.collection("users");
    usersDb.where("email", "==", email).get()
      .then((snap) => {
        if (isEmpty(snap.docs)) {
          const userData = {
            email,
            mode: 'light',
            password,
            display_name,
            photoURL: "",
            role: 1,
          };
          usersDb.add(userData)
            .then(({ id }) => res.status(200).json({ message: "Successfully create a user", userId: id }))
            .catch((error) => res.status(500).json({ code: error, message: "Internal Server Error" }));
        } else {
          res.status(400).json({ message: "Email already in use" });
        }
      });
  }
);

routes.delete("/delete",
  (req, res, next) => checkAuth(req, res, next),
  (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).send({ message: "Error: No User found" });
    }
  
    const docUser = db.collection("users").doc(userId);
    docUser.get().then((doc) => {
        if (!doc.data()) {
          return res.status(400).send({ message: "Error: No User found" });
        }
  
        docUser.delete().then(() =>
            res.status(200).send({ message: "User removed successfully" })
          ).catch(() =>res.status(400).send({ message: "Error removing user" }));
      }).catch(() => res.status(400).send({ message: "Internal Server Error" }));
  }
);

routes.post("/update_user",
  (req, res, next) => checkAuth(req, res, next),
  (req, res) => {
    const { email, display_name, userId } = req.body;
    if (userId) {
      db.collection("users")
      .doc(userId)
      .update({ email, display_name })
      .then(() => res.status(200).send({ message: "User update successfully" }))
      .catch(() => res.status(400).send({ message: "Error User update" }));
    }else{
      res.status(400).send({ message: "Error User No found" })
    }
  }
);

const upload = multer({
  storage: multer.memoryStorage(),
});

routes.post("/upload_profile",
  (req, res, next) => checkAuth(req, res, next),
  upload.single("file"),
  (req, res) => {
    if (!req.file && req.body.userId) {
      return res.status(400).send({ message:"Error: No files found" });
    }
    const blob = firebaseStorage.bucket().file(`uesr_photoURL/${uuidv4()}-${req.file.originalname}`);
    const blobWriter = blob.createWriteStream({
      public: true,
      metadata: {
        contentType: req.file.mimetype,
        metadata: { userId: req.body.userId },
      },
    });

    blobWriter.on("error", (err) => {
      console.log(err);
      res.status(400).send("Error file uploaded.");
    });

    blobWriter.on("finish", () => {
      db.collection("users").doc(req.body.userId)
        .update({ photoURL: blob.publicUrl() })
        .then(() => res.status(200).send({ message: "File uploaded" }))
        .catch(() =>res.status(400).send({ message: "Error: No files found" }));
    });

    blobWriter.end(req.file.buffer);
  }
);


module.exports = routes;
