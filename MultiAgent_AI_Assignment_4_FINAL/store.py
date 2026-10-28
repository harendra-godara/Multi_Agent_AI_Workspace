class TaskStore:
    def __init__(self):
        self.tasks = {}
        self.idempotency = {}

    def save(self, task): self.tasks[task.id] = task
    def get(self, task_id): return self.tasks.get(task_id)
    def list(self, status=None):
        xs = list(self.tasks.values())
        return [x for x in xs if not status or x.status == status]
    def remember(self, key, task_id): self.idempotency[key] = task_id
    def existing(self, key): return self.idempotency.get(key)
