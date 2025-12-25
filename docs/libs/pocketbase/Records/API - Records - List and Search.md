# API Records

## List and Search Records

Returns a paginated records list, supporting sorting and filtering.

Depending on the collection's ```listRule``` value, the access to this action may or may not have been restricted.

You could find individual generated records API documentation in the "Dashboard > Collections > API Preview".

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

// fetch a paginated records list
const resultList = await pb.collection('posts').getList(1, 50, {
    filter: 'created >= "2022-01-01 00:00:00" && someField1 != someField2',
});

// you can also fetch all records at once via getFullList
const records = await pb.collection('posts').getFullList({
    sort: '-created',
});

// or fetch only the first record that matches the specified filter
const record = await pb.collection('posts').getFirstListItem('someField="test"', {
    expand: 'relField1,relField2.subRelField',
});
```

### API Details

#### Path Parameters

1. collectionOrName
    * type: String
    * Description:
      * ID or name of the records' collection.

#### Query Parameters
1. page
    * type: Number
    * Description:
      * The page (aka. offset) of the paginated list (default to 1).
2. perPage
    * type: Number
    * Description:
      * The max returned collections per page (default to 30).
3. sort
    * type: String
    * Description:
      * Specify the ORDER BY fields.
      * Add ```-``` / ```+``` (default) in front of the attribute for DESC / ASC order, e.g.:
        ```
        // DESC by created and ASC by id
        ?sort=-created,id
        ```
      * Supported collection sort fields:
        * ```@random```
        * ```id```
        * ```created```
        * ```updated```
        * ```name```
        * ```type```
        * ```system```
4. filter
    * type: String
    * Description:
      * Filter expression to filter/search the returned collections list, e.g.:
        ```
        ?filter=(name~'abc' && created>'2022-01-01')
        ```
      * Supported collection filter fields:
        * ```id```
        * ```created```
        * ```updated```
        * ```name```
        * ```type```
        * ```system```
      * The syntax basically follows the format ```OPERAND``` ```OPERATOR``` ```OPERAND```, where:
        * ```OPERAND``` - could be any field literal, string (single or double quoted), number, null, true, false
        * ```OPERATOR``` - is one of:
          * ```=``` Equal
          * ```!=``` NOT equal
          * ```>``` Greater than
          * ```>=``` Greater than or equal
          * ```<``` Less than
          * ```<=``` Less than or equal
          * ```~``` Like/Contains (if not specified auto wraps the right string OPERAND in a "%" for wildcard match)
          * ```!~``` NOT Like/Contains (if not specified auto wraps the right string OPERAND in a "%" for wildcard match)
          * ```?=``` Any/At least one of Equal
          * ```?!=``` Any/At least one of NOT equal
          * ```?>``` Any/At least one of Greater than
          * ```?>=``` Any/At least one of Greater than or equal
          * ```?<``` Any/At least one of Less than
          * ```?<=``` Any/At least one of Less than or equal
          * ```?~``` Any/At least one of Like/Contains (if not specified auto wraps the right string OPERAND in a "%" for wildcard match)
          * ```?!~``` Any/At least one of NOT Like/Contains (if not specified auto wraps the right string OPERAND in a "%" for wildcard match)
      * To group and combine several expressions you can use parenthesis ```(...)```, ```&&``` (AND) and ```||``` (OR) tokens.
      * Single line comments are also supported:
        ```
        // Example comment
        ```
5. expand
    * type: String
    * Description:
      * Auto expand record relations. Ex.:
        ```
        ?expand=relField1,relField2.subRelField
        ```
      * Supports up to 6-levels depth nested relations expansion.
      * The expanded relations will be appended to the record under the ```expand``` property (e.g. ```"expand": {"relField1": {...}, ...}```).
      * Only the relations to which the request user has permissions to view will be expanded.
6. fields
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
7. skipTotal
    * type: Boolean
    * Description:
      * If it is set the total counts query will be skipped and the response fields ```totalItems``` and ```totalPages``` will have ```-1``` value.
      * This could drastically speed up the search queries when the total counters are not needed or cursor based pagination is used.
      * For optimization purposes, it is set by default for the ```getFirstListItem()``` and ```getFullList()``` SDKs methods.

#### Responses

##### 200
```
{
  "page": 1,
  "perPage": 100,
  "totalItems": 2,
  "totalPages": 1,
  "items": [
    {
      "id": "ae40239d2bc4477",
      "collectionId": "a98f514eb05f454",
      "collectionName": "posts",
      "updated": "2022-06-25 11:03:50.052",
      "created": "2022-06-25 11:03:35.163",
      "title": "test1"
    },
    {
      "id": "d08dfc4f4d84419",
      "collectionId": "a98f514eb05f454",
      "collectionName": "posts",
      "updated": "2022-06-25 11:03:45.876",
      "created": "2022-06-25 11:03:45.876",
      "title": "test2"
    }
  ]
}
```

##### 400
```
{
  "status": 400,
  "message": "Something went wrong while processing your request. Invalid filter.",
  "data": {}
}
```

##### 403
```
{
  "status": 403,
  "message": "Only admins can filter by '@collection.*'",
  "data": {}
}
```