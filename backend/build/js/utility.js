const dbPromise = idb.open('allPosts', 1, (db) => {
    if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', {keyPath: '_id'});
    }
    if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', {keyPath: '_id'});
    }
    if (!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', {keyPath: 'body'});
    }
    if (!db.objectStoreNames.contains('sync-comments')) {
        db.createObjectStore('sync-comments', {keyPath: 'comment'});
    }
});

function createData(st, data) {
    return dbPromise.then(db => {
        var transaction = db.transaction(st, 'readwrite');
        var store = transaction.objectStore(st);
        store.put(data);
        return transaction.complete;
    });
}

function readAllData(st) {
    return dbPromise.then(db => {
        var transaction = db.transaction(st, 'readonly');
        var store = transaction.objectStore(st);
        return store.getAll();
    });
}

function deleteItemFromData(st, id) {
    return dbPromise.then(db => {
        var transaction = db.transaction(st, 'readwrite');
        var store = transaction.objectStore(st);
        store.delete(id);
        return transaction.complete;
    });
}