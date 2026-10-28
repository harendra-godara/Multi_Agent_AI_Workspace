from dataclasses import dataclass
from datetime import datetime, timezone

@dataclass
class Task:
    id: str
    workspace_id: str
    title: str
    description: str
    priority: str
    status: str
    created_at: str
    internal_note: str = ""

    def as_json(self):
        return {k: getattr(self, k) for k in
                ("id","workspace_id","title","description","priority","status","created_at")}

def now_iso():
    return datetime.now(timezone.utc).isoformat()
