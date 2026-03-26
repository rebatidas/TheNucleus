import React from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../api/client";

export default function Setup() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [queues, setQueues] = React.useState<any[]>([]);
  const [qname, setQName] = React.useState("");

  async function loadUsers() {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadQueues() {
    try {
      const res = await api.get('/api/queues');
      setQueues(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  React.useEffect(() => { loadUsers(); loadQueues(); }, []);

  async function createQueue(e: React.FormEvent) {
    e.preventDefault();
    if (!qname) return;
    try {
      await api.post('/api/queues', { name: qname });
      setQName('');
      loadQueues();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AppLayout title="Setup">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <section style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
          <h3>Users</h3>
          <div>
            {users.length === 0 ? <div>No users found</div> : (
              <ul>
                {users.map(u => <li key={u.id}>{u.name || 'username'} — {u.email || 'email'} — {(u.created_at ? new Date(u.created_at).toLocaleString() : 'time')}</li>)}
              </ul>
            )}
          </div>
        </section>

        <section style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
          <h3>Queues</h3>
          <form onSubmit={createQueue} style={{ marginBottom: 12 }}>
            <input value={qname} onChange={e => setQName(e.target.value)} placeholder="Queue name" style={{ padding: 8, width: '70%' }} />
            <button style={{ marginLeft: 8, padding: '8px 12px' }}>Create</button>
          </form>

          <div>
            {queues.length === 0 ? <div>No queues</div> : (
              <ul>
                {queues.map(q => <li key={q.ID || q.id}>{q.Name || q.name}</li>)}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
