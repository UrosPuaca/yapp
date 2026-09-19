import ChatHeader from './ChatHeader.jsx';
import MessageThread from './MessageThread.jsx';
import MessageInput from './MessageInput.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import ReplyBar from '../Reply/ReplyBar.jsx';
import './ChatPanel.css';

/** Desna strana prozora: header aktivnog kontakta, poruke i input red. */
export default function ChatPanel({
  contact,
  thread,
  hasMore,
  onLoadOlder,
  draft,
  onDraftChange,
  onSend,
  onSendImage,
  onSendRich,
  typing,
  replyTo,
  onReply,
  onCancelReply,
  reactions,
  myUserId,
  onReact,
  onOpenContactProfile,
}) {
  return (
    <div className="chat">
      <ChatHeader contact={contact} onOpenProfile={onOpenContactProfile} />
      <MessageThread
        contactId={contact.id}
        thread={thread}
        hasMore={hasMore}
        onLoadOlder={onLoadOlder}
        contactName={contact.name}
        onReply={onReply}
        reactions={reactions}
        myUserId={myUserId}
        onReact={onReact}
      />
      {typing && <TypingIndicator name={contact.name} />}
      {replyTo && (
        <ReplyBar message={replyTo} contactName={contact.name} onCancel={onCancelReply} />
      )}
      <MessageInput
        draft={draft}
        onDraftChange={onDraftChange}
        onSend={onSend}
        onSendImage={onSendImage}
        onSendRich={onSendRich}
      />
    </div>
  );
}
