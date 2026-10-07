export type UpdatePriority = "critical" | "normal" | "distant" | "sleeping";

export class UpdateScheduler {
  private next = new Map<string, number>();

  shouldUpdate(id: string, hz: number, now: number, priority: UpdatePriority): boolean {
    if (priority === "critical") return true;
    if (priority === "sleeping") return false;
    const interval = 1000 / Math.max(1, hz);
    const due = this.next.get(id) ?? 0;
    if (now < due) return false;
    this.next.set(id, now + interval);
    return true;
  }

  remove(id: string) { this.next.delete(id); }
  clear() { this.next.clear(); }
}
