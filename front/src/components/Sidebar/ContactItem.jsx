import Avatar from '../Avatar/Avatar.jsx';
import StatusDot from '../StatusDot/StatusDot.jsx';
import './ContactItem.css';

export default function ContactItem({ contact, preview, time, unread, isActive, onClick }) {
  return (
    <div
      className={`convItem${isActive ? ' convItem-active' : ''}`}
      onClick={onClick}
    >
      <Avatar name={contact.name} src={contact.avatar} />
      <div className="convText">
        <div className="convName">
          <StatusDot status={contact.status || 'offline'} />
          <span className="convNameText">{contact.name}</span>
        </div>
        <div className="convPrev">{preview}</div>
      </div>
      <div className="convRight">
        <div className="convTime">{time}</div>
        {unread > 0 && (
          <span className="convBadge">{unread > 99 ? '99+' : unread}</span>
        )}
      </div>
    </div>
  );
}
