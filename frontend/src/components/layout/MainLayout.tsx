import Sidebar from '../chat/Sidebar';
import ChatArea from '../chat/ChatArea';
import { ChatProvider } from '../../contexts/ChatContext';

export default function MainLayout() {
  return (
    <ChatProvider>
      <div className="h-screen flex overflow-hidden bg-ios-bg">
        <Sidebar />
        <ChatArea />
      </div>
    </ChatProvider>
  );
}