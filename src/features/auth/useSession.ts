import {useAppState} from '../../app/AppStateContext';

/** Supabase session state from the app hub. `authReady` is false until the first session lookup finishes. */
export function useSession() {
  const {session, authReady, userEmail} = useAppState();
  return {session, authReady, userEmail, isSignedIn: Boolean(session)};
}
