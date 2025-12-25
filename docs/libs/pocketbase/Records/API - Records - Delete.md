# API Collections

## Create Record

Deletes a single collection Record by its ID.

Depending on the collection's ```deleteRule``` value, the access to this action may or may not have been restricted.

You could find individual generated records API documentation from the Dashboard.

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

await pb.collection('demo').delete('YOUR_RECORD_ID');
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

#### Responses

##### 204
```
null
```

##### 400
```
{
  "status": 400,
  "message": "Failed to delete record. Make sure that the record is not part of a required relation reference.",
  "data": {}
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