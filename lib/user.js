const Promise = require('bluebird');
const low = require('lowdb');

const botkit = require('./botkit');
const config = require('./config');

const controller = botkit.controller;

function asyncRemoveUserFromWaitlist(id) {
  return new Promise((resolve, reject) => {
    const db = low(config.dbFile);
    db
      .get('waitlist')
      .remove({
        id: id
      })
      .write();

    console.log(`User ${id} removed from waitlist`);
    resolve();
  });
}

function asyncGetNumUsers() {
  return new Promise((resolve, reject) => {
    asyncGetAllUsers()
      .then(users => {
        resolve(users.length);
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
  });
}

function asyncGetAllUsers() {
  return new Promise((resolve, reject) => {
    controller.storage.users.all((err, all_user_data) => {
      if (err) {
        reject(err);
      } else {
        resolve(all_user_data);
      }
    });
  });
}

function asyncAddUserToWaitList(id) {
  return new Promise((resolve, reject) => {
    const db = low(config.dbFile);
    if (!!db.get('waitlist').find({ id: id }).value()) {
      reject(new Error('already_on_list'));
    } else {
      db.get('waitlist').push({ id: id }).write();
      resolve();
    }
  });
}

function asyncGetUsersOnWaitList() {
  return new Promise((resolve, reject) => {
    const db = low(config.dbFile);
    resolve(db.get('waitlist').value());
  });
}

module.exports = {
  asyncGetNumUsers: asyncGetNumUsers,
  asyncGetAllUsers: asyncGetAllUsers,
  asyncAddUserToWaitList: asyncAddUserToWaitList,
  asyncGetUsersOnWaitList: asyncGetUsersOnWaitList,
  asyncRemoveUserFromWaitlist: asyncRemoveUserFromWaitlist
};
