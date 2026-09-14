import { getClassOptions, userMatchesClass } from '../../domain/classes';

export default function ClassUserFilters({ users, classFilter, userId, onClassChange, onUserChange }) {
  const matchingUsers = users.filter(user => userMatchesClass(user, classFilter));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="class-filter" className="hive-label">Class</label>
        <select id="class-filter" className="hive-input" value={classFilter} onChange={event => onClassChange(event.target.value)}>
          <option value="all">All classes</option>
          {getClassOptions(users).map(name => <option key={name} value={name}>{name || 'Unassigned'}</option>)}
        </select>
      </div>
      <div><label htmlFor="user-filter" className="hive-label">User</label>
        <select id="user-filter" className="hive-input" value={userId} onChange={event => onUserChange(event.target.value)} disabled={!matchingUsers.length}>
          <option value="">{matchingUsers.length ? 'All users in this class' : 'No users in this class'}</option>
          {matchingUsers.map(user => <option key={user.uid || user.id} value={user.uid || user.id}>{user.displayName || user.email}{user.displayName && user.email ? ` (${user.email})` : ''}</option>)}
        </select>
      </div>
    </div>
  );
}
