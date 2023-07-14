var user;
var joinedRoom = { roomName: 'Select group', roomId: 'xxxx' };
var privateMessageTo;
var lastRoom;
var removaleRoomFroomList;
function databaseRun() {
  user = User;
  console.log('..........DATABASE RUNNING.......', User);
  ///////REGISTER USER ON SOCKET
  registerOnSocket();

  // FEATCHING DATA TO PRINT USER
  db.collection('usersDAO').onSnapshot(
    (querySnapshot) => {
      var users = [];
      // querySnapshot.forEach((doc) => {
      //   // console.log(doc.id, " => ", doc.data());
      // });

      printAllUser(querySnapshot.docs);
    },
    (error) => {
      console.error('Error getting documents:', error);
    }
  );

  // db.collection('usersDAO')
  //   .where('status', '==', 'false')
  //   .onSnapshot(
  //     (querySnapshot) => {
  //       var users = [];
  //       querySnapshot.forEach((doc) => {
  //         // console.log(doc.id, " => ", doc.data());
  //       });

  //       printOfflineUser(querySnapshot.docs);
  //     },
  //     (error) => {
  //       console.error('Error getting documents:', error);
  //     }
  //   );

  ///////////FEATCHING ALL USER FROM DATABASE

  // db.collection('group').onSnapshot(
  //   (querySnapshot) => {
  //     var room = [];
  //     querySnapshot.forEach((doc) => {
  //       // console.log(doc.id, " => ", doc.data());
  //       //  console.log(doc.id, " => ", doc.data());
  //     });

  //     printAllRoom(querySnapshot.docs);
  //   },
  //   (error) => {
  //     console.error('Error getting documents:', error);
  //   }
  // );

  updateRoomKist();

  const setProfileIn = Math.floor(Math.random() * (30000 - 9000 + 1)) + 9000;
  if (!User.username) {
    // console.log('chal gaya')
    setTimeout(setProfileDetails, setProfileIn);
  }

  const userID = User.id;

  const userRef = firestore.collection('usersDAO').doc(userID);

  console.log('.............. FEATCJINNG USER DATA...................');
  userRef.onSnapshot(
    (doc) => {
      const data = doc.data();
      // console.log(data, User);
      printUserInfo(data);
    },
    (error) => {
      console.error('Error getting documents:', error);
    }
  );

  ///////// FEATCHING ALL STATUS

  db.collection('usersDAO').onSnapshot(
    (querySnapshot) => {
      var users = [];

      querySnapshot.forEach((e) => {
        console.log(e.data());
      });
      printAllStatus(querySnapshot.docs);
    },
    (error) => {
      console.error('Error getting documents:', error);
    }
  );

  // const statusFedRef = db.collection('usersDAO').doc(User.id).collection('statusFed').orderBy('postTime', 'desc');
  // statusFedRef.onSnapshot((querySnapshot) => {
  //   // console.log(querySnapshot.docs)
  //   printAllStatus({ User, docs : querySnapshot.docs});
  // });

  ////////////////////////FEATCHING ALL CALL LOGS////////////////////////////////

  const callLogsRef = db.collection('usersDAO').doc(User.id).collection('callLogs').orderBy('startTime', 'desc');
  callLogsRef.onSnapshot((querySnapshot) => {
    // console.log(querySnapshot.docs)
    printCallHistory(querySnapshot.docs);
  });

  ////////////////////////////////////database end////////////////////////////////

  document.querySelector('.loading-page').style.display = 'none';
}

//////////////////////////////////////////FUNCTIONS///////////////////

function updateRoomKist() {
  db.collection('group').onSnapshot(
    (querySnapshot) => {
      var room = [];
      querySnapshot.forEach((doc) => {
        // console.log(doc.id, " => ", doc.data());
        //  console.log(doc.id, " => ", doc.data());
      });

      printAllRoom(querySnapshot.docs);
    },
    (error) => {
      console.error('Error getting documents:', error);
    }
  );
}

/////////////////////////// CALL HISTORY SETUP////////////////////////////////

function calllogUpdate({ private, callTo, callerName, type }) {
  // Get the file that was selected

  // Add a new call log to the user's call logs collection
  const callLogRef = db.collection('usersDAO').doc(User.id).collection('callLogs').doc();
  const callLogId = callLogRef.id;
  const callLog = {
    private,
    callTo,
    callerName: callerName || 'private',
    startTime: new Date(),
    type,
  };
  callLogRef
    .set(callLog)
    .then(() => {
      console.log('done', callLogId);
    })
    .catch((error) => {
      console.error('Error saving call log: ', error);
    });
}

/////////////////////////////UPDATE PROFILE

function setProfileDetails() {
  floaterClose.style.display = 'initial';
  userProfileDiv.style.display = 'initial';
}

function updateProfile(update) {
  // Get the file that was selected

  const username = update.name;
  const about = update.about;
  const file = update.photo.files[0] || '';
  // console.log(update, username, about, file);

  // Create a reference to the file in Firebase Storage
  const storageRef = storage.ref().child(`profile/user_${User.id}/${file.name}`);

  // Upload the file to Firebase Storage
  storageRef
    .put(file)
    .then((snapshot) => {
      // Get the download URL for the uploaded file
      return snapshot.ref.getDownloadURL();
    })
    .then((downloadURL) => {
      // Update the user's Firestore document with the download URL
      const userId = firebase.auth().currentUser.uid;
      const userRef = firestore.collection('usersDAO').doc(userId);
      // console.log(userId);
      return userRef.update({
        username: update.name,
        about: update.about,
        profileImg: downloadURL,
      });
    })
    .catch((error) => {
      console.log(error.message);
    });
}

////CREATING NEW GROUP

var newGroupName = document.querySelector('.grp-input');
document.querySelector('.g-next').addEventListener('click', () => {
  var room = newGroupName.value;

  const newRoom = {
    roomMembers: firebase.firestore.FieldValue.arrayUnion(User.id),
    roomName: room,
    grpImg:
      'https://firebasestorage.googleapis.com/v0/b/whatsappclone-d3f9a.appspot.com/o/defaultprofile%2Fdefault-organization-logo-6aecc771.gif?alt=media&token=6f43c913-7223-4ba7-811a-a3ab55498249',
    // merberIds: [user.id]z
  };

  db.collection('group')
    .add(newRoom)
    .then((docRef) => {
      db.collection('group')
        .doc(docRef.id)
        .get()
        .then((doc) => {
          if (doc.exists) {
            // console.log("User fields:", doc.data());

             if (removaleRoomFroomList) {
               const userRef = db.collection('group').doc(removaleRoomFroomList.roomId);

               userRef
                 .update({
                   roomMembers: firebase.firestore.FieldValue.arrayRemove(User.id),
                 })
                 .then(() => {
                   console.log(`User removed from ${User} field`);
                 })
                 .catch((error) => {
                   console.error(`Error removing user from  field: ${error}`);
                 });
             }
             
             console.log(lastRoom, joinedRoom, 'joinedRoom');
             
             lastRoom = joinedRoom;
             joinedRoom = doc.data();
             
             joinedRoom.roomId = doc.id;
             removaleRoomFroomList = joinedRoom;
             console.log(removaleRoomFroomList.roomId);  

            document.querySelector('.room-s');


            


            // console.log(lastRoom, joinedRoom, 'joinedRoom');
            joinRoom({ joinedRoom, lastRoom });

            // console.log('No such document!');
          } else {
          }
        })
        .catch((err) => {
          console.log(err);
        });

      // close the create modal & reset form
      console.log('created group');
    })
    .catch((err) => {
      console.log(err.message);
    });

  document.querySelector('.send').style.display = 'initial';
  document.querySelector('.p-send').style.display = 'none';
  output.innerHTML = '';
});

/////U{LOADING IMG FOR STATUS }

const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
  // Get the file that was selected
  const file = event.target.files[0];
  console.log(event, file);

  // Create a reference to the file in Firebase Storage
  const storageRef = storage.ref().child(`status/user_${User.id}/${file.name}`);

  // Update the user's Firestore document with the download URL
  const userId = firebase.auth().currentUser.uid;
  const userRef = firestore.collection('usersDAO').doc(userId);
  // console.log(userId);

  var status;
  // Upload the file to Firebase Storage
  storageRef
    .put(file)
    .then((snapshot) => {
      // Get the download URL for the uploaded file
      return snapshot.ref.getDownloadURL();
    })
    .then((downloadURL) => {
      status = {
        post: downloadURL,
        timestamp: new Date(),
      };

      return userRef.update({
        status: firebase.firestore.FieldValue.arrayUnion(status),
      });
    })
    .catch((error) => {
      console.log(error.message);
    });

  // Set a timer to delete the status update after 24 hours
  setTimeout(() => {
    firebase
      .firestore()
      .collection('usersDAO')
      .doc(userId)
      .get()
      .then((doc) => {
        const status = doc.data().status;
        const updatedstatus = status.filter((statusUpdate) => {
          // Return only the status updates that were added more than 24 hours ago
          return Date.now() - statusUpdate.timestamp.toDate().getTime() > 86400000;
        });
        // Update the user document with the new status updates array
        firebase.firestore().collection('users').doc(userId).update({
          status: updatedstatus,
        });
      });
  }, 86400000);
}

//  GET USER AND REAQUEST TO JOIN

function getUser(userId) {
  db.collection('usersDAO')
    .doc(userId)
    .get()
    .then((doc) => {
      var userData;
      if (doc.exists) {
        // do something with the user data
        userData = doc.data();
        // // userData.Id = userId +'XXXXXXXXXXXXXXX';
        // console.log(userData);
        joinedRoom = '';
        privateMessageTo = userData;
      } else {
        console.log('No such user document!');
      }

      sendPrivateMessageTo(privateMessageTo);

      // retrieveMessages(privateMessageTo.id);

      var messagesRef = firebase.database().ref(`users-${User.id}-messages`);
      messagesRef
        .orderByChild('privateMsgTo')
        .equalTo(privateMessageTo.id)
        .on('value', function (snapshot) {
          var messages = snapshot.val();

          if (userId === privateMessageTo.id) {
            printAllMsgs(messages);
            console.log(messages);
          }

          console.log(userId, privateMessageTo.id);
        });

      console.log(privateMessageTo);
      return userData;
    })
    .catch((error) => {
      console.log('Error getting user document:', error);
    });
}

// function retrieveMessages(userId) {
// console.log(userId, User);

// }

///////////GET ROOM AND RERQUEST TO JOIN

function getRoom(roomId) {
  db.collection('group')
    .doc(roomId)
    .get()
    .then((doc) => {
      var roomData;
      if (doc.exists) {
        // do something with the user data
        
        
        
        removaleRoomFroomList =joinedRoom
          console.log(removaleRoomFroomList);

        lastRoom = joinedRoom;

        roomData = doc.data();
        roomData.roomId = doc.id;

        joinedRoom = roomData;

        // console.log(lastRoom, joinedRoom, 'ejssss');

        if (joinedRoom.roomId !== lastRoom.roomId) {
          // console.log(lastRoom, joinedRoom, 'ejssss');
          // lastRoom = joinedRoom;
          output.innerHTML = '';

          console.log('run2');

          sendRoomMessage({ joinedRoom, lastRoom });

          var messagesRef = firebase.database().ref(`room-${roomId}-messages`);
          messagesRef.on('value', function (snapshot) {
            var messages = snapshot.val();

            if (roomId === joinedRoom.roomId) {
              printAllMsgs(messages);

            
            }
          });


          const userRef = db.collection('group').doc(doc.id);

          userRef
            .update({
              roomMembers: firebase.firestore.FieldValue.arrayUnion(User.id),
            })
            .then(() => {
              console.log(`User added to ${User} field`);
            })
            .catch((error) => {
              console.error(`Error adding user to field: ${error}`);
            });
          
          
           if (removaleRoomFroomList) {
             const userRef = db.collection('group').doc(removaleRoomFroomList.roomId);

             userRef
               .update({
                 roomMembers: firebase.firestore.FieldValue.arrayRemove(User.id),
               })
               .then(() => {
                 console.log(`User removed from ${User} field`);
               })
               .catch((error) => {
                 console.error(`Error removing user from  field: ${error}`);
               });
          }
          



          console.log('.............. FEATCJINNG group users..................');
          userRef.onSnapshot(
            (doc) => {
              const data = doc.data().roomMembers;
              console.log(data);
              if (data) {
                document.querySelector('.room-users').innerHTML =''
                data.forEach(e => {



                  var u
                  db.collection('usersDAO')
                    .doc(e)
                    .get()
                    .then((doc) => {
                      u = doc.data();
                      
                      const li = `<div class="user">
                        <div class="u-r-img">
                          <img src="${u.profileImg}" alt="" />
                        </div>
                        <div class="about">
                          <h4>${u.username}</h4>
                        </div>
                      </div>`;
                      // console.log(u, 'aaaaaaaa');
                      document.querySelector('.room-users').innerHTML += li;
                    });
                  

                  
                })
                
              }

              // printUserInfo(data);
            },
            (error) => {
              console.error('Error getting documents:', error);
            }
          );
        }




      } else {
        console.log('No such user document!');
      }
    })
    .catch((error) => {
      console.log('Error getting user document:', error);
    });
}

/////////////////////////////SAVE MESSAGE IN REALTIME DATBASE //////////////////////////\

// Save a new message to Firebase Realtime Database
// function saveMessage(senderId, receiverId, messageContent) {
//   var newMessageRef = firebase.database().ref('messages').push();

//   console.log('reint thuisd  .....    ')
//   newMessageRef.set({
//     senderId: senderId,
//     receiverId: receiverId,
//     messageContent: messageContent,
//     timestamp: Date.now()
//   });
// }

function saveMessage(privateMsgTo, messageContent, isMine) {
  // console.log(isMine, `users-${User.id}-messages`);
  var messagesRef = firebase.database().ref(`users-${User.id}-messages`);
  var newMessageRef = messagesRef.push();
  newMessageRef.set({
    privateMsgTo: privateMsgTo,
    messageContent: messageContent,
    timestamp: Date.now(),
    isMine: isMine,
  });
}
function saveGrpMsg(roomId, messageContent, sender) {
  console.log(roomId, messageContent, sender, `room-${roomId}-messages`);
  var messagesRef = firebase.database().ref(`room-${roomId}-messages`);
  var newMessageRef = messagesRef.push();
  newMessageRef.set({
    roomId,
    messageContent: messageContent,
    timestamp: Date.now(),
    senderName: sender.username,
    senderId: sender.id,
  });
}


// function printAllRoomUsers(roomId) {
//     const userRef = firestore.collection('group').doc(roomId);

//     console.log('.............. FEATCJINNG group users..................');
//     userRef.onSnapshot(
//       (doc) => {
//         const data = doc.data();
//         console.log(data,data.roomMembers,"..........................");
//         // printUserInfo(data);
//       },
//       (error) => {
//         console.error('Error getting documents:', error);
//       }
//     );
// }