#!/usr/bin/env bash
# End-to-end smoke test for the whole backend. Usage: bash smoke_test.sh [BASE_URL]
# Needs: curl, jq, server running, SERVICE_API_KEY exported (same value the server uses).
BASE="${1:-http://localhost:5000}"
KEY="${SERVICE_API_KEY:-}"
PASS_N=0; FAIL_N=0
RUN_ID=$(date +%s)$RANDOM

# req METHOD PATH [TOKEN] [JSON_BODY] [EXTRA_HEADER] -> sets CODE and BODY
req() {
  local method="$1" path="$2" token="$3" body="$4" extra="$5"
  local args=(-s -o /tmp/smoke_body -w '%{http_code}' -X "$method" "$BASE$path" -H 'Content-Type: application/json')
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$extra" ] && args+=(-H "$extra")
  [ -n "$body" ] && args+=(-d "$body")
  CODE=$(curl "${args[@]}"); BODY=$(cat /tmp/smoke_body)
}
check() { # check "name" expected_code
  if [ "$CODE" = "$2" ]; then PASS_N=$((PASS_N+1)); echo "  ok   $1 ($CODE)"
  else FAIL_N=$((FAIL_N+1)); echo "  FAIL $1: expected $2, got $CODE -> $BODY"; fi
}
field() { echo "$BODY" | jq -r "$1"; }
expect_field() { # expect_field "name" jq_expr expected
  local got; got=$(field "$2")
  if [ "$got" = "$3" ]; then PASS_N=$((PASS_N+1)); echo "  ok   $1 ($got)"
  else FAIL_N=$((FAIL_N+1)); echo "  FAIL $1: expected '$3', got '$got'"; fi
}

echo "== health"; req GET /api/health; check "health" 200

echo "== auth"
A_EMAIL="alice_$RUN_ID@example.com"; B_EMAIL="bob_$RUN_ID@example.com"
req POST /api/auth/register "" '{"name":"Alice","email":"'$A_EMAIL'","password":"Passw0rd!"}'; check "register alice" 201; A_TOKEN=$(field .token)
req POST /api/auth/register "" '{"name":"Alice","email":"'$A_EMAIL'","password":"Passw0rd!"}'; check "register duplicate" 409
req POST /api/auth/register "" '{"name":"X","email":"bad","password":"Passw0rd!"}'; check "register bad email" 400
req POST /api/auth/register "" '{"name":"X","email":"x_'$RUN_ID'@example.com","password":"short"}'; check "register short password" 400
req POST /api/auth/register "" '{"name":"Bob","email":"'$B_EMAIL'","password":"Passw0rd!"}'; check "register bob" 201; B_TOKEN=$(field .token)
req POST /api/auth/login "" '{"email":"'$A_EMAIL'","password":"wrong"}'; check "login wrong password" 401
req POST /api/auth/login "" '{"email":"'$A_EMAIL'","password":"Passw0rd!"}'; check "login ok" 200; A_TOKEN=$(field .token)
req GET /api/auth/me "$A_TOKEN"; check "me" 200
req GET /api/auth/me "" ; check "me without token" 401
req POST /api/auth/login "" '{"email":"'$A_EMAIL'","password":"Passw0rd!"}'; TMP_TOKEN=$(field .token)
req POST /api/auth/logout "$TMP_TOKEN"; check "logout" 204
req GET /api/auth/me "$TMP_TOKEN"; check "revoked token rejected" 401
req GET /api/auth/me "$A_TOKEN"; check "other session still valid" 200

echo "== workspaces"
req POST /api/workspaces "$A_TOKEN" '{"name":"WS One","description":"d"}'; check "create workspace" 201; WS=$(field .id)
req POST /api/workspaces "$A_TOKEN" '{}'; check "create workspace no name" 400
req GET /api/workspaces "$A_TOKEN"; check "list workspaces" 200
req GET /api/workspaces/$WS "$A_TOKEN"; check "get workspace" 200
req GET /api/workspaces/$WS "$B_TOKEN"; check "non-member gets 404" 404
req PATCH /api/workspaces/$WS "$A_TOKEN" '{"name":"WS Renamed"}'; check "rename workspace" 200; expect_field "name updated" .name "WS Renamed"
req PATCH /api/workspaces/$WS "$A_TOKEN" '{}'; check "patch workspace empty" 400

echo "== members & invites"
req POST /api/workspaces/$WS/invite "$A_TOKEN" '{"email":"'$B_EMAIL'","role":"Member"}'; check "invite bob" 201; INV=$(field .id)
req POST /api/workspaces/$WS/invite "$A_TOKEN" '{"email":"'$B_EMAIL'"}'; check "invite duplicate" 409
req GET /api/invites "$B_TOKEN"; check "bob lists invites" 200
req POST /api/invites/$INV/accept "$A_TOKEN"; check "wrong user cannot accept" 404
req POST /api/invites/$INV/accept "$B_TOKEN"; check "bob accepts" 200
req GET /api/workspaces/$WS/members "$B_TOKEN"; check "bob lists members" 200
req PATCH /api/workspaces/$WS/members/$INV "$B_TOKEN" '{"role":"Admin"}'; check "member cannot change role" 403
req PATCH /api/workspaces/$WS/members/$INV "$A_TOKEN" '{"role":"Admin"}'; check "owner promotes bob" 200
req PATCH /api/workspaces/$WS/members/$INV "$A_TOKEN" '{"role":"Member"}'; check "owner demotes bob" 200
C_EMAIL="carol_$RUN_ID@example.com"
req POST /api/workspaces/$WS/invite "$A_TOKEN" '{"email":"'$C_EMAIL'"}'; check "invite unregistered email" 201; CINV=$(field .id)
req DELETE /api/workspaces/$WS/members/$CINV "$A_TOKEN"; check "cancel pending invite" 204
req POST /api/workspaces/$WS/invite "$A_TOKEN" '{"email":"dave_'$RUN_ID'@example.com"}'
req POST /api/auth/register "" '{"name":"Dave","email":"dave_'$RUN_ID'@example.com","password":"Passw0rd!"}'; D_TOKEN=$(field .token)
req GET /api/invites "$D_TOKEN"; DINV=$(echo "$BODY" | jq -r '.[0].id')
req POST /api/invites/$DINV/decline "$D_TOKEN"; check "dave declines" 204
req GET /api/workspaces/$WS/members "$A_TOKEN"; OWNER_MEMBER=$(echo "$BODY" | jq -r '.[] | select(.role=="Owner") | .id')
req DELETE /api/workspaces/$WS/members/$OWNER_MEMBER "$A_TOKEN"; check "owner cannot be removed" 403

echo "== tasks"
req POST /api/workspaces/$WS/tasks "$A_TOKEN" '{"title":"Task A","description":"first"}'; check "create task A" 201; TA=$(field .id); expect_field "default status" .status pending
req POST /api/workspaces/$WS/tasks "$B_TOKEN" '{"title":"Task B"}'; check "member creates task B" 201; TB=$(field .id)
req POST /api/workspaces/$WS/tasks "$A_TOKEN" '{"title":"Task C"}'; check "create task C" 201; TC=$(field .id)
req POST /api/workspaces/$WS/tasks "$A_TOKEN" '{}'; check "task without title" 400
req POST /api/workspaces/$WS/tasks "" '{"title":"x"}'; check "task without token" 401
req GET "/api/workspaces/$WS/tasks?status=pending" "$A_TOKEN"; check "list tasks filtered" 200; expect_field "3 pending" 'length' 3
req GET "/api/workspaces/$WS/tasks?status=bogus" "$A_TOKEN"; check "bad status filter" 400
req GET /api/tasks/$TA "$A_TOKEN"; check "get task" 200
req GET /api/tasks/$TA "$D_TOKEN"; check "outsider cannot see task" 404
req GET /api/tasks/not-a-uuid "$A_TOKEN"; check "bad task id" 404
req PATCH /api/tasks/$TA "$A_TOKEN" '{"title":"Task A v2"}'; check "edit title" 200; expect_field "title updated" .title "Task A v2"
req PATCH /api/tasks/$TA "$A_TOKEN" '{"status":"running"}'; check "cannot set running by hand" 409
req PATCH /api/tasks/$TA "$A_TOKEN" '{"status":"nonsense"}'; check "invalid status" 400

echo "== dependencies"
req POST /api/tasks/$TB/dependencies "$A_TOKEN" '{"dependsOnTaskId":"'$TA'"}'; check "B depends on A" 201
req POST /api/tasks/$TB/dependencies "$A_TOKEN" '{"dependsOnTaskId":"'$TA'"}'; check "duplicate dependency" 409
req POST /api/tasks/$TA/dependencies "$A_TOKEN" '{"dependsOnTaskId":"'$TA'"}'; check "self dependency" 400
req POST /api/tasks/$TA/dependencies "$A_TOKEN" '{"dependsOnTaskId":"'$TB'"}'; check "direct cycle A->B->A" 409
req POST /api/tasks/$TC/dependencies "$A_TOKEN" '{"dependsOnTaskId":"'$TB'"}'; check "C depends on B" 201
req POST /api/tasks/$TA/dependencies "$A_TOKEN" '{"dependsOnTaskId":"'$TC'"}'; check "indirect cycle A->C->B->A" 409
req GET /api/tasks/$TB/dependencies "$A_TOKEN"; check "list dependencies" 200; expect_field "B has 1 dep" 'length' 1

echo "== runs"
req POST /api/tasks/$TB/run "$A_TOKEN"; check "run blocked by dependency" 409
req POST /api/tasks/$TA/run "$A_TOKEN"; check "run task A" 202; RUN=$(field .run.id)
req POST /api/tasks/$TA/run "$A_TOKEN"; check "second run rejected" 409
req GET /api/tasks/$TA "$A_TOKEN"; expect_field "task is running" .status running
req DELETE /api/tasks/$TA "$A_TOKEN"; check "cannot delete running task" 409
req GET /api/runs/$RUN "$A_TOKEN"; check "get run" 200
req GET /api/runs/$RUN "$D_TOKEN"; check "outsider cannot see run" 404
req PATCH /api/runs/$RUN "" '{"status":"completed","result":{"output":"ok"}}'; check "callback without service key" 401
if [ -n "$KEY" ]; then
  req PATCH /api/runs/$RUN "" '{"status":"bogus"}' "X-Service-Key: $KEY"; check "callback bad status" 400
  req PATCH /api/runs/$RUN "" '{"status":"completed","result":{"output":"ok"}}' "X-Service-Key: $KEY"; check "callback completes run" 200
  req PATCH /api/runs/$RUN "" '{"status":"failed"}' "X-Service-Key: $KEY"; check "callback twice rejected" 409
  req GET /api/tasks/$TA "$A_TOKEN"; expect_field "task completed" .status completed
  req POST /api/tasks/$TB/run "$A_TOKEN"; check "run B now unblocked" 202
  req PATCH /api/tasks/$TB "$A_TOKEN" '{"status":"pending"}'; check "cancel running task by hand" 200
  req GET /api/tasks/$TB/runs "$A_TOKEN"; expect_field "run marked cancelled" '.[0].status' cancelled
else
  echo "  skip callback tests (SERVICE_API_KEY not exported)"
fi
req GET /api/tasks/$TA/runs "$A_TOKEN"; check "list runs" 200

echo "== cleanup / delete"
req DELETE /api/tasks/$TC "$B_TOKEN"; check "member cannot delete others' task" 403
req DELETE /api/tasks/$TC "$A_TOKEN"; check "owner deletes task" 204
req GET /api/tasks/$TC "$A_TOKEN"; check "deleted task gone" 404
req POST /api/workspaces/$WS/leave "$A_TOKEN"; check "owner cannot leave" 403
req POST /api/workspaces/$WS/leave "$B_TOKEN"; check "bob leaves" 204
req GET /api/workspaces/$WS "$B_TOKEN"; check "bob no longer has access" 404
req DELETE /api/workspaces/$WS "$B_TOKEN"; check "non-member cannot delete" 404
req DELETE /api/workspaces/$WS "$A_TOKEN"; check "owner deletes workspace" 204
req GET /api/nope "$A_TOKEN"; check "unknown route" 404
req POST /api/auth/login "" '{bad json'; check "malformed JSON" 400
req POST /api/auth/logout-all "$A_TOKEN"; check "logout all" 204
req GET /api/auth/me "$A_TOKEN"; check "all sessions revoked" 401

echo; echo "passed: $PASS_N  failed: $FAIL_N"
[ "$FAIL_N" -eq 0 ]
