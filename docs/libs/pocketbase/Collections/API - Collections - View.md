# API Collections

## View Collections

Returns a single Collection by its ID or name.

Only superusers can perform this action.

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

const collection = await pb.collections.getOne('demo');
```

### API Details

#### Path Parameters
1. collectionOrName
    * type: String
    * Description:
      * ID or name of the collection to view.

#### Query Parameters
1. fields
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
  "id": "_pbc_2287844090",
  "listRule": null,
  "viewRule": null,
  "createRule": null,
  "updateRule": null,
  "deleteRule": null,
  "name": "posts",
  "type": "base",
  "fields": [
    {
      "autogeneratePattern": "[a-z0-9]{15}",
      "hidden": false,
      "id": "text3208210256",
      "max": 15,
      "min": 15,
      "name": "id",
      "pattern": "^[a-z0-9]+$",
      "presentable": false,
      "primaryKey": true,
      "required": true,
      "system": true,
      "type": "text"
    },
    {
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text724990059",
      "max": 0,
      "min": 0,
      "name": "title",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    },
    {
      "hidden": false,
      "id": "autodate2990389176",
      "name": "created",
      "onCreate": true,
      "onUpdate": false,
      "presentable": false,
      "system": false,
      "type": "autodate"
    },
    {
      "hidden": false,
      "id": "autodate3332085495",
      "name": "updated",
      "onCreate": true,
      "onUpdate": true,
      "presentable": false,
      "system": false,
      "type": "autodate"
    }
  ],
  "indexes": [],
  "system": false
}
```

##### 400
```
{
  "code": 400,
  "message": "Something went wrong while processing your request. Invalid filter.",
  "data": {}
}
```

##### 401
```
{
  "code": 401,
  "message": "The request requires valid record authorization token.",
  "data": {}
}
```

##### 403
```
{
  "code": 403,
  "message": "Only superusers can perform this action.",
  "data": {}
}
```

##### 404
```
{
  "code": 404,
  "message": "The requested resource wasn't found.",
  "data": {}
}
```