import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';

/** The assistant now lives in the floating chat widget. Old /assistant links open it on the home page. */
export default function Assistant() {
  const { ask } = useChat();
  useEffect(() => {
    ask();
  }, [ask]);
  return <Navigate to="/" replace />;
}
