import * as firebase from 'firebase';
import { types, getSnapshot, getType } from 'mobx-state-tree';

const database = firebase.database();

export const FirebaseModel = types
  .model('FirebaseModel', {
    _id: types.optional(types.string, ''),
    _path: types.optional(types.string, '')
  })
  .actions(self => {
    const _getSnapshot = function() {
      let _snapshot: any = getSnapshot(self);
      let snapshot: any = {};
      for (let i in _snapshot) {
        // Exclude the private properties
        if (i.substr(0, 1) === '_') {
          continue;
        }
        snapshot[i] = _snapshot[i];
      }
      return snapshot;
    };

    const _checkPath = function() {
      if (!self._path) {
        throw new Error(
          getType(self).name +
            ` doesn't have _path prop defined.` +
            ` Any model composed or extended from FirebaseModel must define _path prop.`
        );
      }
    };

    const _getDatabase = function() {
      return database.ref('/' + self._path);
    };

    return {
      save(): Promise<any> {
        _checkPath();

        if (self._id) {
          // Old object, just perform update

          return _getDatabase()
            .child(self._id)
            .set(_getSnapshot());
        } else {
          // New object, create a new entry

          const response = _getDatabase().push(_getSnapshot());
          const key = response.key;

          if (key !== null) {
            self._id = key;
          }

          const retPromise = new Promise((resolve, reject) => {
            response.then(val => resolve(val), val => reject(val));
          });

          return retPromise;
        }
      }
    };
  });

const _getDatabase = function(Model: typeof FirebaseModel) {
  const path = Model['properties']._path.defaultValue;
  return firebase.database().ref(path);
};

export const findById = function(
  Model: typeof FirebaseModel,
  id: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    _getDatabase(Model)
      .child(id)
      .once('value')
      .then(
        function(snapshot: any) {
          const val = snapshot.val();
          val._id = id;
          const createdModel = Model.create(val);
          resolve(createdModel);
        },
        err => {
          reject(err);
        }
      );
  });
};

export const findAllWhere = function(
  Model: typeof FirebaseModel,
  prop: string,
  operator: string,
  value: any
): Promise<Array<any>> {
  return new Promise((resolve, reject) => {
    const db = _getDatabase(Model);

    var ref = db.orderByChild(prop);

    switch (operator) {
      case '=':
        ref = ref.equalTo(value);
        break;
      case '>':
        ref = ref.startAt(value);
        break;
      case '<':
        ref = ref.endAt(value);
        break;
      case 'between':
        // Assume value is an array having 2 elements
        ref = ref.startAt(value[0]).endAt(value[1]);
        break;
      default:
        throw new Error('Operator ' + operator + ` isn't supported.`);
    }
    
    ref.once('value'
    ).then(
        success => {
          let resultObj: any = {};
          let resultValue = success.val();
          
          for (var key in resultValue) {
            if (resultValue.hasOwnProperty(key)) {
              resultObj[key] = Model.create(resultValue[key]);
            }
          }
          resolve(resultObj);
        },
        error => {
          reject('Firebase error ' + error + '');
        });
    });
  };
