# API Collections

## List Collections

Returns a paginated Collections list.

Only superusers can perform this action.

```
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

...

await pb.collection("_superusers").authWithPassword('test@example.com', '1234567890');

// fetch a paginated collections list
const pageResult = await pb.collections.getList(1, 100, {
    filter: 'created >= "2022-01-01 00:00:00"',
});

// you can also fetch all collections at once via getFullList
const collections = await pb.collections.getFullList({ sort: '-created' });

// or fetch only the first collection that matches the specified filter
const collection = await pb.collections.getFirstListItem('type="auth"');
```

### API Details

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
5. fields
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
6. skipTotal
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
  "perPage": 2,
  "totalItems": 10,
  "totalPages": 5,
  "items": [
    {
      "id": "_pbc_344172009",
      "listRule": null,
      "viewRule": null,
      "createRule": null,
      "updateRule": null,
      "deleteRule": null,
      "name": "users",
      "type": "auth",
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
          "cost": 0,
          "hidden": true,
          "id": "password901924565",
          "max": 0,
          "min": 8,
          "name": "password",
          "pattern": "",
          "presentable": false,
          "required": true,
          "system": true,
          "type": "password"
        },
        {
          "autogeneratePattern": "[a-zA-Z0-9]{50}",
          "hidden": true,
          "id": "text2504183744",
          "max": 60,
          "min": 30,
          "name": "tokenKey",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": true,
          "system": true,
          "type": "text"
        },
        {
          "exceptDomains": null,
          "hidden": false,
          "id": "email3885137012",
          "name": "email",
          "onlyDomains": null,
          "presentable": false,
          "required": true,
          "system": true,
          "type": "email"
        },
        {
          "hidden": false,
          "id": "bool1547992806",
          "name": "emailVisibility",
          "presentable": false,
          "required": false,
          "system": true,
          "type": "bool"
        },
        {
          "hidden": false,
          "id": "bool256245529",
          "name": "verified",
          "presentable": false,
          "required": false,
          "system": true,
          "type": "bool"
        },
        {
          "autogeneratePattern": "",
          "hidden": false,
          "id": "text1579384326",
          "max": 255,
          "min": 0,
          "name": "name",
          "pattern": "",
          "presentable": false,
          "primaryKey": false,
          "required": false,
          "system": false,
          "type": "text"
        },
        {
          "hidden": false,
          "id": "file376926767",
          "maxSelect": 1,
          "maxSize": 0,
          "mimeTypes": [
            "image/jpeg",
            "image/png",
            "image/svg+xml",
            "image/gif",
            "image/webp"
          ],
          "name": "avatar",
          "presentable": false,
          "protected": false,
          "required": false,
          "system": false,
          "thumbs": null,
          "type": "file"
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
      "indexes": [
        "CREATE UNIQUE INDEX `idx_tokenKey__pbc_344172009` ON `users` (`tokenKey`)",
        "CREATE UNIQUE INDEX `idx_email__pbc_344172009` ON `users` (`email`) WHERE `email` != ''"
      ],
      "system": false,
      "authRule": "",
      "manageRule": null,
      "authAlert": {
        "enabled": true,
        "emailTemplate": {
          "subject": "Login from a new location",
          "body": "..."
        }
      },
      "oauth2": {
        "enabled": false,
        "mappedFields": {
          "id": "",
          "name": "name",
          "username": "",
          "avatarURL": "avatar"
        },
        "providers": [
            {
                "pkce": null,
                "name": "google",
                "clientId": "abc",
                "authURL": "",
                "tokenURL": "",
                "userInfoURL": "",
                "displayName": "",
                "extra": null
            }
        ]
      },
      "passwordAuth": {
        "enabled": true,
        "identityFields": [
          "email"
        ]
      },
      "mfa": {
        "enabled": false,
        "duration": 1800,
        "rule": ""
      },
      "otp": {
        "enabled": false,
        "duration": 180,
        "length": 8,
        "emailTemplate": {
          "subject": "OTP for {APP_NAME}",
          "body": "..."
        }
      },
      "authToken": {
        "duration": 604800
      },
      "passwordResetToken": {
        "duration": 1800
      },
      "emailChangeToken": {
        "duration": 1800
      },
      "verificationToken": {
        "duration": 259200
      },
      "fileToken": {
        "duration": 180
      },
      "verificationTemplate": {
        "subject": "Verify your {APP_NAME} email",
        "body": "..."
      },
      "resetPasswordTemplate": {
        "subject": "Reset your {APP_NAME} password",
        "body": "..."
      },
      "confirmEmailChangeTemplate": {
        "subject": "Confirm your {APP_NAME} new email address",
        "body": "..."
      }
    },
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
  ]
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