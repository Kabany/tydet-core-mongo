# TyDeT Core Mongo
> TyDeT Core Mongo is a Typescript & Javascript library for TyDeT Core to handle a connection to a Mongo database.

TyDeT (Typescript Developer Tools) Core Mongo is a module for [TyDeT Core][tydet-core] to handle a connection with a Mongo Database and managing the entities, validations, migrations and other tools.

## Installation

This is a Node.js module available through the npm registry. Installation is done using the npm install command:

```shell
npm install tydet-core tydet-core-mongo
```

It is required to install [TyDeT Core][tydet-core] to use this module.

## Usage

### Basic usage

```js
import { Context } from 'tydet-core';
import { MongoConnector, MongoEntity, QueryFind } from 'tydet-core-mongo';

// Add connector as Service
let app = new Context()
let mongodb = new MongoConnector()
await app.mountService("mongo", mongodb)

// Execute queries
let query = QueryFind(mongodb, "users", {firstName: "My name"})
let data = await mongodb.run(query)

// Define entities
class User extends MongoEntity {
  firstName: string
  lastName: string
}

User.DefineSchema("users", {
  firstName: {
    type: MongoDataType.STRING,
    required: true
  },
  lastName: MongoDataType.STRING
})

class Comment extends MongoEntity {
  message: string
  userId: ObjectId
  createdAt: Date

  user?: User
}

Comment.DefineSchema("comments", {
  message: {
    type: MongoDataType.VARCHAR,
    required: true
  },
  userId: MongoDataType.OBJECT_ID,
  createdAt: {
    type: MongoDataType.DATETIME,
    default: MongoDataType.NOW
  }
})

let users = await User.Find(mongodb, {firstName: "My name"})

```

Check the [docs][docs] for more details about the service.

## Changelog

[Learn about the latest improvements][changelog].

## License

[MIT License][license].

## Contributing

We'd love for you to contribute to TyAPI Core Mongo and help make it even better than it is today! Find out how you can contribute [here][contribute].



<!-- Markdown link & img dfn's -->
[license]: ./LICENSE
[changelog]: ./CHANGELOG.md
[contribute]: ./CONTRIBUTING.md
[tydet-core]: https://github.com/Kabany/tydet-core
[docs]: ./docs/README.md