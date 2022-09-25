// Copyright (c) 2022, Guy Or Please see the AUTHORS file for details.
// All rights reserved. Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
export var IDBQueryType;
(function (IDBQueryType) {
    IDBQueryType[IDBQueryType["Only"] = 0] = "Only";
    IDBQueryType[IDBQueryType["Bound"] = 1] = "Bound";
    IDBQueryType[IDBQueryType["LowerBound"] = 2] = "LowerBound";
    IDBQueryType[IDBQueryType["UpperBound"] = 3] = "UpperBound";
})(IDBQueryType || (IDBQueryType = {}));
export var IDBTransactionModes;
(function (IDBTransactionModes) {
    IDBTransactionModes["Readonly"] = "readonly";
    IDBTransactionModes["Readwrite"] = "readwrite";
    IDBTransactionModes["VersionChange"] = "versionchange";
})(IDBTransactionModes || (IDBTransactionModes = {}));
