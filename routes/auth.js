const express = require("express");
const { objectRemoveEmpty } = require("../helpers/function");
const { db, checkAuth } = require("../firebase/helpers");
const { isEmpty } = require('lodash');
const routes = express.Router();

routes.post("/login", (req, res) => {
  // console.log("req",req?.params);
  const { email, password } = req.body;
  db.collection("users").where("email", "==", email).get()
    .then((snap) => {
      if (password === snap.docs[0]?.data().password) {
        return db.collection("access")
          .add({ userId: snap.docs[0].id })
          .then(({ id }) => {
            res.status(200).json({ accessToken: id });
          }).catch((error)=> console.log('error', error))
      } if (isEmpty(snap.docs)) {
        return res.status(400).json({ message: "Login failed, invalid information" });
      } else {
        return res.status(400).json({ message: "Login failed, invalid information" });
      }
    });
});

routes.post( "/logout",
  (req, res, next) => checkAuth(req, res, next),
  (req, res) => {
    const accessToken = req.headers["access-token"];
    db.collection("access")
      .doc(accessToken)
      .delete()
      .then(() => {
        res.status(200).json({ message: "Logout" });
      })
      .catch((error) =>
        res.status(500).json({ code: error, message: "Internal Server Error" })
      );
  }
);

routes.get("/git_user",
  (req, res, next) => checkAuth(req, res, next),
  (req, res) => {
    const accessToken = req.headers["access-token"];
    db.collection("access").doc(accessToken).get()
      .then((doc) => {
        db.collection("users").doc(doc.data().userId)
          .get().then((docUser) => {
            res.status(200).json({
              user: {
                role: docUser.data()?.role,
                mode: docUser.data()?.mode,
                email: docUser.data()?.email,
                photoURL: docUser.data()?.photoURL,
                display_name: docUser.data()?.display_name,
              },
            });
          });
      }).catch((error) => res.status(500).json({ code: error, message: "Internal Server Error" }));
  }
);

routes.post("/update_user",
  (req, res, next) => checkAuth(req, res, next),
  (req, res) => {
    const accessToken = req.headers["access-token"];
    const { email, display_name, mode } = req.body;
    db.collection("access").doc(accessToken).get()
      .then((doc) => {
        db.collection("users").doc(doc.data().userId)
          .update(objectRemoveEmpty({email, display_name, mode}))
          .then(() => res.status(200).send({ message: "User update successfully" }))
          .catch(() => res.status(400).send({ message: "Error User update" }));
      }).catch((error) => res.status(500).json({ code: error, message: "Internal Server Error" }));
  }
);

module.exports = routes;
