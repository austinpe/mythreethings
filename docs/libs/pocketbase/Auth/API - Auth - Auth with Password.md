# API Auth

## Auth with Password

Authenticate a single auth record by combination of a password and a unique identity field (e.g. email).

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

const authData = await pb.collection('users').authWithPassword(
    'YOUR_USERNAME_OR_EMAIL',
    'YOUR_PASSWORD',
);

// after the above you can also access the auth data from the authStore
console.log(pb.authStore.isValid);
console.log(pb.authStore.token);
console.log(pb.authStore.record.id);

// "logout" the last authenticated record
pb.authStore.clear();
```

### API Details

#### Path Parameters

1. collectionOrName
    * type: String
    * Description:
      * ID or name of the auth collection.

#### Body Parameters

1. identity
    * type: String
    * required: true
    * Description:
      * Auth record username or email address.
2. password
    * type: String
    * required: true
    * Description:
      * Auth record password.
3. identityField
    * type: String
    * required: false
    * Description:
      * A specific identity field to use (by default fallbacks to the first matching one).

#### Query Parameters
1. expand
    * type: String
    * Description:
      * Auto expand record relations. Ex.:
        ```
        ?expand=relField1,relField2.subRelField
        ```
      * Supports up to 6-levels depth nested relations expansion.
      * The expanded relations will be appended to the record under the ```expand``` property (e.g. ```"expand": {"relField1": {...}, ...}```).
      * Only the relations to which the request user has permissions to view will be expanded.
2. fields
    * type: String
    * Description:
      * Comma separated string of the fields to return in the JSON response (by default returns all fields). Ex.:
        ```
        ?fields=*,expand.relField.name
        ```
      * ```*``` targets all keys from the specific depth level.
      * In addition, the following field modifiers are also supported:
        * ```
          :excerpt(maxLength, withEllipsis?)
          ```
          Returns a short plain text version of the field string value.
          Ex.:
          ```
          ?fields=*,description:excerpt(200,true)
          ```


#### Responses

##### 200
```
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjRxMXhsY2xtZmxva3UzMyIsInR5cGUiOiJhdXRoUmVjb3JkIiwiY29sbGVjdGlvbklkIjoiX3BiX3VzZXJzX2F1dGhfIiwiZXhwIjoyMjA4OTg1MjYxfQ.UwD8JvkbQtXpymT09d7J6fdA0aP9g4FJ1GPh_ggEkzc",
  "record": {
    "id": "8171022dc95a4ed",
    "collectionId": "d2972397d45614e",
    "collectionName": "users",
    "created": "2022-06-24 06:24:18.434Z",
    "updated": "2022-06-24 06:24:18.889Z",
    "username": "test@example.com",
    "email": "test@example.com",
    "verified": false,
    "emailVisibility": true,
    "someCustomField": "example 123"
  }
}
```

##### 401
```
{
  "status": 401,
  "message": "The request requires valid record authorization token to be set.",
  "data": {}
}
```

##### 403
```
{
  "status": 403,
  "message": "The authorized record model is not allowed to perform this action.",
  "data": {}
}
```

##### 404
```
{
  "status": 404,
  "message": "Missing auth record context.",
  "data": {}
}
```