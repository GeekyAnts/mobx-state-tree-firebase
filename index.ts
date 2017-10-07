import "./FirebaseConnect";
import * as firebase from "firebase";
import { types, getSnapshot, getType } from "mobx-state-tree";

const database = firebase.database();

const FirebaseBaseModel = types
  .model("FirebaseBaseModel", {
    _id: types.optional(types.string, ""),
    _path: types.optional(types.string, "")
  })
  .actions(self => {
    const _getSnapshot = function() {
      let _snapshot: object = getSnapshot(self);
      let snapshot: object = {};
      for (var i in _snapshot) {
        // Exclude the private properties
        if (i.substr(0, 1) === "_") {
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
            " doesn't have _path prop defined." +
            " Any model composed or extended from FirebaseBaseModel must define _path prop."
        );
      }
    };

    const _getDatabase = function() {
      return database.ref("/" + self._path);
    };

    return {
      save(): Promise<any> {
        _checkPath();

        if (self._id) {
          // Old object, just perform update
          console.log("Old object");

          return _getDatabase()
            .child(self._id)
            .set(_getSnapshot());
        } else {
          // New object, create a new entry

          console.log("New object");

          const response = _getDatabase().push(_getSnapshot());
          const key = response.key;

          if (key !== null) self._id = key;

          const retPromise = new Promise((resolve, reject) => {
            response.then(val => resolve(val), val => reject(val));
          });

          return retPromise;
        }
      }
    };
  });

const _getDatabase = function(Model: typeof FirebaseBaseModel) {
  const path = Model["properties"]._path.defaultValue;
  return firebase.database().ref(path);
};

const findById = function(
  Model: typeof FirebaseBaseModel,
  id: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    _getDatabase(Model)
      .child(id)
      .once("value")
      .then(
        function(snapshot) {
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

const findAllWhere = function(
  Model: typeof FirebaseBaseModel,
  prop: string,
  operator: string,
  value: any
): Promise<Array<any>> {
  return new Promise((resolve, reject) => {
    const db = _getDatabase(Model);

    var ref = db.orderByChild(prop);

    switch (operator) {
      case "=":
        ref = ref.equalTo(value);
        break;
      case ">":
        ref = db.startAt(value);
        break;
      case "<":
        ref = db.endAt(value);
        break;
      case "between":
        // Assume value is an array having 2 elements
        ref = db.startAt(value[0]).endAt(value[1]);
        break;
      default:
        throw new Error("Operator `" + operator + "` isn't supported.");
    }

    ref.once("value", snap => {
      console.log(snap);
      debugger;
    });
  });
};
/*
const findOneWhere = function(): Promise<any> {
  return new Promise((resolve, reject) => {});
};


const _getFindQuery = function(

)
*/

const Post = FirebaseBaseModel.named("Post")
  .props({
    _path: "posts",
    title: types.string,
    description: types.string
  })
  .actions(self => {
    return {
      updateTitle(newTitle: string) {
        self.title = newTitle;
      }
    };
  });

async function findAndUpdatePost(id: string) {
  const post = await findById(Post, id);
  post.updateTitle(post.title + "/ Third");

  console.log(getSnapshot(post));

  await post.save();
}

async function createAndUpdatePost() {
  const post = Post.create({
    title: "First",
    description: "Wow!"
  });

  await post.save();

  post.updateTitle(post.title + " / Second");

  await post.save();

  await findAndUpdatePost(post._id);
}

createAndUpdatePost();

findAllWhere(Post, "description", "=", "Wow!");
