import os, uuid, random, time, requests
from flask import Flask, jsonify, request, make_response
from models import Task, now_iso
from store import TaskStore
from errors import problem, fail

app = Flask(__name__)
store = TaskStore()
STATUS = {"pending","running","completed","cancelled","failed"}
PRIORITY = {"low","medium","high"}

def validate(body):
    if not isinstance(body, dict):
        return problem(400,"Malformed body","Request body must be a JSON object.")
    for k in ("workspace_id","title","description"):
        if k not in body:
            return problem(400,"Malformed body",f"Missing required field: {k}")
        if not isinstance(body[k],str) or not body[k].strip():
            return problem(400,"Malformed body",f"{k} must be a non-empty string.")
    if body.get("priority","medium") not in PRIORITY:
        return problem(422,"Domain validation failed","Invalid priority.")
    return None

def call_agent_service(task):
    url = os.environ.get("AGENT_SERVICE_URL")
    if not url: raise RuntimeError("AGENT_SERVICE_URL is not configured")
    headers={"Content-Type":"application/json","Idempotency-Key":f"task-{task.id}"}
    data={"task_id":task.id,"workspace_id":task.workspace_id,"title":task.title}
    last=None
    for attempt in range(3):
        try:
            r=requests.post(url.rstrip("/")+"/agent-runs",json=data,headers=headers,timeout=2)
            if 400 <= r.status_code < 500: r.raise_for_status()
            r.raise_for_status()
            return r
        except requests.RequestException as e:
            last=e
            if attempt == 2: break
            time.sleep(0.25*(2**attempt)+random.uniform(0,0.15))
    raise RuntimeError(last)

@app.post("/tasks")
def create():
    body=request.get_json(silent=True)
    p=validate(body)
    if p: return fail(p)
    key=request.headers.get("Idempotency-Key")
    if key and store.existing(key):
        t=store.get(store.existing(key))
        r=make_response(jsonify(t.as_json()),201)
        r.headers["Location"]=f"/tasks/{t.id}"
        return r
    t=Task(str(uuid.uuid4()),body["workspace_id"],body["title"].strip(),
           body["description"].strip(),body.get("priority","medium"),
           "pending",now_iso(),"internal only")
    store.save(t)
    if key: store.remember(key,t.id)
    r=make_response(jsonify(t.as_json()),201)
    r.headers["Location"]=f"/tasks/{t.id}"
    return r

@app.get("/tasks")
def listing():
    status=request.args.get("status")
    if status and status not in STATUS:
        return fail(problem(400,"Malformed query","Unknown status filter."))
    return jsonify({"items":[t.as_json() for t in store.list(status)]}),200

@app.get("/tasks/<task_id>")
def get_one(task_id):
    t=store.get(task_id)
    if not t: return fail(problem(404,"Not found","Task does not exist."))
    return jsonify(t.as_json()),200

@app.post("/tasks/<task_id>/cancellation")
def cancel(task_id):
    t=store.get(task_id)
    if not t: return fail(problem(404,"Not found","Task does not exist."))
    if t.status=="cancelled": return fail(problem(409,"State conflict","Task is already cancelled."))
    if t.status=="completed": return fail(problem(409,"State conflict","Completed tasks cannot be cancelled."))
    if t.status=="failed": return fail(problem(422,"Domain validation failed","Failed tasks cannot be cancelled."))
    t.status="cancelled"
    return jsonify(t.as_json()),202

if __name__=="__main__": app.run()
