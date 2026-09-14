import { useContext } from 'react';
import { StudentViewContext } from '../context/StudentViewContext';
import { useAuth } from './useAuth';

export function useStudentView() {
  const auth = useAuth();
  const preview = useContext(StudentViewContext);
  return preview || { user: auth.user, profile: auth.profile, readOnly: false, basePath: '' };
}
