# API Collections

## Import Collections

Bulk imports the provided Collections configuration.

Only superusers can perform this actio

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

const importData = [
    {
        name: 'collection1',
        schema: [
            {
                name: 'status',
                type: 'bool',
            },
        ],
    },
    {
        name: 'collection2',
        schema: [
            {
                name: 'title',
                type: 'text',
            },
        ],
    },
];

await pb.collections.import(importData, false);
```

### API Details

#### Body Parameters

1. collections
    * required: True
    * type: Array\<Collection>
    * description:
        * List of collections to import (replace and create).
2. deleteMissing
    * required: False
    * type: Boolean
    * Description:
        * If true all existing collections and schema fields that are not present in the imported configuration will be deleted, including their related records data (default to false).

#### Responses

##### 204
```
null
```

##### 400
```
{
  "code": 400,
  "message": "An error occurred while submitting the form.",
  "data": {
    "collections": {
      "code": "collections_import_failure",
      "message": "Failed to import the collections configuration."
    }
  }
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