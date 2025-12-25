# API Collections

## Create Record

Updates an existing collection Record.

Depending on the collection's ```updateRule``` value, the access to this action may or may not have been restricted.

You could find individual generated records API documentation from the Dashboard.

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

const record = await pb.collection('demo').update('YOUR_RECORD_ID', {
    title: 'Lorem ipsum',
});
```

### API Details

#### Path Parameters
1. collectionOrName
    * type: String
    * Description:
      * ID or name of the record's collection.
2. recordId
    * type: String
    * Description:
      * ID of the record to view.

#### Body Parameters

1. oldPassword
    * type: String
    * required: false
    * Description:
      * Old auth record password.
This field is required only when changing the record password. Admins and auth records with "Manage" access can skip this field..
2. password
    * type: String
    * required: false
    * Description:
      * New auth record password.
3. passwordConfirm
    * type: String
    * required: false
    * Description:
      * New auth record password confirmation.
4. Any field from the collection's schema.

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
  "@collectionId": "a98f514eb05f454",
  "@collectionName": "demo",
  "id": "ae40239d2bc4477",
  "updated": "2022-06-25 11:03:50.052",
  "created": "2022-06-25 11:03:35.163",
  "title": "Lorem ipsum"
}
```

##### 400
```
{
  "status": 400,
  "message": "Failed to create record.",
  "data": {
    "title": {
      "code": "validation_required",
      "message": "Missing required value."
    }
  }
}
```

##### 403
```
{
  "status": 403,
  "message": "Only superusers can perform this action.",
  "data": {}
}
```

##### 404
```
{
  "status": 404,
  "message": "The requested resource wasn't found. Missing collection context.",
  "data": {}
}
```