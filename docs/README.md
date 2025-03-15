# Documentation

TyDeT (Typescript Developer Tools) Core Mongo is a module to handle a connection with a Mongo Database and managing the entities, validations, migrations and other tools.

## Basic usage

```js
import { Context } from 'tydet-core';
import { MongoConnector, MongoEntity, QueryFind } from 'tydet-core-mongo';

// Add connector as Service
let app = new Context()
let mongodb = new MongoConnector({url: "mongodb://localhost:27017/mydb"})
await app.mountService("mongodb", mongodb)

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
  userId: number
  createdAt: Date
}

Comment.DefineSchema("comments", {
  message: {
    type: MongoDataType.STRING,
    required: true
  },
  userId: MongoDataType.OBJECT_ID,
  createdAt: {
    type: MongoDataType.DATE,
    default: MongoDataType.NOW
  }
})

let users = await User.Find(mongodb, {firstName: "My name"})

```

## Configuration

The input arguments are required and will define the connection to the database:

```js
let mongodb = new MongoConnector({host: "db.com", db: "mydb", user: "user", pass: "pass", port: 27017})
```

The only argument can be two types of interfaces:
- For the case you have parameters, you can use the `MongoParamsInterface` that requires an object with the following parameters: `host`, `db` (Database name), `user` (optional), `pass` (optional), `protocol` (optional with `mongodb` or `mongodb+srv` as possible values), `options` (optional with URL parameters for additional configurations) and `port` (optional) required to establish a connection with a Mongo Database.
- For the case you have a URL string, you can use the `MongoUrlParamsInterface` that requires an object with only the `url` parameter with the URL string connection.

## Query Builders

To facilitate query building, this module have several methods available to you for CRUD operations like the following:


### `QueryFind(db: MongoConnector, collection: string, where?: MongoWhereOptions, options?: MongoFindOptions): Promise<any[]>`

Builds a query object to fetch records from the database using the select statement.

* **db**: The MongoConnector service.
* **collection**: The collection name.
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MongoFindOptions for additional operators for the query:
  * **fields**: An array of strings oto be included in the document projection statement.
  ```js
  let fields = ["email", "name"]
  ```
  * **sort**: An instance of MongoEntitySortOptions instances. The object must include the fields with the possible values of `ASC` or `DESC`. The order of parameters in the object will be used as the sorting priority:
  ```js
  let sort = {
    name: "ASC"
  }
  ```

  * **limit**: An instance to define the pagination of the query with `per` for the number of elements in the result and `page` for the pagination. The maximum number of elements is 1000. By default is the first page with 1000 elements.
  ```js
  let limit = {page: 1, per: 1000}
  ```


### `QueryFindOne(db: MongoConnector, collection: string, where?: MongoWhereOptions, options?: MongoFindOneOptions): Promise<any>`

Builds a query object to fetch records from the database using the select statement by retrieveng only the first row.

* **db**: The MongoConnector service
* **collection**: The collection name.
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MongoFindOneOptions for additional operators for the query:
  * **fields**: An array of strings oto be included in the document projection statement.
  ```js
  let fields = ["email", "name"]
  ```
  * **sort**: An instance of MongoEntitySortOptions instances. The object must include the fields with the possible values of `ASC` or `DESC`. The order of parameters in the object will be used as the sorting priority:
  ```js
  let sort = {
    name: "ASC"
  }
  ```

### `QueryCount(db: MongoConnector, collection: string, where?: MongoWhereOptions): Promise<number>`

Builds a query object to fetch records from the database using the count() statement.

* **db**: The MongoConnector service
* **collection**: The collection name.
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.

### `QueryDistinct(db: MongoConnector, collection: string, field: string, where?: MongoWhereOptions): Promise<any[]>`

Builds a query object to fetch records from the database using the distinct() statement.

* **db**: The MongoConnector service
* **collection**: The collection name.
* **distinct**: The field to consider the distinction statement.
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.

### `QueryInsert(db: MongoConnector, collection: string, doc: any): Promise<ObjectId>`

Builds a query object to add a document in the database using the insert statement. 
It returns the Object Id of the added document.

* **db**: The MongoConnector service
* **collection**: The collection name.
* **doc**: An object with the values to add. It is required to have at least one value to execute the insert statement:
```js
let document = {firstName: "Luis", lastName: "Example"}
```

### `QueryUpdate(db: MongoConnector, collection: string, action: MongoEntityUpdateAction, where?: MongoWhereOptions): Promise<number>`

Builds a query object to update records in the database using the update statement. 
It returns the number of affected documents.

* **db**: The MongoConnector service
* **collection**: The collection name.
* **action**: An object with the values to update or the action to execute. It is required to have at least one value to execute the update statement. It follows the Mongo string update operators `$set`, `$currentDate`, `$unset`, `$rename`, `$inc`. check the [MongoDB documentation](https://www.mongodb.com/docs/manual/reference/operator/update/#update-operators) for more details:
```js
let action = {"$set": {firstName: "Luis", lastName: "Example"} }
```
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.

### `QueryDelete(db: MongoConnector, collection: string, where: MongoWhereOptions, force?: boolean): Promise<number>`

Builds a query object to erase records in the database using the delete statement. 
It returns the number of affected documents.

* **db**: The MongoConnector service
* **collection**: The collection name.
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **force**: In the case the where options is empty, then it's required to use the force. By default it's `false`.

## Entities

As part of this module, you can create entities (or clases representing a schema for documents in a collection) as Database Access Objects for easy management to all CRUD operatios.

### Entity Definition

To define an entity class simply extend the class with the `MongoEntity` class like the following:

```js
class User extends MongoEntity {
  firstName: string
  lastName: string
  createdAt: Date
}

let user = new User({firstName: "Luis", lastName: "Example"})
user.createdAt = new Date()
```

All entities have the `_id` parameters as the primary identifier of a document.

Additional from the class, it's required to define the entity's table schema. Just use the static method `DefineSchema()`.
In this definition it will declare the Table's name, the columns and other settings:

```js
class User extends MongoEntity {
  firstName: string
  lastName: string
  createdAt: Date
}

User.DefineSchema("users", {
  firstName: MongoDataType.STRING,
  lastName: MongoDataType.STRING,
  createdAt: {
    type: MongoDataType.DATE,
    required: true,
    default: MongoDataType.DATENOW
  }
})
```

In the schema definition, you can set:

* **Schema's Name**: The Table's name
* **Columns**: A set of columns for the table where you can define:
  * **type** The Column Data Type. It's a enum with the name `MongoDataType` with the options: `STRING`, `NUMBER`, `BOOLEAN`, `DATE`, `OBJECT_ID`, `ARRAY` and `MIXED`.
  * **required**: Similar as the `NOT NULL` statement. It will add validators to avoid updating or inserting empty values in the collection. By default it is `false`.
  * **default**: Set the default value for the column. It can accept any value including a function. You can also use the enum `MongoDataType` to allow a predefined "on-creation" value (`NULL`, `DATENOW`, `UUIDV1` and `UUIDV4`). By default it is `null`.
  * **alias**: In the case that the entity parameter key is different from the document's name in the database, then you can define it in the `alias` property like:
  ```js
  {
    createdAt: {
      type: MongoDataType.DATETIME,
      default: MongoDefaultValues.DATENOW,
      alias: "created_at"
    }
  }
  ```
  * **validators**: It's an array of functions to validate the value of the column. This function needs to have an input to send the current value and returns an object with `success` for the boolean result of the validation and optionaly a `message` to send a custom error message:
  ```js
  let customValidation = (value: any) => {
    let result = value != null && value.length >= 5
    return {success: result, message: result ? null : "Invalid value"}
  }
  let validations = [customValidation]
  ```
  * **min**: This parameter will only be considered if the column data type is a number. It adds a validation that will force the column to have a value greater or equal than this option.
  * **max**: This parameter will only be considered if the column data type is a number. It adds a validation that will force the column to have a value lower or equal than this option.
  * **minLength**: This parameter will only be considered if the column data type is a string. It adds a validation that will force the column to have a length greather or equal than this option. If the value is `null`, the length will be considered as `0`. The validation will be ignored if the value is `null` and is not required.
  * **maxLength**: This parameter will only be considered if the column data type is a string. It adds a validation that will force the column to have a length lower or equal than this option. If the value is `null`, the length will be considered as `0`. The validation will be ignored if the value is `null` and is not required.

### Entity Static methods

The entity class have a set of methods to easily execute CRUD operations:

```js
let users = await User.Find(db, {firstName: {$like: "L%"}})
```

#### `Entity.Find(db: MongoConnector, where?: MongoWhereOptions, options?: MongoEntityFindOptions): Promise<any[]>`

Similar as the `QueryFind` method, it will fetch records from the database with a select statement.

* **db**: The MongoConnector service
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MongoFindOptions for additional operators for the query:
  * **fields**: An array of strings oto be included in the document projection statement.
  ```js
  let fields = ["email", "name"]
  ```
  * **sort**: An instance of MongoEntitySortOptions instances. The object must include the fields with the possible values of `ASC` or `DESC`. The order of parameters in the object will be used as the sorting priority:
  ```js
  let sort = {
    name: "ASC"
  }
  ```

  * **limit**: An instance to define the pagination of the query with `per` for the number of elements in the result and `page` for the pagination. The maximum number of elements is 1000. By default is the first page with 1000 elements.
  ```js
  let limit = {page: 1, per: 1000}
  ```


#### `Entity.FindOne(db: MongoConnector, where?: MongoWhereOptions, options?: MongoEntityFindOneOptions): Promise<any>`

Similar as the `QueryFindOne` method, it will fetch the first record from the database with a select statement.

* **db**: The MongoConnector service
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MongoEntityFindOneOptions for additional operators for the query:
  * **fields**: An array of strings oto be included in the document projection statement.
  ```js
  let fields = ["email", "name"]
  ```
  * **sort**: An instance of MongoEntitySortOptions instances. The object must include the fields with the possible values of `ASC` or `DESC`. The order of parameters in the object will be used as the sorting priority:
  ```js
  let sort = {
    name: "ASC"
  }
  ```

#### `Entity.FindOneOrThrow(db: MongoConnector, where?: MongoWhereOptions, options?: MongoEntityFindOneOptions): Promise<any>`

Similar as the `QueryFindOne` method, it will fetch the first record from the database with a select statement. This method will throw an `MongoEntityNotFound` exception if item is not found.

* **db**: The MongoConnector service
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MongoEntityFindOneOptions for additional operators for the query:
  * **fields**: An array of strings oto be included in the document projection statement.
  ```js
  let fields = ["email", "name"]
  ```
  * **sort**: An instance of MongoEntitySortOptions instances. The object must include the fields with the possible values of `ASC` or `DESC`. The order of parameters in the object will be used as the sorting priority:
  ```js
  let sort = {
    name: "ASC"
  }
  ```

#### `Entity.Count(db: MongoConnector, where?: MongoWhereOptions): Promise<number>`

Similar as the `QueryCount` method, it will execute a statement with the `count()` operator.

* **db**: The MongoConnector service
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.


#### `Entity.UpdateAll(db: MongoConnector, action: MongoEntityUpdateAction, where?: MongoWhereOptions): Promise<number>`

Similar as the `QueryUpdate` method, it will execute an update statement. 
It returns the number of added documents in the database.

* **db**: The MongoConnector service
* **action**: An object with the values to update or the action to execute. It is required to have at least one value to execute the update statement. It follows the Mongo string update operators `$set`, `$currentDate`, `$unset`, `$rename`, `$inc`. check the [MongoDB documentation](https://www.mongodb.com/docs/manual/reference/operator/update/#update-operators) for more details:
```js
let action = {"$set": {firstName: "Luis", lastName: "Example"} }
```
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.


#### `Entity.RemoveAll(db: MongoConnector, where: MongoWhereOptions, force?: boolean): Promise<number>`

Similar as the `QueryDelete` method, it will execute a delete statement. 
It returns the number of deleted documents in the database.

* **db**: The MongoConnector service
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **force**: In the case the where options is empty, then it's required to use the force. By default it's `false`.



### Entity Instance methods

For Entity instances (objects) other methods are available using the instance parameters as values for the entity's columns.

```js
let user = new User({firstName: "Luis", lastName: "Example"})
user.createdAt = new Date()
await user.insert(db) // MongoConnector
```

#### `EntityInstance.insert(db: MongoConnector): Promise<any>`

Execute an insert statement using the values from the Entity's instance.
It returns the Object ID generated from the database. 
This value is also assigned to the instance's `_id` parameter.

#### `EntityInstance.update(db: MongoConnector): Promise<any>`

Execute an `UPDATE` statement using the values from the Entity's instance.
It returns the number of updated rows from the database. 
This value should be `1`.

#### `EntityInstance.remove(db: MongoConnector): Promise<any>`

Execute a `DELETE` statement using the primary key from the Entity's instance as filter.
It returns the number of deleted rows from the database. 
This value should be `1`.

#### `EntityInstance.validate(db?: MongoConnector): Promise<any>`

Perform a validation using the column validations from the Entity Schema definitiom.
It returns an object with parameters where the `key` is the name of the instance parameter and the `value` the error message.

The default error messages can be one of the following:
* REQUIRED
* INVALID_TYPE
* INVALID_VALUE
* MAX_VALUE
* MIN_VALUE
* MAX_LENGTH
* MIN_LENGTH
* UNIQUE

Remember that custom error messages can be included in the Schema definition.


## Where Operators

* **$and**: By default, all parameters in an object are considered AND operators, but explicitely you can use the `$and` operator in an array like the following:
```js
let where1 = {status: "active", name: "Luis"} // status = "active" AND name = "Luis"
let where2 = {status: "active", "$and": [{age: 10}, {name: "Luis"}]} // status = "active" AND age = 10 AND name = "Luis"
let where3 = {status: "active", "$and": [{age: {"$gte": 18}}, {age: {"$lt": 65}}]} // status = "active" AND age >= 18 AND age < 65
```
* **$or**: It must be an array of objects where you can define the required options like the following:
```js
let where = {"$or": [{name: "Luis"}, {name: "David"}]} // name = "Luis" OR name = "David"
```

* **$eq**: Equals operator:
```js
let where = {age: {"$eq": 18}} // age = 18
```

* **$ne**: Not equals operator:
```js
let where = {age: {"$ne": 18}} // age <> 18
```

* **$gt**: Greater than operator:
```js
let where = {age: {"$gt": 18}} // age > 18
```

* **$gte**: Greater than equal operator:
```js
let where = {age: {"$gte": 18}} // age >= 18
```

* **$lt**: Lower than operator:
```js
let where = {age: {"$lt": 18}} // age < 18
```

* **$lte**: Lower than equal operator:
```js
let where = {age: {"$lte": 18}} // age <= 18
```

* **$not**: Is not operator:
```js
let where = {isActive: {"$not": 18}} // age IS NOT 18
```

* **$in**: In operator. Mostly used for arrays:
```js
let where = {name: {"$in": ["Luis", "Miguel", "David", "Alejandro"]}} // name IN ("Luis", "Miguel", "David", "Alejandro")
```

* **$nin**: Not in operator. Mostly used for arrays:
```js
let where = {name: {"$nin": ["Luis", "Miguel", "David", "Alejandro"]}} // name NOT IN ("Luis", "Miguel", "David", "Alejandro")
```

For more operators, check the [MongoDB Documentation](https://www.mongodb.com/docs/manual/reference/operator/query/#std-label-query-selectors) for more information.