# Firebase Integraiton for mobx-state-tree models

## Warning: This project is under active development


## Peer dependencies

* mobx-state-tree
* MobX
* Firebase


## Idea 

```

import { FirebaseBaseModel } from 'mobx-state-tree-firebase';

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

```

## Create an instance of MST Model and Save it to Firebase

```
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
```


## Find and Update a Model

```
async function findAndUpdatePost(id: string) {
  const post = await findById(Post, id);
  post.updateTitle(post.title + "/ Third");

  console.log(getSnapshot(post));

  await post.save();
}
```