# API Auth

## Auth refresh

Returns a new auth response (token and user data) for already authenticated auth record.

This method is usually called by users on page/screen reload to ensure that the previously stored data in ```pb.authStore``` is still valid and up-to-date.

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

const authData = await pb.collection('users').authRefresh();

// after the above you can also access the refreshed auth data from the authStore
console.log(pb.authStore.isValid);
console.log(pb.authStore.token);
console.log(pb.authStore.record.id);
```

### API Details

#### Path Parameters

1. collectionOrName
    * type: String
    * Description:
      * ID or name of the auth collection.

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

##### 400
```
{
  "status": 400,
  "message": "An error occurred while submitting the form.",
  "data": {
    "password": {
      "code": "validation_required",
      "message": "Missing required value."
    }
  }
}
```
