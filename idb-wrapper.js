// Copyright (c) 2020, Guy Or Please see the AUTHORS file for details.
// All rights reserved.

function defaultOnConfirm() { console.log("User confirmed"); }
function defaultOnDeny() { console.log("User denied"); }
function defaultOnFinished() { console.log("finished"); }

/// Asks for browser persistent storage
/// [onFinished] - A callback that will fire at the end of the check
/// [onConfirm] - A callback that will be fired before [onFinished] if user allows persistent storage
/// [onDeny] - A callback that will be fired before [onFinished] if user denies persistent storage
function askPersistentStorage(onFinished=defaultOnFinished,
                              onConfirm=defaultOnConfirm,
                              onDeny=defaultOnDeny) {
  navigator.storage.persist().then( (isConfirmed) => {
    if (isConfirmed) {
      onConfirm();
    }
    else {
      onDeny();
    }
    onFinished();
  });
}

/// Check if browser storage is persisten and if not asks for it
/// [onFinished] - A callback that will fire at the end
/// [onConfirm] - Passed to [askPersistentStorage]
/// [onDeny] - Passed to [askPersistentStorage]
function checkPersistentStorageAndExecute(onFinished=defaultOnFinished,
                                          onConfirm=defaultOnConfirm,
                                          onDeny=defaultOnDeny) {
  try {
    navigator.storage.persisted().then( (isPersisted) => {
      if (isPersisted) {
        onFinished();
      }
      else {
        askPersistentStorage(onFinished, onConfirm, onDeny);
      }
    });
  }
  catch (error) {
    console.warn(error);
    onFinished();
  }
}

/// Checks for IndexedDB support and attempts to start it
/// [dbName] - String, the Database name
/// [dbVersion] - Integer, the Database version
/// [onUpgradeNeeded] - A callback with single argument that will be fired if the DB version is newer than the one in the browser
/// [onDbSuccess] - A callback with single argument that will be fired if the DB was successfully opened
function startIndexedDB(dbName, dbVersion, onUpgradeNeeded, onDbSuccess) {
  //Check if IndexedDB supported
  window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  if (!window.indexedDB) {
      console.error("IDB not supported!");
      return;
  }
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"};
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  //Start IndexedDB
  var dbOpenReq = indexedDB.open(dbName, dbVersion);
  dbOpenReq.onupgradeneeded = onUpgradeNeeded;
  dbOpenReq.onsuccess = onDbSuccess;
}

/// A class to act as a wrapper for IndexedDB
function IDBWrapper(idb) {
  this.setIndexedDB(idb);
}

/// Access mode constants
IDBWrapper.prototype.READONLY = "readonly";
IDBWrapper.prototype.READWRITE = "readwrite";

/// Query Type enum
IDBWrapper.prototype.queryType = {};
IDBWrapper.prototype.queryType.only = 0;
IDBWrapper.prototype.queryType.bound = 1;
IDBWrapper.prototype.queryType.lowerBound = 2;
IDBWrapper.prototype.queryType.upperBound = 3;

/// Query Direction constants
IDBWrapper.prototype.cursorDirection = {};
IDBWrapper.prototype.cursorDirection.next = "next";
IDBWrapper.prototype.cursorDirection.nextunique = "nextunique";
IDBWrapper.prototype.cursorDirection.prev = "prev";
IDBWrapper.prototype.cursorDirection.prevunique = "prevunique";

/// Sets the IDBDatabase object the wrapper is wrapping
IDBWrapper.prototype.setIndexedDB = function(idb) {
  if (idb instanceof IDBDatabase) {
    this.idb = idb;
  } else {
    console.error("Invalid argument!");
  }
};

/// Returns an IDBObjectStore from the database
/// [store_name] - String, the ObjectStore's name
/// [mode] - String, the requested mode ("readonly" or "readwrite")
IDBWrapper.prototype.getObjectStore = function(store_name, mode) {
    if (!this.idb) {
        console.error("Null reference");
        return;
    }
    const tx = this.idb.transaction(store_name, mode);
    return tx.objectStore(store_name);
};

/// Returns an IDBIndex object from the database
/// [store_name] - String, the ObjectStore's name
/// [indexName] - String, the index name
/// [mode] - The mode (read/readwrite)
IDBWrapper.prototype.getIndex = function(store_name, indexName, mode=IDBWrapper.prototype.READONLY) {
    const objectStore = this.getObjectStore(store_name, mode);
    const index = objectStore.index(indexName);
    return index;
};

/// Creates an index during version upgrade
/// [objectStore] - The IDBObjectStore on which to create the index
/// [indexesObj] - A JavaScript Object with the following format:
// {"index_name_1":
///   {
///     "kp": ["field_1", "field_2", "field_3", "field_4"],
///     "options": { unique: false }
///   },
/// "index_name_2":
///   {
///     "kp": "field_name",
///     "options": { unique: true }
///   },
/// };
/// See createIndex documentation for more details about KeyPath and options
IDBWrapper.prototype.createIndexes = function(objectStore, indexesObj) {
    for ( const [indexName, indexData] of Object.entries(indexesObj) ) {
        try {
            const indexKp = indexData.kp;
            const indexOptions = indexData.options;
            objectStore.createIndex(indexName, indexKp, indexOptions);
        }
        catch (error) {
            console.error(error);
            console.log(indexesObj);
        }
    }
};

/// Returns a Boolean indicating whether the underlying IDBDatabase object is initialized
IDBWrapper.prototype.isInitialized = function() {
  return this.idb != undefined && (this.idb instanceof IDBDatabase);
};

/// Returns an IDBKeyRange object based on the arguments passed
/// [queryType] - The query type to preform (IDBWrapper.prototype.queryType)
/// [direction] - The query direction (A valid String or one of IDBWrapper.prototype.cursorDirection object)
/// [x] - The relevant key path value(s) for only, lowerBound, upperBound queries, and the lower key path on bound queries
/// [lowerOpen] - A Boolean indicating whether query should be exclusive on it's lower end
/// [upperOpen] - A Boolean indicating whether query should be exclusive on it's upper end
/// [y] - The relevant key path value(s) for the upper key path on bound queries
IDBWrapper.prototype.createKeyRange = function(queryType, direction, x, lowerOpen=false, upperOpen=false, y=undefined) {
  if (queryType == undefined || direction == undefined || x == undefined) {
    console.warn("Invalid arguments");
    return;
  } else if (queryType == IDBWrapper.prototype.queryType.bound && y == undefined) {
    console.warn("Invalid argument combinations");
    return;
  }
  let keyRange;
  switch (queryType) {
    case IDBWrapper.prototype.queryType.only:
      keyRange = IDBKeyRange.only(x);
      break;
    case IDBWrapper.prototype.queryType.bound:
      keyRange = IDBKeyRange.bound(x, y, lowerOpen, upperOpen);
      break;
    case IDBWrapper.prototype.queryType.lowerBound:
      keyRange = IDBKeyRange.lowerBound(x, lowerOpen);
      break;
    case IDBWrapper.prototype.queryType.upperBound:
      keyRange = IDBKeyRange.upperBound(x, upperOpen);
      break;
    default:
      break;
  }
  return keyRange;
};

/// [indexName] - A String representing an Index name
/// [objectStoreName] - A String representing an Object Store's name
/// [x] - The relevant key path value(s) for only, lowerBound, upperBound queries, and the lower key path on bound queries
/// [y] - The relevant key path value(s) for the upper key path on bound queries
/// [queryType] - An IDBWrapper.prototype.queryType enum value specifying query type
/// [direction] - The query direction (A valid String or one of IDBWrapper.prototype.cursorDirection object)
/// [lowerOpen] - A Boolean indicating whether query should be exclusive on it's lower end
/// [upperOpen] - A Boolean indicating whether query should be exclusive on it's upper end
/// [onsuccess] - A callback to fire if openCursor request succeeds. Has a single argument (e) where
/// e.target.result is the IDBCursor
/// [onerror] - A callback to fire if openCursor request fails. Has a single argument
IDBWrapper.prototype.openIndexCursor = function(objectStoreName,
                                                indexName,
                                                x,
                                                y=undefined,
                                                queryType=IDBWrapper.prototype.queryType.only,
                                                direction=IDBWrapper.prototype.cursorDirection.next,
                                                lowerOpen=false,
                                                upperOpen=false,
                                                onsuccess=undefined,
                                                onerror=undefined,
                                                mode=IDBWrapper.prototype.READONLY,
                                              ) {
  const keyRange = this.createKeyRange(queryType, direction, x, lowerOpen, upperOpen, y);
  if (keyRange == undefined) {
    if (onerror) {
      onerror({"error": "Could not perform operation"});
    }
    return;
  }
  const index = this.getIndex(objectStoreName, indexName, mode);
  const cursorRequest = index.openCursor(keyRange, direction);
  cursorRequest.onerror = onerror;
  cursorRequest.onsuccess = onsuccess;
};
