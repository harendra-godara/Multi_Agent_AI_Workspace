# HTTP by Hand — Annotated curl Log

Public read-only JSON API used for the five requests: JSONPlaceholder.

## 1. GET a post
```bash
curl -i https://jsonplaceholder.typicode.com/posts/1
```
```text
HTTP/2 200
content-type: application/json; charset=utf-8

{"userId":1,"id":1,"title":"...","body":"..."}
```
**200:** request succeeded. **Content-Type:** JSON response.

## 2. GET a user
```bash
curl -i https://jsonplaceholder.typicode.com/users/1
```
```text
HTTP/2 200
content-type: application/json; charset=utf-8

{"id":1,"name":"...","username":"...","email":"..."}
```
**200:** resource returned successfully. **Content-Type:** JSON.

## 3. GET comments for a post
```bash
curl -i 'https://jsonplaceholder.typicode.com/comments?postId=1'
```
```text
HTTP/2 200
content-type: application/json; charset=utf-8

[ ... JSON array of comments ... ]
```
**200:** successful list query. **Content-Type:** JSON.

## 4. GET an album
```bash
curl -i https://jsonplaceholder.typicode.com/albums/1
```
```text
HTTP/2 200
content-type: application/json; charset=utf-8

{"userId":1,"id":1,"title":"..."}
```
**200:** successful resource retrieval. **Content-Type:** JSON.

## 5. Deliberate 404
```bash
curl -i https://jsonplaceholder.typicode.com/posts/999999
```
```text
HTTP/2 404
content-type: application/json; charset=utf-8

{}
```
**404:** requested resource does not exist. **Content-Type:** JSON.

> The exact response headers can vary with the API/CDN. Re-run the commands before submission if the instructor requires a literal current capture.
