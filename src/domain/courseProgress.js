export function splitCoursesByCompletion(items = []) {
  return items.reduce(
    (groups, item) => {
      const percentComplete = Number(item?.progress?.percentComplete || 0);
      const assignmentComplete = item?.assignment?.status === 'completed';
      if (percentComplete >= 100 || assignmentComplete) groups.completed.push(item);
      else groups.active.push(item);
      return groups;
    },
    { active: [], completed: [] },
  );
}
