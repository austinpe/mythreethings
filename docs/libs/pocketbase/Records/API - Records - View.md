# API Collections

## View Record

Returns a single collection record by its ID.

Depending on the collection's ```viewRule``` value, the access to this action may or may not have been restricted.

You could find individual generated records API documentation in the "Dashboard > Collections > API Preview".

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

const record1 = await pb.collection('posts').getOne('RECORD_ID', {
    expand: 'relField1,relField2.subRelField',
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
  "id": "ae40239d2bc4477",
  "collectionId": "a98f514eb05f454",
  "collectionName": "posts",
  "updated": "2022-06-25 11:03:50.052",
  "created": "2022-06-25 11:03:35.163",
  "title": "test1"
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
  "message": "The requested resource wasn't found.",
  "data": {}
}
```