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
import { MysqlConnector, MysqlEntity, QueryFind } from 'tydet-core-mysql';

// Add connector as Service
let app = new Context()
let mysql = new MysqlConnector()
await app.mountService("mysql", mysql)

// Execute queries
let query = QueryFind(mysql, "users", {firstName: "My name"})
let data = await mysql.run(query)

// Define entities
class User extends MysqlEntity {
  id: number
  firstName: string
  lastName: string
}

User.DefineSchema("users", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  firstName: {
    type: MysqlDataType.VARCHAR,
    required: true
  },
  lastName: MysqlDataType.VARCHAR
})

class Comment extends MysqlEntity {
  id: number
  message: string
  userId: number
  createdAt: Date

  user?: User
}

Comment.DefineSchema("comments", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  message: {
    type: MysqlDataType.VARCHAR,
    required: true
  },
  userId: MysqlDataType.INT,
  createdAt: {
    type: MysqlDataType.DATETIME,
    default: MysqlDefaultValue.NOW
  }
})

User.hasMany(Comment, "userId")
Comment.belongsTo(User, "userId", "user")

let users = await User.Find(mysql, {firstName: "My name"})

```

Check the [docs][docs] for more details about the service.

## Changelog

[Learn about the latest improvements][changelog].

## License

[MIT License][license].

## Contributing

We'd love for you to contribute to TyAPI Core Mysql and help make it even better than it is today! Find out how you can contribute [here][contribute].



<!-- Markdown link & img dfn's -->
[license]: ./LICENSE
[changelog]: ./CHANGELOG.md
[contribute]: ./CONTRIBUTING.md
[tydet-core]: https://github.com/Kabany/tydet-core
[docs]: ./docs/README.md