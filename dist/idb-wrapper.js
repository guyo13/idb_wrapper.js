// Copyright (c) 2022, Guy Or Please see the AUTHORS file for details.
// All rights reserved. Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _IDBWrapper_indexedDB, _IDBWrapper_initialization, _IDBWrapper_ready, _IDBWrapper_isPersistent;
import { IDBQueryType, IDBTransactionModes } from './types';
class IDBWrapper {
    constructor(args) {
        _IDBWrapper_indexedDB.set(this, void 0);
        _IDBWrapper_initialization.set(this, void 0);
        _IDBWrapper_ready.set(this, void 0);
        _IDBWrapper_isPersistent.set(this, void 0);
        __classPrivateFieldSet(this, _IDBWrapper_ready, false, "f");
        __classPrivateFieldSet(this, _IDBWrapper_isPersistent, false, "f");
        __classPrivateFieldSet(this, _IDBWrapper_initialization, this.initialize(args), "f");
    }
    initialize(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { dbName, dbVersion, upgradeHandler, persistent = false } = args;
            if (persistent) {
                try {
                    __classPrivateFieldSet(this, _IDBWrapper_isPersistent, yield navigator.storage.persisted(), "f");
                    if (!__classPrivateFieldGet(this, _IDBWrapper_isPersistent, "f")) {
                        __classPrivateFieldSet(this, _IDBWrapper_isPersistent, yield navigator.storage.persist(), "f");
                    }
                }
                catch (error) {
                    __classPrivateFieldSet(this, _IDBWrapper_isPersistent, false, "f");
                }
            }
            return new Promise((resolve, reject) => {
                const idbFactory = IDBWrapper.indexedDBFactory;
                if (!idbFactory) {
                    __classPrivateFieldSet(this, _IDBWrapper_ready, false, "f");
                    return reject({ error: 'IndexedDB not supported' });
                }
                const dbOpenReq = idbFactory.open(dbName, dbVersion);
                dbOpenReq.onupgradeneeded = (upgradeEvent) => {
                    __classPrivateFieldSet(this, _IDBWrapper_indexedDB, dbOpenReq.result, "f");
                    __classPrivateFieldSet(this, _IDBWrapper_ready, true, "f");
                    upgradeHandler === null || upgradeHandler === void 0 ? void 0 : upgradeHandler.bind(this)(upgradeEvent, __classPrivateFieldGet(this, _IDBWrapper_indexedDB, "f"));
                };
                dbOpenReq.onsuccess = () => {
                    __classPrivateFieldSet(this, _IDBWrapper_indexedDB, dbOpenReq.result, "f");
                    __classPrivateFieldSet(this, _IDBWrapper_ready, true, "f");
                    resolve();
                };
                dbOpenReq.onerror = (errorEvent) => {
                    __classPrivateFieldSet(this, _IDBWrapper_ready, false, "f");
                    reject(errorEvent);
                };
            });
        });
    }
    wait() {
        return __classPrivateFieldGet(this, _IDBWrapper_initialization, "f");
    }
    get isReady() {
        return __classPrivateFieldGet(this, _IDBWrapper_ready, "f");
    }
    get isPersistentStorage() {
        return __classPrivateFieldGet(this, _IDBWrapper_ready, "f") && __classPrivateFieldGet(this, _IDBWrapper_isPersistent, "f");
    }
    get idbInstance() {
        return __classPrivateFieldGet(this, _IDBWrapper_indexedDB, "f");
    }
    static get indexedDBFactory() {
        return (window.indexedDB ||
            window.mozIndexedDB ||
            window.webkitIndexedDB ||
            window.msIndexedDB);
    }
    static get indexedDbKeyRange() {
        return (window.IDBKeyRange ||
            window.webkitIDBKeyRange ||
            window.msIDBKeyRange);
    }
    /// Returns an IDBObjectStore from the database
    getObjectStore(objectStoreName, mode = 'readonly') {
        if (__classPrivateFieldGet(this, _IDBWrapper_indexedDB, "f")) {
            return __classPrivateFieldGet(this, _IDBWrapper_indexedDB, "f")
                .transaction(objectStoreName, mode)
                .objectStore(objectStoreName);
        }
        throw 'IndexedDB is not ready';
    }
    /// Returns an IDBIndex object from the database
    getIndex(objectStoreName, indexName, mode = 'readonly') {
        return this.getObjectStore(objectStoreName, mode).index(indexName);
    }
    /// Opens a cursor on an index in an object store.
    openIndexCursor(objectStoreName, indexName, mode, keyRangeSettings) {
        return new Promise((resolve, reject) => {
            try {
                let keyRange;
                if (keyRangeSettings) {
                    keyRange = IDBWrapper.createKeyRange(keyRangeSettings);
                    if (!keyRange) {
                        return reject({ error: 'Failed creating a key range' });
                    }
                }
                const index = this.getIndex(objectStoreName, indexName, mode);
                const cursorRequest = keyRangeSettings
                    ? index.openCursor(keyRange, keyRangeSettings.direction)
                    : index.openCursor();
                cursorRequest.onerror = reject;
                cursorRequest.onsuccess = (successEvent) => resolve(successEvent.target.result);
            }
            catch (error) {
                return reject(error);
            }
        });
    }
    /// Opens a cursor on an object store.
    openCursor(objectStoreName, mode, keyRangeSettings) {
        return new Promise((resolve, reject) => {
            try {
                let keyRange;
                if (keyRangeSettings) {
                    keyRange = IDBWrapper.createKeyRange(keyRangeSettings);
                    if (!keyRange) {
                        return reject({ error: 'Failed creating a key range' });
                    }
                }
                const objectStore = this.getObjectStore(objectStoreName, mode);
                const cursorRequest = keyRangeSettings
                    ? objectStore.openCursor(keyRange, keyRangeSettings.direction)
                    : objectStore.openCursor();
                cursorRequest.onerror = reject;
                cursorRequest.onsuccess = (successEvent) => resolve(successEvent.target.result);
            }
            catch (error) {
                return reject(error);
            }
        });
    }
    getAll(storeName) {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName);
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = (successEvent) => {
                resolve(successEvent.target.result);
            };
            getAllRequest.onerror = reject;
        });
    }
    get(storeName, query) {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName);
            const getRequest = store.get(query);
            getRequest.onsuccess = (successEvent) => {
                resolve(successEvent.target.result);
            };
            getRequest.onerror = reject;
        });
    }
    add(storeName, object) {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName, IDBTransactionModes.Readwrite);
            const addRequest = store.add(object);
            addRequest.onsuccess = () => {
                resolve();
            };
            addRequest.onerror = reject;
        });
    }
    delete(storeName, query) {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName, IDBTransactionModes.Readwrite);
            const deleteRequest = store.delete(query);
            deleteRequest.onsuccess = () => {
                resolve();
            };
            deleteRequest.onerror = reject;
        });
    }
    /// Creates an index during version upgrade.
    static createIndex(objectStore, index) {
        const { name, kp, options } = index;
        return objectStore.createIndex(name, kp, options);
    }
    /// Creates multiple indexes during version upgrade.
    static createIndexes(objectStore, indexesObj) {
        for (const indexConfig of indexesObj) {
            try {
                IDBWrapper.createIndex(objectStore, indexConfig);
            }
            catch (error) {
                return { error };
            }
        }
    }
    /// Initializes an object store using a storeConfig specification.
    /// Can only be used during version upgrade.
    static initializeStore(indexedDB, storeConfig) {
        const storeObject = indexedDB.createObjectStore(storeConfig.name, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement,
        });
        IDBWrapper.createIndexes(storeObject, storeConfig.indices);
        return storeObject;
    }
}
_IDBWrapper_indexedDB = new WeakMap(), _IDBWrapper_initialization = new WeakMap(), _IDBWrapper_ready = new WeakMap(), _IDBWrapper_isPersistent = new WeakMap();
/// Returns an IDBKeyRange object based on the arguments passed.
IDBWrapper.createKeyRange = function (keyRangeSettings) {
    const { queryType, direction, lowerKeyPath, lowerExclusive = false, upperExclusive = false, upperBoundKeyPath = undefined, } = keyRangeSettings;
    if (queryType == undefined ||
        direction == undefined ||
        lowerKeyPath == undefined) {
        throw 'Invalid query arguments';
    }
    else if (queryType === IDBQueryType.Bound &&
        upperBoundKeyPath == undefined) {
        throw 'Upper bound values not specified for Bound query type';
    }
    const keyRangeConstructor = IDBWrapper.indexedDbKeyRange;
    switch (queryType) {
        case IDBQueryType.Only:
            return keyRangeConstructor.only(lowerKeyPath);
        case IDBQueryType.Bound:
            return keyRangeConstructor.bound(lowerKeyPath, upperBoundKeyPath, lowerExclusive, upperExclusive);
        case IDBQueryType.LowerBound:
            return keyRangeConstructor.lowerBound(lowerKeyPath, lowerExclusive);
        case IDBQueryType.UpperBound:
            return keyRangeConstructor.upperBound(lowerKeyPath, upperExclusive);
    }
};
export default IDBWrapper;
export * from './types';
