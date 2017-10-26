"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var firebase = require("firebase");
var mobx_state_tree_1 = require("mobx-state-tree");
var database = firebase.database();
exports.FirebaseModel = mobx_state_tree_1.types
    .model("FirebaseModel", {
    _id: mobx_state_tree_1.types.optional(mobx_state_tree_1.types.string, ""),
    _path: mobx_state_tree_1.types.optional(mobx_state_tree_1.types.string, ""),
})
    .actions(function (self) {
    var _getSnapshot = function () {
        var _snapshot = mobx_state_tree_1.getSnapshot(self);
        var snapshot = {};
        for (var i in _snapshot) {
            // Exclude the private properties
            if (i.substr(0, 1) === "_") {
                continue;
            }
            snapshot[i] = _snapshot[i];
        }
        return snapshot;
    };
    var _checkPath = function () {
        if (!self._path) {
            throw new Error(mobx_state_tree_1.getType(self).name +
                " doesn't have _path prop defined." +
                " Any model composed or extended from FirebaseModel must define _path prop.");
        }
    };
    var _getDatabase = function () {
        return database.ref("/" + self._path);
    };
    return {
        save: function () {
            _checkPath();
            if (self._id) {
                // Old object, just perform update
                return _getDatabase()
                    .child(self._id)
                    .set(_getSnapshot());
            }
            else {
                // New object, create a new entry
                var response_1 = _getDatabase().push(_getSnapshot());
                var key = response_1.key;
                if (key !== null) {
                    self._id = key;
                }
                var retPromise = new Promise(function (resolve, reject) {
                    response_1.then(function (val) { return resolve(val); }, function (val) { return reject(val); });
                });
                return retPromise;
            }
        },
    };
});
var _getDatabase = function (Model) {
    var path = Model["properties"]._path.defaultValue;
    return firebase.database().ref(path);
};
exports.findById = function (Model, id) {
    return new Promise(function (resolve, reject) {
        _getDatabase(Model)
            .child(id)
            .once("value")
            .then(function (snapshot) {
            var val = snapshot.val();
            val._id = id;
            var createdModel = Model.create(val);
            resolve(createdModel);
        }, function (err) {
            reject(err);
        });
    });
};
exports.findAllWhere = function (Model, prop, operator, value) {
    return new Promise(function (resolve, reject) {
        var db = _getDatabase(Model);
        var ref = db.orderByChild(prop);
        switch (operator) {
            case "=":
                ref = ref.equalTo(value);
                break;
            case ">":
                ref = ref.startAt(value);
                break;
            case "<":
                ref = ref.endAt(value);
                break;
            case "between":
                // Assume value is an array having 2 elements
                ref = ref.startAt(value[0]).endAt(value[1]);
                break;
            default:
                throw new Error("Operator " + operator + " isn't supported.");
        }
        ref.once("value").then(function (success) {
            var resultObj = {};
            var resultValue = success.val();
            for (var key in resultValue) {
                if (resultValue.hasOwnProperty(key)) {
                    resultObj[key] = Model.create(resultValue[key]);
                }
            }
            resolve(resultObj);
        }, function (error) {
            reject("Firebase error " + error + "");
        });
    });
};
