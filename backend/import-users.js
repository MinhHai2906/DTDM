const { db, auth } = require('./firebase-admin');

const AUTH_DELETE_BATCH_SIZE = 1000;

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

async function listAllAuthUsers() {
  const users = [];
  let nextPageToken;

  do {
    const result = await auth.listUsers(AUTH_DELETE_BATCH_SIZE, nextPageToken);
    users.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  return users;
}

async function importUsersFromAuth() {
  try {
    console.log('Bat dau import users tu Firebase Auth...');

    const users = await listAllAuthUsers();
    console.log(`Tim thay ${users.length} users trong Auth`);

    let imported = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists) {
          const email = normalizeEmail(user.email);
          await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            displayName: user.displayName || (email ? email.split('@')[0] : 'user'),
            email,
            emailNormalized: email,
            phone: user.phoneNumber || '',
            phoneNormalized: (user.phoneNumber || '').replace(/[^\d]/g, ''),
            role: 'user',
            authProvider:
              user.providerData.length > 0
                ? user.providerData[0].providerId.split('.')[0]
                : 'email',
            createdAt: user.metadata.creationTime
              ? new Date(user.metadata.creationTime)
              : new Date(),
            updatedAt: new Date()
          });

          imported++;
          console.log(`Imported: ${email || user.uid}`);
        } else {
          skipped++;
          console.log(`Skipped (already exists): ${user.email || user.uid}`);
        }
      } catch (error) {
        console.error(`Error importing ${user.email || user.uid}:`, error.message);
      }
    }

    console.log(`Import xong. Imported=${imported}, Skipped=${skipped}`);
    return { success: true, imported, skipped, totalAuthUsers: users.length };
  } catch (error) {
    console.error('Loi import:', error);
    return { success: false, message: error.message };
  }
}

async function deleteUserCompletely(uid) {
  try {
    if (!uid) {
      return { success: false, message: 'User UID is required' };
    }

    console.log(`Bat dau xoa user ${uid}...`);

    try {
      await db.collection('users').doc(uid).delete();
      console.log('Da xoa user document trong Firestore');
    } catch (firestoreError) {
      console.warn('Khong xoa duoc document Firestore (bo qua):', firestoreError.message);
    }

    try {
      await auth.deleteUser(uid);
      console.log('Da xoa user trong Firebase Auth');
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
      console.warn('User khong ton tai trong Auth, tiep tuc.');
    }

    return { success: true, message: `User ${uid} deleted successfully` };
  } catch (error) {
    console.error(`Loi xoa user ${uid}:`, error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  importUsersFromAuth,
  deleteUserCompletely
};

if (require.main === module) {
  const command = process.argv[2];
  const uid = process.argv[3];

  if (command === 'import') {
    importUsersFromAuth().then((result) => {
      console.log(JSON.stringify(result, null, 2));
      if (!result.success) process.exitCode = 1;
    });
  } else if (command === 'delete') {
    if (!uid) {
      console.error('Missing UID. Usage: node import-users.js delete <uid>');
      process.exitCode = 1;
    } else {
      deleteUserCompletely(uid).then((result) => {
        console.log(JSON.stringify(result, null, 2));
        if (!result.success) process.exitCode = 1;
      });
    }
  }
}
