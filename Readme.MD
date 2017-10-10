# Mobx-state-tree firebase model

This package will ease the process of setting up all your CRUD operations in your react-native/react project which uses mobx-state-tree as the state management library.


### Prerequisites

You will need - 

```
Node (v6+)
npm (v3+)
```

### Installing

Installing is pretty straightforward, if you have the prerequisites set up. Just copy the below code to your terminal in your project directory. Note that this has a peer dependency of mobx and firebase (duh!).

```
npm install mst-firebase --save
```

## Getting Started

Now that you have installed the package you are all set to start playing with it!

First, import the package to wherever you need to save the mst model.
```js
import { FirebaseModel } from 'FirebaseModel';
```
This will only provide the save/update function, to get all the other functions you can import them seperately like 

```js
import { findById } from 'FirebaseModel';
import { findAllWhere } from 'FirebaseModel';
```

Next you have to "inherit" all the properties of the FirebaseModel to your mobx-state-tree model. An example for this would be - 

```js
const Post = FirebaseBaseModel.named("Post")
  .props({
    _path: "posts",
    title: types.string,
    description: types.string
  })
  .actions((self) => {
    
    return {
      updateTitle(newTitle: string) {
        self.title = newTitle;
      },
    };
  });
```

Now that Let's go over some common use cases.

1) To create a new entry -

```js
const FirstPost = Post.create({
  title: 'Hey!',
  description: 'Please save this.',
});

FirstPost.save();
```
And voila! A new post is added! <br> 

2) To update a model - 

```js
const FirstPost = Post.create({
  title: 'Hey!',
  description: 'updated?',
  _id: "-Kw4VJxqhKSiA3r2K8ue" 
});

FirstPost.save();
```
<br>
To update an existing post you will have to pass the id in the Model as a private property. Based on this it will create/update a new entry in the firebase model. 

3) To find an entry in your firebase database by it's Id - 

```js
findById(
	YourModel,
    IdYouWantToGet)
    .then(success =>
    	//do stuff on success here
	}, error => {
    	//do stuff on error here
    });
    
```
The first argument is your mobx-state-tree model and the second argument is the Id of the object you are trying to access. <br /> <br />
Let us look at an example where we want to fetch a user with a particular user id.

```js
findById(Post, "-Kw0DPoUeMBtsB-ZrZdQ").then(success => {
  console.log("success", getSnapshot(success));
});
```
4) To find all entries in your firebase database by a condition - 

```js
findAllWhere(
	YourModel,
	PropYouWantToFilterBy,
    OperatorYouWantToFilterBy,
    ValueYouWantToFilterBy)
    .then(success =>
    	//do stuff on success here
	}, error => {
    	//do stuff on error here
    });
);
```
Note that the first argument is your mobx-state-tree model, second is the column on which you want to add the condition, third is the operator(supported operators right now are =,>,< and between), fourth is the value to filter by. <br />
<br />
Let us look at an example where we want to fetch all posts with the title as Lorem ipsum.

```js
findAllWhere(Post, 'title', '=', 'Lorem ipsum').then(success => {
  console.log("success", success);
});
```
## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
