import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markNotificationRead} from "../features/notifications/notificationSlice";
import type{ RootState, AppDispatch } from "../app/store";
import {socket} from "../socket";
import axios from "../api/axios";

const Notifications = () => {
const [filter, setFilter] = useState("all");
const [search, setSearch] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector(
  (state: RootState) => state.auth.userId
);
    console.log("Redux UserId:", userId);
  const [page, setPage]= useState(1);

  const { notifications, loading, error } = useSelector(
    (state: RootState) => state.notifications
  );

  useEffect(() => {
  socket.on("newNotification", (notification) => {
    console.log("New Notification", notification);

    alert(`New Notification: ${notification.title}`);

    dispatch(fetchNotifications({ userId: userId || 61, page }));
  });

  return () => {
    socket.off("newNotification");
  };
}, [dispatch, page, userId]);

  useEffect(() => {
    dispatch(fetchNotifications({ userId: userId || 61, page,}));
  }, [dispatch, page, userId]);

  if (loading)
  return (
    <div className="notification-contain">
      <h2>Loading Notifications...</h2>
    </div>
  );

  if (error) return <h2>{error}</h2>;
console.log(notifications);
const filteredNotifications = notifications.filter((notification) => {
  const matchesFilter =
    filter === "all"
      ? true
      : filter === "read"
      ? notification.is_read
      : !notification.is_read;

  const matchesSearch =
    notification.title
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    notification.message
      .toLowerCase()
      .includes(search.toLowerCase());

  return matchesFilter && matchesSearch;
});
const handleDelete = async (id: number) => {
  await axios.delete(`/notifications/${id}`);

  dispatch(fetchNotifications({ userId: userId || 61, page }));
};
  return (
    <div>
        <div>
            <input className="search-input"
  type="text"
  placeholder="Search notifications..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
    <div className="filter-group">
  <button  className="filter-btn" onClick={() => setFilter("all")}>All</button>
  <button  className="filter-btn" onClick={() => setFilter("read")}>Read</button>
  <button  className="filter-btn" onClick={() => setFilter("unread")}>Unread</button>
  </div>
</div>
      <h2 className="page-title">
    Notifications ({filteredNotifications.length})
</h2>
        {filteredNotifications.length === 0 ? (
  <p>No notifications found.</p>
) : (
      filteredNotifications.map((notification) => (
        <div key={notification.id} className="notification-card">
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <span
  className={
    notification.is_read
      ? "status-read"
      : "status-unread"
  }
>
  {notification.is_read ? "Read" : "Unread"}
</span>
          <>
  {!notification.is_read && (
    <button className="read-btn"
      onClick={() =>
        dispatch(markNotificationRead(notification.id))
      }
    >
      Mark as Read
    </button>
  )}

  <button className="delete-btn"
    onClick={() => {
  if (window.confirm("Delete notification?")) {
    handleDelete(notification.id);
  }
}}
  >
    Delete
  </button>
</>

        </div>
        ))
      )}
      <div className="pagination">
  <button className="page-btn"
    onClick={() => setPage(page - 1)}
    disabled={page === 1}
  >
    Previous
  </button>

  <span className="page-number">
  Page {page}
</span>

  <button className="page-btn"
  onClick={() => setPage(page + 1)}
  disabled={notifications.length < 5}
>
  Next
</button>
</div>
    </div>
  );
};

export default Notifications;