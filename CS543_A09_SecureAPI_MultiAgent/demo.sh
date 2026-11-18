#!/usr/bin/env bash
# Runs the five cases of Task 6. Start the server first (npm start), then: bash demo.sh
B=${BASE_URL:-http://localhost:3000}
J='Content-Type: application/json'

echo "== 1) No token -> 401"
curl -s -i $B/items | sed -n '1p;$p'

echo; echo "== 2) Login as member1 and admin1 -> token"
MEMBER=$(curl -s -X POST $B/login -H "$J" -d '{"username":"member1","password":"member123"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
ADMIN=$(curl -s -X POST $B/login -H "$J" -d '{"username":"admin1","password":"admin123"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
echo "member token: ${MEMBER:0:40}..."
echo "admin  token: ${ADMIN:0:40}..."

echo; echo "== 3) GET /items with token -> 200"
curl -s -w "\n[%{http_code}]\n" $B/items -H "Authorization: Bearer $MEMBER"

echo; echo "== 4) admin POST /items -> 201"
curl -s -w "\n[%{http_code}]\n" -X POST $B/items -H "$J" -H "Authorization: Bearer $ADMIN" -d '{"title":"Review agent output","assignedAgent":"QA Agent"}'

echo; echo "== 5) member POST /items -> 403"
curl -s -w "\n[%{http_code}]\n" -X POST $B/items -H "$J" -H "Authorization: Bearer $MEMBER" -d '{"title":"Should not be allowed"}'

echo; echo "== Extra) wrong password -> 401"
curl -s -w "\n[%{http_code}]\n" -X POST $B/login -H "$J" -d '{"username":"admin1","password":"wrong"}'
