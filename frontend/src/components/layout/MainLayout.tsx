import Sidebar from '../chat/Sidebar';
import ChatArea from '../chat/ChatArea';
import { ChatProvider } from '../../contexts/ChatContext';

export default function MainLayout() {
  return (
    <ChatProvider>
      <div className="h-screen flex overflow-hidden" style={{ background: '#060b14' }}>
        <Sidebar />
        <ChatArea />
      </div>
    </ChatProvider>
  );
}